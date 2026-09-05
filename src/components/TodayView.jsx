import { useState } from "react";
import { MOODS } from "../lib/constants";
import { todayKey, fmtDate, fmtTime, uid, computeStreak } from "../lib/utils";
import { suggestHabits, weekStartKey } from "../lib/habitSuggest";
import { S, COLORS } from "../lib/styles";
import { Card, Lbl } from "./ui";
import { WeekPlanSec } from "./WeekPlanSec";
import { ContributionGrid } from "./ContributionGrid";

const TOPICS = [
  { id: "ref", emoji: "⚽", label: "Arbitratge", color: COLORS.ref },
  { id: "rel", emoji: "💛", label: "Relacions", color: COLORS.accent },
  { id: "son", emoji: "💤", label: "Son", color: COLORS.good },
  { id: "fin", emoji: "💰", label: "Finances", color: COLORS.warn },
  { id: "feina", emoji: "💼", label: "Feina", color: COLORS.textSec },
  { id: "salut", emoji: "🏃", label: "Salut", color: COLORS.good },
];
const nextTopic = (id) => TOPICS[(TOPICS.findIndex(t => t.id === id) + 1) % TOPICS.length].id;

const PREP_ITEMS = {
  partitA: [
    { id: "vid_local", emoji: "📹", text: "Vídeo equip local" },
    { id: "vid_visit", emoji: "📹", text: "Vídeo equip visitant" },
    { id: "perfils", emoji: "👥", text: "Perfils jugadors clau" },
    { id: "activacio", emoji: "🏃", text: "Sessió d'activació" },
    { id: "tapering", emoji: "😴", text: "Tapering marcat" },
    { id: "criteris", emoji: "📋", text: "Criteris arbitrals revisats" },
  ],
  quart: [
    { id: "briefing", emoji: "📋", text: "Briefing protocol" },
    { id: "activacio", emoji: "🏃", text: "Activació" },
    { id: "son_prio", emoji: "😴", text: "Son prioritari" },
  ],
};

function Arc({ size = 78, stroke = 6, pct, color, track = COLORS.track, children }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={`${c * (pct / 10)} ${c}`} style={{ transition: "stroke-dasharray .5s ease" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>{children}</div>
    </div>
  );
}

function QuickPill({ emoji, label, done, onClick, disabled }) {
  return (
    <button onClick={disabled ? undefined : onClick} style={{ ...S.quickPill, ...(done ? S.quickPillDone : {}), opacity: disabled ? 0.5 : 1, cursor: disabled ? "default" : "pointer" }}>
      <span>{emoji}</span><span>{label}{done ? " ✓" : ""}</span>
    </button>
  );
}

// "Son d'ahir" has no manual entry (data is automatic from Garmin), so while
// it's waiting on that sync it renders as an inert, unlabeled pill rather
// than a fake "done" state.
function PendingPill({ emoji, label }) {
  return (
    <span style={{ ...S.quickPill, opacity: 0.5, cursor: "default" }}>
      <span>{emoji}</span><span>{label}</span>
    </span>
  );
}

function NudgeCard({ emoji, color, text, actionLabel, onAction }) {
  return (
    <div style={{ ...S.nudgeCard, borderLeft: `3px solid ${color}` }}>
      <span style={{ fontSize: 15 }}>{emoji}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13.5, lineHeight: 1.45, color: COLORS.text }}>{text}</div>
        {actionLabel && <button onClick={onAction} style={{ ...S.nudgeAction, color }}>{actionLabel}</button>}
      </div>
    </div>
  );
}

export function TodayView({ day, u, toggleHabit, allData, calEvents, addEntry, removeEntry, global, saveGlobal, setSub, sub, setTab, garminSleep }) {
  const [newTaskFocused, setNewTaskFocused] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [overflowId, setOverflowId] = useState(null);
  const [newHabitText, setNewHabitText] = useState("");
  const lastNightSleep = garminSleep?.[todayKey()];

  if (sub === "weekplan") return <WeekPlanSec global={global} saveGlobal={saveGlobal} setSub={setSub} />;

  const wk = weekStartKey();
  const weekPlan = (global.weeklyPlans || {})[wk];
  const isSunday = new Date().getDay() === 0;
  const matches = global.matches || [];
  const upcoming = matches.filter(m => m.date >= todayKey()).sort((a, b) => a.date.localeCompare(b.date))[0];
  const daysOut = upcoming ? Math.round((new Date(upcoming.date) - new Date(todayKey())) / 86400000) : null;

  // `ctx` stands in for the design spec's RFEF two-week auto-detection (Monday
  // placeholder -> Thursday confirmation) which needs real calendar integration
  // we don't have yet. Here it's just derived from whatever's in global.matches.
  let ctx = "rest";
  if (upcoming && daysOut <= 14) {
    if (!upcoming.time) ctx = "tbd";
    else if (/4t|quart/i.test(upcoming.role || "")) ctx = "quart";
    else ctx = "partitA";
  }

  const prepKey = ctx === "quart" ? "quart" : "partitA";
  const prepDefs = PREP_ITEMS[prepKey];
  const prep = upcoming?.prep || {};
  const prepDone = prepDefs.filter(it => prep[it.id]).length;
  const togglePrep = (id) => {
    if (!upcoming) return;
    const nextPrep = { ...prep, [id]: !prep[id] };
    saveGlobal({ ...global, matches: matches.map(m => m.id === upcoming.id ? { ...m, prep: nextPrep } : m) });
  };

  const habits = suggestHabits({ weekPlan, hasMatchToday: Boolean(matches.find(m => m.date === todayKey())) });
  const customHabits = day.customHabits || [];
  const allHabits = [...habits, ...customHabits.map(h => ({ id: h.id, text: h.text }))];

  const reminders = day.reminders || [];
  const priorities = reminders.slice(0, 3);
  const rest = reminders.slice(3);

  const addTask = () => { addEntry("reminders", { text: "", done: false, topic: null }); setNewTaskFocused(true); };
  const setReminderField = (id, field, val) => { const list = reminders.map(r => r.id === id ? { ...r, [field]: val } : r); u("reminders", null, list); };

  const socialLast4 = Object.entries(allData).filter(([dk]) => { const d = new Date(dk); return (new Date(todayKey()) - d) / 86400000 <= 4; }).reduce((n, [, d]) => n + (d.social?.length || 0), 0);

  const sleepDates = Object.keys(garminSleep || {}).filter(dk => dk <= todayKey()).sort().slice(-7);
  const avgSleepH = sleepDates.length ? sleepDates.reduce((s, dk) => s + (garminSleep[dk].hours || 0), 0) / sleepDates.length : null;

  const socialMin = parseInt(day.screen?.social) || 0;

  const nudges = [];
  if (socialMin > 20) nudges.push({ emoji: "📵", color: COLORS.warn, text: `Has gastat ${socialMin} min en xarxes avui. Intenta baixar de 20.`, actionLabel: "Veure vida", onAction: () => setTab("life") });
  if (avgSleepH != null && avgSleepH < 6.5) nudges.push({ emoji: "😴", color: COLORS.alert, text: `Has dormit de mitjana ${avgSleepH.toFixed(1)}h aquesta setmana. Rendiment en risc.`, actionLabel: "Veure son", onAction: () => setTab("life") });
  if ((ctx === "partitA" || ctx === "quart") && daysOut <= 3 && prepDone < prepDefs.length) nudges.push({ emoji: "⚽", color: COLORS.ref, text: `Falten ${prepDefs.length - prepDone} punts de preparació i el partit és d'aquí ${daysOut} dies.`, actionLabel: "Veure partit", onAction: () => setTab("ref") });
  if (socialLast4 === 0) nudges.push({ emoji: "👥", color: COLORS.accent, text: "Fa dies que no registres cap activitat social. Tens plans aviat?", actionLabel: "Obrir vida", onAction: () => setTab("life") });

  const upcomingEvents = (calEvents || []).filter(e => e.start >= new Date().toISOString()).sort((a, b) => a.start.localeCompare(b.start)).slice(0, 3);

  const addCustomHabit = () => {
    if (!newHabitText.trim()) return;
    u("customHabits", null, [...customHabits, { id: uid(), text: newHabitText.trim() }]);
    setNewHabitText("");
  };
  const removeCustomHabit = (id) => u("customHabits", null, customHabits.filter(h => h.id !== id));

  return (
    <div>
      {!weekPlan && (
        <button onClick={() => setSub("weekplan")} style={{ ...S.navC, alignItems: "center" }}>
          <span style={{ fontSize: 18 }}>🗓️</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13.5, fontWeight: 600 }}>{isSunday ? "Toca planificar la setmana" : "Encara no has planificat aquesta setmana"}</div>
            <div style={{ fontSize: 11, color: COLORS.textSec }}>Defineix objectius per rebre hàbits suggerits</div>
          </div>
          <span style={{ color: COLORS.textFaint }}>→</span>
        </button>
      )}

      {/* Quick actions */}
      <div style={{ display: "flex", gap: 7, overflowX: "auto", padding: "2px 2px 10px", width: "max-content", maxWidth: "100%" }}>
        <QuickPill emoji="➕" label="Tasca" onClick={addTask} />
        {!day.mood && <QuickPill emoji="😄" label="Registrar ànim" onClick={() => u("mood", null, "ok")} />}
        {!lastNightSleep && <PendingPill emoji="💤" label="Son d'ahir" />}
        <PendingPill emoji="💰" label="Despesa" />
        <QuickPill emoji="👥" label="Activitat social" onClick={() => setTab("life")} />
      </div>

      {/* Hero */}
      {ctx === "rest" && (
        <div style={S.heroCard}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <span style={S.heroEyebrow}>Setmana de descans</span>
            <span style={{ fontSize: 11.5, color: COLORS.textSec }}>Cap partit en els propers dies</span>
          </div>
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <Arc pct={7} color={COLORS.accent}>
              <div style={{ fontSize: 23, fontWeight: 600, color: COLORS.text }}>7</div>
              <div style={{ fontSize: 9.5, color: COLORS.textSec }}>equilibri</div>
            </Arc>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Setmana per recuperar i posar-te al dia</div>
              <div style={{ fontSize: 12.5, color: COLORS.textSec, lineHeight: 1.45 }}>Aprofita per dormir bé, veure gent i tancar temes pendents.</div>
            </div>
          </div>
        </div>
      )}

      {ctx === "tbd" && (
        <>
          <div style={S.heroCard}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <span style={{ ...S.heroEyebrow, display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 7, height: 7, borderRadius: 99, background: COLORS.ref, display: "inline-block" }} />Consciència suau</span>
              <span style={{ fontSize: 11.5, color: COLORS.textSec }}>Rol assignat</span>
            </div>
            <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 19, fontWeight: 600, marginBottom: 4 }}>{upcoming.teams} — TBD</div>
                <div style={{ fontSize: 12.5, color: COLORS.textSec }}>{upcoming.competition || "Detalls pendents de confirmació"}</div>
                <div style={{ fontSize: 12.5, color: COLORS.textSec }}>D'aquí {daysOut} dies</div>
              </div>
              <Arc pct={4} color="#c6d0f0"><div style={{ fontSize: 20, fontWeight: 600 }}>{daysOut}</div><div style={{ fontSize: 9.5, color: COLORS.textSec }}>dies</div></Arc>
            </div>
          </div>
          <div style={{ padding: "10px 16px", background: "#f6f8fe", border: "1px solid #e8ecf9", borderRadius: 14, marginBottom: 9, fontSize: 12, color: "#5a6a9a" }}>Mode descans prioritari · el son puja a prioritat 1</div>
        </>
      )}

      {(ctx === "partitA" || ctx === "quart") && (
        <div style={S.heroCard}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <span style={S.heroEyebrow}>{ctx === "quart" ? "Preparació focalitzada" : "Setmana de partit"}</span>
            <span style={{ fontSize: 11.5, color: COLORS.textSec }}>{upcoming.role || (ctx === "quart" ? "4t oficial" : "àrbitre principal")}</span>
          </div>
          <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 19, fontWeight: 600, marginBottom: 4 }}>{upcoming.teams}</div>
              {upcoming.competition && <div style={{ fontSize: 12.5, color: COLORS.textSec }}>{upcoming.competition}</div>}
              <div style={{ fontSize: 12.5, color: COLORS.textSec, textTransform: "capitalize" }}>{fmtDate(new Date(upcoming.date + "T12:00"))} · {upcoming.time}</div>
            </div>
            <Arc pct={(prepDone / prepDefs.length) * 10} color={COLORS.ref}>
              <div style={{ fontSize: 20, fontWeight: 600 }}>{prepDone}/{prepDefs.length}</div>
              <div style={{ fontSize: 9.5, color: COLORS.textSec }}>prep</div>
            </Arc>
          </div>
          {prepDone === prepDefs.length
            ? <div style={{ margin: "0 -14px -13px", padding: "10px 16px", background: "#f2fbf7", borderTop: "1px solid #e0f2ea", fontSize: 12, color: "#4f8f74" }}>Preparació completa. Descansa.</div>
            : <div style={{ margin: "0 -14px -13px", padding: "10px 16px", background: "#f6f8fe", borderTop: "1px solid #e8ecf9", fontSize: 12, color: "#5a6a9a" }}>Falten {prepDefs.length - prepDone} punts · {daysOut} dies pel xiulet inicial</div>}
        </div>
      )}

      {/* Nudges */}
      {nudges.slice(0, 3).map((n, i) => <NudgeCard key={i} {...n} />)}

      {/* Preparation checklist */}
      {(ctx === "partitA" || ctx === "quart") && (
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
            <div style={{ fontSize: 14.5, fontWeight: 600 }}>Preparació</div>
            <div style={{ fontSize: 11.5, color: COLORS.textSec }}>{prepDone} de {prepDefs.length}</div>
          </div>
          {prepDefs.map((it, i) => {
            const done = Boolean(prep[it.id]);
            return (
              <div key={it.id} style={i === 0 ? S.checkRowFirst : S.checkRow}>
                <button onClick={() => togglePrep(it.id)} style={{ ...S.chk, border: `1.5px solid ${done ? COLORS.ref : "#ded6cd"}`, background: done ? COLORS.ref : "transparent", color: "#fff", cursor: "pointer" }}>{done ? "✓" : ""}</button>
                <span style={{ fontSize: 15 }}>{it.emoji}</span>
                <span style={{ flex: 1, fontSize: 14.5, color: done ? COLORS.textFaint : COLORS.text, textDecoration: done ? "line-through" : "none" }}>{it.text}</span>
              </div>
            );
          })}
        </Card>
      )}

      {/* Today's tasks */}
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
          <div style={{ fontSize: 14.5, fontWeight: 600 }}>Prioritats d'avui</div>
          <div style={{ fontSize: 11.5, color: COLORS.textSec }}>{reminders.filter(r => r.done).length} de {reminders.length}</div>
        </div>
        {priorities.map((r, i) => {
          const topic = TOPICS.find(t => t.id === r.topic);
          return (
            <div key={r.id} style={i === 0 ? S.checkRowFirst : S.checkRow}>
              <button onClick={() => setReminderField(r.id, "done", !r.done)} style={{ ...S.chk, border: "none", background: r.done ? COLORS.accent : "#ede8e3", color: "#fff", cursor: "pointer" }}>{r.done ? "✓" : ""}</button>
              <input style={{ flex: 1, border: "none", background: "transparent", outline: "none", fontFamily: "inherit", fontSize: 14.5, color: r.done ? COLORS.textFaint : COLORS.text, textDecoration: r.done ? "line-through" : "none" }}
                value={r.text} autoFocus={newTaskFocused && i === priorities.length - 1} onChange={e => setReminderField(r.id, "text", e.target.value)} placeholder="Nova tasca" />
              {topic && <button onClick={() => setReminderField(r.id, "topic", nextTopic(r.topic))} style={{ ...S.topicPill, color: topic.color, background: topic.color + "1f", border: "none", cursor: "pointer" }}>{topic.emoji} {topic.label}</button>}
              {!topic && <button onClick={() => setReminderField(r.id, "topic", "ref")} style={{ ...S.smBtn, padding: "2px 6px", fontSize: 10 }}>+</button>}
              <button onClick={() => setOverflowId(overflowId === r.id ? null : r.id)} style={{ background: "none", border: "none", color: "#c3b8ac", cursor: "pointer", fontSize: 15 }}>⋯</button>
            </div>
          );
        })}
        {overflowId && priorities.some(r => r.id === overflowId) && (
          <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
            <button onClick={() => removeEntry("reminders", overflowId)} style={{ ...S.smBtn, flex: 1, color: COLORS.alert, textAlign: "center" }}>Eliminar</button>
            <button onClick={() => setOverflowId(null)} style={{ ...S.smBtn, flex: 1, textAlign: "center" }}>Tancar</button>
          </div>
        )}
        {priorities.length === 0 && <p style={S.muted}>Cap tasca. Afegeix-ne amb el ➕ Tasca de dalt.</p>}

        {rest.length > 0 && (
          <>
            <button onClick={() => setShowMore(!showMore)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", minHeight: 44, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
              <span style={{ fontSize: 12.5, color: COLORS.textSec }}>Si hi ha temps · {rest.length} tasques</span>
              <span style={{ color: COLORS.textSec, transition: "transform .2s", transform: showMore ? "rotate(90deg)" : "none" }}>›</span>
            </button>
            {showMore && rest.map(r => (
              <div key={r.id} style={S.checkRow}>
                <button onClick={() => setReminderField(r.id, "done", !r.done)} style={{ ...S.chk, width: 18, height: 18, border: "none", background: r.done ? COLORS.accent : "#ede8e3", color: "#fff", cursor: "pointer" }}>{r.done ? "✓" : ""}</button>
                <input style={{ flex: 1, border: "none", background: "transparent", outline: "none", fontFamily: "inherit", fontSize: 13, color: r.done ? COLORS.textFaint : COLORS.text, textDecoration: r.done ? "line-through" : "none" }}
                  value={r.text} onChange={e => setReminderField(r.id, "text", e.target.value)} placeholder="Nova tasca" />
                <button onClick={() => removeEntry("reminders", r.id)} style={S.delBtn}>×</button>
              </div>
            ))}
          </>
        )}
      </Card>

      {/* Physical readiness */}
      {(ctx === "partitA" || ctx === "quart") && (
        <div style={S.g2}>
          <button onClick={() => setTab("life")} style={{ ...S.mini, textAlign: "left", cursor: "pointer", fontFamily: "inherit", padding: "10px 12px" }}>
            <div style={{ fontSize: 11.5, color: COLORS.textSec, marginBottom: 6 }}>Son d'ahir · Garmin</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
              <span style={{ fontSize: 26, fontWeight: 600 }}>{lastNightSleep?.score ?? "—"}</span>
              <span style={{ fontSize: 12, color: COLORS.textSec }}>{lastNightSleep?.hours ? `${lastNightSleep.hours.toFixed(1)}h` : ""}</span>
            </div>
            <div style={{ height: 5, borderRadius: 99, background: COLORS.track, marginTop: 6 }}>
              <div style={{ height: 5, borderRadius: 99, background: COLORS.warn, width: `${lastNightSleep?.score || 0}%` }} />
            </div>
          </button>
          <div style={{ ...S.mini, textAlign: "left", padding: "10px 12px" }}>
            <div style={{ fontSize: 11.5, color: COLORS.textSec, marginBottom: 6 }}>Energia ara</div>
            <div style={{ display: "flex", gap: 5 }}>
              {[1, 2, 3, 4, 5].map(n => (
                <button key={n} onClick={() => u("energy", null, n)} style={{ width: 36, height: 36, borderRadius: 8, border: `1.5px solid ${day.energy === n ? COLORS.accent : COLORS.border}`, background: day.energy === n ? COLORS.accent : "#fdfbf9", color: day.energy === n ? "#fff" : COLORS.textSec, cursor: "pointer", fontFamily: "inherit" }}>{n}</button>
              ))}
            </div>
            <div style={{ fontSize: 11.5, color: COLORS.textSec, marginTop: 6 }}>{day.energy ? ["Molt baixa", "Baixa", "Normal", "Bona", "Alta"][day.energy - 1] : "Toca per registrar"}</div>
          </div>
        </div>
      )}

      {/* Habits */}
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
          <div style={{ fontSize: 14.5, fontWeight: 600 }}>Hàbits</div>
          <div style={{ fontSize: 11.5, color: COLORS.textSec }}>{allHabits.filter(h => day.habits[h.id]).length} de {allHabits.length}</div>
        </div>
        {allHabits.map((h, i) => {
          const streak = computeStreak(h.id, allData);
          const doneToday = Boolean(day.habits[h.id]);
          const custom = customHabits.some(c => c.id === h.id);
          return (
            <div key={h.id} style={i === 0 ? S.checkRowFirst : S.checkRow}>
              <button onClick={() => toggleHabit(h.id)} style={{ ...S.chk, border: "none", background: doneToday ? COLORS.accent : "#ede8e3", color: "#fff", cursor: "pointer" }}>{doneToday ? "✓" : ""}</button>
              <span style={{ flex: 1, fontSize: 14, color: doneToday ? COLORS.text : COLORS.textSec }}>{h.text}</span>
              <span style={{ fontSize: 11, fontWeight: 500, color: doneToday ? COLORS.accent : COLORS.textFaint }}>{doneToday && streak > 0 ? `🔥 ${streak + 1} dies` : streak > 0 ? streak : ""}</span>
              {custom && <button onClick={() => removeCustomHabit(h.id)} style={{ ...S.delBtn, fontSize: 14 }}>×</button>}
            </div>
          );
        })}
        <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
          <input style={{ ...S.inp, flex: 1, fontSize: 12.5 }} value={newHabitText} onChange={e => setNewHabitText(e.target.value)} placeholder="+ afegir hàbit d'avui..." onKeyDown={e => e.key === "Enter" && addCustomHabit()} />
          <button onClick={addCustomHabit} style={S.smBtn}>Afegir</button>
        </div>
      </Card>

      {/* Pròximament */}
      {upcomingEvents.length > 0 && (
        <>
          <Lbl>Pròximament</Lbl>
          <Card>
            {upcomingEvents.map((e, i) => (
              <div key={i} style={i === 0 ? S.checkRowFirst : S.checkRow}>
                <span style={{ width: 8, height: 8, borderRadius: 99, background: COLORS.accent, display: "inline-block" }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13.5 }}>{e.title}</div>
                  {e.location && <div style={{ fontSize: 11.5, color: COLORS.textSec }}>{e.location}</div>}
                </div>
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11.5, color: COLORS.textSec }}>{fmtTime(e.start)}</span>
              </div>
            ))}
          </Card>
        </>
      )}

      <Card><Lbl>Focus principal d'avui</Lbl><textarea style={S.ta} value={day.focus || ""} onChange={e => u("focus", null, e.target.value)} placeholder="Una frase. El que importa avui." rows={2} /></Card>

      <Card><Lbl>Contribucions (12 setmanes)</Lbl><ContributionGrid allData={allData} /></Card>

      <button onClick={() => setSub("history")} style={S.navC}>
        <span style={{ fontSize: 18 }}>📊</span>
        <div style={{ flex: 1 }}><div style={{ fontSize: 13.5, fontWeight: 600 }}>Historial</div><div style={{ fontSize: 11, color: COLORS.textSec }}>Explora dies anteriors i tendències</div></div>
        <span style={{ color: COLORS.textFaint }}>→</span>
      </button>

      <Card><Lbl>Reflexió</Lbl><textarea style={S.ta} value={day.reflection || ""} onChange={e => u("reflection", null, e.target.value)} placeholder="He complert el focus? Què ajusto demà?" rows={2} /></Card>
    </div>
  );
}
