import { PROGRAM, DAY_ORDER, DAY_LABELS, nextDayType } from "./program.js?v=20260626d";
import {
  getSettings,
  saveSettings,
  getWorkouts,
  saveWorkout,
  getLastSessionForDayType,
  getExerciseHistory,
  listAllExerciseNames,
} from "./storage.js?v=20260626d";
import { loadWhoopData, latestRecovery, latestSleep, latestCycle, recentWorkouts } from "./whoop.js?v=20260626d";
import { recoveryRingSVG, strainGaugeSVG, sleepBreakdownHTML } from "./widgets.js?v=20260626d";
import { buildCoachingPrompt, askCoach } from "./coach.js?v=20260626d";
import { icon, icons } from "./icons.js?v=20260626d";

const state = {
  whoopData: null,
  whoopError: null,
  todayDayType: null,
  progressExercise: null,
};

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

// ---------------------------------------------------------------- Helpers

function escapeHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
function escapeAttr(str) {
  return escapeHtml(str).replace(/"/g, "&quot;");
}
function greeting() {
  const h = new Date().getHours();
  if (h < 5) return "Still up?";
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}
function todayDateLabel() {
  return new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
}
function formatShortDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
function timeAgo(iso) {
  if (!iso) return null;
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  return `${days}d ago`;
}
function emptyState({ iconName = "moon", title, sub }) {
  return `
    <div class="card empty-state">
      <span class="icon" style="width:30px;height:30px;">${icons[iconName] || ""}</span>
      <div class="empty-title">${escapeHtml(title)}</div>
      ${sub ? `<div class="empty-sub">${escapeHtml(sub)}</div>` : ""}
    </div>`;
}

function showToast(message, type = "ok", timeout = 2600) {
  const stack = document.getElementById("toast-stack");
  if (!stack) return;
  const el = document.createElement("div");
  el.className = `toast ${type}`;
  el.innerHTML = `${icon(type === "bad" ? "alert" : "check")}<span>${escapeHtml(message)}</span>`;
  stack.appendChild(el);
  setTimeout(() => {
    el.classList.add("leaving");
    setTimeout(() => el.remove(), 220);
  }, timeout);
}

// ---------------------------------------------------------------- Shell (topbar / nav / tabs)

const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard", iconName: "dashboard" },
  { key: "today", label: "Today", iconName: "today" },
  { key: "progress", label: "Progress", iconName: "progress" },
  { key: "coach", label: "Coach", iconName: "coach" },
  { key: "settings", label: "Settings", iconName: "settings" },
];

function renderTopbar() {
  $("#topbar").innerHTML = `
    <div class="brand-row">
      <span class="brand-mark">${icon("sparkle")}</span>
      <span class="brand">Claude Coach</span>
    </div>
    <button type="button" class="icon-btn" id="topbar-settings-btn" aria-label="Settings">${icon("settings")}</button>
  `;
  $("#topbar-settings-btn").addEventListener("click", () => switchTab("settings"));
}

function renderNavShell() {
  $("#bottom-nav").innerHTML = NAV_ITEMS.map(
    (item) => `
    <button type="button" class="tab-btn${item.key === "dashboard" ? " active" : ""}" data-tab="${item.key}">
      <span class="icon">${icons[item.iconName] || ""}</span>
      <span>${item.label}</span>
    </button>`
  ).join("");
}

function switchTab(name) {
  $$(".tab-btn").forEach((b) => b.classList.toggle("active", b.dataset.tab === name));
  $$(".tab-panel").forEach((p) => p.classList.toggle("active", p.id === `tab-${name}`));
  window.scrollTo(0, 0);
}

function setupTabs() {
  $("#bottom-nav").addEventListener("click", (e) => {
    const btn = e.target.closest(".tab-btn");
    if (!btn) return;
    switchTab(btn.dataset.tab);
  });
}

// ---------------------------------------------------------------- WHOOP data

async function ensureWhoopData(force = false) {
  const { dataPassphrase } = getSettings();
  if (!dataPassphrase) {
    state.whoopError = "Enter your data passphrase in Settings to unlock WHOOP data.";
    state.whoopData = null;
    return null;
  }
  try {
    state.whoopData = await loadWhoopData(dataPassphrase, { force });
    state.whoopError = null;
    return state.whoopData;
  } catch (err) {
    state.whoopError = err.message;
    state.whoopData = null;
    return null;
  }
}

// ---------------------------------------------------------------- Dashboard

function dashboardHeader() {
  return `
    <div class="screen-head">
      <div>
        <div class="greeting">${greeting()}</div>
        <div class="date-line">${todayDateLabel()}</div>
      </div>
      <button type="button" class="icon-btn" id="dash-refresh-btn" aria-label="Refresh WHOOP data">${icon("refresh")}</button>
    </div>`;
}

function bindDashRefresh() {
  const btn = $("#dash-refresh-btn");
  if (!btn) return;
  btn.addEventListener("click", async () => {
    if (btn.classList.contains("spinning")) return;
    btn.classList.add("spinning");
    await ensureWhoopData(true);
    renderDashboard();
    renderWhoopStatus();
    if (state.whoopError) showToast(state.whoopError, "bad");
    else showToast("WHOOP data refreshed", "ok");
  });
}

function renderDashboard() {
  const root = $("#tab-dashboard");
  if (!root) return;

  if (state.whoopError) {
    root.innerHTML =
      dashboardHeader() +
      emptyState({
        iconName: "alert",
        title: "Couldn't load WHOOP data",
        sub: state.whoopError,
      });
    bindDashRefresh();
    return;
  }

  if (!state.whoopData) {
    root.innerHTML =
      dashboardHeader() +
      `
      <div class="card hero-card">
        <div class="skeleton skeleton-ring"></div>
        <div class="hero-stats">
          <div class="stat-chip"><div class="skeleton skeleton-line" style="width:100%"></div></div>
          <div class="stat-chip"><div class="skeleton skeleton-line" style="width:100%"></div></div>
        </div>
      </div>
      <div class="card"><div class="skeleton skeleton-line" style="width:40%"></div><div class="skeleton" style="height:60px;border-radius:14px;"></div></div>
      <div class="card"><div class="skeleton skeleton-line" style="width:55%"></div><div class="skeleton" style="height:40px;border-radius:14px;"></div></div>
    `;
    bindDashRefresh();
    return;
  }

  const data = state.whoopData;
  const recovery = latestRecovery(data);
  const sleep = latestSleep(data);
  const cycle = latestCycle(data);
  const workouts = recentWorkouts(data, 6);

  const workoutsHtml = workouts.length
    ? `<ul class="list workout-list">${workouts
        .map(
          (w) => `
        <li class="workout-row">
          <span class="workout-icon">${icon("dumbbell")}</span>
          <span class="workout-main">
            <div class="workout-name">${escapeHtml(w.sport_name || "Workout")}</div>
            <div class="workout-date">${formatShortDate(w.start)}</div>
          </span>
          <span class="workout-strain">${w.strain != null ? w.strain.toFixed(1) : "--"}<span class="unit">strain</span></span>
        </li>`
        )
        .join("")}</ul>`
    : `<div class="empty-state"><span class="icon" style="width:26px;height:26px;">${icons.dumbbell}</span><div class="empty-title">No recent workouts</div><div class="empty-sub">Logged WHOOP activities will show up here.</div></div>`;

  const synced = data.updated_at ? timeAgo(data.updated_at) : null;
  const syncClass = !data.updated_at
    ? "bad"
    : Date.now() - new Date(data.updated_at).getTime() > 24 * 3600 * 1000
      ? "stale"
      : "";

  root.innerHTML =
    dashboardHeader() +
    `
    <div class="card hero-card">
      <div class="hero-ring">${recoveryRingSVG(recovery?.recovery_score)}</div>
      <div class="hero-stats">
        <div class="stat-chip">
          <span class="icon">${icons.heart}</span>
          <div><div class="stat-value">${recovery?.hrv_ms != null ? recovery.hrv_ms.toFixed(0) : "--"} <span style="font-size:11px;font-weight:600;color:var(--text-2);">ms</span></div><div class="stat-label">HRV</div></div>
        </div>
        <div class="stat-chip">
          <span class="icon">${icons.bolt}</span>
          <div><div class="stat-value">${recovery?.resting_hr ?? "--"} <span style="font-size:11px;font-weight:600;color:var(--text-2);">bpm</span></div><div class="stat-label">RHR</div></div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-title-row">
        <div class="card-title">${icon("flame")} Strain</div>
        <span class="muted small">last cycle</span>
      </div>
      ${strainGaugeSVG(cycle?.strain)}
    </div>

    <div class="card">
      <div class="card-title">${icon("moon")} Last Night's Sleep</div>
      ${sleepBreakdownHTML(sleep)}
    </div>

    <div class="card">
      <div class="card-title">${icon("dumbbell")} Recent Workouts</div>
      ${workoutsHtml}
    </div>

    ${synced ? `<div class="sync-footer"><span class="sync-dot ${syncClass}"></span>Synced ${synced}</div>` : ""}
  `;
  bindDashRefresh();
}

// ---------------------------------------------------------------- Today / logger

function setupTodayLiveUpdates(root) {
  root.addEventListener("input", (e) => {
    const row = e.target.closest(".set-row");
    if (!row) return;
    updateSetRowStatus(row);
    const block = row.closest(".exercise-block");
    if (block) updateExerciseDoneState(block);
    updatePlanProgress(root);
  });
}

function isSetFilled(row) {
  const w = row.querySelector(".weight-input").value;
  const r = row.querySelector(".reps-input").value;
  return w !== "" && r !== "";
}

function updateSetRowStatus(row) {
  const status = row.querySelector(".set-status");
  if (status) status.classList.toggle("filled", isSetFilled(row));
}

function updateExerciseDoneState(block) {
  const rows = $$(".set-row", block);
  const anyFilled = rows.some(isSetFilled);
  block.classList.toggle("done", anyFilled);
  const badge = block.querySelector(".exercise-done-badge");
  if (badge) badge.classList.toggle("hidden", !anyFilled);
}

function updatePlanProgress(root) {
  const blocks = $$(".exercise-block", root);
  const done = blocks.filter((b) => b.classList.contains("done")).length;
  const fill = $("#plan-progress-fill", root);
  const count = $("#plan-progress-count", root);
  if (fill) fill.style.width = `${blocks.length ? (done / blocks.length) * 100 : 0}%`;
  if (count) count.textContent = `${done}/${blocks.length} exercises logged`;
}

function renderToday() {
  const root = $("#tab-today");
  if (!root) return;
  const history = getWorkouts();
  if (!state.todayDayType) state.todayDayType = nextDayType(history);

  const dayType = state.todayDayType;
  const plan = PROGRAM[dayType];
  const last = getLastSessionForDayType(dayType);

  const dayPillsHtml = DAY_ORDER.map(
    (d) => `<button type="button" class="day-pill${d === dayType ? " active" : ""}" data-day="${d}">${DAY_LABELS[d]}</button>`
  ).join("");

  const exerciseRows = plan.exercises
    .map((ex, i) => {
      const lastEx = last?.exercises?.find((e) => e.name === ex.name);
      const lastStr = lastEx?.sets?.length
        ? lastEx.sets.map((s) => `${s.weight_kg ?? "--"}kg×${s.reps ?? "--"}`).join(", ")
        : null;

      const setRows = Array.from({ length: ex.sets })
        .map((_, si) => {
          const prevSet = lastEx?.sets?.[si];
          return `
          <div class="set-row" data-ex="${i}" data-set="${si}">
            <span class="set-num">${si + 1}</span>
            <input type="number" inputmode="decimal" placeholder="${prevSet?.weight_kg ?? "kg"}" class="weight-input" />
            <span class="x">×</span>
            <input type="number" inputmode="numeric" placeholder="${prevSet?.reps ?? "reps"}" class="reps-input" />
            <span class="set-status">${icon("check")}</span>
          </div>`;
        })
        .join("");

      return `
        <div class="exercise-block" data-exercise-name="${escapeAttr(ex.name)}" data-ex-index="${i}">
          <div class="exercise-head">
            <div>
              <div class="exercise-name">${escapeHtml(ex.name)}</div>
              <div class="exercise-meta">
                <span class="type-tag ${ex.type}">${ex.type}</span>
                <span class="muted small">target ${ex.reps} reps</span>
              </div>
            </div>
            <span class="exercise-done-badge hidden">${icon("check")}</span>
          </div>
          <div class="muted small last-time">
            ${lastStr ? `Last time: ${escapeHtml(lastStr)}` : "First time logging this"}
            ${lastStr ? `<button type="button" class="chip repeat-last-btn" data-ex-index="${i}" style="margin-left:6px;padding:3px 10px;font-size:11px;">${icon("refresh")} Repeat</button>` : ""}
          </div>
          <div class="sets">${setRows}</div>
        </div>`;
    })
    .join("");

  root.innerHTML = `
    <div class="screen-head">
      <div>
        <div class="greeting">${escapeHtml(plan.label)}</div>
        <div class="date-line">${escapeHtml(plan.focus)}</div>
      </div>
    </div>
    <div class="day-pills">${dayPillsHtml}</div>
    <div class="card tight">
      <div class="plan-progress-track"><div class="plan-progress-fill" id="plan-progress-fill" style="width:0%"></div></div>
      <div class="muted small" id="plan-progress-count">0/${plan.exercises.length} exercises logged</div>
    </div>
    ${exerciseRows}
    <button type="button" id="save-workout-btn" class="primary-btn">${icon("check")} Save Workout</button>
  `;

  $$(".day-pill", root).forEach((btn) =>
    btn.addEventListener("click", () => {
      state.todayDayType = btn.dataset.day;
      renderToday();
    })
  );

  $$(".repeat-last-btn", root).forEach((btn) =>
    btn.addEventListener("click", () => {
      const idx = btn.dataset.exIndex;
      const block = $(`.exercise-block[data-ex-index="${idx}"]`, root);
      const exName = block.dataset.exerciseName;
      const lastEx = last?.exercises?.find((e) => e.name === exName);
      if (!lastEx) return;
      $$(".set-row", block).forEach((row, si) => {
        const prevSet = lastEx.sets?.[si];
        if (!prevSet) return;
        const wInput = row.querySelector(".weight-input");
        const rInput = row.querySelector(".reps-input");
        if (prevSet.weight_kg != null) wInput.value = prevSet.weight_kg;
        if (prevSet.reps != null) rInput.value = prevSet.reps;
        updateSetRowStatus(row);
      });
      updateExerciseDoneState(block);
      updatePlanProgress(root);
      showToast(`Repeated last session for ${exName}`, "ok");
    })
  );

  setupTodayLiveUpdates(root);
  updatePlanProgress(root);
  $("#save-workout-btn", root).addEventListener("click", () => saveTodayWorkout(dayType, plan, root));
}

function saveTodayWorkout(dayType, plan, root) {
  const blocks = $$(".exercise-block", root);
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
    showToast("Nothing logged yet — enter at least one set.", "bad");
    return;
  }

  const todayDate = new Date().toISOString().slice(0, 10);
  const session = {
    id: `${todayDate}_${dayType}`,
    date: todayDate,
    day_type: dayType,
    exercises: loggedExercises,
  };
  saveWorkout(session);
  showToast(`Saved ${plan.label} — ${loggedExercises.length} exercises logged`, "ok");
  renderProgress();
}

// ---------------------------------------------------------------- Progress / charts

let progressChart = null;

function computeStats(points) {
  if (!points.length) return null;
  const weights = points.map((p) => p.weight_kg).filter((w) => w != null);
  if (!weights.length) return null;
  const best = Math.max(...weights);
  const latest = points[points.length - 1].weight_kg;
  const first = points[0].weight_kg;
  const delta = latest != null && first != null ? latest - first : null;
  return { best, latest, delta };
}

function renderProgress() {
  const root = $("#tab-progress");
  if (!root) return;
  const names = listAllExerciseNames();
  if (!names.length) {
    root.innerHTML =
      `<div class="screen-head"><div><div class="greeting">Progress</div><div class="date-line">Strength over time</div></div></div>` +
      emptyState({
        iconName: "progress",
        title: "No history yet",
        sub: "Log a workout in the Today tab to start tracking strength progression.",
      });
    return;
  }
  if (!state.progressExercise || !names.includes(state.progressExercise)) {
    state.progressExercise = names[0];
  }

  root.innerHTML = `
    <div class="screen-head">
      <div>
        <div class="greeting">Progress</div>
        <div class="date-line">Strength over time</div>
      </div>
    </div>
    <div class="card">
      <div class="chip-row">${names
        .map(
          (n) =>
            `<button type="button" class="chip${n === state.progressExercise ? " active" : ""}" data-ex="${escapeAttr(n)}">${escapeHtml(n)}</button>`
        )
        .join("")}</div>
      <div class="stat-row" id="progress-stats"></div>
      <canvas id="progress-canvas" height="220"></canvas>
    </div>
  `;

  $$(".chip", root).forEach((btn) =>
    btn.addEventListener("click", () => {
      state.progressExercise = btn.dataset.ex;
      renderProgress();
    })
  );

  drawProgressChart(state.progressExercise);
}

function drawProgressChart(exerciseName) {
  const points = getExerciseHistory(exerciseName);
  const statsRoot = $("#progress-stats");
  const stats = computeStats(points);
  if (statsRoot) {
    if (!stats) {
      statsRoot.innerHTML = "";
    } else {
      const deltaSign = stats.delta == null ? "" : stats.delta > 0 ? "delta-up" : stats.delta < 0 ? "delta-down" : "";
      const deltaStr = stats.delta == null ? "--" : `${stats.delta > 0 ? "+" : ""}${stats.delta}kg`;
      statsRoot.innerHTML = `
        <div class="stat-block"><div class="stat-value">${stats.best}kg</div><div class="stat-label">Best</div></div>
        <div class="stat-block"><div class="stat-value">${stats.latest ?? "--"}kg</div><div class="stat-label">Latest</div></div>
        <div class="stat-block ${deltaSign}"><div class="stat-value">${deltaStr}</div><div class="stat-label">Change</div></div>
      `;
    }
  }

  const canvas = $("#progress-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (progressChart) progressChart.destroy();
  progressChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: points.map((p) => formatShortDate(p.date)),
      datasets: [
        {
          label: "Top set weight (kg)",
          data: points.map((p) => p.weight_kg),
          borderColor: "#18cc7a",
          backgroundColor: "rgba(24,204,122,0.15)",
          tension: 0.3,
          fill: true,
          pointRadius: 3,
          pointBackgroundColor: "#18cc7a",
          pointBorderColor: "#0a0a0c",
        },
      ],
    },
    options: {
      plugins: { legend: { labels: { color: "#f5f5f7", font: { size: 11 } } } },
      scales: {
        x: { ticks: { color: "#a6a6b0", font: { size: 10 } }, grid: { color: "rgba(255,255,255,0.06)" } },
        y: { ticks: { color: "#a6a6b0", font: { size: 10 } }, grid: { color: "rgba(255,255,255,0.06)" } },
      },
    },
  });
}

// ---------------------------------------------------------------- Coach

function renderCoachMarkdown(text) {
  return escapeHtml(text).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
}

function renderCoach() {
  const root = $("#tab-coach");
  if (!root) return;
  root.innerHTML = `
    <div class="screen-head">
      <div>
        <div class="greeting">Coach</div>
        <div class="date-line">Personalized readiness &amp; guidance</div>
      </div>
    </div>
    <div class="card coach-card">
      <div class="card-title">${icon("sparkle")} Ask Your Coach</div>
      <p class="muted small">Builds a prompt from your latest WHOOP data, today's planned session, and recent logged workouts, then asks Claude.</p>
      <button type="button" id="ask-coach-btn" class="primary-btn">${icon("coach")} Get Today's Coaching</button>
    </div>
    <div id="coach-output" class="coach-output"></div>
  `;
  $("#ask-coach-btn").addEventListener("click", runCoach);
}

async function runCoach() {
  const out = $("#coach-output");
  const btn = $("#ask-coach-btn");
  const { anthropicApiKey } = getSettings();
  if (!anthropicApiKey) {
    showToast("Add your Anthropic API key in Settings first", "bad");
    return;
  }
  btn.disabled = true;
  out.innerHTML = `
    <div class="bubble">
      <div class="bubble-meta">${icon("sparkle")} Claude is thinking</div>
      <div class="typing-dots"><span></span><span></span><span></span></div>
    </div>`;
  try {
    const data = state.whoopData || (await ensureWhoopData());
    const todayDayType = state.todayDayType || nextDayType(getWorkouts());
    const prompt = buildCoachingPrompt({ whoopData: data, todayDayType });
    const reply = await askCoach({ apiKey: anthropicApiKey, prompt });
    const time = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    out.innerHTML = `
      <div class="bubble">
        <div class="bubble-meta">${icon("sparkle")} Claude · ${time}</div>
        <div class="bubble-text">${renderCoachMarkdown(reply)}</div>
      </div>`;
  } catch (err) {
    out.innerHTML = `
      <div class="bubble">
        <div class="bubble-meta">${icon("alert")} Error</div>
        <div class="bubble-text error">${escapeHtml(err.message)}</div>
      </div>`;
    showToast("Coach request failed", "bad");
  } finally {
    btn.disabled = false;
  }
}

// ---------------------------------------------------------------- Settings

function renderWhoopStatus() {
  const el = $("#whoop-status");
  if (!el) return;
  if (state.whoopError) {
    el.className = "status-row bad";
    el.innerHTML = `${icon("alert")} ${escapeHtml(state.whoopError)}`;
  } else if (state.whoopData) {
    el.className = "status-row ok";
    el.innerHTML = `${icon("check")} WHOOP data connected`;
  } else {
    el.className = "status-row";
    el.innerHTML = `${icon("refresh")} Not checked yet`;
  }
}

function renderSettings() {
  const root = $("#tab-settings");
  if (!root) return;
  const s = getSettings();
  const noAssistAttrs = `autocomplete="off" autocapitalize="none" autocorrect="off" spellcheck="false"`;
  root.innerHTML = `
    <div class="screen-head">
      <div>
        <div class="greeting">Settings</div>
        <div class="date-line">Stored only on this device</div>
      </div>
    </div>
    <div class="card">
      <div class="card-title">${icon("lock")} Data Passphrase</div>
      <p class="muted small">Decrypts the WHOOP snapshot synced by GitHub Actions.</p>
      <div class="pw-row">
        <input id="passphrase-input" type="password" placeholder="Passphrase" value="${escapeAttr(s.dataPassphrase ?? "")}" ${noAssistAttrs} />
        <button type="button" class="icon-btn show-toggle" data-target="passphrase-input" aria-label="Show passphrase">${icon("eye")}</button>
      </div>
      <div id="whoop-status" class="status-row">${icon("refresh")} Not checked yet</div>
    </div>
    <div class="card">
      <div class="card-title">${icon("key")} Anthropic API Key</div>
      <p class="muted small">Used to call Claude directly from this browser.</p>
      <div class="pw-row">
        <input id="apikey-input" type="password" placeholder="sk-ant-..." value="${escapeAttr(s.anthropicApiKey ?? "")}" ${noAssistAttrs} />
        <button type="button" class="icon-btn show-toggle" data-target="apikey-input" aria-label="Show API key">${icon("eye")}</button>
      </div>
      <div class="field-hint">Don't have one? <a href="https://console.anthropic.com" target="_blank" rel="noopener">Create a key at console.anthropic.com →</a></div>
    </div>
    <button type="button" id="save-settings-btn" class="primary-btn">${icon("check")} Save Settings</button>
    <div class="muted small center" style="margin-top:6px;">Claude Coach</div>
  `;

  renderWhoopStatus();

  $$(".show-toggle", root).forEach((btn) => {
    btn.addEventListener("click", () => {
      const input = document.getElementById(btn.dataset.target);
      const isPw = input.type === "password";
      input.type = isPw ? "text" : "password";
      btn.innerHTML = isPw ? icon("eyeOff") : icon("eye");
    });
  });

  $("#save-settings-btn", root).addEventListener("click", async () => {
    saveSettings({
      dataPassphrase: $("#passphrase-input", root).value,
      anthropicApiKey: $("#apikey-input", root).value,
    });
    await ensureWhoopData(true);
    renderWhoopStatus();
    renderDashboard();
    if (state.whoopError) showToast(state.whoopError, "bad");
    else showToast("Settings saved", "ok");
  });
}

// ---------------------------------------------------------------- Boot

async function boot() {
  renderTopbar();
  renderNavShell();
  setupTabs();
  renderSettings();
  renderCoach();
  renderToday();
  renderProgress();
  renderDashboard();
  await ensureWhoopData();
  renderDashboard();
  renderWhoopStatus();
}

boot();
