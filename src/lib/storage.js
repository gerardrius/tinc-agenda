/* ═══════ STORAGE LAYER ═══════
   Swap this for Supabase/Firebase when you're ready to scale.
   All reads/writes go through these two functions. */
export const SK = "tincagenda-v3";

export const storage = {
  get: () => { try { return JSON.parse(localStorage.getItem(SK)); } catch { return null; } },
  set: (data) => { try { localStorage.setItem(SK, JSON.stringify(data)); } catch {} },
};
