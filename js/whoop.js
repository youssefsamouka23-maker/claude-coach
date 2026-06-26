// js/whoop.js
import { decryptWhoopBlob } from "./crypto.js?v=20260626e";

let cached = null;

export async function loadWhoopData(passphrase, { force = false } = {}) {
  if (cached && !force) return cached;
  const res = await fetch(`./data/whoop-latest.enc.json?t=${Date.now()}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(
      "Could not fetch data/whoop-latest.enc.json. Has the Sync WHOOP data workflow run yet?"
    );
  }
  const blob = await res.json();
  const data = await decryptWhoopBlob(blob, passphrase);
  data.updated_at = blob.updated_at;
  cached = data;
  return data;
}

export function clearWhoopCache() {
  cached = null;
}

// --- Convenience accessors -------------------------------------------------

export function latestRecovery(data) {
  if (!data?.recovery?.length) return null;
  return data.recovery[0];
}

export function recoveryTrend(data, days = 7) {
  return (data?.recovery || []).slice(0, days).reverse();
}

export function latestSleep(data) {
  if (!data?.sleep?.length) return null;
  return data.sleep[0];
}

export function latestCycle(data) {
  if (!data?.cycles?.length) return null;
  return data.cycles[0];
}

export function recentWorkouts(data, n = 10) {
  return (data?.workouts || []).slice(0, n);
}
