// Derives Avui's match context (`ctx`) from the real Google Calendar feed,
// per the README's "Match Calendar System": the RFEF publishes a placeholder
// two weeks out ("Partit A - TBD" / "4t Oficial - TBD"), then updates the
// same-titled event with the real fixture on Thursday (Partit A) or the
// Monday of match week (4t Oficial).
//
// This is a naming-convention parse of event titles, not a real RFEF
// integration — it expects your calendar events to be titled starting with
// "Partit A" or "4t Oficial", optionally followed by "- TBD" while pending
// or "- <opponent>" once confirmed.

function findRoleEvent(calEvents, roleLabel) {
  const matches = (calEvents || []).filter((e) => e.title?.toLowerCase().startsWith(roleLabel.toLowerCase()));
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

// Returns { ctx, partitA, quart } — ctx is one of 'rest' | 'tbd' | 'partitA' | 'quart'.
export function deriveMatchState(calEvents) {
  const partitA = parseRole(findRoleEvent(calEvents, "Partit A"), "partitA");
  const quart = parseRole(findRoleEvent(calEvents, "4t Oficial"), "quart");

  let ctx = "rest";
  if (partitA && !partitA.isTBD) ctx = "partitA";
  else if (quart && !quart.isTBD) ctx = "quart";
  else if (partitA || quart) ctx = "tbd";

  return { ctx, partitA, quart };
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
