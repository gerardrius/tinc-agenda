// Vercel serverless function (Node runtime). Proxies to the read-only
// sleep-map-data Cloud Function in the garmin-sync GCP project — the bearer
// token lives only here, server-side, never in client-side (VITE_) env vars.
export default async function handler(req, res) {
  const token = process.env.SLEEP_MAP_READ_TOKEN;
  if (!token) {
    res.status(500).json({ error: "SLEEP_MAP_READ_TOKEN not configured" });
    return;
  }

  const upstream = await fetch(
    "https://europe-west1-project-d225e115-18b7-433d-ae0.cloudfunctions.net/sleep-map-data",
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!upstream.ok) {
    res.status(upstream.status).json({ error: `upstream ${upstream.status}` });
    return;
  }

  const data = await upstream.json();
  res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=60");
  res.status(200).json(data);
}
