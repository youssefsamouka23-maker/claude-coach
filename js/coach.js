// js/coach.js
// Calls the Claude API directly from the browser using Anthropic's
// "anthropic-dangerous-direct-browser-access" header (bring-your-own-key
// pattern). The API key never leaves this device except to api.anthropic.com.
// The coach is a real back-and-forth chat: each call sends the full message
// history, and the system prompt instructs Claude to ask about goals,
// soreness, schedule, and motivation before prescribing anything.

import { PROGRAM, DAY_LABELS } from "./program.js";
import { getWorkouts } from "./storage.js";

const PROFILE = `Athlete profile: male, 179cm, 69kg, training goal is hypertrophy and lean mass gain.
Training style: 6-day hypertrophy split (Push 1 / Pull 1 / Legs 1 / Rest / Push 2 / Pull 2 / Legs 2), heavy compound lifting at 6-10 reps, accessories at 10-15 reps.
Constraint: no barbell bench press, dumbbell bench/incline only.`;

const SYSTEM_PROMPT = `You are my personal strength & conditioning coach, talking to me in a chat inside my own training app. You have access to my WHOOP recovery/sleep/strain data, my training program, and my logged workout history, which is included in the first message of this conversation.

How to coach me:
- Don't just dump a generic readiness report. Treat this like a real conversation with a coach who actually knows me.
- Before giving firm prescriptions (specific weights, whether to push or pull back, deload calls), ask me about anything the data alone can't tell you: how I'm actually feeling, soreness, sleep quality beyond the score, stress, motivation, time available today, or any change in my goals. Don't hesitate to ask follow-up questions — it's fine to ask before you advise.
- Once you have enough context (either I've answered your questions, or I've told you to just go ahead), give concrete, specific guidance: actual weight/rep adjustments vs my last session, not vague advice like "listen to your body."
- Keep replies short and conversational, like text messages from a coach — a few sentences or a short list, not an essay. Save the long structured breakdown for when I actually ask for a full session plan.
- If my goals or constraints seem to have changed based on what I say, take that seriously and adapt your advice instead of defaulting back to the profile below.`;

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

// Builds the first message of the conversation: a data dump the coach can
// reference, ending with an invitation to ask me anything before advising.
export function buildCoachingContext({ whoopData, todayDayType }) {
  const recovery = whoopData?.recovery?.[0];
  const sleep = whoopData?.sleep?.[0];
  const cycle = whoopData?.cycles?.[0];
  const recoveryTrend = (whoopData?.recovery || [])
    .slice(0, 7)
    .map((r) => `${r.date?.slice(0, 10)}: ${r.recovery_score ?? "n/a"}`)
    .join(" | ");

  const todayPlan = PROGRAM[todayDayType];
  const isRest = !todayPlan.exercises.length;
  const planLines = isRest
    ? "  Rest day — no session scheduled."
    : todayPlan.exercises.map((e) => `  - ${e.name} (${e.type}): ${e.sets} sets x ${e.reps} reps`).join("\n");

  return `${PROFILE}

Today's planned session: ${todayPlan.label} (${todayPlan.focus})
${planLines}

Latest WHOOP recovery: ${recovery ? `${recovery.recovery_score}% (HRV ${fmtNum(recovery.hrv_ms, 1)}ms, RHR ${recovery.resting_hr}bpm)` : "no data"}
7-day recovery trend (date: score): ${recoveryTrend || "no data"}
Last night's sleep: ${sleep ? `${fmtNum(sleep.performance_pct)}% performance, ${fmtNum(sleep.total_in_bed_hrs, 1)}h in bed, ${fmtNum(sleep.deep_hrs, 1)}h deep, ${fmtNum(sleep.rem_hrs, 1)}h REM` : "no data"}
Yesterday's strain: ${cycle ? fmtNum(cycle.strain, 1) : "no data"}

Recent logged sessions (most recent last):
${summarizeRecentSessions()}

That's my data for today. Coach me — ask me anything you need to before giving advice.`;
}

export async function askCoach({ apiKey, messages, system = SYSTEM_PROMPT, model = "claude-sonnet-4-6" }) {
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
      system,
      messages,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Claude API error (${res.status}): ${text}`);
  }
  const json = await res.json();
  return json.content?.map((c) => c.text).join("\n") ?? "(no response)";
}
