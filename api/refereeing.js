// Vercel serverless function. Real match-report history from
// project-d225e115-18b7-433d-ae0.refereeing.match_reports (populated by
// api/import-referee-report.js), for Jo's "Ascendir a 2ª División" goal
// card and match-rating history chart.
import { getBigQuery, plain } from "./_bigquery.js";

const PROJECT = "project-d225e115-18b7-433d-ae0";

export default async function handler(req, res) {
  try {
    const bigquery = getBigQuery();
    const [rows] = await bigquery.query({
      query: `
        SELECT match_date, home_team, away_team, competition, role, final_score,
               difficulty, highlights, improvements
        FROM \`${PROJECT}.refereeing.match_reports\`
        ORDER BY match_date DESC
        LIMIT 100
      `,
    });
    res.setHeader("Cache-Control", "s-maxage=900, stale-while-revalidate=120");
    res.status(200).json({ matches: plain(rows) });
  } catch (e) {
    res.status(500).json({ error: e.message || "BigQuery error" });
  }
}
