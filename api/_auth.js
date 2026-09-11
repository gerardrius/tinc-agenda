// Shared login gate for every api/*.js route. Without this, the app's own
// UI gate (src/App.jsx: `if (isSupabaseConfigured && !session) return
// <AuthScreen />`) was decorative — every endpoint underneath it (real
// finances, sleep, location and refereeing data) was a public Vercel URL
// anyone could curl directly, no login required.
//
// Verifies the same Supabase session the UI already requires, by asking
// Supabase's auth server to validate the caller's access token (works with
// the anon key — no service-role key needed, no new secret to configure).
// Where Supabase isn't configured at all (README's local-only mode, no
// login exists anywhere in the app), there's nothing to check against, so
// this passes through — matches the app's existing "works the same
// without those env vars" behavior.
import { createClient } from "@supabase/supabase-js";

let client = null;
function getAuthClient() {
  if (client !== null) return client;
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY;
  client = url && key ? createClient(url, key) : false;
  return client;
}

// Call first thing in every handler: `if (!(await requireUser(req, res))) return;`
// Writes the 401 itself on failure so call sites don't have to.
export async function requireUser(req, res) {
  const authClient = getAuthClient();
  res.setHeader("X-Debug-Auth-Configured", authClient ? "yes" : "no");
  res.setHeader("X-Debug-Url-Len", String((process.env.VITE_SUPABASE_URL || "").length));
  res.setHeader("X-Debug-Key-Len", String((process.env.VITE_SUPABASE_ANON_KEY || "").length));
  res.setHeader("X-Debug-Env-Keys", Object.keys(process.env).filter((k) => k.includes("SUPABASE")).join(","));
  if (!authClient) return true;

  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) { res.status(401).json({ error: "unauthorized" }); return false; }

  const { data, error } = await authClient.auth.getUser(token);
  if (error || !data?.user) { res.status(401).json({ error: "unauthorized" }); return false; }
  return true;
}
