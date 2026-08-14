import { HABITS, MOODS } from "../lib/constants";
import { todayKey, fmtTime } from "../lib/utils";
import { S } from "../lib/styles";
import { Card, Lbl, Mini } from "./ui";
import { ContributionGrid } from "./ContributionGrid";

export function TodayView({ day, u, toggleHabit, habitsDone, allData, calEvents, fetchCalendar, calLoading, addEntry, removeEntry, setSub }) {
  return (
    <div>
      <Card><Lbl>Focus principal d'avui</Lbl><textarea style={S.ta} value={day.focus || ""} onChange={e => u("focus", null, e.target.value)} placeholder="Una frase. El que importa avui." rows={2} /></Card>

      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <Lbl m0>Agenda d'avui</Lbl>
          <button onClick={fetchCalendar} style={S.smBtn}>{calLoading ? "..." : "Sincronitzar"}</button>
        </div>
        {!calEvents && <p style={S.muted}>Prem sincronitzar per carregar Google + Apple Calendar.</p>}
        {calEvents?.filter(e => e.start?.includes(todayKey())).map((e, i) => (
          <div key={i} style={S.evRow}><span style={{ fontSize: 11, color: "#4ade80", fontFamily: "monospace", minWidth: 44 }}>{fmtTime(e.start)}</span><span style={{ fontSize: 12, color: "#e5e7eb" }}>{e.title}</span></div>
        ))}
        {calEvents?.filter(e => e.start?.includes(todayKey())).length === 0 && <p style={S.muted}>Cap event avui.</p>}
      </Card>

      <div style={S.g2}>
        <Mini label="Pantalla" value={day.screen.total ? day.screen.total + "'" : "—"} color="#f59e0b" />
        <Mini label="Xarxes" value={day.screen.social ? day.screen.social + "'" : "—"} color={parseInt(day.screen.social) > 20 ? "#ef4444" : "#4ade80"} />
        <Mini label="Son" value={day.sleep.hours ? day.sleep.hours + "h" : "—"} color="#818cf8" />
        <Mini label="Estat" value={day.mood ? MOODS.find(m => m.id === day.mood)?.emoji || "—" : "—"} color="#e5e7eb" />
      </div>

      <Card>
        <Lbl>Hàbits</Lbl>
        {HABITS.map(h => (
          <button key={h.id} onClick={() => toggleHabit(h.id)} style={{ ...S.habBtn, background: day.habits[h.id] ? "rgba(74,222,128,0.07)" : "transparent", borderColor: day.habits[h.id] ? "rgba(74,222,128,0.22)" : "#252a30" }}>
            <span style={{ ...S.chk, background: day.habits[h.id] ? "#4ade80" : "#252a30", color: day.habits[h.id] ? "#000" : "#444" }}>{day.habits[h.id] ? "✓" : ""}</span>
            <span style={{ fontSize: 12, color: day.habits[h.id] ? "#a7f3d0" : "#888" }}>{h.text}</span>
          </button>
        ))}
      </Card>

      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <Lbl m0>Recordatoris</Lbl>
          <button onClick={() => addEntry("reminders", { text: "", done: false })} style={S.smBtn}>+ Nou</button>
        </div>
        {(day.reminders || []).map(r => (
          <div key={r.id} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
            <button onClick={() => { const d = { ...day }; d.reminders = d.reminders.map(x => x.id === r.id ? { ...x, done: !x.done } : x); }} style={{ ...S.chk, width: 18, height: 18, fontSize: 10, background: r.done ? "#4ade80" : "#252a30", color: r.done ? "#000" : "#444", border: "none", cursor: "pointer" }}>{r.done ? "✓" : ""}</button>
            <input style={{ ...S.inp, flex: 1, fontSize: 12, textDecoration: r.done ? "line-through" : "none", opacity: r.done ? 0.5 : 1 }} value={r.text} onChange={e => { const d = { ...day }; d.reminders = d.reminders.map(x => x.id === r.id ? { ...x, text: e.target.value } : x); }} placeholder="Escriu..." />
            <button onClick={() => removeEntry("reminders", r.id)} style={{ ...S.delBtn, fontSize: 14 }}>×</button>
          </div>
        ))}
        {(day.reminders || []).length === 0 && <p style={S.muted}>Cap recordatori avui.</p>}
      </Card>

      <Card><Lbl>Contribucions (12 setmanes)</Lbl><ContributionGrid allData={allData} /></Card>

      <button onClick={() => setSub("history")} style={S.navC}>
        <span style={{ fontSize: 18 }}>📊</span>
        <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 600, color: "#e5e7eb" }}>Historial</div><div style={{ fontSize: 10, color: "#6b7280" }}>Explora dies anteriors i tendències</div></div>
        <span style={{ color: "#444" }}>→</span>
      </button>

      <Card><Lbl>Reflexió</Lbl><textarea style={S.ta} value={day.reflection || ""} onChange={e => u("reflection", null, e.target.value)} placeholder="He complert el focus? Què ajusto demà?" rows={2} /></Card>
    </div>
  );
}
