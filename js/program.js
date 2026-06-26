// js/program.js
// 5-day Push/Pull/Legs hypertrophy split. No barbell bench (dumbbell only).
// Compounds: 4-6 reps. Accessories: 8-15 reps.

export const DAY_ORDER = ["push_a", "pull_a", "legs", "push_b", "pull_b"];

export const DAY_LABELS = {
  push_a: "Push A",
  pull_a: "Pull A",
  legs: "Legs",
  push_b: "Push B",
  pull_b: "Pull B",
};

export const PROGRAM = {
  push_a: {
    label: "Push A",
    focus: "Chest / Shoulders / Triceps",
    exercises: [
      { name: "Dumbbell Bench Press", type: "compound", sets: 4, reps: "4-6" },
      { name: "Seated Dumbbell Shoulder Press", type: "compound", sets: 3, reps: "4-6" },
      { name: "Weighted Dips", type: "compound", sets: 3, reps: "6-8" },
      { name: "Cable Lateral Raise", type: "accessory", sets: 3, reps: "10-15" },
      { name: "Cable Fly (high-to-low)", type: "accessory", sets: 3, reps: "10-15" },
      { name: "Overhead Triceps Extension", type: "accessory", sets: 3, reps: "8-12" },
    ],
  },
  pull_a: {
    label: "Pull A",
    focus: "Back Width / Biceps",
    exercises: [
      { name: "Weighted Pull-Ups", type: "compound", sets: 4, reps: "4-6" },
      { name: "Chest-Supported Dumbbell Row", type: "compound", sets: 3, reps: "4-6" },
      { name: "Seated Cable Row", type: "compound", sets: 3, reps: "8-12" },
      { name: "Face Pull", type: "accessory", sets: 3, reps: "12-15" },
      { name: "Dumbbell Bicep Curl", type: "accessory", sets: 3, reps: "8-12" },
      { name: "Hammer Curl", type: "accessory", sets: 2, reps: "10-15" },
    ],
  },
  legs: {
    label: "Legs",
    focus: "Quads / Hamstrings / Calves",
    exercises: [
      { name: "Back Squat", type: "compound", sets: 4, reps: "4-6" },
      { name: "Romanian Deadlift", type: "compound", sets: 3, reps: "4-6" },
      { name: "Leg Press", type: "compound", sets: 3, reps: "8-12" },
      { name: "Seated Leg Curl", type: "accessory", sets: 3, reps: "10-15" },
      { name: "Leg Extension", type: "accessory", sets: 3, reps: "10-15" },
      { name: "Standing Calf Raise", type: "accessory", sets: 4, reps: "10-15" },
    ],
  },
  push_b: {
    label: "Push B",
    focus: "Shoulders / Chest / Triceps",
    exercises: [
      { name: "Dumbbell Incline Press", type: "compound", sets: 4, reps: "4-6" },
      { name: "Machine Shoulder Press", type: "compound", sets: 3, reps: "6-8" },
      { name: "Close-Grip Dumbbell Floor Press", type: "compound", sets: 3, reps: "6-8" },
      { name: "Dumbbell Lateral Raise", type: "accessory", sets: 3, reps: "10-15" },
      { name: "Pec Deck / Cable Crossover", type: "accessory", sets: 3, reps: "10-15" },
      { name: "Triceps Pushdown", type: "accessory", sets: 3, reps: "10-15" },
    ],
  },
  pull_b: {
    label: "Pull B",
    focus: "Back Thickness / Rear Delts / Biceps",
    exercises: [
      { name: "Deadlift", type: "compound", sets: 3, reps: "4-6" },
      { name: "Wide-Grip Lat Pulldown", type: "compound", sets: 3, reps: "6-8" },
      { name: "Chest-Supported Dumbbell Row", type: "compound", sets: 3, reps: "8-12" },
      { name: "Rear Delt Fly", type: "accessory", sets: 3, reps: "12-15" },
      { name: "Cable Curl", type: "accessory", sets: 3, reps: "10-15" },
      { name: "Shrugs", type: "accessory", sets: 2, reps: "10-15" },
    ],
  },
};

export function nextDayType(history) {
  if (!history || history.length === 0) return DAY_ORDER[0];
  const last = history[history.length - 1];
  const idx = DAY_ORDER.indexOf(last.day_type);
  if (idx === -1) return DAY_ORDER[0];
  return DAY_ORDER[(idx + 1) % DAY_ORDER.length];
}
