import { S } from "../../lib/styles";
import { Card, Chips, Inp, Lbl, RPE, Title } from "../ui";

export function PhysSec({ day, addEntry, removeEntry, updateEntry }) {
  const types = ["Cursa contínua", "Intervals/HIIT", "Sèries", "Força", "Complementari", "Mobilitat", "Recuperació"];
  return (<div><Title>Físic</Title><button onClick={() => addEntry("training", { type: "", duration: "", rpe: "", details: "", category: "physical" })} style={S.pBtn}>+ Sessió</button>
    {day.training.filter(t => t.category === "physical").map(t => (<Card key={t.id}><div style={{ display: "flex", justifyContent: "space-between" }}><Lbl>Sessió</Lbl><button onClick={() => removeEntry("training", t.id)} style={S.delBtn}>×</button></div><Chips opts={types} val={t.type} set={v => updateEntry("training", t.id, "type", v)} c="#60a5fa" /><Inp label="Durada (min)" value={t.duration} onChange={v => updateEntry("training", t.id, "duration", v)} type="number" /><Lbl>RPE</Lbl><RPE val={t.rpe} set={v => updateEntry("training", t.id, "rpe", v)} /><textarea style={{...S.ta,marginTop:6}} value={t.details||""} onChange={e => updateEntry("training", t.id, "details", e.target.value)} placeholder="Detalls..." rows={2} /></Card>))}
    {day.training.filter(t => t.category === "physical").length === 0 && <p style={{ ...S.muted, textAlign: "center", marginTop: 20 }}>Cap sessió avui.</p>}
  </div>);
}
