import { useState, useEffect, useCallback } from "react";
import { TABS } from "./lib/constants";
import { defaultDay, defaultGlobal } from "./lib/defaults";
import { storage } from "./lib/storage";
import { todayKey, uid, fmtDate } from "./lib/utils";
import { suggestHabits, weekStartKey } from "./lib/habitSuggest";
import { S } from "./lib/styles";
import { isSupabaseConfigured } from "./lib/supabaseClient";
import { getSession, onAuthStateChange, fetchAll, upsertEntry, signOut } from "./lib/remoteStorage";
import * as googleAuth from "./lib/googleAuth";
import { fetchEvents } from "./lib/googleCalendar";
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
  const [calError, setCalError] = useState(null);
  const [googleConnected, setGoogleConnected] = useState(Boolean(googleAuth.getToken()));
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

  /* ── Google Calendar sync ──
     OAuth via Google Identity Services (src/lib/googleAuth.js). First call
     triggers the consent popup; subsequent calls just refresh events.
     Reads the real signed-in calendar, which already includes Apple
     Calendar events (one-way Apple → Google sync). See README for the
     one-time Google Cloud Console setup (VITE_GOOGLE_CLIENT_ID). */
  const fetchCalendar = async () => {
    setCalLoading(true);
    setCalError(null);
    try {
      if (!googleAuth.isConfigured()) {
        setCalError("Falta configurar VITE_GOOGLE_CLIENT_ID (mira el README).");
        setCalLoading(false);
        return;
      }
      let token = googleAuth.getToken();
      if (!token) token = await googleAuth.connect();
      setGoogleConnected(true);
      try {
        const events = await fetchEvents(token);
        setCalEvents(events);
      } catch (e) {
        if (e.code === 401) {
          googleAuth.disconnect();
          setGoogleConnected(false);
          const freshToken = await googleAuth.connect();
          setGoogleConnected(true);
          const events = await fetchEvents(freshToken);
          setCalEvents(events);
        } else throw e;
      }
    } catch (e) {
      console.error("Error sincronitzant amb Google Calendar:", e);
      setCalError(e.message || "Error sincronitzant amb Google Calendar.");
    }
    setCalLoading(false);
  };

  if (loading) return <div style={S.loadWrap}><p style={{ color: "#6b7280" }}>Carregant...</p></div>;
  if (isSupabaseConfigured && !session) return <AuthScreen />;
  if (!day) return <div style={S.loadWrap}><p style={{ color: "#6b7280" }}>Carregant...</p></div>;

  const wk = weekStartKey();
  const weekPlan = (global.weeklyPlans || {})[wk];
  const todaysMatch = (global.matches || []).find(m => m.date === todayKey());
  const habitsList = suggestHabits({ weekPlan, hasMatchToday: Boolean(todaysMatch || day.match) });
  const customHabits = day.customHabits || [];
  const habitsTotal = habitsList.length + customHabits.length;
  const habitsDone = habitsList.filter(h => day.habits[h.id]).length + customHabits.filter(h => day.habits[h.id]).length;

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
            <div style={{ fontSize: 26, fontWeight: 800, color: habitsDone === habitsTotal && habitsTotal > 0 ? "#4ade80" : "#e5e7eb" }}>{habitsDone}/{habitsTotal}</div>
            <div style={{ fontSize: 8, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.1em" }}>hàbits</div>
          </div>
        </div>
      </div>

      <div style={S.body}>
        {tab === "today" && sub === "history" && <HistoryView {...{ allData, setSub }} />}
        {tab === "today" && sub !== "history" && <TodayView {...{ day, u, toggleHabit, habitsDone, allData, calEvents, fetchCalendar, calLoading, calError, googleConnected, addEntry, removeEntry, updateEntry, persist, global, saveGlobal, setSub, sub }} />}
        {tab === "ref" && <RefView {...{ day, sub, setSub, u, addEntry, removeEntry, updateEntry, persist, global, saveGlobal, googleConnected, fetchCalendar: fetchCalendar }} />}
        {tab === "work" && <WorkView {...{ day, addEntry, removeEntry, updateEntry, global, saveGlobal }} />}
        {tab === "life" && <LifeView {...{ day, u, addEntry, removeEntry, updateEntry }} />}
        {tab === "cal" && <CalView {...{ calEvents, fetchCalendar, calLoading, calError, global, saveGlobal }} />}
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
