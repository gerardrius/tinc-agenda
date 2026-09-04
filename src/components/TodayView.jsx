import { useState } from "react";
import { MOODS } from "../lib/constants";
import { todayKey, fmtTime, uid } from "../lib/utils";
import { useGarminSleepByDate } from "../lib/sleepMapApi";
import { suggestHabits, weekStartKey } from "../lib/habitSuggest";
import { S } from "../lib/styles";
import { Card, Lbl, Mini } from "./ui";
import { ContributionGrid } from "./ContributionGrid";
import { WeekPlanSec } from "./WeekPlanSec";

export function TodayView({ day, u, toggleHabit, allData, calEvents, fetchCalendar, calLoading, calError, googleConnected, addEntry, removeEntry, global, saveGlobal, setSub, sub }) {
  const [newHabitText, setNewHabitText] = useState("");
  const garminSleep = useGarminSleepByDate();
  const lastNightSleep = garminSleep?.[todayKey()];

  if (sub === "weekplan") return <WeekPlanSec global={global} saveGlobal={saveGlobal} setSub={setSub} />;

  const wk = weekStartKey();
  const weekPlan = (global.weeklyPlans || {})[wk];
  const isSunday = new Date().getDay() === 0;
  const todaysMatch = (global.matches || []).find(m => m.date === todayKey());
  const habits = suggestHabits({ weekPlan, hasMatchToday: Boolean(todaysMatch || day.match) });
  const customHabits = day.customHabits || [];
  const habitsDone = habits.filter(h => day.habits[h.id]).length + customHabits.filter(h => day.habits[h.id]).length;
  const habitsTotal = habits.length + customHabits.length;

  const addCustomHabit = () => {
    if (!newHabitText.trim()) return;
    u("customHabits", null, [...customHabits, { id: uid(), text: newHabitText.trim() }]);
    setNewHabitText("");
  };
  const removeCustomHabit = (id) => u("customHabits", null, customHabits.filter(h => h.id !== id));

  const pastMatchNoLog = (global.matches || []).filter(m => m.date < todayKey() && m.status !== "done").sort((a, b) => b.date.localeCompare(a.date))[0];

  return (
    <div>
      {!weekPlan && (
        <button onClick={() => setSub("weekplan")} style={{ ...S.navC, borderColor: "#a78bfa33", background: "#a78bfa0d" }}>
          <span style={{ fontSize: 18 }}>🗓️</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#e5e7eb" }}>{isSunday ? "Toca planificar la setmana" : "Encara no has planificat aquesta setmana"}</div>
            <div style={{ fontSize: 10, color: "#6b7280" }}>Defineix objectius per rebre hàbits suggerits</div>
          </div>
          <span style={{ color: "#444" }}>→</span>
        </button>
      )}

      {todaysMatch && (
        <Card style={{ borderColor: "#f59e0b33", background: "#f59e0b0d" }}>
          <Lbl>⚽ Partit avui</Lbl>
          <div style={{ fontSize: 13, color: "#e5e7eb", fontWeight: 600 }}>{todaysMatch.teams || "Partit"}</div>
          <div style={{ fontSize: 11, color: "#8a919c", marginTop: 2 }}>{todaysMatch.competition} {todaysMatch.time ? `· ${todaysMatch.time}` : ""}</div>
          {todaysMatch.preNotes && <p style={{ fontSize: 11, color: "#e5e7eb", marginTop: 8, whiteSpace: "pre-wrap" }}>{todaysMatch.preNotes}</p>}
        </Card>
      )}

      {pastMatchNoLog && (
        <button onClick={() => setSub(null)} style={{ ...S.navC, borderColor: "#ef444433", background: "#ef44440d" }}>
          <span style={{ fontSize: 18 }}>📝</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#e5e7eb" }}>Tens un partit pendent de valorar</div>
            <div style={{ fontSize: 10, color: "#6b7280" }}>{pastMatchNoLog.teams} — {pastMatchNoLog.date}. Registra'l a Arbitratge → Partits.</div>
          </div>
        </button>
      )}

      <Card><Lbl>Focus principal d'avui</Lbl><textarea style={S.ta} value={day.focus || ""} onChange={e => u("focus", null, e.target.value)} placeholder="Una frase. El que importa avui." rows={2} /></Card>

      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <Lbl m0>Agenda d'avui</Lbl>
          <button onClick={fetchCalendar} style={S.smBtn}>{calLoading ? "..." : googleConnected ? "Sincronitzar" : "Connectar"}</button>
        </div>
        {calError && <p style={{ ...S.muted, color: "#ef4444" }}>{calError}</p>}
        {!calEvents && !calError && <p style={S.muted}>Prem connectar per carregar Google + Apple Calendar.</p>}
        {calEvents?.filter(e => e.start?.includes(todayKey())).map((e, i) => (
          <div key={i} style={S.evRow}><span style={{ fontSize: 11, color: "#4ade80", fontFamily: "monospace", minWidth: 44 }}>{fmtTime(e.start)}</span><span style={{ fontSize: 12, color: "#e5e7eb" }}>{e.title}</span></div>
        ))}
        {calEvents?.filter(e => e.start?.includes(todayKey())).length === 0 && <p style={S.muted}>Cap event avui.</p>}
      </Card>

      <div style={S.g2}>
        <Mini label="Pantalla" value={day.screen.total ? day.screen.total + "'" : "—"} color="#f59e0b" />
        <Mini label="Xarxes" value={day.screen.social ? day.screen.social + "'" : "—"} color={parseInt(day.screen.social) > 20 ? "#ef4444" : "#4ade80"} />
        <Mini label="Son" value={lastNightSleep?.hours ? lastNightSleep.hours.toFixed(1) + "h" : "—"} color="#818cf8" />
        <Mini label="Estat" value={day.mood ? MOODS.find(m => m.id === day.mood)?.emoji || "—" : "—"} color="#e5e7eb" />
      </div>

      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <Lbl m0>Hàbits {habitsTotal ? `(${habitsDone}/${habitsTotal})` : ""}</Lbl>
        </div>
        {habits.map(h => (
          <button key={h.id} onClick={() => toggleHabit(h.id)} style={{ ...S.habBtn, background: day.habits[h.id] ? "rgba(74,222,128,0.07)" : "transparent", borderColor: day.habits[h.id] ? "rgba(74,222,128,0.22)" : "#252a30" }}>
            <span style={{ ...S.chk, background: day.habits[h.id] ? "#4ade80" : "#252a30", color: day.habits[h.id] ? "#000" : "#444" }}>{day.habits[h.id] ? "✓" : ""}</span>
            <span style={{ fontSize: 12, color: day.habits[h.id] ? "#a7f3d0" : "#888" }}>{h.text}</span>
          </button>
        ))}
        {customHabits.map(h => (
          <div key={h.id} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <button onClick={() => toggleHabit(h.id)} style={{ ...S.habBtn, flex: 1, background: day.habits[h.id] ? "rgba(74,222,128,0.07)" : "transparent", borderColor: day.habits[h.id] ? "rgba(74,222,128,0.22)" : "#252a30" }}>
              <span style={{ ...S.chk, background: day.habits[h.id] ? "#4ade80" : "#252a30", color: day.habits[h.id] ? "#000" : "#444" }}>{day.habits[h.id] ? "✓" : ""}</span>
              <span style={{ fontSize: 12, color: day.habits[h.id] ? "#a7f3d0" : "#888" }}>{h.text}</span>
            </button>
            <button onClick={() => removeCustomHabit(h.id)} style={{ ...S.delBtn, fontSize: 14 }}>×</button>
          </div>
        ))}
        <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
          <input style={{ ...S.inp, flex: 1, fontSize: 12 }} value={newHabitText} onChange={e => setNewHabitText(e.target.value)} placeholder="+ afegir hàbit d'avui..." onKeyDown={e => e.key === "Enter" && addCustomHabit()} />
          <button onClick={addCustomHabit} style={S.smBtn}>Afegir</button>
        </div>
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
