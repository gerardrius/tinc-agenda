import { useState } from "react";
import { S, COLORS } from "../lib/styles";
import { Card, Sheet, SheetCloseBtn, ProgressBar } from "./ui";
import { WHEEL_AXES, DOMAINS } from "../lib/constants";
import { computeDomainStats, last7Keys } from "../lib/domainStats";
import { fmtTime } from "../lib/utils";

function NudgeCard({ emoji, color, text, actionLabel, onAction }) {
  return (
    <div style={{ ...S.nudgeCard, borderLeft: `3px solid ${color}` }}>
      <span style={{ fontSize: 15 }}>{emoji}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13.5, lineHeight: 1.45, color: COLORS.text }}>{text}</div>
        {actionLabel && <button onClick={onAction} style={{ ...S.nudgeAction, color }}>{actionLabel}</button>}
      </div>
    </div>
  );
}

// Balance wheel — radar variant (README lets the product owner pick one for
// production; radar reads as a single silhouette rather than 5 gauges).
// Exported for reuse in the weekly ritual's read-only step 1.
export function BalanceWheel({ scores }) {
  const size = 250, cx = 125, cy = 118, maxR = 82;
  const n = WHEEL_AXES.length;
  const angleFor = (i) => (-90 + i * (360 / n)) * (Math.PI / 180);
  const pointFor = (i, r) => [cx + r * Math.cos(angleFor(i)), cy + r * Math.sin(angleFor(i))];

  const rings = [0.25, 0.5, 0.75, 1];
  const dataPoints = WHEEL_AXES.map((ax, i) => pointFor(i, maxR * ((scores[ax.id] ?? 5) / 10)));
  const polygon = dataPoints.map((p) => p.join(",")).join(" ");

  return (
    <svg width={size} height={246}>
      {rings.map((r, ri) => {
        const pts = WHEEL_AXES.map((_, i) => pointFor(i, maxR * r).join(",")).join(" ");
        return <polygon key={ri} points={pts} fill="none" stroke={ri === rings.length - 1 ? "#e6ded5" : "#f2ece6"} strokeWidth={1} />;
      })}
      {WHEEL_AXES.map((_, i) => {
        const [x, y] = pointFor(i, maxR);
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="#f2ece6" strokeWidth={1} />;
      })}
      <polygon points={polygon} fill="rgba(196,133,90,0.16)" stroke={COLORS.accent} strokeWidth={2} strokeLinejoin="round" />
      {dataPoints.map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r={3.4} fill="#fff" stroke={WHEEL_AXES[i].color} strokeWidth={2} />
        </g>
      ))}
      {WHEEL_AXES.map((ax, i) => {
        const [x, y] = pointFor(i, maxR + 19);
        return <text key={ax.id} x={x} y={y} textAnchor="middle" dominantBaseline="middle" fontSize={10.5} fontWeight={500} fill={COLORS.textSec}>{ax.label}</text>;
      })}
    </svg>
  );
}

export function SetmanaView({ day, global, allData, garminSleep, domainScores, onOpenSheet, onOpenFull }) {
  const [open, setOpen] = useState({});
  const scores = {
    arbitratge: domainScores?.arbitratge ?? 7,
    relacions: domainScores?.relacions ?? 6,
    salut: computeDomainStats({ id: "salut", global, allData, garminSleep, domainScores }).value,
    finances: domainScores?.finances ?? 6,
    feina: 6,
  };
  const overall = (Object.values(scores).reduce((a, b) => a + (typeof b === "number" ? b : 5), 0) / WHEEL_AXES.length).toFixed(1);

  const now = new Date();
  const monday = new Date(now); monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  const sunday = new Date(monday); sunday.setDate(monday.getDate() + 6);
  const range = `${monday.getDate()} – ${sunday.getDate()} de ${sunday.toLocaleDateString("ca-ES", { month: "long" })}`;

  const nudges = [];
  const relStats = computeDomainStats({ id: "relacions", global, allData, garminSleep, domainScores });
  if (relStats.value === 0) nudges.push({ emoji: "💛", color: COLORS.accent, text: "No has vist ningú proper en 4 dies. Tens plans aviat?", actionLabel: "Obrir agenda", onAction: () => onOpenSheet("relacions") });
  const finStats = computeDomainStats({ id: "finances", global, allData, garminSleep, domainScores });
  if (parseFloat(finStats.value.replace("€", "")) > 300) nudges.push({ emoji: "💰", color: COLORS.warn, text: `Has gastat ${finStats.value} aquesta setmana. El teu objectiu és €300.`, actionLabel: "Veure finances", onAction: () => onOpenFull("fin") });

  const toggleOpen = (id) => setOpen({ ...open, [id]: !open[id] });

  return (
    <div>
      <div style={S.title}>Setmana</div>
      <div style={{ ...S.dateLabel, marginTop: -8, marginBottom: 12 }}>{range} · equilibri {overall}/10</div>

      <Card>
        <div style={{ fontSize: 14.5, fontWeight: 600, marginBottom: 10 }}>Roda d'equilibri</div>
        <div style={{ display: "flex", justifyContent: "center" }}><BalanceWheel scores={scores} /></div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center", marginTop: 6 }}>
          {WHEEL_AXES.map((ax) => (
            <button key={ax.id} onClick={() => onOpenSheet(ax.id)} style={S.wheelChip}>{ax.label} {typeof scores[ax.id] === "number" ? scores[ax.id].toFixed(1) : scores[ax.id]}</button>
          ))}
        </div>
      </Card>

      {nudges.map((n, i) => <NudgeCard key={i} {...n} />)}

      <div style={S.sectionHeader}>Registre setmanal</div>
      {WHEEL_AXES.map((ax) => {
        const stats = computeDomainStats({ id: ax.id, global, allData, garminSleep, domainScores });
        const isOpen = open[ax.id];
        return (
          <Card key={ax.id}>
            <button onClick={() => toggleOpen(ax.id)} style={{ ...S.logRow, width: "100%", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}>
              <span style={{ fontSize: 16 }}>{stats.emoji}</span>
              <span style={{ fontSize: 14, fontWeight: 500 }}>{stats.title}</span>
              <span style={{ flex: 1, fontSize: 12.5, color: COLORS.textSec }}>{stats.qualifier}</span>
              <span style={{ ...S.topicPill, color: ax.color, background: ax.color + "1f" }}>{stats.value}</span>
              <span style={{ color: COLORS.textSec, transition: "transform .2s", transform: isOpen ? "rotate(90deg)" : "none" }}>›</span>
            </button>
            {isOpen && stats.kv.map(([k, v], i) => (
              <div key={i} style={S.logRowExpanded}>
                <span style={{ color: COLORS.textSec }}>{k}</span>
                <span style={{ fontWeight: 500 }}>{v}</span>
              </div>
            ))}
          </Card>
        );
      })}
    </div>
  );
}

// Shared domain bottom sheet — opened from the domain strip (any tab), the
// wheel chips, or the weekly log cards / nudges.
export function DomainSheet({ domain, onClose, global, allData, garminSleep, domainScores }) {
  if (!domain) return null;
  const stats = computeDomainStats({ id: domain, global, allData: allData || {}, garminSleep, domainScores });
  const maxBar = Math.max(1, ...stats.bars.map((b) => b.v));
  return (
    <Sheet onClose={onClose}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ fontSize: 19, fontWeight: 600 }}>{stats.emoji} {stats.title}</div>
        <SheetCloseBtn onClose={onClose} />
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 16 }}>
        <span style={{ fontSize: 34, fontWeight: 600, color: stats.color }}>{stats.value}</span>
        <span style={{ fontSize: 12.5, color: COLORS.textSec }}>{stats.qualifier}</span>
      </div>
      <Card>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 70 }}>
          {stats.bars.map((b, i) => (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{ width: "100%", height: Math.max(3, (b.v / maxBar) * 56), background: stats.color, opacity: 0.35 + 0.65 * (i / (stats.bars.length - 1 || 1)), borderRadius: "5px 5px 2px 2px" }} />
              <span style={{ fontSize: 9.5, color: COLORS.textFaint }}>{b.label}</span>
            </div>
          ))}
        </div>
      </Card>
      <Card>
        {stats.kv.map(([k, v], i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, padding: "5px 0", borderTop: i ? `1px solid ${COLORS.borderSoft}` : "none" }}>
            <span style={{ color: COLORS.textSec }}>{k}</span>
            <span style={{ fontWeight: 500 }}>{v}</span>
          </div>
        ))}
      </Card>
      <Card><div style={{ fontSize: 13, lineHeight: 1.5, color: "#6d6259" }}>{stats.insight}</div></Card>
    </Sheet>
  );
}
