import { useState } from "react";
import { RITUAL_BANNERS, PREP_CHECKLISTS, topicById, nextTopic } from "../lib/constants";
import { todayKey, fmtDate, fmtTime, uid, computeStreak } from "../lib/utils";
import { activeHabits } from "../lib/taskRules";
import { fixtureText, roleLabel } from "../lib/matchCycle";
import { S, COLORS } from "../lib/styles";
import { Card, Lbl, Checkbox, TopicPill, ProgressArc } from "./ui";

function QuickPill({ emoji, label, done, onClick }) {
  return (
    <button onClick={onClick} style={{ ...S.quickPill, ...(done ? S.quickPillDone : {}) }}>
      <span>{emoji}</span><span>{label}{done ? " ✓" : ""}</span>
    </button>
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

function findMatchRecord(global, role, start) {
  return (global.matches || []).find((m) => m.role === role && m.start === start) || null;
}

// Weekend date range (Sat–Sun) implied by a TBD placeholder's start date,
// for the "Cap de setmana del D–D" line.
function weekendRange(startISO) {
  const d = new Date(startISO);
  const dow = d.getDay(); // 0 Sun..6 Sat
  const sat = new Date(d); sat.setDate(d.getDate() + ((6 - dow + 7) % 7));
  const sun = new Date(sat); sun.setDate(sat.getDate() + 1);
  return `${sat.getDate()}–${sun.getDate()}`;
}

function daysUntil(startISO) {
  const start = new Date(startISO); start.setHours(0, 0, 0, 0);
  const now = new Date(); now.setHours(0, 0, 0, 0);
  return Math.round((start - now) / 86400000);
}

export function TodayView({ day, global, allData, garminSleep, u, toggleHabit, persist, saveGlobal, matchState, calEvents, bannerToShow, onOpenRitual, onDismissBanner, onOpenFull, onOpenSheet }) {
  const [newTaskFocused, setNewTaskFocused] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [overflowId, setOverflowId] = useState(null);
  const [newHabitText, setNewHabitText] = useState("");
  const [pickingMood, setPickingMood] = useState(false);

  const { ctx } = matchState;
  const info = ctx === "quart" ? matchState.quart : matchState.partitA || matchState.quart;
  const role = info?.role;
  const daysOut = info ? daysUntil(info.start) : null;

  const prepDefs = PREP_CHECKLISTS[role === "quart" ? "quart" : "partitA"];
  const record = info ? findMatchRecord(global, role, info.start) : null;
  const prep = record?.prep || {};
  const prepDone = prepDefs.filter((it) => prep[it.id]).length;

  const togglePrep = (id) => {
    if (!info) return;
    const nextPrep = { ...prep, [id]: !prep[id] };
    const others = (global.matches || []).filter((m) => !(m.role === role && m.start === info.start));
    saveGlobal({ ...global, matches: [...others, { id: record?.id || uid(), role, start: info.start, venue: info.venue, title: info.title, prep: nextPrep }] });
  };

  const habits = activeHabits({ hasMatchWithin7Days: Boolean(info && daysOut <= 7), customHabits: day.customHabits || [] });

  const tasks = day.tasks || [];
  const priorities = tasks.slice(0, 3);
  const rest = tasks.slice(3);
  const addTask = () => {
    persist({ ...day, tasks: [...tasks, { id: uid(), label: "", topic: "arbitratge", hint: "", done: false }], qa: { ...day.qa, tasca: true } });
    setNewTaskFocused(true);
  };
  const setTaskField = (id, field, val) => u("tasks", null, tasks.map((t) => (t.id === id ? { ...t, [field]: val } : t)));
  const removeTask = (id) => u("tasks", null, tasks.filter((t) => t.id !== id));

  const lastNightSleep = garminSleep?.[todayKey()];
  const garminMissing = !lastNightSleep;
  const qa = day.qa || {};

  const logExpense = () => {
    const amount = window.prompt("Import de la despesa (€)");
    if (!amount) return;
    const category = window.prompt("Categoria") || "Altres";
    persist({ ...day, expenses: [...(day.expenses || []), { id: uid(), amount: parseFloat(amount) || 0, category }], qa: { ...day.qa, expense: true } });
  };

  const logSocial = () => {
    const who = window.prompt("Amb qui?");
    if (!who) return;
    persist({ ...day, social: [...(day.social || []), { id: uid(), who }], qa: { ...day.qa, social: true } });
  };

  const setMood = (n) => { persist({ ...day, mood: n, qa: { ...day.qa, mood: true } }); setPickingMood(false); };

  // Nudges — real where the data exists, sample copy otherwise per state
  // (README nudge copy tables are per-ctx sample copy to wire against real
  // sources as they land, e.g. social-log recency, Garmin weekly average).
  const nudges = [];
  const socialDays = (day.social || []).length ? 0 : 4;
  if (ctx === "rest") {
    nudges.push({ emoji: "💛", color: COLORS.accent, text: `Fa ${socialDays} dies sense veure algú proper. Agenda alguna cosa.`, actionLabel: "Obrir agenda", onAction: () => onOpenSheet("relacions") });
  } else if (ctx === "tbd") {
    nudges.push({ emoji: "💤", color: COLORS.good, text: `Tens cita dins de ${daysOut} dies. Comença a pujar el son des d'ara.`, actionLabel: "Veure son", onAction: () => onOpenFull("son") });
  } else if (ctx === "partitA") {
    if (prepDone < prepDefs.length && daysOut <= 3) nudges.push({ emoji: "⚽", color: COLORS.ref, text: `Fa dies que no fas vídeo-anàlisi. El proper partit és d'aquí ${daysOut} dies.`, actionLabel: "Registrar sessió", onAction: () => onOpenSheet("arbitratge") });
  } else if (ctx === "quart") {
    if (!prep.briefing) nudges.push({ emoji: "📋", color: COLORS.ref, text: "Briefing de protocol pendent.", actionLabel: "Obrir briefing", onAction: () => onOpenSheet("arbitratge") });
  }

  const upcomingEvents = (calEvents || []).filter((e) => e.start >= new Date().toISOString()).sort((a, b) => a.start.localeCompare(b.start)).slice(0, 3);

  const addCustomHabit = () => {
    if (!newHabitText.trim()) return;
    u("customHabits", null, [...(day.customHabits || []), { id: uid(), emoji: "✦", label: newHabitText.trim(), topic: "salut" }]);
    setNewHabitText("");
  };
  const removeCustomHabit = (id) => u("customHabits", null, (day.customHabits || []).filter((h) => h.id !== id));

  const dateLine = ctx === "rest" ? "setmana tranquil·la" : ctx === "tbd" ? "cita confirmada per la RFEF" : `${daysOut} dies per al partit`;

  return (
    <div>
      <div style={{ ...S.dateLabel, marginBottom: 10, textTransform: "capitalize" }}>{fmtDate(new Date())} · {dateLine}</div>

      {bannerToShow && (
        <div style={{ ...S.ritualBanner, borderLeft: `3px solid ${RITUAL_BANNERS[bannerToShow].color}` }}>
          <span style={{ fontSize: 19 }}>{RITUAL_BANNERS[bannerToShow].emoji}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{RITUAL_BANNERS[bannerToShow].title}</div>
          </div>
          <button onClick={() => onOpenRitual(bannerToShow)} style={{ ...S.ritualBannerAction, background: RITUAL_BANNERS[bannerToShow].color }}>{RITUAL_BANNERS[bannerToShow].action}</button>
          <button onClick={() => onDismissBanner(bannerToShow)} style={S.ritualBannerDismiss}>×</button>
        </div>
      )}

      {/* Quick actions */}
      <div style={{ display: "flex", gap: 7, overflowX: "auto", padding: "2px 2px 10px", width: "max-content", maxWidth: "100%" }}>
        <QuickPill emoji="➕" label="Tasca" done={qa.tasca} onClick={addTask} />
        {!day.mood && <QuickPill emoji="😄" label="Registrar ànim" onClick={() => setPickingMood(!pickingMood)} />}
        {garminMissing && <QuickPill emoji="💤" label="Son d'ahir" onClick={() => onOpenFull("son")} />}
        <QuickPill emoji="💰" label="Despesa" done={qa.expense} onClick={logExpense} />
        <QuickPill emoji="👥" label="Activitat social" done={qa.social} onClick={logSocial} />
      </div>
      {pickingMood && (
        <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
          {["😔", "🙁", "😐", "🙂", "😄"].map((e, i) => (
            <button key={e} onClick={() => setMood(i + 1)} style={{ width: 40, height: 40, borderRadius: 10, border: `1.5px solid ${COLORS.border}`, background: "#fdfbf9", fontSize: 18, cursor: "pointer" }}>{e}</button>
          ))}
        </div>
      )}

      {/* Hero */}
      {ctx === "rest" && (
        <div style={S.heroCard}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <span style={S.heroEyebrow}>Setmana de descans</span>
            <span style={{ fontSize: 11.5, color: COLORS.textSec }}>Cap partit en 2 caps de setmana</span>
          </div>
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <ProgressArc size={86} strokeWidth={7} progress={0.7} color={COLORS.accent} big="7" small="equilibri" />
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Aquesta setmana toca relacions</div>
              <div style={{ fontSize: 12.5, color: COLORS.textSec, lineHeight: 1.45 }}>És el domini més fluix. Un sopar amb algú proper i una trucada als amics ho arreglen.</div>
            </div>
          </div>
        </div>
      )}

      {ctx === "tbd" && info && (
        <>
          <div style={S.heroCard}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <span style={{ ...S.heroEyebrow, display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 7, height: 7, borderRadius: 99, background: COLORS.ref, display: "inline-block" }} />Consciència suau</span>
              <span style={{ fontSize: 11.5, color: COLORS.textSec }}>Rol assignat · RFEF</span>
            </div>
            <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 19, fontWeight: 600, marginBottom: 4 }}>{roleLabel(info.title)} — TBD</div>
                <div style={{ fontSize: 12.5, color: COLORS.textSec }}>Seu i rival pendents de confirmació</div>
                <div style={{ fontSize: 12.5, color: COLORS.textSec }}>Cap de setmana del {weekendRange(info.start)} · dins de {daysOut} dies</div>
              </div>
              <ProgressArc size={78} strokeWidth={6} progress={0.35} color={COLORS.matchMuted} big={String(daysOut)} small="dies" />
            </div>
            <div style={S.matchStrip}>Mode descans prioritari · el son puja a prioritat 1</div>
          </div>
          <div style={{ border: "1px dashed #cfd8f2", background: COLORS.matchStripBg, borderRadius: 14, padding: 14, marginBottom: 9 }}>
            <div style={{ fontSize: 12.5, color: COLORS.matchStripText }}>Els detalls del partit arriben dijous. Fins llavors: dormir i recuperar.</div>
          </div>
        </>
      )}

      {(ctx === "partitA" || ctx === "quart") && info && (
        <div style={S.heroCard}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <span style={S.heroEyebrow}>{ctx === "quart" ? "Preparació focalitzada" : "Setmana de partit"}</span>
            <span style={{ fontSize: 11.5, color: COLORS.textSec }}>{ctx === "quart" ? roleLabel(info.title) : `${roleLabel(info.title)} · àrbitre principal`}</span>
          </div>
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 19, fontWeight: 600, marginBottom: 4 }}>{fixtureText(info.title)}</div>
              {info.venue && <div style={{ fontSize: 12.5, color: COLORS.textSec }}>{info.venue}</div>}
              <div style={{ fontSize: 12.5, color: COLORS.textSec, textTransform: "capitalize" }}>{fmtDate(new Date(info.start))} · {fmtTime(info.start)}</div>
            </div>
            <ProgressArc size={78} strokeWidth={6} progress={prepDefs.length ? prepDone / prepDefs.length : 0} color={COLORS.ref} big={`${prepDone}/${prepDefs.length}`} small="prep" />
          </div>
          {prepDone === prepDefs.length
            ? <div style={{ ...S.matchStrip, ...S.matchStripDone }}>Preparació completa. Descansa.</div>
            : <div style={S.matchStrip}>Falten {prepDefs.length - prepDone} punts · {daysOut} dies pel xiulet inicial</div>}
        </div>
      )}

      {nudges.slice(0, 3).map((n, i) => <NudgeCard key={i} {...n} />)}

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
                <Checkbox checked={done} onChange={() => togglePrep(it.id)} color={COLORS.ref} />
                <span style={{ fontSize: 15 }}>{it.emoji}</span>
                <span style={{ flex: 1, fontSize: 14.5, color: done ? COLORS.textFaint : COLORS.text, textDecoration: done ? "line-through" : "none" }}>{it.label}</span>
                {it.hint && <span style={{ fontSize: 11, color: COLORS.textFaint }}>{it.hint}</span>}
              </div>
            );
          })}
        </Card>
      )}

      {/* Today's tasks */}
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
          <div style={{ fontSize: 14.5, fontWeight: 600 }}>Prioritats d'avui</div>
          <div style={{ fontSize: 11.5, color: COLORS.textSec }}>{tasks.filter((t) => t.done).length} de {tasks.length}</div>
        </div>
        {priorities.map((t, i) => {
          const topic = topicById(t.topic);
          return (
            <div key={t.id} style={i === 0 ? S.checkRowFirst : S.checkRow}>
              <Checkbox checked={t.done} onChange={() => setTaskField(t.id, "done", !t.done)} size={20} />
              <div style={{ flex: 1 }}>
                <input style={{ width: "100%", border: "none", background: "transparent", outline: "none", fontFamily: "inherit", fontSize: 14.5, color: t.done ? COLORS.textFaint : COLORS.text, textDecoration: t.done ? "line-through" : "none" }}
                  value={t.label} autoFocus={newTaskFocused && i === priorities.length - 1} onChange={(e) => setTaskField(t.id, "label", e.target.value)} placeholder="Nova tasca" />
                {t.hint && <div style={{ fontSize: 11, color: COLORS.textFaint }}>{t.hint}</div>}
              </div>
              <button onClick={() => setTaskField(t.id, "topic", nextTopic(t.topic))} style={{ border: "none", background: "none", cursor: "pointer", padding: 0 }}><TopicPill topic={topic} /></button>
              <button onClick={() => setOverflowId(overflowId === t.id ? null : t.id)} style={{ background: "none", border: "none", color: "#c3b8ac", cursor: "pointer", fontSize: 15 }}>⋯</button>
            </div>
          );
        })}
        {overflowId && priorities.some((t) => t.id === overflowId) && (
          <div style={{ display: "flex", gap: 6, margin: "6px 0" }}>
            <button onClick={() => { setTaskField(overflowId, "movedCount", (tasks.find(t=>t.id===overflowId)?.movedCount||0)+1); setOverflowId(null); }} style={{ ...S.smBtn, flex: 1, textAlign: "center" }}>Mou a demà</button>
            <button onClick={() => { setTaskField(overflowId, "topic", nextTopic(tasks.find(t=>t.id===overflowId)?.topic)); setOverflowId(null); }} style={{ ...S.smBtn, flex: 1, textAlign: "center" }}>Canviar prioritat</button>
            <button onClick={() => { removeTask(overflowId); setOverflowId(null); }} style={{ ...S.smBtn, flex: 1, textAlign: "center", color: COLORS.alert }}>Eliminar</button>
          </div>
        )}
        {priorities.length === 0 && <p style={S.muted}>Cap tasca. Afegeix-ne amb el ➕ Tasca de dalt.</p>}

        {rest.length > 0 && (
          <>
            <button onClick={() => setShowMore(!showMore)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", minHeight: 44, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
              <span style={{ fontSize: 12.5, color: COLORS.textSec }}>Si hi ha temps · {rest.length} tasques</span>
              <span style={{ color: COLORS.textSec, transition: "transform .2s", transform: showMore ? "rotate(90deg)" : "none" }}>›</span>
            </button>
            {showMore && rest.map((t) => {
              const restTopic = topicById(t.topic);
              return (
                <div key={t.id} style={{ ...S.checkRow, borderTop: `1px solid ${COLORS.borderSoft}` }}>
                  <Checkbox checked={t.done} onChange={() => setTaskField(t.id, "done", !t.done)} size={18} />
                  <input style={{ flex: 1, border: "none", background: "transparent", outline: "none", fontFamily: "inherit", fontSize: 13, color: t.done ? COLORS.textFaint : COLORS.text, textDecoration: t.done ? "line-through" : "none" }}
                    value={t.label} onChange={(e) => setTaskField(t.id, "label", e.target.value)} placeholder="Nova tasca" />
                  <button onClick={() => setTaskField(t.id, "topic", nextTopic(t.topic))} style={{ border: "none", background: "none", cursor: "pointer", padding: 0 }}><TopicPill topic={restTopic} /></button>
                  <button onClick={() => removeTask(t.id)} style={S.delBtn}>×</button>
                </div>
              );
            })}
          </>
        )}

        <button
          onClick={() => { u("tasks", null, [...tasks, { id: uid(), label: "", topic: "arbitratge", hint: "", done: false }]); setNewTaskFocused(true); }}
          style={{ width: "100%", minHeight: 40, marginTop: 8, border: "1px dashed #ded6cd", background: "none", borderRadius: 8, color: COLORS.textSec, fontSize: 12.5, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}
        >
          ➕ Afegir tasca
        </button>
      </Card>

      {(ctx === "partitA" || ctx === "quart") && (
        <div style={S.g2}>
          <button onClick={() => onOpenFull("son")} style={{ ...S.mini, textAlign: "left", cursor: "pointer", fontFamily: "inherit", padding: "10px 12px" }}>
            <div style={{ fontSize: 11.5, color: COLORS.textSec, marginBottom: 6 }}>Son d'ahir · Garmin</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
              <span style={{ fontSize: 26, fontWeight: 600 }}>{lastNightSleep?.score ?? "—"}</span>
              <span style={{ fontSize: 12, color: COLORS.textSec }}>{lastNightSleep?.hours ? `${lastNightSleep.hours.toFixed(1)}h` : ""}</span>
            </div>
            <div style={{ marginTop: 6 }}><div style={{ height: 5, borderRadius: 99, background: COLORS.track }}><div style={{ height: 5, borderRadius: 99, background: COLORS.warn, width: `${lastNightSleep?.score || 0}%` }} /></div></div>
          </button>
          <div style={{ ...S.mini, textAlign: "left", padding: "10px 12px" }}>
            <div style={{ fontSize: 11.5, color: COLORS.textSec, marginBottom: 6 }}>Energia ara</div>
            <div style={{ display: "flex", gap: 5 }}>
              {[1, 2, 3, 4, 5].map((n) => (
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
          <div style={{ fontSize: 11.5, color: COLORS.textSec }}>{habits.filter((h) => day.habits[h.id]).length} de {habits.length}</div>
        </div>
        {habits.map((h, i) => {
          const streak = computeStreak(h.id, allData || {});
          const doneToday = Boolean(day.habits[h.id]);
          const custom = (day.customHabits || []).some((c) => c.id === h.id);
          const topic = topicById(h.topic);
          return (
            <div key={h.id} style={i === 0 ? S.checkRowFirst : S.checkRow}>
              <Checkbox checked={doneToday} onChange={() => toggleHabit(h.id)} color={topic.color} size={20} />
              <span style={{ fontSize: 14 }}>{h.emoji}</span>
              <span style={{ flex: 1, fontSize: 14, color: doneToday ? COLORS.text : COLORS.textSec }}>{h.label}</span>
              <span style={{ fontSize: 11, fontWeight: 500, color: doneToday ? COLORS.accent : "#c3b8ac" }}>{doneToday && streak > 0 ? `🔥 ${streak + 1} dies` : streak > 0 ? streak : ""}</span>
              {custom && <button onClick={() => removeCustomHabit(h.id)} style={{ ...S.delBtn, fontSize: 14 }}>×</button>}
            </div>
          );
        })}
        <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
          <input style={{ ...S.inp, flex: 1, fontSize: 12.5 }} value={newHabitText} onChange={(e) => setNewHabitText(e.target.value)} placeholder="+ afegir hàbit d'avui..." onKeyDown={(e) => e.key === "Enter" && addCustomHabit()} />
          <button onClick={addCustomHabit} style={S.smBtn}>Afegir</button>
        </div>
      </Card>

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
    </div>
  );
}
