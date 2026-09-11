// Shared login gate for every api/*.js route. Without this, the app's own
// UI gate (src/App.jsx: `if (isSupabaseConfigured && !session) return
// <AuthScreen />`) was decorative — every endpoint underneath it (real
// finances, sleep, location and refereeing data) was a public Vercel URL
// anyone could curl directly, no login required.
//
// Would ideally verify a real Supabase session (asking Supabase's auth
// server to validate the caller's access token), but VITE_SUPABASE_URL/
// VITE_SUPABASE_ANON_KEY are configured in Vercel with empty values — no
// login is actually active anywhere in this deployment despite the app's
// UI branching on `isSupabaseConfigured`. Until that's set up for real,
// this checks a single shared secret (VITE_API_ACCESS_TOKEN) instead: the
// client bakes it into the PWA bundle and sends it as a Bearer token, and
// this rejects anything else. That's not "real" auth — anyone who
// extracts the token from the built JS can reuse it — but it stops the
// current situation (a public URL, zero checks) and costs no new
// infrastructure. Swap in the Supabase check above it once real project
// credentials exist; a matching shared secret should keep working as a
// second valid path so a native-app build without a login flow yet still
// has one.
//
// Fails CLOSED if VITE_API_ACCESS_TOKEN isn't configured at all — this
// deployment already holds real production secrets (BIGQUERY_SERVICE_
// ACCOUNT_KEY etc.), so "not configured" here means a setup gap to fix,
// not an intentional local-only mode to fall back through.
export async function requireUser(req, res) {
  const secret = process.env.VITE_API_ACCESS_TOKEN;
  if (!secret) { res.status(500).json({ error: "VITE_API_ACCESS_TOKEN not configured" }); return false; }

  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (token !== secret) { res.status(401).json({ error: "unauthorized" }); return false; }
  return true;
}
