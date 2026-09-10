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

// { [calendar_date]: { hours, score, start, end, restingHr, hrvAvg,
// trainingReadiness } } — merged from both sources, with the fresh BigQuery
// feed winning per-date over the older (but location-aware) Timeline feed
// wherever it has data. null while loading, {} on total failure.
export function useGarminSleepByDate() {
  const [byDate, setByDate] = useState(null);
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
  }, []);
  return byDate;
}
