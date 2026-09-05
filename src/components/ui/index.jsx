import { S, COLORS } from "../../lib/styles";

export function Card({ children, style }) { return <div style={{ ...S.card, ...style }}>{children}</div>; }
export function Lbl({ children, m0 }) { return <div style={{ ...S.lbl, ...(m0 ? { margin: 0 } : {}) }}>{children}</div>; }
export function SectionHeader({ children }) { return <div style={S.sectionHeader}>{children}</div>; }
export function Title({ children }) { return <div style={S.title}>{children}</div>; }
export function Mini({ label, value, color }) { return <div style={S.mini}><div style={{ fontSize: 9, color: COLORS.textSec }}>{label}</div><div style={{ fontSize: 18, fontWeight: 700, color }}>{value}</div></div>; }
export function Inp({ label, value, onChange, type = "text", ph }) { return <div style={{ marginBottom: 8 }}><Lbl>{label}</Lbl><input type={type} value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder={ph} style={S.inp} /></div>; }
export function Chips({ opts, labels, val, set, c = COLORS.accent }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 8 }}>
      {opts.map((o, i) => (
        <button key={o} onClick={() => set(o)} style={{ ...S.chip, background: val === o ? c + "22" : "#ffffff", color: val === o ? c : COLORS.textSec, borderColor: val === o ? c + "44" : COLORS.border }}>
          {labels ? labels[i] : o}
        </button>
      ))}
    </div>
  );
}

// Checkbox used throughout habit/task/prep rows (README "checkbox" spec:
// 21×21 for prep rows, but the smaller 20×20 `S.chk` token covers both).
export function Checkbox({ checked, onChange, color = COLORS.accent, size = 21 }) {
  return (
    <button
      onClick={onChange}
      style={{
        width: size, height: size, borderRadius: 6, flexShrink: 0, cursor: "pointer",
        border: `1.5px solid ${checked ? color : "#ded6cd"}`,
        background: checked ? color : "transparent",
        display: "flex", alignItems: "center", justifyContent: "center",
        animation: checked ? "pop .28s ease" : "none",
      }}
    >
      {checked && <span style={{ color: "#fff", fontSize: 12, lineHeight: 1 }}>✓</span>}
    </button>
  );
}

export function TopicPill({ topic }) {
  if (!topic) return null;
  return (
    <span style={{ ...S.topicPill, color: topic.color, background: topic.color + "1f" }}>
      {topic.emoji} {topic.label}
    </span>
  );
}

// Two-option (or more) segmented control (README: Avui/Setmana, Son/Mapa,
// Resum/Despeses/Estalvi, Radar/Pètals).
export function Segmented({ opts, val, set }) {
  return (
    <div style={S.segmented}>
      {opts.map((o) => (
        <button key={o.id} onClick={() => set(o.id)} style={{ ...S.segmentedBtn, ...(val === o.id ? S.segmentedBtnActive : {}) }}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

// Circular progress arc — hero card score/countdown/checklist rings
// (README: 86px rest-mode arc, 78px match-state arcs).
export function ProgressArc({ size = 86, strokeWidth = 7, progress, color, trackColor = COLORS.track, big, small, rotate = -90 }) {
  const r = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * r;
  const dash = c * Math.max(0, Math.min(1, progress));
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: `rotate(${rotate}deg)` }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={trackColor} strokeWidth={strokeWidth} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeDasharray={`${dash} ${c}`} style={{ transition: "stroke-dasharray .5s ease" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontSize: big ? 23 : 19, fontWeight: 600, letterSpacing: "-0.04em", color: COLORS.text }}>{big}</div>
        {small && <div style={{ fontSize: 9.5, color: COLORS.textSec }}>{small}</div>}
      </div>
    </div>
  );
}

// Linear progress bar/track (README: sleep score bar, goal progress bars).
export function ProgressBar({ progress, color, height = 5, trackColor = COLORS.track }) {
  return (
    <div style={{ height, borderRadius: 99, background: trackColor, overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${Math.max(0, Math.min(1, progress)) * 100}%`, background: color, borderRadius: 99, transition: "width .5s ease" }} />
    </div>
  );
}

// Bottom sheet with scrim, used for the domain sheet and the sleep-map pin
// sheet. `onClose` fires on scrim tap or the × button.
export function Sheet({ children, onClose, maxHeight }) {
  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 20 }}>
      <div style={S.scrim} onClick={onClose} />
      <div style={{ ...S.sheet, ...(maxHeight ? { maxHeight } : {}) }}>
        <div style={S.sheetHandle} />
        {children}
      </div>
    </div>
  );
}

export function SheetCloseBtn({ onClose }) {
  return <button style={S.sheetCloseBtn} onClick={onClose}>✕</button>;
}

// Rank bubble for the tomorrow-priorities list (README ritual step 3).
export function RankBubble({ rank }) {
  const top3 = rank <= 3;
  return (
    <div style={{ ...S.rankBubble, background: top3 ? COLORS.accent : COLORS.chipBg, color: top3 ? "#fff" : COLORS.textSec }}>
      {rank}
    </div>
  );
}

// Up/down reorder arrows, always visible alongside touch-drag (README:
// "ship touch drag as the primary interaction *and* keep the arrow buttons").
export function ArrowBtn({ dir, onClick, disabled }) {
  return (
    <button onClick={disabled ? undefined : onClick} style={{ ...S.arrowBtn, ...(disabled ? S.arrowBtnDisabled : {}) }}>
      {dir === "up" ? "↑" : "↓"}
    </button>
  );
}

// Drag handle — two columns of three dots (README: "9×15 SVG").
export function DragHandle(props) {
  return (
    <svg width={9} height={15} style={{ cursor: "grab", touchAction: "none", flexShrink: 0 }} {...props}>
      {[0, 1, 2].flatMap((row) =>
        [0, 6].map((col) => <circle key={`${row}-${col}`} cx={col + 1.5} cy={row * 6 + 1.5} r={1.5} fill="#ded6cd" />)
      )}
    </svg>
  );
}
