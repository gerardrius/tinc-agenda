import { WORK_AREAS } from "../lib/constants";
import { uid } from "../lib/utils";
import { S } from "../lib/styles";
import { Card, Chips, Inp, Lbl, Title } from "./ui";

export function WorkView({ day, addEntry, removeEntry, updateEntry, global, saveGlobal }) {
  const wr = global.workReminders || [];
  return (<div><Title>Feina</Title>
    <Card>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}><Lbl m0>Recordatoris de feina</Lbl><button onClick={() => saveGlobal({ ...global, workReminders: [...wr, { id: uid(), text: "", done: false }] })} style={S.smBtn}>+ Nou</button></div>
      {wr.map(r => (<div key={r.id} style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 4 }}>
        <button onClick={() => saveGlobal({ ...global, workReminders: wr.map(x => x.id === r.id ? { ...x, done: !x.done } : x) })} style={{ ...S.chk, width: 18, height: 18, fontSize: 10, background: r.done ? "#60a5fa" : "#252a30", color: r.done ? "#000" : "#444", border: "none", cursor: "pointer" }}>{r.done ? "✓" : ""}</button>
        <input style={{ ...S.inp, flex: 1, fontSize: 12, opacity: r.done ? 0.4 : 1, textDecoration: r.done ? "line-through" : "none" }} value={r.text} onChange={e => saveGlobal({ ...global, workReminders: wr.map(x => x.id === r.id ? { ...x, text: e.target.value } : x) })} placeholder="Recordatori..." />
        <button onClick={() => saveGlobal({ ...global, workReminders: wr.filter(x => x.id !== r.id) })} style={{ ...S.delBtn, fontSize: 14 }}>×</button>
      </div>))}
      {wr.length === 0 && <p style={S.muted}>Afegeix recordatoris de tasques.</p>}
    </Card>
    {WORK_AREAS.map(area => { const entries = (day.work || []).filter(w => w.area === area.id); return (
      <div key={area.id} style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}><span>{area.icon}</span><span style={{ fontSize: 13, fontWeight: 600, color: area.color }}>{area.name}</span></div>
          <button onClick={() => addEntry("work", { area: area.id, task: "", minutes: "", status: "doing", notes: "" })} style={{ ...S.smBtn, borderColor: area.color, color: area.color }}>+ Tasca</button>
        </div>
        {entries.map(w => (<Card key={w.id}><div style={{ display: "flex", justifyContent: "space-between" }}><Chips opts={["doing","done","blocked"]} labels={["En curs","Fet","Bloquejat"]} val={w.status} set={v => updateEntry("work", w.id, "status", v)} c={area.color} /><button onClick={() => removeEntry("work", w.id)} style={S.delBtn}>×</button></div><Inp label="Tasca" value={w.task} onChange={v => updateEntry("work", w.id, "task", v)} ph="Què has fet?" /><Inp label="Minuts" value={w.minutes} onChange={v => updateEntry("work", w.id, "minutes", v)} type="number" /></Card>))}
        {entries.length === 0 && <p style={{ ...S.muted, marginLeft: 24 }}>Sense registres avui.</p>}
      </div>); })}
  </div>);
}
