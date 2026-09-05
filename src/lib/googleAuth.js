// Google Identity Services (GIS) OAuth token client.
// Requires VITE_GOOGLE_CLIENT_ID (Web application OAuth Client ID from
// Google Cloud Console — see README for setup). Scope covers read + write
// so the app can both display events and create match reminder events.

const SCOPE = "https://www.googleapis.com/auth/calendar.events";
const STORAGE_KEY = "tinc_agenda_gcal_token";
// Separate from the short-lived token above: once the user has granted
// consent at least once, this persists indefinitely (localStorage) so later
// app opens can attempt a *silent* token refresh instead of always falling
// back to the consent popup — which the native app shell can't show without
// a direct user tap anyway. localStorage (not sessionStorage) matters here:
// a native WebView typically clears sessionStorage on every app relaunch,
// which was silently forcing a manual "Connectar" tap every single session.
const CONSENTED_KEY = "tinc_agenda_gcal_consented";

function loadStoredToken() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const { token, expiresAt } = JSON.parse(raw);
    if (!token || Date.now() >= expiresAt) return null;
    return token;
  } catch { return null; }
}

function storeToken(token, expiresInSeconds) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ token, expiresAt: Date.now() + expiresInSeconds * 1000 - 30000 }));
  localStorage.setItem(CONSENTED_KEY, "1");
}

export function getToken() {
  return loadStoredToken();
}

export function isConfigured() {
  return Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);
}

// Whether the user has ever completed the consent flow — used to decide
// whether an automatic background refresh attempt is worth making.
export function hasConsented() {
  return localStorage.getItem(CONSENTED_KEY) === "1";
}

// `silent`: true attempts a token refresh with no UI (works only if the
// browser/WebView still has an active Google session — no guarantee, but
// costs nothing to try) instead of opening the consent popup. Callers
// should fall back to a manual "Connectar" tap if a silent attempt rejects.
export function connect({ silent = false } = {}) {
  return new Promise((resolve, reject) => {
    if (!isConfigured()) { reject(new Error("Falta VITE_GOOGLE_CLIENT_ID al .env")); return; }
    if (!window.google?.accounts?.oauth2) { reject(new Error("Google Identity Services encara no ha carregat. Torna-ho a provar en un moment.")); return; }
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      scope: SCOPE,
      callback: (resp) => {
        if (resp.error) { reject(new Error(resp.error)); return; }
        storeToken(resp.access_token, resp.expires_in || 3600);
        resolve(resp.access_token);
      },
    });
    tokenClient = client;
    client.requestAccessToken({ prompt: silent || loadStoredToken() ? "" : "consent" });
  });
}

let tokenClient = null;

export function disconnect() {
  const token = loadStoredToken();
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(CONSENTED_KEY);
  if (token && window.google?.accounts?.oauth2) {
    window.google.accounts.oauth2.revoke(token, () => {});
  }
}
