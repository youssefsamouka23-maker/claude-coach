// js/program.js
// 6-day hypertrophy split, fixed to the calendar (Mon-Sun), Thursday off.
// Compounds: 6-10 reps. Accessories: 10-15 reps.
// `supersetGroup` links paired exercises (e.g. left/right unilateral work,
// or two movements meant to be performed back-to-back) so the UI can show
// them visually grouped.

export const DAY_ORDER = ["push_1", "pull_1", "legs_1", "rest", "push_2", "pull_2", "legs_2"];

export const DAY_LABELS = {
  push_1: "Push 1",
  pull_1: "Pull 1",
  legs_1: "Legs 1",
  rest: "Rest",
  push_2: "Push 2",
  pull_2: "Pull 2",
  legs_2: "Legs 2",
};

// Maps JS Date#getDay() (0=Sun..6=Sat) to a day_type key.
const WEEKDAY_TO_DAY_TYPE = {
  1: "push_1", // Mon
  2: "pull_1", // Tue
  3: "legs_1", // Wed
  4: "rest", // Thu
  5: "push_2", // Fri
  6: "pull_2", // Sat
  0: "legs_2", // Sun
};

const C = "6-10"; // compound rep target
const A = "10-15"; // accessory rep target

export const PROGRAM = {
  push_1: {
    label: "Push 1",
    focus: "Hypertrophy — Chest / Shoulders / Triceps",
    exercises: [
      { name: "Bench Press - Dumbbell", type: "compound", sets: 4, reps: C },
      { name: "Overhead Press - Seated - Dumbbell", type: "compound", sets: 3, reps: C },
      { name: "Smith Machine Incline Bench Press", type: "compound", sets: 3, reps: C },
      { name: "Machine Chest Flys", type: "accessory", sets: 3, reps: A },
      { name: "Cable Lateral Raise - L", type: "accessory", sets: 3, reps: A, supersetGroup: "lat_raise_1" },
      { name: "Cable Lateral Raise - R", type: "accessory", sets: 3, reps: A, supersetGroup: "lat_raise_1" },
      { name: "Rear Delt Fly - Machine", type: "accessory", sets: 3, reps: A },
      { name: "Triceps Pulldown - Rope", type: "accessory", sets: 3, reps: A },
      { name: "Tricep Extension - Supine Lying - Dumbbell", type: "accessory", sets: 3, reps: A },
    ],
  },
  pull_1: {
    label: "Pull 1",
    focus: "Hypertrophy — Back / Biceps",
    exercises: [
      { name: "Bent Over Row - Barbell", type: "compound", sets: 4, reps: C },
      { name: "Lat Pull Down - Wide Grip Front Pull", type: "compound", sets: 4, reps: C },
      { name: "Single Arm Bent Over Row - R - Cable", type: "compound", sets: 3, reps: C, supersetGroup: "row_1" },
      { name: "Single Arm Bent Over Row - L - Cable", type: "compound", sets: 3, reps: C, supersetGroup: "row_1" },
      { name: "Cable Face Pulls", type: "accessory", sets: 3, reps: A },
      { name: "Preacher Curl", type: "accessory", sets: 3, reps: A },
      { name: "Bicep Curl - Behind the Back - Cable - L", type: "accessory", sets: 3, reps: A, supersetGroup: "btb_curl_1" },
      { name: "Bicep Curl - Behind the Back - Cable - R", type: "accessory", sets: 3, reps: A, supersetGroup: "btb_curl_1" },
      { name: "Reverse Bicep Curl", type: "accessory", sets: 3, reps: A },
    ],
  },
  legs_1: {
    label: "Legs 1",
    focus: "Hypertrophy — Quads / Hamstrings / Calves / Core",
    exercises: [
      { name: "Back Squat - Barbell", type: "compound", sets: 4, reps: C },
      { name: "Leg Press - Machine", type: "compound", sets: 3, reps: C },
      { name: "Romanian Deadlift - Barbell", type: "compound", sets: 3, reps: C },
      { name: "Split Squat - Rear Foot Elevated - L - Dumbbell", type: "compound", sets: 3, reps: C, supersetGroup: "split_squat_1" },
      { name: "Split Squat - Rear Foot Elevated - R - Dumbbell", type: "compound", sets: 3, reps: C, supersetGroup: "split_squat_1" },
      { name: "Seated Machine Leg Curl", type: "accessory", sets: 3, reps: A },
      { name: "Calf Raise - Standing", type: "accessory", sets: 4, reps: A },
      { name: "Cable Crunch", type: "accessory", sets: 3, reps: A },
      { name: "Hanging Leg Raise", type: "accessory", sets: 3, reps: A },
    ],
  },
  rest: {
    label: "Rest",
    focus: "Recovery day",
    exercises: [],
  },
  push_2: {
    label: "Push 2",
    focus: "Hypertrophy — Chest / Shoulders / Triceps",
    exercises: [
      { name: "Bench Press - Incline - Dumbbell", type: "compound", sets: 4, reps: C },
      { name: "Shoulder Press - Machine", type: "compound", sets: 4, reps: C },
      { name: "Standing Cable Crossover", type: "accessory", sets: 4, reps: A },
      { name: "Low Cable Fly", type: "accessory", sets: 3, reps: A },
      { name: "Cable Lateral Raise - L", type: "accessory", sets: 3, reps: A, supersetGroup: "lat_raise_2" },
      { name: "Cable Lateral Raise - R", type: "accessory", sets: 3, reps: A, supersetGroup: "lat_raise_2" },
      { name: "Rear Delt Fly - Machine", type: "accessory", sets: 3, reps: A },
      { name: "Tricep Pushdown - V Bar", type: "accessory", sets: 3, reps: A },
      { name: "Overhead Rope Extension", type: "accessory", sets: 3, reps: A },
    ],
  },
  pull_2: {
    label: "Pull 2",
    focus: "Hypertrophy — Back / Biceps",
    exercises: [
      { name: "Seated Row - Cable", type: "compound", sets: 4, reps: C },
      { name: "Row - Single Arm - L - Dumbbell", type: "compound", sets: 3, reps: C, supersetGroup: "row_2" },
      { name: "Row - Single Arm - R - Dumbbell", type: "compound", sets: 3, reps: C, supersetGroup: "row_2" },
      { name: "Standing Row - Cable", type: "compound", sets: 3, reps: C },
      { name: "Cable Face Pulls", type: "accessory", sets: 3, reps: A },
      { name: "Preacher Curl", type: "accessory", sets: 3, reps: A },
      { name: "Bicep Curl - Cable", type: "accessory", sets: 3, reps: A },
      { name: "Bicep Curl - Behind the Back - Cable - L", type: "accessory", sets: 3, reps: A, supersetGroup: "btb_curl_2" },
      { name: "Bicep Curl - Behind the Back - Cable - R", type: "accessory", sets: 3, reps: A, supersetGroup: "btb_curl_2" },
      { name: "Hammer Curl - Dumbbell", type: "accessory", sets: 3, reps: A },
    ],
  },
  legs_2: {
    label: "Legs 2",
    focus: "Hypertrophy — Quads / Hamstrings / Glutes / Core",
    exercises: [
      { name: "Hack Squat - Machine", type: "compound", sets: 4, reps: C },
      { name: "Romanian Deadlift - Dumbbell", type: "compound", sets: 3, reps: C },
      { name: "Lying Leg Curl - Machine", type: "accessory", sets: 3, reps: A },
      { name: "Split Squat - Rear Foot Elevated - L - Dumbbell", type: "compound", sets: 3, reps: C, supersetGroup: "split_squat_2" },
      { name: "Split Squat - Rear Foot Elevated - R - Dumbbell", type: "compound", sets: 3, reps: C, supersetGroup: "split_squat_2" },
      { name: "Hip Thrust - Barbell", type: "compound", sets: 3, reps: C },
      { name: "Seated Calf Raise", type: "accessory", sets: 4, reps: A },
      { name: "Cable Crunch", type: "accessory", sets: 3, reps: A },
      { name: "Hanging Leg Raise", type: "accessory", sets: 3, reps: A },
    ],
  },
};

// Picks today's session by actual weekday. `history` is accepted for
// backward-compatibility but no longer drives rotation — the plan is now
// pinned to specific days of the week (Thursday = rest).
export function nextDayType(history) {
  const weekday = new Date().getDay();
  return WEEKDAY_TO_DAY_TYPE[weekday] || DAY_ORDER[0];
}
