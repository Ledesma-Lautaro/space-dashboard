# Phase 1: Terminal Design System & App Shell - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-08-26
**Phase:** 1-Terminal Design System & App Shell
**Areas discussed:** Style stack and tokens, Layout structure, Panel anatomy and color semantics, CRT technique and intensity

---

## Style stack and tokens

| Option | Description | Selected |
|--------|-------------|----------|
| CSS Modules + custom properties | Per-component scoping, raw CSS for the CRT effects, matches the learn-the-platform goal | ✓ |
| Tailwind v4 | Fast layout iteration, tokens via `@theme`, but CRT effects end up hand-written anyway | |
| Plain global CSS | Simplest start, no scoping — name collisions by Phase 5 | |

**User's choice:** CSS Modules + custom properties
**Notes:** Rationale accepted as presented — the CRT effects are hand-written CSS regardless of framework, so the utility-class layer would add build complexity without teaching anything about the aspect being learned.

| Option | Description | Selected |
|--------|-------------|----------|
| Semantic role names | `--color-nominal`, `--color-alert` — value changes in one place when Phase 11 retunes | ✓ |
| Value names | `--phosphor-green`, `--magenta` — direct to read, but the name lies if the hue shifts | |
| Two layers | Primitives plus a semantic layer on top — more robust, more ceremony | |

**User's choice:** Semantic role names

| Option | Description | Selected |
|--------|-------------|----------|
| VT323 alone, measure later | One family; add a second only if Phase 4's NEO table proves unreadable | ✓ |
| Two faces from the start | VT323 for chrome, a more legible mono for numbers — safer, but solving an unobserved problem | |
| One more legible face | Drop VT323 entirely — zero legibility risk, less authentic | |

**User's choice:** VT323 alone, measure later
**Notes:** `research/STACK.md` flags VT323's horizontal phosphor smear as a legibility risk in dense data tables, with Departure Mono as the documented fallback. Decision is to gather evidence in Phase 4 rather than pre-empt.

| Option | Description | Selected |
|--------|-------------|----------|
| In-page legend strip | Satisfies RESP-04, ships to production, doubles as a build-time reference | ✓ |
| Legend plus a `/styleguide` route | Useful for development, contradicts RESP-01's single-screen constraint | |
| Minimal legend only | Bare swatches with labels | |

**User's choice:** In-page legend strip

---

## Layout structure

| Option | Description | Selected |
|--------|-------------|----------|
| Canvas hero, panels on scroll | Canvas fills the viewport on load; panels below. Says "the scene is the spine" on first paint | ✓ |
| Fixed canvas background, panels floating over it | Immersive, but composites CRT-treated 3D behind data text — the legibility trap from PITFALLS.md | |
| Side-by-side split | Both always visible, but the canvas ends up small and mobile needs a separate design | |

**User's choice:** Canvas hero, panels on scroll

| Option | Description | Selected |
|--------|-------------|----------|
| Same order, shorter canvas | Canvas first at reduced height, panels stacked below. One mental model, fewer pixels | ✓ |
| Collapsible canvas | Starts small with an expand control — one more interaction to maintain and device-test | |
| Panels first, canvas below | Data-first on mobile, but contradicts the 3D-as-centerpiece framing | |

**User's choice:** Same order, shorter canvas

| Option | Description | Selected |
|--------|-------------|----------|
| In-theme placeholder block | `>> SCENE :: OFFLINE` at the canvas's real dimensions — Phase 2 swaps in without layout rework | ✓ |
| Dotted-border empty div | Obvious dev placeholder, breaks the aesthetic in screenshots | |
| Nothing, adjust later | Less work now, layout redone in Phase 2 | |

**User's choice:** In-theme placeholder block

| Option | Description | Selected |
|--------|-------------|----------|
| Typed realistic mock fixtures | Shaped like real NeoWs/DONKI payloads; reveals density problems now, reusable by Phase 3 | ✓ |
| Skeletons and empty states only | More honest, but cannot judge whether VT323 survives a dense table | |
| Generic lorem text | Fast, but wrong shape — says nothing useful about the design | |

**User's choice:** Typed realistic mock fixtures

---

## Panel anatomy and color semantics

| Option | Description | Selected |
|--------|-------------|----------|
| Title bar with ASCII borders | `┌─ NEO FEED ─┐`; reinforces the terminal metaphor, reused by every later phase | ✓ |
| Simple CSS border with a label | Cleaner and easier to make responsive; ASCII borders misalign at odd widths | |
| No frame, spacing only | More modern and airy, further from the reference look | |

**User's choice:** Title bar with ASCII borders
**Notes:** The responsive-alignment risk was raised explicitly after selection and recorded in CONTEXT.md `<specifics>` as the most likely source of rework in this phase, with two candidate mitigations (`ch`-based container sizing; degrade to a CSS border below a threshold width).

| Option | Description | Selected |
|--------|-------------|----------|
| Green = nominal, magenta = needs attention | One rule, one legend line, avoids the alarmist traffic-light scheme ruled out in REQUIREMENTS.md | ✓ |
| Green = data, magenta = interaction | Magenta marks selection (including Phase 10's 2D↔3D sync); severity encoded by brightness | |
| Green = asteroids, magenta = space weather | Color separates the two data domains, leaving severity and selection without a color | |

**User's choice:** Green = nominal, magenta = needs attention

| Option | Description | Selected |
|--------|-------------|----------|
| Brightness steps | Three levels per hue; works for red-green color blindness since it does not rely on hue discrimination | ✓ |
| Variable phosphor glow | Very CRT, but glow is exactly what degrades fine-text legibility | |
| ASCII symbols alongside color | Fully redundant, works without color at all, visually noisier | |

**User's choice:** Brightness steps

| Option | Description | Selected |
|--------|-------------|----------|
| Dedicated `Alert` component | Own prefix, severity color and spacing; Phase 5 feeds it real DONKI bulletins unchanged | ✓ |
| A `Panel` variant | Fewer components, but alerts and tables have different layout needs | |
| A text class only | Minimal, but every phase reinvents the surrounding markup | |

**User's choice:** Dedicated `Alert` component

---

## CRT technique and intensity

| Option | Description | Selected |
|--------|-------------|----------|
| Scanlines | `repeating-linear-gradient` — the signature of the look, cheapest of all | ✓ |
| Vignette | `radial-gradient` — suggests tube curvature without distortion, very cheap | ✓ |
| Phosphor glow on text | `text-shadow` — sells the effect most, degrades small-number legibility most | ✓ |
| CSS chromatic aberration | Offset red/cyan shadows — crude next to Phase 11's per-channel shader | |

**User's choice:** Scanlines + vignette + phosphor glow (chromatic aberration excluded from the 2D layer)

| Option | Description | Selected |
|--------|-------------|----------|
| Single fixed overlay | One root pseudo-element, `pointer-events: none`; consistent intensity, one switch-off point | ✓ |
| Per-panel with own intensity | Finer control by content type, but duplicated logic that drifts out of sync | |
| Hybrid global plus per-panel opt-out | Directly addresses the legibility trap, at the cost of complexity | |

**User's choice:** Single fixed overlay

| Option | Description | Selected |
|--------|-------------|----------|
| No flicker for now | Flicker is the photosensitivity risk source; no frame-stepping verification exists until Phase 11 | ✓ |
| Subtle flicker with the cap already applied | Livelier, but pulls a Phase 11 verification into Phase 1 | |

**User's choice:** No flicker for now

| Option | Description | Selected |
|--------|-------------|----------|
| `prefers-reduced-motion` only | Honors the OS preference, adds no new surface, already covered by CRT-07 | |
| Plus an in-UI toggle | Good for a portfolio piece, but not covered by any existing requirement | ✓ |

**User's choice:** Plus an in-UI toggle
**Notes:** This was flagged during the question as outside the existing requirement set. Rather than carrying it as an untracked deliverable in CONTEXT.md, it was promoted to a tracked requirement: **CRT-10** added to REQUIREMENTS.md, mapped to Phase 1 in the traceability table and per-phase table, added to Phase 1's `**Requirements**` line in ROADMAP.md, and added as a sixth success criterion. Coverage moved from 51/51 to 52/52.

---

## Claude's Discretion

- Exact palette hex values, within the role and brightness structure decided.
- Scanline pitch, vignette falloff and glow radius — tuned by eye against the mock fixtures, bounded by "data text stays fully legible."
- Component file organisation and naming.
- Breakpoint value(s) between mobile and desktop layouts.
- Whether the CRT control is a binary toggle or a multi-step intensity selector, and its placement in the shell.

## Deferred Ideas

- Second typeface for dense numeric data — revisit in Phase 4, only if VT323 proves unreadable against real data.
- CSS-level chromatic aberration on 2D panels — belongs to the canvas via the Phase 11 shader chain.
- Animated CRT flicker — Phase 11, alongside CRT-06's photosensitivity verification.
- A `/styleguide` route — rejected as contradicting RESP-01.
