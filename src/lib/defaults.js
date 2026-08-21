import { todayKey } from "./utils";

export const defaultDay = () => ({
  date: todayKey(), habits: {}, customHabits: [], formation: {}, screen: { total: "", social: "", mac: "", iphone: "", notes: "" },
  sleep: { hours: "", quality: "", bedtime: "", waketime: "" }, training: [], work: [], social: [],
  match: null, video: [], cognitive: [], focus: "", reflection: "", careerNotes: "",
  mood: null, feelings: [], moodNote: "", reminders: [],
});

export const defaultGlobal = () => ({
  trainingPlan: [], workReminders: [], eventPriorities: {},
  weeklyPlans: {}, matches: [], formationPlan: [],
});
