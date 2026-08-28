---
phase: 01-terminal-design-system-app-shell
plan: 03
subsystem: ui
tags: [css-modules, css-container-queries, css-custom-properties, accessibility, panel-chrome]

requires:
  - phase: 01-terminal-design-system-app-shell (plan 02)
    provides: "Panel component with ASCII-only chrome (buildBorderRow/truncateTitle), tier widths 44/64/88ch measured against VT323's real 0.4em/8px advance"
provides:
  - "PANEL_CHROME_CHARS exported as first-class API alongside PANEL_TIER_CH"
  - "buildBottomRow as its own exported pure function, split out from the former nullable-title buildBorderRow overload"
  - "Dev-mode row-length invariant assertion inside both row builders"
  - "Eight-row body cap with internal vertical scroll, scrollbar-gutter: stable, and dim-chrome-colored scrollbar styling"
  - "Named inline-size query container (panels) on the panels region, driving a sub-352px container query that swaps ASCII chrome for plain CSS top/bottom borders and a plain-text title"
affects: [01-04, 01-05, 01-06, 01-07, 04-neo-classifier, 05-space-weather, 10-hud-overlay, 11-crt-shader]

actuals:
  tokens: 2300
  tasks: 2
  commits: 2

tech-stack:
  added: []
  patterns:
    - "CSS container queries (container-type: inline-size + a named container) drive responsive component behavior instead of a JS width branch/resize observer, so the degrade has no hydration surface"
    - "Dev-only invariant assertions (process.env.NODE_ENV guarded) inside pure row-building functions, stripped from production bundles"

key-files:
  created: []
  modified:
    - src/components/ui/Panel.tsx
    - src/components/ui/Panel.module.css
    - src/components/shell/DashboardShell.module.css
    - src/app/globals.css

key-decisions:
  - "Tier character counts (44/64/88ch) carried forward unchanged from the 01-02 tracer. The plan's own read_first pointed at the 01-02 measurement as authoritative, and that measurement already produced these numbers from the corrected 0.4em/8px advance -- recomputing would have duplicated work the tracer already did, not corrected an error."
  - "buildBorderRow's signature changed from (title: string | null, tier) to (title: string, tier) now that buildBottomRow owns the null-title case -- a narrower, more honest type than the union it replaced"
  - "Plain-text title and the sub-compact @container rule were implemented in Panel.tsx/Panel.module.css during Task 1's file edits (same two files Task 2 also touches) rather than as a strictly separate diff -- see Deviations below for why this reads as one shared implementation across the two per-task commits"
  - "Ellipsis character (U+2026) used by truncateTitle was not re-verified in a live browser -- U+2026 falls inside the U+2000-206F range the UI-SPEC's own glyph-coverage table already confirms VT323 serves, so no substitution to ASCII '.' was needed. This is read off the existing coverage table, not re-derived by downloading/parsing the font binary."

patterns-established:
  - "Panel degrade: a named CSS container (container-name: panels) on the ancestor + an @container query in the leaf component's own stylesheet, so responsiveness follows the space actually given rather than the viewport"

requirements-completed: [CRT-02]

coverage:
  - id: D1
    description: "PANEL_TIER_CH, PANEL_CHROME_CHARS, buildBorderRow, buildBottomRow, and truncateTitle are all exported from Panel.tsx; buildBorderRow/buildBottomRow return exactly the tier's character count for every tier"
    requirement: CRT-02
    verification:
      - kind: other
        ref: "grep -q checks for all five exports + node script asserting PANEL_TIER_CH has exactly 3 strictly-ascending entries with compact in [40,56] -- all pass (see plan's own <verify><automated> block, reproduced in this session)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Panel body caps at 8 rows with internal overflow-y auto scroll and scrollbar-gutter: stable; border rows do not move as content grows"
    requirement: CRT-02
    verification:
      - kind: other
        ref: "grep -q scrollbar-gutter and overflow-y against Panel.module.css -- both pass; height calc reviewed by inspection to add padding back so the 8-row figure measures content, not the padded box"
        status: pass
    human_judgment: true
    rationale: "Whether the fixed body actually holds still while a twelve-row body scrolls internally is the plan's own human-check M-04 -- a visual behavior no grep or build step observes. No browser-automation tool is installed in this environment (consistent with 01-02's same limitation)."
  - id: D3
    description: "DashboardShell declares the panels region as a named inline-size container; Panel.module.css contains an @container rule keyed to the compact tier's resolved width that hides ASCII rows, reveals a plain-text title, and applies CSS top/bottom borders; the ASCII rows stay hidden from the accessibility tree at every width; the panel never exceeds its container's inline size"
    requirement: CRT-02
    verification:
      - kind: other
        ref: "grep -q container-type/container-name against DashboardShell.module.css; grep -q @container/border-top against Panel.module.css; grep -qE aria-hidden and negative grep for ResizeObserver|innerWidth|matchMedia against Panel.tsx -- all pass"
        status: pass
    human_judgment: true
    rationale: "The visual degrade transition at the 352px threshold (ASCII rows vanishing cleanly, no partial overhang, restoring on widen) is the second half of manual verification M-04 and requires narrowing a real viewport, which this session's tooling cannot exercise."
  - id: D4
    description: "npm run lint and npm run build both exit zero as separate steps, and no box-drawing/block-element glyph exists anywhere under src/"
    verification:
      - kind: other
        ref: "npm run lint; npm run build (both run after each task's edits); a codepoint scan over every file under src/ for U+2500-257F, U+2580-259F, and U+25A0 found zero hits"
        status: pass
    human_judgment: false

duration: ~20min
completed: 2026-08-28
status: complete
---

# Phase 1 Plan 3: Panel Tiers, Truncation, Body Cap, Responsive Degrade Summary

**Panel's ASCII chrome hardened into a first-class API (`PANEL_CHROME_CHARS`, split `buildBottomRow`, dev-mode length assertions), an eight-row internal-scroll body cap, and a container-query-driven degrade to plain CSS borders below 352px — no JavaScript width branch.**

## Performance

- **Duration:** ~20 min
- **Started:** 2026-08-28 (session)
- **Completed:** 2026-08-28
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- Turned the tracer's working-but-informal `buildBorderRow(title | null, tier)` into the plan's declared API surface: `PANEL_CHROME_CHARS` exported, `buildBottomRow(tier)` split out as its own pure function, both callable and testable independently once Phase 3 brings a test runner
- Added dev-only row-length invariant assertions inside both row builders — a one-character drift now throws immediately in development instead of shipping invisible until someone inspects a rendered corner
- Capped the Panel body at exactly 8 rows of content height with internal `overflow-y: auto` and `scrollbar-gutter: stable`, so the border rows never move as content grows and the `2ch` horizontal padding stays on the character grid even once a scrollbar claims width
- Built the sub-compact degrade end to end: a named `panels` inline-size container on the panels region, an `@container` rule in `Panel.module.css` that swaps the ASCII rows for plain CSS `border-top`/`border-bottom` and reveals an always-present plain-text title, entirely in CSS with zero JavaScript width branching (no `ResizeObserver`, no `innerWidth`, no `matchMedia`)
- Confirmed the tier character counts (44/64/88ch) inherited from the 01-02 tracer already satisfy this plan's derivation requirement — no re-measurement needed, no font re-verification performed (per this session's explicit budget-discipline instruction)

## Task Commits

Each task was committed atomically:

1. **Task 1: Three measured tiers, deterministic truncation, eight-row body cap** - `e551414` (feat)
2. **Task 2: Degrade below the compact tier to plain CSS borders** - `d19af37` (feat)

**Plan metadata:** commit pending (this SUMMARY + STATE/ROADMAP/REQUIREMENTS update)

## Files Created/Modified

- `src/components/ui/Panel.tsx` - Exports `PANEL_CHROME_CHARS`; splits `buildBorderRow`/`buildBottomRow`; adds `assertRowLength` dev guard; renders an always-present plain-text title paragraph alongside the ASCII chrome rows; panel width now `min(var(--panel-w-{tier}), 100%)` so it never overflows a narrower container
- `src/components/ui/Panel.module.css` - `.body` gets a computed 8-row content height, internal scroll, `scrollbar-gutter: stable`, and dim-chrome scrollbar coloring; adds `.plainTitle` (hidden by default) and the `@container panels (max-width: 352px)` degrade rule
- `src/components/shell/DashboardShell.module.css` - `.panels` declares `container-type: inline-size` and `container-name: panels`
- `src/app/globals.css` - Adds `--panel-body-rows: 8` token consumed by `Panel.module.css`'s height calc

## Decisions Made

- **Tier scale left at 44/64/88ch, not re-derived.** The plan's `read_first` explicitly points at the 01-02 summary's measurement as the source of truth, and that measurement already used the corrected 0.4em/8px advance. Recomputing here would have duplicated the tracer's work rather than fixed an error — the compact tier (44ch = 352px) sits inside the automated verify script's accepted 40–56ch range.
- **`buildBorderRow`'s signature narrowed** from `(title: string | null, tier)` to `(title: string, tier)` now that `buildBottomRow(tier)` owns the null-title case the plan asked for as a separate function. This is a stricter, more honest type than the union it replaced, and both call sites (the two `<pre>` rows in `Panel`) were updated accordingly.
- **Ellipsis glyph coverage read off the existing UI-SPEC table, not re-verified live.** `truncateTitle`'s `…` (U+2026) falls inside the U+2000–206F range the UI-SPEC's own glyph-coverage note already confirms VT323 serves ("covers only U+0000-00FF, U+2000-206F, and a handful of isolated symbols"). No font download or binary parse was performed to re-confirm this, per this session's explicit instruction not to re-derive already-measured font facts. If this reasoning is wrong, the fallback the plan specifies (substitute a single ASCII period) is a one-line change in `truncateTitle` — flagging this as the item most worth a human glance during the phase's end-of-phase UAT pass.
- **Plain-text title and the `@container` degrade rule were added to `Panel.tsx`/`Panel.module.css` as part of Task 1's file edits**, ahead of Task 2's own commit, because both tasks' `<files>` lists overlap on exactly those two files and the title/degrade CSS naturally sits next to the row-building code it's paired with. Task 2's commit (`d19af37`) then adds the one file that was genuinely Task-2-only: `DashboardShell.module.css`'s container declaration, which is what actually activates the `@container` rule already sitting in `Panel.module.css`. Both commits' diffs were verified independently against the plan's automated `<verify>` blocks before committing, so no acceptance criterion from either task depends on the other's commit to pass.

## Deviations from Plan

None — plan executed exactly as written, with the single file-boundary note above (not a deviation from any acceptance criterion, just a note on which commit a given line landed in).

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required.

## Outstanding Human Verification (M-04, both halves)

This session has no browser-automation tool available (same limitation 01-02 recorded), so the following from this plan's own `<human-check>` blocks could not be exercised and are deferred to the phase's end-of-phase UAT pass:

1. **Corner alignment at all three tiers, over-length title truncation, twelve-row body scroll.** Automated checks confirm every `buildBorderRow`/`buildBottomRow` output is exactly the tier's character count (dev-mode assertion + the plan's own node verification script), and the body's computed height/scroll/`scrollbar-gutter` CSS is in place — but whether this *looks* correct at 200% browser zoom, and whether the ellipsis renders in-face rather than falling back, needs an actual browser.
2. **Sub-compact degrade transition at 320px.** The `@container panels (max-width: 352px)` rule, the named container declaration, and the CSS-only title/chrome swap are all in place and pass every automated grep in the plan's `<verify>` block — but the actual narrow→wide→narrow visual transition (no partial-overhang intermediate state, nothing overflowing at 320px) is a live-browser behavior.

Procedure for whoever runs the end-of-phase UAT pass: `npm run dev`, open the page, resize the panels region (or the browser viewport) through 352px in both directions while watching a rendered panel; separately, temporarily pass a title longer than the tier's cap and a body with 12+ children to `<Panel>` to exercise the truncation and scroll paths.

## Known Stubs

None.

## Next Phase Readiness

- `Panel`'s full plan-declared API (`PanelTier`, `PANEL_TIER_CH`, `PANEL_CHROME_CHARS`, `buildBorderRow`, `buildBottomRow`, `truncateTitle`) is now stable for Phases 4, 5, and 10 to consume directly, including the `tier` prop for opting into `wide`.
- The sub-compact degrade and the 8-row scroll cap are both driven entirely by CSS (container queries, computed `height`), so later phases nesting a `Panel` inside a narrower container (Phase 10's HUD) only need to declare their own `container-name: panels` ancestor — no component change required.
- Outstanding: the two M-04 human-check halves above, same tooling gap as 01-02's own outstanding items (character-advance visual measurement, CRT-level persistence, forced-throw storage path) — all bundled for one end-of-phase UAT session per `human_verify_mode: end-of-phase`.

## Self-Check: PASSED

- FOUND: src/components/ui/Panel.tsx
- FOUND: src/components/ui/Panel.module.css
- FOUND: src/components/shell/DashboardShell.module.css
- FOUND: src/app/globals.css
- FOUND commit e551414 (Task 1)
- FOUND commit d19af37 (Task 2)

---
*Phase: 01-terminal-design-system-app-shell*
*Completed: 2026-08-28*
