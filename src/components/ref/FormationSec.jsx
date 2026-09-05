import { useState } from "react";
import { FORMATION_TYPES, WEEKDAYS } from "../../lib/constants";
import { uid } from "../../lib/utils";
import { S } from "../../lib/styles";
import { Card, Lbl, Title } from "../ui";

export function FormationSec({ day, u, global, saveGlobal }) {
  const plan = global.formationPlan || [];
  const [selDow, setSelDow] = useState(null);
  const todayDow = (new Date().getDay() + 6) % 7;

  const add = (dow, typeId) => {
    const label = { video: "Vídeo", verbal: "Verbalització", laws: "Lleis del joc", physical: "Físic", other: "Altres" }[typeId];
    saveGlobal({ ...global, formationPlan: [...plan, { id: uid(), dow, type: typeId, label }] });
  };
  const rem = (id) => saveGlobal({ ...global, formationPlan: plan.filter(p => p.id !== id) });
  const toggleToday = (id) => u("formation", id, !day.formation?.[id]);

  const todayItems = plan.filter(p => p.dow === todayDow);

  return (<div><Title>Formació</Title>
    <p style={{ fontSize: 11, color: "#8a7f74", marginBottom: 14 }}>Pla recurrent setmanal — es repeteix cada setmana. Prem un dia per editar-lo.</p>

    <Card>
      <Lbl>Avui — {WEEKDAYS[todayDow]}</Lbl>
      {todayItems.length === 0 && <p style={S.muted}>Cap ítem de formació per avui.</p>}
      {todayItems.map(it => (
        <button key={it.id} onClick={() => toggleToday(it.id)} style={{ ...S.habBtn, background: day.formation?.[it.id] ? "rgba(74,222,128,0.07)" : "transparent", borderColor: day.formation?.[it.id] ? "rgba(74,222,128,0.22)" : "#ede8e3" }}>
          <span style={{ ...S.chk, background: day.formation?.[it.id] ? "#c4855a" : "#ede8e3", color: day.formation?.[it.id] ? "#000" : "#b6aa9e" }}>{day.formation?.[it.id] ? "✓" : ""}</span>
          <span style={{ fontSize: 12, color: day.formation?.[it.id] ? "#4f8f74" : "#888" }}>{it.label}</span>
        </button>
      ))}
    </Card>

    <div style={{ display: "flex", gap: 3, marginBottom: 6 }}>
      {WEEKDAYS.map((wd, di) => { const items = plan.filter(p => p.dow === di); const isT = di === todayDow; return (
        <button key={di} onClick={() => setSelDow(selDow === di ? null : di)} style={{ flex: 1, padding: "4px 2px", borderRadius: 6, border: isT ? "2px solid #c4855a" : selDow === di ? "2px solid #a78bfa" : "1px solid #ede8e3", background: "#ffffff", cursor: "pointer", textAlign: "center", minHeight: 52 }}>
          <div style={{ fontSize: 8, color: isT ? "#c4855a" : "#8a7f74", fontWeight: isT ? 700 : 400 }}>{wd.slice(0, 2)}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 1, alignItems: "center", marginTop: 4 }}>{items.map(it => { const tp = FORMATION_TYPES.find(t => t.id === it.type); return <div key={it.id} style={{ width: 8, height: 8, borderRadius: 2, background: tp?.color || "#b6aa9e" }} />; })}</div>
        </button>); })}
    </div>

    {selDow !== null && (
      <Card style={{ borderColor: "#a78bfa33" }}>
        <div style={{ fontSize: 11, color: "#a78bfa", marginBottom: 8, fontWeight: 600 }}>{WEEKDAYS[selDow]}</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 8 }}>{FORMATION_TYPES.map(tp => (
          <button key={tp.id} onClick={() => add(selDow, tp.id)} style={{ ...S.chip, borderColor: tp.color + "44", color: tp.color, background: tp.color + "15" }}>+ {tp.label}</button>
        ))}</div>
        {plan.filter(p => p.dow === selDow).map(it => { const tp = FORMATION_TYPES.find(t => t.id === it.type); return (
          <div key={it.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0", borderBottom: "1px solid #ede8e3" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}><div style={{ width: 8, height: 8, borderRadius: 2, background: tp?.color }} /><span style={{ fontSize: 12, color: "#2a2420" }}>{tp?.label}</span></div>
            <button onClick={() => rem(it.id)} style={{ ...S.delBtn, fontSize: 14 }}>×</button>
          </div>); })}
        {plan.filter(p => p.dow === selDow).length === 0 && <p style={S.muted}>Cap ítem aquest dia.</p>}
      </Card>
    )}

    <Card><Lbl>Llegenda</Lbl><div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>{FORMATION_TYPES.map(tp => (
      <div key={tp.id} style={{ display: "flex", alignItems: "center", gap: 4 }}><div style={{ width: 10, height: 10, borderRadius: 2, background: tp.color }} /><span style={{ fontSize: 10, color: "#8a7f74" }}>{tp.label}</span></div>
    ))}</div></Card>
  </div>);
}
