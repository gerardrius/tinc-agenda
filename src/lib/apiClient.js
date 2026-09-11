// Every api/*.js route now requires this shared token (see api/_auth.js —
// real Supabase-session auth is the eventual upgrade, once
// VITE_SUPABASE_URL/ANON_KEY hold real project credentials instead of the
// empty placeholders currently sitting in Vercel). Baked into the PWA
// bundle at build time via Vite's VITE_ inlining, same as every other
// VITE_-prefixed value already shipped client-side.
export async function authedFetch(url, opts = {}) {
  const headers = { ...(opts.headers || {}) };
  const token = import.meta.env.VITE_API_ACCESS_TOKEN;
  if (token) headers.Authorization = `Bearer ${token}`;
  return fetch(url, { ...opts, headers });
}
