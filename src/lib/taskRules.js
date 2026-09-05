import { HABIT_POOL, INTENTION_KEYWORD_RULES } from "./constants";
import { uid } from "./utils";

// Monday of the week containing `date` (defaults to today), as YYYY-MM-DD.
export function weekStartKey(date = new Date()) {
  const dow = (date.getDay() + 6) % 7; // 0 = Monday
  const monday = new Date(date);
  monday.setDate(monday.getDate() - dow);
  return monday.toISOString().split("T")[0];
}

// Recurring habits are always active; match-week habits join when a match
// falls within 7 days (README "Habits (rules engine)"). Habits never carry
// forward — a missed day is just missed, not rescheduled.
export function activeHabits({ hasMatchWithin7Days, customHabits = [] }) {
  const pool = HABIT_POOL.filter((h) => h.tags.includes("core") || (h.tags.includes("matchWeek") && hasMatchWithin7Days));
  return [...pool, ...customHabits];
}

// A one-off task moved to tomorrow 3+ times gets flagged blocked (README
// "Rules engine" in Ritual 1 step 2). `movedCount` is tracked on the task.
export function isBlocked(task) {
  return (task.movedCount || 0) >= 3;
}

// Parse a free-text weekly intention for keyword matches and return the
// deduped suggested-task list (README "Step 4 — Generació de tasques").
// Client-side keyword match only — no API call, per spec.
export function parseIntention(text) {
  const lower = (text || "").toLowerCase();
  const seen = new Set();
  const out = [];
  for (const rule of INTENTION_KEYWORD_RULES) {
    if (!rule.keywords.some((k) => lower.includes(k))) continue;
    for (const t of rule.tasks) {
      const key = `${t.topic}:${t.label}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ id: uid(), emoji: t.emoji, label: t.label, topic: t.topic, day: t.day, included: true });
    }
  }
  return out;
}

// Fold a confirmed weekly task-pool entry into the plain task shape a day's
// `tasks` array expects, for the day index it was assigned to (or every day
// when `days` is null, i.e. "cada dia").
export function taskForDay(poolItem, dayIndex) {
  if (!poolItem.included) return null;
  if (poolItem.days != null && poolItem.days !== dayIndex) return null;
  return { id: uid(), label: poolItem.label, topic: poolItem.topic, hint: poolItem.emoji, done: false };
}
