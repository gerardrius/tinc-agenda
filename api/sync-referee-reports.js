// Vercel serverless function. "🔄 Actualitzar des de Drive" button — lists
// PDFs in the season's Drive folder (shared with the read-only service
// account) and imports any not already recorded, reusing the same parsing
// logic as the manual-upload endpoint. Dedup is by Drive file id
// (source_file), not by match/date, so a report that failed to parse fully
// still won't be silently reprocessed forever — it needs a manual retry.
import { google } from "googleapis";
import { getBigQuery } from "./_bigquery.js";
import { importRefereeReport, PROJECT } from "./_importRefereeReport.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "method not allowed" });
    return;
  }
  try {
    const folderId = process.env.REFEREE_REPORTS_FOLDER_ID;
    if (!folderId) { res.status(500).json({ error: "REFEREE_REPORTS_FOLDER_ID not configured" }); return; }
    const raw = process.env.BIGQUERY_SERVICE_ACCOUNT_KEY;
    if (!raw) { res.status(500).json({ error: "BIGQUERY_SERVICE_ACCOUNT_KEY not configured" }); return; }
    const credentials = JSON.parse(raw);

    const auth = new google.auth.GoogleAuth({ credentials, scopes: ["https://www.googleapis.com/auth/drive.readonly"] });
    const drive = google.drive({ version: "v3", auth });

    const list = await drive.files.list({
      q: `'${folderId}' in parents and mimeType = 'application/pdf' and trashed = false`,
      fields: "files(id, name)",
      pageSize: 200,
    });
    const files = list.data.files || [];

    const bigquery = getBigQuery();
    const [alreadyImported] = await bigquery.query({
      query: `SELECT DISTINCT source_file FROM \`${PROJECT}.refereeing.match_reports\` WHERE source_file IS NOT NULL`,
    });
    const knownIds = new Set(alreadyImported.map((r) => r.source_file));

    const results = [];
    for (const file of files) {
      if (knownIds.has(file.id)) { results.push({ file: file.name, status: "ja importat" }); continue; }
      try {
        const download = await drive.files.get({ fileId: file.id, alt: "media" }, { responseType: "arraybuffer" });
        const fileBase64 = Buffer.from(download.data).toString("base64");
        const outcome = await importRefereeReport(fileBase64, file.id);
        results.push({
          file: file.name,
          status: outcome.skipped ? "actualitzat (ja existia per data+equips)" : "importat",
          match: `${outcome.parsed.home_team} - ${outcome.parsed.away_team} (${outcome.parsed.match_date})`,
          score: outcome.parsed.final_score,
          rubricError: outcome.rubricError || outcome.rubricUpdateError || null,
        });
      } catch (e) {
        results.push({ file: file.name, status: "error", error: e.message || String(e) });
      }
    }

    res.status(200).json({ ok: true, totalInFolder: files.length, processed: results.length, results });
  } catch (e) {
    res.status(500).json({ error: e.message || "Error sincronitzant amb Drive" });
  }
}
