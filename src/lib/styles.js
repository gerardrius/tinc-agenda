// Design tokens — Tinc Agenda light theme.
// See design_handoff_tinc_agenda/README.md for the full spec this was built from.
export const COLORS = {
  bg: "#faf7f4",
  surface: "#ffffff",
  text: "#2a2420",
  textSec: "#8a7f74",
  textMuted: "#a2968a",
  textFaint: "#b6aa9e",
  accent: "#c4855a",
  good: "#7ec8a0",
  warn: "#f0a868",
  alert: "#d4856a",
  ref: "#3b5bdb",
  border: "#ede8e3",
  borderSoft: "#f4efe9",
  track: "#f1ece6",
  chipBg: "#f0eae3",
};

const cardShadow = "0 1px 3px rgba(42,36,32,0.08)";

export const S = {
  app: { background: COLORS.bg, minHeight: "100vh", maxWidth: 480, margin: "0 auto", fontFamily: "'Inter',system-ui,sans-serif", letterSpacing: "-0.02em", color: COLORS.text, display: "flex", flexDirection: "column", height: "100vh" },
  loadWrap: { display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: COLORS.bg },
  header: { padding: "58px 16px 10px", flexShrink: 0 },
  logo: { fontSize: 23, fontWeight: 600, color: COLORS.text, letterSpacing: "-0.03em" },
  dateLabel: { fontSize: 12.5, color: COLORS.textSec, marginTop: 1 },
  body: { padding: "0 16px 90px", overflowY: "auto", flex: 1, WebkitOverflowScrolling: "touch" },

  domainStrip: { display: "flex", borderTop: `1px solid ${COLORS.border}`, background: "#fffdfb", flexShrink: 0 },
  domainBtn: { flex: 1, background: "none", border: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "7px 6px", cursor: "pointer", fontFamily: "inherit" },
  domainTrack: { width: 26, height: 3, borderRadius: 99, background: COLORS.track },

  tabBar: { position: "relative", display: "flex", justifyContent: "space-around", borderTop: `1px solid ${COLORS.border}`, background: "rgba(255,253,251,.94)", backdropFilter: "blur(12px)", padding: "6px 0 2px", zIndex: 100, flexShrink: 0 },
  tabBtn: { background: "none", border: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: 2, padding: "3px 6px", cursor: "pointer", fontFamily: "inherit" },

  card: { background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: "13px 14px", marginBottom: 9, boxShadow: cardShadow },
  lbl: { fontSize: 10.5, color: COLORS.textMuted, marginBottom: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".09em", fontFamily: "'JetBrains Mono',monospace" },
  title: { fontSize: 19, fontWeight: 600, color: COLORS.text, marginBottom: 12, letterSpacing: "-0.03em" },
  inp: { width: "100%", background: "#fdfbf9", border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "8px 10px", fontSize: 12.5, color: COLORS.text, outline: "none", fontFamily: "inherit", boxSizing: "border-box" },
  ta: { width: "100%", background: "#fdfbf9", border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "8px 10px", fontSize: 12.5, color: COLORS.text, outline: "none", resize: "vertical", fontFamily: "inherit", boxSizing: "border-box" },
  chip: { padding: "4px 10px", borderRadius: 99, fontSize: 10.5, cursor: "pointer", fontWeight: 500, fontFamily: "inherit", border: "1px solid" },
  g2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 },
  mini: { background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: "8px 10px", textAlign: "center", boxShadow: cardShadow },
  habBtn: { display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "9px 10px", borderRadius: 8, border: "1px solid", marginBottom: 4, cursor: "pointer", background: "none", textAlign: "left", fontFamily: "inherit" },
  chk: { width: 20, height: 20, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0 },
  navC: { display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "12px 14px", background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 14, marginBottom: 6, cursor: "pointer", fontFamily: "inherit", textAlign: "left", boxShadow: cardShadow },
  back: { background: "none", border: "none", color: COLORS.accent, fontSize: 12.5, cursor: "pointer", marginBottom: 12, padding: 0, fontFamily: "inherit", fontWeight: 500 },
  pBtn: { padding: "10px 20px", borderRadius: 8, fontSize: 12.5, fontWeight: 600, background: COLORS.accent, border: "none", color: "#fff", cursor: "pointer", fontFamily: "inherit", marginBottom: 10 },
  smBtn: { padding: "4px 10px", borderRadius: 8, fontSize: 10.5, fontWeight: 500, background: "#fdfbf9", border: `1px solid ${COLORS.border}`, color: COLORS.accent, cursor: "pointer", fontFamily: "inherit" },
  delBtn: { background: "none", border: "none", color: COLORS.alert, fontSize: 16, cursor: "pointer", padding: "0 3px" },
  subT: { flex: 1, padding: "6px 0", borderRadius: 8, fontSize: 11, fontWeight: 500, cursor: "pointer", border: "1px solid", fontFamily: "inherit", textAlign: "center" },
  evRow: { display: "flex", gap: 8, alignItems: "center", padding: "5px 0", borderBottom: `1px solid ${COLORS.borderSoft}` },
  evCard: { padding: "10px 12px", background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 8, marginBottom: 5 },
  muted: { fontSize: 11.5, color: COLORS.textSec, margin: 0 },

  quickPill: { display: "inline-flex", alignItems: "center", gap: 5, minHeight: 38, padding: "9px 14px", borderRadius: 99, fontSize: 12.5, fontWeight: 500, letterSpacing: "-0.015em", border: `1px solid ${COLORS.border}`, background: "#fff", boxShadow: cardShadow, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap", transition: "all .18s" },
  quickPillDone: { background: "#f5f0ea", borderColor: "#e9e2da", color: COLORS.textFaint, boxShadow: "none" },

  heroCard: { background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: 16, marginBottom: 9, boxShadow: cardShadow },
  heroEyebrow: { fontFamily: "'JetBrains Mono',monospace", fontSize: 10.5, fontWeight: 600, letterSpacing: ".11em", textTransform: "uppercase", color: COLORS.textMuted },

  nudgeCard: { background: COLORS.surface, borderRadius: 14, padding: "13px 14px", marginBottom: 9, boxShadow: cardShadow, display: "flex", gap: 10, alignItems: "flex-start" },
  nudgeAction: { marginTop: 9, minHeight: 34, padding: "7px 12px", border: `1px solid ${COLORS.border}`, background: "#fdfbf9", fontSize: 12.5, fontWeight: 600, borderRadius: 8, cursor: "pointer", fontFamily: "inherit" },

  checkRow: { display: "flex", alignItems: "center", gap: 10, minHeight: 44, padding: "8px 0", borderTop: `1px solid ${COLORS.borderSoft}` },
  checkRowFirst: { display: "flex", alignItems: "center", gap: 10, minHeight: 44, padding: "8px 0" },

  topicPill: { display: "inline-flex", alignItems: "center", gap: 3, fontSize: 10.5, fontWeight: 500, padding: "3px 7px", borderRadius: 99 },
};
