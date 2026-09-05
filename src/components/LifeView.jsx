import { useState } from "react";
import { MOODS, FEELINGS } from "../lib/constants";
import { S } from "../lib/styles";
import { Card, Inp, Lbl, Title } from "./ui";
import { SleepMapSec } from "./SleepMapSec";

export function LifeView({ day, u, addEntry, removeEntry, updateEntry }) {
  const [lt, setLt] = useState("mood");
  const lifeTabs = [{ id: "mood", label: "Benestar" }, { id: "social", label: "Social" }, { id: "screen", label: "Pantalles" }, { id: "sleep", label: "Son" }];

  return (<div><Title>Vida</Title>
    <div style={{ display: "flex", gap: 3, marginBottom: 14 }}>{lifeTabs.map(t => (
      <button key={t.id} onClick={() => setLt(t.id)} style={{ ...S.subT, background: lt === t.id ? "rgba(74,222,128,0.1)" : "#ffffff", color: lt === t.id ? "#c4855a" : "#8a7f74", borderColor: lt === t.id ? "rgba(74,222,128,0.2)" : "#ede8e3" }}>{t.label}</button>
    ))}</div>

    {lt === "mood" && (<Card>
      <Lbl>Com et trobes ara?</Lbl>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 4, marginBottom: 12 }}>{MOODS.map(m => (
        <button key={m.id} onClick={() => u("mood", null, m.id)} style={{ flex: 1, padding: "8px 2px", borderRadius: 8, border: day.mood === m.id ? `2px solid ${m.color}` : "1px solid #ede8e3", background: day.mood === m.id ? m.color + "18" : "#ffffff", cursor: "pointer", textAlign: "center" }}>
          <div style={{ fontSize: 20 }}>{m.emoji}</div><div style={{ fontSize: 8, color: day.mood === m.id ? m.color : "#8a7f74", marginTop: 2 }}>{m.label}</div>
        </button>))}</div>
      <Lbl>Sentiments</Lbl>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 10 }}>{FEELINGS.map(f => (
        <button key={f} onClick={() => { const fl = day.feelings || []; u("feelings", null, fl.includes(f) ? fl.filter(x => x !== f) : [...fl, f]); }} style={{ ...S.chip, background: (day.feelings||[]).includes(f) ? "#c4855a22" : "#ffffff", color: (day.feelings||[]).includes(f) ? "#c4855a" : "#8a7f74", borderColor: (day.feelings||[]).includes(f) ? "#c4855a44" : "#ede8e3" }}>{f}</button>
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
      {parseInt(day.screen.social) > 20 && <div style={{ border: "1px solid #d4856a33", background: "#d4856a08", borderRadius: 8, padding: "8px 12px", marginTop: 6 }}><p style={{ color: "#d4856a", fontSize: 11, margin: 0 }}>⚠️ Per sobre de 20 min en xarxes.</p></div>}
    </div>)}

    {lt === "sleep" && <SleepMapSec />}
  </div>);
}
