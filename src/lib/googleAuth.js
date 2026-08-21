// Google Identity Services (GIS) OAuth token client.
// Requires VITE_GOOGLE_CLIENT_ID (Web application OAuth Client ID from
// Google Cloud Console — see README for setup). Scope covers read + write
// so the app can both display events and create match reminder events.

const SCOPE = "https://www.googleapis.com/auth/calendar.events";
const STORAGE_KEY = "tinc_agenda_gcal_token";

let tokenClient = null;

function loadStoredToken() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const { token, expiresAt } = JSON.parse(raw);
    if (!token || Date.now() >= expiresAt) return null;
    return token;
  } catch { return null; }
}

function storeToken(token, expiresInSeconds) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ token, expiresAt: Date.now() + expiresInSeconds * 1000 - 30000 }));
}

export function getToken() {
  return loadStoredToken();
}

export function isConfigured() {
  return Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);
}

export function connect() {
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
    client.requestAccessToken({ prompt: loadStoredToken() ? "" : "consent" });
  });
}

export function disconnect() {
  const token = loadStoredToken();
  sessionStorage.removeItem(STORAGE_KEY);
  if (token && window.google?.accounts?.oauth2) {
    window.google.accounts.oauth2.revoke(token, () => {});
  }
}
