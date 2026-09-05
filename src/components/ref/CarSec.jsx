import { S } from "../../lib/styles";
import { Card, Lbl, Title } from "../ui";

export function CarSec({ day, u }) {
  return (<div><Title>Carrera</Title><Card style={{ borderLeft: "3px solid #f59e0b" }}><div style={{ fontSize: 13, fontWeight: 700, color: "#f59e0b", marginBottom: 4 }}>Objectiu</div><p style={{ fontSize: 12, color: "#2a2420", margin: 0 }}>Pujar a 2a Divisió com a professional</p></Card><Card><Lbl>Notes de carrera</Lbl><textarea style={S.ta} value={day.careerNotes||""} onChange={e => u("careerNotes", null, e.target.value)} placeholder="Feedback delegats, comitè..." rows={4} /></Card></div>);
}
