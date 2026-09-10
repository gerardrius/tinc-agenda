import { useEffect, useState } from "react";

// { matches, loading, error } from api/refereeing.js — real RFEF report
// history, refetchable after a successful import (see useImportRefereeReport).
export function useRefereeingMatches() {
  const [state, setState] = useState({ matches: [], loading: true, error: null });
  const load = () => {
    fetch("/api/refereeing")
      .then((res) => res.json().then((body) => ({ ok: res.ok, body })))
      .then(({ ok, body }) => {
        if (!ok) throw new Error(body.error || "Error carregant l'historial arbitral");
        setState({ matches: body.matches, loading: false, error: null });
      })
      .catch((e) => setState({ matches: [], loading: false, error: e.message }));
  };
  useEffect(load, []);
  return { ...state, refetch: load };
}

// Uploads a picked RFEF report PDF to api/import-referee-report.js. Returns
// { ok, parsed } or { ok: false, error }.
export async function importRefereeReport(file) {
  const base64 = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  const res = await fetch("/api/import-referee-report", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fileBase64: base64, fileName: file.name }),
  });
  const data = await res.json();
  if (!res.ok) return { ok: false, error: data.error || `Error ${res.status}` };
  return { ok: true, parsed: data.parsed, skipped: data.skipped, rubricUpdated: data.rubricUpdated, rubricUpdateError: data.rubricUpdateError, rubricError: data.rubricError };
}

// Triggers api/sync-referee-reports.js — lists the season's Drive folder
// and imports/backfills anything not already recorded. Returns
// { ok, totalInFolder, processed, results } or { ok: false, error }.
export async function syncRefereeReportsFromDrive() {
  const res = await fetch("/api/sync-referee-reports", { method: "POST" });
  const data = await res.json();
  if (!res.ok) return { ok: false, error: data.error || `Error ${res.status}` };
  return { ok: true, ...data };
}
