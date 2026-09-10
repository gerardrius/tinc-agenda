import { useMemo, useState } from "react";
import { S, COLORS } from "../lib/styles";
import { Card, Segmented } from "./ui";
import { useFinances } from "../lib/financesApi";

const SAVINGS_TARGET = 60000; // Personal goal (patrimoni net), not a BigQuery field — nothing to fetch here.
const fmtEur = (n) => `€${Math.round(n).toLocaleString("ca-ES")}`;
const monthKeyOf = (d) => (d || "").slice(0, 7); // "YYYY-MM" from a date string
const isoWeekKey = (dateStr) => {
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7)); // nearest Thursday
  const week1 = new Date(d.getFullYear(), 0, 4);
  const weekNo = 1 + Math.round(((d - week1) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
  return `${d.getFullYear()}-W${String(weekNo).padStart(2, "0")}`;
};

function LineChart({ values, color, height = 96 }) {
  if (values.length < 2) return null;
  const max = Math.max(...values), min = Math.min(...values);
  const w = 330;
  const pts = values.map((v, i) => [
    (i / (values.length - 1)) * w,
    height - 4 - ((v - min) / (max - min || 1)) * (height - 20),
  ]);
  const area = `M0,${height} ` + pts.map((p) => `L${p[0]},${p[1]}`).join(" ") + ` L${w},${height} Z`;
  return (
    <svg width="100%" height={height} viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="none">
      <line x1={0} y1={height * 0.33} x2={w} y2={height * 0.33} stroke={COLORS.borderSoft} strokeWidth={1} />
      <line x1={0} y1={height * 0.66} x2={w} y2={height * 0.66} stroke={COLORS.borderSoft} strokeWidth={1} />
      <path d={area} fill={color + "1a"} stroke="none" />
      <polyline points={pts.map((p) => p.join(",")).join(" ")} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Resum({ data }) {
  const total = data.netWorth ? Number(data.netWorth.total_amount) : null;
  const trend = data.netWorthTrend.map((t) => ({ day: t.day, total: Number(t.total) }));
  const first = trend[0];
  const delta = total != null && first ? total - first.total : null;
  const deltaPct = delta != null && first.total ? (delta / first.total) * 100 : null;
  const sinceLabel = first ? new Date(first.day).toLocaleDateString("ca-ES", { day: "numeric", month: "long" }) : "";

  return (
    <>
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 11.5, color: COLORS.textSec }}>Patrimoni net</div>
        <div style={{ fontSize: 42, fontWeight: 600, letterSpacing: "-0.05em" }}>{total != null ? fmtEur(total) : "—"}</div>
        {delta != null && (
          <div style={{ fontSize: 13, fontWeight: 500, color: delta >= 0 ? COLORS.positive : COLORS.alert }}>
            {delta >= 0 ? "+" : "−"}{fmtEur(Math.abs(delta))} · {delta >= 0 ? "+" : "−"}{Math.abs(deltaPct).toFixed(1)}% des del {sinceLabel}
          </div>
        )}
      </div>
      {trend.length > 1 && (
        <Card>
          <div style={{ fontSize: 14.5, fontWeight: 600, marginBottom: 8 }}>Evolució del patrimoni</div>
          <LineChart values={trend.map((t) => t.total)} color={COLORS.accent} />
        </Card>
      )}
      {data.netWorth?.by_source?.length > 0 && (
        <Card>
          <div style={{ fontSize: 14.5, fontWeight: 600, marginBottom: 10 }}>Per compte</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
            {data.netWorth.by_source.map((a) => (
              <div key={a.source}>
                <div style={{ fontSize: 10.5, color: COLORS.textSec }}>{a.source}</div>
                <div style={{ fontSize: 16, fontWeight: 600 }}>{fmtEur(Number(a.amount))}</div>
              </div>
            ))}
          </div>
        </Card>
      )}
      {data.monthly[0] && (
        <Card>
          <div style={{ fontSize: 14.5, fontWeight: 600, marginBottom: 10 }}>Aquest mes</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, textAlign: "center" }}>
            <div><div style={{ fontSize: 11, color: COLORS.textSec }}>Ingressos</div><div style={{ fontSize: 19, fontWeight: 600 }}>{fmtEur(Number(data.monthly[0].income))}</div></div>
            <div><div style={{ fontSize: 11, color: COLORS.textSec }}>Despeses</div><div style={{ fontSize: 19, fontWeight: 600, color: COLORS.alert }}>{fmtEur(Math.abs(Number(data.monthly[0].expense)))}</div></div>
            <div><div style={{ fontSize: 11, color: COLORS.textSec }}>Net</div><div style={{ fontSize: 19, fontWeight: 600, color: Number(data.monthly[0].net) >= 0 ? COLORS.good : COLORS.alert }}>{fmtEur(Number(data.monthly[0].net))}</div></div>
          </div>
        </Card>
      )}
    </>
  );
}

function Despeses({ data }) {
  const [tipologiaFilter, setTipologiaFilter] = useState("all");
  const thisMonth = monthKeyOf(data.transactions[0]?.booking_date) || monthKeyOf(new Date().toISOString());
  const expenses = data.transactions.filter((t) => Number(t.amount) < 0);

  const weekly = useMemo(() => {
    const byWeek = {};
    expenses.forEach((t) => { const wk = isoWeekKey(t.booking_date); byWeek[wk] = (byWeek[wk] || 0) + Math.abs(Number(t.amount)); });
    return Object.entries(byWeek).sort(([a], [b]) => a.localeCompare(b)).slice(-8);
  }, [data.transactions]);

  const monthCats = data.spendByCategory.filter((c) => monthKeyOf(c.month) === thisMonth);
  const tipologiaLabel = (key) => (key ? data.tipologiaLabels.find((t) => t.tipologia_key === key)?.display_label : "Sense classificar");
  const visibleCats = tipologiaFilter === "all" ? monthCats : monthCats.filter((c) => (c.tipologia || "unclassified") === tipologiaFilter);
  const maxCatAmount = Math.max(1, ...visibleCats.map((c) => Math.abs(Number(c.total))));

  const merchants = useMemo(() => {
    const byMerchant = {};
    expenses.filter((t) => monthKeyOf(t.booking_date) === thisMonth).forEach((t) => {
      const name = t.counterparty || t.description || "Desconegut";
      byMerchant[name] = (byMerchant[name] || 0) + Math.abs(Number(t.amount));
    });
    return Object.entries(byMerchant).sort(([, a], [, b]) => b - a).slice(0, 5);
  }, [data.transactions]);

  const maxWeek = Math.max(1, ...weekly.map(([, v]) => v));
  const topCat = [...visibleCats].sort((a, b) => Math.abs(Number(b.total)) - Math.abs(Number(a.total)))[0];

  return (
    <>
      {weekly.length > 0 && (
        <Card>
          <div style={{ fontSize: 14.5, fontWeight: 600, marginBottom: 10 }}>Despesa per setmana</div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 104 }}>
            {weekly.map(([wk, v]) => (
              <div key={wk} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", height: "100%", gap: 4 }}>
                <div style={{ width: "100%", height: (v / maxWeek) * 96, background: COLORS.accent, borderRadius: "5px 5px 2px 2px" }} />
                <span style={{ fontSize: 9, color: COLORS.textFaint }}>{wk.slice(6)}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ fontSize: 14.5, fontWeight: 600 }}>Per categoria</div>
          <span style={{ fontSize: 11.5, color: COLORS.textSec }}>{new Date(thisMonth + "-02").toLocaleDateString("ca-ES", { month: "long" })}</span>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
          <button onClick={() => setTipologiaFilter("all")} style={{ ...S.chip, background: tipologiaFilter === "all" ? COLORS.accent + "22" : "#fff", color: tipologiaFilter === "all" ? COLORS.accent : COLORS.textSec, borderColor: COLORS.border }}>Totes</button>
          {data.tipologiaLabels.map((t) => (
            <button key={t.tipologia_key} onClick={() => setTipologiaFilter(t.tipologia_key)} style={{ ...S.chip, background: tipologiaFilter === t.tipologia_key ? COLORS.accent + "22" : "#fff", color: tipologiaFilter === t.tipologia_key ? COLORS.accent : COLORS.textSec, borderColor: COLORS.border }}>{t.display_label}</button>
          ))}
          <button onClick={() => setTipologiaFilter("unclassified")} style={{ ...S.chip, background: tipologiaFilter === "unclassified" ? COLORS.accent + "22" : "#fff", color: tipologiaFilter === "unclassified" ? COLORS.accent : COLORS.textSec, borderColor: COLORS.border }}>Sense classificar</button>
        </div>
        {visibleCats.length === 0 && <p style={S.muted}>Cap despesa categoritzada aquest mes amb aquest filtre.</p>}
        {visibleCats.sort((a, b) => Math.abs(Number(b.total)) - Math.abs(Number(a.total))).map((c) => (
          <div key={`${c.category}-${c.tipologia}`} style={{ marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 13, flex: 1 }}>{c.category === "Uncategorized" ? "Sense categoria" : c.category}</span>
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12.5, fontWeight: 500 }}>{fmtEur(Math.abs(Number(c.total)))}</span>
            </div>
            <div style={{ height: 4, borderRadius: 99, background: COLORS.track, opacity: 0.75 }}>
              <div style={{ height: 4, borderRadius: 99, width: `${(Math.abs(Number(c.total)) / maxCatAmount) * 100}%`, background: COLORS.accent }} />
            </div>
          </div>
        ))}
      </Card>
      {merchants.length > 0 && (
        <Card>
          <div style={{ fontSize: 14.5, fontWeight: 600, marginBottom: 10 }}>Top comerços · aquest mes</div>
          {merchants.map(([name, amount], i) => (
            <div key={name} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", borderTop: i ? `1px solid ${COLORS.borderSoft}` : "none" }}>
              <span style={{ width: 8, height: 8, borderRadius: 99, background: COLORS.accent, flexShrink: 0 }} />
              <span style={{ fontSize: 13, flex: 1 }}>{name}</span>
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12.5, fontWeight: 500 }}>{fmtEur(amount)}</span>
            </div>
          ))}
        </Card>
      )}
      {topCat && (
        <div style={{ ...S.card, borderLeft: `3px solid ${COLORS.warn}`, display: "flex", gap: 10 }}>
          <span>💡</span>
          <span style={{ fontSize: 13, lineHeight: 1.45 }}>La categoria amb més despesa aquest mes és {topCat.category === "Uncategorized" ? "sense categoritzar" : topCat.category}: {fmtEur(Math.abs(Number(topCat.total)))}.</span>
        </div>
      )}
    </>
  );
}

function Estalvi({ data }) {
  const netWorth = data.netWorth ? Number(data.netWorth.total_amount) : 0;
  const pct = Math.min(1, netWorth / SAVINGS_TARGET);

  const contribByMonth = useMemo(() => {
    const m = {};
    data.transactions
      .filter((t) => t.tipologia === "savings" || t.category === "Fons d'inversió")
      .forEach((t) => { const mk = monthKeyOf(t.booking_date); m[mk] = (m[mk] || 0) + Math.abs(Number(t.amount)); });
    return Object.entries(m).sort(([a], [b]) => a.localeCompare(b)).slice(-6);
  }, [data.transactions]);
  const maxContrib = Math.max(1, ...contribByMonth.map(([, v]) => v));

  return (
    <>
      <Card>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Estalviar {fmtEur(SAVINGS_TARGET)} aquest any</div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: 30, fontWeight: 600, color: COLORS.accent }}>{fmtEur(netWorth)}</span>
          <span style={{ fontSize: 12.5, color: COLORS.textSec }}>patrimoni net · {Math.round(pct * 100)}%</span>
        </div>
        <div style={{ height: 7, borderRadius: 99, background: COLORS.track }}>
          <div style={{ height: 7, borderRadius: 99, width: `${pct * 100}%`, background: COLORS.accent }} />
        </div>
      </Card>
      {contribByMonth.length > 0 && (
        <Card>
          <div style={{ fontSize: 14.5, fontWeight: 600, marginBottom: 10 }}>Aportació mensual</div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 70 }}>
            {contribByMonth.map(([mk, amount]) => (
              <div key={mk} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9.5, color: COLORS.textSec }}>{fmtEur(amount)}</span>
                <div style={{ width: "100%", height: (amount / maxContrib) * 44, background: COLORS.accent, borderRadius: "4px 4px 2px 2px" }} />
                <span style={{ fontSize: 10, color: COLORS.textFaint }}>{new Date(mk + "-02").toLocaleDateString("ca-ES", { month: "short" })}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
      {data.investments.length > 0 && (
        <Card>
          <div style={{ fontSize: 14.5, fontWeight: 600, marginBottom: 10 }}>Fons d'inversió</div>
          {data.investments.map((f, i) => (
            <div key={f.fund_code} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderTop: i ? `1px solid ${COLORS.borderSoft}` : "none" }}>
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: "#6d6259", flex: 1 }}>{f.name || f.fund_code}</span>
              <span style={{ fontSize: 13, fontWeight: 500 }}>{f.value_eur != null ? fmtEur(Number(f.value_eur)) : "—"}</span>
            </div>
          ))}
        </Card>
      )}
    </>
  );
}

export function FinancesFullScreen({ onClose }) {
  const [tab, setTab] = useState("resum");
  const { data, loading, error } = useFinances();

  return (
    <div style={S.fullScreen}>
      <div style={S.fullScreenHeader}>
        <button style={S.backArrow} onClick={onClose}>←</button>
        <div style={S.fullScreenTitle}>Finances</div>
        <div style={{ width: 19 }} />
      </div>
      <div style={{ padding: "0 16px 10px" }}>
        <Segmented opts={[{ id: "resum", label: "Resum" }, { id: "despeses", label: "Despeses" }, { id: "estalvi", label: "Estalvi" }]} val={tab} set={setTab} />
      </div>
      <div style={{ padding: "6px 16px 24px" }}>
        {loading && <p style={S.muted}>Carregant dades reals...</p>}
        {error && <p style={{ ...S.muted, color: COLORS.alert }}>Error carregant finances: {error}</p>}
        {data && (
          <>
            {tab === "resum" && <Resum data={data} />}
            {tab === "despeses" && <Despeses data={data} />}
            {tab === "estalvi" && <Estalvi data={data} />}
          </>
        )}
      </div>
    </div>
  );
}
