import { supabase, isSupabaseConfigured } from "./supabaseClient";

// Every api/*.js route now requires the caller's Supabase session (see
// api/_auth.js) — this is the one place that attaches it, so no fetch call
// site has to remember to. Where Supabase isn't configured there's no
// session to attach and the server-side check passes through anyway (see
// api/_auth.js), so this is a plain fetch in that mode.
export async function authedFetch(url, opts = {}) {
  const headers = { ...(opts.headers || {}) };
  if (isSupabaseConfigured) {
    const { data } = await supabase.auth.getSession();
    if (data.session?.access_token) headers.Authorization = `Bearer ${data.session.access_token}`;
  }
  return fetch(url, { ...opts, headers });
}
