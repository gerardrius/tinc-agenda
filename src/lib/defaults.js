import { todayKey } from "./utils";

// Per-day record. Everything here resets/accrues day by day; cross-day state
// (matches, weekly reviews, the weekly task pool) lives in defaultGlobal().
export const defaultDay = () => ({
  date: todayKey(),
  habits: {}, // { [habitId]: boolean } — HABIT_POOL ids, never carried forward
  customHabits: [], // [{ id, emoji, label, topic }] — user-added, appended to HABIT_POOL for the day
  tasks: [], // [{ id, label, topic, hint, done }] — first 3 are "Prioritats d'avui"
  mood: null, // 1–5 | null
  energy: null, // 1–5 | null
  qa: {}, // { [quickActionId]: boolean } — which quick actions were used today
  nightlyReview: null, // { energia, anim, productivitat, note } once the nightly ritual is completed
  ritualDismissed: { nit: false, set: false }, // per-day banner dismissal
  expenses: [], // [{ id, amount, category }] — quick-logged from the "Despesa" pill
  social: [], // [{ id, who }] — quick-logged from the "Activitat social" pill
});

export const defaultGlobal = () => ({
  // Two-week RFEF cycle. Each entry: { id, role: 'partitA'|'quart', status: 'tbd'|'confirmed',
  // teams, venue, time, weekendDate, calendarEventId, prep: {[itemId]:boolean} }
  matches: [],
  // { [weekStartKey]: { rate, why, intention } } — weekly ritual step 2+3 answers
  weeklyReviews: {},
  // { [weekStartKey]: [{ id, emoji, label, topic, days: number[], included }] } — weekly ritual
  // step 4 output, distributed into each day's `tasks` by src/lib/taskRules.js
  weeklyTaskPool: {},
});
