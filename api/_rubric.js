// RFEF CTA rubric: 6 sections, each item scored via a filled/unfilled radio
// button in the PDF's rating tables — a vector graphic, not text, so no
// regex/text-extraction approach can read it (confirmed by inspecting the
// PDF's content streams: only Helvetica text objects, no icon font). Instead
// we hand the whole PDF to Claude (native PDF vision) and ask it to read
// which column is marked per item. Mirrors the "RFEF CTA - Master Arbitraje"
// Google Sheet's own rubric structure exactly, so section averages match.
import Anthropic from "@anthropic-ai/sdk";

export const RUBRIC_SECTIONS = [
  {
    id: "1", name: "Condición Física Y Posicionamiento",
    items: [
      ["1.01", "Condición física general"],
      ["1.02", "Técnica de carrera"],
      ["1.03", "Lectura de juego, anticipación a la siguiente acción"],
      ["1.04", "Reacción inicial, aceleración"],
      ["1.05", "Transiciones, cambios de ritmo"],
      ["1.06", "Transiciones laterales al llegar al área de penalti"],
      ["1.07", "Posicionamiento en situaciones de presión alta"],
      ["1.08", "Posicionamiento tiros libres"],
      ["1.09", "Posicionamiento saques de esquina"],
      ["1.10", "Posicionamiento balón en juego"],
    ],
  },
  {
    id: "2", name: "Actuación Técnica",
    items: [
      ["2.01", "Criterio sancionador de faltas (falta / no falta)"],
      ["2.02", "Criterio sobre manos sancionables / no sancionables"],
      ["2.03", "Ventaja"],
      ["2.04", "Reanudación del juego: tiros libres/otros"],
      ["2.05", "Reanudación del juego: penaltis"],
      ["2.06", "Tiempo añadido a cada período"],
      ["2.07", "Timing en la toma de decisiones"],
    ],
  },
  {
    id: "3", name: "Actuación Disciplinaria",
    items: [
      ["3.01", "Consistencia en el nivel disciplinario"],
      ["3.02", "Valoración disciplinaria de entradas imprudentes, temerarias"],
      ["3.03", "Valoración disciplinaria en las manos: ataque prometedor / inmediatas a gol"],
      ["3.04", "Valoración disciplinaria del uso de brazos: imprudente, temerario"],
      ["3.05", "Valoración de las sujeciones ostensibles / falta de respeto al juego"],
      ["3.06", "Valoración del ataque prometedor (otras diferentes a manos)"],
      ["3.07", "Valoración de situaciones de oportunidad manifiesta de gol"],
      ["3.08", "Valoración de \"segundas amonestaciones\""],
      ["3.09", "Valoración del juego brusco grave"],
      ["3.10", "Valoración de la conducta violenta"],
      ["3.11", "Protestas"],
      ["3.12", "Otras conductas antideportivas"],
      ["3.13", "Reiteración de infracciones"],
      ["3.14", "Simulación"],
      ["3.15", "Control de áreas técnicas"],
    ],
  },
  {
    id: "4", name: "Manejo",
    items: [
      ["4.01", "Actitud proactiva, preventiva"],
      ["4.02", "Lectura de partido: adaptación a las fases / temperatura del partido"],
      ["4.03", "Comunicación / manejo de jugadores"],
      ["4.04", "Comunicación / manejo de técnicos"],
      ["4.05", "Gestión de confrontaciones"],
      ["4.06", "Jugadores lesionados"],
      ["4.07", "Uso adecuado del silbato"],
    ],
  },
  {
    id: "5", name: "Personalidad",
    items: [
      ["5.01", "Autoridad"],
      ["5.02", "Credibilidad en las decisiones"],
      ["5.03", "Lenguaje corporal"],
      ["5.04", "Liderazgo del equipo arbitral"],
      ["5.05", "Recepción de feedback delegado partido / informador"],
    ],
  },
  {
    id: "6", name: "Trabajo En Equipo",
    items: [
      ["6.01", "Coordinación general con árbitros asistentes"],
      ["6.02", "Coordinación general con cuarto árbitro"],
      ["6.03", "Acciones de ayuda al asistente en acciones de fuera de juego"],
    ],
  },
];

export const ALL_RUBRIC_ITEMS = RUBRIC_SECTIONS.flatMap((s) => s.items.map(([code, label]) => ({ code, label, section: s.name })));

const RUBRIC_TOOL = {
  name: "record_rubric_scores",
  description: "Record the referee's rubric scores read from the RFEF report's rating tables (the ○/● radio-button columns).",
  input_schema: {
    type: "object",
    properties: {
      items: {
        type: "array",
        items: {
          type: "object",
          properties: {
            code: { type: "string", description: "Item code, e.g. \"1.01\"" },
            score: { type: "integer", minimum: 0, maximum: 5, description: "0 = blank/No aplica/No se ha producido, 1 = Deficiente, 2 = Mejorable, 3 = Nivel esperado, 4 = Destacado, 5 = Excelente" },
          },
          required: ["code", "score"],
          additionalProperties: false,
        },
      },
    },
    required: ["items"],
    additionalProperties: false,
  },
  strict: true,
};

// Extracts { items: [{code,label,score}], sectionAverages: [{section,average}] }
// from the PDF via Claude's native PDF reading. Returns null fields (not 0)
// for items the model didn't report, so a parsing gap is visible rather than
// silently counted as "No aplica" in the average.
export async function extractRubric(pdfBase64) {
  const client = new Anthropic();
  const itemList = ALL_RUBRIC_ITEMS.map((i) => `${i.code} (${i.section}) — ${i.label}`).join("\n");

  const response = await client.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 4000,
    output_config: { effort: "low" },
    tools: [RUBRIC_TOOL],
    tool_choice: { type: "tool", name: "record_rubric_scores" },
    messages: [
      {
        role: "user",
        content: [
          { type: "document", source: { type: "base64", media_type: "application/pdf", data: pdfBase64 } },
          {
            type: "text",
            text: `This is an RFEF CTA "Informe Arbitral General" PDF. It contains several rating tables (one per section, on their own pages) where each row is an item scored via a row of radio-button circles under the columns: "No aplica / No se ha producido", "Deficiente", "Mejorable", "Nivel esperado", "Destacado", "Excelente" — read which circle is filled (●) vs empty (○) for each row.

Report a score for every one of these ${ALL_RUBRIC_ITEMS.length} items, using this code → score mapping: 0 = the "No aplica"/"No se ha producido" column filled or no column filled at all (blank row), 1 = Deficiente, 2 = Mejorable, 3 = Nivel esperado, 4 = Destacado, 5 = Excelente.

Items (code — label):
${itemList}

Call record_rubric_scores with one entry per item code above, in the same order.`,
          },
        ],
      },
    ],
  });

  const toolUse = response.content.find((b) => b.type === "tool_use");
  if (!toolUse) throw new Error("Claude didn't return rubric scores (no tool_use block)");

  const byCode = new Map(toolUse.input.items.map((i) => [i.code, i.score]));
  const items = ALL_RUBRIC_ITEMS.map(({ code, label, section }) => ({ code, label, section, score: byCode.has(code) ? byCode.get(code) : null }));

  const sectionAverages = RUBRIC_SECTIONS.map((s) => {
    const scores = items.filter((i) => i.section === s.name && i.score != null && i.score > 0).map((i) => i.score);
    return { section: s.name, average: scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null };
  });

  return { items, sectionAverages };
}
