import { S } from "../../lib/styles";
import { Card, Chips, Inp, Lbl, Title } from "../ui";

export function CogSec({ day, addEntry, removeEntry, updateEntry }) {
  const types = ["Vídeo-anàlisi", "Atenció/retenció", "Reglament", "Simulació", "FIFA Red", "Formació"];
  return (<div><Title>Cognitiu</Title><button onClick={() => addEntry("cognitive", { type: "", duration: "", focus: "", notes: "" })} style={S.pBtn}>+ Sessió</button>
    {(day.cognitive||[]).map(c => (<Card key={c.id}><div style={{ display: "flex", justifyContent: "space-between" }}><Lbl>Sessió</Lbl><button onClick={() => removeEntry("cognitive", c.id)} style={S.delBtn}>×</button></div><Chips opts={types} val={c.type} set={v => updateEntry("cognitive", c.id, "type", v)} c="#a78bfa" /><Inp label="Durada (min)" value={c.duration} onChange={v => updateEntry("cognitive", c.id, "duration", v)} type="number" /><Inp label="Focus" value={c.focus} onChange={v => updateEntry("cognitive", c.id, "focus", v)} ph="Avantatges, mans àrea..." /><textarea style={{...S.ta,marginTop:6}} value={c.notes||""} onChange={e => updateEntry("cognitive", c.id, "notes", e.target.value)} placeholder="Aprenentatges..." rows={2} /></Card>))}
    {(day.cognitive||[]).length === 0 && <p style={{ ...S.muted, textAlign: "center", marginTop: 20 }}>Cap sessió avui.</p>}
  </div>);
}
