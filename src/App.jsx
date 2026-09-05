import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { TABS, DOMAINS, RITUAL_BANNERS } from "./lib/constants";
import { defaultDay, defaultGlobal } from "./lib/defaults";
import { storage } from "./lib/storage";
import { todayKey, uid, fmtDate } from "./lib/utils";
import { weekStartKey } from "./lib/taskRules";
import { S, COLORS } from "./lib/styles";
import { isSupabaseConfigured } from "./lib/supabaseClient";
import { getSession, onAuthStateChange, fetchAll, upsertEntry, signOut } from "./lib/remoteStorage";
import * as googleAuth from "./lib/googleAuth";
import { fetchEvents } from "./lib/googleCalendar";
import { useGarminSleepByDate } from "./lib/sleepMapApi";
import { deriveMatchState, detectConfirmation } from "./lib/matchCycle";
import { AuthScreen } from "./components/AuthScreen";
import { TodayView } from "./components/TodayView";
import { AgendaView } from "./components/AgendaView";
import { SetmanaView, DomainSheet } from "./components/SetmanaView";
import { JoView } from "./components/JoView";
import { SonFullScreen } from "./components/SonFullScreen";
import { FinancesFullScreen } from "./components/FinancesFullScreen";
import { RitualNocturna } from "./components/RitualNocturna";
import { RitualSetmanal } from "./components/RitualSetmanal";

// Domain-strip scores — a heuristic stand-in for full per-domain scoring
// (real scoring lives in SetmanaView's balance wheel). "finances" has no
// live data source yet (sample-data only, see FinancesFullScreen).
function useDomainScores(global, allData, garminSleep, matchState) {
  const active = matchState.partitA?.role ? matchState.partitA : matchState.quart;
  const prep = active?.prep || null;
  const prepVals = prep ? Object.values(prep) : null;
  const arbitratge = prepVals?.length ? Math.round((prepVals.filter(Boolean).length / prepVals.length) * 10) : (active ? 5 : 7);

  const todaysSleepScore = garminSleep?.[todayKey()]?.score;
  const son = todaysSleepScore != null ? Math.round(todaysSleepScore / 10) : 6;

  return { arbitratge, relacions: 6, son, finances: 6 };
}

export default function App() {
  const [tab, setTab] = useState("avui");
  const [allData, setAllData] = useState({});
  const [global, setGlobal] = useState(defaultGlobal());
  const [day, setDay] = useState(null);
  const [session, setSession] = useState(null);
  const [calEvents, setCalEvents] = useState(null);
  const [calLoading, setCalLoading] = useState(false);
  const [calError, setCalError] = useState(null);
  const [googleConnected, setGoogleConnected] = useState(Boolean(googleAuth.getToken()));
  const [loading, setLoading] = useState(true);

  // Overlay stack (README "Overlays stack above the shell"): sheet(20) <
  // full(25) < ritual(35) < thursday(40).
  const [sheet, setSheet] = useState(null); // domain id | null
  const [full, setFull] = useState(null); // 'son' | 'fin' | null
  const [ritual, setRitual] = useState(null); // 'nit' | 'set' | null
  const [thursday, setThursday] = useState(null); // confirmed match info | null

  const prevMatchStateRef = useRef(null);

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

  // Writes one or more date-keyed day records in a single atomic update —
  // used directly whenever a handler needs to change more than one thing at
  // once (e.g. add a task AND mark a quick action used), since two separate
  // `persist` calls in the same synchronous handler would each read the same
  // stale `day`/`allData` snapshot and the second call would silently
  // clobber the first. Also used by the nightly/weekly rituals to write
  // several different dates' task lists at once.
  const persistDates = useCallback((updates, gUpdated) => {
    const g = gUpdated || global;
    const nextAllData = { ...allData, ...updates };
    setAllData(nextAllData); setGlobal(g);
    const tk = todayKey();
    if (updates[tk]) setDay(updates[tk]);
    storage.set({ ...nextAllData, _global: g });
    if (isSupabaseConfigured && session) {
      Object.entries(updates).forEach(([dk, obj]) => {
        upsertEntry(session.user.id, dk, obj).catch((e) => console.error("Error sincronitzant amb Supabase:", e));
      });
      if (gUpdated) upsertEntry(session.user.id, "_global", g).catch((e) => console.error("Error sincronitzant amb Supabase:", e));
    }
  }, [allData, global, session]);

  const persist = useCallback((updated, gUpdated) => {
    persistDates({ [todayKey()]: updated }, gUpdated);
  }, [persistDates]);

  const saveGlobal = useCallback((gUpdated) => {
    setGlobal(gUpdated);
    storage.set({ ...allData, [todayKey()]: day, _global: gUpdated });
    if (isSupabaseConfigured && session) {
      upsertEntry(session.user.id, "_global", gUpdated).catch((e) => console.error("Error sincronitzant amb Supabase:", e));
    }
  }, [allData, day, session]);

  // Writes today's tasks/habits/etc — thin wrapper kept for existing call
  // sites (u("tasks", null, arr)) rather than a bespoke setter per field.
  const u = (field, subfield, val) => {
    const d = { ...day };
    if (subfield === null) d[field] = val;
    else d[field] = { ...(d[field] || {}), [subfield]: val };
    persist(d);
  };

  const toggleHabit = (id) => persist({ ...day, habits: { ...day.habits, [id]: !day.habits[id] } });

  /* ── Google Calendar sync ──
     OAuth via Google Identity Services (src/lib/googleAuth.js). First call
     triggers the consent popup; subsequent calls just refresh events. Also
     re-derives the match cycle state (src/lib/matchCycle.js) and fires the
     Thursday transition moment when a TBD placeholder gets confirmed. */
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
      let events;
      try {
        events = await fetchEvents(token);
      } catch (e) {
        if (e.code === 401) {
          googleAuth.disconnect();
          setGoogleConnected(false);
          const freshToken = await googleAuth.connect();
          setGoogleConnected(true);
          events = await fetchEvents(freshToken);
        } else throw e;
      }
      setCalEvents(events);
      const nextState = deriveMatchState(events);
      const confirmed = detectConfirmation(prevMatchStateRef.current, nextState);
      if (confirmed) {
        setThursday(confirmed);
        setTimeout(() => setThursday(null), 2400);
      }
      prevMatchStateRef.current = nextState;
    } catch (e) {
      console.error("Error sincronitzant amb Google Calendar:", e);
      setCalError(e.message || "Error sincronitzant amb Google Calendar.");
    }
    setCalLoading(false);
  };

  useEffect(() => { if (googleConnected) fetchCalendar(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const garminSleep = useGarminSleepByDate();
  const matchState = useMemo(() => deriveMatchState(calEvents), [calEvents]);
  const domainScores = useDomainScores(global, allData, garminSleep, matchState);

  // Ritual banners — derived from the clock/weekday, not user-set
  // (README "banner/bannerHidden: Derived in production").
  const now = new Date();
  const bannerToShow = (() => {
    if (!day) return null;
    if (now.getDay() === 0 && now.getHours() >= RITUAL_BANNERS.set.afterHour && !global.weeklyReviews?.[weekStartKey()] && !day.ritualDismissed?.set) return "set";
    if (now.getHours() >= RITUAL_BANNERS.nit.afterHour && !day.nightlyReview && !day.ritualDismissed?.nit) return "nit";
    return null;
  })();

  const dismissBanner = (key) => persist({ ...day, ritualDismissed: { ...day.ritualDismissed, [key]: true } });

  if (loading) return <div style={S.loadWrap}><p style={{ color: COLORS.textSec }}>Carregant...</p></div>;
  if (isSupabaseConfigured && !session) return <AuthScreen />;
  if (!day) return <div style={S.loadWrap}><p style={{ color: COLORS.textSec }}>Carregant...</p></div>;

  return (
    <div style={S.app}>
      <div style={S.header} className="app-header">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={S.logo}>Bon dia, Gerard</div>
            <div style={{ ...S.dateLabel, textTransform: "capitalize" }}>{fmtDate(new Date())}</div>
            {isSupabaseConfigured && session && (
              <button onClick={() => signOut()} style={{ ...S.smBtn, marginTop: 6, padding: "2px 7px", fontSize: 9 }}>Sortir</button>
            )}
          </div>
          <div style={{ width: 34, height: 34, borderRadius: 99, background: "#f0e7de", border: `1px solid ${COLORS.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12.5, fontWeight: 600, color: COLORS.textSec, flexShrink: 0 }}>G</div>
        </div>
      </div>

      <div style={S.body}>
        {tab === "avui" && (
          <TodayView
            day={day} global={global} allData={allData} garminSleep={garminSleep} u={u} toggleHabit={toggleHabit} persist={persist} saveGlobal={saveGlobal}
            matchState={matchState} calEvents={calEvents} bannerToShow={bannerToShow} onOpenRitual={setRitual}
            onDismissBanner={dismissBanner} onOpenFull={setFull} onOpenSheet={setSheet}
          />
        )}
        {tab === "agenda" && (
          <AgendaView calEvents={calEvents} fetchCalendar={fetchCalendar} calLoading={calLoading} calError={calError} global={global} matchState={matchState} googleConnected={googleConnected} />
        )}
        {tab === "setmana" && <SetmanaView day={day} global={global} allData={allData} garminSleep={garminSleep} domainScores={domainScores} onOpenSheet={setSheet} onOpenFull={setFull} />}
        {tab === "jo" && <JoView day={day} global={global} allData={allData} garminSleep={garminSleep} onOpenFull={setFull} />}
      </div>

      <div style={S.domainStrip} className="app-domainstrip">
        {DOMAINS.map((d) => {
          const score = domainScores[d.id];
          const pct = score != null ? score * 10 : 0;
          return (
            <button key={d.id} onClick={() => setSheet(d.id)} style={S.domainBtn}>
              <span style={{ fontSize: 14 }}>{d.emoji}</span>
              <span style={{ ...S.domainTrack, background: `linear-gradient(90deg, ${d.color} ${pct}%, ${COLORS.track} ${pct}%)` }} />
            </button>
          );
        })}
      </div>

      <div style={S.tabBar} className="app-tabbar">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ ...S.tabBtn, color: tab === t.id ? COLORS.accent : "#b0a496" }}>
            <span style={{ fontSize: 17 }}>{t.icon}</span>
            <span style={{ fontSize: 10.5, fontWeight: 500 }}>{t.label}</span>
          </button>
        ))}
      </div>

      {sheet && <DomainSheet domain={sheet} onClose={() => setSheet(null)} global={global} allData={allData} garminSleep={garminSleep} domainScores={domainScores} />}
      {full === "son" && <SonFullScreen garminSleep={garminSleep} matchState={matchState} onClose={() => setFull(null)} />}
      {full === "fin" && <FinancesFullScreen onClose={() => setFull(null)} />}
      {ritual === "nit" && <RitualNocturna day={day} allData={allData} calEvents={calEvents} persistDates={persistDates} onClose={() => setRitual(null)} />}
      {ritual === "set" && <RitualSetmanal day={day} global={global} allData={allData} matchState={matchState} persistDates={persistDates} onClose={() => setRitual(null)} />}

      {thursday && (
        <div style={S.thursdayOverlay}>
          <div style={{ position: "relative", width: 52, height: 52, marginBottom: 18 }}>
            <div style={S.pulseRing} />
            <div style={{ ...S.pulseRing, animationDelay: ".55s" }} />
            <div style={{ width: 52, height: 52, borderRadius: 99, background: COLORS.ref, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>⚽</div>
          </div>
          <div style={S.ritualEyebrow}>DIJOUS · {now.getHours()}:{String(now.getMinutes()).padStart(2, "0")}</div>
          <div style={{ fontSize: 21, fontWeight: 600, marginTop: 6 }}>{thursday.title}</div>
          <div style={{ fontSize: 13, color: COLORS.textSec, maxWidth: 270, marginTop: 8 }}>{thursday.venue}. La preparació completa s'acaba d'activar.</div>
        </div>
      )}
    </div>
  );
}
