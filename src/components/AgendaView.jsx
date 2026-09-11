import { useState, useRef } from "react";
import { CALENDARS, calendarColor, TOPICS, topicById, nextTopic } from "../lib/constants";
import { fmtDate, fmtTime, localDateKey } from "../lib/utils";
import { fixtureText, roleLabel } from "../lib/matchCycle";
import { S, COLORS } from "../lib/styles";
import { Segmented, Sheet, SheetCloseBtn, TopicPill } from "./ui";

const DAY_START = 7, DAY_END = 23, PX_PER_HOUR = 56;
const timelineHeight = (DAY_END - DAY_START) * PX_PER_HOUR;
const hourOf = (iso) => { const d = new Date(iso); return d.getHours() + d.getMinutes() / 60; };
const isTimed = (e) => e.start?.includes("T");
const eventColor = (e) => (e.topic ? topicById(e.topic).color : calendarColor(e.title));

// A calendar event created from a task/priority (see CreateEventSheet's
// taskId) is tinted by that task's live state instead of its topic color:
// done → green wash, not done but its end time has passed → red wash.
function eventState(e, todayTasks, now) {
  const task = e.taskId ? todayTasks?.find((t) => t.id === e.taskId) : null;
  if (!task) return { color: eventColor(e), bg: eventColor(e) + "18" };
  if (task.done) return { color: COLORS.good, bg: COLORS.good + "33" };
  const endsAt = new Date(e.end || e.start);
  if (endsAt < now) return { color: COLORS.alert, bg: COLORS.alert + "33" };
  return { color: eventColor(e), bg: eventColor(e) + "18" };
}
const dateKey = localDateKey;
const addDays = (d, n) => { const nd = new Date(d); nd.setDate(nd.getDate() + n); return nd; };

// Monday of the week containing `d` (README: weeks are Monday–Sunday fixed).
function mondayOf(d) {
  const nd = new Date(d);
  const dow = (nd.getDay() + 6) % 7; // 0 = Monday
  nd.setDate(nd.getDate() - dow);
  nd.setHours(0, 0, 0, 0);
  return nd;
}

// Horizontal swipe → prev/next navigation. Ignored when the gesture is more
// vertical than horizontal (so it doesn't fight the page's own scroll).
function useSwipeNav(onLeft, onRight) {
  const startRef = useRef(null);
  return {
    onTouchStart: (e) => { const t = e.touches[0]; startRef.current = { x: t.clientX, y: t.clientY }; },
    onTouchEnd: (e) => {
      const s = startRef.current; startRef.current = null;
      if (!s) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - s.x, dy = t.clientY - s.y;
      if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.5) {
        if (dx < 0) onLeft(); else onRight();
      }
    },
  };
}

// Greedy interval-graph coloring: events that overlap in time share the row,
// each taking an equal fraction of the width (README "Overlaps").
function layoutColumns(events) {
  const sorted = [...events].sort((a, b) => hourOf(a.start) - hourOf(b.start));
  const active = []; // [{ end, col }]
  return sorted.map((e) => {
    const start = hourOf(e.start), end = hourOf(e.end) || start + 0.5;
    for (let i = active.length - 1; i >= 0; i--) if (active[i].end <= start) active.splice(i, 1);
    const usedCols = new Set(active.map((a) => a.col));
    let col = 0; while (usedCols.has(col)) col++;
    active.push({ end, col });
    const cols = Math.max(...active.map((a) => a.col), col) + 1;
    return { e, start, end, col, cols };
  }).map((row, i, arr) => {
    const clusterCols = Math.max(...arr.filter((o) => o.start < row.end && o.end > row.start).map((o) => o.cols));
    return { ...row, cols: clusterCols };
  });
}

function DayTimeline({ events, onSelect, selectedIdx, onCreateSlot, isToday, todayTasks }) {
  const timed = events.filter(isTimed);
  const allDay = events.filter((e) => !isTimed(e));
  const laidOut = layoutColumns(timed);
  const now = new Date();
  const nowH = now.getHours() + now.getMinutes() / 60;
  const showNow = isToday && nowH >= DAY_START && nowH <= DAY_END;

  // Tapping empty timeline space opens the create-event sheet at that hour;
  // tapping an existing event block (a <button>) stops propagation instead.
  const handleTimelineClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const rawHour = DAY_START + y / PX_PER_HOUR;
    const hour = Math.max(DAY_START, Math.min(DAY_END - 1, Math.round(rawHour * 2) / 2));
    onCreateSlot(hour);
  };

  return (
    <div>
      {allDay.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
          {allDay.map((e, i) => <span key={i} style={{ ...S.topicPill, background: COLORS.chipBg, color: COLORS.textSec }}>{e.title}</span>)}
        </div>
      )}
      <div onClick={handleTimelineClick} style={{ position: "relative", height: timelineHeight, marginLeft: 34, cursor: "pointer" }}>
        {Array.from({ length: DAY_END - DAY_START + 1 }, (_, i) => DAY_START + i).map((h) => (
          <div key={h} style={{ position: "absolute", top: (h - DAY_START) * PX_PER_HOUR, left: 0, right: 0 }}>
            <span style={{ position: "absolute", left: -34, top: -6, width: 30, textAlign: "right", fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: COLORS.textSec }}>{String(h).padStart(2, "0")}:00</span>
            <div style={{ borderTop: `1px solid ${COLORS.border}` }} />
          </div>
        ))}
        {showNow && (
          <div style={{ position: "absolute", top: (nowH - DAY_START) * PX_PER_HOUR, left: 0, right: 0, height: 2, background: COLORS.accent }}>
            <div style={{ position: "absolute", left: -4, top: -3, width: 8, height: 8, borderRadius: 99, background: COLORS.accent }} />
          </div>
        )}
        {laidOut.map(({ e, start, end, col, cols }, i) => {
          const title = e.title || "Event";
          const { color, bg } = eventState(e, todayTasks, now);
          const top = Math.max(0, (start - DAY_START) * PX_PER_HOUR);
          const h = Math.max(20, (Math.max(end, start + 0.25) - start) * PX_PER_HOUR - 4);
          const widthPct = 100 / cols;
          return (
            <button key={i} onClick={(ev) => { ev.stopPropagation(); onSelect(events.indexOf(e)); }} style={{
              position: "absolute", top, left: `${col * widthPct}%`, width: `calc(${widthPct}% - 4px)`, height: h,
              background: bg, border: `1px solid ${color}`, borderRadius: 8, padding: "7px 9px",
              textAlign: "left", cursor: "pointer", fontFamily: "inherit", overflow: "hidden",
              outline: selectedIdx === events.indexOf(e) ? `2px solid ${color}` : "none",
            }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{title}</div>
              <div style={{ fontSize: 10, color: COLORS.textSec }}>{fmtTime(e.start)}{e.end ? `–${fmtTime(e.end)}` : ""}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

const SHOWN_EVENTS_PER_DAY = 7;

function WeekGrid({ weekStart, calEvents, matchState, focusDate, onSelectDay }) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const todayDk = dateKey(new Date());
  const selDk = dateKey(focusDate);
  const matchDates = [matchState.partitA, matchState.quart].filter(Boolean).map((m) => m.start?.slice(0, 10));
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
      {days.map((d) => {
        const dk = dateKey(d);
        const isToday = dk === todayDk;
        const isSel = dk === selDk;
        const isMatch = matchDates.includes(dk);
        const dayEvents = (calEvents || []).filter((e) => e.start?.startsWith(dk));
        const shown = dayEvents.slice(0, SHOWN_EVENTS_PER_DAY);
        const extra = dayEvents.length - shown.length;
        return (
          <button key={dk} onClick={() => onSelectDay(d)} style={{
            display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "6px 2px 8px",
            minHeight: 150, minWidth: 0, width: "100%", overflow: "hidden", borderRadius: 10, cursor: "pointer", fontFamily: "inherit", textAlign: "left",
            background: isMatch ? "#3b5bdb12" : isSel ? "#fff" : COLORS.bg,
            border: `1px solid ${isSel ? COLORS.border : "transparent"}`,
            boxSizing: "border-box",
          }}>
            <span style={{ fontSize: 9, visibility: isMatch ? "visible" : "hidden" }}>⚽</span>
            <span style={{ fontSize: 10, color: COLORS.textSec, letterSpacing: 0 }}>{d.toLocaleDateString("ca-ES", { weekday: "short" }).slice(0, 3)}</span>
            <span style={{
              fontSize: 13, fontWeight: 600, width: 22, height: 22, lineHeight: "22px", textAlign: "center", borderRadius: 99,
              color: isToday ? "#fff" : COLORS.text, background: isToday ? COLORS.accent : "transparent",
            }}>{d.getDate()}</span>
            <div style={{ display: "flex", flexDirection: "column", gap: 2, width: "100%", minWidth: 0, marginTop: 4 }}>
              {shown.map((e, j) => (
                <div key={j} style={{ display: "flex", alignItems: "center", gap: 3, minWidth: 0 }}>
                  <span style={{ width: 5, height: 5, borderRadius: 99, background: eventColor(e), flexShrink: 0 }} />
                  <span style={{ flex: 1, minWidth: 0, fontSize: 8.5, color: "#6d6259", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.title}</span>
                </div>
              ))}
              {extra > 0 && <span style={{ fontSize: 8.5, color: COLORS.textMuted }}>+{extra} més</span>}
            </div>
          </button>
        );
      })}
    </div>
  );
}

const DURATIONS = [30, 60, 90, 120];
const MATCH_LETTERS = ["A", "B", "C"];

// `event`: when set, the sheet edits that existing event in place (title
// "Editar event", a Delete action, submit calls onUpdate) instead of
// creating a new one — same form, so the two flows can't drift apart.
export function CreateEventSheet({ slot, date, initialTitle, taskId, event, onClose, onCreate, onUpdate, onDelete }) {
  const editing = Boolean(event);
  const baseDate = editing ? new Date(event.start) : new Date(date);
  const initial = new Date(baseDate);
  if (!editing) initial.setHours(Math.floor(slot), (slot % 1) * 60, 0, 0);
  const toHHMM = (d) => `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;

  const [title, setTitle] = useState(editing ? event.title : (initialTitle || ""));
  const [location, setLocation] = useState(editing ? event.location || "" : "");
  const [link, setLink] = useState(editing ? event.description || "" : "");
  const [startTime, setStartTime] = useState(toHHMM(initial));
  const [endTime, setEndTime] = useState(editing && event.end ? toHHMM(new Date(event.end)) : toHHMM(new Date(initial.getTime() + 60 * 60000)));
  const [topic, setTopic] = useState(editing ? (event.topic || "arbitratge") : "arbitratge");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const buildDate = (hhmm) => {
    const [h, m] = hhmm.split(":").map(Number);
    const d = new Date(baseDate); d.setHours(h, m, 0, 0);
    return d;
  };
  const startDate = buildDate(startTime);
  const rawEnd = buildDate(endTime);
  const endDate = rawEnd > startDate ? rawEnd : new Date(startDate.getTime() + 30 * 60000);
  const durationMin = Math.round((endDate - startDate) / 60000);
  const topicObj = topicById(topic);

  // Editing the start time keeps the current duration — shifting the end
  // time along with it — instead of leaving a stale end time in place,
  // which used to silently collapse the event to the 30-min floor whenever
  // only the start field got touched.
  const onStartTimeChange = (nextStart) => {
    const prevDuration = Math.max(30 * 60000, endDate - startDate);
    const nextStartDate = buildDate(nextStart);
    setEndTime(toHHMM(new Date(nextStartDate.getTime() + prevDuration)));
    setStartTime(nextStart);
  };
  const applyDuration = (mins) => setEndTime(toHHMM(new Date(startDate.getTime() + mins * 60000)));
  const applyMatchPreset = (letter) => { setTitle(`Partit ${letter} - `); setTopic("arbitratge"); };

  const submit = async () => {
    if (!title.trim() || saving) return;
    setSaving(true);
    const payload = {
      summary: `${topicObj.emoji} ${title.trim()}`,
      title: title.trim(),
      location,
      description: link.trim(),
      startISO: startDate.toISOString(),
      endISO: endDate.toISOString(),
      topic,
      taskId: editing ? event.taskId : taskId,
    };
    try {
      if (editing) await onUpdate(event.id, payload);
      else await onCreate(payload);
      onClose();
    } catch (e) {
      window.alert(e.message || (editing ? "Error actualitzant l'event." : "Error creant l'event."));
      setSaving(false);
    }
  };

  const remove = async () => {
    if (deleting || !window.confirm("Cancel·lar aquest event?")) return;
    setDeleting(true);
    try {
      await onDelete(event.id);
      onClose();
    } catch (e) {
      window.alert(e.message || "Error cancel·lant l'event.");
      setDeleting(false);
    }
  };

  return (
    <Sheet onClose={onClose} maxHeight="82%">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ fontSize: 19, fontWeight: 600 }}>{editing ? "Editar event" : "Nou event"}</div>
        <SheetCloseBtn onClose={onClose} />
      </div>

      {!editing && (
        <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
          {MATCH_LETTERS.map((l) => (
            <button key={l} onClick={() => applyMatchPreset(l)} style={{ ...S.smBtn, flex: 1, textAlign: "center" }}>⚽ Partit {l}</button>
          ))}
        </div>
      )}

      <input style={{ ...S.inp, marginBottom: 8, fontSize: 14 }} placeholder="Nom de l'event" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />

      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10.5, color: COLORS.textMuted, marginBottom: 3 }}>Inici</div>
          <input type="time" style={{ ...S.inp, fontSize: 14 }} value={startTime} onChange={(e) => onStartTimeChange(e.target.value)} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10.5, color: COLORS.textMuted, marginBottom: 3 }}>Final</div>
          <input type="time" style={{ ...S.inp, fontSize: 14 }} value={endTime} onChange={(e) => setEndTime(e.target.value)} />
        </div>
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
        {DURATIONS.map((d) => (
          <button key={d} onClick={() => applyDuration(d)} style={{
            flex: 1, padding: "8px 0", borderRadius: 8, fontSize: 12, cursor: "pointer", fontFamily: "inherit",
            border: `1px solid ${durationMin === d ? COLORS.accent : COLORS.border}`,
            background: durationMin === d ? "#fbf2ea" : "#fdfbf9", color: durationMin === d ? COLORS.accent : COLORS.textSec,
          }}>{d} min</button>
        ))}
      </div>

      <input style={{ ...S.inp, marginBottom: 8, fontSize: 14 }} placeholder="Lloc (opcional)" value={location} onChange={(e) => setLocation(e.target.value)} />
      <input style={{ ...S.inp, marginBottom: 8, fontSize: 14 }} placeholder="Enllaç (opcional)" value={link} onChange={(e) => setLink(e.target.value)} />

      <button onClick={() => setTopic(nextTopic(topic))} style={{ border: "none", background: "none", padding: 0, cursor: "pointer", marginBottom: 14 }}>
        <TopicPill topic={topicObj} />
      </button>

      <div style={{ display: "flex", gap: 8, position: "sticky", bottom: 0 }}>
        {editing && (
          <button onClick={remove} disabled={deleting} style={{ ...S.smBtn, flex: editing ? "0 0 auto" : undefined, textAlign: "center", color: COLORS.alert }}>
            {deleting ? "Cancel·lant…" : "Cancel·lar event"}
          </button>
        )}
        <button onClick={submit} disabled={!title.trim() || saving} style={{ ...S.pBtn, flex: 1, textAlign: "center", opacity: title.trim() ? 1 : 0.5, margin: 0 }}>
          {saving ? (editing ? "Desant…" : "Creant…") : (editing ? "Desar canvis" : "Crear event")}
        </button>
      </div>
    </Sheet>
  );
}

export function AgendaView({ calEvents, fetchCalendar, calLoading, calError, matchState, googleConnected, onRequestCreateSlot, day, onUpdateEvent, onDeleteEvent }) {
  const [agView, setAgView] = useState("day");
  const [focusDate, setFocusDate] = useState(() => new Date());
  const [selectedIdx, setSelectedIdx] = useState(null);
  const [editingEvent, setEditingEvent] = useState(null);

  const selDk = dateKey(focusDate);
  const dayEvents = (calEvents || []).filter((e) => e.start?.startsWith(selDk));
  const selectedEvent = selectedIdx != null ? dayEvents[selectedIdx] : null;
  const thisWeekMatch = [matchState.partitA, matchState.quart].filter(Boolean).find((m) => !m.isTBD);

  const weekStart = mondayOf(focusDate);
  const weekEnd = addDays(weekStart, 6);
  const weekLabel = `${weekStart.getDate()} – ${weekEnd.getDate()} ${weekEnd.toLocaleDateString("ca-ES", { month: "long" })}`;

  const goDay = (delta) => { setFocusDate((d) => addDays(d, delta)); setSelectedIdx(null); };
  const goWeek = (delta) => { setFocusDate((d) => addDays(d, delta * 7)); };
  const swipeDay = useSwipeNav(() => goDay(1), () => goDay(-1));
  const swipeWeek = useSwipeNav(() => goWeek(1), () => goWeek(-1));

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <div>
          <div style={S.title}>Agenda</div>
          <div style={{ ...S.dateLabel, marginTop: -8, textTransform: "capitalize" }}>
            {calEvents ? (agView === "day" ? `${fmtDate(focusDate)} · ${dayEvents.length} esdeveniments` : weekLabel) : "sense sincronitzar"}
          </div>
        </div>
        <button onClick={() => fetchCalendar()} style={S.smBtn}>{calLoading ? "..." : calEvents ? "Sincronitzar" : "Connectar"}</button>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
        <Segmented opts={[{ id: "day", label: "Avui" }, { id: "week", label: "Setmana" }]} val={agView} set={(v) => { setAgView(v); setSelectedIdx(null); }} />
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={() => (agView === "day" ? goDay(-1) : goWeek(-1))} style={S.smBtn}>‹</button>
          <button onClick={() => (agView === "day" ? goDay(1) : goWeek(1))} style={S.smBtn}>›</button>
        </div>
      </div>

      {calError && <p style={{ ...S.muted, color: COLORS.alert, textAlign: "center", marginTop: 30 }}>{calError}</p>}

      {!calEvents && !calError && (
        <div style={{ textAlign: "center", padding: "48px 24px" }}>
          <svg width="78" height="70" viewBox="0 0 78 70" fill="none" style={{ marginBottom: 12 }}>
            <rect x="4" y="10" width="70" height="56" rx="6" stroke="#e3dbd2" strokeWidth="2" />
            <line x1="4" y1="24" x2="74" y2="24" stroke="#ece5dd" strokeWidth="2" />
            <line x1="20" y1="4" x2="20" y2="16" stroke="#e3dbd2" strokeWidth="3" strokeLinecap="round" />
            <line x1="58" y1="4" x2="58" y2="16" stroke="#e3dbd2" strokeWidth="3" strokeLinecap="round" />
            <line x1="16" y1="38" x2="62" y2="38" stroke="#ece5dd" strokeWidth="2" strokeLinecap="round" />
            <line x1="16" y1="48" x2="46" y2="48" stroke="#ece5dd" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <p style={{ fontSize: 14, color: COLORS.textSec, marginBottom: 14 }}>Cap esdeveniment avui. Dia lliure.</p>
          {!googleConnected && <button onClick={() => fetchCalendar()} style={S.pBtn}>Connecta Google Calendar</button>}
        </div>
      )}

      {calEvents && agView === "day" && (
        <div style={{ marginTop: 14 }} {...swipeDay}>
          <DayTimeline events={dayEvents} onSelect={setSelectedIdx} selectedIdx={selectedIdx} onCreateSlot={(hour) => onRequestCreateSlot({ slot: hour, date: focusDate })} isToday={selDk === dateKey(new Date())} todayTasks={selDk === dateKey(new Date()) ? day?.tasks : null} />
          {dayEvents.length === 0 && <p style={{ ...S.muted, textAlign: "center", marginTop: -6, marginBottom: 10 }}>Cap event {selDk === dateKey(new Date()) ? "avui" : "aquest dia"}. Toca l'horari per afegir-ne un.</p>}

          {selectedEvent && (() => {
            const color = eventColor(selectedEvent);
            return (
              <div style={{ ...S.evCard, borderLeft: `3px solid ${color}`, marginTop: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.text }}>{selectedEvent.title}</div>
                  <button onClick={() => setEditingEvent(selectedEvent)} style={{ ...S.smBtn, flexShrink: 0 }}>Editar</button>
                </div>
                <div style={{ fontSize: 11, color: COLORS.textSec, fontFamily: "'JetBrains Mono',monospace", marginTop: 2 }}>{fmtTime(selectedEvent.start)}{selectedEvent.end ? `–${fmtTime(selectedEvent.end)}` : ""}</div>
                {selectedEvent.location && <div style={{ fontSize: 11, color: COLORS.textSec, marginTop: 2 }}>📍 {selectedEvent.location}</div>}
                {selectedEvent.description && <div style={{ fontSize: 11, color: COLORS.textSec, marginTop: 2 }}>🔗 {selectedEvent.description}</div>}
              </div>
            );
          })()}
        </div>
      )}

      {calEvents && agView === "week" && (
        <div style={{ marginTop: 14 }} {...swipeWeek}>
          <WeekGrid weekStart={weekStart} calEvents={calEvents} matchState={matchState} focusDate={focusDate} onSelectDay={(d) => { setFocusDate(d); setAgView("day"); }} />
          {thisWeekMatch && (
            <div style={{ marginTop: 12, padding: "10px 14px", background: COLORS.matchStripBg, border: `1px solid ${COLORS.matchStripBorder}`, borderRadius: 12, fontSize: 12.5, color: COLORS.ref }}>
              ⚽ {roleLabel(thisWeekMatch.title)} · {fmtDate(new Date(thisWeekMatch.start))} · {fixtureText(thisWeekMatch.title)}
            </div>
          )}
          <div style={{ display: "flex", gap: 12, marginTop: 12, flexWrap: "wrap" }}>
            {CALENDARS.map((c) => (
              <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ width: 9, height: 9, borderRadius: 99, background: c.color, display: "inline-block" }} />
                <span style={{ fontSize: 11.5, color: COLORS.textSec }}>{c.label}</span>
              </div>
            ))}
            {TOPICS.map((t) => (
              <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ width: 9, height: 9, borderRadius: 99, background: t.color, display: "inline-block" }} />
                <span style={{ fontSize: 11.5, color: COLORS.textSec }}>{t.emoji} {t.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {editingEvent && (
        <CreateEventSheet
          event={editingEvent}
          onClose={() => { setEditingEvent(null); setSelectedIdx(null); }}
          onUpdate={onUpdateEvent}
          onDelete={onDeleteEvent}
        />
      )}
    </div>
  );
}
