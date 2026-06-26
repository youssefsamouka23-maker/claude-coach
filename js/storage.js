// js/storage.js
// All persistence is localStorage on this device. Nothing leaves the phone
// except: (a) the Anthropic API call you explicitly trigger, using the key
// you enter below, and (b) the WHOOP data fetch, which is just reading the
// encrypted file already sitting in the repo.

const KEYS = {
  settings: "cc_settings_v1",
  workouts: "cc_workouts_v1",
};

export function getSettings() {
  try {
    return JSON.parse(localStorage.getItem(KEYS.settings)) || {};
  } catch {
    return {};
  }
}

export function saveSettings(partial) {
  const current = getSettings();
  // Trim whitespace — mobile keyboards (autocapitalize/autocorrect/autofill)
  // can silently add leading/trailing spaces, which breaks the passphrase
  // derivation (AES-GCM auth tag check fails -> "operation-specific" error).
  const cleaned = {};
  for (const [k, v] of Object.entries(partial)) {
    cleaned[k] = typeof v === "string" ? v.trim() : v;
  }
  const next = { ...current, ...cleaned };
  localStorage.setItem(KEYS.settings, JSON.stringify(next));
  return next;
}

export function getWorkouts() {
  try {
    return JSON.parse(localStorage.getItem(KEYS.workouts)) || [];
  } catch {
    return [];
  }
}

export function saveWorkout(session) {
  const all = getWorkouts();
  const idx = all.findIndex((w) => w.id === session.id);
  if (idx >= 0) {
    all[idx] = session;
  } else {
    all.push(session);
  }
  all.sort((a, b) => new Date(a.date) - new Date(b.date));
  localStorage.setItem(KEYS.workouts, JSON.stringify(all));
  return all;
}

export function deleteWorkout(id) {
  const all = getWorkouts().filter((w) => w.id !== id);
  localStorage.setItem(KEYS.workouts, JSON.stringify(all));
  return all;
}

export function getLastSessionForDayType(dayType) {
  const all = getWorkouts();
  for (let i = all.length - 1; i >= 0; i--) {
    if (all[i].day_type === dayType) return all[i];
  }
  return null;
}

// History of top-set weight per exercise name, oldest -> newest.
export function getExerciseHistory(exerciseName) {
  const all = getWorkouts();
  const points = [];
  for (const session of all) {
    const ex = session.exercises?.find((e) => e.name === exerciseName);
    if (!ex || !ex.sets?.length) continue;
    const heaviest = ex.sets.reduce(
      (max, s) => (Number(s.weight_kg) > Number(max.weight_kg || 0) ? s : max),
      {}
    );
    if (heaviest.weight_kg) {
      points.push({
        date: session.date,
        weight_kg: Number(heaviest.weight_kg),
        reps: Number(heaviest.reps) || null,
      });
    }
  }
  return points;
}

export function listAllExerciseNames() {
  const all = getWorkouts();
  const names = new Set();
  all.forEach((s) => s.exercises?.forEach((e) => names.add(e.name)));
  return Array.from(names).sort();
}
