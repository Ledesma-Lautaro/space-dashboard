# Phase 1: Terminal Design System & App Shell - Context

**Gathered:** 2026-08-26
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase delivers the dashboard's 2D visual language as a reusable design system, plus the single-screen responsive shell it lives in. **No Three.js. No NASA data.** At the end of this phase the project looks like the finished project, with mock content inside it.

**In scope:** style architecture and design tokens, typography loading, the terminal `Panel` and `Alert` components, the CSS-level CRT overlay, the palette legend, the CRT intensity control, and the responsive single-page layout with a placeholder where the canvas will go.

**Out of scope:** any Three.js code (Phase 2), any real NASA fetching (Phase 3), the WebGL shader postprocessing chain (Phase 11), and the photosensitivity/contrast verification that belongs with that chain (CRT-06, CRT-09, Phase 11).

**Requirements covered:** CRT-02, CRT-03, CRT-04, CRT-05, CRT-10, RESP-01, RESP-04

</domain>

<decisions>
## Implementation Decisions

### Style architecture and tokens

- **D-01:** Styles are written as **CSS Modules + CSS custom properties**. Not Tailwind, not plain global CSS. Rationale: the CRT effects (layered gradients, pseudo-element overlays, phosphor glow) are hand-written CSS regardless of framework, and CSS Modules give per-component scoping without a utility-class abstraction in between. This also matches the project's Core Value — the user is learning the platform, not a build-time DSL. — **Reversibility:** costly — undoing this means rewriting the styles of every component built in Phases 1, 4, 5 and 10, since every one of them will ship a co-located `.module.css`.

- **D-02:** Color tokens are named by **semantic role**, not by value: `--color-nominal`, `--color-alert`, `--color-dim`, `--color-bg`, etc. Rationale: Phase 11 tunes the palette against the composited CRT output; a role-named token changes value in one place with no renaming. A value-named token (`--phosphor-green`) becomes a lie the moment the hue shifts.

- **D-03:** Single token layer, not a primitives + semantic two-tier system. A one-screen project does not earn the extra indirection.

### Typography

- **D-04:** Ship **VT323 alone** for now, loaded via `next/font/google`. Do NOT preemptively add a second, more legible monospace face. Rationale: VT323's horizontal phosphor smear is a known legibility risk in dense numeric tables (flagged in `research/STACK.md`), but that risk is not observable until Phase 4 renders a real NEO table. Decide with evidence, not in advance.
- **D-05:** The mock fixtures in this phase must include realistic numeric density (distances, velocities, diameter ranges with units) specifically so this legibility question can be judged now rather than in Phase 4.

### Layout and shell

- **D-06:** **Desktop:** the canvas region is a hero occupying the full viewport on load; the data panels appear on scroll below it. Rationale: the user's stated framing is that the 3D scene is the spine of the project, not decoration — the layout should say that on first paint. It also leaves the Phase 10 HUD overlay somewhere real to live.
- **D-07:** **Mobile:** the same vertical order, with the canvas at reduced height (e.g. `60svh`). Rationale: one mental model across breakpoints, and fewer pixels to render — which directly helps the Phase 11 mobile performance budget.
- **D-08:** Explicitly rejected: canvas as a fixed background with translucent panels floating over it. That composites CRT-treated 3D output behind data text, which is precisely the legibility trap `research/PITFALLS.md` warns about.
- **D-09:** Single scrolling page, no separate routes (RESP-01). The design system is delivered as an in-page legend strip, **not** as a `/styleguide` route.

### Placeholder and mock content

- **D-10:** The canvas slot renders an in-theme placeholder block at the canvas's real dimensions, showing something like `>> SCENE :: OFFLINE`. Rationale: reserves exact layout space so Phase 2 swaps in the real canvas without touching layout, and keeps screenshots of this phase presentable.
- **D-11:** Panels render **typed mock fixtures shaped like real NeoWs/DONKI payloads** — not lorem text, not empty skeletons. Rationale: only real-shaped data reveals density and legibility problems now. Phase 3 should reuse these fixtures to exercise its error and empty states.

### Panel anatomy and color semantics

- **D-12:** All panels share a common terminal chrome: a `Panel` component with a title bar and ASCII box-drawing borders (e.g. `┌─ NEO FEED ─┐`). Every later phase reuses it rather than inventing panel markup. — **Reversibility:** costly — Phases 4, 5 and 10 all build inside this component; changing its structure later means touching each of them.
- **D-13:** **Color semantics: green = nominal, magenta/violet = requires attention.** Green is the base state of everything; magenta marks the exceptional — high notability tier, X-class flare, strong geomagnetic storm, and error states. One rule, explainable in a single legend line, and it avoids the alarmist traffic-light scheme explicitly ruled out in REQUIREMENTS.md.
- **D-14:** Intensity within a hue is expressed as **three brightness steps** (dim / normal / bright) per color, not as variable glow. Rationale: gives hierarchy without adding hues, and stays readable for red-green color blindness — the most common form — since it does not rely on distinguishing green from magenta.
- **D-15:** Alerts get their own `Alert` component (prefix `>>`, severity color, own spacing), not a `Panel` modifier. Phase 5 feeds it real DONKI `messageBody` bulletins without changing it.

### CRT treatment (CSS layer)

- **D-16:** Effects in this phase: **scanlines** (`repeating-linear-gradient`), **vignette** (`radial-gradient`), and **phosphor glow on text** (`text-shadow`). CSS-level chromatic aberration is deliberately excluded — it looks crude next to the real per-channel shader pass in Phase 11, so aberration stays a canvas-only effect.
- **D-17:** The CRT layer is a **single fixed overlay** on the root wrapper — one pseudo-element, `position: fixed`, `pointer-events: none`, above everything. One implementation, consistent intensity, one place to switch it off.
- **D-18:** **No animated flicker in this phase.** Flicker is the photosensitivity risk source (CRT-06) and there is no frame-stepping verification method in place until Phase 11. Introducing it here would pull that verification forward unplanned.
- **D-19:** `prefers-reduced-motion` is respected from this phase onward, not retrofitted.
- **D-20:** A visible in-theme control lets the user reduce or disable the CRT effect, and the choice holds for the session. **This was not covered by any existing requirement** — it has been added as **CRT-10** in REQUIREMENTS.md and mapped to this phase, and a sixth success criterion was added to Phase 1 in ROADMAP.md. It is tracked and verified like every other requirement, not an untracked extra.

### Claude's Discretion

- Exact hex values for the palette, subject to D-13/D-14's role and brightness structure.
- Exact scanline pitch, vignette falloff and glow radius — to be tuned by eye against the mock fixtures, constrained by "data text stays fully legible."
- Component file organisation and naming.
- The specific breakpoint value(s) between the mobile and desktop layouts.
- Whether the CRT control is a toggle or a multi-step intensity selector, and where it sits in the shell.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project scope and requirements
- `.planning/PROJECT.md` — Core Value (learning Three.js deeply over delivery speed), constraints, and the Key Decisions table
- `.planning/REQUIREMENTS.md` — CRT-02, CRT-03, CRT-04, CRT-05, CRT-10, RESP-01, RESP-04 are this phase's contract; the Out of Scope table names things deliberately excluded
- `.planning/ROADMAP.md` §"Phase 1" — goal and the six success criteria this phase is verified against

### Stack and versions
- `.planning/research/STACK.md` §1 — Next.js 16.3.3: Turbopack is the default bundler, so do **not** add a `webpack()` config to `next.config.*` or `next build` fails; Node 20.9+ required
- `.planning/research/STACK.md` §6 — VT323 licensing (OFL) and the `next/font/google` self-hosting behaviour that prevents layout shift; Departure Mono is the documented fallback if VT323 proves unreadable in dense tables
- `.planning/research/STACK.md` §8 — the "what NOT to use" table

### Pitfalls that bind this phase
- `.planning/research/PITFALLS.md` — the CRT-vs-legibility trap: contrast checks against flat swatches pass easily while composited scanline + glow output erodes real legibility undetected. This is the reason for D-16 and for measuring contrast over composited output rather than swatches.
- `.planning/research/PITFALLS.md` — photosensitivity (WCAG 2.3.1: >3 flashes/sec at ≥10% luminance delta). Not this phase's verification gate, but the reason no flicker is introduced here (D-18).
- `.planning/research/PITFALLS.md` — mobile dynamic viewport height clipping. RESP-03 is Phase 12's requirement, but the layout built here should use `svh`/`dvh` units rather than `vh` so Phase 12 is a verification pass, not a rewrite.

### Architecture
- `.planning/research/ARCHITECTURE.md` §"file/folder layout" — the proposed directory structure; this phase establishes it
- `.planning/research/ARCHITECTURE.md` §"build order" — why the 2D design system precedes all Three.js work

### Newly discovered during discussion
- **Next.js docs at `node_modules/next/dist/docs/`** — not yet available (Next.js is not installed in this greenfield repo). Per the generated `.claude/CLAUDE.md`, this MUST be consulted as soon as `next` is installed, and it **takes precedence over any Next.js claim in `research/STACK.md`** if the two disagree.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

None. The repository is greenfield — `git ls-files` returns only `.planning/` documents and `.claude/CLAUDE.md`. There is no `package.json`, no `node_modules`, and no source tree yet.

### Established Patterns

None yet. **This phase establishes the patterns** that Phases 2–12 inherit: the style architecture (D-01), the token vocabulary (D-02), the panel/alert component contract (D-12, D-15), and the directory layout.

### Integration Points

- **Phase 2** replaces the canvas placeholder (D-10) in-place. The placeholder must therefore occupy the canvas's real dimensions so no layout work is redone.
- **Phase 3** reuses this phase's mock fixtures (D-11) to exercise its four distinct data states.
- **Phases 4 and 5** build inside the `Panel` and `Alert` components (D-12, D-15) and consume the semantic color tokens (D-13, D-14).
- **Phase 11** replaces the canvas's share of the CRT look with a real shader chain while the CSS layer (D-16, D-17) continues to cover the 2D panels, and re-tunes token values (D-02) against composited output.

</code_context>

<specifics>
## Specific Ideas

- Alert format is literal and fixed by CRT-05: `>> CME DETECTED - INTENSITY: MODERATE`.
- Panel chrome uses box-drawing characters, e.g. `┌─ NEO FEED ─┐`.
- Canvas placeholder copy in the same register: `>> SCENE :: OFFLINE`.
- Reference aesthetic: a hand-drawn schematic solar system with circular orbit lines, and terminal alert panels — as described in PROJECT.md's Context section.

**Known tension worth planning around:** ASCII box-drawing borders (D-12) and fluid responsive layout fight each other. Box characters misalign when a container's width is not an exact multiple of the character advance. This is solvable — size panel containers in `ch` units, and/or degrade the ASCII frame to a plain CSS border below a threshold width — but the planner should treat it as a real risk with an explicit mitigation task, not as an incidental styling detail. It is the most likely source of rework in this phase.

</specifics>

<deferred>
## Deferred Ideas

- **Second typeface for dense numeric data** (e.g. Departure Mono alongside VT323). Deliberately deferred to Phase 4 per D-04, and only if the real NEO table shows VT323 to be unreadable. Not a new requirement — a contingency on an existing one (CRT-04).
- **CSS-level chromatic aberration on 2D panels.** Excluded per D-16; the effect belongs to the canvas via the Phase 11 shader chain.
- **Animated CRT flicker.** Deferred to Phase 11 per D-18, where CRT-06's photosensitivity verification lives.
- **A `/styleguide` route showing all components.** Rejected per D-09 — it would contradict RESP-01's "single screen, no separate routes."

**Note:** the in-UI CRT control is NOT listed here as deferred. It was promoted to a tracked requirement (CRT-10) in this phase rather than dropped. See D-20.

</deferred>

---

*Phase: 1-Terminal Design System & App Shell*
*Context gathered: 2026-08-26*
