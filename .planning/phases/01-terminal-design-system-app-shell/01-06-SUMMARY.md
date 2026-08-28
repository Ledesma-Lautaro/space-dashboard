---
phase: 01-terminal-design-system-app-shell
plan: 06
subsystem: ui
tags: [design-system, legend, crt-control, accessibility]

requires:
  - phase: 01-terminal-design-system-app-shell (plan 03)
    provides: "Panel component with default tier (64ch), buildBorderRow/buildBottomRow ASCII chrome"
  - phase: 01-terminal-design-system-app-shell (plan 02)
    provides: "CrtControl component cycling FULL/REDUCED/OFF, driving --crt-intensity, sessionStorage persistence with in-memory fallback"
provides:
  - "Legend component (src/components/ui/Legend.tsx) rendering the two-entry colour semantics plus brightness note inside shared Panel chrome"
  - "CrtControl relocated inside Legend — no longer rendered directly by DashboardShell"
affects: [01-07, 04-neo-classifier, 05-space-weather]

actuals:
  tokens: 1200
  tasks: 2
  commits: 2

tech-stack:
  added: []
  patterns:
    - "Legend entries authored as a small in-source array (LEGEND_ENTRIES) with a tone class per entry, rather than hardcoded JSX per row, so a future entry is one array item plus a one-line length check against the default tier's usable width"
    - "Demonstrative-only markup (the brightness sample row) is aria-hidden rather than restructured out of the DOM, keeping it visually adjacent to the note it illustrates while excluding it from the accessibility tree"

key-files:
  created:
    - src/components/ui/Legend.tsx
    - src/components/ui/Legend.module.css
  modified:
    - src/components/shell/DashboardShell.tsx

key-decisions:
  - "The 'extra-large spacing gap above the strip' the plan asked for (Task 2) was implemented as margin-top: var(--space-xl) on a wrapper div inside Legend.module.css (a Task 1 file) rather than by editing DashboardShell.module.css, which Task 2's <files> list did not include. Same visual effect, no CSS file the plan didn't already authorize for editing."
  - "Accent (--color-alert) applied only to the magenta entry's swatch and its 'MAGENTA' label text, not to the 'REQUIRES ATTENTION' meaning text next to it -- matches the UI-SPEC's explicit reservation list (Color section, item 2: 'the legend's magenta swatch and its label text'), keeping ordinary explanatory copy in the default green body colour."
  - "Legend entries data-driven from a small typed array (LEGEND_ENTRIES) rather than two hand-duplicated <li> blocks, so the in-source comment about re-checking line length against the tier cap has one place to point at."

requirements-completed: [RESP-04, CRT-10]

coverage:
  - id: D1
    description: "Legend renders inside Panel at the default tier with title SYSTEM LEGEND, two colour entries (green/nominal, magenta/alert) plus a brightness note, each swatch is the ASCII # character coloured by its own token family, --color-alert-dim never used, a one-line brightness sample shows dim/normal/bright, CrtControl renders inside Legend below the entries"
    requirement: RESP-04
    verification:
      - kind: other
        ref: "npm run lint && npm run build (both zero-exit) + the plan's own automated <verify> script (grep for CrtControl/Panel/--color-nominal/--color-alert refs, absence of --color-alert-dim and hex literals, node script confirming no box-drawing/block glyph and no JSX text node over 56 chars) -- all pass, reproduced in this session"
        status: pass
      - kind: manual
        ref: "Node script read the actual .next/server/app/index.html SSR output and confirmed SYSTEM LEGEND / GREEN / MAGENTA / the brightness note / [ CRT: FULL ] all appear in the rendered markup, in the expected structure (ul/li entries, swatch+label+separator+meaning spans, aria-hidden sample row)"
        status: pass
    human_judgment: true
    rationale: "Manual verification M-06 (readability at desktop and 360px, swatch colour fidelity, three visibly distinct brightness steps, CRT control affordance) requires a rendered browser viewport. No browser-automation tool is installed in this environment (same limitation recorded by 01-02 and 01-03). Deferred to the phase's end-of-phase UAT pass."
  - id: D2
    description: "DashboardShell renders Legend in the legend-strip region and no longer renders CrtControl directly; exactly one CRT control exists in the tree; vertical order is canvas region, panels region, legend strip; src/app/ still holds exactly one page.tsx and no route segments; shell is not a client component"
    requirement: CRT-10
    verification:
      - kind: other
        ref: "grep confirms Legend is referenced and CrtControl is not rendered directly in DashboardShell.tsx (outside comments); exactly one file (Legend.tsx) contains the literal 'CrtControl /' self-closing usage; find confirms exactly one page.tsx and zero route.ts* files under src/app/; DashboardShell.tsx has no 'use client' directive"
        status: pass
      - kind: other
        ref: "Node script parsed .next/server/app/index.html and confirmed canvas ('SCENE :: OFFLINE') appears before panels ('NEO FEED') which appears before the legend ('SYSTEM LEGEND') by string index, and exactly one '[ CRT: FULL ]' string is present in the compiled output"
        status: pass
    human_judgment: true
    rationale: "Whether clicking the relocated control actually changes the whole page's CRT treatment (the overlay's scanline/vignette opacity, since it writes the same --crt-intensity custom property CrtControl always has) is a live-interaction behavior. The control's write path is unchanged from plan 01-02 -- only its mount location moved -- so this is a low-risk functional carryover, but the plan's own human-check calls for confirming it live. Deferred to end-of-phase UAT alongside M-06."

duration: ~15min
completed: 2026-08-28
status: complete
---

# Phase 1 Plan 6: Palette Legend & CRT Intensity Control Summary

**A `SYSTEM LEGEND` panel explaining the project's two-colour semantics (green = nominal, magenta = requires attention, brightness = emphasis) now hosts the relocated CRT intensity control, closing RESP-04 and CRT-10.**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-08-28 (session)
- **Completed:** 2026-08-28
- **Tasks:** 2
- **Files modified:** 3 (2 created, 1 modified)

## Accomplishments

- Built `Legend` inside the shared `Panel` chrome at the default (64ch) tier, titled `SYSTEM LEGEND` — no separate markup invented, reusing the same component every other panel in the phase uses
- Authored exactly two colour entries (`# GREEN :: NOMINAL / ROUTINE`, `# MAGENTA :: REQUIRES ATTENTION`) as a small typed array, each swatch the ASCII `#` character coloured by its own semantic token (`--color-nominal` / `--color-alert`), plus one qualifying note stating brightness carries emphasis rather than a different meaning
- Applied the accent token only to the magenta swatch and its label text, per the UI-SPEC's explicit reservation list — the meaning text next to it stays in the default green body colour, and `--color-alert-dim` (2.46:1, fails AA) is never used anywhere
- Added a one-line, `aria-hidden` brightness sample demonstrating the three steps (dim/normal/bright) of the nominal family so the qualifying note has something concrete to point at
- Relocated `CrtControl` to render inside `Legend`, below the colour entries, separated by the medium spacing token
- Mounted `Legend` in `DashboardShell`'s existing legend-strip region and removed the shell's direct `CrtControl` render, so exactly one CRT control exists in the tree
- Confirmed via the actual compiled SSR HTML (`.next/server/app/index.html`), not by assumption, that the legend copy, swatches, brightness note, and the single CRT control all render, and that the vertical order (canvas → panels → legend strip) holds in the real output

## Task Commits

Each task was committed atomically:

1. **Task 1: Legend component — colour semantics inside terminal chrome** - `fc0d575` (feat)
2. **Task 2: Mount the legend strip in the shell** - `c17fcc2` (feat)

**Plan metadata:** commit pending (this SUMMARY + STATE/ROADMAP/REQUIREMENTS update)

## Files Created/Modified

- `src/components/ui/Legend.tsx` (created) - `Legend` component: two hand-authored colour entries in a typed array, a brightness note, an `aria-hidden` brightness sample row, and `CrtControl` rendered below the entries. Includes a comment recording the tier-fit check required when adding a future entry.
- `src/components/ui/Legend.module.css` (created) - Layout and swatch colouring for the entries list, the note, the brightness sample, the CRT control spacing, and the strip's own top margin.
- `src/components/shell/DashboardShell.tsx` (modified) - Swaps the direct `CrtControl` import/render for `Legend`; shell stays a server component (no `"use client"`).

## Decisions Made

- **Extra-large top spacing implemented in `Legend.module.css`, not `DashboardShell.module.css`.** Task 2's action text asked for "the extra-large spacing gap above it," but Task 2's `<files>` list names only `DashboardShell.tsx`. Rather than edit an unlisted CSS module, the gap (`margin-top: var(--space-xl)`) was added to a wrapper `<div>` inside `Legend.module.css`, a file already in scope from Task 1. Same visual result, no file-scope deviation.
- **Accent colour scoped to swatch + label only for the magenta entry**, matching the UI-SPEC Color section's explicit reservation list ("the legend's magenta swatch and its label text") rather than extending `--color-alert` to the meaning text as well.
- **Entries authored as a small typed array (`LEGEND_ENTRIES`)** rather than two duplicated `<li>` blocks, so the required "re-check the longest line against the tier cap" comment has exactly one place to live and apply to any future entry.

## Deviations from Plan

None that changed any acceptance criterion — see the spacing-gap file-scope note above, which achieves the plan's own instruction through a file already authorized for editing in this plan.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required.

## Outstanding Human Verification (M-06, deferred to end-of-phase UAT)

This session has no browser-automation tool available (same limitation recorded by 01-02 and 01-03), so the following from this plan's own `<human-check>` blocks could not be exercised live and are deferred to the phase's end-of-phase UAT pass:

1. **Legend readability and swatch colour fidelity at desktop and a 360px viewport** — both colour entries readable, each swatch renders in the colour it describes, longest line fits with margin at both widths, no wrap/overhang.
2. **Three visibly distinct brightness steps** in the sample row — a judgement only a rendered page supports.
3. **CRT control affordance and live behavior after relocation** — clicking `[ CRT: FULL ]` inside the legend should still cycle the label and change the whole page's CRT treatment (scanlines/vignette opacity via `--crt-intensity`), including the panels above it. The control's write path is unchanged from plan 01-02 (same `crtIntensity.ts`, same custom property) — only its mount location moved — so this is expected to work, but it is the plan's own explicit human-check and has not been exercised in a live browser this session.

Procedure for whoever runs the end-of-phase UAT pass: `npm run dev`, scroll to the legend strip, verify the two colour lines and swatches, resize to 360px, click the CRT control through all three levels and confirm the overlay visibly changes.

## Known Stubs

None.

## Next Phase Readiness

- `Legend` and the relocated `CrtControl` are stable for later phases; no further phase is expected to touch this component per the phase's own roster.
- RESP-04 and CRT-10 are both closed by this plan (see `requirements-completed`).
- Outstanding: the M-06 human-check items above, bundled with 01-02's and 01-03's own deferred human-checks for one end-of-phase UAT session per `human_verify_mode: end-of-phase`.

## Self-Check: PASSED

- FOUND: src/components/ui/Legend.tsx
- FOUND: src/components/ui/Legend.module.css
- FOUND: src/components/shell/DashboardShell.tsx
- FOUND commit fc0d575 (Task 1)
- FOUND commit c17fcc2 (Task 2)

---
*Phase: 01-terminal-design-system-app-shell*
*Completed: 2026-08-28*
