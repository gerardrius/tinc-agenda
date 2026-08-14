import { S } from "../../lib/styles";
import { Card, Chips, Inp, Lbl, Rating, Title } from "../ui";

export function MatchSec({ day, persist }) {
  const m = day.match;
  const setM = () => persist({ ...day, match: { category: "", role: "", teams: "", rating: "", positioning: "", communication: "", keyDecisions: "", mistakes: "", strengths: "", notes: "" } });
  const um = (f, v) => persist({ ...day, match: { ...day.match, [f]: v } });
  const roles = ["Principal", "Assistent 1", "Assistent 2", "4t àrbitre", "VAR"];
  if (!m) return (<div><Title>Partits</Title><div style={{ textAlign: "center", marginTop: 40 }}><p style={S.muted}>Has arbitrat avui?</p><button onClick={setM} style={S.pBtn}>Registrar partit</button></div></div>);
  return (<div><Title>Partit d'avui</Title>
    <Card><Inp label="Categoria" value={m.category} onChange={v => um("category", v)} ph="1a RFEF, 2a Divisió..." /><Inp label="Equips" value={m.teams} onChange={v => um("teams", v)} ph="Local vs Visitant" /><Lbl>Rol</Lbl><Chips opts={roles} val={m.role} set={v => um("role", v)} c="#f59e0b" /></Card>
    <Card><Lbl>Autoavaluació</Lbl><Rating l="Global" v={m.rating} set={v => um("rating", v)} /><Rating l="Posicionament" v={m.positioning} set={v => um("positioning", v)} /><Rating l="Comunicació" v={m.communication} set={v => um("communication", v)} /></Card>
    <Card><Lbl>Decisions clau</Lbl><textarea style={S.ta} value={m.keyDecisions||""} onChange={e => um("keyDecisions", e.target.value)} placeholder="Penals, vermelles, avantatges..." rows={3} /><Lbl>Errors</Lbl><textarea style={S.ta} value={m.mistakes||""} onChange={e => um("mistakes", e.target.value)} placeholder="Què he fallat?" rows={2} /><Lbl>Encerts</Lbl><textarea style={S.ta} value={m.strengths||""} onChange={e => um("strengths", e.target.value)} placeholder="Què he fet bé?" rows={2} /><Lbl>Notes</Lbl><textarea style={S.ta} value={m.notes||""} onChange={e => um("notes", e.target.value)} placeholder="Ambient, delegat..." rows={2} /></Card>
  </div>);
}
