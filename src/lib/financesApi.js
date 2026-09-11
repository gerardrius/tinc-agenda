import { useEffect, useState } from "react";
import { authedFetch } from "./apiClient";

// { data, loading, error } from api/finances.js (imagin-finance-sync
// BigQuery project) — loaded once per session, same "one request, whole
// screen" shape as sleepMapApi.js.
export function useFinances() {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  useEffect(() => {
    let cancelled = false;
    authedFetch("/api/finances")
      .then((res) => res.json().then((body) => ({ ok: res.ok, body })))
      .then(({ ok, body }) => {
        if (cancelled) return;
        if (!ok) throw new Error(body.error || "Error carregant finances");
        setState({ data: body, loading: false, error: null });
      })
      .catch((e) => { if (!cancelled) setState({ data: null, loading: false, error: e.message }); });
    return () => { cancelled = true; };
  }, []);
  return state;
}
