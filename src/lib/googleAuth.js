// Google OAuth, split across two flows:
//
// - Web/PWA (real browser): Google Identity Services (GIS), which opens a
//   genuine popup and talks back via window.opener/postMessage.
// - Native app (Capacitor): GIS's popup doesn't work inside a WebView — it
//   has no real "opener" window to hand control back to, so the user is
//   left on a blank page after granting consent. Instead we open the OAuth
//   screen in the system browser (@capacitor/browser, an SFSafariViewController
//   sheet) and catch the redirect back into the app via a custom URL scheme
//   (@capacitor/app's appUrlOpen), bridged through the static
//   public/oauth-callback.html page since Google only allows https://
//   redirect URIs for a "Web application" OAuth client.
//
// Requires VITE_GOOGLE_CLIENT_ID (Web application OAuth Client ID from
// Google Cloud Console). Scope covers read + write so the app can both
// display events and create match reminder events.

import { Capacitor } from "@capacitor/core";
import { Browser } from "@capacitor/browser";
import { App as CapApp } from "@capacitor/app";

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
const REDIRECT_SCHEME = "tincagenda://oauth-callback";

let tokenClient = null;

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

function connectNative({ silent }) {
  return new Promise((resolve, reject) => {
    // No refresh-token flow exists here (implicit grant only), so a truly
    // silent native refresh isn't possible once the cached token expires —
    // background/periodic callers just fail quietly until the next manual tap.
    if (silent) { reject(new Error("silent refresh not available on native")); return; }

    const redirectUri = `${window.location.origin}/oauth-callback.html`;
    const params = new URLSearchParams({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: "token",
      scope: SCOPE,
      include_granted_scopes: "true",
      prompt: "consent",
    });
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

    let listenerHandle;
    const cleanup = () => { listenerHandle?.remove(); Browser.close().catch(() => {}); };

    CapApp.addListener("appUrlOpen", ({ url }) => {
      if (!url.startsWith(REDIRECT_SCHEME)) return;
      cleanup();
      const fragment = url.split("#")[1] || "";
      const parsed = new URLSearchParams(fragment);
      const error = parsed.get("error");
      const accessToken = parsed.get("access_token");
      if (error) { reject(new Error(error)); return; }
      if (!accessToken) { reject(new Error("No s'ha rebut cap token de Google.")); return; }
      storeToken(accessToken, Number(parsed.get("expires_in")) || 3600);
      resolve(accessToken);
    }).then((handle) => { listenerHandle = handle; });

    Browser.open({ url: authUrl }).catch((e) => { cleanup(); reject(e); });
  });
}

function connectWeb({ silent }) {
  return new Promise((resolve, reject) => {
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

// `silent`: true attempts a token refresh with no UI (works only if the
// browser still has an active Google session — no guarantee, but costs
// nothing to try) instead of opening the consent flow. Callers should fall
// back to a manual "Connectar" tap if a silent attempt rejects.
export function connect({ silent = false } = {}) {
  if (!isConfigured()) return Promise.reject(new Error("Falta VITE_GOOGLE_CLIENT_ID al .env"));
  return Capacitor.isNativePlatform() ? connectNative({ silent }) : connectWeb({ silent });
}

export function disconnect() {
  const token = loadStoredToken();
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(CONSENTED_KEY);
  if (token && window.google?.accounts?.oauth2) {
    window.google.accounts.oauth2.revoke(token, () => {});
  }
}
