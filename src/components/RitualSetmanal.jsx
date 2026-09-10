import { useState } from "react";
import { S, COLORS } from "../lib/styles";
import { Card, Checkbox, TopicPill, ArrowBtn } from "./ui";
import { BalanceWheel } from "./SetmanaView";
import { computeDomainStats } from "../lib/domainStats";
import { weekStartKey, parseIntention, taskForDay } from "../lib/taskRules";
import { WEEKDAYS_ABBR, INTENTION_SUGGESTIONS_ALWAYS, TOPICS, topicById, nextTopic } from "../lib/constants";
import { fmtTime, uid } from "../lib/utils";

// Step layout: 0 balanç · 1 valoració · 2 intenció · one step per pètal
// (TOPICS) · generació (review) · agenda de la setmana · tancament.
const PETAL_START = 3;
const PETAL_END = PETAL_START + TOPICS.length - 1;
const STEP_REVIEW = PETAL_END + 1;
const STEP_AGENDA = STEP_REVIEW + 1;
const STEP_FINAL = STEP_AGENDA + 1;
const STEPS = STEP_FINAL + 1;

const dateKey = (d) => d.toISOString().split("T")[0];
const addDays = (d, n) => { const nd = new Date(d); nd.setDate(nd.getDate() + n); return nd; };

export function RitualSetmanal({ day, global, allData, matchState, calEvents, persistDates, onClose }) {
  const [step, setStep] = useState(0);
  const [rate, setRate] = useState(null);
  const [why, setWhy] = useState("");
  const [intention, setIntention] = useState("");
  const [suggested, setSuggested] = useState(null); // seeded on leaving the intenció step

  const salut = computeDomainStats({ id: "salut", global, allData, domainScores: {} }).value;
  const scores = { arbitratge: 6, relacions: 6, salut, finances: 6, feina: 6 };

  const domainSentences = [
    { emoji: "💤", text: `Son: mitjana ${computeDomainStats({ id: "son", global, allData }).kv[0][1]} · puntuació ${computeDomainStats({ id: "son", global, allData }).value}.` },
    { emoji: "💛", text: `Relacions: ${computeDomainStats({ id: "relacions", global, allData }).value} entrades socials aquesta setmana.` },
    { emoji: "⚽", text: matchState?.ctx === "partitA" || matchState?.ctx === "quart" ? "Arbitratge: partit aquesta setmana." : "Arbitratge: setmana sense partit." },
    { emoji: "💰", text: `Finances: ${computeDomainStats({ id: "finances", global, allData }).value} gastats aquesta setmana.` },
    { emoji: "💼", text: `Feina: ${computeDomainStats({ id: "feina", global, allData }).value} tasques tancades.` },
  ];

  const seedSuggestions = () => { if (!suggested) setSuggested(parseIntention(intention)); };
  const goNext = () => {
    if (step === PETAL_START - 1) seedSuggestions();
    if (step < STEPS - 1) setStep(step + 1);
    else finish();
  };

  const isMatchNextWeekend = matchState?.partitA || matchState?.quart;
  const suggestionPills = [
    isMatchNextWeekend ? "⚽ Setmana de partit" : "🔄 Setmana de manteniment",
    ...INTENTION_SUGGESTIONS_ALWAYS,
  ];

  const wk = weekStartKey();
  const nextMonday = addDays(new Date(wk), 7);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(nextMonday, i));

  const addPetalItem = (topicId) => {
    setSuggested([...(suggested || []), { id: uid(), emoji: topicById(topicId).emoji, label: "", topic: topicId, day: null, included: true }]);
  };

  const moveTaskDay = (taskId, delta) => {
    setSuggested(suggested.map((t) => (t.id === taskId && t.day != null ? { ...t, day: Math.max(0, Math.min(6, t.day + delta)) } : t)));
  };
  const moveTaskInDay = (dayIndex, taskId, delta) => {
    const dayList = suggested.filter((t) => t.included && (t.day === dayIndex || t.day == null));
    const idx = dayList.findIndex((t) => t.id === taskId);
    const swapWith = dayList[idx + delta];
    if (!swapWith) return;
    const a = suggested.findIndex((t) => t.id === taskId);
    const b = suggested.findIndex((t) => t.id === swapWith.id);
    const next = [...suggested];
    [next[a], next[b]] = [next[b], next[a]];
    setSuggested(next);
  };

  const finish = () => {
    const included = (suggested || []).filter((t) => t.included);
    const gUpdated = {
      ...global,
      weeklyReviews: { ...global.weeklyReviews, [wk]: { rate, why, intention } },
      weeklyTaskPool: { ...global.weeklyTaskPool, [wk]: included },
    };
    // Build every affected day's record locally, then write them together
    // with the global update in one persistDates call — separate calls
    // would each read the same stale `allData`/`global` snapshot and only
    // the last write would survive.
    const updates = {};
    for (let i = 0; i < 7; i++) {
      const dk = dateKey(weekDays[i]);
      const newTasks = included.map((item) => taskForDay(item, i)).filter(Boolean);
      if (!newTasks.length) continue;
      const existing = allData[dk] || { date: dk, habits: {}, customHabits: [], tasks: [], mood: null, energy: null, qa: {}, nightlyReview: null, ritualDismissed: { nit: false, set: false }, expenses: [], social: [] };
      updates[dk] = { ...existing, tasks: [...existing.tasks, ...newTasks] };
    }
    persistDates(updates, gUpdated);
    onClose();
  };

  const countsByTopic = {};
  (suggested || []).filter((t) => t.included).forEach((t) => { countsByTopic[t.topic] = (countsByTopic[t.topic] || 0) + 1; });

  return (
    <div style={S.ritualShell}>
      <div style={S.ritualHeader}>
        <button style={S.backArrow} onClick={() => (step === 0 ? onClose() : setStep(step - 1))}>←</button>
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap", maxWidth: 220, justifyContent: "center" }}>
          {Array.from({ length: STEPS }, (_, i) => (
            <span key={i} style={{ ...S.ritualDot, ...(i < step ? S.ritualDotDone : {}), ...(i === step ? S.ritualDotActive : {}) }} />
          ))}
        </div>
        <button style={S.backArrow} onClick={onClose}>✕</button>
      </div>

      <div style={S.ritualBody}>
        <div style={S.ritualEyebrow}>Revisió setmanal · pas {step + 1} de {STEPS}</div>

        {step === 0 && (
          <>
            <div style={S.ritualStepTitle}>Balanç de la setmana</div>
            <div style={{ display: "flex", justifyContent: "center", margin: "10px 0" }}><BalanceWheel scores={scores} /></div>
            {domainSentences.map((s, i) => (
              <Card key={i}><div style={{ fontSize: 13, lineHeight: 1.5, color: "#6d6259" }}>{s.emoji} {s.text}</div></Card>
            ))}
          </>
        )}

        {step === 1 && (
          <>
            <div style={S.ritualStepTitle}>Valoració honesta</div>
            <div style={S.ritualStepSubtitle}>Del 0 al 10, com valores aquesta setmana?</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 8, marginBottom: 14 }}>
              {Array.from({ length: 11 }, (_, n) => (
                <button key={n} onClick={() => setRate(n)} style={{
                  height: 46, borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                  border: `1.5px solid ${rate === n ? COLORS.ref : COLORS.border}`,
                  background: rate === n ? COLORS.ref : "#fff", color: rate === n ? "#fff" : COLORS.textSec,
                }}>{n}</button>
              ))}
            </div>
            <Card>
              <div style={{ fontSize: 13.5, fontWeight: 500, marginBottom: 8 }}>Per què?</div>
              <textarea style={{ ...S.ta, height: 56, resize: "none" }} placeholder="Opcional" value={why} onChange={(e) => setWhy(e.target.value)} />
            </Card>
          </>
        )}

        {step === 2 && (
          <>
            <div style={S.ritualStepTitle}>Intenció de la setmana vinent</div>
            <textarea
              style={{ width: "100%", height: 150, padding: 13, borderRadius: 12, border: `1px solid ${COLORS.border}`, boxShadow: S.card.boxShadow, fontSize: 14, lineHeight: 1.55, fontFamily: "inherit", outline: "none", resize: "none", boxSizing: "border-box" }}
              placeholder="Ex: Setmana de partit. Prioritat: descansar bé i preparar CF Igualada. Mantenir rutina de lectura. Quedar amb la Muntsa dimecres."
              value={intention} onChange={(e) => setIntention(e.target.value)}
            />
            <div style={{ fontSize: 11.5, color: COLORS.textMuted, margin: "12px 0 6px" }}>Suggeriments segons el teu calendari</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {suggestionPills.map((p) => (
                <button key={p} onClick={() => setIntention((intention ? intention + " " : "") + p.replace(/^\S+\s/, ""))} style={{ padding: "6px 12px", borderRadius: 99, border: `1px solid ${COLORS.border}`, background: "#fff", fontSize: 12, fontWeight: 500, color: "#6d6259", cursor: "pointer", fontFamily: "inherit", boxShadow: S.card.boxShadow }}>{p}</button>
              ))}
            </div>
            <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 14 }}>Al següent pas et deixarem definir tasques i prioritats domini per domini.</div>
          </>
        )}

        {step >= PETAL_START && step <= PETAL_END && suggested && (() => {
          const topic = TOPICS[step - PETAL_START];
          const items = suggested.filter((t) => t.topic === topic.id);
          return (
            <>
              <div style={S.ritualStepTitle}>{topic.emoji} {topic.label}</div>
              <div style={S.ritualStepSubtitle}>Quines tasques o prioritats vols per aquest domini la setmana vinent?</div>
              {items.map((t) => (
                <Card key={t.id}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Checkbox checked={t.included} color={topic.color} size={20} onChange={() => setSuggested(suggested.map((x) => (x.id === t.id ? { ...x, included: !x.included } : x)))} />
                    <input
                      style={{ flex: 1, border: "none", background: "none", outline: "none", fontFamily: "inherit", fontSize: 13.5, color: t.included ? COLORS.text : COLORS.textFaint }}
                      value={t.label}
                      placeholder="Nova tasca"
                      onChange={(e) => setSuggested(suggested.map((x) => (x.id === t.id ? { ...x, label: e.target.value } : x)))}
                    />
                    <button onClick={() => setSuggested(suggested.filter((x) => x.id !== t.id))} style={S.delBtn}>×</button>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginLeft: 31, marginTop: 6 }}>
                    {["Cada dia", ...WEEKDAYS_ABBR].map((label, i) => {
                      const dayIdx = i === 0 ? null : i - 1;
                      const selected = t.day === dayIdx;
                      return (
                        <button key={label} onClick={() => setSuggested(suggested.map((x) => (x.id === t.id ? { ...x, day: dayIdx } : x)))} style={{
                          padding: "3px 8px", borderRadius: 99, fontSize: 10.5, cursor: "pointer", fontFamily: "inherit",
                          border: `1px solid ${selected ? COLORS.accent : COLORS.border}`,
                          background: selected ? "#fbf2ea" : "#fdfbf9", color: selected ? COLORS.accent : COLORS.textSec,
                        }}>{label}</button>
                      );
                    })}
                  </div>
                </Card>
              ))}
              {items.length === 0 && <p style={S.muted}>Cap tasca encara per {topic.label.toLowerCase()}.</p>}
              <button onClick={() => addPetalItem(topic.id)} style={{ width: "100%", minHeight: 44, border: "1px dashed #ded6cd", background: "none", borderRadius: 10, color: COLORS.textSec, fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit", marginTop: 4 }}>
                ➕ Afegir a {topic.label.toLowerCase()}
              </button>
            </>
          );
        })()}

        {step === STEP_REVIEW && suggested && (
          <>
            <div style={S.ritualStepTitle}>Generació de tasques</div>
            <div style={S.ritualStepSubtitle}>Revisa-ho tot junt abans de confirmar.</div>
            {suggested.map((t) => {
              const topic = topicById(t.topic);
              return (
                <Card key={t.id}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Checkbox checked={t.included} color={topic.color} size={20} onChange={() => setSuggested(suggested.map((x) => (x.id === t.id ? { ...x, included: !x.included } : x)))} />
                    <input
                      style={{ flex: 1, border: "none", background: "none", outline: "none", fontFamily: "inherit", fontSize: 13.5, color: t.included ? COLORS.text : COLORS.textFaint }}
                      value={t.label}
                      onChange={(e) => setSuggested(suggested.map((x) => (x.id === t.id ? { ...x, label: e.target.value } : x)))}
                    />
                    <button onClick={() => setSuggested(suggested.map((x) => (x.id === t.id ? { ...x, topic: nextTopic(x.topic) } : x)))} style={{ border: "none", background: "none", padding: 0, cursor: "pointer" }}>
                      <TopicPill topic={topic} />
                    </button>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginLeft: 31, marginTop: 6 }}>
                    {["Cada dia", ...WEEKDAYS_ABBR].map((label, i) => {
                      const dayIdx = i === 0 ? null : i - 1;
                      const selected = t.day === dayIdx;
                      return (
                        <button key={label} onClick={() => setSuggested(suggested.map((x) => (x.id === t.id ? { ...x, day: dayIdx } : x)))} style={{
                          padding: "3px 8px", borderRadius: 99, fontSize: 10.5, cursor: "pointer", fontFamily: "inherit",
                          border: `1px solid ${selected ? COLORS.accent : COLORS.border}`,
                          background: selected ? "#fbf2ea" : "#fdfbf9", color: selected ? COLORS.accent : COLORS.textSec,
                        }}>{label}</button>
                      );
                    })}
                  </div>
                </Card>
              );
            })}
            <div style={{ fontSize: 11.5, color: COLORS.textMuted, marginTop: 4 }}>{suggested.filter((t) => t.included).length} tasques confirmades per la setmana.</div>
          </>
        )}

        {step === STEP_AGENDA && suggested && (
          <>
            <div style={S.ritualStepTitle}>Agenda de la setmana</div>
            <div style={S.ritualStepSubtitle}>Els teus compromisos amb les tasques col·locades. Fes servir ‹ › per canviar de dia i ↑ ↓ per reordenar.</div>
            {weekDays.map((d, dayIdx) => {
              const dk = dateKey(d);
              const dayEvents = (calEvents || []).filter((e) => e.start?.startsWith(dk)).sort((a, b) => (a.start || "").localeCompare(b.start || ""));
              const dayTasks = suggested.filter((t) => t.included && (t.day === dayIdx || t.day == null));
              return (
                <Card key={dk}>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: COLORS.text, textTransform: "capitalize", marginBottom: 6 }}>
                    {d.toLocaleDateString("ca-ES", { weekday: "long", day: "numeric", month: "short" })}
                  </div>
                  {dayEvents.map((e, i) => (
                    <div key={i} style={{ display: "flex", gap: 8, alignItems: "center", padding: "4px 0" }}>
                      <span style={{ width: 38, fontFamily: "'JetBrains Mono',monospace", fontSize: 10.5, color: COLORS.textMuted, flexShrink: 0 }}>{fmtTime(e.start)}</span>
                      <div style={{ flex: 1, background: COLORS.borderSoft, borderRadius: 8, padding: "6px 9px", fontSize: 12, color: "#6d6259" }}>{e.title}</div>
                    </div>
                  ))}
                  {dayTasks.length === 0 && dayEvents.length === 0 && <div style={{ fontSize: 11.5, color: COLORS.textFaint, padding: "4px 0" }}>Res planificat.</div>}
                  {dayTasks.map((t, i) => {
                    const topic = topicById(t.topic);
                    return (
                      <div key={t.id} style={{ display: "flex", gap: 6, alignItems: "center", padding: "4px 0" }}>
                        <span style={{ width: 38, flexShrink: 0 }} />
                        <div style={{ flex: 1, background: "#fff", border: `1px solid ${COLORS.border}`, borderLeft: `3px solid ${topic.color}`, borderRadius: 8, padding: "6px 9px", fontSize: 12, fontWeight: 500 }}>{t.label || "Tasca"}</div>
                        <ArrowBtn dir="up" disabled={i === 0} onClick={() => moveTaskInDay(dayIdx, t.id, -1)} />
                        <ArrowBtn dir="down" disabled={i === dayTasks.length - 1} onClick={() => moveTaskInDay(dayIdx, t.id, 1)} />
                        {t.day != null && (
                          <>
                            <button disabled={dayIdx === 0} onClick={() => moveTaskDay(t.id, -1)} style={{ ...S.arrowBtn, ...(dayIdx === 0 ? S.arrowBtnDisabled : {}) }}>‹</button>
                            <button disabled={dayIdx === 6} onClick={() => moveTaskDay(t.id, 1)} style={{ ...S.arrowBtn, ...(dayIdx === 6 ? S.arrowBtnDisabled : {}) }}>›</button>
                          </>
                        )}
                      </div>
                    );
                  })}
                </Card>
              );
            })}
          </>
        )}

        {step === STEP_FINAL && (
          <>
            <div style={S.ritualStepTitle}>Setmana vinent preparada</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
              {Object.entries(countsByTopic).map(([topicId, count]) => {
                const topic = topicById(topicId);
                return (
                  <div key={topicId} style={S.mini}>
                    <div style={{ fontSize: 11.5 }}>{topic.emoji} {topic.label}</div>
                    <div style={{ fontSize: 22, fontWeight: 600, color: topic.color }}>{count}</div>
                  </div>
                );
              })}
            </div>
            <Card>
              <div style={{ fontSize: 14, lineHeight: 1.6, color: "#6d6259" }}>
                {isMatchNextWeekend
                  ? `Tens partit i ${(suggested || []).filter((t) => t.included).length} tasques a la setmana. Prepara't bé i descansa.`
                  : `${(suggested || []).filter((t) => t.included).length} tasques per la setmana vinent. Setmana de manteniment: cuida el son i la gent.`}
              </div>
            </Card>
          </>
        )}
      </div>

      <div style={S.ritualFooter}>
        <button style={{ ...S.ritualBtn, background: COLORS.ritualSet }} onClick={goNext}>
          {step === STEPS - 1 ? "Tancar la setmana" : "Següent"}
        </button>
      </div>
    </div>
  );
}
