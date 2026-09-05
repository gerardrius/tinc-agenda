import { useState } from "react";
import { S, COLORS } from "../lib/styles";
import { Card, Segmented } from "./ui";

// Sample data throughout — no BigQuery source exists yet (per plan decision:
// ship the screen to spec now, wire the real source later). Shapes mirror
// what a real feed would provide so swapping later is a data-layer change.
const NET_WORTH = { total: 50140, deltaAbs: 12091, deltaPct: 31.8, sinceLabel: "l'1 de gener" };
const MONTHS12 = [38, 40, 39, 42, 44, 43, 46, 45, 47, 48, 49, 50.1];
const ACCOUNTS = [
  { name: "CaixaBank Inversions", value: "€31.420", delta: "+4,1%" },
  { name: "Imagin", value: "€9.860", delta: "+0,3%" },
  { name: "Revolut", value: "€8.860", delta: "+2,7%" },
];
const THIS_MONTH = { ingressos: 2480, despeses: 1660, estalvi: 820 };
const WEEKLY_SPEND = [280, 310, 260, 340, 290, 250, 320, 340];
const WEEKLY_BUDGET = 300;
const CATEGORIES = [
  { label: "Restaurants", amount: 180, limit: 150, color: COLORS.alert },
  { label: "Supermercats", amount: 245, limit: 300, color: COLORS.accent },
  { label: "Transport", amount: 132, limit: 150, color: COLORS.accent },
  { label: "Subscripcions", amount: 48, limit: 60, color: COLORS.accent },
  { label: "Oci", amount: 96, limit: 120, color: COLORS.accent },
  { label: "Altres", amount: 74, limit: 100, color: COLORS.accent },
];
const MERCHANTS = [
  { name: "Mercadona", amount: "€184" }, { name: "Bar Nou", amount: "€72" },
  { name: "Renfe", amount: "€58" }, { name: "Glovo", amount: "€49" }, { name: "Spotify + iCloud", amount: "€21" },
];
const SAVINGS_GOAL = { target: 15000, current: 8240 };
const MONTHLY_CONTRIB = [
  { amount: 640, month: "abr" }, { amount: 720, month: "mai" }, { amount: 580, month: "jun" },
  { amount: 910, month: "jul" }, { amount: 780, month: "ago" }, { amount: 820, month: "set" },
];
const FUNDS = [
  { code: "FBSGLEST", value: "€12.480", change: "+6,2%", up: true },
  { code: "FBSUSEST", value: "€8.910", change: "+9,4%", up: true },
  { code: "SELTENST", value: "€5.240", change: "−1,8%", up: false },
  { code: "DES2060E", value: "€3.120", change: "+3,1%", up: true },
  { code: "MONREND", value: "€1.670", change: "+0,4%", up: true },
];

function LineChart({ values, color, height = 96 }) {
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

function Resum() {
  return (
    <>
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 11.5, color: COLORS.textSec }}>Patrimoni net</div>
        <div style={{ fontSize: 42, fontWeight: 600, letterSpacing: "-0.05em" }}>€{NET_WORTH.total.toLocaleString("ca-ES")}</div>
        <div style={{ fontSize: 13, fontWeight: 500, color: COLORS.positive }}>+€{NET_WORTH.deltaAbs.toLocaleString("ca-ES")} · +{NET_WORTH.deltaPct}% des de {NET_WORTH.sinceLabel}</div>
      </div>
      <Card>
        <div style={{ fontSize: 14.5, fontWeight: 600, marginBottom: 8 }}>Últims 12 mesos</div>
        <LineChart values={MONTHS12} color={COLORS.accent} />
      </Card>
      <Card>
        <div style={{ fontSize: 14.5, fontWeight: 600, marginBottom: 10 }}>Per compte</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
          {ACCOUNTS.map((a) => (
            <div key={a.name}>
              <div style={{ fontSize: 10.5, color: COLORS.textSec }}>{a.name}</div>
              <div style={{ fontSize: 16, fontWeight: 600 }}>{a.value}</div>
              <div style={{ fontSize: 10.5, fontWeight: 500, color: COLORS.positive }}>{a.delta}</div>
            </div>
          ))}
        </div>
      </Card>
      <Card>
        <div style={{ fontSize: 14.5, fontWeight: 600, marginBottom: 10 }}>Aquest mes</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, textAlign: "center" }}>
          <div><div style={{ fontSize: 11, color: COLORS.textSec }}>Ingressos</div><div style={{ fontSize: 19, fontWeight: 600 }}>€{THIS_MONTH.ingressos}</div></div>
          <div><div style={{ fontSize: 11, color: COLORS.textSec }}>Despeses</div><div style={{ fontSize: 19, fontWeight: 600, color: COLORS.alert }}>€{THIS_MONTH.despeses}</div></div>
          <div><div style={{ fontSize: 11, color: COLORS.textSec }}>Estalvi</div><div style={{ fontSize: 19, fontWeight: 600, color: COLORS.good }}>€{THIS_MONTH.estalvi}</div></div>
        </div>
      </Card>
    </>
  );
}

function Despeses() {
  const maxBar = Math.max(...WEEKLY_SPEND, WEEKLY_BUDGET);
  return (
    <>
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
          <div style={{ fontSize: 14.5, fontWeight: 600 }}>Despesa setmanal</div>
          <span style={{ fontSize: 11.5, color: COLORS.textSec }}>objectiu €{WEEKLY_BUDGET}</span>
        </div>
        <div style={{ position: "relative", height: 104 }}>
          <div style={{ position: "absolute", left: 0, right: 0, top: 104 - (WEEKLY_BUDGET / maxBar) * 96, borderTop: `1px dashed ${COLORS.alert}` }} />
          <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: "100%" }}>
            {WEEKLY_SPEND.map((v, i) => (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", height: "100%", gap: 4 }}>
                <div style={{ width: "100%", height: (v / maxBar) * 96, background: v > WEEKLY_BUDGET ? COLORS.alert : COLORS.accent, borderRadius: "5px 5px 2px 2px" }} />
                <span style={{ fontSize: 9.5, color: COLORS.textFaint }}>s{i + 1}</span>
              </div>
            ))}
          </div>
        </div>
      </Card>
      <Card>
        <div style={{ fontSize: 14.5, fontWeight: 600, marginBottom: 10 }}>Per categoria · setembre</div>
        {CATEGORIES.map((c) => {
          const over = c.amount > c.limit;
          return (
            <div key={c.label} style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span style={{ width: 9, height: 9, borderRadius: 99, background: c.color, flexShrink: 0 }} />
                <span style={{ fontSize: 13, flex: 1 }}>{c.label}</span>
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12.5, fontWeight: 500, color: over ? COLORS.alert : COLORS.text }}>€{c.amount}</span>
              </div>
              <div style={{ height: 4, borderRadius: 99, background: COLORS.track, opacity: 0.75 }}>
                <div style={{ height: 4, borderRadius: 99, width: `${Math.min(100, (c.amount / c.limit) * 100)}%`, background: over ? COLORS.alert : c.color }} />
              </div>
            </div>
          );
        })}
      </Card>
      <Card>
        <div style={{ fontSize: 14.5, fontWeight: 600, marginBottom: 10 }}>Top comerços</div>
        {MERCHANTS.map((m, i) => (
          <div key={m.name} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", borderTop: i ? `1px solid ${COLORS.borderSoft}` : "none" }}>
            <span style={{ width: 8, height: 8, borderRadius: 99, background: COLORS.accent, flexShrink: 0 }} />
            <span style={{ fontSize: 13, flex: 1 }}>{m.name}</span>
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12.5, fontWeight: 500 }}>{m.amount}</span>
          </div>
        ))}
      </Card>
      <div style={{ ...S.card, borderLeft: `3px solid ${COLORS.warn}`, display: "flex", gap: 10 }}>
        <span>🍽️</span>
        <span style={{ fontSize: 13, lineHeight: 1.45 }}>Has gastat €180 en restaurants aquest mes. El límit és €150. Considera reduir 2 sopars fora.</span>
      </div>
    </>
  );
}

function Estalvi() {
  const pct = SAVINGS_GOAL.current / SAVINGS_GOAL.target;
  const maxContrib = Math.max(...MONTHLY_CONTRIB.map((c) => c.amount));
  return (
    <>
      <Card>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Estalviar €{SAVINGS_GOAL.target.toLocaleString("ca-ES")} aquest any</div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: 30, fontWeight: 600, color: COLORS.accent }}>€{SAVINGS_GOAL.current.toLocaleString("ca-ES")}</span>
          <span style={{ fontSize: 12.5, color: COLORS.textSec }}>aconseguits · {Math.round(pct * 100)}%</span>
        </div>
        <div style={{ height: 7, borderRadius: 99, background: COLORS.track }}>
          <div style={{ height: 7, borderRadius: 99, width: `${pct * 100}%`, background: COLORS.accent }} />
        </div>
      </Card>
      <Card>
        <div style={{ fontSize: 14.5, fontWeight: 600, marginBottom: 10 }}>Aportació mensual</div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 70 }}>
          {MONTHLY_CONTRIB.map((c) => (
            <div key={c.month} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9.5, color: COLORS.textSec }}>€{c.amount}</span>
              <div style={{ width: "100%", height: (c.amount / maxContrib) * 44, background: COLORS.accent, borderRadius: "4px 4px 2px 2px" }} />
              <span style={{ fontSize: 10, color: COLORS.textFaint }}>{c.month}</span>
            </div>
          ))}
        </div>
      </Card>
      <Card>
        <div style={{ fontSize: 14.5, fontWeight: 600, marginBottom: 10 }}>Fons d'inversió</div>
        {FUNDS.map((f, i) => (
          <div key={f.code} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderTop: i ? `1px solid ${COLORS.borderSoft}` : "none" }}>
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: "#6d6259", flex: 1 }}>{f.code}</span>
            <span style={{ fontSize: 13, fontWeight: 500 }}>{f.value}</span>
            <span style={{ fontSize: 12, fontWeight: 500, width: 52, textAlign: "right", color: f.up ? COLORS.positive : COLORS.alert }}>{f.change}</span>
          </div>
        ))}
      </Card>
      <div style={{ ...S.card, borderLeft: `3px solid ${COLORS.accent}`, display: "flex", gap: 10 }}>
        <span>📈</span>
        <span style={{ fontSize: 13, lineHeight: 1.45 }}>Al ritme actual, arribaràs a €13.800 al desembre. Necessites +€100/mes per assolir l'objectiu.</span>
      </div>
    </>
  );
}

export function FinancesFullScreen({ onClose }) {
  const [tab, setTab] = useState("resum");
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
        {tab === "resum" && <Resum />}
        {tab === "despeses" && <Despeses />}
        {tab === "estalvi" && <Estalvi />}
      </div>
    </div>
  );
}
