// Derives Avui's match context (`ctx`) from the real Google Calendar feed,
// per the README's "Match Calendar System": the RFEF publishes a placeholder
// two weeks out, then updates the same-titled event with the real fixture on
// Thursday (Partit A) or the Monday of match week (Partit 4t).
//
// This is a naming-convention parse of event titles, not a real RFEF
// integration. Per your real calendar naming:
// - "Partit A" — the serious main-referee assignment. Drives full prep mode.
// - "Partit 4t" — the serious fourth-official assignment. Drives focused prep mode.
// - "Partit B" / "Partit C" — lower-stakes training matches. These coexist
//   with rest weeks (you can have a Partit B *and* be in "Setmana de
//   descans" at the same time) — they never change `ctx`, but are tracked
//   separately (`trainingMatches`) so Arbitratge's activity/history isn't
//   blind to them.
// Either serious role's placeholder/confirmed distinction still uses a
// "TBD" marker in the title while pending.

const PARTIT_A_RE = /^partit\s*a\b/i;
const PARTIT_QUART_RE = /^(partit\s*4t\b|4t\s*oficial)/i;
const TRAINING_RE = /^partit\s*[bc]\b/i;

function findFirst(calEvents, re) {
  const matches = (calEvents || []).filter((e) => re.test(e.title || ""));
  return matches.sort((a, b) => a.start.localeCompare(b.start))[0] || null;
}

function parseRole(ev, role) {
  if (!ev) return null;
  return {
    role,
    isTBD: /tbd/i.test(ev.title),
    title: ev.title,
    venue: ev.location || "",
    start: ev.start,
    end: ev.end,
  };
}

// Returns { ctx, partitA, quart, trainingMatches } — ctx is one of
// 'rest' | 'tbd' | 'partitA' | 'quart'.
export function deriveMatchState(calEvents) {
  const partitA = parseRole(findFirst(calEvents, PARTIT_A_RE), "partitA");
  const quart = parseRole(findFirst(calEvents, PARTIT_QUART_RE), "quart");
  const trainingMatches = (calEvents || [])
    .filter((e) => TRAINING_RE.test(e.title || ""))
    .map((e) => ({ title: e.title, venue: e.location || "", start: e.start, end: e.end }));

  let ctx = "rest";
  if (partitA && !partitA.isTBD) ctx = "partitA";
  else if (quart && !quart.isTBD) ctx = "quart";
  else if (partitA || quart) ctx = "tbd";

  return { ctx, partitA, quart, trainingMatches };
}

// True when a role flips from a TBD placeholder to a confirmed fixture
// between two consecutive derivations — used to fire the Thursday moment.
export function detectConfirmation(prevState, nextState) {
  for (const role of ["partitA", "quart"]) {
    const prev = prevState?.[role];
    const next = nextState?.[role];
    if (prev?.isTBD && next && !next.isTBD) return next;
  }
  return null;
}

// Fixture text from a confirmed event title, stripping the role prefix
// ("Partit A - CF Igualada — UE Vilassar" -> "CF Igualada — UE Vilassar",
// "Partit B: FCB - Huesca" -> "FCB - Huesca").
export function fixtureText(title) {
  return (title || "").replace(/^(partit\s*[a-z0-9]*|4t\s*oficial)\s*[-:–]?\s*/i, "").trim() || title;
}

// Human label for the role prefix actually used in the title, so the UI
// doesn't hardcode "Partit A" when the real event might read "Partit A" with
// different casing/spacing.
export function roleLabel(title) {
  const m = (title || "").match(/^(partit\s*[a-z0-9]*|4t\s*oficial)/i);
  return m ? m[0].trim() : title;
}
