---
phase: 01-terminal-design-system-app-shell
plan: 07
subsystem: ui
tags: [css-modules, responsive, crt-overlay, canvas-placeholder]

requires:
  - phase: 01-terminal-design-system-app-shell (plan 02)
    provides: "DashboardShell tracer slice — canvas region, panels region, legend strip, single fixed CRT overlay"
  - phase: 01-terminal-design-system-app-shell (plan 03)
    provides: "Panel component with tier vocabulary (compact/default/wide, --panel-w-* tokens), ASCII chrome, sub-compact container-query degrade"
  - phase: 01-terminal-design-system-app-shell (plan 06)
    provides: "Legend strip hosting CrtControl, final DashboardShell composition (canvas → panels → legend)"
provides:
  - "ScenePlaceholder component (src/components/canvas/ScenePlaceholder.tsx) — self-contained reserved render target, positioning context, data-render-target anchor for Phase 2"
  - "Canvas height tokens (--canvas-h-desktop: 100svh, --canvas-h-mobile: 60svh) applied across a single 768px breakpoint"
  - "Content column capped at the wide tier (88ch), centred, with safe-area-inset gutters"
  - "Panel tier snapping below 768px via a --panel-w-default CSS custom-property override on the panels region, no JS width branch"
  - "Independent --crt-2d-scale token multiplying alongside --crt-intensity in scanline/vignette opacity"
affects: [02-three-js-render-boundary, 04-neo-classifier, 05-space-weather, 10-hud-overlay, 12-mobile-hardening]

actuals:
  tokens: 2530
  tasks: 2
  commits: 2

tech-stack:
  added: []
  patterns:
    - "ScenePlaceholder owns its own positioning context (position: relative) and data-render-target attribute rather than the shell's outer canvas section owning them — the shell section only controls reserved height/width, the placeholder component fills whatever box it is given and is the exact node Phase 2 swaps a <canvas> into"
    - "Panel tier snapping done via a CSS custom-property override (--panel-w-default) scoped to the panels region under a media query, rather than a prop/JS branch, since Panel.tsx's tier char-count is fixed at render time and cannot be varied without touching Panel.tsx (out of this plan's file scope) — Panel's own container query still independently governs whether the resulting width can hold a full ASCII grid"
    - "Single 768px breakpoint enforced project-wide via a node script scanning every .css file for @media min/max-width literals and asserting exactly one distinct value exists"

key-files:
  created:
    - src/components/canvas/ScenePlaceholder.tsx
    - src/components/canvas/ScenePlaceholder.module.css
  modified:
    - src/components/shell/DashboardShell.tsx
    - src/components/shell/DashboardShell.module.css
    - src/app/globals.css

key-decisions:
  - "The reserved-render-target data attribute, comment, and positioning context live on ScenePlaceholder's own root element, not on DashboardShell's outer <section className={styles.canvas}>. This lets the shell's canvas region own only height/width (Task 2's subject) while the exact node Phase 2 swaps a <canvas> into is ScenePlaceholder itself — a cleaner single-responsibility split than duplicating the data attribute in two places."
  - "Panel tier snapping implemented as a --panel-w-default override on .panels (mobile-first base rule, restored to 64ch at 768px) rather than passing a responsive tier prop through NeoFeedPanel/SpaceWeatherPanel, since Panel.tsx and the panel wrapper components were not in this plan's <files> scope. This is a pure CSS mechanism — no ResizeObserver, no window.innerWidth branch — so server and first client render always agree."
  - "--crt-2d-scale multiplies into both --crt-scanline-opacity and --crt-vignette-opacity's existing calc() expressions rather than being applied as a separate CSS layer, keeping the single-fixed-overlay architecture (D-17) intact while giving the postprocessing phase an independent lever."

requirements-completed: [RESP-01, CRT-02]

coverage:
  - id: D1
    description: "ScenePlaceholder renders the authored offline-scene string at display size and the reserved-render-target readout at label size, both in the dim/nominal chrome tokens, centred in the region; both strings are module constants; no keyframes/animation/transition/transform anywhere in the stylesheet; the region is a positioning context carrying a data-render-target attribute with a comment naming Phase 2; the region is a block in scroll flow, not fixed, not absolutely positioned, no translucent panel over it"
    requirement: RESP-01
    verification:
      - kind: other
        ref: "npm run lint && npm run build (both zero-exit) + the plan's own automated <verify> script (grep for ScenePlaceholder ref, data-render-target attribute, --type-display token, position: relative, absence of keyframes/animation/transition/transform, absence of position: fixed) — all pass, reproduced in this session"
        status: pass
      - kind: other
        ref: "Node script read .next/server/app/index.html and confirmed 'SCENE :: OFFLINE', 'RENDER TARGET RESERVED', and data-render-target=\"solar-system-scene\" all appear in the compiled SSR output"
        status: pass
    human_judgment: false
  - id: D2
    description: "Exactly one 768px breakpoint governs the layout across every stylesheet; canvas height tokens (100svh desktop, 60svh mobile) applied across it; no bare viewport-height unit anywhere in src; vertical order is canvas -> panels -> legend at both breakpoints; panels snap to the compact tier below the breakpoint and default at/above it via media query, not a JS width branch; content column centred at the wide-tier max-width with safe-area-inset gutters; --crt-2d-scale multiplies scanline/vignette opacity, defaulting to a no-visual-change value; src/app/ still holds exactly one page.tsx and no route segments"
    requirement: CRT-02
    verification:
      - kind: other
        ref: "npm run lint && npm run build (both zero-exit) + the plan's own automated <verify> script (grep/node-script chain: --canvas-h-desktop, --canvas-h-mobile, literal 100svh/60svh, literal 768px, exactly-one-768px-breakpoint node script, env(safe-area-inset presence, --crt-2d-scale presence, single page.tsx, absence of any digit-vh bare unit, absence of ResizeObserver/window.innerWidth) — all pass, reproduced in this session"
        status: pass
      - kind: other
        ref: "Node script read .next/server/app/index.html and confirmed string-index order SCENE :: OFFLINE (1726) < NEO FEED (2007) < SYSTEM LEGEND (10920), i.e. canvas before panels before legend in the actual compiled markup"
        status: pass
    human_judgment: true
    rationale: "This task's own <human-check> block (M-05 plus an early look at Phase 12's dynamic-viewport behaviour) requires a rendered browser at 390px and 1440px widths, plus a real-or-emulated phone rotation to observe browser-chrome collapse/reappear. No browser-automation tool is installed in this environment (same limitation recorded by 01-02, 01-03, 01-06). The panel-tier-snapping mechanism in particular (a CSS custom-property override, not a prop change) has not been visually confirmed to render ASCII chrome correctly across the 600-767px crossover range in a live browser. Deferred to the phase's end-of-phase UAT pass."

duration: ~25min
completed: 2026-08-28
status: complete
---

# Phase 1 Plan 7: Scene Placeholder & Responsive Contract Summary

**A self-contained `ScenePlaceholder` component now occupies the canvas's real reserved dimensions (100svh desktop / 60svh mobile) inside a formal single-breakpoint responsive contract, closing RESP-01 and CRT-02 and the phase itself.**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-08-28 (session)
- **Completed:** 2026-08-28
- **Tasks:** 2
- **Files modified:** 5 (2 created, 3 modified)

## Accomplishments

- Extracted `ScenePlaceholder` from `DashboardShell`'s inline canvas markup into its own component — the exact `>> SCENE :: OFFLINE` / `[ RENDER TARGET RESERVED ]` copy from the tracer, now owning its own `position: relative` positioning context and `data-render-target="solar-system-scene"` attribute, ready for Phase 2 to swap a real `<canvas>` in without touching layout
- Both placeholder strings are module-scope constants — never props, never derived from data — and the stylesheet carries zero keyframes, animation, transition or transform declarations (D-18)
- Added `--canvas-h-desktop` (`100svh`) and `--canvas-h-mobile` (`60svh`) tokens in `globals.css`, applied to the shell's canvas region across a single `768px` breakpoint (mobile-first base rule, desktop override at `min-width: 768px`)
- Enforced project-wide that exactly one distinct media-query breakpoint value (`768px`) exists across every stylesheet, verified with a small node script that scans all `.css` files under `src/`
- Confirmed zero bare `vh` units exist anywhere in the project — every viewport-relative height already used `svh`
- Capped the panels/legend content column at the wide tier's width (`88ch`), centred with `margin: 0 auto`, with large-token horizontal gutters plus `env(safe-area-inset-*)` so content clears a notch or rounded corner
- Snapped the panels region to the compact tier's width below `768px` via a `--panel-w-default` CSS custom-property override scoped to `.panels` — no `ResizeObserver`, no `window.innerWidth` branch, so server render and first client render always agree; Panel's own existing container query still independently governs whether the resulting width can hold a full ASCII character grid
- Added `--crt-2d-scale` (default `1`, no visual change) multiplying alongside `--crt-intensity` in both the scanline and vignette opacity `calc()` expressions, giving the postprocessing phase (Phase 11) an independent lever to balance the CSS overlay against the canvas shader chain
- Confirmed via the actual compiled SSR HTML (`.next/server/app/index.html`) that the offline-scene copy, the reserved-render-target attribute, and the canvas-before-panels-before-legend vertical order all hold in real output

## Task Commits

Each task was committed atomically:

1. **Task 1: Scene placeholder occupying the reserved render target** - `a1f63b5` (feat)
2. **Task 2: Responsive contract — one breakpoint, static viewport units, tier snapping** - `bb83034` (feat)

**Plan metadata:** commit pending (this SUMMARY + STATE/ROADMAP/REQUIREMENTS update)

## Files Created/Modified

- `src/components/canvas/ScenePlaceholder.tsx` (created) - `ScenePlaceholder` component: two authored module constants, a `position: relative` root carrying `data-render-target`, a comment naming Phase 2 as the replacer.
- `src/components/canvas/ScenePlaceholder.module.css` (created) - Fills the box it is given, centres content, surface background + dim border, no motion of any kind.
- `src/components/shell/DashboardShell.tsx` (modified) - Mounts `ScenePlaceholder` inside the existing canvas `<section>`, replacing the tracer's inline `<p>` elements and the outer section's now-redundant `data-render-target` attribute.
- `src/components/shell/DashboardShell.module.css` (modified) - Canvas region height rules across the 768px breakpoint using the new tokens; panels/legend content column capping, centring and safe-area gutters; panel tier-snapping override.
- `src/app/globals.css` (modified) - `--breakpoint-desktop` (documentary), `--canvas-h-desktop`/`--canvas-h-mobile`, `--crt-2d-scale`, and the scanline/vignette opacity calcs updated to multiply by the new scale token.

## Decisions Made

- **Reserved-render-target attribute and positioning context moved onto `ScenePlaceholder` itself**, not the shell's outer canvas section — see `key-decisions` in frontmatter for full rationale. The shell's `<section className={styles.canvas}>` now only controls reserved height/width; `ScenePlaceholder`'s root is the exact node Phase 2 replaces.
- **Panel tier snapping implemented as a CSS custom-property override**, not a responsive prop threaded through `NeoFeedPanel`/`SpaceWeatherPanel`, since `Panel.tsx` and those wrapper components were outside this plan's `<files>` scope for Task 2. Full rationale in frontmatter `key-decisions`.
- **`--panel-w-default: 64ch` is restated as a literal in the `768px` media query** in `DashboardShell.module.css` rather than referencing `globals.css`'s own `--panel-w-default` token, because the mobile-first base rule already overrides that same property name on `.panels`, and CSS custom properties have no way to "reset to the inherited ancestor value" (`initial` resets to the guaranteed-invalid value, not the ancestor's cascaded value). The duplicated literal is commented as intentionally mirroring the canonical token.

## Deviations from Plan

None — plan executed exactly as written for both tasks. All automated `<verify>` checks in the plan (grep chains, the breakpoint-uniqueness node script, bare-`vh` scan, `ResizeObserver`/`window.innerWidth` scan) were reproduced in this session and pass.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required.

## Outstanding Human Verification (M-05, deferred to end-of-phase UAT)

No browser-automation tool is available in this environment (same limitation recorded by 01-02, 01-03, and 01-06), so this plan's own `<human-check>` block on Task 2 could not be exercised live and is deferred to the phase's end-of-phase UAT pass, alongside the outstanding items from 01-02/01-03/01-06:

1. **Layout correctness at 390px (phone) and 1440px (desktop) viewports** — one continuous scrolling page at both widths, canvas region fills the visible area on desktop and roughly three-fifths on mobile, panels below it in the same order, content clears any notch/rounded corner.
2. **Panel tier snapping and ASCII chrome alignment across the crossover range** — the `--panel-w-default` override forces panels toward the compact tier's width below 768px; this has not been visually confirmed in a live browser to render aligned ASCII chrome (or a clean container-query degrade to plain CSS borders) across the full width range, particularly the 600-767px band where the panels region's own available width may still exceed the sub-compact degrade threshold while the forced panel width sits at the compact tier.
3. **Real (or emulated) phone rotation with browser-chrome collapse/reappear** — confirming nothing is clipped and no region resizes or jumps as `svh`'s static floor is exercised live; this is Phase 12's RESP-03 requirement, previewed here.

Procedure for whoever runs the end-of-phase UAT pass: `npm run dev`, resize/emulate to 390px and 1440px, scroll top to bottom at each, then rotate a real phone (or emulate rotation) and scroll through a browser-chrome collapse/reappear cycle.

## Known Stubs

None. `ScenePlaceholder` is intentionally a placeholder per D-10, but it is not a stub in the broken-windows sense — it is the plan's actual, complete deliverable, explicitly scoped to be replaced by Phase 2's real canvas rather than extended.

## Next Phase Readiness

- Phase 1 (Terminal Design System & App Shell) is now feature-complete: all 7 plans executed, RESP-01 and CRT-02 close alongside this plan.
- `ScenePlaceholder`'s root (`position: relative`, `data-render-target="solar-system-scene"`) is the exact insertion point Phase 2 (render boundary) needs for a real `<canvas>` — no layout restructuring required.
- `--crt-2d-scale` exists and defaults to `1`; Phase 11 (postprocessing) can dial it against the canvas shader chain once that exists.
- Outstanding: the M-05 human-check items above, bundled with 01-02's, 01-03's and 01-06's own deferred human-checks (M-01 through M-06 collectively) for one end-of-phase UAT session per `human_verify_mode: end-of-phase`.

## Self-Check: PASSED

- FOUND: src/components/canvas/ScenePlaceholder.tsx
- FOUND: src/components/canvas/ScenePlaceholder.module.css
- FOUND: src/components/shell/DashboardShell.tsx
- FOUND: src/components/shell/DashboardShell.module.css
- FOUND: src/app/globals.css
- FOUND commit a1f63b5 (Task 1)
- FOUND commit bb83034 (Task 2)

---
*Phase: 01-terminal-design-system-app-shell*
*Completed: 2026-08-28*
