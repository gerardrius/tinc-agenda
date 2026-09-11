// Vercel serverless function. Fresh daily Garmin metrics straight from
// BigQuery (project-d225e115-18b7-433d-ae0.garmin.daily_metrics) — separate
// from api/sleep.js, whose upstream Cloud Function has stalled (its most
// recent night is from mid-July). This endpoint has no location data (that
// only exists in the Timeline-merged feed api/sleep.js reads), so
// src/lib/sleepMapApi.js merges the two: this one wins for score/hours
// freshness, api/sleep.js still backs the sleep-location map.
import { getBigQuery, plain } from "./_bigquery.js";
import { requireUser } from "./_auth.js";

export default async function handler(req, res) {
  if (!(await requireUser(req, res))) return;
  try {
    const bigquery = getBigQuery();
    const [rows] = await bigquery.query({
      query: `
        SELECT calendar_date, sleep_duration_seconds, sleep_score_overall,
               sleep_start_local, sleep_end_local, resting_hr,
               hrv_last_night_avg, hrv_status, stress_avg,
               body_battery_high, body_battery_low,
               training_readiness_score, training_readiness_level,
               deep_sleep_seconds, light_sleep_seconds, rem_sleep_seconds, awake_sleep_seconds
        FROM \`project-d225e115-18b7-433d-ae0.garmin.daily_metrics\`
        ORDER BY calendar_date DESC
        LIMIT 120
      `,
    });
    const days = plain(rows).map((r) => ({
      calendar_date: r.calendar_date,
      sleep_hours: r.sleep_duration_seconds != null ? Number(r.sleep_duration_seconds) / 3600 : null,
      sleep_score: r.sleep_score_overall != null ? Number(r.sleep_score_overall) : null,
      sleep_start_local: r.sleep_start_local,
      sleep_end_local: r.sleep_end_local,
      resting_hr: r.resting_hr != null ? Number(r.resting_hr) : null,
      hrv_avg: r.hrv_last_night_avg != null ? Number(r.hrv_last_night_avg) : null,
      hrv_status: r.hrv_status,
      stress_avg: r.stress_avg != null ? Number(r.stress_avg) : null,
      body_battery_high: r.body_battery_high != null ? Number(r.body_battery_high) : null,
      body_battery_low: r.body_battery_low != null ? Number(r.body_battery_low) : null,
      training_readiness_score: r.training_readiness_score != null ? Number(r.training_readiness_score) : null,
      training_readiness_level: r.training_readiness_level,
      deep_hours: r.deep_sleep_seconds != null ? Number(r.deep_sleep_seconds) / 3600 : null,
      light_hours: r.light_sleep_seconds != null ? Number(r.light_sleep_seconds) / 3600 : null,
      rem_hours: r.rem_sleep_seconds != null ? Number(r.rem_sleep_seconds) / 3600 : null,
      awake_hours: r.awake_sleep_seconds != null ? Number(r.awake_sleep_seconds) / 3600 : null,
    }));
    res.setHeader("Cache-Control", "s-maxage=1800, stale-while-revalidate=300");
    res.status(200).json({ days });
  } catch (e) {
    res.status(500).json({ error: e.message || "BigQuery error" });
  }
}
