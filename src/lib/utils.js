export const todayKey = () => new Date().toISOString().split("T")[0];
export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

export function rpeC(n) { return n <= 3 ? "#22c55e" : n <= 5 ? "#eab308" : n <= 7 ? "#f97316" : "#ef4444"; }
export function habitColor(score) { return score === -1 ? "#161a1e" : score === 0 ? "#1a1d21" : score <= 2 ? "#14532d" : score <= 4 ? "#166534" : score <= 5 ? "#22c55e" : "#4ade80"; }
export function fmtDate(d) { return d.toLocaleDateString("ca-ES", { weekday: "long", day: "numeric", month: "long" }); }
export function fmtTime(s) { if(!s)return""; try{return new Date(s).toLocaleTimeString("ca-ES",{hour:"2-digit",minute:"2-digit"});}catch{return s.slice(11,16)||"";} }
export function groupByDay(events) { const m={}; events.forEach(e=>{const dk=(e.start||"").slice(0,10);if(!dk)return;if(!m[dk])m[dk]=[];m[dk].push(e);}); return Object.entries(m).sort(([a],[b])=>a.localeCompare(b)); }

export function refSub(id, day, global) {
  if(id==="matches") return day.match?"Partit registrat":"Cap partit avui";
  if(id==="planner"){ const n=(global.trainingPlan||[]).length; return n?`${n} sessions planificades`:"Sense pla"; }
  if(id==="physical") return `${day.training.filter(t=>t.category==="physical").length} sessions`;
  if(id==="cognitive") return `${(day.cognitive||[]).length} sessions`;
  if(id==="video") return `${(day.video||[]).length} sessions`;
  return "Objectiu: 2a Divisió";
}
