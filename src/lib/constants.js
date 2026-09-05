// Pool of possible habits. `tags` drive which ones get suggested each day
// (src/lib/habitSuggest.js) based on the week's plan (src/components/WeekPlanSec.jsx).
// 'core' habits are always suggested; the rest only when relevant.
export const HABIT_POOL = [
  { id: "nophone_am", text: "20 min sense mòbil al llevar-me", tags: ["core"] },
  { id: "phone_out", text: "Mòbil fora de l'habitació", tags: ["core"] },
  { id: "social_20", text: "Xarxes ≤ 20 min", tags: ["screen"] },
  { id: "no_screen_22", text: "Sense pantalles després 22:00", tags: ["screen"] },
  { id: "notif_dm", text: "Només notif de DMs", tags: ["screen"] },
  { id: "airplane_match", text: "Mode avió pre-partit", tags: ["match"] },
];

export const WEEK_TAGS = [
  { id: "match", label: "Partit aquesta setmana", color: "#f59e0b" },
  { id: "screen", label: "Reduir pantalla", color: "#f97316" },
  { id: "formacio", label: "Formació", color: "#a78bfa" },
  { id: "feina", label: "Feina intensa", color: "#60a5fa" },
  { id: "descans", label: "Descans", color: "#818cf8" },
];

export const WORK_AREAS = [
  { id: "desigual", name: "Desigual", color: "#60a5fa", icon: "💼" },
  { id: "datoinmo", name: "DatoInmo", color: "#f59e0b", icon: "🏠" },
  { id: "centres", name: "Centres benestar", color: "#a78bfa", icon: "🧘" },
];

export const REF_SUBS = [
  { id: "matches", label: "Partits", icon: "⚽" },
  { id: "planner", label: "Pla 4 setmanes", icon: "📋" },
  { id: "formation", label: "Formació", icon: "🎓" },
  { id: "physical", label: "Físic", icon: "🏃" },
  { id: "cognitive", label: "Cognitiu", icon: "🧠" },
  { id: "video", label: "Vídeo", icon: "🎬" },
  { id: "career", label: "Carrera", icon: "📈" },
];

export const FORMATION_TYPES = [
  { id: "video", label: "Vídeo", color: "#f472b6" },
  { id: "verbal", label: "Verbalització", color: "#fb923c" },
  { id: "laws", label: "Lleis del joc", color: "#818cf8" },
  { id: "physical", label: "Físic", color: "#60a5fa" },
  { id: "other", label: "Altres", color: "#34d399" },
];

export const WEEKDAYS = ["Dilluns", "Dimarts", "Dimecres", "Dijous", "Divendres", "Dissabte", "Diumenge"];

export const TABS = [
  { id: "today", icon: "◉", label: "Avui" },
  { id: "ref", icon: "⚽", label: "Arbitratge" },
  { id: "work", icon: "💼", label: "Feina" },
  { id: "life", icon: "♡", label: "Vida" },
  { id: "cal", icon: "📅", label: "Agenda" },
];

export const MOODS = [
  { id: "great", label: "Molt bé", emoji: "😄", color: "#4ade80" },
  { id: "good", label: "Bé", emoji: "🙂", color: "#86efac" },
  { id: "ok", label: "Regular", emoji: "😐", color: "#fbbf24" },
  { id: "low", label: "Baix", emoji: "😔", color: "#f97316" },
  { id: "bad", label: "Molt baix", emoji: "😞", color: "#ef4444" },
];

export const FEELINGS = ["Tranquil", "Agraït", "Motivat", "Content", "Energètic", "Cansat", "Estressat", "Ansiós", "Trist", "Irritable", "Aclaparat", "Indiferent"];

export const TRAIN_TYPES_PLAN = [
  { id: "laws", label: "Lleis del joc", color: "#818cf8" },
  { id: "videotest", label: "Videotest", color: "#f472b6" },
  { id: "criteria", label: "Criteri / consideracions", color: "#fb923c" },
  { id: "physical", label: "Físic", color: "#60a5fa" },
  { id: "video_own", label: "Vídeo propi", color: "#34d399" },
  { id: "cognitive", label: "Cognitiu general", color: "#a78bfa" },
];

export const EVENT_PRIORITIES = [
  { id: "critical", label: "Crític", color: "#d4856a", bg: "#d4856a18" },
  { id: "important", label: "Important", color: "#f0a868", bg: "#f0a86818" },
  { id: "normal", label: "Normal", color: "#8a7f74", bg: "#8a7f7412" },
];
