// Vercel serverless function. Real personal-finance data from the
// imagin-finance-sync BigQuery project, replacing FinancesFullScreen's
// sample-data placeholders. One request, several queries — same shape as
// api/sleep.js's "everything the screen needs, in one round trip" pattern.
import { getBigQuery, plain } from "./_bigquery.js";
import { requireUser } from "./_auth.js";

const PROJECT = "imagin-finance-sync";

export default async function handler(req, res) {
  if (!(await requireUser(req, res))) return;
  try {
    const bigquery = getBigQuery();
    const run = (query) => bigquery.query({ query }).then(([rows]) => plain(rows));

    const [netWorth, netWorthTrend, monthly, spendByCategory, transactions, investments, categoryLabels, tipologiaLabels] = await Promise.all([
      run(`SELECT currency, total_amount, by_source FROM \`${PROJECT}.finance.net_balance\``),
      // Same "prefer investments_derived, else the account's own snapshot"
      // priority the net_balance view uses, but sliced per calendar day
      // instead of collapsed to the single latest row — gives a real trend.
      run(`
        WITH ranked AS (
          SELECT *, DATE(snapshot_at) AS day,
            ROW_NUMBER() OVER (
              PARTITION BY source, DATE(snapshot_at)
              ORDER BY
                CASE balance_type
                  WHEN 'investments_derived' THEN 0
                  WHEN 'CLBD' THEN 1
                  WHEN 'checking_manual_snapshot' THEN 1
                  WHEN 'investments' THEN 1
                  WHEN 'other' THEN 1
                  ELSE 2
                END,
                snapshot_at DESC
            ) AS rn
          FROM \`${PROJECT}.finance.balance_snapshots\`
        )
        SELECT day, currency, SUM(amount) AS total
        FROM ranked WHERE rn = 1
        GROUP BY day, currency
        ORDER BY day
      `),
      run(`SELECT month, income, expense, net FROM \`${PROJECT}.finance.v_spend_monthly\` ORDER BY month DESC LIMIT 12`),
      run(`SELECT month, category, tipologia, total FROM \`${PROJECT}.finance.v_spend_by_category\` ORDER BY month DESC LIMIT 500`),
      run(`SELECT booking_date, amount, currency, counterparty, description, category, tipologia FROM \`${PROJECT}.finance.v_transactions_clean\` ORDER BY booking_date DESC LIMIT 300`),
      run(`SELECT fund_code, name, account_label, units, nav, price_date, value_eur FROM \`${PROJECT}.finance.v_investments_value\``),
      run(`SELECT category_key, display_label FROM \`${PROJECT}.finance.category_labels\``),
      run(`SELECT tipologia_key, display_label FROM \`${PROJECT}.finance.tipologia_labels\``),
    ]);

    res.setHeader("Cache-Control", "s-maxage=900, stale-while-revalidate=120");
    res.status(200).json({
      netWorth: netWorth[0] || null,
      netWorthTrend,
      monthly,
      spendByCategory,
      transactions,
      investments,
      categoryLabels,
      tipologiaLabels,
    });
  } catch (e) {
    res.status(500).json({ error: e.message || "BigQuery error" });
  }
}
