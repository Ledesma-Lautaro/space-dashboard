---
phase: 01-terminal-design-system-app-shell
plan: 04
subsystem: ui
tags: [typescript, nasa-neows, nasa-donki, mock-fixtures, react, css-modules]

requires:
  - phase: 01-terminal-design-system-app-shell
    provides: design tokens (--color-nominal, --color-alert, --space-*, --glow-radius-*) and the Panel component pattern (01-02, 01-03)
provides:
  - Typed NeoWs and DONKI payload shapes (src/types/) that mirror verified NASA field names
  - Realistic-density mock fixtures declared against those types
  - The standalone Alert component and its pure formatAlertLine grammar formatter
affects: [phase-3-data-fetching, phase-4-asteroid-classifier, phase-5-space-weather-panel]

actuals:
  tokens: 6664
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "Payload types under src/types/ mirror the real NASA wire format exactly, including string-typed numerics (velocity/miss-distance) and nullable fields (flare endTime/activeRegionNum) — future fetch layers import these verbatim"
    - "Fixture constants under src/lib/fixtures/ carry explicit type annotations against the payload types, so a shape drift is a compile error, not a runtime surprise"
    - "Alert is a standalone component (not a Panel modifier): a pure formatAlertLine(content) formatter plus a thin rendering component that takes a nullable content prop and returns null when there is nothing to show"

key-files:
  created:
    - src/types/neows.ts
    - src/types/donki.ts
    - src/lib/fixtures/neoFixtures.ts
    - src/lib/fixtures/donkiFixtures.ts
    - src/components/ui/Alert.tsx
    - src/components/ui/Alert.module.css
  modified: []

key-decisions:
  - "Alert takes a nullable content: AlertContent | null | undefined prop (subject/state/qualifier?/value?) rather than individual required props, so 'renders nothing when there is no bulletin' is expressible directly by the caller passing null/undefined, and formatAlertLine stays a pure function of one well-typed object"
  - "NeoObject.orbital_data is typed as optional — the real feed list entries carry a thinner record than the single-object lookup does; the type makes that distinction explicit rather than assuming full orbital data is always present"

patterns-established:
  - "Pure grammar formatter (formatAlertLine) separated from the rendering component (Alert), so the degrade-rule logic is independently reviewable and reusable without a DOM"
  - "Header comments on fixture modules stating they are reused by later data-fetching phases to exercise error/empty states, so they are not deleted once real fetching exists"

requirements-completed: [CRT-05]

coverage:
  - id: D1
    description: "NeoWs and DONKI payload types (NeoObject, NeoCloseApproach, NeoDiameterRange, NeoFeedResponse, DonkiNotification, DonkiFlare, DonkiCme, DonkiCmeAnalysis, DonkiGeomagneticStorm) mirroring the verified NASA field reference, no `any`, nullable/possibly-empty fields modeled explicitly"
    verification:
      - kind: other
        ref: "npm run lint && npm run build (task 1 automated <verify> block, all grep/AST checks)"
        status: pass
      - kind: other
        ref: "manual shape-drift test: removed NeoObject.id from a fixture record, npm run build failed with TS2741, field restored, build passed again"
        status: pass
    human_judgment: false
  - id: D2
    description: "Realistic-density NEO_FIXTURES (6 objects, 8 close approaches) and DONKI fixtures (notifications, flares incl. one in-progress, CMEs incl. one with empty cmeAnalyses[], geomagnetic storms) typed against the payload shapes"
    requirement: null
    verification:
      - kind: other
        ref: "npm run lint && npm run build (task 2 automated <verify> block, all grep/node checks)"
        status: pass
    human_judgment: true
    rationale: "The plan's own <verify> names a human-check for this deliverable: VT323 legibility of dense numerics at real viewing distance is a visual judgment no automated check can make, deferred until 01-05 renders these fixtures in a Panel."
  - id: D3
    description: "Alert component and formatAlertLine: fixed CRT-05 grammar, qualifier/value degrade rule (drops the whole clause, never a filler token), nominal/attention severity via --color-nominal/--color-alert, free text wrapping, renders null when content is absent, no dangerouslySetInnerHTML"
    requirement: CRT-05
    verification:
      - kind: other
        ref: "npm run lint && npm run build (task 3 automated <verify> block, all grep checks incl. no dangerouslySetInnerHTML, no colour literal, no text-overflow, pre-wrap/break-word present)"
        status: pass
    human_judgment: true
    rationale: "The plan's own <verify> names a human-check for this deliverable: the degrade rule's correctness as a rendered string and the severity colour distinction are visual judgments no automated check can make. Alert is not yet wired into any page (out of this plan's files_modified scope), so the rendered human-check itself is deferred to whichever later plan mounts it."

duration: ~30min
completed: 2026-08-28
status: complete
---

# Phase 1 Plan 4: NeoWs/DONKI Types, Realistic Fixtures, Alert Component Summary

**Typed NeoWs/DONKI payload shapes mirroring verified NASA field names, six realistic-density NEO fixtures plus four DONKI fixture collections (including the empty-`cmeAnalyses[]` degrade case), and a standalone `Alert` component with a pure `formatAlertLine` grammar formatter implementing CRT-05's fixed terminal bulletin format.**

## Performance

- **Duration:** ~30 min
- **Started:** 2026-08-28T13:05:00-03:00 (approximate — `npm ci` plus required-reading pass preceded the first commit)
- **Completed:** 2026-08-28T13:37:00-03:00
- **Tasks:** 3
- **Files modified:** 6 (all new)

## Accomplishments
- `src/types/neows.ts` and `src/types/donki.ts` model the real NeoWs/DONKI wire shapes verbatim (per `research/FEATURES.md` §0.1/§0.4), including the awkward parts: string-typed velocity/distance fields, a nullable flare `endTime`/`activeRegionNum`, a possibly-empty `cmeAnalyses[]`, and diameter kept as a min-max range with no single-value shortcut.
- `NEO_FIXTURES` (6 objects, 8 close approaches, mixed hazardous flags, magnitudes 16.2-24.8, diameters 11m-3.02km, miss distances 0.19-58.3 lunar distances) and four DONKI fixture collections give the terminal typeface real numeric density to be judged against, and give Phase 3 real error/empty-state exercise material.
- `Alert` renders the fixed CRT-05 grammar via a pure `formatAlertLine` formatter, degrades cleanly by dropping the entire qualifier/value clause when either is missing, resolves severity to the reserved `--color-nominal`/`--color-alert` token families (D-13), wraps text freely instead of truncating, and returns `null` rather than an empty shell when given no content.

## Task Commits

Each task was committed atomically:

1. **Task 1: Payload types shaped like the real NeoWs and DONKI responses** - `3e0189a` (feat)
2. **Task 2: Realistic-density fixtures declared against those types** - `833d6e7` (feat)
3. **Task 3: Alert component and the fixed terminal grammar** - `d464cac` (feat)

**Plan metadata:** committed separately after this SUMMARY (see final commit below).

## Files Created/Modified
- `src/types/neows.ts` - `NeoObject`, `NeoCloseApproach`, `NeoDiameterRange`, `NeoFeedResponse`, plus supporting sub-types (`NeoDiameterBounds`, `NeoRelativeVelocity`, `NeoMissDistance`, `NeoOrbitClass`, `NeoOrbitalData`)
- `src/types/donki.ts` - `DonkiNotification`, `DonkiFlare`, `DonkiCme`, `DonkiCmeAnalysis`, `DonkiGeomagneticStorm`, `DonkiKpIndexEntry`
- `src/lib/fixtures/neoFixtures.ts` - `NEO_FIXTURES`, 6 realistic near-earth objects
- `src/lib/fixtures/donkiFixtures.ts` - `DONKI_NOTIFICATION_FIXTURES`, `DONKI_FLR_FIXTURES`, `DONKI_CME_FIXTURES`, `DONKI_GST_FIXTURES`
- `src/components/ui/Alert.tsx` - `Alert`, `formatAlertLine`, `AlertContent`, `AlertProps`, `AlertSeverity`
- `src/components/ui/Alert.module.css` - scoped Alert styles (left accent border, phosphor glow, free wrap, no truncation)

## Decisions Made
- `Alert` takes a nullable `content: AlertContent | null | undefined` prop instead of individually-required subject/state props, so "renders nothing when there is no bulletin" is expressible directly by the caller (`<Alert content={maybeRecord} />`) and `formatAlertLine` stays a pure function of one typed object, independently testable/reviewable without touching the component.
- `NeoObject.orbital_data` is typed as optional rather than required: real NeoWs feed-list entries carry a thinner record than the single-object `/neo/{id}` lookup does on the live API, and the type makes that distinction explicit so a future consumer must handle its absence rather than assuming full orbital elements are always present.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed the literal string "UNKNOWN" from an Alert.tsx doc comment**
- **Found during:** Task 3 automated `<verify>` run
- **Issue:** A JSDoc comment illustrating the anti-example (`>> CME DETECTED - INTENSITY: UNKNOWN`) contained the literal token the plan's own automated verify script (`! grep -rq "UNKNOWN" src/components/ui/Alert.tsx`) checks is absent from the file — the comment's intent (explain what NOT to emit) collided with the check's literal string match.
- **Fix:** Rephrased the comment to describe the anti-pattern without spelling out the forbidden literal ("no filler or placeholder token stands in for a missing value").
- **Files modified:** `src/components/ui/Alert.tsx`
- **Verification:** Re-ran the task's full automated `<verify>` grep chain; all checks pass.
- **Committed in:** `d464cac` (part of Task 3 commit — caught before commit, not a follow-up fix)

---

**Total deviations:** 1 auto-fixed (1 bug — self-caught by the plan's own verify script before commit)
**Impact on plan:** No scope creep; a doc-comment wording adjustment only, code behavior unchanged.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- `src/types/neows.ts` and `src/types/donki.ts` are ready for Phase 3's fetch layer to import verbatim.
- `NEO_FIXTURES` and the four DONKI fixture collections are ready for Phase 3 to drive its loading/error/rate-limited/empty states, and for Phase 4/5 to render inside `Panel`/`Alert`.
- `Alert` is not yet mounted anywhere in the page (out of this plan's `files_modified` scope) — the plan's own human-check for rendered grammar/severity is deferred to whichever later plan (01-05 or Phase 4/5) first drops fixtures into `Panel` and `Alert`.
- No blockers.

## Self-Check: PASSED

- FOUND: src/types/neows.ts
- FOUND: src/types/donki.ts
- FOUND: src/lib/fixtures/neoFixtures.ts
- FOUND: src/lib/fixtures/donkiFixtures.ts
- FOUND: src/components/ui/Alert.tsx
- FOUND: src/components/ui/Alert.module.css
- FOUND commit: 3e0189a
- FOUND commit: 833d6e7
- FOUND commit: d464cac

---
*Phase: 01-terminal-design-system-app-shell*
*Completed: 2026-08-28*
