import { useState } from "react";
import { S, COLORS } from "../lib/styles";
import { Card, Checkbox, TopicPill } from "./ui";
import { BalanceWheel } from "./SetmanaView";
import { computeDomainStats } from "../lib/domainStats";
import { weekStartKey, parseIntention, taskForDay } from "../lib/taskRules";
import { WEEKDAYS_ABBR, INTENTION_SUGGESTIONS_ALWAYS, topicById, nextTopic } from "../lib/constants";

const STEPS = 5;

export function RitualSetmanal({ day, global, allData, matchState, persistDates, onClose }) {
  const [step, setStep] = useState(0);
  const [rate, setRate] = useState(null);
  const [why, setWhy] = useState("");
  const [intention, setIntention] = useState("");
  const [suggested, setSuggested] = useState(null); // seeded on entering step 3

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
    if (step === 2) seedSuggestions();
    if (step < STEPS - 1) setStep(step + 1);
    else finish();
  };

  const isMatchNextWeekend = matchState?.partitA || matchState?.quart;
  const suggestionPills = [
    isMatchNextWeekend ? "⚽ Setmana de partit" : "🔄 Setmana de manteniment",
    ...INTENTION_SUGGESTIONS_ALWAYS,
  ];

  const finish = () => {
    const wk = weekStartKey();
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
    const nextMonday = new Date(wk); nextMonday.setDate(nextMonday.getDate() + 7);
    const updates = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date(nextMonday); d.setDate(d.getDate() + i);
      const dk = d.toISOString().split("T")[0];
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
        <div style={{ display: "flex", gap: 5 }}>
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
          </>
        )}

        {step === 3 && suggested && (
          <>
            <div style={S.ritualStepTitle}>Generació de tasques</div>
            <div style={S.ritualStepSubtitle}>Revisa i ajusta abans de confirmar.</div>
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
            <div style={{ fontSize: 11.5, color: COLORS.textMuted, marginTop: 4 }}>Detectat a la teva intenció: {suggested.length} tasques suggerides.</div>
          </>
        )}

        {step === 4 && (
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
