# Phase 1: Terminal Design System & App Shell - Research

**Researched:** 2026-08-27
**Domain:** Next.js 16 App Router scaffolding, CSS Modules + custom-property design tokens, `next/font/google`, monospace-grid ASCII UI, client-only preference persistence — no Three.js, no NASA data
**Confidence:** HIGH for everything backed by a direct file/registry read (flagged `[VERIFIED: ...]` below); MEDIUM for official-docs-derived guidance (`[CITED: ...]`); LOW/`[ASSUMED]` only where noted

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Styles are written as **CSS Modules + CSS custom properties**. Not Tailwind, not plain global CSS.
- **D-02:** Color tokens are named by **semantic role**, not by value: `--color-nominal`, `--color-alert`, `--color-dim`, `--color-bg`, etc.
- **D-03:** Single token layer, not a primitives + semantic two-tier system.
- **D-04:** Ship **VT323 alone** for now, loaded via `next/font/google`. Do NOT preemptively add a second, more legible monospace face.
- **D-05:** The mock fixtures in this phase must include realistic numeric density (distances, velocities, diameter ranges with units).
- **D-06:** **Desktop:** the canvas region is a hero occupying the full viewport on load; the data panels appear on scroll below it.
- **D-07:** **Mobile:** the same vertical order, with the canvas at reduced height (e.g. `60svh`).
- **D-08:** Explicitly rejected: canvas as a fixed background with translucent panels floating over it.
- **D-09:** Single scrolling page, no separate routes (RESP-01). The design system is delivered as an in-page legend strip, **not** as a `/styleguide` route.
- **D-10:** The canvas slot renders an in-theme placeholder block at the canvas's real dimensions, showing something like `>> SCENE :: OFFLINE`.
- **D-11:** Panels render **typed mock fixtures shaped like real NeoWs/DONKI payloads** — not lorem text, not empty skeletons.
- **D-12:** All panels share a common terminal chrome: a `Panel` component with a title bar and ASCII box-drawing borders (e.g. `┌─ NEO FEED ─┐`). — **Reversibility:** costly.
- **D-13:** **Color semantics: green = nominal, magenta/violet = requires attention.**
- **D-14:** Intensity within a hue is expressed as **three brightness steps** (dim / normal / bright) per color, not as variable glow.
- **D-15:** Alerts get their own `Alert` component (prefix `>>`, severity color, own spacing), not a `Panel` modifier.
- **D-16:** Effects in this phase: **scanlines**, **vignette**, and **phosphor glow on text**. CSS-level chromatic aberration is deliberately excluded.
- **D-17:** The CRT layer is a **single fixed overlay** on the root wrapper — one pseudo-element, `position: fixed`, `pointer-events: none`, above everything.
- **D-18:** **No animated flicker in this phase.**
- **D-19:** `prefers-reduced-motion` is respected from this phase onward, not retrofitted.
- **D-20:** A visible in-theme control lets the user reduce or disable the CRT effect, and the choice holds for the session. Tracked as **CRT-10**.

### Claude's Discretion

- Exact hex values for the palette, subject to D-13/D-14's role and brightness structure.
- Exact scanline pitch, vignette falloff and glow radius — to be tuned by eye against the mock fixtures, constrained by "data text stays fully legible."
- Component file organisation and naming.
- The specific breakpoint value(s) between the mobile and desktop layouts.
- Whether the CRT control is a toggle or a multi-step intensity selector, and where it sits in the shell.

### Deferred Ideas (OUT OF SCOPE)

- **Second typeface for dense numeric data** (e.g. Departure Mono alongside VT323). Deferred to Phase 4 per D-04, only if the real NEO table shows VT323 unreadable.
- **CSS-level chromatic aberration on 2D panels.** Excluded per D-16; belongs to the canvas via the Phase 11 shader chain.
- **Animated CRT flicker.** Deferred to Phase 11 per D-18, where CRT-06's photosensitivity verification lives.
- **A `/styleguide` route showing all components.** Rejected per D-09.

Note: the in-UI CRT control is NOT deferred — it is tracked requirement CRT-10 (D-20).
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|--------------------|
| CRT-02 | 2D panels carry the CRT look via CSS at reduced intensity so data text stays legible | CRT Overlay code skeleton (Code Examples); Pitfall 8 legibility math preserved from UI-SPEC, no change needed |
| CRT-03 | Palette is phosphor green + magenta/violet on deep black, applied consistently | `globals.css` token skeleton (Code Examples) implements the exact D-02/D-13/D-14 token set from UI-SPEC |
| CRT-04 | Typography is a pixel monospace face (VT323) loaded through `next/font` | Pattern 1 (weight requirement), Pattern 2 (`display: 'optional'` for no-flash), Correction 1/2 (glyph coverage + `ch` ratio) |
| CRT-05 | Alert panels render in terminal format (e.g. `>> CME DETECTED - INTENSITY: MODERATE`) | `Alert` component structure in Recommended Project Structure; grammar unchanged from UI-SPEC, no new research needed beyond confirming React text-rendering (Security Domain) |
| CRT-10 | User can reduce or turn off the CRT effect from a visible in-theme control, choice holds for session | Pattern 4 (`sessionStorage` read-after-mount + try/catch backstop) — full implementation |
| RESP-01 | Dashboard is usable on mobile and desktop as a single screen with scroll, no separate routes | Recommended Project Structure (single `app/page.tsx`); `svh` unit confirmation (Pitfall 4) |
| RESP-04 | A legend explains what the CRT color coding means | `Legend` component in Recommended Project Structure; token semantics carried from D-02/D-13/D-14 |
</phase_requirements>

## Summary

This phase is pure scaffolding + CSS. The stack is settled (`research/STACK.md`), the visual contract is settled (`01-UI-SPEC.md`), and the implementation decisions are locked (`01-CONTEXT.md`). What this research adds is **two verified corrections to numbers already written into the locked UI-SPEC**, both found by opening the actual font file `next/font/google` will serve rather than trusting the spec's own estimate:

1. **VT323 has zero glyphs in the Unicode Box Drawing block (U+2500–257F).** The literal `┌─ NEO FEED ─┐` example in D-12/UI-SPEC will render its corner and rule characters in a fallback font, at a different advance width than the rest of the panel, breaking the `ch`-grid alignment the whole ASCII Border Contract depends on. This is not a hypothetical — it was confirmed by downloading the exact `.ttf` Google's CDN serves and inspecting its `cmap`.
2. **VT323's actual character advance is `0.4em`, not the `~0.6em` the UI-SPEC estimated.** Every `ch`-based measurement in the UI-SPEC (`32ch ≈ 384px`, `48ch ≈ 576px`, `64ch ≈ 768px`, the "sub-280px" degrade estimate) is off by 33%. The real numbers are `32ch ≈ 256px`, `48ch ≈ 384px`, `64ch ≈ 512px`.

Both are `[VERIFIED]` by direct binary inspection of `fonts.gstatic.com/s/vt323/v18/pxiKyp0ihIEF2hsY.ttf` — the exact file `next/font/google` self-hosts at build time — not by web search. Section "VERIFIED CORRECTIONS TO UI-SPEC" below has the full evidence and a concrete recommendation (swap the Unicode box-drawing glyphs for plain ASCII `+`/`-`/`|`, which VT323 *does* have, at the confirmed matching advance width).

Everything else in this phase is standard, low-risk Next.js 16 App Router work: scaffold with `--no-tailwind` (Tailwind is create-next-app's *default*, not an opt-in — this must be passed explicitly), CSS Modules work with zero config, `next/font/google` handles the FOUT/CLS concern natively, and `sessionStorage` access needs the standard client-only-read-after-mount pattern plus a try/catch backstop for Safari private browsing.

**Primary recommendation:** Scaffold first, read `node_modules/next/dist/docs/` second (both are the same task's first two steps — do not write app code between them), fix the two VT323 measurement errors in the panel/border implementation before building `Panel`, and treat everything else in this phase as standard CSS-Modules-in-App-Router work with no exotic tooling.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Design tokens (color, spacing, type) | Browser / Client (static CSS) | — | Pure CSS custom properties in `globals.css`, no runtime logic |
| Font loading (VT323) | Frontend Server (SSR, build-time) | Browser / Client | `next/font/google` downloads and self-hosts at **build time** (Next's build step), then the browser applies the generated `className`/CSS variable — no runtime network request either way |
| `Panel`/`Alert` components | Browser / Client (React, mostly presentational) | — | No Server Component needs data-fetching in this phase (D-11: mock fixtures are static module-scope data); components could technically be Server Components but the CRT control's interactivity requires a client boundary somewhere in the tree |
| CRT overlay (scanlines/vignette/glow) | Browser / Client (CSS) | — | Pure CSS pseudo-element + `text-shadow`, no JS render loop this phase (D-16, D-18) |
| CRT intensity control + persistence | Browser / Client (`'use client'`) | — | `sessionStorage` is a browser-only API; must be a Client Component |
| Responsive layout / breakpoint | Browser / Client (CSS media query) | — | Single breakpoint at 768px, no JS-driven layout logic needed |
| Canvas placeholder | Browser / Client (static markup) | — | No WebGL yet (Phase 2); just reserves layout space |

## VERIFIED CORRECTIONS TO UI-SPEC

> Read this section before implementing `Panel`, the ASCII Border Contract, or the Typography section's `ch` math. Both findings below were produced by downloading the real font binary and inspecting it programmatically this session — not by web search, not by training-data recall.

### Correction 1 — VT323 has NO box-drawing glyphs (`┌─┐│└┘` will NOT render in VT323)

**Method:** Fetched the Google Fonts CSS endpoint (`fonts.googleapis.com/css2?family=VT323&display=swap`) to get the exact file URL `next/font/google` will bundle at build time (`https://fonts.gstatic.com/s/vt323/v18/pxiKyp0ihIEF2hsY.ttf` — this is a versioned, stable, current URL as of 2026-08-27, confirmed via a live `curl` this session), downloaded it, and inspected its `cmap` table with `fontkit` (`font.characterSet`).

**Result — `[VERIFIED: fonts.gstatic.com/s/vt323/v18/pxiKyp0ihIEF2hsY.ttf, cmap inspected via fontkit 2.0.4 this session]`:**
```
U+250C ┌  MISSING     U+2510 ┐  MISSING     U+2514 └  MISSING     U+2518 ┘  MISSING
U+2500 ─  MISSING     U+2502 │  MISSING     U+251C ├  MISSING     U+2524 ┤  MISSING
U+252C ┬  MISSING     U+2534 ┴  MISSING     U+253C ┼  MISSING     U+2588 █  MISSING
U+25A0 ■  MISSING
Full Box Drawing block (U+2500-257F): 0 of 128 codepoints present.
Full Block Elements block (U+2580-259F): 0 of 32 codepoints present.
```
The only glyph VT323 has anywhere near the geometric-shapes range is `U+25CA` (◊ lozenge) — not usable as a border corner or rule.

This directly contradicts a web-search-derived claim from a prior pass ("VT323 contains 11 box drawing characters") — that claim is `[refute: fonts.gstatic.com/s/vt323/v18/pxiKyp0ihIEF2hsY.ttf direct cmap inspection]`. Web aggregation sources conflated VT323 with a different font or a stale character-count summary; the actual served file has zero.

**Why this matters concretely:** D-12 and the UI-SPEC's ASCII Border Contract specify `┌─ {TITLE} ─{fill}┐` as literal text content, styled with the VT323 font. When the browser lays out that string, every character it finds in VT323's `cmap` renders in VT323 (`0.4em` advance, see Correction 2). Every character it does **not** find (all six box-drawing glyphs) triggers per-character font fallback to the next font in the CSS `font-family` stack (or the browser/OS system fallback if none is declared) — and that fallback font's glyphs render at *their own* advance width, not VT323's. A dash run computed to fill exactly `N` characters at VT323's grid will be visually wrong-width the moment it's rendered, because the `┌`/`┐`/`└`/`┘` corner glyphs and the `─` fill characters silently come from a different font than the `{TITLE}` text between them. The row will not align — this is the exact fragility `01-CONTEXT.md`'s `<specifics>` block called "the most likely source of rework in this phase," now confirmed rather than merely anticipated.

**Recommendation (primary):** Replace the Unicode box-drawing glyphs with plain ASCII structural characters that **are** confirmed present in VT323 at the identical `0.4em` monospace advance as every other glyph in the font — `[VERIFIED: same fontkit inspection, same session]`:
```
U+002D  -  (hyphen-minus)   advance 400/1000 em  PRESENT
U+002B  +  (plus)           advance 400/1000 em  PRESENT
U+007C  |  (vertical bar)   advance 400/1000 em  PRESENT
```
Concretely, change the border contract from:
```
┌─ NEO FEED ─{fill}┐          →   +- NEO FEED -{fill}+
└{fill}┘                      →   +{fill}+
```
Side borders stay CSS (`border-left/right`) exactly as D-12 already specifies — unaffected by this correction, since they were never rendered as text glyphs. This is a **one-line change to the fill-character constant and the two corner literals**, not a structural rework: the hybrid mechanism (text top/bottom rows, CSS side borders, `ch`-tiered widths, title-truncation formula) is unchanged and still correct. It also has the side benefit of being closer to what a real DEC VT320 terminal could actually display — those terminals used the DEC Special Graphics character set via escape sequences for line-drawing, not Unicode box-drawing (which postdates them by decades) `[ASSUMED — historical framing, not load-bearing for the recommendation, offered as context only]`.

**Alternative (if the Unicode glyphs must be kept for visual reasons):** Layer a second `@font-face` restricted via `unicode-range: U+2500-257F, U+2580-259F;` pointing at a donor monospace font that has box-drawing coverage (e.g. a system monospace or a self-hosted subset of a font like Cascadia Code/DejaVu Sans Mono), and use the `size-adjust`/`ascent-override`/`descent-override` `@font-face` descriptors — the same metric-matching toolkit `next/font`'s own `adjustFontFallback` uses internally — to force that donor font's advance width to approximate VT323's `0.4em` grid. This is a legitimate, documented CSS technique `[CITED: developer.mozilla.org/docs/Web/CSS/@font-face — size-adjust/ascent-override descriptors]` but is materially more setup for a locked-decision aesthetic detail that isn't itself locked (D-12 locks the *presence* of a `Panel` chrome and gives `┌─ NEO FEED ─┐` as an *example*, not a pixel-exact requirement). **This research recommends the ASCII substitution as the default** given the project's stated priority (learning depth over polish, D-01's own rationale) and flags the Unicode-preserving path only as an option if the checker/user explicitly wants the glyph look preserved.

**Action for planning:** This is a correction to an already-approved-pending design artifact (`01-UI-SPEC.md`'s own Checker Sign-Off table shows all six dimensions still unchecked, "Approval: pending" — so this is landing before final sign-off, not after). The planner should either update the UI-SPEC's literal examples to the ASCII form before task-writing, or carry a `checkpoint:human-verify` task confirming the substitution is acceptable before `Panel` is built. Either is fine; silently building to the old glyphs is not, since they will misrender.

### Correction 2 — VT323's real advance ratio is `0.4em`, not `~0.6em` — all `ch` px-equivalences in the UI-SPEC need recalculating

**Method:** Same font file, same session. Cross-checked three independent metric sources inside the binary to rule out a measurement fluke: (a) `unitsPerEm` + individual glyph `advanceWidth` for `0`, `1`, `A`, `a`, `W`, `i`, `.`, space, `-`, `+`, `|`, `=`, `_`; (b) the font's own `OS/2.xAvgCharWidth` field (a value font vendors set specifically to describe average character width); (c) `capHeight`/`xHeight` for sanity.

**Result — `[VERIFIED: fonts.gstatic.com/s/vt323/v18/pxiKyp0ihIEF2hsY.ttf, fontkit 2.0.4]`:**
```
unitsPerEm:            1000
every sampled glyph advanceWidth: 400   (confirms true monospace — every glyph shares one advance)
OS/2.xAvgCharWidth:     400              (independent metadata field, agrees exactly)
→ advance ratio = 400/1000 = 0.4em, not the ~0.6em the UI-SPEC's "verify empirically once built" note assumed
```

Per the CSS Values spec `[CITED: CSS Values and Units Module — "ch" definition]`, `1ch` is defined as the advance measure of the `0` (ZERO, U+0030) glyph in the element's font — so this measurement is exactly what `1ch` will resolve to for any element styled with VT323.

**Corrected px-equivalences at the UI-SPEC's declared 20px body size** (UI-SPEC's own numbers in parentheses for comparison):

| Tier | UI-SPEC estimate | Corrected (measured) |
|------|-------------------|----------------------|
| `1ch` | ≈12px | **≈8px** |
| Compact (`32ch`) | ≈384px | **≈256px** |
| Default (`48ch`) | ≈576px | **≈384px** |
| Wide (`64ch`) | ≈768px | **≈512px** |

**Why this matters concretely:** Panels are meaningfully narrower in real pixels than the UI-SPEC's own arithmetic implies — about 33% narrower at every tier. This is generally *good* news for fitting content (less horizontal space consumed per panel than assumed), but it changes two things the planner needs to know:
1. The UI-SPEC's degrade-threshold framing ("roughly sub-280px after safe-area padding — narrow phone widths") was reasoning from the wrong px number. The corrected `32ch ≈ 256px` is *already* narrower than that 280px estimate — meaning the compact tier itself sits close to (or under, depending on device safe-area) the degrade threshold, not comfortably above it. Confirm on a real narrow-phone viewport (per `research/PITFALLS.md`'s existing real-device-testing guidance) whether the 32ch tier ever needs its own degrade fallback, not just widths below it.
2. Any layout math done "by eye" against the UI-SPEC's stated px figures during implementation will be wrong; use the corrected table above, or better, measure `1ch` directly against the built page once VT323 is loaded (`getComputedStyle` / a temporary debug outline) rather than trusting either document's number blindly.

This does not change any locked decision (D-12's tier scale is still `32ch`/`48ch`/`64ch` — the *character* counts are unaffected, only their pixel translation), so no re-approval is needed for the tiers themselves — only for any px-based reasoning built on top of them.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | **16.3.3** | App Router shell, dev/build tooling | `[VERIFIED: npm view next version]` — matches `research/STACK.md`'s pin exactly, current as of 2026-08-27 |
| React / React DOM | **19.2.8** | Component tree | `[VERIFIED: npm view react version / react-dom version]` — bundled default with Next 16.3.3, matches `research/STACK.md` |
| TypeScript | **7.0.2** (latest on registry) | Type safety | `[VERIFIED: npm view typescript version]`. Note: this is newer than the "5.x" figure in `research/STACK.md` — TypeScript crossed to a `7.x` major since that doc was written. `create-next-app` will resolve whatever is current at scaffold time; do not hand-pin an older major unless the scaffolded `package.json` needs adjusting for a specific reason. |
| ESLint | **10.9.1** | Lint (if chosen over Biome) | `[VERIFIED: npm view eslint version]` |
| `eslint-config-next` | **16.3.3** | Next.js-specific lint rules | `[VERIFIED: npm view eslint-config-next version]` — version-locked to the Next.js release, scaffolded automatically |
| `@types/node` | **26.4.0** | Node typings | `[VERIFIED: npm view @types/node version]` |
| `@types/react` | **19.2.18** | React typings | `[VERIFIED: npm view @types/react version]` |
| `@types/react-dom` | **19.2.5** | React DOM typings | `[VERIFIED: npm view @types/react-dom version]` |

**No other runtime packages are needed for this phase.** No Three.js (Phase 2), no `@types/three` (Phase 2), no `visx` (Phase 5), no `zustand` (Phase 6+, not even referenced by this phase's scope). CSS Modules and `next/font/google` are both built into Next.js — zero additional installs.

### Supporting

None beyond what `create-next-app` scaffolds. VT323 is fetched by `next/font/google` at build time from Google's CDN and self-hosted — it is **not** an npm package and has no `npm install` step.

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| ESLint (traditional) | Biome (`--biome` flag) | Faster, combines lint+format, but `research/STACK.md`'s "ESLint (Next.js default config)" recommendation and the project's own `.claude/CLAUDE.md` reference ESLint by name — stick with ESLint for consistency with prior research unless the user has a stated Biome preference (none found in CONTEXT.md) |
| ASCII substitution for box-drawing (this research's recommendation) | Custom `@font-face` + `unicode-range` + `size-adjust` donor-font layering | See Correction 1 above — more setup, only worth it if preserving the exact Unicode glyph look is a hard requirement |

**Installation:**
```bash
npx create-next-app@latest space-dashboard --typescript --no-tailwind --eslint --app --src-dir --import-alias "@/*" --turbopack
```

**Version verification performed this session:** `npm view next version` → `16.3.3`; `npm view react version` → `19.2.8`; `npm view react-dom version` → `19.2.8`; `npm view typescript version` → `7.0.2`; `npm view eslint version` → `10.9.1`; `npm view eslint-config-next version` → `16.3.3`. All checked 2026-08-27, all current.

## Package Legitimacy Audit

| Package | Registry | Verdict (seam) | Weekly Downloads | Source Repo | Disposition |
|---------|----------|-----------------|-------------------|--------------|-------------|
| `next` | npm | SUS (`too-new`) | 54.6M | github.com/vercel/next.js | **Approved** — "too-new" fires on latest-*version* publish date (2026-08-25, a routine point release), not package age. Official Vercel package, `[VERIFIED]` via direct registry read + STACK.md's own prior verification against the same registry. |
| `react` / `react-dom` | npm | OK | 173M / 162M | github.com/react/react | Approved |
| `typescript` | npm | OK | 275M | github.com/microsoft/TypeScript | Approved |
| `eslint` | npm | SUS (`too-new`) | 160M | github.com/eslint/eslint | **Approved** — same false-positive pattern as `next` (recent point release, not new package). |
| `eslint-config-next` | npm | SUS (`too-new`) | 31M | github.com/vercel/next.js | **Approved** — version-locked companion package to `next` itself, published same day as the `next` 16.3.3 release. |
| `@types/node`, `@types/react`, `@types/react-dom` | npm | SUS (`too-new`) | 428M / 161M / 134M | github.com/DefinitelyTyped/DefinitelyTyped | **Approved** — DefinitelyTyped publishes near-daily across its thousands of packages; "recently published" is normal cadence, not a risk signal. |

**Packages removed due to `[SLOP]` verdict:** none.
**Packages flagged as suspicious `[SUS]`:** `next`, `eslint`, `eslint-config-next`, `@types/node`, `@types/react`, `@types/react-dom` — all six are the *same* first-party/DefinitelyTyped packages `create-next-app` itself installs when scaffolding with the documented flags; none were independently sourced from search results or training-data guesswork, so there is no slopsquat-selection risk to gate behind a `checkpoint:human-verify`. The "too-new" heuristic is measuring release cadence for extremely high-traffic, actively-maintained infrastructure packages, which is expected to look "new" by that heuristic at almost any point in time. No additional checkpoint recommended for this phase's installs.

No packages were discovered via WebSearch or training-data guessing this phase — every package name above came directly from the official `create-next-app` CLI reference (`[CITED: nextjs.org/docs/app/api-reference/cli/create-next-app]`, fetched this session) or from what that CLI scaffolds automatically.

## Architecture Patterns

### System Architecture Diagram

```
Browser request
      │
      ▼
Next.js build output (static — no server logic, no data fetching)
      │
      ├─► app/layout.tsx  ──► next/font/google(VT323) generates a self-hosted
      │                       @font-face + CSS variable at BUILD time
      │                       (no runtime request to Google's CDN)
      │
      ├─► app/globals.css ──► :root custom properties (D-02 semantic tokens:
      │                       --color-bg, --color-nominal, --color-alert, ...)
      │
      ▼
app/page.tsx (single screen, no routes — RESP-01)
      │
      ├─► DashboardShell ('use client' only where sessionStorage is touched)
      │     │
      │     ├─► Canvas placeholder block (static markup, reserved dimensions — D-10)
      │     │      "SVH-based hero height (desktop 100svh / mobile 60svh)"
      │     │
      │     ├─► Panel (NEO FEED, SPACE WEATHER, SOLAR SYSTEM, SYSTEM LEGEND)
      │     │      ├─► ASCII top/bottom border rows (plain-text, ASCII glyphs — Correction 1)
      │     │      ├─► CSS side borders (border-left/right)
      │     │      └─► Body content — mock fixtures (D-11), 8-row scroll cap
      │     │
      │     ├─► Alert (">> CME DETECTED - INTENSITY: MODERATE" — CRT-05 format)
      │     │
      │     └─► CrtControl ('use client', reads/writes sessionStorage,
      │            writes --crt-intensity onto the root wrapper)
      │
      └─► Fixed CRT overlay (pseudo-element, position:fixed, pointer-events:none,
            z-index above all content) — scanlines + vignette, driven by
            --crt-intensity; phosphor glow applied per-text-element via text-shadow
```

### Recommended Project Structure

```
src/
├── app/
│   ├── layout.tsx        # next/font/google(VT323) load, globals.css import, <html>/<body>
│   ├── page.tsx           # renders <DashboardShell />
│   └── globals.css        # :root custom properties (all D-02 tokens), base resets, CRT overlay pseudo-element
├── components/
│   ├── shell/
│   │   └── DashboardShell.tsx   # 'use client' — layout composition, CRT root wrapper
│   ├── ui/
│   │   ├── Panel.tsx             # + Panel.module.css — ASCII border contract
│   │   ├── Alert.tsx             # + Alert.module.css — CRT-05 grammar
│   │   ├── Legend.tsx            # + Legend.module.css — RESP-04 palette legend
│   │   └── CrtControl.tsx        # 'use client' — cycling [FULL]/[REDUCED]/[OFF] control
│   └── canvas/
│       └── ScenePlaceholder.tsx  # + ScenePlaceholder.module.css — "SCENE :: OFFLINE"
├── lib/
│   ├── crt/
│   │   └── crtIntensity.ts       # pure get/set functions wrapping sessionStorage + try/catch fallback
│   └── fixtures/
│       ├── neoFixtures.ts        # D-11 realistic-density mock NeoWs-shaped data
│       └── donkiFixtures.ts      # D-11 realistic-density mock DONKI-shaped data
└── styles/
    └── tokens.css                 # optional split-out of :root custom properties if globals.css grows large
```

### Pattern 1: `next/font/google` with a required explicit weight

**What:** VT323 is a non-variable, single-weight (400) Google Font. Per the official Font Module reference `[CITED: nextjs.org/docs/app/api-reference/components/font, fetched 2026-08-27]`, the `weight` option is "Required if the font being used is not variable" — VT323 is not variable, so `weight: '400'` must be passed explicitly (it is also the *only* legal value for this font).

**Example:**
```tsx
// src/app/layout.tsx
// Source: nextjs.org/docs/app/api-reference/components/font (fetched 2026-08-27)
import { VT323 } from 'next/font/google';
import './globals.css';

const vt323 = VT323({
  weight: '400',           // required — VT323 is not a variable font
  subsets: ['latin'],
  display: 'optional',     // see Pattern 2 — NOT 'swap'
  variable: '--font-terminal',
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={vt323.variable}>
      <body>{children}</body>
    </html>
  );
}
```
Then in any `.module.css`: `font-family: var(--font-terminal), monospace;` — the `monospace` generic fallback is what a missing box-drawing glyph would fall through to if the ASCII substitution (Correction 1) is *not* applied.

### Pattern 2: `display: 'optional'`, not `'swap'`, to satisfy "no flash of fallback font"

**What:** Success criterion 2 requires VT323 to load "with no flash of fallback font." `display: 'swap'` (the option `research/STACK.md` did not specify and Next's own example defaults to) is defined to show the fallback font immediately and visibly swap once the custom font arrives — that IS a flash, by design `[CITED: developer.mozilla.org/docs/Web/CSS/@font-face/font-display — swap semantics; cross-checked via WebSearch aggregation of MDN-derived summaries]`. `display: 'optional'` instead gives the browser a very short window (commonly described as ~100ms) to use the font if it's already available, and if not, commits to the fallback for that page view with no later swap — eliminating the visible flash entirely, at the (here, negligible) cost of occasionally showing the fallback on a very slow first load.

**When to use:** Always for this phase's font — it's the only `display` value that actually satisfies "no flash," not `swap`. Combined with `next/font`'s automatic self-hosting (no CDN round-trip at runtime) and default `preload: true`, the font is very likely to win its own ~100ms window on any reasonable connection, since it ships as a same-origin static asset from the Vercel build, not a third-party request.

**Trade-off, stated honestly:** on a genuinely slow first load, `optional` means the fallback font (`monospace` generic, per the `variable` fallback chain) is used for that visit with no retry — acceptable here since this is a portfolio/learning project without a hard SLA on font delivery, and it's the direct mechanism the success criterion asks for.

### Pattern 3: CSS Modules — zero-config, but the file **must** be named `*.module.css` under Turbopack

**What:** Confirmed via official Next.js docs `[CITED: nextjs.org/docs/app/api-reference/turbopack, fetched 2026-08-27]`: under Turbopack (Next 16's default bundler), a plain `.css` file is **always treated as global CSS**, never as a CSS Module — unlike some older webpack configurations some tutorials assume. Any file meant to be a scoped CSS Module (used for `composes`, or simply imported as `import styles from './Panel.module.css'`) must have the literal `.module.css` extension. There is no `next.config` setting required to "enable" CSS Modules — it is inherent to the `.module.css` filename convention and works out of the box with zero configuration, for both webpack and Turbopack.

**Turbopack-specific gotcha:** Turbopack supports only the function-call form of the global escape hatch — `:global(...)` — and does **not** support the bare standalone `:local`/`:global` pseudo-classes some older CSS-Modules code uses `[CITED: nextjs.org/docs/app/api-reference/turbopack]`. If any global-selector escape is needed inside a `.module.css` file (unlikely for this phase's components, but possible for a shared base class), write `:global(.someClass)`, not `:global { .someClass { ... } }`.

**Token flow for this project:** `globals.css` (plain global CSS, imported once in `app/layout.tsx`) declares every `--color-*`/`--space-*`/`--crt-*` custom property on `:root`. Every `*.module.css` file consumes them via `var(--token-name)` — custom properties cascade through CSS Modules' scoping unaffected, since scoping only renames class selectors, not custom-property names, which remain plain CSS and are globally visible from `:root` regardless of which module reads them.

### Pattern 4: `sessionStorage` read without a hydration mismatch

**What:** `sessionStorage` (like all `window`/browser-only APIs) does not exist during Next.js's server render pass. Reading it directly in a component's render body produces different output on server vs. first client render — a hydration mismatch `[CITED: nextjs.org/docs/messages/react-hydration-error; cross-checked via WebSearch aggregation, consistent across multiple independent sources]`. The standard, current pattern: initialize React state to a fixed default (`'FULL'`), and only read the real persisted value inside a `useEffect` (which runs client-side, after the server-rendered markup has already matched), then update state if it differs.

**Concrete shape, including the required try/catch backstop (UI-SPEC's flagged backstop row — `sessionStorage.setItem` throws in Safari private browsing / blocked site data):**
```tsx
// src/lib/crt/crtIntensity.ts
export type CrtLevel = 'FULL' | 'REDUCED' | 'OFF';
const STORAGE_KEY = 'crt-intensity';
const VALID: CrtLevel[] = ['FULL', 'REDUCED', 'OFF'];

// In-memory fallback used when sessionStorage throws or returns something invalid.
let memoryFallback: CrtLevel = 'FULL';

export function readCrtLevel(): CrtLevel {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    return (VALID as string[]).includes(raw ?? '') ? (raw as CrtLevel) : memoryFallback;
  } catch {
    return memoryFallback; // Safari private mode / blocked storage: quota 0, setItem/getItem throw
  }
}

export function writeCrtLevel(level: CrtLevel): void {
  memoryFallback = level; // always update the in-memory fallback first — this is what makes the
                          // control still work for the rest of the session even if storage is blocked
  try {
    window.sessionStorage.setItem(STORAGE_KEY, level);
  } catch {
    // swallow — memoryFallback already holds the value; the control keeps working,
    // it just won't survive a tab reload in this one browsing mode.
  }
}
```
```tsx
// src/components/ui/CrtControl.tsx
'use client';
import { useEffect, useState } from 'react';
import { readCrtLevel, writeCrtLevel, type CrtLevel } from '@/lib/crt/crtIntensity';

export function CrtControl() {
  const [level, setLevel] = useState<CrtLevel>('FULL'); // server-safe default, matches first client render
  useEffect(() => { setLevel(readCrtLevel()); }, []);    // real value read only after mount — no mismatch
  useEffect(() => {
    document.documentElement.style.setProperty(
      '--crt-intensity', level === 'FULL' ? '1' : level === 'REDUCED' ? '0.4' : '0'
    );
  }, [level]);

  const cycle = () => {
    const next = level === 'FULL' ? 'REDUCED' : level === 'REDUCED' ? 'OFF' : 'FULL';
    setLevel(next);
    writeCrtLevel(next);
  };
  return <button onClick={cycle}>[ CRT: {level} ]</button>;
}
```
This is the "isClient"/lazy-init pattern the research confirms is still current and correct for React 18/19 + Next 15/16 `[CITED: WebSearch aggregation of nextjs.org/docs/messages/react-hydration-error plus multiple independent 2025-2026 write-ups, directionally consistent]`. `useSyncExternalStore` is a documented alternative for genuinely external, subscribable stores — not needed here since this is a one-shot read-on-mount value, not a value that changes from outside React's own event handlers.

### Anti-Patterns to Avoid

- **Reading `sessionStorage` directly in the component body or in a `useState` initializer function that runs during render:** still executes during SSR/first-paint and will mismatch. Always gate behind `useEffect`.
- **Using `display: 'swap'` and calling it "no flash":** `swap` is defined to flash by design; use `'optional'` (Pattern 2).
- **Writing `.css` files (no `.module.` in the name) and expecting CSS-Modules scoping under Turbopack:** they will be treated as global CSS with no scoping and no `composes` support (Pattern 3).
- **Leaving the literal `┌─┐│└┘` Unicode glyphs in `Panel` without the ASCII substitution or the font-face fallback fix:** will render a mixed-font, misaligned border (Correction 1).
- **Reasoning about panel width in px "by eye" from the UI-SPEC's stated `32ch ≈ 384px` etc.:** those numbers are ~33% too high; use the corrected table (Correction 2) or measure the built page directly.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|--------------|-----|
| Font self-hosting, layout-shift prevention | A manual `@font-face` + a hand-computed `size-adjust` for VT323 | `next/font/google` (Pattern 1/2) | Next.js computes the metric-matched fallback automatically (`adjustFontFallback`, default `true`); hand-rolling this is exactly the kind of build-time font-metrics math `next/font` exists to remove |
| CSS scoping | A BEM/naming-convention discipline to avoid collisions | CSS Modules (`.module.css`, zero config) | D-01 already locks this; no reason to hand-roll scoping discipline when the bundler does it |
| sessionStorage-with-fallback | A generic "storage adapter" abstraction layer | The ~15-line `crtIntensity.ts` pure module above | This project has exactly one persisted preference; a generic storage abstraction is premature indirection for a single call site |

**Key insight:** Nothing in this phase justifies a new dependency. Every problem here (fonts, CSS scoping, storage-with-fallback) has a built-in, zero-install answer in the stack already chosen.

## Common Pitfalls

### Pitfall 1: Tailwind is `create-next-app`'s *default* — it must be explicitly turned off
**What goes wrong:** Running `npx create-next-app@latest` without flags, or without carefully reading the interactive prompts, installs Tailwind CSS by default `[VERIFIED: nextjs.org/docs/app/api-reference/cli/create-next-app, fetched 2026-08-27 — "--tailwind: Initialize with Tailwind CSS config (default)"]`. This directly contradicts D-01.
**How to avoid:** Pass `--no-tailwind` explicitly in the scaffold command (see Installation above), or answer "No" to the Tailwind CSS prompt if scaffolding interactively.
**Warning signs:** A generated `tailwind.config.ts`/`postcss.config.mjs` referencing `@tailwindcss/postcss`, or `@import "tailwindcss"` in the generated `globals.css`.

### Pitfall 2: `next build` no longer runs the linter automatically (Next 16 change)
**What goes wrong:** Starting with Next.js 16, `next build` does **not** run ESLint automatically `[CITED: nextjs.org/docs/app/getting-started/installation, "Good to know: Starting with Next.js 16, next build no longer runs the linter automatically."]`. Prior-version training data / muscle memory that treats a clean `next build` as "lint passed" is now wrong.
**How to avoid:** Run `npm run lint` as its own explicit step (the scaffolded `package.json` includes a `lint` script calling the ESLint CLI directly, not `next lint`), separately from `next build`.

### Pitfall 3: The two VT323 measurement errors (Corrections 1 & 2 above)
Already covered in full above — repeated here only so this pitfalls list is a complete single-scan checklist. Verify glyph coverage and `ch` math before, not after, `Panel` is built.

### Pitfall 4: `svh` vs `dvh` — already correctly decided, don't second-guess it mid-implementation
**What goes wrong:** The UI-SPEC already locks `svh` (not `vh`, not `dvh`) for the canvas hero height, specifically so Phase 12's real-device pass is verification, not rework. A tempting "but `dvh` is more modern" instinct during implementation would silently undo that decision.
**How to avoid:** Use `100svh` (desktop) / `60svh` (mobile) exactly as specified; do not substitute `dvh` even though it is the more commonly recommended unit in general web-dev advice — this project's specific reasoning (a static floor that never jumps) is a deliberate, already-researched choice, documented in `research/PITFALLS.md`.

### Pitfall 5: A device with no personal NASA key or Node <20.9 blocks nothing this phase — but check anyway
**What goes wrong:** Nothing in this phase depends on NASA or Node version specifically, but a stale local Node install would silently produce confusing `next build`/Turbopack errors unrelated to any code written this phase.
**How to avoid:** See Environment Availability below — already confirmed fine on this machine.

## Code Examples

### Complete `globals.css` token skeleton (values from the approved-pending UI-SPEC, D-02/D-13/D-14)
```css
/* src/app/globals.css */
:root {
  /* Backgrounds */
  --color-bg: #060907;
  --color-surface: #0d130f;

  /* Nominal (green) — brightness steps carry meaning, not hue (D-14) */
  --color-nominal-dim: #2FA352;
  --color-nominal: #4CDB6E;
  --color-nominal-bright: #8CFFA8;

  /* Alert (magenta/violet) — reserved uses only, see UI-SPEC Color section */
  --color-alert-dim: #7A2E8A;   /* decorative only — fails AA as text, never render as text at this step */
  --color-alert: #C64AE6;
  --color-alert-bright: #F2A0E8;

  /* Structural chrome */
  --color-dim: #2FA352;

  /* CRT overlay intensity — driven by CrtControl (Pattern 4) */
  --crt-intensity: 1;
  --crt-scanline-opacity: calc(0.25 * var(--crt-intensity));
  --crt-vignette-opacity: calc(0.45 * var(--crt-intensity));

  /* Spacing (8-pt scale, D-12/UI-SPEC exception noted for ch-based Panel padding) */
  --space-xs: 4px; --space-sm: 8px; --space-md: 16px;
  --space-lg: 24px; --space-xl: 32px; --space-2xl: 48px; --space-3xl: 64px;
}

* { box-sizing: border-box; border-radius: 0; } /* Shape policy: no rounded corners anywhere */

body {
  background: var(--color-bg);
  color: var(--color-nominal);
  font-family: var(--font-terminal), monospace;
}

/* Single fixed CRT overlay — D-17 */
.crt-overlay {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 9999;
  background-image:
    repeating-linear-gradient(
      to bottom,
      rgba(0, 0, 0, var(--crt-scanline-opacity)) 0px,
      rgba(0, 0, 0, var(--crt-scanline-opacity)) 1px,
      transparent 1px, transparent 4px
    ),
    radial-gradient(
      ellipse at center,
      transparent 55%,
      rgba(0, 0, 0, var(--crt-vignette-opacity)) 100%
    );
}

@media (prefers-reduced-motion: no-preference) {
  .crt-overlay { transition: opacity 150ms ease; }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|-------------------|---------------|--------|
| `next lint` as the lint entry point | Direct ESLint CLI (`eslint`, `eslint --fix`) via `package.json` scripts | Next.js 16 | `next build` no longer runs lint; scaffolded projects already use the new scripts, but any copy-pasted older-tutorial script referencing `next lint` is stale |
| `display: 'swap'` treated as the default "safe" font-display choice | `display: 'optional'` for a genuinely no-flash requirement | Not a Next.js version change — a correction to a common general-web-dev default that doesn't fit this phase's specific success criterion | Prevents the exact flash success-criterion 2 rules out |
| Assuming Google-Fonts-era symbol/box-drawing coverage carries over to purpose-built pixel/terminal fonts like VT323 | Verify glyph coverage per font, per project, by inspecting the actual served file | N/A — this is a per-font fact, not a platform change | Prevents the misaligned-border failure mode this research caught |

**Deprecated/outdated:** None specific to this phase beyond the two items above — Next.js 16, React 19.2, and CSS Modules are all current, non-deprecated, actively-documented APIs as of this research date.

## Runtime State Inventory

Not applicable — this is a greenfield phase (first phase of a new project), not a rename/refactor/migration. No prior stored data, live service config, OS-registered state, secrets, or build artifacts exist to migrate. **Nothing found in any category — verified by `git ls-files` showing only `.planning/` documents and `.claude/CLAUDE.md` prior to this phase.**

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|-----------------|
| A1 | The Google Fonts export name for VT323 in `next/font/google` is the literal identifier `VT323` (no underscore substitution needed, since it's a single "word" even though it contains digits) | Pattern 1 code example | Low — if wrong, a TypeScript import error surfaces immediately at build time (fails loudly, not silently); confirm against `node_modules/next/dist/google/font-data.json` once installed (part of the mandatory post-scaffold docs read) |
| A2 | The historical framing that DEC VT320 terminals used DEC Special Graphics (not Unicode box-drawing) for line art | Correction 1, "Recommendation" paragraph | None — offered as supporting color only, explicitly marked not load-bearing, does not affect the technical recommendation |
| A3 | `display: 'optional'`'s "~100ms" block-period figure is approximate/commonly-cited rather than a hard spec number pinned to this exact font/browser combination | Pattern 2 | Low — the *mechanism* (no swap after the window, commit to fallback) is spec-defined and CITED; only the exact millisecond figure is a commonly-repeated approximation across sources, not independently timed this session |

**If this table is empty:** N/A — see above; all three assumptions are low-risk and none affect a locked decision or a security/compliance-relevant claim.

## Open Questions

1. **Should the UI-SPEC's literal `┌─ NEO FEED ─┐` example be formally amended, or is a `checkpoint:human-verify` task during planning sufficient?**
   - What we know: the UI-SPEC's Checker Sign-Off table is still unchecked/pending, so this correction can land before formal approval rather than as a change to an already-signed-off artifact.
   - What's unclear: whether the user/checker prefers the ASCII substitution outright or wants the more complex Unicode-preserving `@font-face` layering option (both are documented above).
   - Recommendation: default to the ASCII substitution (simpler, verified-working, in keeping with the project's learning-over-polish priority) and let the planner add a lightweight confirmation task rather than blocking on a full UI-SPEC re-run.

2. **Does the corrected `32ch ≈ 256px` compact tier need its own degrade path on real narrow phones, given it's already near the previously-estimated 280px threshold?**
   - What we know: the character-count tiers (32/48/64ch) are unaffected; only their px translation changed.
   - What's unclear: exact safe-area/viewport-width behavior on the narrowest currently-relevant phones (this research did not have a real device to test against, per `research/PITFALLS.md`'s own standing guidance that emulation is insufficient for real viewport behavior).
   - Recommendation: build to the corrected `ch` values, then do one real-device or precise-emulation pass during this phase's own verification (not deferred to Phase 12, since RESP-01/04 are this phase's requirements) to confirm the compact tier never needs a further fallback below itself.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|--------------|-----------|---------|----------|
| Node.js | Next.js 16 minimum (20.9+) | ✓ | 20.20.2 `[VERIFIED: node --version, this session]` | — |
| npm | Package install/scripts | ✓ | 10.8.2 `[VERIFIED: npm --version, this session]` | — |
| Internet access (for `create-next-app` + Google Fonts fetch at build time) | Scaffolding, font self-hosting | ✓ (confirmed — this session downloaded the live VT323 file and queried the live npm registry) | — | — |

**Missing dependencies with no fallback:** none.
**Missing dependencies with fallback:** none — everything required for this phase is present and current on this machine.

## Validation Architecture

**Honest assessment:** this is a CSS/design-token/scaffolding phase. There is no business logic, no data transformation, and no async behavior to unit test in the traditional sense — the `Panel`/`Alert` components render static mock fixtures, the CRT overlay is pure CSS, and the only piece of actual *logic* in the whole phase is the ~15-line `crtIntensity.ts` module (Pattern 4) and its try/catch fallback. Installing a full test framework (Vitest/Jest + Testing Library) for one small pure-function module and a suite of visual/CSS checks would be disproportionate setup cost for what it covers, and the project has no existing test infrastructure to build on yet (first phase, greenfield).

**Recommendation: no test framework installed this phase.** Verification for this phase is a combination of an automated build gate and a manual/visual checklist, not unit tests:

### Automated gate
| Check | Command | Confirms |
|-------|---------|----------|
| Type-check + build | `npm run build` | No TypeScript errors, Turbopack production build succeeds, `next/font` resolves correctly |
| Lint | `npm run lint` | ESLint rules pass (remember: `next build` does NOT run this automatically per Pitfall 2 — run it as its own step) |

### Manual/visual verification checklist (maps to the phase's 6 success criteria)
| Success Criterion | How to verify |
|---|---|
| 1. Single scrolling page, correct at phone + desktop width | Resize browser across the 768px breakpoint; confirm no separate routes exist (`app/` has one `page.tsx`) |
| 2. Palette + VT323 applied, no flash of fallback font | Throttle network in DevTools, hard-reload, watch for any visible font swap (should be none, per `display: 'optional'`, Pattern 2) |
| 3. Terminal-format alert from a reusable component | Confirm `Alert` renders the exact `>> CME DETECTED - INTENSITY: MODERATE` grammar from mock fixtures |
| 4. CSS CRT treatment visible but data stays legible | Screenshot a populated `Panel` at full CRT intensity; visually confirm text is readable, not the flat-swatch check `research/PITFALLS.md` warns is insufficient |
| 5. Legend explains palette colors | Confirm `LEGEND` panel renders both color-meaning lines |
| 6. CRT control reduces/disables, persists for session | Toggle the control, reload the tab (not a fresh session) — confirm the choice held. Separately, force `sessionStorage.setItem` to throw (e.g. via a DevTools override or a private-browsing test) and confirm the control still functions in-memory rather than crashing — this is the one row the UI-SPEC itself calls a "backstop" that can silently ship broken if untested. |

### Deferred, not skipped
`lib/crt/crtIntensity.ts` is written as a pure, dependency-free module specifically so it *is* trivially unit-testable the moment a test runner exists — which naturally happens in Phase 3 (NASA Data Layer & Resilience), where a test framework is a much stronger fit (fetch mocking, rate-limit-state assertions). Extracting the try/catch logic into its own pure functions now (rather than inlining it in `CrtControl.tsx`) is this phase's concession to that future test, at zero cost today.

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|----------------|---------|--------------------|
| V2 Authentication | No | No accounts, no login — out of scope for the whole project |
| V3 Session Management | No | `sessionStorage` here is a UI preference cache, not an authentication session |
| V4 Access Control | No | Public, read-only dashboard |
| V5 Input Validation | Marginal — yes | The one input this phase reads is the `sessionStorage` value itself (an untrusted-ish source, since it's editable via DevTools by the same-origin user). `readCrtLevel()` (Pattern 4) validates against the fixed three-value enum (`FULL`/`REDUCED`/`OFF`) before use and falls back to a safe default (`FULL`) for anything else — this is the correct, minimal control for this input surface. |
| V6 Cryptography | No | No secrets, no crypto operations this phase |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|-----------------------|
| Corrupted/manually-edited `sessionStorage` value causing an unexpected UI state | Tampering (low severity — self-inflicted, same-origin, no data exposure) | Enum validation with safe fallback (Pattern 4) — already the recommended implementation |
| Rendering any future dynamic string (not this phase's static mock fixtures, but a pattern worth establishing now) via `dangerouslySetInnerHTML` | Tampering / XSS | Use React's default text rendering (`{value}`) for all `Alert`/`Panel` content — already implied by using mock fixtures as plain data, worth stating explicitly as the pattern to carry into Phase 3/4/5 when real NASA text fields arrive |

## Sources

### Primary (HIGH confidence — directly fetched/inspected this session)
- `fonts.googleapis.com/css2?family=VT323&display=swap` and `fonts.gstatic.com/s/vt323/v18/pxiKyp0ihIEF2hsY.ttf` — downloaded and inspected via `fontkit` 2.0.4; source of both Corrections 1 and 2
- `nextjs.org/docs/app/api-reference/cli/create-next-app` (fetched 2026-08-27, page dated `lastUpdated: 2026-08-25`) — CLI flags, defaults, prompts
- `nextjs.org/docs/app/getting-started/installation` (fetched 2026-08-27, page dated `lastUpdated: 2026-07-21`) — scaffolding flow, `next build` no longer lints, `node_modules/next/dist/docs/` confirmation
- `nextjs.org/docs/app/api-reference/components/font` (fetched 2026-08-27, page dated `lastUpdated: 2025-08-06`) — `next/font/google` full API reference
- `nextjs.org/docs/app/api-reference/turbopack` (fetched 2026-08-27, via WebSearch summary of the live page) — CSS Modules `.module.css` requirement, `:global(...)` syntax constraint under Turbopack
- `npm view next / react / react-dom / typescript / eslint / eslint-config-next / @types/node / @types/react / @types/react-dom version` — all run this session against the live npm registry
- `gsd-tools query package-legitimacy check` — run against all 9 scaffolded packages this session

### Secondary (MEDIUM confidence — WebSearch aggregation cross-checked against multiple independent sources)
- `sessionStorage`/hydration-mismatch pattern (multiple independent 2025-2026 write-ups, directionally consistent, cross-checked against `nextjs.org/docs/messages/react-hydration-error`)
- `display: 'optional'` vs `'swap'` semantics (MDN-derived summaries, consistent across CSS-Tricks, Smashing Magazine, and font-performance-focused blogs)
- CSS `ch` unit spec definition (consistent across meyerweb.com, MDN glossary, W3C mailing list archive)
- Container query browser support (>93% global support, Chrome/Edge 105+, Firefox 110+, Safari 16+ — consistent across caniuse-derived summaries)

### Tertiary (LOW confidence — noted, not relied on for any recommendation)
- The refuted "VT323 has 11 box-drawing characters" web-aggregation claim — explicitly superseded by the direct file inspection in Correction 1; kept in this document only as a documented refutation, not as a source for any claim above

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — every version verified directly against the live npm registry this session
- Architecture: HIGH — CSS Modules/Turbopack/`next/font` behavior confirmed via official current Next.js docs, not training-data recall
- Font glyph coverage & `ch` math (Corrections 1/2): HIGH — verified by direct binary inspection of the exact file `next/font/google` will serve, cross-checked against 3 independent metric sources inside the same file
- Pitfalls: HIGH for Next-16-specific items (official docs), MEDIUM for general web-dev pattern items (WebSearch aggregation)

**Research date:** 2026-08-27
**Valid until:** ~30 days for the Next.js/npm version pins (fast-moving ecosystem, re-verify versions if planning is delayed); indefinite for the VT323 glyph-coverage and `ch`-ratio findings (font metrics don't change) unless the project switches away from VT323 or Google updates the VT323 file at its stable URL (unlikely — Google Fonts versions are stable per-URL).
