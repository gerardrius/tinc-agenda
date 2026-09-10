// Local calendar-date key (YYYY-MM-DD) — NOT `d.toISOString().split("T")[0]",
// which converts to UTC first and silently shifts the date back a day for
// anyone in a UTC-ahead timezone (all of Spain) whenever the local time is
// past midnight-minus-offset (e.g. from 22:00 CEST/23:00 CET onward, or for
// any Date deliberately set to local midnight, like a week's Monday).
export function localDateKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
export const todayKey = () => localDateKey(new Date());
export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

export function rpeC(n) { return n <= 3 ? "#22c55e" : n <= 5 ? "#eab308" : n <= 7 ? "#f97316" : "#ef4444"; }
export function habitColor(score) { return score === -1 ? "#161a1e" : score === 0 ? "#1a1d21" : score <= 2 ? "#14532d" : score <= 4 ? "#166534" : score <= 5 ? "#22c55e" : "#4ade80"; }
export function fmtDate(d) { return d.toLocaleDateString("ca-ES", { weekday: "long", day: "numeric", month: "long" }); }
export function fmtTime(s) { if(!s)return""; try{return new Date(s).toLocaleTimeString("ca-ES",{hour:"2-digit",minute:"2-digit"});}catch{return s.slice(11,16)||"";} }
// Consecutive prior days (not counting today) where `habits[habitId]` was
// true, walking backward from yesterday until the first miss or missing day.
export function computeStreak(habitId, allData) {
  let streak = 0;
  const d = new Date();
  for (let i = 0; i < 365; i++) {
    d.setDate(d.getDate() - 1);
    const dk = localDateKey(d);
    if (!allData[dk]?.habits?.[habitId]) break;
    streak++;
  }
  return streak;
}

export function groupByDay(events) { const m={}; events.forEach(e=>{const dk=(e.start||"").slice(0,10);if(!dk)return;if(!m[dk])m[dk]=[];m[dk].push(e);}); return Object.entries(m).sort(([a],[b])=>a.localeCompare(b)); }

export function refSub(id, day, global) {
  if(id==="matches") return day.match?"Partit registrat":"Cap partit avui";
  if(id==="planner"){ const n=(global.trainingPlan||[]).length; return n?`${n} sessions planificades`:"Sense pla"; }
  if(id==="formation"){ const dow=(new Date().getDay()+6)%7; const items=(global.formationPlan||[]).filter(f=>f.dow===dow); const done=items.filter(f=>day.formation?.[f.id]).length; return items.length?`${done}/${items.length} avui`:"Sense pla de formació"; }
  if(id==="physical") return `${day.training.filter(t=>t.category==="physical").length} sessions`;
  if(id==="cognitive") return `${(day.cognitive||[]).length} sessions`;
  if(id==="video") return `${(day.video||[]).length} sessions`;
  return "Objectiu: 2a Divisió";
}
