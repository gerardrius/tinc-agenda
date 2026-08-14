# CLAUDE.md — Tinc Agenda

## What is this
Personal operating system / performance tracker for a professional football referee (1ª RFEF, 4th official in 2ª/1ª División). Built with Vite + React, deployed as a PWA on Vercel. All UI in Catalan.

## Who the user is
- 26yo referee, goal: promotion to 2ª División as a professional
- Works 4-day weeks at Desigual (Tableau specialist, data background)
- Side projects: DatoInmo (real estate data consultancy)
- Cognitive + physical training regime for refereeing
- Has a screen time control protocol (6 daily habits)

## App sections
- **Avui (Today)**: daily focus, calendar sync, habit checklist, contribution grid (12-week GitHub-style), reminders, reflection
- **Arbitratge (Refereeing)**: match logging (with triple self-assessment: global/positioning/communication), 4-week training planner (laws of the game, videotests, criteria, physical, video analysis, cognitive), physical training log, cognitive training log, video analysis sessions, career notes
- **Feina (Work)**: persistent work reminders + daily task tracking for 3 areas (Desigual, DatoInmo, Centres benestar)
- **Vida (Life)**: emotional state tracker (5 mood levels + 12 feelings like Apple Health), social life logging, screen time (iPhone + Mac fields), sleep tracking
- **Agenda (Calendar)**: Google Calendar sync with 3-level event prioritization (critical/important/normal), visual sorting

## Tech stack
- Vite + React 18 (single App.jsx, no router)
- vite-plugin-pwa for installability and offline
- localStorage for persistence (storage layer abstracted at top of App.jsx for easy swap to Supabase)
- Google Calendar API (optional, via VITE_GCAL_API_KEY env var)
- No component library — all custom, inline styles object (const S)
- Dark theme (#0d0f11 bg, #4ade80 accent)

## Architecture decisions
- Everything in one App.jsx — intentionally monolithic for now. Split into components/files when it gets unwieldy.
- State: single `day` object (today's data) + `allData` (all days keyed by YYYY-MM-DD) + `global` (persistent cross-day data like training plan and work reminders). Stored together under one localStorage key.
- Tab navigation with sub-tabs (ref has 6 sub-sections, life has 4 sub-tabs)
- The storage layer (storage.get/storage.set at top of file) is the single point to swap for Supabase/Firebase later.

## Code conventions
- All UI text in Catalan (ca-ES locale for dates)
- Compact component style — small reusable components (Card, Lbl, Inp, Chips, RPE, Rating, Mini)
- uid() for unique IDs, todayKey() for date keys
- Colors: green #4ade80 (primary/habits), blue #60a5fa (work/physical), purple #a78bfa (cognitive/centres), amber #f59e0b (matches/career/important), red #ef4444 (alerts/critical)

## Commands
```bash
npm run dev      # local dev server
npm run build    # production build → dist/
npm run preview  # preview production build
```

## Deployment
Vercel, auto-deploy from main branch. PWA manifest configured in vite.config.js.

## Next priorities (roadmap)
1. Split App.jsx into separate component files by section
2. Add Supabase backend for cross-device sync
3. Add data export (JSON/CSV) for analysis
4. Mood/habit trend charts (weekly/monthly view with recharts or d3)
5. Notifications/reminders via service worker
6. Proper app icons (replace placeholder PNGs)
7. Historical view — browse past days
8. Training plan templates (save and reuse 4-week blocks)
9. Match statistics aggregation (avg rating over season, common errors)
10. Dark/light theme toggle