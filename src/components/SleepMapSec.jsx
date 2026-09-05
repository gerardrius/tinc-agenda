import { useEffect, useRef, useState } from "react";
import { Loader } from "@googlemaps/js-api-loader";
import { MarkerClusterer } from "@googlemaps/markerclusterer";
import { fetchSleepData } from "../lib/sleepMapApi";
import { Card, Lbl, Sheet, SheetCloseBtn } from "./ui";
import { COLORS } from "../lib/styles";

const ACCENT = "#818cf8"; // same indigo used by the old manual sleep-quality chips

function scoreColor(s) {
  if (s == null) return "#8a7f74";
  if (s >= 80) return "#c4855a";
  if (s >= 65) return "#f59e0b";
  return "#d4856a";
}
function avg(arr) { return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null; }
function hourFrac(iso) {
  if (!iso) return null;
  const time = iso.split("T")[1];
  const [h, m] = time.split(":");
  return Number(h) + Number(m) / 60;
}
function clockFromFrac(hf) {
  hf = ((hf % 24) + 24) % 24;
  let h = Math.floor(hf), m = Math.round((hf - h) * 60);
  if (m === 60) { m = 0; h = (h + 1) % 24; }
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
// averages bedtime/wake anchored at 18:00 so post-midnight times (00:40)
// average correctly with pre-midnight ones (23:10) instead of splitting ~12h apart.
function avgClock(isoList) {
  const vals = isoList.map(hourFrac).filter(v => v != null).map(v => (v - 18 + 24) % 24);
  if (!vals.length) return null;
  return clockFromFrac(avg(vals) + 18);
}

const UNRESOLVED = "__unresolved__";

function buildCategories(places, nights) {
  const categories = {};
  const fixedKeys = places.map(p => p.place_name);
  places.forEach(p => {
    categories[p.place_name] = { key: p.place_name, label: p.place_name, lat: p.lat, lng: p.lng, fixed: true, nights: [] };
  });
  categories[UNRESOLVED] = { key: UNRESOLVED, label: "Abans del Timeline", lat: null, lng: null, fixed: false, nights: [] };

  nights.forEach(n => {
    let key;
    if (n.place_name && fixedKeys.includes(n.place_name)) {
      key = n.place_name;
    } else if (n.place_name) {
      key = "hotel:" + n.place_name;
      if (!categories[key]) categories[key] = { key, label: n.place_name, lat: null, lng: null, fixed: false, nights: [] };
    } else if (n.city) {
      key = "city:" + n.city;
      if (!categories[key]) categories[key] = { key, label: n.city, lat: null, lng: null, fixed: false, nights: [] };
    } else {
      key = UNRESOLVED;
    }
    categories[key].nights.push(n);
  });

  Object.values(categories).forEach(c => {
    if (c.fixed || c.key === UNRESOLVED) return;
    const withCoords = c.nights.filter(n => n.lat != null && n.lng != null);
    if (withCoords.length) {
      c.lat = avg(withCoords.map(n => n.lat));
      c.lng = avg(withCoords.map(n => n.lng));
    }
  });

  const order = [
    ...fixedKeys,
    ...Object.keys(categories).filter(k => !categories[k].fixed && k !== UNRESOLVED),
    UNRESOLVED,
  ];
  return { categories, order };
}

export function SleepMapSec() {
  const [state, setState] = useState({ loading: true, error: null, places: [], nights: [] });
  const [pin, setPin] = useState(null);
  const mapDivRef = useRef(null);
  const mapObjRef = useRef(null);

  useEffect(() => {
    fetchSleepData()
      .then(d => setState({ loading: false, error: null, places: d.places, nights: d.nights }))
      .catch(e => setState({ loading: false, error: e.message, places: [], nights: [] }));
  }, []);

  const { categories, order } = buildCategories(state.places, state.nights);

  useEffect(() => {
    if (state.loading || state.error || !mapDivRef.current || mapObjRef.current) return;
    let cancelled = false;

    const loader = new Loader({ apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY, version: "weekly" });

    loader.importLibrary("maps").then(async ({ Map }) => {
      if (cancelled) return;
      const { AdvancedMarkerElement, PinElement } = await loader.importLibrary("marker");

      const map = new Map(mapDivRef.current, {
        mapId: import.meta.env.VITE_GOOGLE_MAPS_MAP_ID,
        center: { lat: 41.5, lng: 2.15 },
        zoom: 10,
      });
      mapObjRef.current = map;

      const bounds = new window.google.maps.LatLngBounds();

      // one reference pin per named place, always shown even with 0 nights
      state.places.forEach(p => {
        const cat = categories[p.place_name];
        const n = cat.nights.length;
        const scoreAvg = avg(cat.nights.map(x => x.sleep_score_overall).filter(v => v != null));
        const hoursAvg = avg(cat.nights.map(x => x.sleep_hours).filter(v => v != null));
        const pin = new PinElement({
          background: n ? ACCENT : "#374151",
          borderColor: "#faf7f4",
          glyphColor: "#faf7f4",
          glyph: n ? String(n) : "",
        });
        const marker = new AdvancedMarkerElement({
          position: { lat: p.lat, lng: p.lng }, map, title: p.place_name, content: pin.element, gmpClickable: true,
        });
        marker.addEventListener("gmp-click", () => setPin(p.place_name));
        bounds.extend({ lat: p.lat, lng: p.lng });
      });

      // one marker per night that has its own coordinates (clustered — nights
      // repeating at the same place will overlap almost exactly)
      const nightMarkers = [];
      state.nights.forEach(n => {
        if (n.lat == null || n.lng == null) return;
        const pin = new PinElement({ background: scoreColor(n.sleep_score_overall), borderColor: "#faf7f4", glyphColor: "#faf7f4" });
        const marker = new AdvancedMarkerElement({ position: { lat: n.lat, lng: n.lng }, content: pin.element, title: n.calendar_date, gmpClickable: true });
        const info = new window.google.maps.InfoWindow({
          content: `<div style="font-family:Inter,sans-serif;font-size:12px;min-width:150px">
            <strong>${n.place_name || n.city || "Lloc desconegut"}</strong><br/>
            ${n.calendar_date}<br/>
            Puntuació: ${n.sleep_score_overall ?? "—"} · ${n.sleep_hours != null ? n.sleep_hours.toFixed(1) : "—"}h
          </div>`,
        });
        marker.addEventListener("gmp-click", () => info.open({ anchor: marker, map }));
        bounds.extend({ lat: n.lat, lng: n.lng });
        nightMarkers.push(marker);
      });
      if (nightMarkers.length) new MarkerClusterer({ map, markers: nightMarkers });

      if (!bounds.isEmpty()) map.fitBounds(bounds, 48);
    });

    return () => { cancelled = true; };
  }, [state.loading, state.error]);

  if (state.loading) return <Card><p style={{ margin: 0, fontSize: 12, color: "#8a7f74" }}>Carregant mapa del son…</p></Card>;
  if (state.error) return <Card><p style={{ margin: 0, fontSize: 12, color: "#d4856a" }}>{state.error}</p></Card>;

  const pinCat = pin ? categories[pin] : null;
  const pinNights = pinCat ? [...pinCat.nights].sort((a, b) => (a.calendar_date < b.calendar_date ? 1 : -1)) : [];
  const pinScoreAvg = pinCat ? avg(pinCat.nights.map((x) => x.sleep_score_overall).filter((v) => v != null)) : null;
  const pinHoursAvg = pinCat ? avg(pinCat.nights.map((x) => x.sleep_hours).filter((v) => v != null)) : null;

  return (<div>
    <div ref={mapDivRef} style={{ width: "100%", height: 280, borderRadius: 9, overflow: "hidden", border: "1px solid #ede8e3", marginBottom: 10 }} />
    <Lbl>Llocs</Lbl>
    {order.map(k => {
      const c = categories[k];
      const n = c.nights.length;
      const scoreAvg = avg(c.nights.map(x => x.sleep_score_overall).filter(v => v != null));
      const hoursAvg = avg(c.nights.map(x => x.sleep_hours).filter(v => v != null));
      const rangeStart = avgClock(c.nights.map(x => x.sleep_start_local));
      const rangeEnd = avgClock(c.nights.map(x => x.sleep_end_local));
      return (
        <button key={k} onClick={() => setPin(k)}
          style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", padding: "10px 12px", background: "#ffffff", border: "1px solid #ede8e3", borderRadius: 9, marginBottom: 6, cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{c.label}</div>
            <div style={{ fontSize: 10, color: "#8a7f74" }}>{n ? `${n} ${n === 1 ? "nit" : "nits"}` : (k === UNRESOLVED ? "sense dades de localització" : "sense nits encara")}</div>
          </div>
          {n > 0 && (<div style={{ textAlign: "right", fontSize: 11, color: "#8a7f74" }}>
            <div>puntuació <strong style={{ color: "#2a2420" }}>{Math.round(scoreAvg)}</strong> · {hoursAvg.toFixed(1)}h</div>
            {rangeStart && rangeEnd && <div>{rangeStart}–{rangeEnd}</div>}
          </div>)}
        </button>
      );
    })}

    {pinCat && (
      <Sheet onClose={() => setPin(null)}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontSize: 19, fontWeight: 600 }}>{pinCat.label}</div>
          <SheetCloseBtn onClose={() => setPin(null)} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-around", marginBottom: 14 }}>
          <div style={{ textAlign: "center" }}><div style={{ fontSize: 18, fontWeight: 600 }}>{pinNights.length}</div><div style={{ fontSize: 10.5, color: COLORS.textSec }}>Nits</div></div>
          <div style={{ textAlign: "center" }}><div style={{ fontSize: 18, fontWeight: 600, color: scoreColor(pinScoreAvg) }}>{pinScoreAvg != null ? Math.round(pinScoreAvg) : "—"}</div><div style={{ fontSize: 10.5, color: COLORS.textSec }}>Puntuació</div></div>
          <div style={{ textAlign: "center" }}><div style={{ fontSize: 18, fontWeight: 600 }}>{pinHoursAvg != null ? pinHoursAvg.toFixed(1) : "—"}h</div><div style={{ fontSize: 10.5, color: COLORS.textSec }}>Hores</div></div>
        </div>
        <Card>
          {pinNights.length === 0 && <p style={{ fontSize: 11, color: COLORS.textSec, margin: 0 }}>Encara no hi ha nits registrades aquí.</p>}
          {pinNights.map((n, i) => (
            <div key={n.calendar_date} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderTop: i ? `1px solid ${COLORS.borderSoft}` : "none" }}>
              <span style={{ fontSize: 12.5, color: COLORS.textSec }}>{n.calendar_date}</span>
              <span style={{ width: 8, height: 8, borderRadius: 99, background: scoreColor(n.sleep_score_overall), display: "inline-block" }} />
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12.5, fontWeight: 500 }}>{n.sleep_score_overall ?? "—"}</span>
              <span style={{ fontSize: 12.5, textAlign: "right", width: 52 }}>{n.sleep_hours != null ? `${n.sleep_hours.toFixed(1)}h` : "—"}</span>
            </div>
          ))}
        </Card>
      </Sheet>
    )}
  </div>);
}
