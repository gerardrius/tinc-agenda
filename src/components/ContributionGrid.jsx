import { HABITS } from "../lib/constants";
import { habitColor } from "../lib/utils";

export function ContributionGrid({ allData }) {
  const weeks = 12;
  const today = new Date();
  const dow = (today.getDay() + 6) % 7;
  const start = new Date(today); start.setDate(start.getDate() - (weeks * 7 - 1) - dow);
  const cells = [];
  for (let i = 0; i < weeks * 7 + dow + 1; i++) {
    const d = new Date(start); d.setDate(d.getDate() + i);
    const dk = d.toISOString().split("T")[0];
    if (d > today) { cells.push({ dk, score: -1 }); continue; }
    const hd = allData[dk]?.habits;
    cells.push({ dk, score: hd ? HABITS.filter(h => hd[h.id]).length : -1 });
  }
  const cols = [];
  for (let w = 0; w < Math.ceil(cells.length / 7); w++) cols.push(cells.slice(w * 7, w * 7 + 7));
  const days = ["Dl", "", "Dc", "", "Dv", "", ""];

  return (
    <div style={{ overflowX: "auto" }}>
      <div style={{ display: "flex", gap: 2, minWidth: cols.length * 14 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 2, marginRight: 2 }}>
          {days.map((d, i) => <div key={i} style={{ width: 14, height: 12, fontSize: 7, color: "#555", display: "flex", alignItems: "center" }}>{d}</div>)}
        </div>
        {cols.map((week, wi) => (
          <div key={wi} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {week.map((c, di) => (
              <div key={di} style={{ width: 12, height: 12, borderRadius: 2, background: habitColor(c.score) }} title={c.dk} />
            ))}
          </div>
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 3, marginTop: 6 }}>
        <span style={{ fontSize: 8, color: "#555" }}>Menys</span>
        {["#1a1d21", "#14532d", "#166534", "#22c55e", "#4ade80"].map((c, i) => <div key={i} style={{ width: 10, height: 10, borderRadius: 2, background: c }} />)}
        <span style={{ fontSize: 8, color: "#555" }}>Més</span>
      </div>
    </div>
  );
}
