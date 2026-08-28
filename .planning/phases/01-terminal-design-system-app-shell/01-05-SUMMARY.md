---
phase: 01-terminal-design-system-app-shell
plan: 05
subsystem: ui
tags: [react, css-modules, nasa-neows, nasa-donki, mock-fixtures]

requires:
  - phase: 01-terminal-design-system-app-shell
    provides: Panel/Alert components, design tokens, NeoWs/DONKI types and fixtures (01-02, 01-03, 01-04)
provides:
  - Populated NEO FEED panel rendering NEO_FIXTURES as place-value-aligned terminal rows
  - Populated SPACE WEATHER panel rendering DONKI fixtures through the Alert grammar
  - Shell composition with both panels mounted in reading order
affects: [phase-4-asteroid-classifier, phase-5-space-weather-panel]

actuals:
  tokens: 3580
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "Panel body content laid out as fixed ch-column CSS grids so numeric columns right-align by place value down the panel, reusing Panel's own ch-based width tiers rather than a fluid table"
    - "Numeric value/unit pairs split into nested spans (nominal color for the digits, dim color for the unit) sharing one font-size, so the character grid stays aligned while still carrying the typography hierarchy rule"
    - "SpaceWeatherPanel composes every AlertContent object from typed DONKI fixture fields at the call site — Alert's formatAlertLine degrade rule (drop the whole qualifier/value clause when either is undefined) is reused verbatim for the empty-cmeAnalyses CME and the null-endTime flare, never reimplemented"

key-files:
  created:
    - src/components/panels/NeoFeedPanel.tsx
    - src/components/panels/NeoFeedPanel.module.css
    - src/components/panels/SpaceWeatherPanel.tsx
    - src/components/panels/SpaceWeatherPanel.module.css
  modified:
    - src/components/shell/DashboardShell.tsx
    - src/components/shell/DashboardShell.module.css

key-decisions:
  - "NEO row picks the soonest close approach by sorting close_approach_data on epoch_date_close_approach rather than trusting array order, since a future real feed entry is not guaranteed to already be chronological — this is the one small piece of derivation the panel does (which approach is 'next'), not a judgement about the object itself"
  - "Hazard hint colouring uses only the reserved --color-alert token on the flagged case and --color-dim on the routine case, with identical text weight/size in both — no red, no icon, no exclamation, per the anti-alarmism requirement"
  - "SpaceWeatherPanel routes flares, CMEs and geomagnetic storms through the same Alert component as notifications (not just notifications), because it is the one component this project uses for the terminal alert grammar and severity token pair, and reusing it end to end is what the plan repeatedly asks for rather than reimplementing formatting per group"
  - "Flare/storm 'exceptional' severity uses only facts already on the source record (flare class letter order A<B<C<M<X, and max Kp per storm) with no NOAA G-scale mapping computed or rendered — that mapping is explicitly SW-03's job in a later phase"
  - "CME qualifier renders the raw analysis speed value (e.g. 'SPEED: 812 KM/S') rather than inventing a categorical intensity label (e.g. MODERATE/FAST), since no such classification is defined by this phase and inventing one would be an unlabelled heuristic the same way a notability tier would be"

patterns-established:
  - "A panel's numeric-table body is a CSS grid with column widths declared in ch on the container, not per-row inline widths, so every row's cells line up under the same grid tracks automatically"

requirements-completed: [CRT-02, CRT-05]

coverage:
  - id: D1
    description: "NeoFeedPanel renders every NEO_FIXTURES object as a row: name, NASA's hazard classification (verbatim, non-alarmist), close-approach date, miss distance (LD), relative velocity (KM/S) and estimated-diameter range (M) — diameter never collapsed to a single value, no notability tier computed"
    requirement: CRT-02
    verification:
      - kind: other
        ref: "npm run lint && npm run build (task 1 automated <verify> block, all grep checks: NEO_FIXTURES, Panel, no dangerouslySetInnerHTML, estimated_diameter, is_potentially_hazardous_asteroid, ch unit present, text-align: right present, no hex colour literal, no keyframes/animation)"
        status: pass
      - kind: other
        ref: "SSR HTML fetched from a production `next start` server: grep confirms 6x 'NASA CLASS'/'HAZARDOUS', 6x diameter ranges (21-47, 11-24, 710-1590, 1340-3020 etc.) with no single-value diameter anywhere"
        status: pass
    human_judgment: true
    rationale: "The plan's own <verify> names a human-check for this deliverable: VT323 legibility of dense numerics and column alignment at real viewing distance is a visual judgment no automated check can make. Deferred to the phase's dev-server human review pass."
  - id: D2
    description: "SpaceWeatherPanel renders notification, flare, and CME/storm groups through Alert, composed from typed fixture fields; the empty-cmeAnalyses CME and the null-endTime flare both degrade cleanly; only the highest flare class and strongest storm carry attention severity; no Kp-to-G-scale mapping"
    requirement: CRT-05
    verification:
      - kind: other
        ref: "npm run lint && npm run build (task 2 automated <verify> block, all grep checks: DONKI_NOTIFICATION_FIXTURES, DONKI_CME_FIXTURES, DONKI_GST_FIXTURES, Alert present, no dangerouslySetInnerHTML, no G[1-5] literal outside comments, no keyframes/animation)"
        status: pass
      - kind: other
        ref: "SSR HTML: 'CME DETECTED' appears with no trailing clause for activityID 2026-11-05T22:48:00-CME-002 (the empty-analyses record) while the other two CMEs show '- SPEED: {n} KM/S'; 'X1.1 PEAK 2026-11-04 21:47Z' (null endTime) has no END clause while 'M2.4 PEAK ... - END: ...' does"
        status: pass
    human_judgment: true
    rationale: "The plan's own <verify> names a human-check: the absent-qualifier degrade as a rendered string and the severity colour distinction are visual judgments. Deferred to the phase's dev-server human review pass."
  - id: D3
    description: "DashboardShell mounts NeoFeedPanel then SpaceWeatherPanel in the panels region, in reading order, replacing the tracer's inline placeholder rows; vertical order (canvas, panels, legend) unchanged; shell remains a server component"
    requirement: null
    verification:
      - kind: other
        ref: "npm run lint && npm run build (task 3 automated <verify> block: NeoFeedPanel and SpaceWeatherPanel present, no 'use client' outside comments, node script confirms NeoFeedPanel renders before SpaceWeatherPanel in source order)"
        status: pass
      - kind: other
        ref: "SSR HTML confirms both 'NEO FEED' and 'SPACE WEATHER' titles present with NEO FEED content preceding SPACE WEATHER content in document order"
        status: pass
    human_judgment: false
---

# Phase 1 Plan 5: Populated NEO FEED and SPACE WEATHER Panels Summary

**Both panels now render real-shaped mock content — a place-value-aligned NEO table with honest diameter ranges and a non-alarmist NASA hazard classification, and a three-group DONKI bulletin feed exercising the Alert grammar's absent-qualifier degrade rule end to end — mounted in the shell in reading order.**

## Performance

- **Duration:** ~35 min (including `npm ci`, required-reading pass, and a production-server SSR verification)
- **Tasks:** 3
- **Files:** 4 created, 2 modified
- **Actuals:** ~3,580 tokens (chars/4 over the realized diff), 3 commits

## Accomplishments
- `NeoFeedPanel` renders all 6 `NEO_FIXTURES` objects as two-line terminal rows inside the default-tier `Panel`: a name + NASA hazard-classification line, then a fixed `ch`-column numeric grid (date, miss distance in LD, velocity in KM/S, estimated-diameter range in M) with numeric values right-aligned and colored nominal, units dimmed. No diameter is ever collapsed to a single figure; no notability tier or risk score is computed.
- `SpaceWeatherPanel` renders three groups — bulletins, flares, and CME/storms — with every bulletin composed from typed DONKI fixture fields and rendered through the existing `Alert` component and its `formatAlertLine` grammar. The empty-`cmeAnalyses[]` CME (`2026-11-05T22:48:00-CME-002`) and the null-`endTime` flare (`2026-11-04-FLR-002`) both exercise the degrade rule and render with no dangling separator or filler value, verified directly in the built SSR output.
- Severity coloring (`nominal`/`attention`) is assigned from facts already on the source records only — flare class letter order (A<B<C<M<X) picks the strongest flare, max Kp per storm picks the strongest storm — with no invented NOAA G-scale mapping anywhere in the file (grep-gated).
- `DashboardShell` now composes `NeoFeedPanel` then `SpaceWeatherPanel` in the panels region, replacing the tracer's three hard-coded placeholder lines; the shell stays a server component.

## Task Commits

Each task was committed atomically:

1. **Task 1: NEO FEED panel — dense numeric rows on the character grid** - `c0275df` (feat)
2. **Task 2: SPACE WEATHER panel — bulletins, flares, storms and CMEs** - `eb44911` (feat)
3. **Task 3: Mount both panels in the shell's panels region** - `0eb0105` (feat)

**Plan metadata:** committed separately after this SUMMARY (see final commit below).

## Files Created/Modified
- `src/components/panels/NeoFeedPanel.tsx` - `NeoFeedPanel`, plus private formatters (`nextCloseApproach`, `formatMissDistance`, `formatVelocity`, `formatDiameterRange`) and a `NumericCell` helper component
- `src/components/panels/NeoFeedPanel.module.css` - two-line row layout, `ch`-column numeric grid, right-aligned numeric columns, nominal/dim color split between values and units
- `src/components/panels/SpaceWeatherPanel.tsx` - `SpaceWeatherPanel`, plus private helpers (`formatIsoLikeTime`, `flareClassRank`, `highestFlareId`, `maxKp`, `strongestStormId`, `primaryAnalysis`)
- `src/components/panels/SpaceWeatherPanel.module.css` - group/sub-label layout, dim label-size sub-labels
- `src/components/shell/DashboardShell.tsx` - mounts both real panels in place of the tracer's placeholder rows
- `src/components/shell/DashboardShell.module.css` - `.panels` region now stacks in a single column with a large-token gap; removed the now-dead `.dataLine` rule

## Decisions Made
- NEO row picks the soonest close approach by sorting on `epoch_date_close_approach` rather than assuming array order — a small, honest piece of derivation (which approach is "next"), not a judgement about the object.
- Hazard flag styling uses only the reserved `--color-alert` token on the flagged case and `--color-dim` on the routine case, at identical size/weight in both states — no red, no icon, no exclamatory copy.
- All three SPACE WEATHER groups (not just notifications) render through `Alert`, reusing its severity prop and grammar formatter end to end rather than reimplementing formatting per group.
- "Exceptional" severity for flares/storms is derived only from facts already on the record (flare class letter, max Kp) — no NOAA G-scale mapping, which is explicitly out of this phase's scope (SW-03, later phase).
- CME qualifier shows the raw analysis speed value rather than an invented categorical intensity label, since no such classification is defined by this phase.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing critical functionality] `.panels` region lacked `flex-direction: column` and a gap**
- **Found during:** Task 3, after mounting two panels
- **Issue:** `DashboardShell.module.css`'s `.panels` rule was `display: flex; justify-content: center` with no `flex-direction`, which defaults to `row` — mounting two panels would have rendered them side by side instead of the single-column stack the task explicitly requires ("keep the panels in a single column so the layout order is identical at every width").
- **Fix:** Added `flex-direction: column`, `align-items: center`, and `gap: var(--space-lg)` (the "gap between stacked panels" token per the UI-SPEC Spacing Scale).
- **Files modified:** `src/components/shell/DashboardShell.module.css`
- **Verification:** `npm run lint && npm run build` both pass; SSR output confirms NEO FEED content precedes SPACE WEATHER content in document order.
- **Committed in:** `0eb0105` (part of Task 3 commit — caught and fixed before commit)

**2. [Rule 1 - Bug/cleanup] Removed the now-dead `.dataLine` CSS rule**
- **Found during:** Task 3, after removing the tracer's inline placeholder `<p className={styles.dataLine}>` rows
- **Issue:** The tracer's placeholder rows were the only consumer of `.dataLine`; leaving the rule in place after removing its last usage would be dead CSS.
- **Fix:** Deleted the unused `.dataLine` rule from `DashboardShell.module.css`.
- **Files modified:** `src/components/shell/DashboardShell.module.css`
- **Verification:** Confirmed via grep that no remaining source file references `dataLine`.
- **Committed in:** `0eb0105` (part of Task 3 commit)

---

**Total deviations:** 2 auto-fixed (1 missing-functionality fix, 1 dead-code cleanup)
**Impact on plan:** No scope creep — both are direct, necessary consequences of Task 3's own stated requirement ("single column ... identical at every width") and its removal instruction.

## Issues Encountered
None.

## User Setup Required
None — no external service configuration required.

## Verification Performed
- `npm run lint` — clean (0 warnings/errors) at every task boundary.
- `npm run build` — succeeds (Turbopack production build, TypeScript check, static prerender) at every task boundary.
- All automated `<verify>` grep/node checks for all three tasks, run exactly as written in `01-05-PLAN.md`, pass.
- Built the app (`next build`) and served it with `next start` on a scratch port; fetched the SSR HTML directly with `curl` and grepped it to confirm: both panel titles render with content; all 6 NEO diameter ranges render as genuine min-max pairs (e.g. `21-47`, `1340-3020`), never a single number; the empty-analyses CME renders `CME DETECTED` with no trailing clause while the two CMEs with analyses show `- SPEED: {n} KM/S`; the null-endTime flare (`X1.1 PEAK ...`) has no `END:` clause while the completed flare (`M2.4 PEAK ...`) does.
- **Not performed (deferred to human review, as the plan's own `<verify>` specifies):** the two `<human-check>` items — VT323 legibility/column-alignment at real viewing distance and phone width, and a full visual read of every bulletin including the severity colour distinction. These require an interactive dev-server session and eyes on a rendered screen, not something this automated pass can substitute for.

## Known Stubs
None. All rendered content is real fixture data flowing through the actual formatters and the actual `Alert`/`Panel` components — no hardcoded empty values, no placeholder copy.

## Next Phase Readiness
- The phase's stated end state — "the project looks like the finished project with mock content inside it" — is now true: both primary panels are populated with realistic-density data.
- The character-grid, overflow-scroll, and Alert-degrade mechanisms this phase set out to exercise against real content have all been exercised and are confirmed working in the built SSR output.
- The VT323 legibility judgment (whether 20px dense numerics need the Departure Mono fallback pulled forward) is still open and explicitly deferred to the human-check pass — flagged here for whoever performs that review.
- No blockers.

## Self-Check: PASSED

- FOUND: src/components/panels/NeoFeedPanel.tsx
- FOUND: src/components/panels/NeoFeedPanel.module.css
- FOUND: src/components/panels/SpaceWeatherPanel.tsx
- FOUND: src/components/panels/SpaceWeatherPanel.module.css
- FOUND: src/components/shell/DashboardShell.tsx (modified)
- FOUND: src/components/shell/DashboardShell.module.css (modified)
- FOUND commit: c0275df
- FOUND commit: eb44911
- FOUND commit: 0eb0105

---
*Phase: 01-terminal-design-system-app-shell*
*Completed: 2026-08-28*
