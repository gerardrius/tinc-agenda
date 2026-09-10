// Vercel serverless function (Node runtime). Exchanges/refreshes Google
// OAuth tokens for the native app's authorization-code + PKCE flow
// (src/lib/googleAuth.js). The client secret lives only here, server-side
// — a native app bundle can't keep a secret, so the code→token exchange
// and the refresh_token→access_token renewal both have to happen behind
// this proxy instead of directly from the device.
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "method not allowed" });
    return;
  }

  const clientId = process.env.VITE_GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    res.status(500).json({ error: "GOOGLE_CLIENT_SECRET not configured" });
    return;
  }

  const { action, code, verifier, redirectUri, refreshToken } = req.body || {};
  const params = new URLSearchParams({ client_id: clientId, client_secret: clientSecret });

  if (action === "exchange") {
    if (!code || !verifier || !redirectUri) { res.status(400).json({ error: "missing code/verifier/redirectUri" }); return; }
    params.set("code", code);
    params.set("code_verifier", verifier);
    params.set("redirect_uri", redirectUri);
    params.set("grant_type", "authorization_code");
  } else if (action === "refresh") {
    if (!refreshToken) { res.status(400).json({ error: "missing refreshToken" }); return; }
    params.set("refresh_token", refreshToken);
    params.set("grant_type", "refresh_token");
  } else {
    res.status(400).json({ error: "unknown action" });
    return;
  }

  const upstream = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });
  const data = await upstream.json();
  if (!upstream.ok) {
    res.status(upstream.status).json({ error: data.error_description || data.error || "token request failed" });
    return;
  }
  res.status(200).json(data);
}
