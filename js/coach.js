// js/coach.js
// Calls the Claude API directly from the browser using Anthropic's
// "anthropic-dangerous-direct-browser-access" header (bring-your-own-key
// pattern). The API key never leaves this device except to api.anthropic.com.

import { PROGRAM, DAY_LABELS } from "./program.js";
import { getWorkouts } from "./storage.js";

const PROFILE = `Athlete profile: male, 179cm, 69kg, training goal is hypertrophy and lean mass gain.
Training style: 5-day Push/Pull/Legs split, heavy compound lifting at 4-6 reps, accessories at 8-15 reps.
Constraint: no barbell bench press, dumbbell bench/incline only.`;

function fmtNum(n, d = 0) {
  return typeof n === "number" ? n.toFixed(d) : "n/a";
}

function summarizeRecentSessions(n = 4) {
  const all = getWorkouts();
  const recent = all.slice(-n);
  if (!recent.length) return "No logged sessions yet.";
  return recent
    .map((s) => {
      const dayLabel = DAY_LABELS[s.day_type] || s.day_type;
      const lines = (s.exercises || [])
        .map((e) => {
          const setStr = (e.sets || [])
            .map((st) => `${st.weight_kg ?? "?"}kg x${st.reps ?? "?"}`)
            .join(", ");
          return `    - ${e.name}: ${setStr}`;
        })
        .join("\n");
      return `  ${s.date} (${dayLabel}):\n${lines}`;
    })
    .join("\n");
}

export function buildCoachingPrompt({ whoopData, todayDayType }) {
  const recovery = whoopData?.recovery?.[0];
  const sleep = whoopData?.sleep?.[0];
  const cycle = whoopData?.cycles?.[0];
  const recoveryTrend = (whoopData?.recovery || [])
    .slice(0, 7)
    .map((r) => `${r.date?.slice(0, 10)}: ${r.recovery_score ?? "n/a"}`)
    .join(" | ");

  const todayPlan = PROGRAM[todayDayType];
  const planLines = todayPlan.exercises
    .map((e) => `  - ${e.name} (${e.type}): ${e.sets} sets x ${e.reps} reps`)
    .join("\n");

  return `You are my strength & conditioning coach. Use the data below to give me a short, direct readiness assessment and concrete guidance for today's session. Be specific about load/intensity adjustments, not generic advice.

${PROFILE}

Today's planned session: ${todayPlan.label} (${todayPlan.focus})
${planLines}

Latest WHOOP recovery: ${recovery ? `${recovery.recovery_score}% (HRV ${fmtNum(recovery.hrv_ms, 1)}ms, RHR ${recovery.resting_hr}bpm)` : "no data"}
7-day recovery trend (date: score): ${recoveryTrend || "no data"}
Last night's sleep: ${sleep ? `${fmtNum(sleep.performance_pct)}% performance, ${fmtNum(sleep.total_in_bed_hrs, 1)}h in bed, ${fmtNum(sleep.deep_hrs, 1)}h deep, ${fmtNum(sleep.rem_hrs, 1)}h REM` : "no data"}
Yesterday's strain: ${cycle ? fmtNum(cycle.strain, 1) : "no data"}

Recent logged sessions (most recent last):
${summarizeRecentSessions()}

Give me:
1. A one-line readiness verdict (push as planned / pull back / prioritize recovery).
2. Specific weight/rep adjustments for today's compound lifts vs my last session for each, if I should change anything.
3. Any flags from the WHOOP trend worth noting.
Keep it tight, no filler.`;
}

export async function askCoach({ apiKey, prompt, model = "claude-sonnet-4-6" }) {
  if (!apiKey) throw new Error("No Anthropic API key set. Add one in Settings.");
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model,
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Claude API error (${res.status}): ${text}`);
  }
  const json = await res.json();
  return json.content?.map((c) => c.text).join("\n") ?? "(no response)";
}
