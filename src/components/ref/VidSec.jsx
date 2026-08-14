import { S } from "../../lib/styles";
import { Card, Inp, Lbl, Title } from "../ui";

export function VidSec({ day, addEntry, removeEntry, updateEntry }) {
  return (<div><Title>Vídeo-anàlisi</Title><button onClick={() => addEntry("video", { match: "", duration: "", situations: "", learnings: "" })} style={S.pBtn}>+ Sessió</button>
    {(day.video||[]).map(v => (<Card key={v.id}><div style={{ display: "flex", justifyContent: "space-between" }}><Lbl>Sessió</Lbl><button onClick={() => removeEntry("video", v.id)} style={S.delBtn}>×</button></div><Inp label="Partit" value={v.match} onChange={val => updateEntry("video", v.id, "match", val)} ph="El meu J5..." /><Inp label="Durada (min)" value={v.duration} onChange={val => updateEntry("video", v.id, "duration", val)} type="number" /><Lbl>Situacions</Lbl><textarea style={S.ta} value={v.situations||""} onChange={e => updateEntry("video", v.id, "situations", e.target.value)} placeholder="Penal min 34..." rows={3} /><Lbl>Conclusions</Lbl><textarea style={S.ta} value={v.learnings||""} onChange={e => updateEntry("video", v.id, "learnings", e.target.value)} placeholder="Patrons, correccions..." rows={2} /></Card>))}
    {(day.video||[]).length === 0 && <p style={{ ...S.muted, textAlign: "center", marginTop: 20 }}>Cap sessió avui.</p>}
  </div>);
}
