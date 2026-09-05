// Static config for the 4-tab redesign. See design_handoff_tinc_agenda/README.md
// for the full spec — this file replaces the old 5-tab (Avui/Arbitratge/Feina/
// Vida/Agenda) constants wholesale, per the handoff's "replace, don't merge" rule.
import { COLORS } from "./styles";

export const WEEKDAYS = ["Dilluns", "Dimarts", "Dimecres", "Dijous", "Divendres", "Dissabte", "Diumenge"];
export const WEEKDAYS_ABBR = ["dl.", "dm.", "dc.", "dj.", "dv.", "ds.", "dg."];

// Bottom tab bar — exactly 4 tabs, this order (README "App Shell").
export const TABS = [
  { id: "avui", icon: "☀️", label: "Avui" },
  { id: "agenda", icon: "📅", label: "Agenda" },
  { id: "setmana", icon: "◎", label: "Setmana" },
  { id: "jo", icon: "◍", label: "Jo" },
];

// Domain strip — 4 buttons, always visible above the tab bar.
export const DOMAINS = [
  { id: "arbitratge", emoji: "⚽", label: "Arbitratge", color: COLORS.domainRef },
  { id: "relacions", emoji: "💛", label: "Relacions", color: COLORS.domainRelacions },
  { id: "son", emoji: "💤", label: "Son", color: COLORS.domainSon },
  { id: "finances", emoji: "💰", label: "Finances", color: COLORS.domainFinances },
];

// Balance-wheel axes — 5 domains, 72° apart starting at -90° (README "Setmana").
export const WHEEL_AXES = [
  { id: "arbitratge", label: "Arbitratge", color: COLORS.domainRef },
  { id: "relacions", label: "Relacions", color: COLORS.domainRelacions },
  { id: "salut", label: "Salut", color: COLORS.domainSalut },
  { id: "finances", label: "Finances", color: COLORS.domainFinances },
  { id: "feina", label: "Feina", color: COLORS.domainFeina },
];

// Task/habit topic pills — cycle order per README ritual step 3.
export const TOPICS = [
  { id: "arbitratge", emoji: "⚽", label: "Arbitratge", color: COLORS.domainRef },
  { id: "relacions", emoji: "💛", label: "Relacions", color: COLORS.domainRelacions },
  { id: "son", emoji: "💤", label: "Son", color: COLORS.domainSon },
  { id: "finances", emoji: "💰", label: "Finances", color: COLORS.domainFinances },
  { id: "feina", emoji: "💼", label: "Feina", color: COLORS.domainFeina },
  { id: "salut", emoji: "🏃", label: "Salut", color: COLORS.domainSalut },
];

export const topicById = (id) => TOPICS.find((t) => t.id === id) || TOPICS[0];
export const nextTopic = (id) => {
  const i = TOPICS.findIndex((t) => t.id === id);
  return TOPICS[(i + 1) % TOPICS.length].id;
};

// Quick-action strip (README "Quick-action strip").
export const QUICK_ACTIONS = [
  { id: "tasca", emoji: "➕", label: "Tasca" },
  { id: "mood", emoji: "😄", label: "Registrar ànim" },
  { id: "sleep", emoji: "💤", label: "Son d'ahir" },
  { id: "expense", emoji: "💰", label: "Despesa" },
  { id: "social", emoji: "👥", label: "Activitat social" },
];

// Recurring + match-week habit pool (README "Habits (rules engine)").
export const HABIT_POOL = [
  { id: "sleep_before_23", emoji: "😴", label: "Dormir abans de les 23h", topic: "son", tags: ["core"] },
  { id: "read_10", emoji: "📚", label: "Llegir 10 pàgines", topic: "feina", tags: ["core"] },
  { id: "screens_lt2", emoji: "📵", label: "Pantalles <2h", topic: "salut", tags: ["core"] },
  { id: "sleep_gt80", emoji: "💤", label: "Son >80 puntuació", topic: "son", tags: ["matchWeek"] },
  { id: "no_alcohol", emoji: "🚫", label: "Sense alcohol", topic: "salut", tags: ["matchWeek"] },
];

// Preparation checklists per match role (README "Preparation checklist").
export const PREP_CHECKLISTS = {
  partitA: [
    { id: "video_local", emoji: "📹", label: "Vídeo equip local", hint: "2 sessions" },
    { id: "video_visitant", emoji: "📹", label: "Vídeo equip visitant", hint: "pendent" },
    { id: "perfils", emoji: "👥", label: "Perfils jugadors clau", hint: "" },
    { id: "activacio", emoji: "🏃", label: "Sessió d'activació", hint: "dv." },
    { id: "tapering", emoji: "😴", label: "Tapering marcat", hint: "dv.–ds." },
    { id: "criteris", emoji: "📋", label: "Criteris arbitrals revisats", hint: "" },
  ],
  quart: [
    { id: "briefing", emoji: "📋", label: "Briefing protocol", hint: "" },
    { id: "activacio", emoji: "🏃", label: "Activació", hint: "ds." },
    { id: "son_prioritari", emoji: "😴", label: "Son prioritari", hint: "3 nits" },
  ],
};

// Calendar source colors (README "Calendar colors"). Falls back to `accent`
// for any real Google Calendar not in this sample list.
export const CALENDARS = [
  { id: "personal", label: "Personal", color: COLORS.calPersonal },
  { id: "desigual", label: "Desigual", color: COLORS.calDesigual },
  { id: "datoinmo", label: "DatoInmo", color: COLORS.calDatoInmo },
];
export const calendarColor = (label) =>
  CALENDARS.find((c) => label?.toLowerCase().includes(c.id))?.color || COLORS.accent;

// Sleep-map place markers (README "Mapa section").
export const SLEEP_PLACES = [
  { id: "home", emoji: "🏠", label: "Casa" },
  { id: "bcn", emoji: "🏙️", label: "Pis de Barcelona" },
  { id: "muntsa", emoji: "💛", label: "Casa de la Muntsa" },
  { id: "hotel", emoji: "🏨", label: "Hotel de partit" },
];

// Ritual banners (README "RITUALS").
export const RITUAL_BANNERS = {
  nit: { emoji: "🌙", title: "Com ha anat avui? Tanca el dia.", action: "Començar", color: COLORS.ritualNit, afterHour: 21 },
  set: { emoji: "📅", title: "Setmana acabada. Com ha anat?", action: "Revisar", color: COLORS.ritualSet, afterHour: 20, weekday: 0 },
};

// Ritual step-1 five-point emoji scales (README "Ritual 1 · Step 1").
export const RITUAL_SCALES = {
  energia: ["😴", "🥱", "😐", "🙂", "⚡"],
  anim: ["😔", "🙁", "😐", "🙂", "😄"],
  productivitat: ["🐌", "🚶", "😐", "🏃", "🚀"],
};

// Weekly ritual step-4 keyword → suggested task table (README "Keyword rules").
export const INTENTION_KEYWORD_RULES = [
  {
    keywords: ["partit", "igualada", "arbitr"],
    tasks: [
      { emoji: "📹", label: "Vídeo equip local", topic: "arbitratge", day: 0 },
      { emoji: "📹", label: "Vídeo equip visitant", topic: "arbitratge", day: 1 },
      { emoji: "👥", label: "Perfils jugadors", topic: "arbitratge", day: 2 },
      { emoji: "🏃", label: "Sessió activació", topic: "arbitratge", day: 3 },
      { emoji: "📋", label: "Criteris arbitrals", topic: "arbitratge", day: 3 },
      { emoji: "😴", label: "Dormir abans de les 23h", topic: "son", day: null },
    ],
  },
  {
    keywords: ["lectura", "llegir"],
    tasks: [{ emoji: "📚", label: "Llegir 10 pàgines", topic: "feina", day: null }],
  },
  {
    keywords: ["muntsa"],
    tasks: [{ emoji: "💛", label: "Quedada amb la Muntsa", topic: "relacions", day: 2 }],
  },
  {
    keywords: ["descans", "manteniment"],
    tasks: [{ emoji: "📵", label: "Pantalles <2h", topic: "salut", day: null }],
  },
];

// Always-offered weekly-intention suggestion pills (README "Step 3").
export const INTENTION_SUGGESTIONS_ALWAYS = ["💤 Son prioritari", "👥 Temps de qualitat", "📚 Lectura diària"];
