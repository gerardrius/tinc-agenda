import { useEffect, useState } from "react";

export async function fetchSleepData() {
  const res = await fetch("/api/sleep");
  if (!res.ok) throw new Error(`No s'han pogut carregar les dades de son (${res.status})`);
  return res.json();
}

// Fresh daily Garmin metrics straight from BigQuery (api/garmin.js) — the
// Timeline-merged feed api/sleep.js reads from has a stalled upstream sync,
// so this is the up-to-date source for score/hours (but has no location,
// which is why SleepMapSec still reads api/sleep.js directly for the map).
export async function fetchGarminDaily() {
  const res = await fetch("/api/garmin");
  if (!res.ok) throw new Error(`No s'han pogut carregar les dades de Garmin (${res.status})`);
  return res.json();
}

// Shared across every caller in the session so TodayView/HistoryView/SleepMapSec
// only trigger one network request between them.
let _cachedPromise = null;
function getSleepDataCached() {
  if (!_cachedPromise) _cachedPromise = fetchSleepData();
  return _cachedPromise;
}
// Drops the cached /api/sleep response — call after a successful Timeline
// import (SleepMapSec's upload button) so the map picks up the new rows
// without a full app reload.
export function invalidateSleepDataCache() {
  _cachedPromise = null;
}
let _cachedGarminPromise = null;
function getGarminDailyCached() {
  if (!_cachedGarminPromise) _cachedGarminPromise = fetchGarminDaily();
  return _cachedGarminPromise;
}
// Drops the cached /api/garmin response — call after triggering a manual
// Garmin sync (Avui's "🔄 Sincronitzar Garmin" button) so the fresh night
// shows up without a full app reload.
export function invalidateGarminDailyCache() {
  _cachedGarminPromise = null;
}

// Triggers api/sync-garmin-now.js (a manual pull from Garmin Connect, for
// "I just woke up, don't make me wait for the 04:00 job") and, on success,
// invalidates the cached daily-metrics response so the next read is fresh.
export async function syncGarminNow() {
  const res = await fetch("/api/sync-garmin-now", { method: "POST" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return { ok: false, error: data.error || `Error ${res.status}` };
  invalidateGarminDailyCache();
  return { ok: true, ...data };
}

// { [calendar_date]: { hours, score, start, end, restingHr, hrvAvg,
// trainingReadiness } } — merged from both sources, with the fresh BigQuery
// feed winning per-date over the older (but location-aware) Timeline feed
// wherever it has data. null while loading, {} on total failure. `refetch`
// re-runs both fetches (bypassing the module cache) — pass it down to
// wherever a manual sync button lives.
export function useGarminSleepByDate() {
  const [byDate, setByDate] = useState(null);
  const [version, setVersion] = useState(0);
  useEffect(() => {
    let cancelled = false;
    Promise.allSettled([getSleepDataCached(), getGarminDailyCached()]).then(([sleepRes, garminRes]) => {
      if (cancelled) return;
      const m = {};
      if (sleepRes.status === "fulfilled") {
        sleepRes.value.nights.forEach(n => { m[n.calendar_date] = { hours: n.sleep_hours, score: n.sleep_score_overall, start: n.sleep_start_local, end: n.sleep_end_local }; });
      }
      if (garminRes.status === "fulfilled") {
        garminRes.value.days.forEach(d => {
          const existing = m[d.calendar_date] || {};
          m[d.calendar_date] = {
            ...existing,
            hours: d.sleep_hours ?? existing.hours,
            score: d.sleep_score ?? existing.score,
            start: d.sleep_start_local ?? existing.start,
            end: d.sleep_end_local ?? existing.end,
            restingHr: d.resting_hr,
            hrvAvg: d.hrv_avg,
            trainingReadiness: d.training_readiness_score,
            deepHours: d.deep_hours,
            lightHours: d.light_hours,
            remHours: d.rem_hours,
            awakeHours: d.awake_hours,
          };
        });
      }
      if (sleepRes.status === "rejected" && garminRes.status === "rejected") setByDate({});
      else setByDate(m);
    });
    return () => { cancelled = true; };
  }, [version]);
  return [byDate, () => setVersion((v) => v + 1)];
}
