// Vercel serverless function. Parses a full Google Maps Timeline JSON
// export (the same file picked in Son → Mapa's "📍 Importar export del
// Timeline" button) into every visit segment — not just the ones
// overlapping a night's sleep, like life.sleep_locations does — and writes
// them to life.location_visits (place_name, address, lat, lng,
// arrival_time, departure_time).
//
// Reimplements the same two export-format parse rules as the
// import-timeline Cloud Function's timeline_parser.py (that service only
// keeps what it needs for the sleep match, so this can't just call it):
//   - current on-device export: a top-level array (or {semanticSegments:[]})
//     of {startTime, endTime, visit:{topCandidate:{placeLocation:"geo:lat,lng",
//     semanticType}}}.
//   - older Takeout "Semantic Location History": {timelineObjects:[{placeVisit:
//     {duration:{startTimestamp,endTimestamp}, location:{latitudeE7,
//     longitudeE7,address,name}}}]}.
import { getBigQuery } from "./_bigquery.js";

const PROJECT = "project-d225e115-18b7-433d-ae0";
const EARTH_RADIUS_M = 6371000;

function parseGeo(value) {
  value = value.trim();
  if (value.startsWith("geo:")) value = value.slice(4);
  const [lat, lng] = value.replace(/°/g, "").split(",").map((s) => Number(s.trim()));
  return [lat, lng];
}

function* iterNewFormatSegments(rawSegments) {
  for (const seg of rawSegments) {
    const visit = seg.visit;
    if (!visit) continue;
    const { startTime, endTime } = seg;
    const candidate = visit.topCandidate || {};
    const placeLocation = candidate.placeLocation;
    if (!startTime || !endTime || !placeLocation) continue;
    const [lat, lng] = parseGeo(placeLocation);
    const semanticType = candidate.semanticType;
    yield { start: startTime, end: endTime, lat, lng, address: null, placeName: semanticType && semanticType !== "Unknown" ? semanticType : null };
  }
}

function* iterOldFormatSegments(timelineObjects) {
  for (const obj of timelineObjects) {
    const visit = obj.placeVisit;
    if (!visit) continue;
    const duration = visit.duration || {};
    const { startTimestamp, endTimestamp } = duration;
    const location = visit.location || {};
    const { latitudeE7, longitudeE7 } = location;
    if (!startTimestamp || !endTimestamp || latitudeE7 == null || longitudeE7 == null) continue;
    yield { start: startTimestamp, end: endTimestamp, lat: latitudeE7 / 1e7, lng: longitudeE7 / 1e7, address: location.address || null, placeName: location.name || null };
  }
}

function loadSegments(data) {
  if (Array.isArray(data)) return [...iterNewFormatSegments(data)];
  if (data.semanticSegments) return [...iterNewFormatSegments(data.semanticSegments)];
  if (data.timelineObjects) return [...iterOldFormatSegments(data.timelineObjects)];
  throw new Error("Format de Timeline no reconegut: s'esperava un array, o { semanticSegments } o { timelineObjects }.");
}

function haversineM(lat1, lng1, lat2, lng2) {
  const toRad = (d) => (d * Math.PI) / 180;
  const dphi = toRad(lat2 - lat1), dlambda = toRad(lng2 - lng1);
  const a = Math.sin(dphi / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dlambda / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(a));
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "method not allowed" });
    return;
  }
  try {
    const data = req.body;
    if (!data) { res.status(400).json({ error: "missing body" }); return; }

    const segments = loadSegments(data);
    const bigquery = getBigQuery();

    const [namedPlaces] = await bigquery.query({ query: `SELECT place_name, lat, lng, radius_m FROM \`${PROJECT}.life.named_places\`` });
    const matchNamedPlace = (lat, lng) => namedPlaces.find((p) => haversineM(lat, lng, Number(p.lat), Number(p.lng)) <= p.radius_m)?.place_name || null;

    const [existing] = await bigquery.query({ query: `SELECT FORMAT_TIMESTAMP('%FT%T%Ez', arrival_time) AS t FROM \`${PROJECT}.life.location_visits\`` });
    const existingArrivals = new Set(existing.map((r) => new Date(r.t).getTime()));

    const rows = [];
    let skippedDuplicates = 0;
    for (const seg of segments) {
      const arrivalMs = new Date(seg.start).getTime();
      if (existingArrivals.has(arrivalMs)) { skippedDuplicates++; continue; }
      existingArrivals.add(arrivalMs);
      rows.push({
        place_name: matchNamedPlace(seg.lat, seg.lng) || seg.placeName,
        address: seg.address,
        lat: seg.lat,
        lng: seg.lng,
        arrival_time: new Date(seg.start).toISOString(),
        departure_time: new Date(seg.end).toISOString(),
        source: "google_timeline",
        imported_at: new Date().toISOString(),
      });
    }

    if (rows.length) {
      await bigquery.dataset("life", { projectId: PROJECT }).table("location_visits").insert(rows);
    }

    res.status(200).json({ ok: true, processed: segments.length, inserted: rows.length, skippedDuplicates });
  } catch (e) {
    res.status(500).json({ error: e.errors ? JSON.stringify(e.errors) : (e.message || "Error important l'historial d'ubicacions") });
  }
}
