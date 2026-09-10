// Shared BigQuery client for api/finances.js and api/garmin.js. Uses a
// single read-only service account (tinc-agenda-reader@imagin-finance-sync,
// granted bigquery.dataViewer + bigquery.jobUser on both the finance and
// garmin GCP projects) whose JSON key lives only in this server-side env
// var — never shipped to the client, same pattern as SLEEP_MAP_READ_TOKEN
// and GOOGLE_CLIENT_SECRET.
import { BigQuery } from "@google-cloud/bigquery";

let client = null;

export function getBigQuery() {
  if (client) return client;
  const raw = process.env.BIGQUERY_SERVICE_ACCOUNT_KEY;
  if (!raw) throw new Error("BIGQUERY_SERVICE_ACCOUNT_KEY not configured");
  const credentials = JSON.parse(raw);
  client = new BigQuery({ projectId: credentials.project_id, credentials });
  return client;
}

// BigQuery NUMERIC/TIMESTAMP fields come back as wrapper objects
// ({ value: "123.45" }) — flatten everything to plain JS values so the
// response JSON is just numbers/strings.
export function plain(rows) {
  return JSON.parse(JSON.stringify(rows, (_key, val) => (val && typeof val === "object" && "value" in val ? val.value : val)));
}
