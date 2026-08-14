import { useState, useEffect, useCallback } from "react";
import { HABITS, TABS } from "./lib/constants";
import { defaultDay, defaultGlobal } from "./lib/defaults";
import { storage } from "./lib/storage";
import { todayKey, uid, fmtDate } from "./lib/utils";
import { S } from "./lib/styles";
import { isSupabaseConfigured } from "./lib/supabaseClient";
import { getSession, onAuthStateChange, fetchAll, upsertEntry, signOut } from "./lib/remoteStorage";
import { AuthScreen } from "./components/AuthScreen";
import { TodayView } from "./components/TodayView";
import { HistoryView } from "./components/HistoryView";
import { RefView } from "./components/ref/RefView";
import { WorkView } from "./components/WorkView";
import { LifeView } from "./components/LifeView";
import { CalView } from "./components/CalView";

export default function App() {
  const [tab, setTab] = useState("today");
  const [sub, setSub] = useState(null);
  const [allData, setAllData] = useState({});
  const [global, setGlobal] = useState(defaultGlobal());
  const [day, setDay] = useState(null);
  const [session, setSession] = useState(null);
  const [calEvents, setCalEvents] = useState(null);
  const [calLoading, setCalLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const applyRaw = (raw) => {
      const g = raw?._global || defaultGlobal();
      const d = { ...(raw || {}) }; delete d._global;
      setAllData(d); setGlobal(g);
      setDay(d[todayKey()] || defaultDay());
    };

    const loadLocal = () => applyRaw(storage.get());

    const loadRemote = async (userId) => {
      try { applyRaw(await fetchAll(userId)); }
      catch (e) { console.error("Error carregant dades de Supabase, usant còpia local:", e); loadLocal(); }
    };

    if (!isSupabaseConfigured) {
      loadLocal();
      setLoading(false);
      return;
    }

    getSession().then(({ data }) => {
      if (cancelled) return;
      setSession(data.session);
      if (data.session) loadRemote(data.session.user.id).then(() => !cancelled && setLoading(false));
      else setLoading(false);
    });

    const subscription = onAuthStateChange((s) => {
      setSession(s);
      if (s) { setLoading(true); loadRemote(s.user.id).then(() => setLoading(false)); }
      else { setAllData({}); setGlobal(defaultGlobal()); setDay(null); }
    });

    return () => { cancelled = true; subscription.unsubscribe(); };
  }, []);

  const persist = useCallback((updated, gUpdated) => {
    const k = todayKey();
    const g = gUpdated || global;
    const nextAllData = { ...allData, [k]: updated };
    setAllData(nextAllData); setGlobal(g); setDay(updated);
    storage.set({ ...nextAllData, _global: g });
    if (isSupabaseConfigured && session) {
      upsertEntry(session.user.id, k, updated).catch(e => console.error("Error sincronitzant amb Supabase:", e));
      if (gUpdated) upsertEntry(session.user.id, "_global", g).catch(e => console.error("Error sincronitzant amb Supabase:", e));
    }
  }, [allData, global, session]);

  const saveGlobal = useCallback((gUpdated) => {
    setGlobal(gUpdated);
    storage.set({ ...allData, [todayKey()]: day, _global: gUpdated });
    if (isSupabaseConfigured && session) {
      upsertEntry(session.user.id, "_global", gUpdated).catch(e => console.error("Error sincronitzant amb Supabase:", e));
    }
  }, [allData, day, session]);

  const u = (section, field, val) => {
    const d = { ...day };
    if (field === null) d[section] = val;
    else d[section] = { ...(d[section] || {}), [field]: val };
    persist(d);
  };

  const toggleHabit = (id) => persist({ ...day, habits: { ...day.habits, [id]: !day.habits[id] } });

  const addEntry = (section, entry) => { const d = { ...day }; d[section] = [...(d[section] || []), { ...entry, id: uid() }]; persist(d); };
  const removeEntry = (section, id) => { const d = { ...day }; d[section] = d[section].filter(e => e.id !== id); persist(d); };
  const updateEntry = (section, id, field, val) => { const d = { ...day }; d[section] = d[section].map(e => e.id === id ? { ...e, [field]: val } : e); persist(d); };

  /* ── Google Calendar fetch ──
     Per fer servir això, necessites una API key o OAuth.
     Ara mateix és un placeholder — configura VITE_GCAL_API_KEY al .env
     o substitueix per la teva integració preferida. */
  const fetchCalendar = async () => {
    setCalLoading(true);
    try {
      const apiKey = import.meta.env.VITE_GCAL_API_KEY;
      const calId = import.meta.env.VITE_GCAL_ID || 'primary';
      if (!apiKey) {
        // Demo mode: show placeholder
        setCalEvents([]);
        setCalLoading(false);
        return;
      }
      const now = new Date().toISOString();
      const future = new Date(Date.now() + 14 * 86400000).toISOString();
      const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calId)}/events?key=${apiKey}&timeMin=${now}&timeMax=${future}&singleEvents=true&orderBy=startTime&maxResults=50`;
      const res = await fetch(url);
      const data = await res.json();
      const events = (data.items || []).map(e => ({
        title: e.summary || "Event",
        start: e.start?.dateTime || e.start?.date || "",
        end: e.end?.dateTime || e.end?.date || "",
        location: e.location || "",
        description: e.description || "",
      }));
      setCalEvents(events);
    } catch { setCalEvents([]); }
    setCalLoading(false);
  };

  if (loading) return <div style={S.loadWrap}><p style={{ color: "#6b7280" }}>Carregant...</p></div>;
  if (isSupabaseConfigured && !session) return <AuthScreen />;
  if (!day) return <div style={S.loadWrap}><p style={{ color: "#6b7280" }}>Carregant...</p></div>;

  const habitsDone = HABITS.filter(h => day.habits[h.id]).length;

  return (
    <div style={S.app}>
      <div style={S.header} className="app-header">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={S.logo}>Tinc Agenda</div>
            <div style={S.dateLabel}>{fmtDate(new Date())}</div>
            {isSupabaseConfigured && session && (
              <button onClick={() => signOut()} style={{ ...S.smBtn, marginTop: 4, padding: "2px 7px", fontSize: 9 }}>Sortir</button>
            )}
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: habitsDone === 6 ? "#4ade80" : "#e5e7eb" }}>{habitsDone}/6</div>
            <div style={{ fontSize: 8, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.1em" }}>hàbits</div>
          </div>
        </div>
      </div>

      <div style={S.body}>
        {tab === "today" && sub === "history" && <HistoryView {...{ allData, setSub }} />}
        {tab === "today" && sub !== "history" && <TodayView {...{ day, u, toggleHabit, habitsDone, allData, calEvents, fetchCalendar, calLoading, addEntry, removeEntry, updateEntry, setSub }} />}
        {tab === "ref" && <RefView {...{ day, sub, setSub, u, addEntry, removeEntry, updateEntry, persist, global, saveGlobal }} />}
        {tab === "work" && <WorkView {...{ day, addEntry, removeEntry, updateEntry, global, saveGlobal }} />}
        {tab === "life" && <LifeView {...{ day, u, addEntry, removeEntry, updateEntry }} />}
        {tab === "cal" && <CalView {...{ calEvents, fetchCalendar, calLoading, global, saveGlobal }} />}
      </div>

      <div style={S.tabBar} className="app-tabbar">
        {TABS.map(t => (
          <button key={t.id} onClick={() => { setTab(t.id); setSub(null); }} style={{ ...S.tabBtn, color: tab === t.id ? "#4ade80" : "#555" }}>
            <span style={{ fontSize: 16 }}>{t.icon}</span>
            <span style={{ fontSize: 8, marginTop: 1 }}>{t.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
