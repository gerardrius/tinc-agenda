// Google Calendar API v3 calls, authenticated with an OAuth access token
// from googleAuth.js (no API key needed — this reads/writes the signed-in
// user's real calendar, which already includes Apple Calendar events since
// those sync one-way into Google).

const API_BASE = "https://www.googleapis.com/calendar/v3/calendars";

export async function fetchEvents(token, calendarId = "primary") {
  const now = new Date().toISOString();
  const future = new Date(Date.now() + 14 * 86400000).toISOString();
  const url = `${API_BASE}/${encodeURIComponent(calendarId)}/events?timeMin=${now}&timeMax=${future}&singleEvents=true&orderBy=startTime&maxResults=50`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (res.status === 401) { const e = new Error("Token caducat"); e.code = 401; throw e; }
  if (!res.ok) throw new Error(`Error carregant calendari (${res.status})`);
  const data = await res.json();
  return (data.items || []).map(e => ({
    title: e.summary || "Event",
    start: e.start?.dateTime || e.start?.date || "",
    end: e.end?.dateTime || e.end?.date || "",
    location: e.location || "",
    description: e.description || "",
  }));
}

// Creates a calendar event for a match with several reminder overrides,
// so Google's own notification system delivers "many reminders" without
// needing a mail server. Returns the created event's id.
export async function createEvent(token, { summary, description, startISO, endISO, reminderMinutesBefore = [1440, 180, 30], calendarId = "primary" }) {
  const body = {
    summary,
    description,
    start: { dateTime: startISO },
    end: { dateTime: endISO },
    reminders: {
      useDefault: false,
      overrides: reminderMinutesBefore.map(minutes => ({ method: "popup", minutes })),
    },
  };
  const url = `${API_BASE}/${encodeURIComponent(calendarId)}/events`;
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (res.status === 401) { const e = new Error("Token caducat"); e.code = 401; throw e; }
  if (!res.ok) throw new Error(`Error creant event (${res.status})`);
  const data = await res.json();
  return data.id;
}
