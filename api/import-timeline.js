// Vercel serverless function. Proxies a Google Maps Timeline JSON export
// (picked from the phone in Son → Mapa) to the import-timeline Cloud
// Function, which matches it against Garmin sleep data and writes new rows
// to life.sleep_locations. The Cloud Function's own bearer token lives only
// here, server-side — the app never holds it.
const CLOUD_FUNCTION_URL = "https://import-timeline-3utsyvgnba-ew.a.run.app";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "method not allowed" });
    return;
  }
  const token = process.env.LIFE_TRACKING_TOKEN;
  if (!token) {
    res.status(500).json({ error: "LIFE_TRACKING_TOKEN not configured" });
    return;
  }

  const upstream = await fetch(CLOUD_FUNCTION_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(req.body),
  });
  const data = await upstream.json();
  res.status(upstream.status).json(data);
}
