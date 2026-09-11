import { COLORS } from "./styles";
import { HABIT_POOL } from "./constants";
import { localDateKey, weekdayShort, fmtHours } from "./utils";

// Oldest → newest date keys for the trailing 7 days, ending today.
export function last7Keys() {
  const out = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    out.push(localDateKey(d));
  }
  return out;
}

const avg = (arr) => { const v = arr.filter((x) => x != null); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null; };

// Per-day counts of tasks tagged with `topicId`, done or not — the piece
// that "joins the dots" between a task's topic pill and its domain's
// weekly activity (e.g. completing a 💛 Relacions task should count toward
// Relacions' activity total, not just the separate social-log entries).
function topicTaskCounts(allData, dates, topicId, doneOnly = true) {
  return dates.map((dk) => (allData[dk]?.tasks || []).filter((t) => t.topic === topicId && (!doneOnly || t.done)).length);
}

// A completed task not yet linked to a real calendar event (older tasks,
// or ones added via the plain "+ Afegir tasca" box) still needs *some*
// duration to plot — half an hour is a deliberately modest guess so a
// linked event's real duration always dominates once one exists.
const FALLBACK_TASK_HOURS = 0.5;

// Per-day {hours, activities[]} for completed tasks tagged `topicId` — the
// hours dimension the weekly bars use once a task carries a calendarEventId
// (set when it's created from Avui's "Prioritat"/"Tasca" event sheet, see
// App.jsx's handleCreateEventForSheet). Each activity also carries the
// task's 1–5 self-rating so the bar's color can reflect how useful the
// time was, not just how much of it there was.
function topicTaskActivity(allData, calEvents, dates, topicId) {
  const eventsById = {};
  (calEvents || []).forEach((e) => { eventsById[e.id] = e; });
  return dates.map((dk) => {
    const tasks = (allData[dk]?.tasks || []).filter((t) => t.topic === topicId && t.done);
    const activities = tasks.map((t) => {
      const ev = t.calendarEventId ? eventsById[t.calendarEventId] : null;
      const hours = ev?.start && ev?.end ? Math.max(0, (new Date(ev.end) - new Date(ev.start)) / 3600000) : FALLBACK_TASK_HOURS;
      return { title: t.label, hours, rating: t.rating ?? null, linked: Boolean(ev) };
    });
    return { hours: activities.reduce((s, a) => s + a.hours, 0), activities };
  });
}

// Average of an activities list's set ratings (nulls skipped), or null if
// none of that day's activities has been rated yet — lets the bar fall back
// to its default color instead of pretending an unrated day was mediocre.
function avgRating(activities) {
  const rated = activities.map((a) => a.rating).filter((r) => r != null);
  return rated.length ? rated.reduce((a, b) => a + b, 0) / rated.length : null;
}

// Shared per-domain stats used by both SetmanaView's weekly log cards and
// the domain bottom sheet (README "Domain bottom sheet"). Real where the
// data exists (sleep, social log, expenses, habits, tasks); sample-shaped
// fallback for finances until a real BigQuery source lands.
export function computeDomainStats({ id, global, allData, garminSleep, domainScores, calEvents }) {
  const dates = last7Keys();

  if (id === "son") {
    const scores = dates.map((dk) => garminSleep?.[dk]?.score ?? null);
    const hours = dates.map((dk) => garminSleep?.[dk]?.hours ?? null);
    const avgScore = avg(scores);
    return {
      emoji: "💤", title: "Son", color: COLORS.good,
      value: avgScore != null ? Math.round(avgScore) : "—", qualifier: "puntuació mitjana",
      bars: scores.map((v, i) => ({ v: v ?? 0, label: weekdayShort(dates[i]) })),
      kv: [["Hores mitjanes", fmtHours(avg(hours))], ["Ahir", scores[6] ?? "—"]],
      insight: avgScore != null && avgScore < 75
        ? "Rendiment en risc si arribes al partit així. Avança l'hora de dormir 40 min tres nits."
        : "Setmana de son sòlida. Mantén la rutina.",
    };
  }

  if (id === "relacions") {
    const socialCounts = dates.map((dk) => (allData[dk]?.social || []).length);
    const taskActivity = topicTaskActivity(allData, calEvents, dates, "relacions");
    const taskCounts = taskActivity.map((a) => a.activities.length);
    const total = socialCounts.reduce((a, b) => a + b, 0) + taskCounts.reduce((a, b) => a + b, 0);
    return {
      emoji: "💛", title: "Relacions", color: COLORS.accent,
      value: total, qualifier: "activitats aquesta setmana",
      // Hours dedicated (via calendar-linked tasks), not just a headcount —
      // the bar's tint reflects how useful that time felt (1–5 self-rating).
      bars: taskActivity.map((a, i) => ({ v: a.hours, label: weekdayShort(dates[i]), activities: a.activities, avgRating: avgRating(a.activities) })),
      kv: [["Entrades socials", String(socialCounts.reduce((a, b) => a + b, 0))], ["Tasques completades", String(taskCounts.reduce((a, b) => a + b, 0))]],
      insight: total === 0
        ? "És el domini més fluix del mes. Una cosa concreta a l'agenda val més que la intenció."
        : "Continua quedant amb regularitat.",
    };
  }

  if (id === "finances") {
    const spend = dates.map((dk) => (allData[dk]?.expenses || []).reduce((s, e) => s + (e.amount || 0), 0));
    const total = spend.reduce((a, b) => a + b, 0);
    return {
      emoji: "💰", title: "Finances", color: COLORS.warn,
      value: `€${Math.round(total)}`, qualifier: "gastats aquesta setmana",
      bars: spend.map((v, i) => ({ v, label: weekdayShort(dates[i]) })),
      kv: [["Objectiu setmanal", "€300"]],
      insight: total > 300
        ? `Has gastat €${Math.round(total)} aquesta setmana. El teu objectiu és €300.`
        : "Dins de l'objectiu setmanal.",
    };
  }

  if (id === "salut") {
    const salutHabits = HABIT_POOL.filter((h) => h.topic === "salut");
    const habitCounts = dates.map((dk) => salutHabits.filter((h) => allData[dk]?.habits?.[h.id]).length);
    const taskCounts = topicTaskCounts(allData, dates, "salut");
    const taskPossible = topicTaskCounts(allData, dates, "salut", false);
    const counts = habitCounts.map((v, i) => v + taskCounts[i]);
    const total = counts.reduce((a, b) => a + b, 0);
    const possible = salutHabits.length * 7 + taskPossible.reduce((a, b) => a + b, 0);
    return {
      emoji: "🏃", title: "Salut", color: COLORS.domainSalut,
      value: possible ? Math.round((total / possible) * 10) : "—", qualifier: "de 10, hàbits i tasques complerts",
      bars: counts.map((v, i) => ({ v, label: weekdayShort(dates[i]) })),
      kv: [["Complerts", `${total}/${possible}`]],
      insight: total < possible / 2 ? "Els hàbits de salut porten dies fluixos. Torna a la rutina bàsica." : "Bona constància aquesta setmana.",
    };
  }

  if (id === "feina") {
    const doneCounts = topicTaskCounts(allData, dates, "feina");
    const totalCounts = topicTaskCounts(allData, dates, "feina", false);
    const done = doneCounts.reduce((a, b) => a + b, 0);
    const tot = totalCounts.reduce((a, b) => a + b, 0);
    return {
      emoji: "💼", title: "Feina", color: COLORS.domainFeina,
      value: tot ? `${done}/${tot}` : "—", qualifier: "tasques tancades",
      bars: doneCounts.map((v, i) => ({ v, label: weekdayShort(dates[i]) })),
      kv: [["Tasques tancades", tot ? `${done}/${tot}` : "0/0"]],
      insight: tot && done / tot < 0.5 ? "Vas endarrerit amb les tasques de feina aquesta setmana." : "Bon ritme amb les tasques de feina.",
    };
  }

  // arbitratge
  const score = domainScores?.arbitratge ?? 7;
  const upcoming = (global.matches || []).slice(-1)[0];
  const arbActivity = topicTaskActivity(allData, calEvents, dates, "arbitratge");
  const arbTaskDone = arbActivity.reduce((s, a) => s + a.activities.length, 0);
  const trainingCount = (domainScores?.trainingMatchesThisWeek ?? []).length;
  return {
    emoji: "⚽", title: "Arbitratge", color: COLORS.domainRef,
    value: score, qualifier: "de 10, preparació",
    // Hours dedicated via calendar-linked tasks (real per-day activity, not
    // a synthetic ramp toward today's score) — the bar's tint reflects the
    // day's average 1–5 self-rating, so a productive hour reads darker than
    // an unrated or low-value one.
    bars: arbActivity.map((a, i) => ({ v: a.hours, label: weekdayShort(dates[i]), activities: a.activities, avgRating: avgRating(a.activities) })),
    kv: [
      ["Preparació", upcoming ? `${Object.values(upcoming.prep || {}).filter(Boolean).length}/${Object.keys(upcoming.prep || {}).length || "—"}` : "Cap partit actiu"],
      ["Tasques completades", String(arbTaskDone)],
      ...(trainingCount ? [["Partits d'entrenament", String(trainingCount)]] : []),
    ],
    insight: upcoming ? "Segueix el pla de preparació fins al xiulet inicial." : "Aprofita la setmana de descans per repassar criteris.",
  };
}
