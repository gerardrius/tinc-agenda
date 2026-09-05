import { S, COLORS } from "../lib/styles";
import { Card } from "./ui";
import { last7Keys } from "../lib/domainStats";
import { todayKey } from "../lib/utils";

// Sample data for goals/history without a real source yet (career ratings,
// finances) — same "ship to spec now, wire later" approach as Finances.
const GOALS = [
  { label: "Ascendir a 2ª División", value: "11 partits · 8.1", pct: 0.62, color: COLORS.domainRef, source: "RFEF · valoracions", status: "en camí" },
  { label: "Estalviar €15.000 aquest any", value: "€8.240", pct: 0.55, color: COLORS.warn, source: "BigQuery · viu", status: "en camí" },
  { label: "Veure la Muntsa 3 cops/setmana", value: "2.4 de mitjana", pct: 0.78, color: COLORS.accent, source: "Registre social", status: "atenció" },
  { label: "Mantenir son >80 de mitjana", value: "70 de 80", pct: 0.85, color: COLORS.good, source: "Garmin · viu", status: "atenció" },
];
const MATCH_HISTORY = [7.6, 7.9, 8.2, 7.8, 8.4, 8.0, 8.3, 8.1];
const MATCH_MONTHS = ["mar.", "abr.", "mai.", "jun.", "jul.", "ago.", "set."];

function TrendCard({ label, value, delta, up, points, color }) {
  const max = Math.max(...points), min = Math.min(...points);
  const pts = points.map((v, i) => [(i / (points.length - 1)) * 150, 30 - ((v - min) / (max - min || 1)) * 26 - 2]);
  return (
    <div style={S.mini}>
      <div style={{ fontSize: 11.5, color: COLORS.textSec, textAlign: "left" }}>{label}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 2 }}>
        <span style={{ fontSize: 20, fontWeight: 600 }}>{value}</span>
        <span style={{ fontSize: 11, fontWeight: 500, color: up ? COLORS.positive : COLORS.alert }}>{delta}</span>
      </div>
      <svg width="100%" height={34} viewBox="0 0 150 34" preserveAspectRatio="none" style={{ marginTop: 4 }}>
        <polyline points={pts.map((p) => p.join(",")).join(" ")} fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

export function JoView({ global, allData, garminSleep, onOpenFull }) {
  const dates = last7Keys();
  const scores = dates.map((dk) => garminSleep?.[dk]?.score).filter((s) => s != null);
  const hours = dates.map((dk) => garminSleep?.[dk]?.hours).filter((h) => h != null);
  const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : "—";
  const avgHours = hours.length ? (hours.reduce((a, b) => a + b, 0) / hours.length).toFixed(1) : "—";
  const yesterday = garminSleep?.[todayKey()]?.score ?? "—";

  const maxHist = Math.max(...MATCH_HISTORY), minHist = Math.min(...MATCH_HISTORY);
  const histPts = MATCH_HISTORY.map((v, i) => [(i / (MATCH_HISTORY.length - 1)) * 330, 90 - ((v - minHist) / (maxHist - minHist || 1)) * 76 - 4]);

  return (
    <div>
      <div style={S.title}>Jo</div>
      <div style={{ ...S.dateLabel, marginTop: -8, marginBottom: 12 }}>En qui m'estic convertint · temporada 25/26</div>

      <button onClick={() => onOpenFull("son")} style={{ ...S.card, width: "100%", textAlign: "left", cursor: "pointer", fontFamily: "inherit" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
          <div style={{ fontSize: 14.5, fontWeight: 600 }}>Son 💤</div>
          <span style={{ color: COLORS.textSec }}>›</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, textAlign: "center", marginBottom: 10 }}>
          <div><div style={{ fontSize: 10.5, color: COLORS.textSec }}>Puntuació mitjana</div><div style={{ fontSize: 24, fontWeight: 600, color: COLORS.warn }}>{avgScore}</div></div>
          <div><div style={{ fontSize: 10.5, color: COLORS.textSec }}>Hores mitjanes</div><div style={{ fontSize: 24, fontWeight: 600 }}>{avgHours}h</div></div>
          <div><div style={{ fontSize: 10.5, color: COLORS.textSec }}>Ahir</div><div style={{ fontSize: 24, fontWeight: 600 }}>{yesterday}</div></div>
        </div>
      </button>

      <button onClick={() => onOpenFull("fin")} style={{ ...S.card, width: "100%", textAlign: "left", cursor: "pointer", fontFamily: "inherit" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
          <div style={{ fontSize: 14.5, fontWeight: 600 }}>Finances 💰</div>
          <span style={{ color: COLORS.textSec }}>›</span>
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: 29, fontWeight: 600 }}>€50.140</span>
          <span style={{ fontSize: 12, fontWeight: 500, color: COLORS.positive }}>+€12.091 · +31,8%</span>
        </div>
        <div style={{ height: 6, borderRadius: 99, background: COLORS.track, marginBottom: 8 }}><div style={{ height: 6, borderRadius: 99, width: "55%", background: COLORS.accent }} /></div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, color: COLORS.textSec }}>
          <span>Estalvi anual €8.240 / €15.000</span>
          <span style={{ color: COLORS.alert }}>€340 / €300 aquesta setmana</span>
        </div>
      </button>

      <div style={S.sectionHeader}>Objectius de l'any</div>
      {GOALS.map((g) => (
        <Card key={g.label}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 14, fontWeight: 500 }}>{g.label}</span>
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: COLORS.textSec }}>{g.value}</span>
          </div>
          <div style={{ height: 6, borderRadius: 99, background: COLORS.track, marginBottom: 6 }}><div style={{ height: 6, borderRadius: 99, width: `${g.pct * 100}%`, background: g.color }} /></div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5 }}>
            <span style={{ color: COLORS.textSec }}>{g.source}</span>
            <span style={{ fontWeight: 500, color: g.status === "en camí" ? COLORS.positive : COLORS.warn }}>{g.status}</span>
          </div>
        </Card>
      ))}

      <div style={S.sectionHeader}>Tendències · 30 dies</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
        <TrendCard label="Son mitjà" value="6.1h" delta="+0.3" up points={[5.6, 5.8, 5.7, 6.0, 5.9, 6.1, 6.2, 6.1]} color={COLORS.good} />
        <TrendCard label="Valoració" value="8.1" delta="+0.4" up points={[7.5, 7.6, 7.8, 7.9, 8.0, 8.0, 8.1]} color={COLORS.domainRef} />
        <TrendCard label="Estalvi" value="€8.2k" delta="+€820" up points={[6.8, 7.1, 7.4, 7.6, 7.9, 8.0, 8.2]} color={COLORS.warn} />
        <TrendCard label="Temps Muntsa" value="2.4/set" delta="-0.6" up={false} points={[3.2, 3.0, 2.9, 2.7, 2.6, 2.5, 2.4]} color={COLORS.accent} />
      </div>

      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <div style={{ fontSize: 14.5, fontWeight: 600 }}>Historial de partits</div>
          <span style={{ fontSize: 11, color: COLORS.textSec }}>valoració RFEF</span>
        </div>
        <svg width="100%" height={112} viewBox="0 0 330 112" preserveAspectRatio="none">
          {[0.25, 0.5, 0.75].map((f) => <line key={f} x1={0} y1={90 * f} x2={330} y2={90 * f} stroke={COLORS.track} strokeWidth={1} />)}
          <polyline points={histPts.map((p) => `${p[0]},${p[1]}`).join(" ")} fill="none" stroke="#e3d5c6" strokeWidth={1.5} strokeDasharray="3 4" />
          <polyline points={histPts.map((p) => `${p[0]},${p[1]}`).join(" ")} fill="none" stroke={COLORS.domainRef} strokeWidth={1.8} />
          {histPts.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={3} fill="#fff" stroke={COLORS.domainRef} strokeWidth={1.8} />)}
        </svg>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
          {MATCH_MONTHS.map((m) => <span key={m} style={{ fontSize: 11, color: COLORS.textMuted }}>{m}</span>)}
        </div>
      </Card>
    </div>
  );
}
