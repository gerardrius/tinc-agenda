// Vercel serverless function. Manual upload from Jo → Progrés arbitral (the
// "📄 Importar informe RFEF" button) — parsing/writing logic lives in
// _importRefereeReport.js, shared with the Drive-folder sync endpoint.
import { importRefereeReport } from "./_importRefereeReport.js";
import { requireUser } from "./_auth.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "method not allowed" });
    return;
  }
  if (!(await requireUser(req, res))) return;
  try {
    const { fileBase64, fileName } = req.body || {};
    if (!fileBase64) { res.status(400).json({ error: "missing fileBase64" }); return; }
    const result = await importRefereeReport(fileBase64, fileName);
    res.status(200).json(result);
  } catch (e) {
    res.status(500).json({ error: e.errors ? JSON.stringify(e.errors) : (e.message || "Error important l'informe") });
  }
}
