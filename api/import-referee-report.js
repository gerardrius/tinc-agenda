// Vercel serverless function. Parses an RFEF "Informe Arbitral General" PDF
// (uploaded from Jo → Progrés arbitral) and writes one row to
// project-d225e115-18b7-433d-ae0.refereeing.match_reports. Regex-based, not
// an LLM — the RFEF report is a fixed template (same generator across every
// report seen so far), so labeled fields are reliably in the same spots.
// Full extracted text is always stored in `raw_text` too, so a bad regex
// match on some future report variant never loses the underlying data.
import "./_pdf-polyfills.js";
import { getBigQuery } from "./_bigquery.js";
import { extractRubric } from "./_rubric.js";
import { PDFParse } from "pdf-parse";

const PROJECT = "project-d225e115-18b7-433d-ae0";
const REFEREE_NAME = "Rius Riu, Gerard";

const num = (s) => (s == null || s.trim() === "-" || s.trim() === "" ? null : Number(s.replace(",", ".")));
const dateToISO = (dmy) => { const [d, m, y] = dmy.split("-"); return `${y}-${m}-${d}`; };

function parseReport(text) {
  const get = (re) => text.match(re)?.[1]?.trim() ?? null;
  const get3 = (re) => {
    const m = text.match(re);
    return m ? [num(m[1]), num(m[2]), num(m[3])] : [null, null, null];
  };

  const venue = get(/Campo:\s*([^\n]+?)\s+Fecha:/);
  const matchDate = get(/Fecha:\s*(\d{2}-\d{2}-\d{4})/);
  const competition = get(/Competici[oó]n:\s*([^\n]+)/);
  const result = get(/Resultado final:\s*([\d]+\s*-\s*[\d]+)/);

  // Fixture line: whatever non-empty line sits right before "Campo:".
  const beforeCampo = text.slice(0, text.indexOf("Campo:"));
  const fixtureLine = beforeCampo.split("\n").map((l) => l.trim()).filter(Boolean).pop() || "";
  const [homeTeam, awayTeam] = fixtureLine.split(/\s+-\s+/).map((s) => s?.trim());

  // Role roster: "Árbitro: Name" / "Árbitro asistente 1: Name" / etc. —
  // find which line's name matches the referee, use its label as `role`.
  const roleLines = [...text.matchAll(/^\s*(Árbitro|Árbitro asistente 1|Árbitro asistente 2|4º Árbitro|Informador):\s*([^\n]+)$/gm)];
  const myRoleLine = roleLines.find(([, , name]) => name.includes(REFEREE_NAME));
  const role = myRoleLine ? myRoleLine[1] : null;

  const difficulty = get(/Dificultad del partido:\s*([^\n]+)/);

  const [penalty_calls_correct, penalty_calls_error, penalty_calls_doubt] =
    get3(/PENALTIS SEÑALADOS:\s*([\d-]+)\s+([\d-]+)\s+([\d-]+)/);
  const [penalty_missed_correct, penalty_missed_error, penalty_missed_doubt] =
    get3(/ACCIONES DE ÁREA SIGNIFICATIVAS NO SANCIONADAS COMO PENALTI:\s*([\d-]+)\s+([\d-]+)\s+([\d-]+)/);

  const yellow_shown = num(get(/TARJETAS AMARILLAS MOSTRADAS:\s*([\d-]+)/));
  const [yellow_not_shown_correct, yellow_not_shown_error] = (() => {
    const m = text.match(/TARJETAS AMARILLAS NO MOSTRADAS:\s*([\d-]+)\s+([\d-]+)/);
    return m ? [num(m[1]), num(m[2])] : [null, null];
  })();
  const red_direct_shown = num(get(/TARJETAS ROJAS DIRECTAS MOSTRADAS:\s*([\d-]+)/));
  const [red_direct_not_shown_correct, red_direct_not_shown_error] = (() => {
    const m = text.match(/TARJETAS ROJAS DIRECTAS NO MOSTRADAS:\s*([\d-]+)\s+([\d-]+)/);
    return m ? [num(m[1]), num(m[2])] : [null, null];
  })();

  const highlights = get(/ASPECTOS MÁS DESTACADOS:\s*([\s\S]+?)\s*RECOMENDACIONES DE MEJORA:/);
  const improvements = get(/RECOMENDACIONES DE MEJORA:\s*([\s\S]+?)\s*Puntuaci[oó]n/);
  const final_score = num(get(/Puntuaci[oó]n[^:\n]*:\s*([\d.,]+)/));

  return {
    match_date: matchDate ? dateToISO(matchDate) : null,
    home_team: homeTeam || null,
    away_team: awayTeam || null,
    venue,
    competition,
    role,
    final_score,
    difficulty,
    penalty_calls_correct, penalty_calls_error, penalty_calls_doubt,
    penalty_missed_correct, penalty_missed_error, penalty_missed_doubt,
    yellow_shown, yellow_not_shown_correct, yellow_not_shown_error,
    red_direct_shown, red_direct_not_shown_correct, red_direct_not_shown_error,
    highlights, improvements,
    rubric_physical: null, rubric_technical: null, rubric_disciplinary: null,
    rubric_management: null, rubric_personality: null, rubric_teamwork: null,
    raw_text: text,
    result,
  };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "method not allowed" });
    return;
  }
  try {
    const { fileBase64, fileName } = req.body || {};
    if (!fileBase64) { res.status(400).json({ error: "missing fileBase64" }); return; }

    const buffer = Buffer.from(fileBase64, "base64");
    const { text } = await new PDFParse({ data: buffer }).getText();
    const parsed = parseReport(text);
    const { result, ...row } = parsed;

    // Rubric reading (Claude PDF vision) is best-effort — a report still
    // gets its objective match data recorded even if this fails (e.g. no
    // API credit yet, or a transient error), rather than losing the whole
    // import over the enrichment step.
    let rubric = null, rubricError = null;
    try {
      rubric = await extractRubric(fileBase64);
    } catch (e) {
      rubricError = e.message || "Error llegint la rúbrica";
    }
    const SECTION_TO_COLUMN = { "Condición Física Y Posicionamiento": "rubric_physical", "Actuación Técnica": "rubric_technical", "Actuación Disciplinaria": "rubric_disciplinary", "Manejo": "rubric_management", "Personalidad": "rubric_personality", "Trabajo En Equipo": "rubric_teamwork" };
    const rubricColumns = {};
    if (rubric) {
      rubric.sectionAverages.forEach(({ section, average }) => { rubricColumns[SECTION_TO_COLUMN[section]] = average; });
      rubricColumns.rubric_items = rubric.items;
      rubricColumns.rubric_section_averages = rubric.sectionAverages;
    }

    const bigquery = getBigQuery();

    // Same fixture + date already imported (e.g. the same PDF picked twice,
    // a re-export, or a deliberate re-upload to backfill rubric scores that
    // failed the first time) — update the rubric columns on the existing
    // row instead of inserting a duplicate.
    const [existing] = await bigquery.query({
      query: `
        SELECT 1 FROM \`${PROJECT}.refereeing.match_reports\`
        WHERE match_date = @matchDate AND home_team = @homeTeam AND away_team = @awayTeam
        LIMIT 1
      `,
      params: { matchDate: row.match_date, homeTeam: row.home_team, awayTeam: row.away_team },
    });
    if (existing.length) {
      let rubricUpdated = false, rubricUpdateError = null;
      if (rubric) {
        try {
          await bigquery.query({
            query: `
              UPDATE \`${PROJECT}.refereeing.match_reports\`
              SET rubric_physical = CAST(@rubric_physical AS NUMERIC), rubric_technical = CAST(@rubric_technical AS NUMERIC),
                  rubric_disciplinary = CAST(@rubric_disciplinary AS NUMERIC), rubric_management = CAST(@rubric_management AS NUMERIC),
                  rubric_personality = CAST(@rubric_personality AS NUMERIC), rubric_teamwork = CAST(@rubric_teamwork AS NUMERIC),
                  rubric_items = @rubric_items, rubric_section_averages = @rubric_section_averages
              WHERE match_date = @matchDate AND home_team = @homeTeam AND away_team = @awayTeam
            `,
            params: { ...rubricColumns, matchDate: row.match_date, homeTeam: row.home_team, awayTeam: row.away_team },
          });
          rubricUpdated = true;
        } catch (e) {
          // BigQuery can't UPDATE a row still in the streaming-insert buffer
          // (up to ~90 min after insert) — surface that plainly instead of failing.
          rubricUpdateError = e.message || "No s'ha pogut actualitzar la rúbrica (probablement el registre és massa recent)";
        }
      }
      res.status(200).json({ ok: true, skipped: true, rubricUpdated, rubricUpdateError, rubricError, parsed: { ...row, raw_text: undefined, result } });
      return;
    }

    await bigquery.dataset("refereeing", { projectId: PROJECT }).table("match_reports").insert([
      { ...row, ...rubricColumns, source_file: fileName || null, imported_at: new Date().toISOString() },
    ]);

    res.status(200).json({ ok: true, skipped: false, rubricError, parsed: { ...row, raw_text: undefined, result } });
  } catch (e) {
    res.status(500).json({ error: e.errors ? JSON.stringify(e.errors) : (e.message || "Error important l'informe") });
  }
}
