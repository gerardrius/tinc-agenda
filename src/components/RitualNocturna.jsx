import { useState, useRef } from "react";
import { S, COLORS } from "../lib/styles";
import { Card, Checkbox, TopicPill, RankBubble, ArrowBtn, DragHandle } from "./ui";
import { RITUAL_SCALES, topicById, nextTopic } from "../lib/constants";
import { isBlocked } from "../lib/taskRules";
import { uid, todayKey, fmtTime } from "../lib/utils";
import { last7Keys } from "../lib/domainStats";

const STEPS = 5;
const tomorrowKey = () => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().split("T")[0]; };

function ScaleCard({ label, scale, val, onSelect }) {
  return (
    <Card>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <span style={{ fontSize: 13.5, fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: 11.5, color: COLORS.textSec }}>{scale[0]} → {scale[scale.length - 1]}</span>
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        {scale.map((emoji, i) => (
          <button key={i} onClick={() => onSelect(i + 1)} style={{
            flex: 1, height: 44, borderRadius: 10, fontSize: 19, cursor: "pointer", fontFamily: "inherit",
            border: `1.5px solid ${val === i + 1 ? COLORS.accent : COLORS.border}`,
            background: val === i + 1 ? "#fbf2ea" : "#fdfbf9",
          }}>{emoji}</button>
        ))}
      </div>
    </Card>
  );
}

export function RitualNocturna({ day, allData, calEvents, persistDates, onClose }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({ energia: null, anim: null, productivitat: null, note: "" });
  const [taskDecisions, setTaskDecisions] = useState({}); // { [taskId]: 'moved' | 'dropped' }
  const [tomorrow, setTomorrow] = useState(null); // seeded on entering step 3
  const dragState = useRef(null);
  const [draggingIdx, setDraggingIdx] = useState(null);

  const habits = day.habits || {};
  const tasks = day.tasks || [];

  const seedTomorrow = () => {
    if (tomorrow) return;
    const carried = tasks
      .filter((t) => !t.done && taskDecisions[t.id] === "moved")
      .map((t) => ({ id: uid(), label: t.label, topic: t.topic, movedCount: (t.movedCount || 0) + 1 }));
    setTomorrow(carried);
  };

  const goNext = () => {
    if (step === 1) seedTomorrow();
    if (step < STEPS - 1) setStep(step + 1);
    else finish();
  };

  const finish = () => {
    // Drop tasks the user let go of; keep everything else as-is (habit/task
    // toggles already persisted live via `persist` in earlier steps). Both
    // dates are written in a single persistDates call — writing them via two
    // separate calls would have each read the same stale `day`/`allData`
    // snapshot and the second call would silently clobber the first.
    const remainingToday = tasks.filter((t) => taskDecisions[t.id] !== "dropped" && taskDecisions[t.id] !== "moved");
    const tk = tomorrowKey();
    const tmrDay = allData[tk] || { date: tk, habits: {}, customHabits: [], tasks: [], mood: null, energy: null, qa: {}, nightlyReview: null, ritualDismissed: { nit: false, set: false }, expenses: [], social: [] };
    persistDates({
      [todayKey()]: { ...day, tasks: remainingToday, nightlyReview: { ...answers } },
      [tk]: { ...tmrDay, tasks: (tomorrow || []).map((t) => ({ id: t.id, label: t.label, topic: t.topic, hint: "", done: false, movedCount: t.movedCount })) },
    });
    onClose();
  };

  const moveRow = (from, to) => {
    if (to < 0 || to >= tomorrow.length) return;
    const next = [...tomorrow];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    setTomorrow(next);
  };

  const onHandleDown = (i, e) => {
    dragState.current = { i, y0: e.clientY, startedAt: Date.now(), moved: false };
    setTimeout(() => {
      if (dragState.current?.i === i && !dragState.current.moved) setDraggingIdx(i);
    }, 460);
  };
  const onHandleMove = (e) => {
    if (draggingIdx == null || !dragState.current) return;
    const dy = e.clientY - dragState.current.y0;
    dragState.current.moved = true;
    const rowH = 54;
    if (Math.abs(dy) > rowH) {
      const dir = dy > 0 ? 1 : -1;
      moveRow(draggingIdx, draggingIdx + dir);
      setDraggingIdx(draggingIdx + dir);
      dragState.current.y0 = e.clientY;
    }
  };
  const onHandleUp = () => { setDraggingIdx(null); dragState.current = null; };

  const eyebrow = `Revisió nocturna · pas ${step + 1} de ${STEPS}`;

  return (
    <div style={S.ritualShell} onPointerMove={onHandleMove} onPointerUp={onHandleUp}>
      <div style={S.ritualHeader}>
        <button style={S.backArrow} onClick={() => (step === 0 ? onClose() : setStep(step - 1))}>←</button>
        <div style={{ display: "flex", gap: 5 }}>
          {Array.from({ length: STEPS }, (_, i) => (
            <span key={i} style={{ ...S.ritualDot, ...(i < step ? S.ritualDotDone : {}), ...(i === step ? S.ritualDotActive : {}) }} />
          ))}
        </div>
        <button style={S.backArrow} onClick={onClose}>✕</button>
      </div>

      <div style={S.ritualBody}>
        <div style={S.ritualEyebrow}>{eyebrow}</div>

        {step === 0 && (
          <>
            <div style={S.ritualStepTitle}>Com ha anat avui?</div>
            <div style={S.ritualStepSubtitle}>Tres tocs i una nota opcional. Trenta segons.</div>
            <ScaleCard label="Energia avui" scale={RITUAL_SCALES.energia} val={answers.energia} onSelect={(v) => setAnswers({ ...answers, energia: v })} />
            <ScaleCard label="Ànim" scale={RITUAL_SCALES.anim} val={answers.anim} onSelect={(v) => setAnswers({ ...answers, anim: v })} />
            <ScaleCard label="Productivitat" scale={RITUAL_SCALES.productivitat} val={answers.productivitat} onSelect={(v) => setAnswers({ ...answers, productivitat: v })} />
            <Card>
              <div style={{ fontSize: 13.5, fontWeight: 500, marginBottom: 8 }}>Alguna cosa a destacar?</div>
              <textarea style={{ ...S.ta, height: 56, resize: "none" }} placeholder="Opcional" value={answers.note} onChange={(e) => setAnswers({ ...answers, note: e.target.value })} />
            </Card>
          </>
        )}

        {step === 1 && (
          <>
            <div style={S.ritualStepTitle}>Revisió de tasques</div>
            <div style={S.ritualStepSubtitle}>Què has tancat i què fem amb la resta.</div>
            {Object.keys(habits).length === 0 && tasks.length === 0 && <p style={S.muted}>Cap tasca ni hàbit avui.</p>}
            {tasks.map((t) => {
              const topic = topicById(t.topic);
              const decision = taskDecisions[t.id];
              if (t.done) {
                return (
                  <Card key={t.id} style={{ opacity: 0.62 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Checkbox checked size={20} onChange={() => {}} />
                      <span style={{ flex: 1, fontSize: 13.5, color: COLORS.textFaint, textDecoration: "line-through" }}>{t.label}</span>
                      <span style={{ ...S.topicPill, color: COLORS.positive, background: "#eaf6f0" }}>fet</span>
                    </div>
                  </Card>
                );
              }
              return (
                <Card key={t.id}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: decision ? 0 : 8 }}>
                    <Checkbox checked={false} size={20} onChange={() => {}} />
                    <span style={{ flex: 1, fontSize: 13.5 }}>{t.label}{isBlocked(t) && " 🔴 Bloquejada"}</span>
                    <span style={{ ...S.topicPill, color: COLORS.textSec, background: "#f3eee8" }}>puntual</span>
                  </div>
                  {!decision && (
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={() => setTaskDecisions({ ...taskDecisions, [t.id]: "moved" })} style={{ ...S.smBtn, flex: 1, textAlign: "center", height: 38 }}>Mou a demà</button>
                      <button onClick={() => setTaskDecisions({ ...taskDecisions, [t.id]: "dropped" })} style={{ ...S.smBtn, flex: 1, textAlign: "center", height: 38, color: COLORS.textSec }}>Deixa-ho córrer</button>
                    </div>
                  )}
                </Card>
              );
            })}
            {Object.entries(habits).filter(([, done]) => !done).map(([id]) => (
              <Card key={id}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <Checkbox checked={false} size={20} onChange={() => {}} />
                  <span style={{ flex: 1, fontSize: 13.5 }}>Hàbit no completat</span>
                  <span style={{ ...S.topicPill, color: COLORS.textSec, background: "#f3eee8" }}>hàbit</span>
                </div>
                <div style={{ fontSize: 11.5, color: COLORS.alert }}>Ratxa trencada</div>
              </Card>
            ))}
          </>
        )}

        {step === 2 && tomorrow && (
          <>
            <div style={S.ritualStepTitle}>Prioritats de demà</div>
            <div style={S.ritualStepSubtitle}>Ordena-les. Les 3 primeres són el que compta.</div>
            {tomorrow.slice(0, 6).map((t, i) => {
              const topic = topicById(t.topic);
              const lifted = draggingIdx === i;
              return (
                <div key={t.id} style={{ ...S.taskRow, ...(lifted ? S.taskRowLifted : {}) }}>
                  <DragHandle onPointerDown={(e) => onHandleDown(i, e)} />
                  <RankBubble rank={i + 1} />
                  <input
                    style={S.inlineInput}
                    value={t.label}
                    placeholder="Nova tasca"
                    onChange={(e) => setTomorrow(tomorrow.map((x) => (x.id === t.id ? { ...x, label: e.target.value } : x)))}
                  />
                  <button onClick={() => setTomorrow(tomorrow.map((x) => (x.id === t.id ? { ...x, topic: nextTopic(x.topic) } : x)))} style={{ border: "none", background: "none", padding: 0, cursor: "pointer" }}>
                    <TopicPill topic={topic} />
                  </button>
                  <ArrowBtn dir="up" disabled={i === 0} onClick={() => moveRow(i, i - 1)} />
                  <ArrowBtn dir="down" disabled={i === tomorrow.length - 1} onClick={() => moveRow(i, i + 1)} />
                </div>
              );
            })}
            <button onClick={() => setTomorrow([...tomorrow, { id: uid(), label: "", topic: "arbitratge" }])} style={{ width: "100%", minHeight: 44, border: "1px dashed #ded6cd", background: "none", borderRadius: 10, color: COLORS.textSec, fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit", marginTop: 8 }}>➕ Afegir tasca</button>
            <div style={{ fontSize: 11.5, color: COLORS.textMuted, marginTop: 8 }}>Manté premut ⠿ per arrossegar, o fes servir les fletxes. Les 3 primeres són prioritats.</div>
          </>
        )}

        {step === 3 && (
          <>
            <div style={S.ritualStepTitle}>Agenda de demà</div>
            <div style={S.ritualStepSubtitle}>Els teus esdeveniments amb les prioritats col·locades a sobre.</div>
            {(calEvents || []).filter((e) => e.start?.startsWith(tomorrowKey())).map((e, i) => (
              <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8 }}>
                <span style={{ width: 38, fontFamily: "'JetBrains Mono',monospace", fontSize: 11.5, color: COLORS.textMuted, flexShrink: 0 }}>{fmtTime(e.start)}</span>
                <div style={{ flex: 1, background: COLORS.borderSoft, borderRadius: 8, padding: "8px 10px", fontSize: 13, color: "#6d6259" }}>{e.title}</div>
              </div>
            ))}
            {(tomorrow || []).slice(0, 3).map((t) => (
              <div key={t.id} style={{ display: "flex", gap: 10, marginBottom: 8 }}>
                <span style={{ width: 38, flexShrink: 0 }} />
                <div style={{ flex: 1, background: "#fff", border: `1px solid ${COLORS.border}`, borderLeft: `3px solid ${COLORS.accent}`, borderRadius: 8, padding: "8px 10px", fontSize: 13, fontWeight: 500 }}>{t.label || "Nova tasca"}</div>
              </div>
            ))}
          </>
        )}

        {step === 4 && (
          <div style={{ textAlign: "center", padding: "24px 0" }}>
            <div style={{ fontSize: 44, marginBottom: 12 }}>🌙</div>
            <div style={{ fontSize: 29, fontWeight: 600 }}>Bona nit, Gerard.</div>
            <div style={{ fontSize: 14, color: "#6d6259", maxWidth: 280, margin: "10px auto 0" }}>
              {answers.note || `Has completat ${Object.values(habits).filter(Boolean).length} de ${Object.keys(habits).length} hàbits i has tancat ${tasks.filter((t) => t.done).length} prioritat${tasks.filter((t) => t.done).length === 1 ? "" : "s"}. Bon dia.`}
            </div>
          </div>
        )}
      </div>

      <div style={S.ritualFooter}>
        <button style={{ ...S.ritualBtn, background: COLORS.ritualNit }} onClick={goNext}>
          {step === STEPS - 1 ? "Bona nit" : "Següent"}
        </button>
      </div>
    </div>
  );
}
