import { supabase } from "./supabaseClient";

export async function fetchAll(userId) {
  const { data, error } = await supabase.from("user_data").select("date, data").eq("user_id", userId);
  if (error) throw error;
  const result = {};
  for (const row of data) result[row.date] = row.data;
  return result;
}

export async function upsertEntry(userId, dateKey, data) {
  const { error } = await supabase.from("user_data").upsert({ user_id: userId, date: dateKey, data, updated_at: new Date().toISOString() });
  if (error) throw error;
}

export function signInWithMagicLink(email) {
  return supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } });
}

export function signOut() {
  return supabase.auth.signOut();
}

export function getSession() {
  return supabase.auth.getSession();
}

export function onAuthStateChange(callback) {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => callback(session));
  return data.subscription;
}
