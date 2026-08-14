import { EVENT_PRIORITIES } from "../lib/constants";
import { todayKey, fmtDate, fmtTime, groupByDay } from "../lib/utils";
import { S } from "../lib/styles";
import { Title } from "./ui";

export function CalView({ calEvents, fetchCalendar, calLoading, global, saveGlobal }) {
  const prios = global.eventPriorities || {};
  const setPrio = (title, prio) => saveGlobal({ ...global, eventPriorities: { ...prios, [title]: prio } });
  return (<div>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}><Title>Agenda</Title><button onClick={fetchCalendar} style={S.pBtn}>{calLoading ? "..." : "Sincronitzar"}</button></div>
    {!calEvents && <p style={{ ...S.muted, textAlign: "center", marginTop: 30 }}>Prem sincronitzar per connectar amb els teus calendaris.</p>}
    {calEvents && calEvents.length === 0 && <p style={{ ...S.muted, textAlign: "center", marginTop: 30 }}>Cap event proper.</p>}
    {calEvents && calEvents.length > 0 && groupByDay(calEvents).map(([dk, evts]) => (
      <div key={dk} style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: dk === todayKey() ? "#4ade80" : "#8a919c", marginBottom: 6, textTransform: "capitalize" }}>{dk === todayKey() ? "📌 Avui" : fmtDate(new Date(dk + "T12:00"))}</div>
        {evts.sort((a, b) => { const pa = EVENT_PRIORITIES.findIndex(p => p.id === (prios[a.title] || "normal")); const pb = EVENT_PRIORITIES.findIndex(p => p.id === (prios[b.title] || "normal")); return pa - pb; }).map((e, i) => {
          const title = e.title || "Event"; const prio = prios[title] || "normal"; const pd = EVENT_PRIORITIES.find(p => p.id === prio);
          return (<div key={i} style={{ ...S.evCard, borderLeft: `3px solid ${pd.color}`, background: pd.bg }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ fontSize: 11, color: "#4ade80", fontFamily: "monospace" }}>{fmtTime(e.start)}</span>
                  {prio === "critical" && <span style={{ fontSize: 9, background: "#ef444422", color: "#ef4444", padding: "1px 5px", borderRadius: 3, fontWeight: 600 }}>CRÍTIC</span>}
                  {prio === "important" && <span style={{ fontSize: 9, background: "#f59e0b22", color: "#f59e0b", padding: "1px 5px", borderRadius: 3, fontWeight: 600 }}>IMPORTANT</span>}
                </div>
                <div style={{ fontSize: 13, color: "#e5e7eb", fontWeight: 500, marginTop: 2 }}>{title}</div>
                {e.location && <div style={{ fontSize: 10, color: "#6b7280", marginTop: 1 }}>📍 {e.location}</div>}
              </div>
              <div style={{ display: "flex", gap: 2 }}>{EVENT_PRIORITIES.map(p => (<button key={p.id} onClick={() => setPrio(title, p.id)} style={{ width: 18, height: 18, borderRadius: 4, border: prio === p.id ? `2px solid ${p.color}` : "1px solid #333", background: prio === p.id ? p.color + "33" : "transparent", cursor: "pointer" }} title={p.label} />))}</div>
            </div>
          </div>); })}
      </div>))}
  </div>);
}
