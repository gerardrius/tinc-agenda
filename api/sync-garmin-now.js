// Vercel serverless function. Manual "sync now" trigger for the garmin-sync
// Cloud Run service, so Avui/Jo/Son can show today's sleep the moment the
// user wakes up instead of waiting for the 04:00 scheduled job (which also
// only looks back a few days, not "right now"). Reuses the same
// X-Automation-Token the Cloud Scheduler jobs already send — the service's
// own auth, unrelated to any Google Cloud IAM/OIDC check.
const GARMIN_SYNC_URL = "https://garmin-sync-819221815091.europe-west1.run.app";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "method not allowed" });
    return;
  }
  const token = process.env.GARMIN_SYNC_TOKEN;
  if (!token) {
    res.status(500).json({ error: "GARMIN_SYNC_TOKEN not configured" });
    return;
  }
  try {
    const upstream = await fetch(`${GARMIN_SYNC_URL}/sync?days=1`, {
      method: "POST",
      headers: { "X-Automation-Token": token },
    });
    const data = await upstream.json().catch(() => ({}));
    if (!upstream.ok) {
      res.status(upstream.status).json({ error: data.error || `sync failed (${upstream.status})` });
      return;
    }
    res.status(200).json({ ok: true, ...data });
  } catch (e) {
    res.status(500).json({ error: e.message || "Error sincronitzant amb Garmin" });
  }
}
