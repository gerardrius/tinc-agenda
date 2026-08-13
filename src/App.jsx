import { useState, useEffect, useCallback } from "react";

/* ═══════ STORAGE LAYER ═══════
   Swap this for Supabase/Firebase when you're ready to scale.
   All reads/writes go through these two functions. */
const SK = "tincagenda-v3";
const storage = {
  get: () => { try { return JSON.parse(localStorage.getItem(SK)); } catch { return null; } },
  set: (data) => { try { localStorage.setItem(SK, JSON.stringify(data)); } catch {} },
};

/* ═══════ CONSTANTS ═══════ */
const todayKey = () => new Date().toISOString().split("T")[0];
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

const HABITS = [
  { id: "nophone_am", text: "20 min sense mòbil al llevar-me" },
  { id: "phone_out", text: "Mòbil fora de l'habitació" },
  { id: "social_20", text: "Xarxes ≤ 20 min" },
  { id: "no_screen_22", text: "Sense pantalles després 22:00" },
  { id: "notif_dm", text: "Només notif de DMs" },
  { id: "airplane_match", text: "Mode avió pre-partit" },
];

const WORK_AREAS = [
  { id: "desigual", name: "Desigual", color: "#60a5fa", icon: "💼" },
  { id: "datoinmo", name: "DatoInmo", color: "#f59e0b", icon: "🏠" },
  { id: "centres", name: "Centres benestar", color: "#a78bfa", icon: "🧘" },
];

const REF_SUBS = [
  { id: "matches", label: "Partits", icon: "⚽" },
  { id: "planner", label: "Pla 4 setmanes", icon: "📋" },
  { id: "physical", label: "Físic", icon: "🏃" },
  { id: "cognitive", label: "Cognitiu", icon: "🧠" },
  { id: "video", label: "Vídeo", icon: "🎬" },
  { id: "career", label: "Carrera", icon: "📈" },
];

const TABS = [
  { id: "today", icon: "◉", label: "Avui" },
  { id: "ref", icon: "⚽", label: "Arbitratge" },
  { id: "work", icon: "💼", label: "Feina" },
  { id: "life", icon: "♡", label: "Vida" },
  { id: "cal", icon: "📅", label: "Agenda" },
];

const MOODS = [
  { id: "great", label: "Molt bé", emoji: "😄", color: "#4ade80" },
  { id: "good", label: "Bé", emoji: "🙂", color: "#86efac" },
  { id: "ok", label: "Regular", emoji: "😐", color: "#fbbf24" },
  { id: "low", label: "Baix", emoji: "😔", color: "#f97316" },
  { id: "bad", label: "Molt baix", emoji: "😞", color: "#ef4444" },
];

const FEELINGS = ["Tranquil", "Agraït", "Motivat", "Content", "Energètic", "Cansat", "Estressat", "Ansiós", "Trist", "Irritable", "Aclaparat", "Indiferent"];

const TRAIN_TYPES_PLAN = [
  { id: "laws", label: "Lleis del joc", color: "#818cf8" },
  { id: "videotest", label: "Videotest", color: "#f472b6" },
  { id: "criteria", label: "Criteri / consideracions", color: "#fb923c" },
  { id: "physical", label: "Físic", color: "#60a5fa" },
  { id: "video_own", label: "Vídeo propi", color: "#34d399" },
  { id: "cognitive", label: "Cognitiu general", color: "#a78bfa" },
];

const EVENT_PRIORITIES = [
  { id: "critical", label: "Crític", color: "#ef4444", bg: "#ef444418" },
  { id: "important", label: "Important", color: "#f59e0b", bg: "#f59e0b18" },
  { id: "normal", label: "Normal", color: "#6b7280", bg: "#6b728012" },
];

const defaultDay = () => ({
  date: todayKey(), habits: {}, screen: { total: "", social: "", mac: "", iphone: "", notes: "" },
  sleep: { hours: "", quality: "", bedtime: "", waketime: "" }, training: [], work: [], social: [],
  match: null, video: [], cognitive: [], focus: "", reflection: "", careerNotes: "",
  mood: null, feelings: [], moodNote: "", reminders: [],
});

const defaultGlobal = () => ({ trainingPlan: [], workReminders: [], eventPriorities: {} });

/* ═══════ APP ═══════ */
export default function App() {
  const [tab, setTab] = useState("today");
  const [sub, setSub] = useState(null);
  const [allData, setAllData] = useState({});
  const [global, setGlobal] = useState(defaultGlobal());
  const [day, setDay] = useState(null);
  const [calEvents, setCalEvents] = useState(null);
  const [calLoading, setCalLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const raw = storage.get();
    if (raw) {
      const g = raw._global || defaultGlobal();
      const d = { ...raw }; delete d._global;
      setAllData(d); setGlobal(g);
      setDay(d[todayKey()] || defaultDay());
    } else { setDay(defaultDay()); }
    setLoading(false);
  }, []);

  const persist = useCallback((updated, gUpdated) => {
    const k = todayKey();
    const g = gUpdated || global;
    const next = { ...allData, [k]: updated, _global: g };
    setAllData({ ...allData, [k]: updated }); setGlobal(g); setDay(updated);
    storage.set(next);
  }, [allData, global]);

  const saveGlobal = useCallback((gUpdated) => {
    setGlobal(gUpdated);
    storage.set({ ...allData, [todayKey()]: day, _global: gUpdated });
  }, [allData, day]);

  const u = (section, field, val) => {
    const d = { ...day };
    if (field === null) d[section] = val;
    else d[section] = { ...(d[section] || {}), [field]: val };
    persist(d);
  };

  const toggleHabit = (id) => persist({ ...day, habits: { ...day.habits, [id]: !day.habits[id] } });

  const addEntry = (section, entry) => { const d = { ...day }; d[section] = [...(d[section] || []), { ...entry, id: uid() }]; persist(d); };
  const removeEntry = (section, id) => { const d = { ...day }; d[section] = d[section].filter(e => e.id !== id); persist(d); };
  const updateEntry = (section, id, field, val) => { const d = { ...day }; d[section] = d[section].map(e => e.id === id ? { ...e, [field]: val } : e); persist(d); };

  /* ── Google Calendar fetch ──
     Per fer servir això, necessites una API key o OAuth.
     Ara mateix és un placeholder — configura VITE_GCAL_API_KEY al .env
     o substitueix per la teva integració preferida. */
  const fetchCalendar = async () => {
    setCalLoading(true);
    try {
      const apiKey = import.meta.env.VITE_GCAL_API_KEY;
      const calId = import.meta.env.VITE_GCAL_ID || 'primary';
      if (!apiKey) {
        // Demo mode: show placeholder
        setCalEvents([]);
        setCalLoading(false);
        return;
      }
      const now = new Date().toISOString();
      const future = new Date(Date.now() + 14 * 86400000).toISOString();
      const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calId)}/events?key=${apiKey}&timeMin=${now}&timeMax=${future}&singleEvents=true&orderBy=startTime&maxResults=50`;
      const res = await fetch(url);
      const data = await res.json();
      const events = (data.items || []).map(e => ({
        title: e.summary || "Event",
        start: e.start?.dateTime || e.start?.date || "",
        end: e.end?.dateTime || e.end?.date || "",
        location: e.location || "",
        description: e.description || "",
      }));
      setCalEvents(events);
    } catch { setCalEvents([]); }
    setCalLoading(false);
  };

  if (loading || !day) return <div style={S.loadWrap}><p style={{ color: "#6b7280" }}>Carregant...</p></div>;

  const habitsDone = HABITS.filter(h => day.habits[h.id]).length;

  return (
    <div style={S.app}>
      <div style={S.header} className="app-header">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={S.logo}>Tinc Agenda</div>
            <div style={S.dateLabel}>{fmtDate(new Date())}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: habitsDone === 6 ? "#4ade80" : "#e5e7eb" }}>{habitsDone}/6</div>
            <div style={{ fontSize: 8, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.1em" }}>hàbits</div>
          </div>
        </div>
      </div>

      <div style={S.body}>
        {tab === "today" && <TodayView {...{ day, u, toggleHabit, habitsDone, allData, calEvents, fetchCalendar, calLoading, addEntry, removeEntry, updateEntry }} />}
        {tab === "ref" && <RefView {...{ day, sub, setSub, u, addEntry, removeEntry, updateEntry, persist, global, saveGlobal }} />}
        {tab === "work" && <WorkView {...{ day, addEntry, removeEntry, updateEntry, global, saveGlobal }} />}
        {tab === "life" && <LifeView {...{ day, u, addEntry, removeEntry, updateEntry }} />}
        {tab === "cal" && <CalView {...{ calEvents, fetchCalendar, calLoading, global, saveGlobal }} />}
      </div>

      <div style={S.tabBar} className="app-tabbar">
        {TABS.map(t => (
          <button key={t.id} onClick={() => { setTab(t.id); setSub(null); }} style={{ ...S.tabBtn, color: tab === t.id ? "#4ade80" : "#555" }}>
            <span style={{ fontSize: 16 }}>{t.icon}</span>
            <span style={{ fontSize: 8, marginTop: 1 }}>{t.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ═══════ AVUI ═══════ */
function TodayView({ day, u, toggleHabit, habitsDone, allData, calEvents, fetchCalendar, calLoading, addEntry, removeEntry }) {
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

      <Card><Lbl>Reflexió</Lbl><textarea style={S.ta} value={day.reflection || ""} onChange={e => u("reflection", null, e.target.value)} placeholder="He complert el focus? Què ajusto demà?" rows={2} /></Card>
    </div>
  );
}

/* ═══════ CONTRIBUTION GRID ═══════ */
function ContributionGrid({ allData }) {
  const weeks = 12;
  const today = new Date();
  const dow = (today.getDay() + 6) % 7;
  const start = new Date(today); start.setDate(start.getDate() - (weeks * 7 - 1) - dow);
  const cells = [];
  for (let i = 0; i < weeks * 7 + dow + 1; i++) {
    const d = new Date(start); d.setDate(d.getDate() + i);
    const dk = d.toISOString().split("T")[0];
    if (d > today) { cells.push({ dk, score: -1 }); continue; }
    const hd = allData[dk]?.habits;
    cells.push({ dk, score: hd ? HABITS.filter(h => hd[h.id]).length : -1 });
  }
  const cols = [];
  for (let w = 0; w < Math.ceil(cells.length / 7); w++) cols.push(cells.slice(w * 7, w * 7 + 7));
  const days = ["Dl", "", "Dc", "", "Dv", "", ""];

  return (
    <div style={{ overflowX: "auto" }}>
      <div style={{ display: "flex", gap: 2, minWidth: cols.length * 14 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 2, marginRight: 2 }}>
          {days.map((d, i) => <div key={i} style={{ width: 14, height: 12, fontSize: 7, color: "#555", display: "flex", alignItems: "center" }}>{d}</div>)}
        </div>
        {cols.map((week, wi) => (
          <div key={wi} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {week.map((c, di) => (
              <div key={di} style={{ width: 12, height: 12, borderRadius: 2, background: c.score === -1 ? "#161a1e" : c.score === 0 ? "#1a1d21" : c.score <= 2 ? "#14532d" : c.score <= 4 ? "#166534" : c.score <= 5 ? "#22c55e" : "#4ade80" }} title={c.dk} />
            ))}
          </div>
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 3, marginTop: 6 }}>
        <span style={{ fontSize: 8, color: "#555" }}>Menys</span>
        {["#1a1d21", "#14532d", "#166534", "#22c55e", "#4ade80"].map((c, i) => <div key={i} style={{ width: 10, height: 10, borderRadius: 2, background: c }} />)}
        <span style={{ fontSize: 8, color: "#555" }}>Més</span>
      </div>
    </div>
  );
}

/* ═══════ ARBITRATGE ═══════ */
function RefView({ day, sub, setSub, u, addEntry, removeEntry, updateEntry, persist, global, saveGlobal }) {
  if (!sub) return (<div><Title>Arbitratge</Title>{REF_SUBS.map(s => (
    <button key={s.id} onClick={() => setSub(s.id)} style={S.navC}>
      <span style={{ fontSize: 18 }}>{s.icon}</span>
      <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 600, color: "#e5e7eb" }}>{s.label}</div><div style={{ fontSize: 10, color: "#6b7280" }}>{refSub(s.id, day, global)}</div></div>
      <span style={{ color: "#444" }}>→</span>
    </button>))}</div>);

  return (<div><button onClick={() => setSub(null)} style={S.back}>← Arbitratge</button>
    {sub === "matches" && <MatchSec day={day} persist={persist} />}
    {sub === "planner" && <PlannerSec global={global} saveGlobal={saveGlobal} />}
    {sub === "physical" && <PhysSec day={day} addEntry={addEntry} removeEntry={removeEntry} updateEntry={updateEntry} />}
    {sub === "cognitive" && <CogSec day={day} addEntry={addEntry} removeEntry={removeEntry} updateEntry={updateEntry} />}
    {sub === "video" && <VidSec day={day} addEntry={addEntry} removeEntry={removeEntry} updateEntry={updateEntry} />}
    {sub === "career" && <CarSec day={day} u={u} />}
  </div>);
}

function PlannerSec({ global, saveGlobal }) {
  const plan = global.trainingPlan || [];
  const [selDate, setSelDate] = useState(null);
  const today = new Date();
  const dow = (today.getDay() + 6) % 7;
  const monday = new Date(today); monday.setDate(monday.getDate() - dow);
  const weeks = [];
  for (let w = 0; w < 4; w++) { const wd = []; for (let d = 0; d < 7; d++) { const dt = new Date(monday); dt.setDate(dt.getDate() + w * 7 + d); wd.push(dt.toISOString().split("T")[0]); } weeks.push(wd); }
  const dn = ["Dl", "Dm", "Dc", "Dj", "Dv", "Ds", "Dg"];
  const add = (dk, typeId) => saveGlobal({ ...global, trainingPlan: [...plan, { id: uid(), date: dk, type: typeId }] });
  const rem = (id) => saveGlobal({ ...global, trainingPlan: plan.filter(p => p.id !== id) });

  return (<div><Title>Pla de 4 setmanes</Title><p style={{ fontSize: 11, color: "#6b7280", marginBottom: 14 }}>Planifica sessions. Prem un dia per afegir.</p>
    {weeks.map((wd, wi) => { const ws = new Date(wd[0] + "T12:00"), we = new Date(wd[6] + "T12:00"); return (
      <div key={wi} style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: "#8a919c", marginBottom: 6 }}>Setmana {wi + 1} · {ws.getDate()}/{ws.getMonth()+1} - {we.getDate()}/{we.getMonth()+1}</div>
        <div style={{ display: "flex", gap: 3 }}>
          {wd.map((dk, di) => { const items = plan.filter(p => p.date === dk); const isT = dk === todayKey(); const past = dk < todayKey(); return (
            <button key={dk} onClick={() => setSelDate(selDate === dk ? null : dk)} style={{ flex: 1, padding: "4px 2px", borderRadius: 6, border: isT ? "2px solid #4ade80" : selDate === dk ? "2px solid #60a5fa" : "1px solid #222830", background: past ? "#0d0f11" : "#141719", cursor: "pointer", textAlign: "center", opacity: past ? 0.5 : 1, minHeight: 52 }}>
              <div style={{ fontSize: 8, color: isT ? "#4ade80" : "#6b7280", fontWeight: isT ? 700 : 400 }}>{dn[di]}</div>
              <div style={{ fontSize: 10, color: "#8a919c", marginBottom: 2 }}>{new Date(dk + "T12:00").getDate()}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 1, alignItems: "center" }}>{items.map(it => { const tp = TRAIN_TYPES_PLAN.find(t => t.id === it.type); return <div key={it.id} style={{ width: 8, height: 8, borderRadius: 2, background: tp?.color || "#555" }} />; })}</div>
            </button>); })}
        </div>
        {wd.includes(selDate) && selDate >= todayKey() && (
          <div style={{ ...S.card, marginTop: 6, borderColor: "#60a5fa33" }}>
            <div style={{ fontSize: 11, color: "#60a5fa", marginBottom: 8, fontWeight: 600 }}>{fmtDate(new Date(selDate + "T12:00"))}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 8 }}>{TRAIN_TYPES_PLAN.map(tp => (
              <button key={tp.id} onClick={() => add(selDate, tp.id)} style={{ ...S.chip, borderColor: tp.color + "44", color: tp.color, background: tp.color + "15" }}>+ {tp.label}</button>
            ))}</div>
            {plan.filter(p => p.date === selDate).map(it => { const tp = TRAIN_TYPES_PLAN.find(t => t.id === it.type); return (
              <div key={it.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0", borderBottom: "1px solid #1c2127" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}><div style={{ width: 8, height: 8, borderRadius: 2, background: tp?.color }} /><span style={{ fontSize: 12, color: "#e5e7eb" }}>{tp?.label}</span></div>
                <button onClick={() => rem(it.id)} style={{ ...S.delBtn, fontSize: 14 }}>×</button>
              </div>); })}
          </div>
        )}
      </div>); })}
    <Card><Lbl>Llegenda</Lbl><div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>{TRAIN_TYPES_PLAN.map(tp => (
      <div key={tp.id} style={{ display: "flex", alignItems: "center", gap: 4 }}><div style={{ width: 10, height: 10, borderRadius: 2, background: tp.color }} /><span style={{ fontSize: 10, color: "#8a919c" }}>{tp.label}</span></div>
    ))}</div></Card>
  </div>);
}

function MatchSec({ day, persist }) {
  const m = day.match;
  const setM = () => persist({ ...day, match: { category: "", role: "", teams: "", rating: "", positioning: "", communication: "", keyDecisions: "", mistakes: "", strengths: "", notes: "" } });
  const um = (f, v) => persist({ ...day, match: { ...day.match, [f]: v } });
  const roles = ["Principal", "Assistent 1", "Assistent 2", "4t àrbitre", "VAR"];
  if (!m) return (<div><Title>Partits</Title><div style={{ textAlign: "center", marginTop: 40 }}><p style={S.muted}>Has arbitrat avui?</p><button onClick={setM} style={S.pBtn}>Registrar partit</button></div></div>);
  return (<div><Title>Partit d'avui</Title>
    <Card><Inp label="Categoria" value={m.category} onChange={v => um("category", v)} ph="1a RFEF, 2a Divisió..." /><Inp label="Equips" value={m.teams} onChange={v => um("teams", v)} ph="Local vs Visitant" /><Lbl>Rol</Lbl><Chips opts={roles} val={m.role} set={v => um("role", v)} c="#f59e0b" /></Card>
    <Card><Lbl>Autoavaluació</Lbl><Rating l="Global" v={m.rating} set={v => um("rating", v)} /><Rating l="Posicionament" v={m.positioning} set={v => um("positioning", v)} /><Rating l="Comunicació" v={m.communication} set={v => um("communication", v)} /></Card>
    <Card><Lbl>Decisions clau</Lbl><textarea style={S.ta} value={m.keyDecisions||""} onChange={e => um("keyDecisions", e.target.value)} placeholder="Penals, vermelles, avantatges..." rows={3} /><Lbl>Errors</Lbl><textarea style={S.ta} value={m.mistakes||""} onChange={e => um("mistakes", e.target.value)} placeholder="Què he fallat?" rows={2} /><Lbl>Encerts</Lbl><textarea style={S.ta} value={m.strengths||""} onChange={e => um("strengths", e.target.value)} placeholder="Què he fet bé?" rows={2} /><Lbl>Notes</Lbl><textarea style={S.ta} value={m.notes||""} onChange={e => um("notes", e.target.value)} placeholder="Ambient, delegat..." rows={2} /></Card>
  </div>);
}

function PhysSec({ day, addEntry, removeEntry, updateEntry }) {
  const types = ["Cursa contínua", "Intervals/HIIT", "Sèries", "Força", "Complementari", "Mobilitat", "Recuperació"];
  return (<div><Title>Físic</Title><button onClick={() => addEntry("training", { type: "", duration: "", rpe: "", details: "", category: "physical" })} style={S.pBtn}>+ Sessió</button>
    {day.training.filter(t => t.category === "physical").map(t => (<Card key={t.id}><div style={{ display: "flex", justifyContent: "space-between" }}><Lbl>Sessió</Lbl><button onClick={() => removeEntry("training", t.id)} style={S.delBtn}>×</button></div><Chips opts={types} val={t.type} set={v => updateEntry("training", t.id, "type", v)} c="#60a5fa" /><Inp label="Durada (min)" value={t.duration} onChange={v => updateEntry("training", t.id, "duration", v)} type="number" /><Lbl>RPE</Lbl><RPE val={t.rpe} set={v => updateEntry("training", t.id, "rpe", v)} /><textarea style={{...S.ta,marginTop:6}} value={t.details||""} onChange={e => updateEntry("training", t.id, "details", e.target.value)} placeholder="Detalls..." rows={2} /></Card>))}
    {day.training.filter(t => t.category === "physical").length === 0 && <p style={{ ...S.muted, textAlign: "center", marginTop: 20 }}>Cap sessió avui.</p>}
  </div>);
}

function CogSec({ day, addEntry, removeEntry, updateEntry }) {
  const types = ["Vídeo-anàlisi", "Atenció/retenció", "Reglament", "Simulació", "FIFA Red", "Formació"];
  return (<div><Title>Cognitiu</Title><button onClick={() => addEntry("cognitive", { type: "", duration: "", focus: "", notes: "" })} style={S.pBtn}>+ Sessió</button>
    {(day.cognitive||[]).map(c => (<Card key={c.id}><div style={{ display: "flex", justifyContent: "space-between" }}><Lbl>Sessió</Lbl><button onClick={() => removeEntry("cognitive", c.id)} style={S.delBtn}>×</button></div><Chips opts={types} val={c.type} set={v => updateEntry("cognitive", c.id, "type", v)} c="#a78bfa" /><Inp label="Durada (min)" value={c.duration} onChange={v => updateEntry("cognitive", c.id, "duration", v)} type="number" /><Inp label="Focus" value={c.focus} onChange={v => updateEntry("cognitive", c.id, "focus", v)} ph="Avantatges, mans àrea..." /><textarea style={{...S.ta,marginTop:6}} value={c.notes||""} onChange={e => updateEntry("cognitive", c.id, "notes", e.target.value)} placeholder="Aprenentatges..." rows={2} /></Card>))}
    {(day.cognitive||[]).length === 0 && <p style={{ ...S.muted, textAlign: "center", marginTop: 20 }}>Cap sessió avui.</p>}
  </div>);
}

function VidSec({ day, addEntry, removeEntry, updateEntry }) {
  return (<div><Title>Vídeo-anàlisi</Title><button onClick={() => addEntry("video", { match: "", duration: "", situations: "", learnings: "" })} style={S.pBtn}>+ Sessió</button>
    {(day.video||[]).map(v => (<Card key={v.id}><div style={{ display: "flex", justifyContent: "space-between" }}><Lbl>Sessió</Lbl><button onClick={() => removeEntry("video", v.id)} style={S.delBtn}>×</button></div><Inp label="Partit" value={v.match} onChange={val => updateEntry("video", v.id, "match", val)} ph="El meu J5..." /><Inp label="Durada (min)" value={v.duration} onChange={val => updateEntry("video", v.id, "duration", val)} type="number" /><Lbl>Situacions</Lbl><textarea style={S.ta} value={v.situations||""} onChange={e => updateEntry("video", v.id, "situations", e.target.value)} placeholder="Penal min 34..." rows={3} /><Lbl>Conclusions</Lbl><textarea style={S.ta} value={v.learnings||""} onChange={e => updateEntry("video", v.id, "learnings", e.target.value)} placeholder="Patrons, correccions..." rows={2} /></Card>))}
    {(day.video||[]).length === 0 && <p style={{ ...S.muted, textAlign: "center", marginTop: 20 }}>Cap sessió avui.</p>}
  </div>);
}

function CarSec({ day, u }) {
  return (<div><Title>Carrera</Title><Card style={{ borderLeft: "3px solid #f59e0b" }}><div style={{ fontSize: 13, fontWeight: 700, color: "#f59e0b", marginBottom: 4 }}>Objectiu</div><p style={{ fontSize: 12, color: "#d1d5db", margin: 0 }}>Pujar a 2a Divisió com a professional</p></Card><Card><Lbl>Notes de carrera</Lbl><textarea style={S.ta} value={day.careerNotes||""} onChange={e => u("careerNotes", null, e.target.value)} placeholder="Feedback delegats, comitè..." rows={4} /></Card></div>);
}

/* ═══════ FEINA ═══════ */
function WorkView({ day, addEntry, removeEntry, updateEntry, global, saveGlobal }) {
  const wr = global.workReminders || [];
  return (<div><Title>Feina</Title>
    <Card>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}><Lbl m0>Recordatoris de feina</Lbl><button onClick={() => saveGlobal({ ...global, workReminders: [...wr, { id: uid(), text: "", done: false }] })} style={S.smBtn}>+ Nou</button></div>
      {wr.map(r => (<div key={r.id} style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 4 }}>
        <button onClick={() => saveGlobal({ ...global, workReminders: wr.map(x => x.id === r.id ? { ...x, done: !x.done } : x) })} style={{ ...S.chk, width: 18, height: 18, fontSize: 10, background: r.done ? "#60a5fa" : "#252a30", color: r.done ? "#000" : "#444", border: "none", cursor: "pointer" }}>{r.done ? "✓" : ""}</button>
        <input style={{ ...S.inp, flex: 1, fontSize: 12, opacity: r.done ? 0.4 : 1, textDecoration: r.done ? "line-through" : "none" }} value={r.text} onChange={e => saveGlobal({ ...global, workReminders: wr.map(x => x.id === r.id ? { ...x, text: e.target.value } : x) })} placeholder="Recordatori..." />
        <button onClick={() => saveGlobal({ ...global, workReminders: wr.filter(x => x.id !== r.id) })} style={{ ...S.delBtn, fontSize: 14 }}>×</button>
      </div>))}
      {wr.length === 0 && <p style={S.muted}>Afegeix recordatoris de tasques.</p>}
    </Card>
    {WORK_AREAS.map(area => { const entries = (day.work || []).filter(w => w.area === area.id); return (
      <div key={area.id} style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}><span>{area.icon}</span><span style={{ fontSize: 13, fontWeight: 600, color: area.color }}>{area.name}</span></div>
          <button onClick={() => addEntry("work", { area: area.id, task: "", minutes: "", status: "doing", notes: "" })} style={{ ...S.smBtn, borderColor: area.color, color: area.color }}>+ Tasca</button>
        </div>
        {entries.map(w => (<Card key={w.id}><div style={{ display: "flex", justifyContent: "space-between" }}><Chips opts={["doing","done","blocked"]} labels={["En curs","Fet","Bloquejat"]} val={w.status} set={v => updateEntry("work", w.id, "status", v)} c={area.color} /><button onClick={() => removeEntry("work", w.id)} style={S.delBtn}>×</button></div><Inp label="Tasca" value={w.task} onChange={v => updateEntry("work", w.id, "task", v)} ph="Què has fet?" /><Inp label="Minuts" value={w.minutes} onChange={v => updateEntry("work", w.id, "minutes", v)} type="number" /></Card>))}
        {entries.length === 0 && <p style={{ ...S.muted, marginLeft: 24 }}>Sense registres avui.</p>}
      </div>); })}
  </div>);
}

/* ═══════ VIDA ═══════ */
function LifeView({ day, u, addEntry, removeEntry, updateEntry }) {
  const [lt, setLt] = useState("mood");
  const lifeTabs = [{ id: "mood", label: "Benestar" }, { id: "social", label: "Social" }, { id: "screen", label: "Pantalles" }, { id: "sleep", label: "Son" }];

  return (<div><Title>Vida</Title>
    <div style={{ display: "flex", gap: 3, marginBottom: 14 }}>{lifeTabs.map(t => (
      <button key={t.id} onClick={() => setLt(t.id)} style={{ ...S.subT, background: lt === t.id ? "rgba(74,222,128,0.1)" : "#141719", color: lt === t.id ? "#4ade80" : "#6b7280", borderColor: lt === t.id ? "rgba(74,222,128,0.2)" : "#222830" }}>{t.label}</button>
    ))}</div>

    {lt === "mood" && (<Card>
      <Lbl>Com et trobes ara?</Lbl>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 4, marginBottom: 12 }}>{MOODS.map(m => (
        <button key={m.id} onClick={() => u("mood", null, m.id)} style={{ flex: 1, padding: "8px 2px", borderRadius: 8, border: day.mood === m.id ? `2px solid ${m.color}` : "1px solid #222830", background: day.mood === m.id ? m.color + "18" : "#141719", cursor: "pointer", textAlign: "center" }}>
          <div style={{ fontSize: 20 }}>{m.emoji}</div><div style={{ fontSize: 8, color: day.mood === m.id ? m.color : "#6b7280", marginTop: 2 }}>{m.label}</div>
        </button>))}</div>
      <Lbl>Sentiments</Lbl>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 10 }}>{FEELINGS.map(f => (
        <button key={f} onClick={() => { const fl = day.feelings || []; u("feelings", null, fl.includes(f) ? fl.filter(x => x !== f) : [...fl, f]); }} style={{ ...S.chip, background: (day.feelings||[]).includes(f) ? "#4ade8022" : "#1a1d21", color: (day.feelings||[]).includes(f) ? "#4ade80" : "#6b7280", borderColor: (day.feelings||[]).includes(f) ? "#4ade8044" : "#222830" }}>{f}</button>
      ))}</div>
      <Lbl>Breu comentari</Lbl>
      <textarea style={S.ta} value={day.moodNote || ""} onChange={e => u("moodNote", null, e.target.value)} placeholder="Per què et sents així?" rows={2} />
    </Card>)}

    {lt === "social" && (<div>
      <button onClick={() => addEntry("social", { what: "", with: "", notes: "" })} style={S.pBtn}>+ Activitat social</button>
      {(day.social||[]).map(s => (<Card key={s.id}><div style={{ display: "flex", justifyContent: "space-between" }}><Lbl>Activitat</Lbl><button onClick={() => removeEntry("social", s.id)} style={S.delBtn}>×</button></div><Inp label="Què?" value={s.what} onChange={v => updateEntry("social", s.id, "what", v)} ph="Sopar, quedada..." /><Inp label="Amb qui?" value={s.with} onChange={v => updateEntry("social", s.id, "with", v)} ph="Amics, parella, família..." /><textarea style={S.ta} value={s.notes||""} onChange={e => updateEntry("social", s.id, "notes", e.target.value)} placeholder="Com ha anat?" rows={2} /></Card>))}
      {(day.social||[]).length === 0 && <p style={{ ...S.muted, textAlign: "center", marginTop: 20 }}>La vida social també és rendiment.</p>}
    </div>)}

    {lt === "screen" && (<div>
      <Card><Inp label="Pantalla total (min)" value={day.screen.total} onChange={v => u("screen", "total", v)} type="number" /><Inp label="Xarxes socials (min)" value={day.screen.social} onChange={v => u("screen", "social", v)} type="number" /><div style={S.g2}><Inp label="iPhone (min)" value={day.screen.iphone} onChange={v => u("screen", "iphone", v)} type="number" /><Inp label="Mac (min)" value={day.screen.mac} onChange={v => u("screen", "mac", v)} type="number" /></div><Lbl>Detonant</Lbl><textarea style={S.ta} value={day.screen.notes||""} onChange={e => u("screen", "notes", e.target.value)} placeholder="Avorriment, inèrcia..." rows={2} /></Card>
      {parseInt(day.screen.social) > 20 && <div style={{ border: "1px solid #ef444433", background: "#ef444408", borderRadius: 8, padding: "8px 12px", marginTop: 6 }}><p style={{ color: "#ef4444", fontSize: 11, margin: 0 }}>⚠️ Per sobre de 20 min en xarxes.</p></div>}
    </div>)}

    {lt === "sleep" && (<Card><Inp label="Hores dormides" value={day.sleep.hours} onChange={v => u("sleep", "hours", v)} type="number" /><Inp label="Anar a dormir" value={day.sleep.bedtime} onChange={v => u("sleep", "bedtime", v)} ph="22:30" /><Inp label="Llevar-te" value={day.sleep.waketime} onChange={v => u("sleep", "waketime", v)} ph="6:50" /><Lbl>Qualitat</Lbl><Chips opts={["Molt dolenta","Dolenta","Regular","Bona","Excel·lent"]} val={day.sleep.quality} set={v => u("sleep", "quality", v)} c="#818cf8" /></Card>)}
  </div>);
}

/* ═══════ AGENDA ═══════ */
function CalView({ calEvents, fetchCalendar, calLoading, global, saveGlobal }) {
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

/* ═══════ COMPONENTS ═══════ */
function Card({ children, style }) { return <div style={{ ...S.card, ...style }}>{children}</div>; }
function Lbl({ children, m0 }) { return <div style={{ ...S.lbl, ...(m0 ? { margin: 0 } : {}) }}>{children}</div>; }
function Title({ children }) { return <div style={S.title}>{children}</div>; }
function Mini({ label, value, color }) { return <div style={S.mini}><div style={{ fontSize: 9, color: "#6b7280" }}>{label}</div><div style={{ fontSize: 18, fontWeight: 700, color }}>{value}</div></div>; }
function Inp({ label, value, onChange, type = "text", ph }) { return <div style={{ marginBottom: 8 }}><Lbl>{label}</Lbl><input type={type} value={value||""} onChange={e => onChange(e.target.value)} placeholder={ph} style={S.inp} /></div>; }
function Chips({ opts, labels, val, set, c = "#4ade80" }) { return <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 8 }}>{opts.map((o, i) => (<button key={o} onClick={() => set(o)} style={{ ...S.chip, background: val === o ? c + "22" : "#1a1d21", color: val === o ? c : "#6b7280", borderColor: val === o ? c + "44" : "#222830" }}>{labels ? labels[i] : o}</button>))}</div>; }
function RPE({ val, set }) { return <div style={{ display: "flex", gap: 2, marginBottom: 8 }}>{[1,2,3,4,5,6,7,8,9,10].map(n => (<button key={n} onClick={() => set(String(n))} style={{ flex: 1, padding: "5px 0", borderRadius: 4, fontSize: 10, fontWeight: 600, cursor: "pointer", border: "none", fontFamily: "inherit", background: val === String(n) ? rpeC(n) : "#1a1d21", color: val === String(n) ? "#fff" : "#555" }}>{n}</button>))}</div>; }
function Rating({ l, v, set }) { return <div style={{ marginBottom: 8 }}><div style={{ fontSize: 10, color: "#8a919c", marginBottom: 3 }}>{l}</div><div style={{ display: "flex", gap: 2 }}>{[1,2,3,4,5,6,7,8,9,10].map(n => (<button key={n} onClick={() => set(String(n))} style={{ flex: 1, padding: "4px 0", borderRadius: 3, fontSize: 9, fontWeight: 600, cursor: "pointer", border: "none", fontFamily: "inherit", background: v === String(n) ? "#f59e0b" : "#1a1d21", color: v === String(n) ? "#fff" : "#555" }}>{n}</button>))}</div></div>; }

/* ═══════ UTILS ═══════ */
function rpeC(n) { return n <= 3 ? "#22c55e" : n <= 5 ? "#eab308" : n <= 7 ? "#f97316" : "#ef4444"; }
function fmtDate(d) { return d.toLocaleDateString("ca-ES", { weekday: "long", day: "numeric", month: "long" }); }
function fmtTime(s) { if(!s)return""; try{return new Date(s).toLocaleTimeString("ca-ES",{hour:"2-digit",minute:"2-digit"});}catch{return s.slice(11,16)||"";} }
function groupByDay(events) { const m={}; events.forEach(e=>{const dk=(e.start||"").slice(0,10);if(!dk)return;if(!m[dk])m[dk]=[];m[dk].push(e);}); return Object.entries(m).sort(([a],[b])=>a.localeCompare(b)); }
function refSub(id, day, global) {
  if(id==="matches") return day.match?"Partit registrat":"Cap partit avui";
  if(id==="planner"){ const n=(global.trainingPlan||[]).length; return n?`${n} sessions planificades`:"Sense pla"; }
  if(id==="physical") return `${day.training.filter(t=>t.category==="physical").length} sessions`;
  if(id==="cognitive") return `${(day.cognitive||[]).length} sessions`;
  if(id==="video") return `${(day.video||[]).length} sessions`;
  return "Objectiu: 2a Divisió";
}

/* ═══════ ESTILS ═══════ */
const S = {
  app: { background: "#0d0f11", minHeight: "100vh", maxWidth: 480, margin: "0 auto", fontFamily: "'Inter',system-ui,sans-serif", color: "#e5e7eb", display: "flex", flexDirection: "column", height: "100vh" },
  loadWrap: { display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#0d0f11" },
  header: { padding: "14px 14px 10px", borderBottom: "1px solid #1c2127", flexShrink: 0 },
  logo: { fontSize: 17, fontWeight: 800, color: "#4ade80", letterSpacing: "-0.04em" },
  dateLabel: { fontSize: 10, color: "#6b7280", textTransform: "capitalize", marginTop: 1 },
  body: { padding: "12px 12px 84px", overflowY: "auto", flex: 1, WebkitOverflowScrolling: "touch" },
  tabBar: { position: "fixed", bottom: 0, left: 0, right: 0, maxWidth: 480, margin: "0 auto", display: "flex", justifyContent: "space-around", background: "#0f1115", borderTop: "1px solid #1c2127", padding: "4px 0 6px", zIndex: 100, flexShrink: 0 },
  tabBtn: { background: "none", border: "none", display: "flex", flexDirection: "column", alignItems: "center", padding: "3px 6px", cursor: "pointer", fontFamily: "inherit" },
  card: { background: "#141719", border: "1px solid #222830", borderRadius: 9, padding: "12px 13px", marginBottom: 8 },
  lbl: { fontSize: 9, color: "#7a8290", marginBottom: 4, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em" },
  title: { fontSize: 15, fontWeight: 700, color: "#e5e7eb", marginBottom: 12, letterSpacing: "-0.02em" },
  inp: { width: "100%", background: "#1a1d21", border: "1px solid #252a30", borderRadius: 5, padding: "7px 9px", fontSize: 12, color: "#e5e7eb", outline: "none", fontFamily: "inherit", boxSizing: "border-box" },
  ta: { width: "100%", background: "#1a1d21", border: "1px solid #252a30", borderRadius: 5, padding: "7px 9px", fontSize: 11, color: "#e5e7eb", outline: "none", resize: "vertical", fontFamily: "inherit", boxSizing: "border-box" },
  chip: { padding: "4px 10px", borderRadius: 5, fontSize: 10, cursor: "pointer", fontWeight: 500, fontFamily: "inherit", border: "1px solid" },
  g2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 10 },
  mini: { background: "#141719", border: "1px solid #222830", borderRadius: 8, padding: "8px 10px", textAlign: "center" },
  habBtn: { display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "9px 10px", borderRadius: 7, border: "1px solid", marginBottom: 4, cursor: "pointer", background: "none", textAlign: "left", fontFamily: "inherit" },
  chk: { width: 20, height: 20, borderRadius: 5, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0 },
  navC: { display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "12px 14px", background: "#141719", border: "1px solid #222830", borderRadius: 9, marginBottom: 6, cursor: "pointer", fontFamily: "inherit", textAlign: "left" },
  back: { background: "none", border: "none", color: "#4ade80", fontSize: 12, cursor: "pointer", marginBottom: 12, padding: 0, fontFamily: "inherit", fontWeight: 500 },
  pBtn: { padding: "9px 20px", borderRadius: 7, fontSize: 12, fontWeight: 600, background: "#4ade80", border: "none", color: "#0d0f11", cursor: "pointer", fontFamily: "inherit", marginBottom: 10 },
  smBtn: { padding: "4px 10px", borderRadius: 5, fontSize: 10, fontWeight: 500, background: "transparent", border: "1px solid #252a30", color: "#4ade80", cursor: "pointer", fontFamily: "inherit" },
  delBtn: { background: "none", border: "none", color: "#ef4444", fontSize: 16, cursor: "pointer", padding: "0 3px" },
  subT: { flex: 1, padding: "6px 0", borderRadius: 5, fontSize: 11, fontWeight: 500, cursor: "pointer", border: "1px solid", fontFamily: "inherit", textAlign: "center" },
  evRow: { display: "flex", gap: 8, alignItems: "center", padding: "5px 0", borderBottom: "1px solid #1c2127" },
  evCard: { padding: "10px 12px", background: "#141719", border: "1px solid #222830", borderRadius: 8, marginBottom: 5 },
  muted: { fontSize: 11, color: "#6b7280", margin: 0 },
};
