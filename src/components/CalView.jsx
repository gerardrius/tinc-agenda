import { useState } from "react";
import { EVENT_PRIORITIES } from "../lib/constants";
import { todayKey, fmtDate, fmtTime } from "../lib/utils";
import { S, COLORS } from "../lib/styles";

const DAY_START = 7, DAY_END = 23, PX_PER_HOUR = 56;
const timelineHeight = (DAY_END - DAY_START) * PX_PER_HOUR;
const hourOf = (iso) => { const d = new Date(iso); return d.getHours() + d.getMinutes() / 60; };
const isTimed = (e) => e.start?.includes("T");

// Greedy interval-graph coloring: events that overlap in time share the row,
// each taking an equal fraction of the width (design spec's overlap rule).
function layoutColumns(events) {
  const sorted = [...events].sort((a, b) => hourOf(a.start) - hourOf(b.start));
  const active = []; // [{ end, col }]
  return sorted.map(e => {
    const start = hourOf(e.start), end = hourOf(e.end) || start + 0.5;
    for (let i = active.length - 1; i >= 0; i--) if (active[i].end <= start) active.splice(i, 1);
    const usedCols = new Set(active.map(a => a.col));
    let col = 0; while (usedCols.has(col)) col++;
    active.push({ end, col });
    const cols = Math.max(...active.map(a => a.col), col) + 1;
    return { e, start, end, col, cols };
  }).map((row, i, arr) => {
    // final column count for a row is the max concurrency across its own overlap cluster
    const clusterCols = Math.max(...arr.filter(o => o.start < row.end && o.end > row.start).map(o => o.cols));
    return { ...row, cols: clusterCols };
  });
}

function DayTimeline({ events, prios, onSelect, selectedIdx }) {
  const timed = events.filter(isTimed);
  const allDay = events.filter(e => !isTimed(e));
  const laidOut = layoutColumns(timed);
  const nowH = new Date().getHours() + new Date().getMinutes() / 60;
  const showNow = nowH >= DAY_START && nowH <= DAY_END;

  return (
    <div>
      {allDay.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
          {allDay.map((e, i) => <span key={i} style={{ ...S.topicPill, background: COLORS.chipBg, color: COLORS.textSec }}>{e.title}</span>)}
        </div>
      )}
      <div style={{ position: "relative", height: timelineHeight, marginLeft: 34 }}>
        {Array.from({ length: DAY_END - DAY_START + 1 }, (_, i) => DAY_START + i).map(h => (
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
          const prio = prios[title] || "normal";
          const pd = EVENT_PRIORITIES.find(p => p.id === prio);
          const top = Math.max(0, (start - DAY_START) * PX_PER_HOUR);
          const h = Math.max(20, (Math.max(end, start + 0.25) - start) * PX_PER_HOUR - 4);
          const widthPct = 100 / cols;
          return (
            <button key={i} onClick={() => onSelect(events.indexOf(e))} style={{
              position: "absolute", top, left: `${col * widthPct}%`, width: `calc(${widthPct}% - 4px)`, height: h,
              background: pd.color + "18", border: `1px solid ${pd.color}`, borderRadius: 8, padding: "7px 9px",
              textAlign: "left", cursor: "pointer", fontFamily: "inherit", overflow: "hidden",
              outline: selectedIdx === events.indexOf(e) ? `2px solid ${pd.color}` : "none",
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

function WeekGrid({ calEvents, global, selDay, setSelDay }) {
  const matches = global.matches || [];
  const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() + i); return d; });
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
      {days.map((d, i) => {
        const dk = d.toISOString().split("T")[0];
        const isToday = i === 0;
        const isMatch = matches.some(m => m.date === dk);
        const dayEvents = (calEvents || []).filter(e => e.start?.startsWith(dk));
        return (
          <button key={dk} onClick={() => setSelDay(i)} style={{
            display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "6px 2px 8px",
            minHeight: 96, borderRadius: 10, cursor: "pointer", fontFamily: "inherit", textAlign: "left",
            background: isMatch ? "#3b5bdb12" : selDay === i ? "#fff" : "#faf7f4",
            border: `1px solid ${selDay === i ? COLORS.border : "transparent"}`,
          }}>
            <span style={{ fontSize: 9, visibility: isMatch ? "visible" : "hidden" }}>⚽</span>
            <span style={{ fontSize: 10, color: COLORS.textSec }}>{d.toLocaleDateString("ca-ES", { weekday: "short" }).slice(0, 3)}</span>
            <span style={{ fontSize: 16, fontWeight: 600, color: isToday ? COLORS.accent : COLORS.text, borderBottom: isToday ? `2px solid ${COLORS.accent}` : "none" }}>{d.getDate()}</span>
            <div style={{ display: "flex", flexDirection: "column", gap: 2, width: "100%", marginTop: 4 }}>
              {dayEvents.slice(0, 3).map((e, j) => (
                <div key={j} style={{ display: "flex", alignItems: "center", gap: 3 }}>
                  <span style={{ width: 5, height: 5, borderRadius: 99, background: COLORS.accent, flexShrink: 0 }} />
                  <span style={{ fontSize: 9, color: "#6d6259", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.title}</span>
                </div>
              ))}
            </div>
          </button>
        );
      })}
    </div>
  );
}

export function CalView({ calEvents, fetchCalendar, calLoading, calError, global, saveGlobal }) {
  const [agView, setAgView] = useState("day");
  const [selDay, setSelDay] = useState(0);
  const [selectedIdx, setSelectedIdx] = useState(null);
  const prios = global.eventPriorities || {};
  const setPrio = (title, prio) => saveGlobal({ ...global, eventPriorities: { ...prios, [title]: prio } });

  const selDate = new Date(); selDate.setDate(selDate.getDate() + selDay);
  const selDk = selDate.toISOString().split("T")[0];
  const dayEvents = (calEvents || []).filter(e => e.start?.startsWith(selDk));
  const selectedEvent = selectedIdx != null ? dayEvents[selectedIdx] : null;
  const todaysMatch = (global.matches || []).find(m => m.date === selDk);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <div>
          <div style={S.title}>Agenda</div>
          <div style={{ ...S.dateLabel, marginTop: -8 }}>{calEvents ? `${dayEvents.length} esdeveniments` : "sense sincronitzar"}</div>
        </div>
        <button onClick={fetchCalendar} style={S.smBtn}>{calLoading ? "..." : calEvents ? "Sincronitzar" : "Connectar"}</button>
      </div>

      <div style={{ display: "flex", padding: 2, background: COLORS.chipBg, borderRadius: 99, marginBottom: 14, width: 180 }}>
        {[["day", "Avui"], ["week", "Setmana"]].map(([id, label]) => (
          <button key={id} onClick={() => { setAgView(id); setSelectedIdx(null); }} style={{
            flex: 1, padding: "6px 0", borderRadius: 99, border: "none", cursor: "pointer", fontFamily: "inherit",
            fontSize: 12, fontWeight: 500, background: agView === id ? "#fff" : "transparent",
            boxShadow: agView === id ? "0 1px 2px rgba(42,36,32,.1)" : "none", color: agView === id ? COLORS.text : COLORS.textSec,
          }}>{label}</button>
        ))}
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
          <p style={{ fontSize: 14, color: COLORS.textSec, marginBottom: 14 }}>Prem connectar per sincronitzar amb Google Calendar (inclou Apple Calendar).</p>
          <button onClick={fetchCalendar} style={S.pBtn}>Connecta Google Calendar</button>
        </div>
      )}

      {calEvents && agView === "day" && (
        <>
          {dayEvents.length === 0 ? <p style={{ ...S.muted, textAlign: "center", marginTop: 30 }}>Cap event {selDay === 0 ? "avui" : "aquest dia"}. Dia lliure.</p>
            : <DayTimeline events={dayEvents} prios={prios} onSelect={setSelectedIdx} selectedIdx={selectedIdx} />}

          {selectedEvent && (() => {
            const title = selectedEvent.title || "Event"; const prio = prios[title] || "normal"; const pd = EVENT_PRIORITIES.find(p => p.id === prio);
            return (
              <div style={{ ...S.evCard, borderLeft: `3px solid ${pd.color}`, marginTop: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.text }}>{title}</div>
                <div style={{ fontSize: 11, color: COLORS.textSec, fontFamily: "'JetBrains Mono',monospace", marginTop: 2 }}>{fmtTime(selectedEvent.start)}{selectedEvent.end ? `–${fmtTime(selectedEvent.end)}` : ""}</div>
                {selectedEvent.location && <div style={{ fontSize: 11, color: COLORS.textSec, marginTop: 2 }}>📍 {selectedEvent.location}</div>}
                <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                  {EVENT_PRIORITIES.map(p => (
                    <button key={p.id} onClick={() => setPrio(title, p.id)} style={{ ...S.chip, background: prio === p.id ? p.color + "22" : "#fdfbf9", borderColor: prio === p.id ? p.color + "55" : COLORS.border, color: prio === p.id ? p.color : COLORS.textSec }}>{p.label}</button>
                  ))}
                </div>
              </div>
            );
          })()}
        </>
      )}

      {calEvents && agView === "week" && (
        <>
          <WeekGrid calEvents={calEvents} global={global} selDay={selDay} setSelDay={(i) => { setSelDay(i); setAgView("day"); }} />
          {todaysMatch && (
            <div style={{ marginTop: 12, padding: "10px 14px", background: "#f6f8fe", border: "1px solid #e8ecf9", borderRadius: 12, fontSize: 12.5, color: COLORS.ref }}>
              ⚽ {todaysMatch.teams} · {fmtDate(new Date(todaysMatch.date + "T12:00"))}{todaysMatch.time ? ` · ${todaysMatch.time}` : ""}
            </div>
          )}
        </>
      )}
    </div>
  );
}
