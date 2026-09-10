import { useRef, useState } from "react";
import { S, COLORS } from "../lib/styles";
import { Card } from "./ui";
import { last7Keys } from "../lib/domainStats";
import { todayKey } from "../lib/utils";
import { useFinances } from "../lib/financesApi";
import { useRefereeingMatches, importRefereeReport, syncRefereeReportsFromDrive } from "../lib/refereeingApi";

// Sample data for goals without a real source yet (social log) — same "ship
// to spec now, wire later" approach finances/refereeing used to follow.
const GOALS_STATIC = [
  { label: "Veure la Muntsa 2 cops/setmana", value: "2.4 de mitjana", pct: 1, color: COLORS.accent, source: "Registre social", status: "en camí" },
  { label: "Mantenir son >80 de mitjana", value: "70 de 80", pct: 0.85, color: COLORS.good, source: "Garmin · viu", status: "atenció" },
];

function ImportReportButton({ onImported }) {
  const [status, setStatus] = useState(null); // null | "loading" | { ok, message }
  const fileInputRef = useRef(null);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setStatus("loading");
    const result = await importRefereeReport(file);
    if (result.ok) {
      const p = result.parsed;
      const prefix = result.skipped ? "Ja importat abans: " : "";
      const rubricNote = result.rubricError
        ? ` Rúbrica no llegida (${result.rubricError}).`
        : result.skipped
        ? (result.rubricUpdated ? " Rúbrica actualitzada." : result.rubricUpdateError ? ` Rúbrica no actualitzada (${result.rubricUpdateError}).` : "")
        : "";
      setStatus({ ok: true, message: `${prefix}${p.home_team} - ${p.away_team} (${p.match_date}): puntuació ${p.final_score ?? "—"}.${rubricNote}` });
      onImported();
    } else {
      setStatus({ ok: false, message: result.error });
    }
  };

  return (
    <div>
      <input ref={fileInputRef} type="file" accept="application/pdf,.pdf" onChange={handleFile} style={{ display: "none" }} />
      <button onClick={() => fileInputRef.current?.click()} disabled={status === "loading"} style={{ ...S.smBtn, width: "100%", textAlign: "center", marginTop: 8 }}>
        {status === "loading" ? "Important…" : "📄 Importar informe RFEF"}
      </button>
      {status && status !== "loading" && (
        <p style={{ fontSize: 11, marginTop: 6, color: status.ok ? COLORS.good : COLORS.alert }}>{status.message}</p>
      )}
    </div>
  );
}

function SyncDriveButton({ onImported }) {
  const [status, setStatus] = useState(null); // null | "loading" | { ok, message }

  const handleSync = async () => {
    setStatus("loading");
    const result = await syncRefereeReportsFromDrive();
    if (result.ok) {
      const newOnes = result.results.filter((r) => r.status === "importat" || r.status === "actualitzat (ja existia per data+equips)");
      const errors = result.results.filter((r) => r.status === "error");
      const parts = [`${result.totalInFolder} PDFs a la carpeta`, `${newOnes.length} processats`];
      if (errors.length) parts.push(`${errors.length} amb error`);
      setStatus({ ok: !errors.length, message: parts.join(" · ") });
      if (newOnes.length) onImported();
    } else {
      setStatus({ ok: false, message: result.error });
    }
  };

  return (
    <div>
      <button onClick={handleSync} disabled={status === "loading"} style={{ ...S.smBtn, width: "100%", textAlign: "center", marginTop: 8 }}>
        {status === "loading" ? "Sincronitzant…" : "🔄 Actualitzar des de Drive"}
      </button>
      {status && status !== "loading" && (
        <p style={{ fontSize: 11, marginTop: 6, color: status.ok ? COLORS.good : COLORS.alert }}>{status.message}</p>
      )}
    </div>
  );
}

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
  const { data: fin } = useFinances();
  const { matches, refetch: refetchMatches } = useRefereeingMatches();
  const netWorth = fin?.netWorth ? Number(fin.netWorth.total_amount) : null;
  const trend = fin?.netWorthTrend?.map((t) => Number(t.total)) || [];
  const firstNetWorth = trend[0];
  const netWorthDelta = netWorth != null && firstNetWorth ? netWorth - firstNetWorth : null;
  const netWorthDeltaPct = netWorthDelta != null && firstNetWorth ? (netWorthDelta / firstNetWorth) * 100 : null;
  const savingsPct = netWorth != null ? Math.min(1, netWorth / 60000) : 0;

  const scoredMatches = matches.filter((m) => m.final_score != null);
  const avgMatchScore = scoredMatches.length ? scoredMatches.reduce((s, m) => s + Number(m.final_score), 0) / scoredMatches.length : null;
  const refereeingGoal = {
    label: "Valoració arbitral per sobre de 60",
    value: matches.length ? `${matches.length} partit${matches.length === 1 ? "" : "s"} · ${avgMatchScore != null ? avgMatchScore.toFixed(1) : "—"}` : "0 partits encara",
    pct: avgMatchScore != null ? Math.min(1, avgMatchScore / 100) : 0,
    color: COLORS.domainRef,
    source: matches.length ? "RFEF · valoracions reals" : "Sense informes importats",
    status: avgMatchScore != null && avgMatchScore >= 60 ? "en camí" : "atenció",
  };
  const GOALS = netWorth != null
    ? [refereeingGoal, { label: "Arribar a €60.000 de patrimoni aquest any", value: `€${Math.round(netWorth).toLocaleString("ca-ES")}`, pct: savingsPct, color: COLORS.warn, source: "BigQuery · viu", status: savingsPct >= 0.66 ? "en camí" : "atenció" }, ...GOALS_STATIC]
    : [refereeingGoal, ...GOALS_STATIC];

  const dates = last7Keys();
  const scores = dates.map((dk) => garminSleep?.[dk]?.score).filter((s) => s != null);
  const hours = dates.map((dk) => garminSleep?.[dk]?.hours).filter((h) => h != null);
  const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : "—";
  const avgHours = hours.length ? (hours.reduce((a, b) => a + b, 0) / hours.length).toFixed(1) : "—";
  const yesterday = garminSleep?.[todayKey()]?.score ?? "—";

  const matchHistory = [...scoredMatches].sort((a, b) => (a.match_date < b.match_date ? -1 : 1));
  const histValues = matchHistory.map((m) => Number(m.final_score));
  const histMonths = matchHistory.map((m) => new Date(m.match_date + "T12:00:00").toLocaleDateString("ca-ES", { month: "short" }));
  const maxHist = histValues.length ? Math.max(...histValues) : 1, minHist = histValues.length ? Math.min(...histValues) : 0;
  const histPts = histValues.map((v, i) => [(i / (Math.max(histValues.length, 2) - 1)) * 330, 90 - ((v - minHist) / (maxHist - minHist || 1)) * 76 - 4]);

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
          <span style={{ fontSize: 29, fontWeight: 600 }}>{netWorth != null ? `€${Math.round(netWorth).toLocaleString("ca-ES")}` : "—"}</span>
          {netWorthDelta != null && (
            <span style={{ fontSize: 12, fontWeight: 500, color: netWorthDelta >= 0 ? COLORS.positive : COLORS.alert }}>
              {netWorthDelta >= 0 ? "+" : "−"}€{Math.round(Math.abs(netWorthDelta)).toLocaleString("ca-ES")} · {netWorthDelta >= 0 ? "+" : "−"}{Math.abs(netWorthDeltaPct).toFixed(1)}%
            </span>
          )}
        </div>
        <div style={{ height: 6, borderRadius: 99, background: COLORS.track }}><div style={{ height: 6, borderRadius: 99, width: `${savingsPct * 100}%`, background: COLORS.accent }} /></div>
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
        {histValues.length > 1 ? (
          <>
            <svg width="100%" height={112} viewBox="0 0 330 112" preserveAspectRatio="none">
              {[0.25, 0.5, 0.75].map((f) => <line key={f} x1={0} y1={90 * f} x2={330} y2={90 * f} stroke={COLORS.track} strokeWidth={1} />)}
              <polyline points={histPts.map((p) => `${p[0]},${p[1]}`).join(" ")} fill="none" stroke={COLORS.domainRef} strokeWidth={1.8} />
              {histPts.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={3} fill="#fff" stroke={COLORS.domainRef} strokeWidth={1.8} />)}
            </svg>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
              {histMonths.map((m, i) => <span key={i} style={{ fontSize: 11, color: COLORS.textMuted }}>{m}</span>)}
            </div>
          </>
        ) : (
          <p style={S.muted}>{histValues.length === 1 ? "Un sol informe importat — encara no hi ha prou per veure una tendència." : "Cap informe importat encara."}</p>
        )}
        <SyncDriveButton onImported={refetchMatches} />
        <ImportReportButton onImported={refetchMatches} />
      </Card>
    </div>
  );
}
