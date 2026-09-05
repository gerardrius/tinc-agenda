import { useState } from "react";
import { S, COLORS } from "../lib/styles";
import { Card, Segmented } from "./ui";
import { last7Keys } from "../lib/domainStats";
import { WEEKDAYS_ABBR } from "../lib/constants";
import { todayKey } from "../lib/utils";
import { SleepMapSec } from "./SleepMapSec";

function bandColor(score) {
  if (score == null) return COLORS.textFaint;
  if (score >= 80) return COLORS.good;
  if (score >= 70) return COLORS.warn;
  return COLORS.alert;
}
function fmtClock(iso) {
  if (!iso) return "—";
  const t = iso.split("T")[1];
  return t ? t.slice(0, 5) : "—";
}
function hToHM(h) {
  if (h == null) return "—";
  const hh = Math.floor(h), mm = Math.round((h - hh) * 60);
  return `${hh}h ${mm}m`;
}

function MonthlyTrend({ garminSleep }) {
  if (!garminSleep) return null;
  const days30 = [];
  for (let i = 29; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); days30.push(d.toISOString().split("T")[0]); }
  const hours = days30.map((dk) => garminSleep[dk]?.hours).filter((h) => h != null);
  if (hours.length < 4) return null;
  const mid = Math.floor(hours.length / 2);
  const delta = (hours.slice(mid).reduce((a, b) => a + b, 0) / (hours.length - mid)) - (hours.slice(0, mid).reduce((a, b) => a + b, 0) / mid);
  const max = Math.max(...hours), min = Math.min(...hours);
  const pts = hours.map((h, i) => [
    (i / (hours.length - 1 || 1)) * 330,
    50 - ((h - min) / (max - min || 1)) * 46 - 2,
  ]);
  return (
    <Card>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        <div style={{ fontSize: 14.5, fontWeight: 600 }}>Tendència mensual</div>
        <span style={{ fontSize: 11, fontWeight: 500, color: delta >= 0 ? COLORS.positive : COLORS.alert }}>{delta >= 0 ? "+" : ""}{delta.toFixed(1)}h</span>
      </div>
      <svg width="100%" height={50} viewBox="0 0 330 50" preserveAspectRatio="none">
        <polyline points={pts.map((p) => p.join(",")).join(" ")} fill="none" stroke={COLORS.good} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </Card>
  );
}

export function SonFullScreen({ garminSleep, matchState, onClose }) {
  const [tab, setTab] = useState("son");
  const dates = last7Keys();
  const last = garminSleep?.[todayKey()];
  const weekScores = dates.map((dk) => garminSleep?.[dk]?.score ?? null);
  const weekHours = dates.map((dk) => garminSleep?.[dk]?.hours ?? null);
  const withScore = dates.map((dk, i) => ({ dk, score: weekScores[i], hours: weekHours[i] })).filter((d) => d.score != null);
  const avgScore = withScore.length ? withScore.reduce((s, d) => s + d.score, 0) / withScore.length : null;
  const best = withScore.length ? withScore.reduce((a, b) => (b.hours > a.hours ? b : a)) : null;
  const worst = withScore.length ? withScore.reduce((a, b) => (b.hours < a.hours ? b : a)) : null;

  const isMatchWeek = Boolean(matchState?.ctx === "partitA" || matchState?.ctx === "quart");
  const insight = isMatchWeek && avgScore != null && avgScore < 75
    ? { icon: "⚠️", text: "Rendiment en risc si arribes al partit així. Avança l'hora de dormir 40 min tres nits.", color: COLORS.alert }
    : !isMatchWeek && avgScore != null && avgScore > 80
    ? { icon: "✅", text: "Setmana de son excel·lent. Mantén la rutina.", color: COLORS.good }
    : null;

  return (
    <div style={S.fullScreen}>
      <div style={S.fullScreenHeader}>
        <button style={S.backArrow} onClick={onClose}>←</button>
        <div style={S.fullScreenTitle}>Son</div>
        <Segmented opts={[{ id: "son", label: "Son" }, { id: "map", label: "Mapa" }]} val={tab} set={setTab} />
      </div>
      <div style={{ padding: 16 }}>
        {tab === "son" && (
          <>
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 11.5, color: COLORS.textSec }}>Ahir a la nit</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 4 }}>
                <span style={{ fontSize: 44, fontWeight: 600, letterSpacing: "-0.05em" }}>{last?.hours != null ? hToHM(last.hours) : "—"}</span>
                <span style={{ fontSize: 15, fontWeight: 600, color: bandColor(last?.score) }}>{last?.score ?? "—"}</span>
              </div>
              <div style={{ fontSize: 12.5, color: COLORS.textSec, marginTop: 2 }}>{fmtClock(last?.start)} → {fmtClock(last?.end)}</div>
            </div>

            <Card>
              <div style={{ fontSize: 14.5, fontWeight: 600, marginBottom: 10 }}>Últims 7 dies</div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 110 }}>
                {weekScores.map((s, i) => (
                  <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                    <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: COLORS.textSec }}>{s ?? ""}</span>
                    <div style={{ width: "100%", height: Math.max(3, ((s || 0) / 100) * 76), background: bandColor(s), borderRadius: "6px 6px 3px 3px" }} />
                    <span style={{ fontSize: 10, color: COLORS.textFaint }}>{WEEKDAYS_ABBR[i]}</span>
                  </div>
                ))}
              </div>
            </Card>

            <div style={S.g2}>
              <div style={S.mini}>
                <div style={{ fontSize: 11.5, color: COLORS.textSec }}>Millor nit</div>
                <div style={{ fontSize: 18, fontWeight: 600, color: COLORS.good }}>{best ? hToHM(best.hours) : "—"}</div>
                <div style={{ fontSize: 10.5, color: COLORS.textFaint }}>{best ? WEEKDAYS_ABBR[dates.indexOf(best.dk)] : ""}</div>
              </div>
              <div style={S.mini}>
                <div style={{ fontSize: 11.5, color: COLORS.textSec }}>Pitjor nit</div>
                <div style={{ fontSize: 18, fontWeight: 600, color: COLORS.alert }}>{worst ? hToHM(worst.hours) : "—"}</div>
                <div style={{ fontSize: 10.5, color: COLORS.textFaint }}>{worst ? WEEKDAYS_ABBR[dates.indexOf(worst.dk)] : ""}</div>
              </div>
              <div style={S.mini}>
                <div style={{ fontSize: 11.5, color: COLORS.textSec }}>Puntuació mitjana</div>
                <div style={{ fontSize: 18, fontWeight: 600, color: COLORS.warn }}>{avgScore != null ? Math.round(avgScore) : "—"}</div>
              </div>
              <div style={S.mini}>
                <div style={{ fontSize: 11.5, color: COLORS.textSec }}>Objectiu</div>
                <div style={{ fontSize: 18, fontWeight: 600, color: COLORS.textSec }}>&gt;80</div>
              </div>
            </div>

            {insight && (
              <div style={{ ...S.card, borderLeft: `3px solid ${insight.color}`, display: "flex", gap: 10 }}>
                <span>{insight.icon}</span>
                <span style={{ fontSize: 13, lineHeight: 1.45 }}>{insight.text}</span>
              </div>
            )}

            <MonthlyTrend garminSleep={garminSleep} />
          </>
        )}

        {tab === "map" && <SleepMapSec />}
      </div>
    </div>
  );
}
