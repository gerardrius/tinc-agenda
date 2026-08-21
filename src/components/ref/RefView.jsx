import { REF_SUBS } from "../../lib/constants";
import { refSub } from "../../lib/utils";
import { S } from "../../lib/styles";
import { Title } from "../ui";
import { MatchSec } from "./MatchSec";
import { PlannerSec } from "./PlannerSec";
import { FormationSec } from "./FormationSec";
import { PhysSec } from "./PhysSec";
import { CogSec } from "./CogSec";
import { VidSec } from "./VidSec";
import { CarSec } from "./CarSec";

export function RefView({ day, sub, setSub, u, addEntry, removeEntry, updateEntry, persist, global, saveGlobal }) {
  if (!sub) return (<div><Title>Arbitratge</Title>{REF_SUBS.map(s => (
    <button key={s.id} onClick={() => setSub(s.id)} style={S.navC}>
      <span style={{ fontSize: 18 }}>{s.icon}</span>
      <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 600, color: "#e5e7eb" }}>{s.label}</div><div style={{ fontSize: 10, color: "#6b7280" }}>{refSub(s.id, day, global)}</div></div>
      <span style={{ color: "#444" }}>→</span>
    </button>))}</div>);

  return (<div><button onClick={() => setSub(null)} style={S.back}>← Arbitratge</button>
    {sub === "matches" && <MatchSec day={day} persist={persist} global={global} saveGlobal={saveGlobal} />}
    {sub === "planner" && <PlannerSec global={global} saveGlobal={saveGlobal} />}
    {sub === "formation" && <FormationSec day={day} u={u} global={global} saveGlobal={saveGlobal} />}
    {sub === "physical" && <PhysSec day={day} addEntry={addEntry} removeEntry={removeEntry} updateEntry={updateEntry} />}
    {sub === "cognitive" && <CogSec day={day} addEntry={addEntry} removeEntry={removeEntry} updateEntry={updateEntry} />}
    {sub === "video" && <VidSec day={day} addEntry={addEntry} removeEntry={removeEntry} updateEntry={updateEntry} />}
    {sub === "career" && <CarSec day={day} u={u} />}
  </div>);
}
