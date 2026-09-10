// RFEF CTA rubric: 6 sections, each item scored via a filled/unfilled radio
// button in the PDF's rating tables — a vector graphic, not text (confirmed
// by inspecting the PDF's content streams: only Helvetica text objects, no
// icon font), so no text-extraction approach can read it. This reads the
// PDF's actual drawing operations instead of guessing visually: an unfilled
// circle is drawn as [white fill, gray stroke] (same bounding box, ~12pt);
// a filled one adds a third, smaller (~6pt) black-filled dot on top. That
// pattern is 100% deterministic — verified against a manually-read sample
// report, every one of 47 items matched exactly, including one a Claude
// PDF-vision pass had misread — so this needs no LLM call at all.
import "./_pdf-polyfills.js";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";

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

const RING_MIN = 10, RING_MAX = 16; // pt — the outer (always-drawn) circle
const DOT_MIN = 2, DOT_MAX = 10; // pt — the inner mark, only on a selected column

// Every ring/dot constructPath call on a page, in document (paint) order,
// with its bounding-box width and the fill color active at draw time.
async function pageShapes(page) {
  const opList = await page.getOperatorList();
  let fillColor = null;
  const shapes = [];
  for (let i = 0; i < opList.fnArray.length; i++) {
    if (opList.fnArray[i] === pdfjsLib.OPS.setFillRGBColor) fillColor = opList.argsArray[i][0];
    if (opList.fnArray[i] === pdfjsLib.OPS.constructPath) {
      const mm = opList.argsArray[i][2];
      if (mm) shapes.push({ w: mm[2] - mm[0], fill: fillColor });
    }
  }
  return shapes;
}

// Walks a page's shape stream and returns one boolean per rubric column
// encountered (true = that circle is the filled/selected one).
function columnsFromShapes(shapes) {
  const cols = [];
  let i = 0;
  while (i < shapes.length) {
    if (shapes[i].fill === "#ffffff" && shapes[i].w > RING_MIN && shapes[i].w < RING_MAX) {
      let j = i + 1;
      if (j < shapes.length && shapes[j].w > RING_MIN && shapes[j].w < RING_MAX) j++; // ring stroke
      let selected = false;
      if (j < shapes.length && shapes[j].fill === "#000000" && shapes[j].w > DOT_MIN && shapes[j].w < DOT_MAX) { selected = true; j++; }
      cols.push(selected);
      i = j;
    } else i++;
  }
  return cols;
}

// Extracts { items: [{code,label,section,score}], sectionAverages }. Scores
// come out in document order and are zipped 1:1 against ALL_RUBRIC_ITEMS —
// validated exact-match against a manually-read report, but if the document
// doesn't contain exactly 6 circles per row for all 47 items (a differently
// formatted report), this throws rather than silently misaligning items.
export async function extractRubric(pdfBase64) {
  const buffer = Buffer.from(pdfBase64, "base64");
  const doc = await pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise;

  let allCols = [];
  for (let p = 1; p <= doc.numPages; p++) {
    const shapes = await pageShapes(await doc.getPage(p));
    allCols = allCols.concat(columnsFromShapes(shapes));
  }

  if (allCols.length !== ALL_RUBRIC_ITEMS.length * 6) {
    throw new Error(`Expected ${ALL_RUBRIC_ITEMS.length * 6} rubric radio circles, found ${allCols.length} — report layout may differ from the expected template.`);
  }

  const items = ALL_RUBRIC_ITEMS.map(({ code, label, section }, rowIdx) => {
    const row = allCols.slice(rowIdx * 6, rowIdx * 6 + 6);
    const selectedIdx = row.reduce((acc, v, k) => (v ? [...acc, k] : acc), []);
    if (selectedIdx.length > 1) throw new Error(`Item ${code}: more than one column marked (${selectedIdx.join(",")})`);
    return { code, label, section, score: selectedIdx.length ? selectedIdx[0] : 0 };
  });

  const sectionAverages = RUBRIC_SECTIONS.map((s) => {
    const scores = items.filter((i) => i.section === s.name && i.score > 0).map((i) => i.score);
    return { section: s.name, average: scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null };
  });

  return { items, sectionAverages };
}
