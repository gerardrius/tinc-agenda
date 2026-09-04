import { useEffect, useState } from "react";

export async function fetchSleepData() {
  const res = await fetch("/api/sleep");
  if (!res.ok) throw new Error(`No s'han pogut carregar les dades de son (${res.status})`);
  return res.json();
}

// Shared across every caller in the session so TodayView/HistoryView/SleepMapSec
// only trigger one network request between them.
let _cachedPromise = null;
function getSleepDataCached() {
  if (!_cachedPromise) _cachedPromise = fetchSleepData();
  return _cachedPromise;
}

// { [calendar_date]: { hours, score } } built from the same Garmin+Timeline
// data as the sleep map — null while loading, {} on failure.
export function useGarminSleepByDate() {
  const [byDate, setByDate] = useState(null);
  useEffect(() => {
    let cancelled = false;
    getSleepDataCached()
      .then(d => {
        if (cancelled) return;
        const m = {};
        d.nights.forEach(n => { m[n.calendar_date] = { hours: n.sleep_hours, score: n.sleep_score_overall }; });
        setByDate(m);
      })
      .catch(() => { if (!cancelled) setByDate({}); });
    return () => { cancelled = true; };
  }, []);
  return byDate;
}
