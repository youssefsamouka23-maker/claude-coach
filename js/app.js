import { PROGRAM, DAY_ORDER, DAY_LABELS, nextDayType } from "./program.js?v=20260626c";
import {
  getSettings,
  saveSettings,
  getWorkouts,
  saveWorkout,
  getLastSessionForDayType,
  getExerciseHistory,
  listAllExerciseNames,
} from "./storage.js?v=20260626c";
import { loadWhoopData, latestRecovery, latestSleep, latestCycle, recentWorkouts } from "./whoop.js?v=20260626c";
import { recoveryRingSVG, strainGaugeSVG, sleepBreakdownHTML } from "./widgets.js?v=20260626c";
import { buildCoachingPrompt, askCoach } from "./coach.js?v=20260626c";

const state = {
  whoopData: null,
  whoopError: null,
  todayDayType: null,
  currentSessionId: null,
};

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

// ---------------------------------------------------------------- Tabs

function setupTabs() {
  $$(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      $$(".tab-btn").forEach((b) => b.classList.remove("active"));
      $$(".tab-panel").forEach((p) => p.classList.remove("active"));
      btn.classList.add("active");
      $(`#tab-${btn.dataset.tab}`).classList.add("active");
    });
  });
}

// ---------------------------------------------------------------- Dashboard

async function ensureWhoopData() {
  const { dataPassphrase } = getSettings();
  if (!dataPassphrase) {
    state.whoopError = "Enter your data passphrase in Settings to unlock WHOOP data.";
    return null;
  }
  try {
    state.whoopData = await loadWhoopData(dataPassphrase);
    state.whoopError = null;
    return state.whoopData;
  } catch (err) {
    state.whoopError = err.message;
    return null;
  }
}

function renderDashboard() {
  const root = $("#tab-dashboard");
  if (state.whoopError) {
    root.innerHTML = `<div class="card error">${state.whoopError}</div>`;
    return;
  }
  const data = state.whoopData;
  if (!data) {
    root.innerHTML = `<div class="card">Loading WHOOP data...</div>`;
    return;
  }
  const recovery = latestRecovery(data);
  const sleep = latestSleep(data);
  const cycle = latestCycle(data);
  const workouts = recentWorkouts(data, 6);

  root.innerHTML = `
    <div class="card center">
      <div class="card-title">Recovery</div>
      ${recoveryRingSVG(recovery?.recovery_score)}
      <div class="sub">HRV ${recovery?.hrv_ms?.toFixed(1) ?? "--"}ms · RHR ${recovery?.resting_hr ?? "--"}bpm</div>
    </div>

    <div class="card center">
      <div class="card-title">Strain (last cycle)</div>
      ${strainGaugeSVG(cycle?.strain)}
    </div>

    <div class="card">
      <div class="card-title">Last Night's Sleep</div>
      ${sleepBreakdownHTML(sleep)}
    </div>

    <div class="card">
      <div class="card-title">Recent Workouts (WHOOP)</div>
      ${
        workouts.length
          ? `<ul class="list">${workouts
              .map(
                (w) =>
                  `<li><span>${w.sport_name}</span><span>${w.strain?.toFixed(1) ?? "--"} strain</span><span class="muted">${w.start?.slice(0, 10)}</span></li>`
              )
              .join("")}</ul>`
          : `<p class="muted">No recent workouts.</p>`
      }
    </div>

    <div class="card">
      <div class="card-title">Synced</div>
      <p class="muted">${data.updated_at ? new Date(data.updated_at).toLocaleString() : "unknown"}</p>
    </div>
  `;
}

// ---------------------------------------------------------------- Today / logger

function renderToday() {
  const root = $("#tab-today");
  const history = getWorkouts();
  if (!state.todayDayType) state.todayDayType = nextDayType(history);

  const dayType = state.todayDayType;
  const plan = PROGRAM[dayType];
  const last = getLastSessionForDayType(dayType);

  const daySelector = `
    <select id="day-select">
      ${DAY_ORDER.map(
        (d) => `<option value="${d}" ${d === dayType ? "selected" : ""}>${DAY_LABELS[d]}</option>`
      ).join("")}
    </select>`;

  const exerciseRows = plan.exercises
    .map((ex, i) => {
      const lastEx = last?.exercises?.find((e) => e.name === ex.name);
      const lastStr = lastEx?.sets?.length
        ? lastEx.sets.map((s) => `${s.weight_kg}kg×${s.reps}`).join(", ")
        : "no previous data";
      const setRows = Array.from({ length: ex.sets })
        .map((_, si) => {
          const prevSet = lastEx?.sets?.[si];
          return `
          <div class="set-row" data-ex="${i}" data-set="${si}">
            <span class="set-num">${si + 1}</span>
            <input type="number" inputmode="decimal" placeholder="${prevSet?.weight_kg ?? "kg"}" class="weight-input" />
            <span class="x">×</span>
            <input type="number" inputmode="numeric" placeholder="${prevSet?.reps ?? "reps"}" class="reps-input" />
          </div>`;
        })
        .join("");
      return `
        <div class="exercise-block" data-exercise-name="${ex.name}">
          <div class="exercise-head">
            <div>
              <div class="exercise-name">${ex.name}</div>
              <div class="muted small">${ex.type} · target ${ex.reps} reps</div>
            </div>
          </div>
          <div class="muted small">Last time: ${lastStr}</div>
          <div class="sets">${setRows}</div>
        </div>`;
    })
    .join("");

  root.innerHTML = `
    <div class="card">
      <div class="card-title-row">
        <div class="card-title">${plan.label} <span class="muted small">${plan.focus}</span></div>
        ${daySelector}
      </div>
    </div>
    ${exerciseRows}
    <button id="save-workout-btn" class="primary-btn">Save Workout</button>
    <div id="save-status" class="muted small center"></div>
  `;

  $("#day-select").addEventListener("change", (e) => {
    state.todayDayType = e.target.value;
    renderToday();
  });

  $("#save-workout-btn").addEventListener("click", () => saveTodayWorkout(dayType, plan));
}

function saveTodayWorkout(dayType, plan) {
  const blocks = $$(".exercise-block");
  const exercises = blocks.map((block) => {
    const name = block.dataset.exerciseName;
    const sets = $$(".set-row", block)
      .map((row) => {
        const weight = row.querySelector(".weight-input").value;
        const reps = row.querySelector(".reps-input").value;
        if (!weight && !reps) return null;
        return { weight_kg: weight ? Number(weight) : null, reps: reps ? Number(reps) : null };
      })
      .filter(Boolean);
    return { name, sets };
  });

  const loggedExercises = exercises.filter((e) => e.sets.length > 0);
  if (loggedExercises.length === 0) {
    $("#save-status").textContent = "Nothing logged yet — enter at least one set.";
    return;
  }

  const session = {
    id: state.currentSessionId || `${Date.now()}`,
    date: new Date().toISOString().slice(0, 10),
    day_type: dayType,
    exercises: loggedExercises,
  };
  state.currentSessionId = session.id;
  saveWorkout(session);
  $("#save-status").textContent = `Saved ${plan.label} — ${loggedExercises.length} exercises logged.`;
  renderProgress();
}

// ---------------------------------------------------------------- Progress / charts

let progressChart = null;

function renderProgress() {
  const root = $("#tab-progress");
  const names = listAllExerciseNames();
  if (!names.length) {
    root.innerHTML = `<div class="card">Log a workout to start tracking strength progression.</div>`;
    return;
  }
  root.innerHTML = `
    <div class="card">
      <div class="card-title">Strength Progression</div>
      <select id="exercise-select">
        ${names.map((n) => `<option value="${n}">${n}</option>`).join("")}
      </select>
      <canvas id="progress-canvas" height="220"></canvas>
    </div>
  `;
  const select = $("#exercise-select");
  select.addEventListener("change", () => drawProgressChart(select.value));
  drawProgressChart(names[0]);
}

function drawProgressChart(exerciseName) {
  const points = getExerciseHistory(exerciseName);
  const ctx = $("#progress-canvas").getContext("2d");
  if (progressChart) progressChart.destroy();
  progressChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: points.map((p) => p.date),
      datasets: [
        {
          label: "Top set weight (kg)",
          data: points.map((p) => p.weight_kg),
          borderColor: "#16c172",
          backgroundColor: "rgba(22,193,114,0.15)",
          tension: 0.25,
          fill: true,
          pointRadius: 4,
        },
      ],
    },
    options: {
      plugins: { legend: { labels: { color: "#f5f5f7" } } },
      scales: {
        x: { ticks: { color: "#9a9aa2" }, grid: { color: "#26262b" } },
        y: { ticks: { color: "#9a9aa2" }, grid: { color: "#26262b" } },
      },
    },
  });
}

// ---------------------------------------------------------------- Coach

function renderCoach() {
  const root = $("#tab-coach");
  root.innerHTML = `
    <div class="card">
      <div class="card-title">Ask Your Coach</div>
      <p class="muted small">Builds a prompt from your latest WHOOP data, today's planned session, and recent logged workouts, then sends it to Claude.</p>
      <button id="ask-coach-btn" class="primary-btn">Get Today's Coaching</button>
      <div id="coach-output" class="coach-output"></div>
    </div>
  `;
  $("#ask-coach-btn").addEventListener("click", runCoach);
}

async function runCoach() {
  const out = $("#coach-output");
  const { anthropicApiKey } = getSettings();
  if (!anthropicApiKey) {
    out.innerHTML = `<p class="error">Add your Anthropic API key in Settings first.</p>`;
    return;
  }
  out.innerHTML = `<p class="muted">Thinking...</p>`;
  try {
    const data = state.whoopData || (await ensureWhoopData());
    const todayDayType = state.todayDayType || nextDayType(getWorkouts());
    const prompt = buildCoachingPrompt({ whoopData: data, todayDayType });
    const reply = await askCoach({ apiKey: anthropicApiKey, prompt });
    out.innerHTML = `<pre class="coach-text">${reply.replace(/</g, "&lt;")}</pre>`;
  } catch (err) {
    out.innerHTML = `<p class="error">${err.message}</p>`;
  }
}

// ---------------------------------------------------------------- Settings

function renderSettings() {
  const root = $("#tab-settings");
  const s = getSettings();
  const noAssistAttrs = `autocomplete="off" autocapitalize="none" autocorrect="off" spellcheck="false"`;
  root.innerHTML = `
    <div class="card">
      <div class="card-title">Data Passphrase</div>
      <p class="muted small">Decrypts the WHOOP snapshot synced by GitHub Actions. Set once, stored only on this device.</p>
      <div class="pw-row">
        <input id="passphrase-input" type="password" placeholder="Passphrase" value="${s.dataPassphrase ?? ""}" ${noAssistAttrs} />
        <button type="button" class="show-toggle" data-target="passphrase-input">show</button>
      </div>
    </div>
    <div class="card">
      <div class="card-title">Anthropic API Key</div>
      <p class="muted small">Used to call Claude directly from this browser. Stored only on this device.</p>
      <div class="pw-row">
        <input id="apikey-input" type="password" placeholder="sk-ant-..." value="${s.anthropicApiKey ?? ""}" ${noAssistAttrs} />
        <button type="button" class="show-toggle" data-target="apikey-input">show</button>
      </div>
    </div>
    <button id="save-settings-btn" class="primary-btn">Save Settings</button>
    <div id="settings-status" class="muted small center"></div>
  `;
  $$(".show-toggle").forEach((btn) => {
    btn.addEventListener("click", () => {
      const input = document.getElementById(btn.dataset.target);
      const isPw = input.type === "password";
      input.type = isPw ? "text" : "password";
      btn.textContent = isPw ? "hide" : "show";
    });
  });
  $("#save-settings-btn").addEventListener("click", async () => {
    saveSettings({
      dataPassphrase: $("#passphrase-input").value,
      anthropicApiKey: $("#apikey-input").value,
    });
    $("#settings-status").textContent = "Saved.";
    await ensureWhoopData();
    renderDashboard();
  });
}

// ---------------------------------------------------------------- Boot

async function boot() {
  setupTabs();
  renderSettings();
  renderCoach();
  renderToday();
  renderProgress();
  renderDashboard();
  await ensureWhoopData();
  renderDashboard();
}

boot();
