import { useState } from "react";
import { HABIT_POOL, MOODS } from "../lib/constants";
import { habitColor, fmtDate, todayKey } from "../lib/utils";
import { useGarminSleepByDate } from "../lib/sleepMapApi";
import { S } from "../lib/styles";
import { Card, Lbl, Title } from "./ui";

function TrendChart({ allData }) {
  const n = 30;
  const today = new Date();
  const cells = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today); d.setDate(d.getDate() - i);
    const dk = d.toISOString().split("T")[0];
    const dd = allData[dk];
    const total = HABIT_POOL.length + (dd?.customHabits || []).length;
    const habitsN = dd?.habits ? [...HABIT_POOL, ...(dd.customHabits || [])].filter(h => dd.habits[h.id]).length : -1;
    const mood = dd?.mood ? MOODS.find(m => m.id === dd.mood) : null;
    cells.push({ dk, habitsN, total, mood });
  }
  const maxH = 30;
  return (
    <Card>
      <Lbl>Hàbits · últims 30 dies</Lbl>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: maxH, marginBottom: 12 }}>
        {cells.map(c => (
          <div key={c.dk} title={`${c.dk} · ${c.habitsN >= 0 ? c.habitsN + "/" + c.total : "sense dades"}`}
            style={{ flex: 1, height: c.habitsN < 0 ? 3 : Math.max(3, (c.habitsN / Math.max(1, c.total)) * maxH), background: habitColor(c.habitsN), borderRadius: 1 }} />
        ))}
      </div>
      <Lbl>Estat d'ànim · últims 30 dies</Lbl>
      <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
        {cells.map(c => (
          <div key={c.dk} title={`${c.dk} · ${c.mood ? c.mood.label : "sense dades"}`}
            style={{ flex: 1, height: 10, borderRadius: 5, background: c.mood ? c.mood.color : "#ffffff" }} />
        ))}
      </div>
    </Card>
  );
}

function DayDetail({ dk, dd, onBack }) {
  const garminSleep = useGarminSleepByDate();
  const sleepThatDay = garminSleep?.[dk];
  const allHabits = [...HABIT_POOL, ...(dd.customHabits || [])];
  const habitsDone = dd.habits ? allHabits.filter(h => dd.habits[h.id]).length : 0;
  const habitsTotal = allHabits.length;
  const mood = dd.mood ? MOODS.find(m => m.id === dd.mood) : null;
  return (
    <div>
      <button onClick={onBack} style={S.back}>← Historial</button>
      <div style={{ ...S.title, textTransform: "capitalize" }}>{fmtDate(new Date(dk + "T12:00"))}</div>

      <div style={S.g2}>
        <div style={S.mini}><div style={{ fontSize: 9, color: "#8a7f74" }}>Hàbits</div><div style={{ fontSize: 18, fontWeight: 700, color: habitsDone === habitsTotal && habitsTotal > 0 ? "#c4855a" : "#2a2420" }}>{habitsDone}/{habitsTotal}</div></div>
        <div style={S.mini}><div style={{ fontSize: 9, color: "#8a7f74" }}>Estat</div><div style={{ fontSize: 18, fontWeight: 700 }}>{mood ? mood.emoji : "—"}</div></div>
      </div>

      {dd.focus && <Card><Lbl>Focus</Lbl><p style={{ fontSize: 12, color: "#2a2420", margin: 0 }}>{dd.focus}</p></Card>}

      <Card>
        <Lbl>Hàbits</Lbl>
        {allHabits.map(h => (
          <div key={h.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "3px 0" }}>
            <span style={{ ...S.chk, width: 16, height: 16, fontSize: 9, background: dd.habits?.[h.id] ? "#c4855a" : "#ede8e3", color: dd.habits?.[h.id] ? "#000" : "#b6aa9e" }}>{dd.habits?.[h.id] ? "✓" : ""}</span>
            <span style={{ fontSize: 11, color: dd.habits?.[h.id] ? "#4f8f74" : "#8a7f74" }}>{h.text}</span>
          </div>
        ))}
      </Card>

      {mood && (
        <Card>
          <Lbl>Benestar</Lbl>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: dd.feelings?.length ? 8 : 0 }}>
            <span style={{ fontSize: 18 }}>{mood.emoji}</span><span style={{ fontSize: 12, color: mood.color }}>{mood.label}</span>
          </div>
          {dd.feelings?.length > 0 && <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>{dd.feelings.map(f => <span key={f} style={{ ...S.chip, background: "#c4855a22", color: "#c4855a", borderColor: "#c4855a44" }}>{f}</span>)}</div>}
          {dd.moodNote && <p style={{ fontSize: 11, color: "#8a7f74", marginTop: 8 }}>{dd.moodNote}</p>}
        </Card>
      )}

      <div style={S.g2}>
        <div style={S.mini}><div style={{ fontSize: 9, color: "#8a7f74" }}>Pantalla</div><div style={{ fontSize: 16, fontWeight: 700 }}>{dd.screen?.total ? dd.screen.total + "'" : "—"}</div></div>
        <div style={S.mini}><div style={{ fontSize: 9, color: "#8a7f74" }}>Son</div><div style={{ fontSize: 16, fontWeight: 700 }}>{sleepThatDay?.hours ? sleepThatDay.hours.toFixed(1) + "h" : "—"}</div></div>
      </div>

      {dd.match && (
        <Card style={{ borderLeft: "3px solid #f59e0b" }}>
          <Lbl>Partit</Lbl>
          <p style={{ fontSize: 12, color: "#2a2420", margin: 0 }}>{dd.match.teams || "Partit registrat"}{dd.match.category ? ` · ${dd.match.category}` : ""}</p>
          {dd.match.rating && <p style={{ fontSize: 11, color: "#f59e0b", marginTop: 4 }}>Autoavaluació global: {dd.match.rating}/10</p>}
        </Card>
      )}

      <Card>
        <Lbl>Registres</Lbl>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, fontSize: 11, color: "#8a7f74" }}>
          <span>🏃 {(dd.training || []).filter(t => t.category === "physical").length} físic</span>
          <span>🧠 {(dd.cognitive || []).length} cognitiu</span>
          <span>🎬 {(dd.video || []).length} vídeo</span>
          <span>👥 {(dd.social || []).length} social</span>
          <span>💼 {(dd.work || []).length} feina</span>
        </div>
      </Card>

      {dd.reflection && <Card><Lbl>Reflexió</Lbl><p style={{ fontSize: 12, color: "#2a2420", margin: 0 }}>{dd.reflection}</p></Card>}
    </div>
  );
}

export function HistoryView({ allData, setSub }) {
  const [selDay, setSelDay] = useState(null);

  const days = Object.keys(allData).sort().reverse();

  if (selDay) return <DayDetail dk={selDay} dd={allData[selDay]} onBack={() => setSelDay(null)} />;

  return (
    <div>
      <button onClick={() => setSub(null)} style={S.back}>← Avui</button>
      <Title>Historial</Title>

      <TrendChart allData={allData} />

      <Lbl>Tots els dies</Lbl>
      {days.length === 0 && <p style={{ ...S.muted, textAlign: "center", marginTop: 20 }}>Encara no hi ha dies registrats.</p>}
      {days.map(dk => {
        const dd = allData[dk];
        const dayHabits = [...HABIT_POOL, ...(dd.customHabits || [])];
        const habitsDone = dd.habits ? dayHabits.filter(h => dd.habits[h.id]).length : 0;
        const mood = dd.mood ? MOODS.find(m => m.id === dd.mood) : null;
        return (
          <button key={dk} onClick={() => setSelDay(dk)} style={S.navC}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#2a2420", textTransform: "capitalize" }}>{dk === todayKey() ? "Avui" : fmtDate(new Date(dk + "T12:00"))}</div>
              <div style={{ fontSize: 10, color: "#8a7f74" }}>{dk}</div>
            </div>
            <span style={{ fontSize: 16 }}>{mood ? mood.emoji : "—"}</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: habitColor(habitsDone), minWidth: 26, textAlign: "right" }}>{habitsDone}/{dayHabits.length}</span>
            <span style={{ color: "#b6aa9e" }}>→</span>
          </button>
        );
      })}
    </div>
  );
}
