# Space Dashboard — Research Summary

**Project:** Space Dashboard (Asteroides + Clima Espacial)
**Domain:** Client-side data visualization — Next.js + vanilla Three.js consuming NASA REST APIs
**Researched:** 2026-08-26
**Confidence:** HIGH

## Executive Summary

The Space Dashboard is a client-only, single-screen portfolio piece bridging data from NASA APIs with a 3D visualization in Three.js, styled retro CRT aesthetic. Core value: learning Three.js deeply by building from vanilla APIs, not abstractions.

Recommended approach: prove the highest-risk piece first (React↔Three.js boundary). This requires proving the component can mount, run a render loop, and dispose cleanly under React StrictMode. Second critical area: NASA API resilience with graceful rate-limit states. Third: balance CRT aesthetic with legibility.

**Stack:** Next.js 16.3.3, Three.js 0.185.1 (exact pin), React 19.2.x, @types/three, visx, EffectComposer + hand-written ShaderPass, VT323 font, Vercel. Critical: read node_modules/next/dist/docs/ once installed — it takes precedence if it diverges from this research.

## Key Findings

### Recommended Stack

Next.js 16.3.3 with React 19.2.x bundled. Next.js 16 has breaking changes but none affect a 100%-client-side app.

Three.js 0.185.1 must be pinned exactly (not ^0.185.1). Install @types/three as dev dependency.

WebGLRenderer, not WebGPURenderer, for v1 (classic Three.js is the stated learning goal).

EffectComposer + custom ShaderPass, not pmndrs postprocessing (pre-built effects skip the shader-writing exercise).

visx for charting (30–40KB gzipped vs. Recharts 150KB). SVG's per-element interactivity is simpler for discrete events.

VT323 (via next/font/google) for terminal monospace. Vercel deployment requires no special configuration. NASA API key in NEXT_PUBLIC_NASA_API_KEY.

### Expected Features

Table Stakes: 3D solar system, Asteroids in 3D, CMEs as visual effects, Click-to-inspect HUD overlay, Asteroid list + notability heuristic, DONKI alert feed, Activity timeline, CRT filter, Loading/error states, Mobile-responsive.

Differentiators: Asteroids/CMEs wired into 3D scene, Orbit ellipses from real orbital elements, Physically-driven CME visuals, Camera focus/follow, Time scrubber.

Anti-feature: Do NOT build a "risk score" implying impact probability.

### Architecture Approach

React owns component lifecycle and data fetching; Three.js owns the 3D scene and render loop; Zustand store bridges selection state. SceneCanvas (React) mounts SceneEngine (plain TS class) via useEffect with full setup/teardown symmetry (required for StrictMode).

Data fetching in React hooks (useNeoWsFeed, useDonkiEvents) with independent error states. Selection state in Zustand: raycasting calls useSceneStore.getState().selectObject(id); React subscribes via useSceneStore((s) => s.selectedId).

Major components: SceneCanvas (React), SceneEngine (plain TS), data hooks, Zustand store, Layer classes, EffectComposer chain.

### Critical Pitfalls

1. NASA rate limit exhaustion (DEMO_KEY 30/hr, 50/day per IP) — Mitigation: personal key, track X-RateLimit-Remaining, cache, batch.
2. NeoWs 7-day max range — Mitigation: validate client-side, never >7 days.
3. React StrictMode double-mount — Mitigation: complete, symmetric dispose().
4. Mobile postprocessing DPR performance — Mitigation: cap DPR to 2, low-power fallback, real phone testing.
5. Photosensitive seizure risk (WCAG 2.3.1 >3 flashes/sec) — Mitigation: keep scanline <3Hz, prefers-reduced-motion gate, verification.
6. WebGL context loss on mobile — Mitigation: webglcontextlost/restored listeners, SIGNAL LOST state, pause on document.hidden.
7. CRT effect over text reduces legibility — Mitigation: full intensity on 3D only, reduce over HUD text, keep data text as DOM HTML.

## Implications for Roadmap

11-phase structure:

1. Terminal Design System — CRT palette, monospace fonts, layout grid
2. Bare Three.js Boundary (HIGHEST-RISK) — Prove React↔Three.js under StrictMode
3. NASA Data Fetching + 2D Panels — Rate-limit handling, error states
4. Static Solar System Base — Sun, planets, orbit rings
5. Data-Driven Asteroid Layer — Wire NeoWs data
6. CME/Event Layer — Wire DONKI data
7. Raycasting + Selection Store — Click-to-pick functionality
8. HUD Overlay + 2D↔3D Sync — Terminal detail panel
9. CRT Postprocessing — EffectComposer, mobile degrade, photosensitivity check
10. Mobile Polish + Responsive — Real-device testing, context loss, viewport fix
11. Deploy + Documentation — Vercel, README, case study

Phases needing research: Phase 2 (StrictMode), Phase 3 (rate-limit headers), Phase 7 (Pointer Events), Phase 9 (photosensitivity, DPR, CRT legibility).

## Confidence Assessment

| Area | Confidence | Notes |
|------|-----------|--------|
| Stack | HIGH | Verified vs. npm registry. Check node_modules/next/dist/docs/ when installed. |
| Features | HIGH | Verified vs. official NASA docs. NeoWs lack of Torino/Palermo well-established. |
| Architecture | MEDIUM-HIGH | Official React docs + community. Zustand authoritative. Pattern is best practice. |
| Pitfalls | HIGH | Verified vs. api.data.gov, W3C WCAG 2.3.1, Khronos WebGL, official React docs. |

Overall: HIGH — ready for roadmap. Remaining uncertainty: design decisions (asteroid sizing, CRT intensity) and real-device validation (DPR impact, photosensitivity).

Gaps: Next.js doc drift (verify once installed), asteroid sizing (user choice), photosensitivity tooling (PEAT or manual frame-stepping), CRT intensity (screenshot + iterate), mobile thresholds (real device test).

## Sources

Primary (HIGH): npm registry, official Three.js/React/Next.js/Zustand docs, W3C WCAG 2.1, api.data.gov, NASA CCMC DONKI.

Secondary (MEDIUM): Third-party NASA client libs, web search aggregation, Three.js forums, Font Squirrel/Google Fonts.

Tertiary (LOW): Pointer Events API specifics, CRT scanline frequency, mobile GPU device tiers (all need real testing).

---

*Research completed: 2026-08-26*
*Ready for roadmap: YES*
