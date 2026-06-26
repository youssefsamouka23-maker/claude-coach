// scripts/sync-whoop.mjs
//
// Runs inside GitHub Actions (server-side, never in the browser).
// 1. Refreshes the WHOOP OAuth token (rotates the stored refresh token secret).
// 2. Pulls recovery / cycle(strain) / sleep / workout collections.
// 3. Builds a compact JSON summary for the dashboard.
// 4. Encrypts it (AES-256-GCM, PBKDF2-derived key) with DATA_PASSPHRASE.
// 5. Writes data/whoop-latest.enc.json (committed by the workflow step after this script runs).
// 6. Updates the WHOOP_REFRESH_TOKEN repo secret with the freshly rotated value via `gh secret set`.

import crypto from "node:crypto";
import fs from "node:fs";
import { execSync } from "node:child_process";

const {
  WHOOP_CLIENT_ID,
  WHOOP_CLIENT_SECRET,
  WHOOP_REFRESH_TOKEN,
  DATA_PASSPHRASE,
} = process.env;

const API = "https://api.prod.whoop.com/developer";
const TOKEN_URL = "https://api.prod.whoop.com/oauth/oauth2/token";

function requireEnv(name, value) {
  if (!value) {
    console.error(`Missing required secret/env var: ${name}`);
    process.exit(1);
  }
}
requireEnv("WHOOP_CLIENT_ID", WHOOP_CLIENT_ID);
requireEnv("WHOOP_CLIENT_SECRET", WHOOP_CLIENT_SECRET);
requireEnv("WHOOP_REFRESH_TOKEN", WHOOP_REFRESH_TOKEN);
requireEnv("DATA_PASSPHRASE", DATA_PASSPHRASE);

async function refreshTokens() {
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: WHOOP_CLIENT_ID,
    client_secret: WHOOP_CLIENT_SECRET,
    scope: "offline",
    refresh_token: WHOOP_REFRESH_TOKEN,
  });
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`WHOOP token refresh failed (${res.status}): ${text}`);
  }
  return res.json(); // { access_token, refresh_token, expires_in, scope, token_type }
}

async function whoopGet(accessToken, path, params = {}) {
  const url = new URL(API + path);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) url.searchParams.set(k, v);
  }
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GET ${path} failed (${res.status}): ${text}`);
  }
  return res.json();
}

function encrypt(jsonString, passphrase) {
  const salt = crypto.randomBytes(16);
  const iv = crypto.randomBytes(12);
  const key = crypto.pbkdf2Sync(passphrase, salt, 210000, 32, "sha256");
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(jsonString, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  // Append authTag to ciphertext so the browser side (Web Crypto AES-GCM)
  // can use one combined buffer, matching how SubtleCrypto expects it.
  const combined = Buffer.concat([ciphertext, authTag]);
  return {
    version: 1,
    salt: salt.toString("base64"),
    iv: iv.toString("base64"),
    ciphertext: combined.toString("base64"),
  };
}

function summarizeRecovery(records) {
  return records
    .filter((r) => r.score_state === "SCORED")
    .map((r) => ({
      cycle_id: r.cycle_id,
      date: r.created_at,
      recovery_score: r.score?.recovery_score ?? null,
      hrv_ms: r.score?.hrv_rmssd_milli ?? null,
      resting_hr: r.score?.resting_heart_rate ?? null,
      spo2: r.score?.spo2_percentage ?? null,
      skin_temp_c: r.score?.skin_temp_celsius ?? null,
    }));
}

function summarizeCycles(records) {
  return records
    .filter((r) => r.score_state === "SCORED")
    .map((r) => ({
      cycle_id: r.id,
      start: r.start,
      end: r.end,
      strain: r.score?.strain ?? null,
      avg_hr: r.score?.average_heart_rate ?? null,
      max_hr: r.score?.max_heart_rate ?? null,
      kilojoule: r.score?.kilojoule ?? null,
    }));
}

function summarizeSleep(records) {
  return records
    .filter((r) => r.score_state === "SCORED" && !r.nap)
    .map((r) => {
      const s = r.score?.stage_summary ?? {};
      const toHrs = (ms) => (ms ? +(ms / 3600000).toFixed(2) : 0);
      return {
        sleep_id: r.id,
        start: r.start,
        end: r.end,
        performance_pct: r.score?.sleep_performance_percentage ?? null,
        efficiency_pct: r.score?.sleep_efficiency_percentage ?? null,
        consistency_pct: r.score?.sleep_consistency_percentage ?? null,
        respiratory_rate: r.score?.respiratory_rate ?? null,
        total_in_bed_hrs: toHrs(s.total_in_bed_time_milli),
        awake_hrs: toHrs(s.total_awake_time_milli),
        light_hrs: toHrs(s.total_light_sleep_time_milli),
        deep_hrs: toHrs(s.total_slow_wave_sleep_time_milli),
        rem_hrs: toHrs(s.total_rem_sleep_time_milli),
        disturbances: s.disturbance_count ?? null,
      };
    });
}

function summarizeWorkouts(records) {
  return records
    .filter((r) => r.score_state === "SCORED")
    .map((r) => ({
      workout_id: r.id,
      start: r.start,
      end: r.end,
      sport_name: r.sport_name,
      strain: r.score?.strain ?? null,
      avg_hr: r.score?.average_heart_rate ?? null,
      max_hr: r.score?.max_heart_rate ?? null,
      kilojoule: r.score?.kilojoule ?? null,
      distance_m: r.score?.distance_meter ?? null,
    }));
}

async function main() {
  const tokens = await refreshTokens();
  const accessToken = tokens.access_token;
  const newRefreshToken = tokens.refresh_token;

  const [recovery, cycles, sleep, workouts, bodyMeasurement] =
    await Promise.all([
      whoopGet(accessToken, "/v2/recovery", { limit: 25 }),
      whoopGet(accessToken, "/v2/cycle", { limit: 25 }),
      whoopGet(accessToken, "/v2/activity/sleep", { limit: 14 }),
      whoopGet(accessToken, "/v2/activity/workout", { limit: 25 }),
      whoopGet(accessToken, "/v2/user/measurement/body").catch(() => null),
    ]);

  const summary = {
    synced_at: new Date().toISOString(),
    body_measurement: bodyMeasurement,
    recovery: summarizeRecovery(recovery.records ?? []),
    cycles: summarizeCycles(cycles.records ?? []),
    sleep: summarizeSleep(sleep.records ?? []),
    workouts: summarizeWorkouts(workouts.records ?? []),
  };

  const encrypted = encrypt(JSON.stringify(summary), DATA_PASSPHRASE);
  encrypted.updated_at = summary.synced_at;

  fs.mkdirSync("data", { recursive: true });
  fs.writeFileSync(
    "data/whoop-latest.enc.json",
    JSON.stringify(encrypted, null, 2)
  );
  console.log("Wrote encrypted snapshot, synced_at:", summary.synced_at);

  // Rotate the refresh token secret if WHOOP issued a new one.
  if (newRefreshToken && newRefreshToken !== WHOOP_REFRESH_TOKEN) {
    try {
      execSync(`gh secret set WHOOP_REFRESH_TOKEN --body "${newRefreshToken}"`, {
        stdio: "inherit",
        shell: "/bin/bash",
      });
      console.log("Rotated WHOOP_REFRESH_TOKEN secret.");
    } catch (err) {
      console.error("Failed to rotate refresh token secret:", err.message);
      process.exit(1);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
