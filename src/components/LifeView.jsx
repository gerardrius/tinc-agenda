import { useState } from "react";
import { MOODS, FEELINGS } from "../lib/constants";
import { S } from "../lib/styles";
import { Card, Chips, Inp, Lbl, Title } from "./ui";

export function LifeView({ day, u, addEntry, removeEntry, updateEntry }) {
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
