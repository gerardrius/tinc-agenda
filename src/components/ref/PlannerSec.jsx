import { useState } from "react";
import { TRAIN_TYPES_PLAN } from "../../lib/constants";
import { uid, todayKey, fmtDate } from "../../lib/utils";
import { S } from "../../lib/styles";
import { Card, Lbl, Title } from "../ui";

export function PlannerSec({ global, saveGlobal }) {
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
