import { COLORS } from "./styles";
import { WEEKDAYS_ABBR, HABIT_POOL } from "./constants";

// Oldest → newest date keys for the trailing 7 days, ending today.
export function last7Keys() {
  const out = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    out.push(d.toISOString().split("T")[0]);
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

// Shared per-domain stats used by both SetmanaView's weekly log cards and
// the domain bottom sheet (README "Domain bottom sheet"). Real where the
// data exists (sleep, social log, expenses, habits, tasks); sample-shaped
// fallback for finances until a real BigQuery source lands.
export function computeDomainStats({ id, global, allData, garminSleep, domainScores }) {
  const dates = last7Keys();

  if (id === "son") {
    const scores = dates.map((dk) => garminSleep?.[dk]?.score ?? null);
    const hours = dates.map((dk) => garminSleep?.[dk]?.hours ?? null);
    const avgScore = avg(scores);
    return {
      emoji: "💤", title: "Son", color: COLORS.good,
      value: avgScore != null ? Math.round(avgScore) : "—", qualifier: "puntuació mitjana",
      bars: scores.map((v, i) => ({ v: v ?? 0, label: WEEKDAYS_ABBR[i] })),
      kv: [["Hores mitjanes", avg(hours) != null ? `${avg(hours).toFixed(1)}h` : "—"], ["Ahir", scores[6] ?? "—"]],
      insight: avgScore != null && avgScore < 75
        ? "Rendiment en risc si arribes al partit així. Avança l'hora de dormir 40 min tres nits."
        : "Setmana de son sòlida. Mantén la rutina.",
    };
  }

  if (id === "relacions") {
    const socialCounts = dates.map((dk) => (allData[dk]?.social || []).length);
    const taskCounts = topicTaskCounts(allData, dates, "relacions");
    const counts = socialCounts.map((v, i) => v + taskCounts[i]);
    const total = counts.reduce((a, b) => a + b, 0);
    return {
      emoji: "💛", title: "Relacions", color: COLORS.accent,
      value: total, qualifier: "activitats aquesta setmana",
      bars: counts.map((v, i) => ({ v, label: WEEKDAYS_ABBR[i] })),
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
      bars: spend.map((v, i) => ({ v, label: WEEKDAYS_ABBR[i] })),
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
      bars: counts.map((v, i) => ({ v, label: WEEKDAYS_ABBR[i] })),
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
      bars: doneCounts.map((v, i) => ({ v, label: WEEKDAYS_ABBR[i] })),
      kv: [["Tasques tancades", tot ? `${done}/${tot}` : "0/0"]],
      insight: tot && done / tot < 0.5 ? "Vas endarrerit amb les tasques de feina aquesta setmana." : "Bon ritme amb les tasques de feina.",
    };
  }

  // arbitratge
  const score = domainScores?.arbitratge ?? 7;
  const upcoming = (global.matches || []).slice(-1)[0];
  const arbTaskDone = topicTaskCounts(allData, dates, "arbitratge").reduce((a, b) => a + b, 0);
  const trainingCount = (domainScores?.trainingMatchesThisWeek ?? []).length;
  return {
    emoji: "⚽", title: "Arbitratge", color: COLORS.domainRef,
    value: score, qualifier: "de 10, preparació",
    bars: dates.map((_, i) => ({ v: i === 6 ? score : Math.max(0, score - (6 - i)), label: WEEKDAYS_ABBR[i] })),
    kv: [
      ["Preparació", upcoming ? `${Object.values(upcoming.prep || {}).filter(Boolean).length}/${Object.keys(upcoming.prep || {}).length || "—"}` : "Cap partit actiu"],
      ["Tasques completades", String(arbTaskDone)],
      ...(trainingCount ? [["Partits d'entrenament", String(trainingCount)]] : []),
    ],
    insight: upcoming ? "Segueix el pla de preparació fins al xiulet inicial." : "Aprofita la setmana de descans per repassar criteris.",
  };
}
