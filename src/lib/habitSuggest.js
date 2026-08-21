import { HABIT_POOL } from "./constants";

// Monday of the week containing `date` (defaults to today), as YYYY-MM-DD —
// the key used in global.weeklyPlans.
export function weekStartKey(date = new Date()) {
  const dow = (date.getDay() + 6) % 7; // 0 = Monday
  const monday = new Date(date);
  monday.setDate(monday.getDate() - dow);
  return monday.toISOString().split("T")[0];
}

// Rule-based habit suggestions: 'core' habits are always included; the rest
// only when the week's plan tags call for them (or there's a match today).
// Before any weekly planning has happened, everything is shown so the app
// isn't empty.
export function suggestHabits({ weekPlan, hasMatchToday }) {
  const tags = weekPlan?.tags || null;
  return HABIT_POOL.filter(h => {
    if (h.tags.includes("core")) return true;
    if (h.tags.includes("match") && hasMatchToday) return true;
    if (!tags) return true; // no plan yet: show the full pool
    return h.tags.some(t => tags.includes(t));
  });
}
