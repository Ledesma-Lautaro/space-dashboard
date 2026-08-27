---
phase: 1
slug: terminal-design-system-app-shell
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-08-26
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

**Deliberate deviation from the default shape, recorded up front.** `01-RESEARCH.md` §Validation Architecture argues — and this strategy accepts — that installing a unit-test framework in this phase would be disproportionate. The phase produces CSS custom properties, CSS Modules, static presentational components fed by mock fixtures, and exactly one piece of real logic (`lib/crt/crtIntensity.ts`, ~15 lines). There is no async behavior, no data transformation, and no business logic to sample.

Validation here is therefore **an automated build/type/lint gate plus a bounded manual checklist**, not a test suite. The one genuinely fragile behavior (the `sessionStorage` throw path) is called out as a required manual verification rather than being allowed to ship unexercised.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | none this phase — see deviation note above. Phase 3 (NASA Data Layer & Resilience) is where a runner earns its setup cost (fetch mocking, rate-limit-state assertions). |
| **Config file** | none |
| **Quick run command** | `npm run lint` |
| **Full suite command** | `npm run lint && npm run build` |
| **Estimated runtime** | ~30–60 seconds for the full gate on a cold Turbopack build |

---

## Sampling Rate

- **After every task commit:** Run `npm run lint`
- **After every plan wave:** Run `npm run lint && npm run build`
- **Before `/gsd-verify-work`:** Full gate must be green **and** the manual checklist below must be walked
- **Max feedback latency:** ~60 seconds

> Note: `next build` does **not** run ESLint automatically in Next 16 (`01-RESEARCH.md` Pitfall 2). `npm run lint` must be its own step — a green build alone is not the gate.

---

## Per-Task Verification Map

Task IDs are assigned by the planner; this map is seeded by validation type and will be reconciled against `01-PLAN.md` at execution time.

| Task group | Requirement | Test Type | Automated Command | Manual | Status |
|------------|-------------|-----------|-------------------|--------|--------|
| Scaffolding + installed-docs reconciliation | — | build | `npm run build` | — | ⬜ pending |
| Design tokens (palette, spacing, type scale) | CRT-03 | build | `npm run build` | visual | ⬜ pending |
| VT323 loading via `next/font` | CRT-04 | build | `npm run build` | visual (no FOUT) | ⬜ pending |
| `Panel` component + ASCII border mechanism | CRT-02 | build + lint | `npm run lint && npm run build` | visual (alignment at each tier) | ⬜ pending |
| `Alert` component + terminal grammar | CRT-05 | build + lint | `npm run lint && npm run build` | visual | ⬜ pending |
| CRT overlay (scanlines, vignette, glow) | CRT-02 | build | `npm run build` | visual (legibility) | ⬜ pending |
| CRT intensity control + persistence | CRT-10 | build + lint | `npm run lint && npm run build` | **manual, required — see M-01** | ⬜ pending |
| Responsive shell + canvas placeholder | RESP-01 | build | `npm run build` | visual (both breakpoints) | ⬜ pending |
| Palette legend | RESP-04 | build | `npm run build` | visual | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

No test-infrastructure Wave 0 for this phase — no framework is installed.

The functional equivalent of Wave 0 here is the **scaffolding task**, which must complete before any other task can run, and which carries one non-negotiable follow-up:

- [ ] `npx create-next-app` with `--no-tailwind` (Tailwind is the CLI default — D-01 forbids it)
- [ ] **Read `node_modules/next/dist/docs/` immediately after install and reconcile any divergence from `research/STACK.md` before writing app code.** Required by `.claude/CLAUDE.md`; the installed docs take precedence over any Next.js claim in the research.
- [ ] Measure VT323's real character advance in the browser and set the Panel `ch` tier scale from the measurement (the UI-SPEC's original 32/48/64ch scale is superseded — see `01-UI-SPEC.md` §ASCII Border Contract corrections)

---

## Manual-Only Verifications

| ID | Behavior | Requirement | Why Manual | Test Instructions |
|----|----------|-------------|------------|-------------------|
| **M-01** | CRT control survives a `sessionStorage` write failure | CRT-10 | No test runner this phase, and the failure only occurs under a browser storage policy that cannot be reproduced by a build check. This is the phase's single backstop item — the one thing that can ship silently broken. | Open the page in Safari private browsing (quota 0), **or** override `Storage.prototype.setItem` in DevTools to throw. Toggle the CRT control. It must continue to work against in-memory state and must not throw an uncaught error or blank the page. |
| M-02 | No flash of fallback font | CRT-04 / SC-2 | FOUT is a timing-visual behavior; a build check cannot observe it. | Throttle the network in DevTools, hard-reload, and watch for a font swap. There should be none (`display: 'optional'`). |
| M-03 | CRT effect visible but data text stays legible | CRT-02 / SC-4 | This is exactly the trap `research/PITFALLS.md` names: flat-swatch contrast passes while composited output erodes legibility. Only a screenshot of the real composite answers it. | Screenshot a populated `Panel` at full CRT intensity. Confirm numeric data is comfortably readable, not merely present. |
| M-04 | ASCII border alignment holds at every tier | CRT-02 | Character-grid alignment against real font metrics; no static check catches a half-character drift. | At each panel tier, confirm the top and bottom rows align exactly with the CSS side borders, with no fractional-character overhang. Then narrow below the degrade threshold and confirm the clean fallback to CSS borders. |
| M-05 | Single scrolling page renders correctly at both breakpoints | RESP-01 / SC-1 | Layout correctness is visual. | Resize across the breakpoint. Confirm `app/` contains exactly one `page.tsx` and no route segments. |
| M-06 | Legend renders and explains both palette colors | RESP-04 / SC-5 | Visual content check. | Confirm the legend panel renders both color-meaning lines. |

---

## Validation Sign-Off

- [ ] Automated gate (`npm run lint && npm run build`) green
- [ ] **M-01 executed and passing** — non-negotiable; this is the phase's one silently-breakable behavior
- [ ] M-02 through M-06 walked and recorded
- [ ] `node_modules/next/dist/docs/` read and reconciled against `research/STACK.md`
- [ ] VT323 advance measured and `ch` tier scale set from the measurement, not the superseded estimate
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
