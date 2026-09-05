import { useState } from "react";
import { S } from "../../lib/styles";
import { Card, Chips, Inp, Lbl, Rating, Title } from "../ui";
import { uid, todayKey, fmtDate } from "../../lib/utils";
import * as googleAuth from "../../lib/googleAuth";
import { createEvent } from "../../lib/googleCalendar";

function UpcomingMatches({ global, saveGlobal }) {
  const matches = global.matches || [];
  const [form, setForm] = useState(null);
  const [creatingId, setCreatingId] = useState(null);
  const [err, setErr] = useState(null);
  const roles = ["Principal", "Assistent 1", "Assistent 2", "4t àrbitre", "VAR"];

  const upcoming = matches.filter(m => m.date >= todayKey()).sort((a, b) => a.date.localeCompare(b.date));

  const save = (list) => saveGlobal({ ...global, matches: list });
  const startNew = () => setForm({ id: uid(), date: todayKey(), time: "", competition: "", teams: "", role: "", preNotes: "" });
  const commit = () => { if (!form.teams) return; save([...matches, form]); setForm(null); };
  const remove = (id) => save(matches.filter(m => m.id !== id));

  const createReminders = async (match) => {
    setErr(null);
    setCreatingId(match.id);
    try {
      if (!googleAuth.isConfigured()) throw new Error("Falta VITE_GOOGLE_CLIENT_ID (mira el README).");
      let token = googleAuth.getToken();
      if (!token) token = await googleAuth.connect();
      const startISO = new Date(`${match.date}T${match.time || "12:00"}:00`).toISOString();
      const endISO = new Date(new Date(startISO).getTime() + 2 * 3600000).toISOString();
      const description = [match.competition, match.role, match.preNotes].filter(Boolean).join("\n\n");
      const eventId = await createEvent(token, { summary: `⚽ ${match.teams}`, description, startISO, endISO });
      save(matches.map(m => m.id === match.id ? { ...m, calendarEventId: eventId } : m));
    } catch (e) {
      setErr(e.message || "Error creant l'event al calendari.");
    }
    setCreatingId(null);
  };

  return (
    <Card>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <Lbl m0>Propers partits</Lbl>
        {!form && <button onClick={startNew} style={S.smBtn}>+ Nou</button>}
      </div>
      {err && <p style={{ ...S.muted, color: "#d4856a" }}>{err}</p>}
      {form && (
        <div style={{ marginBottom: 10, paddingBottom: 10, borderBottom: "1px solid #ede8e3" }}>
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ flex: 1 }}><Inp label="Data" type="date" value={form.date} onChange={v => setForm({ ...form, date: v })} /></div>
            <div style={{ flex: 1 }}><Inp label="Hora" type="time" value={form.time} onChange={v => setForm({ ...form, time: v })} /></div>
          </div>
          <Inp label="Competició" value={form.competition} onChange={v => setForm({ ...form, competition: v })} ph="1a RFEF, 2a Divisió..." />
          <Inp label="Equips" value={form.teams} onChange={v => setForm({ ...form, teams: v })} ph="Local vs Visitant" />
          <Lbl>Rol</Lbl><Chips opts={roles} val={form.role} set={v => setForm({ ...form, role: v })} c="#f59e0b" />
          <Lbl>Notes prèvies / pensaments</Lbl>
          <textarea style={S.ta} value={form.preNotes} onChange={e => setForm({ ...form, preNotes: e.target.value })} placeholder="Què vull tenir present abans d'aquest partit?" rows={2} />
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <button onClick={commit} style={{ ...S.smBtn, color: "#c4855a" }}>Desar</button>
            <button onClick={() => setForm(null)} style={S.smBtn}>Cancel·lar</button>
          </div>
        </div>
      )}
      {upcoming.map(m => (
        <div key={m.id} style={{ padding: "8px 0", borderBottom: "1px solid #ede8e3" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: 12, color: "#2a2420", fontWeight: 600 }}>{m.teams}</div>
              <div style={{ fontSize: 10, color: "#8a7f74" }}>{fmtDate(new Date(m.date + "T12:00"))} {m.time ? `· ${m.time}` : ""} {m.competition ? `· ${m.competition}` : ""}</div>
            </div>
            <button onClick={() => remove(m.id)} style={{ ...S.delBtn, fontSize: 14 }}>×</button>
          </div>
          {m.preNotes && <p style={{ fontSize: 11, color: "#8a7f74", marginTop: 4 }}>{m.preNotes}</p>}
          {m.calendarEventId
            ? <div style={{ fontSize: 10, color: "#c4855a", marginTop: 4 }}>✓ Recordatoris creats al calendari</div>
            : <button onClick={() => createReminders(m)} style={{ ...S.smBtn, marginTop: 4 }}>{creatingId === m.id ? "..." : "Crear recordatoris al calendari"}</button>}
        </div>
      ))}
      {upcoming.length === 0 && !form && <p style={S.muted}>Cap partit proper.</p>}
    </Card>
  );
}

export function MatchSec({ day, persist, global, saveGlobal }) {
  const m = day.match;
  const setM = () => persist({ ...day, match: { category: "", role: "", teams: "", rating: "", positioning: "", communication: "", keyDecisions: "", mistakes: "", strengths: "", notes: "" } });
  const um = (f, v) => persist({ ...day, match: { ...day.match, [f]: v } });
  const roles = ["Principal", "Assistent 1", "Assistent 2", "4t àrbitre", "VAR"];

  const markDone = () => {
    const matches = global.matches || [];
    const linked = matches.find(x => x.date === todayKey());
    if (linked) saveGlobal({ ...global, matches: matches.map(x => x.id === linked.id ? { ...x, status: "done" } : x) });
  };

  return (<div><Title>Partits</Title>
    <UpcomingMatches global={global} saveGlobal={saveGlobal} />
    <Lbl>Partit d'avui</Lbl>
    {!m && <div style={{ textAlign: "center", marginTop: 10, marginBottom: 10 }}><p style={S.muted}>Has arbitrat avui?</p><button onClick={setM} style={S.pBtn}>Registrar partit</button></div>}
    {m && (<>
      <Card><Inp label="Categoria" value={m.category} onChange={v => um("category", v)} ph="1a RFEF, 2a Divisió..." /><Inp label="Equips" value={m.teams} onChange={v => um("teams", v)} ph="Local vs Visitant" /><Lbl>Rol</Lbl><Chips opts={roles} val={m.role} set={v => um("role", v)} c="#f59e0b" /></Card>
      <Card><Lbl>Autoavaluació</Lbl><Rating l="Global" v={m.rating} set={v => um("rating", v)} /><Rating l="Posicionament" v={m.positioning} set={v => um("positioning", v)} /><Rating l="Comunicació" v={m.communication} set={v => um("communication", v)} /></Card>
      <Card><Lbl>Decisions clau</Lbl><textarea style={S.ta} value={m.keyDecisions||""} onChange={e => um("keyDecisions", e.target.value)} placeholder="Penals, vermelles, avantatges..." rows={3} /><Lbl>Errors</Lbl><textarea style={S.ta} value={m.mistakes||""} onChange={e => um("mistakes", e.target.value)} placeholder="Què he fallat?" rows={2} /><Lbl>Encerts</Lbl><textarea style={S.ta} value={m.strengths||""} onChange={e => um("strengths", e.target.value)} placeholder="Què he fet bé?" rows={2} /><Lbl>Notes</Lbl><textarea style={S.ta} value={m.notes||""} onChange={e => um("notes", e.target.value)} placeholder="Ambient, delegat..." rows={2} /></Card>
      <button onClick={markDone} style={S.smBtn}>Marcar com a valorat</button>
    </>)}
  </div>);
}
