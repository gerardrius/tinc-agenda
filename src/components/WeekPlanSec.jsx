import { WEEK_TAGS } from "../lib/constants";
import { uid, fmtDate } from "../lib/utils";
import { weekStartKey } from "../lib/habitSuggest";
import { S } from "../lib/styles";
import { Card, Lbl, Title } from "./ui";

export function WeekPlanSec({ global, saveGlobal, setSub }) {
  const wk = weekStartKey();
  const plans = global.weeklyPlans || {};
  const plan = plans[wk] || { weekStart: wk, tags: [], goals: [] };

  const savePlan = (next) => saveGlobal({ ...global, weeklyPlans: { ...plans, [wk]: next } });
  const toggleTag = (id) => {
    const tags = plan.tags.includes(id) ? plan.tags.filter(t => t !== id) : [...plan.tags, id];
    savePlan({ ...plan, tags });
  };
  const addGoal = () => savePlan({ ...plan, goals: [...plan.goals, { id: uid(), text: "" }] });
  const setGoal = (id, text) => savePlan({ ...plan, goals: plan.goals.map(g => g.id === id ? { ...g, text } : g) });
  const removeGoal = (id) => savePlan({ ...plan, goals: plan.goals.filter(g => g.id !== id) });

  const monday = new Date(wk + "T12:00");
  const sunday = new Date(monday); sunday.setDate(sunday.getDate() + 6);

  return (
    <div>
      <button onClick={() => setSub(null)} style={S.back}>← Avui</button>
      <Title>Planificació setmanal</Title>
      <p style={{ fontSize: 11, color: "#8a7f74", marginBottom: 14 }}>
        {fmtDate(monday)} – {fmtDate(sunday)}. Els hàbits del dia es suggereixen a partir d'això.
      </p>
      <Card>
        <Lbl>Aquesta setmana toca...</Lbl>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 4 }}>
          {WEEK_TAGS.map(t => (
            <button key={t.id} onClick={() => toggleTag(t.id)} style={{ ...S.chip, background: plan.tags.includes(t.id) ? t.color + "22" : "#ffffff", color: plan.tags.includes(t.id) ? t.color : "#8a7f74", borderColor: plan.tags.includes(t.id) ? t.color + "44" : "#ede8e3" }}>
              {t.label}
            </button>
          ))}
        </div>
      </Card>
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <Lbl m0>Objectius de la setmana</Lbl>
          <button onClick={addGoal} style={S.smBtn}>+ Nou</button>
        </div>
        {plan.goals.map(g => (
          <div key={g.id} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
            <input style={{ ...S.inp, flex: 1, fontSize: 12 }} value={g.text} onChange={e => setGoal(g.id, e.target.value)} placeholder="Escriu un objectiu..." />
            <button onClick={() => removeGoal(g.id)} style={{ ...S.delBtn, fontSize: 14 }}>×</button>
          </div>
        ))}
        {plan.goals.length === 0 && <p style={S.muted}>Cap objectiu encara.</p>}
      </Card>
    </div>
  );
}
