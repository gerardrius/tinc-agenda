// Google OAuth, split across two flows:
//
// - Web/PWA (real browser): Google Identity Services (GIS), which opens a
//   genuine popup and talks back via window.opener/postMessage, and can
//   refresh the access token silently in the background on its own.
// - Native app (Capacitor): GIS's popup doesn't work inside a WebView — it
//   has no real "opener" window to hand control back to, so the user is
//   left on a blank page after granting consent. Instead we open the OAuth
//   screen in the system browser (@capacitor/browser, an SFSafariViewController
//   sheet) and catch the redirect back into the app via a custom URL scheme
//   (@capacitor/app's appUrlOpen), bridged through the static
//   public/oauth-callback.html page since Google only allows https://
//   redirect URIs for a "Web application" OAuth client.
//
//   This side uses authorization-code + PKCE (not the implicit grant) so
//   Google also hands back a long-lived refresh_token: the access token
//   only lives ~1h, but the refresh token lets api/google-token.js mint a
//   new one in the background, indefinitely, with no browser popup and no
//   user interaction. (The implicit grant this used to use has no refresh
//   token at all, so once the ~1h access token expired the only way back in
//   was a manual reconnect through the consent screen — which is why the
//   account used to feel like it "disconnected" every session.)
//
// Requires VITE_GOOGLE_CLIENT_ID (Web application OAuth Client ID from
// Google Cloud Console) client-side, and GOOGLE_CLIENT_SECRET server-side
// only (api/google-token.js) for the native code/refresh exchange — a
// native app bundle can't keep a secret, so that exchange can't happen
// directly from the device. Scope covers read + write so the app can both
// display events and create match reminder events.

import { Capacitor } from "@capacitor/core";
import { Browser } from "@capacitor/browser";
import { App as CapApp } from "@capacitor/app";

const SCOPE = "https://www.googleapis.com/auth/calendar.events";
const STORAGE_KEY = "tinc_agenda_gcal_token";
// Native only: the long-lived refresh token from the code+PKCE exchange.
// Persists indefinitely (localStorage) so later app opens — or the 15-min
// periodic re-sync — can mint a fresh access token in the background with
// no browser popup, instead of always falling back to a manual reconnect.
const REFRESH_KEY = "tinc_agenda_gcal_refresh";
// Separate from the tokens above: once the user has granted consent at
// least once, this persists indefinitely (localStorage) so later app opens
// know it's worth attempting a background refresh at all. localStorage (not
// sessionStorage) matters here: a native WebView typically clears
// sessionStorage on every app relaunch, which was silently forcing a manual
// "Connectar" tap every single session.
const CONSENTED_KEY = "tinc_agenda_gcal_consented";
const REDIRECT_SCHEME = "tincagenda://oauth-callback";
const TOKEN_ENDPOINT = "/api/google-token";

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

// PKCE code_verifier/code_challenge, per RFC 7636 — random 32-byte verifier,
// base64url-encoded; challenge is its SHA-256 digest, same encoding.
function base64url(bytes) {
  let str = "";
  for (const b of bytes) str += String.fromCharCode(b);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function randomVerifier() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return base64url(bytes);
}
async function codeChallenge(verifier) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  return base64url(new Uint8Array(digest));
}

async function tokenRequest(body) {
  const res = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Error obtenint el token de Google.");
  return data;
}

// Applies a token response (access + optionally rotated refresh token) to
// storage. Google doesn't always return a new refresh_token on a refresh
// grant — only overwrite the stored one when it does.
function applyTokenResponse(data) {
  storeToken(data.access_token, data.expires_in || 3600);
  if (data.refresh_token) localStorage.setItem(REFRESH_KEY, data.refresh_token);
  return data.access_token;
}

// Opens the system browser for the one-time consent screen (authorization
// code + PKCE) and exchanges the returned code for an access + refresh
// token pair via api/google-token.js.
function connectNativeViaBrowser() {
  return new Promise((resolve, reject) => {
    (async () => {
      const verifier = randomVerifier();
      const challenge = await codeChallenge(verifier);
      const redirectUri = `${window.location.origin}/oauth-callback.html`;
      const params = new URLSearchParams({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        redirect_uri: redirectUri,
        response_type: "code",
        scope: SCOPE,
        access_type: "offline",
        prompt: "consent",
        code_challenge: challenge,
        code_challenge_method: "S256",
      });
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

      let listenerHandle;
      const cleanup = () => { listenerHandle?.remove(); Browser.close().catch(() => {}); };

      CapApp.addListener("appUrlOpen", ({ url }) => {
        if (!url.startsWith(REDIRECT_SCHEME)) return;
        cleanup();
        const query = (url.split("?")[1] || "").split("#")[0];
        const parsed = new URLSearchParams(query);
        const error = parsed.get("error");
        const code = parsed.get("code");
        if (error) { reject(new Error(error)); return; }
        if (!code) { reject(new Error("No s'ha rebut cap codi d'autenticació de Google.")); return; }
        tokenRequest({ action: "exchange", code, verifier, redirectUri })
          .then((data) => resolve(applyTokenResponse(data)))
          .catch(reject);
      }).then((handle) => { listenerHandle = handle; });

      Browser.open({ url: authUrl }).catch((e) => { cleanup(); reject(e); });
    })();
  });
}

function connectNative({ silent }) {
  const refreshToken = localStorage.getItem(REFRESH_KEY);
  // A stored refresh token means we never need the browser again — silent
  // background re-syncs and manual "Connectar"/"Sincronitzar" taps alike
  // just mint a fresh access token from it, with no consent screen at all.
  if (refreshToken) {
    return tokenRequest({ action: "refresh", refreshToken }).then(applyTokenResponse).catch((e) => {
      if (silent) throw e;
      return connectNativeViaBrowser();
    });
  }
  if (silent) return Promise.reject(new Error("no refresh token yet — needs a manual first connect"));
  return connectNativeViaBrowser();
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

// Forgets only the short-lived access token, keeping the refresh token (and
// consent) intact — used when an API call comes back 401 mid-session, which
// just means the cached access token went stale early, not that the whole
// connection needs re-authorizing. The next connect() call (silent, on
// native) mints a new access token straight from the refresh token.
export function forgetAccessToken() {
  localStorage.removeItem(STORAGE_KEY);
}

export function disconnect() {
  const token = loadStoredToken();
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(CONSENTED_KEY);
  localStorage.removeItem(REFRESH_KEY);
  if (token && window.google?.accounts?.oauth2) {
    window.google.accounts.oauth2.revoke(token, () => {});
  }
}
