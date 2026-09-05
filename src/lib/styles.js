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
  deskBg: "#eee8e1",

  // Domain colors (README "Domain colors")
  domainRef: "#3b5bdb",
  domainRelacions: "#c4855a",
  domainSon: "#7ec8a0",
  domainFinances: "#f0a868",
  domainFeina: "#8a7f74",
  domainSalut: "#7ec8a0",

  // Calendar colors (README "Calendar colors")
  calPersonal: "#c4855a",
  calDesigual: "#3b5bdb",
  calDatoInmo: "#7ec8a0",

  // Match/ritual footer strip + misc named colors that appear repeatedly in the spec
  matchStripBg: "#f6f8fe",
  matchStripBorder: "#e8ecf9",
  matchStripText: "#5a6a9a",
  matchMuted: "#c6d0f0",
  successStripBg: "#f2fbf7",
  successStripBorder: "#e0f2ea",
  successStripText: "#4f8f74",
  positive: "#5aa583",
  ritualNit: "#c4855a",
  ritualSet: "#3b5bdb",
};

// Alpha-suffixed hex helper — README uses literal 2-digit hex alpha suffixes
// (e.g. `${color}18`) throughout for fills; this keeps call sites readable.
export function alpha(hex, twoDigitHex) {
  return `${hex}${twoDigitHex}`;
}

const cardShadow = "0 1px 3px rgba(42,36,32,0.08)";
const liftedShadow = "0 4px 16px rgba(42,36,32,0.12)";
const sheetShadow = "0 -6px 30px rgba(42,36,32,0.18)";

export const SHADOWS = { card: cardShadow, lifted: liftedShadow, sheet: sheetShadow };

// Component-level animation shorthands, ready to spread into a style object's
// `animation` key. The actual @keyframes definitions live in src/index.css
// (global CSS constructs, not JS-injectable per inline-style constraints).
export const ANIM = {
  pop: "pop .28s ease",
  rise: "rise .25s ease",
  settle: "settle .5s ease",
  sheetup: "sheetup .32s cubic-bezier(.2,.8,.2,1)",
  slidein: "slidein .26s cubic-bezier(.2,.8,.2,1)",
  fadein: "fadein .22s ease",
  pulsering: "pulsering 1.6s ease-out infinite",
};

// z-index stack for overlays (README "Overlays stack above the shell").
export const Z = { sheet: 20, full: 25, ritual: 35, thursday: 40 };

export const S = {
  app: { background: COLORS.bg, minHeight: "100vh", maxWidth: 480, margin: "0 auto", fontFamily: "'Inter',system-ui,sans-serif", letterSpacing: "-0.02em", color: COLORS.text, display: "flex", flexDirection: "column", height: "100vh", position: "relative" },
  loadWrap: { display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: COLORS.bg },
  header: { padding: "58px 16px 10px", flexShrink: 0 },
  logo: { fontSize: 23, fontWeight: 600, color: COLORS.text, letterSpacing: "-0.03em" },
  dateLabel: { fontSize: 12.5, color: COLORS.textSec, marginTop: 1 },
  body: { padding: "0 16px 90px", overflowY: "auto", flex: 1, WebkitOverflowScrolling: "touch" },

  domainStrip: { display: "flex", borderTop: `1px solid ${COLORS.border}`, background: "#fffdfb", flexShrink: 0 },
  domainBtn: { flex: 1, background: "none", border: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "7px 6px", cursor: "pointer", fontFamily: "inherit" },
  domainTrack: { width: 26, height: 3, borderRadius: 99, background: COLORS.track },

  tabBar: { position: "relative", display: "flex", justifyContent: "space-around", borderTop: `1px solid ${COLORS.border}`, background: "rgba(255,253,251,.94)", backdropFilter: "blur(12px)", padding: "6px 0 2px", zIndex: 1, flexShrink: 0 },
  tabBtn: { background: "none", border: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: 2, padding: "3px 6px", cursor: "pointer", fontFamily: "inherit" },

  card: { background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: "13px 14px", marginBottom: 9, boxShadow: cardShadow },
  lbl: { fontSize: 10.5, color: COLORS.textMuted, marginBottom: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".09em", fontFamily: "'JetBrains Mono',monospace" },
  sectionHeader: { fontFamily: "'Inter',system-ui,sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: ".09em", textTransform: "uppercase", color: COLORS.textMuted, marginBottom: 8 },
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

  // ---- New tokens for the 4-tab redesign (README §"App Shell" onward) ----

  // Bottom sheet + scrim (domain sheet, pin sheet)
  scrim: { position: "fixed", inset: 0, background: "rgba(42,36,32,.32)", animation: ANIM.fadein },
  sheet: { position: "absolute", left: 0, right: 0, bottom: 0, maxHeight: "78%", overflowY: "auto", background: COLORS.bg, borderRadius: "20px 20px 0 0", boxShadow: sheetShadow, animation: ANIM.sheetup, padding: "10px 16px 24px" },
  sheetHandle: { width: 36, height: 4, borderRadius: 99, background: "#ded6cd", margin: "6px auto 14px" },
  sheetCloseBtn: { width: 28, height: 28, borderRadius: 99, background: COLORS.chipBg, border: "none", color: COLORS.textSec, fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 },

  // Full-screen push views (Son, Finances)
  fullScreen: { position: "absolute", inset: 0, background: COLORS.bg, overflowY: "auto", animation: ANIM.slidein, zIndex: Z.full },
  fullScreenHeader: { padding: "62px 16px 10px", borderBottom: `1px solid ${COLORS.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", background: COLORS.bg, position: "sticky", top: 0 },
  fullScreenTitle: { fontSize: 18, fontWeight: 600, letterSpacing: "-0.03em" },
  backArrow: { background: "none", border: "none", fontSize: 19, color: COLORS.text, cursor: "pointer", padding: 0, lineHeight: 1 },

  // Segmented control (Agenda Avui/Setmana, Son/Mapa, Resum/Despeses/Estalvi, Radar/Petals)
  segmented: { display: "inline-flex", background: COLORS.chipBg, borderRadius: 99, padding: 2, gap: 2 },
  segmentedBtn: { border: "none", background: "none", padding: "6px 12px", borderRadius: 99, fontSize: 12, fontWeight: 500, color: COLORS.textSec, cursor: "pointer", fontFamily: "inherit", transition: "all .2s" },
  segmentedBtnActive: { background: "#fff", color: COLORS.text, boxShadow: "0 1px 2px rgba(42,36,32,.1)" },

  // Ritual shell
  ritualShell: { position: "absolute", inset: 0, background: COLORS.bg, animation: ANIM.fadein, zIndex: Z.ritual, display: "flex", flexDirection: "column" },
  ritualHeader: { padding: "62px 16px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 },
  ritualDot: { width: 6, height: 6, borderRadius: 99, background: "#ece5dd", transition: "all .25s" },
  ritualDotDone: { background: "#dcd0c3" },
  ritualDotActive: { width: 18, background: COLORS.accent },
  ritualBody: { flex: 1, overflowY: "auto", padding: 18 },
  ritualEyebrow: { fontFamily: "'JetBrains Mono',monospace", fontSize: 10.5, fontWeight: 600, letterSpacing: ".11em", textTransform: "uppercase", color: COLORS.textMuted },
  ritualStepTitle: { fontSize: 24, fontWeight: 600, letterSpacing: "-0.035em", marginTop: 6 },
  ritualStepSubtitle: { fontSize: 13, color: COLORS.textSec, marginTop: 4, marginBottom: 16 },
  ritualFooter: { borderTop: `1px solid ${COLORS.border}`, background: "#fffdfb", padding: 16, flexShrink: 0 },
  ritualBtn: { width: "100%", height: 50, borderRadius: 12, border: "none", color: "#fff", fontSize: 14.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" },

  // Ritual banner
  ritualBanner: { background: COLORS.surface, borderRadius: 14, padding: "13px 14px", marginBottom: 9, boxShadow: cardShadow, display: "flex", gap: 10, alignItems: "center", animation: ANIM.rise },
  ritualBannerAction: { minHeight: 38, padding: "8px 14px", border: "none", color: "#fff", fontSize: 12.5, fontWeight: 600, borderRadius: 8, cursor: "pointer", fontFamily: "inherit" },
  ritualBannerDismiss: { background: "none", border: "none", color: "#c3b8ac", fontSize: 16, cursor: "pointer", padding: "0 2px" },

  // Balance wheel chips + weekly log cards
  wheelChip: { border: `1px solid ${COLORS.border}`, background: "#fdfbf9", fontSize: 11.5, fontWeight: 500, color: COLORS.textSec, borderRadius: 99, padding: "6px 12px", cursor: "pointer", fontFamily: "inherit" },
  logRow: { display: "flex", alignItems: "center", gap: 10, minHeight: 44, cursor: "pointer", padding: "8px 0" },
  logRowExpanded: { display: "flex", justifyContent: "space-between", fontSize: 12.5, padding: "6px 0", borderTop: `1px solid ${COLORS.borderSoft}` },

  // Match strip (footer of hero card)
  matchStrip: { padding: "10px 16px", background: COLORS.matchStripBg, borderTop: `1px solid ${COLORS.matchStripBorder}`, fontSize: 12, color: COLORS.matchStripText, margin: "0 -16px -16px", borderRadius: "0 0 14px 14px" },
  matchStripDone: { background: COLORS.successStripBg, borderTop: `1px solid ${COLORS.successStripBorder}`, color: COLORS.successStripText },

  // Task row (drag/reorder — ritual step 3)
  taskRow: { display: "flex", alignItems: "center", gap: 8, padding: "8px 0", transition: "opacity .2s, box-shadow .2s" },
  taskRowLifted: { background: "#fff", transform: "scale(1.02)", boxShadow: liftedShadow, zIndex: 5, borderRadius: 10 },
  rankBubble: { width: 17, height: 17, borderRadius: 99, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'JetBrains Mono',monospace", fontSize: 10.5, fontWeight: 600, flexShrink: 0 },
  arrowBtn: { width: 26, height: 26, borderRadius: 99, background: COLORS.bg, border: `1px solid ${COLORS.border}`, color: COLORS.textSec, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "inherit" },
  arrowBtnDisabled: { color: "#dcd4cb", cursor: "default" },
  inlineInput: { border: "none", borderBottom: "1px solid transparent", background: "none", fontFamily: "inherit", fontSize: 13.5, color: COLORS.text, outline: "none", flex: 1, transition: "border-color .18s", padding: "2px 0" },
  inlineInputFocus: { borderBottom: `1px solid ${COLORS.accent}` },

  // Thursday transition moment
  thursdayOverlay: { position: "absolute", inset: 0, background: "rgba(250,247,244,.96)", backdropFilter: "blur(3px)", animation: ANIM.fadein, zIndex: Z.thursday, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: 24 },
  pulseRing: { position: "absolute", inset: 0, borderRadius: 99, border: `2px solid ${COLORS.ref}`, animation: ANIM.pulsering },
};
