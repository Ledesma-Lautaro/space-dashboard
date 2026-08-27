# Roadmap: Space Dashboard — Asteroides + Clima Espacial

## Overview

The build starts 2D and risk-first: a terminal design system that needs no Three.js, then the single highest-risk piece of the whole project — the React↔Three.js lifecycle boundary — proven with a placeholder scene before anything is layered on it. NASA data plumbing runs on a track deliberately decoupled from the 3D work, so rate limits never block rendering progress and vice versa. Only once the panels are live and the static scene graph exists does the data flow into 3D: asteroid and CME layers, then real orbital ellipses derived from NeoWs orbital elements — the densest learning target in the project, given its own phase on purpose. Interaction follows (raycast → select → HUD → camera follow), and the CRT shader chain lands last among scene work, tuned against a scene that already has its final visual complexity, with the DPR cap, flicker-frequency cap and reduced-motion branch built into it rather than retrofitted. The project closes on a real phone, a live Vercel URL, and a case study written from understanding.

## Phases

**Phase Numbering:**

- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Terminal Design System & App Shell** - CRT visual language, VT323 type, panel components and the single-screen responsive shell — no Three.js, no data
- [ ] **Phase 2: React↔Three.js Render Boundary** - Prove StrictMode-safe mount/dispose, SSR boundary and context-loss handling with a trivial placeholder scene
- [ ] **Phase 3: NASA Data Layer & Resilience** - One client-side fetch layer with loading, rate-limited, unavailable and empty states, decoupled from the 3D scene
- [ ] **Phase 4: Asteroid Classifier Panel** - NEO list, notability heuristic with raw inputs and disclaimer, sorting, filtering and detail view
- [ ] **Phase 5: Space Weather Panel & Timeline** - DONKI bulletins, flares, storms and CMEs plus a hand-built SVG activity timeline
- [ ] **Phase 6: Static Solar System Scene Graph** - Stylized sun, planets and orbit lines with camera controls — the hierarchy data layers attach to
- [ ] **Phase 7: Data-Driven Scene Layers** - Fetched NEOs and DONKI CMEs become 3D objects via a diffing update pattern
- [ ] **Phase 8: True Orbital Ellipses** - Real ellipses computed from NeoWs orbital elements, derived and documented from first principles
- [ ] **Phase 9: Raycasting & Selection** - Pointer and touch picking with a drag-vs-tap threshold, writing to a shared selection store
- [ ] **Phase 10: HUD Overlay & Bidirectional Selection** - Terminal HUD over the canvas, 2D↔3D selection sync, camera focus and follow
- [ ] **Phase 11: CRT Postprocessing Chain** - Hand-written EffectComposer passes with flicker cap, reduced-motion branch and DPR/mobile degrade built in
- [ ] **Phase 12: Real-Device Hardening, Deploy & Case Study** - Mobile viewport fix, Vercel deploy and a README written from understanding

## Phase Details

### Phase 1: Terminal Design System & App Shell

**Goal**: The dashboard's visual language exists as a reusable terminal design system, and the single-screen shell it lives in renders on mobile and desktop
**Depends on**: Nothing (first phase)
**Requirements**: CRT-02, CRT-03, CRT-04, CRT-05, CRT-10, RESP-01, RESP-04
**Success Criteria** (what must be TRUE):

  1. User loads one scrolling page with no separate routes, and it lays out correctly at both phone width and desktop width
  2. User sees the phosphor-green + magenta/violet on deep black palette and the VT323 pixel monospace face applied consistently, loaded through `next/font` with no flash of fallback font
  3. User sees alert content rendered in terminal format (e.g. `>> CME DETECTED - INTENSITY: MODERATE`) from a reusable panel component
  4. User sees a CSS-level CRT treatment on 2D panels that is visibly present but leaves data text fully legible
  5. User can read a legend explaining what each palette color means
  6. User can reduce or turn off the CRT effect from a visible in-theme control, and the choice holds for the session

**Plans**: 1/7 plans executed

Plans:

- [x] 01-01-PLAN.md — Scaffold Next.js 16 App Router without a utility-CSS framework, and reconcile the installed Next.js docs against the stack research
- [ ] 01-02-PLAN.md — Tracer: end-to-end terminal slice — VT323, semantic tokens, one ASCII-chrome panel, the fixed CRT overlay and a persisting intensity control
- [ ] 01-03-PLAN.md — Panel tier scale from the measured character advance, deterministic truncation, eight-row overflow cap and the sub-compact degrade path
- [ ] 01-04-PLAN.md — Typed NeoWs/DONKI payload types, realistic-density mock fixtures, and the Alert component with the fixed terminal grammar
- [ ] 01-05-PLAN.md — Populated NEO FEED and SPACE WEATHER panels mounted in the shell
- [ ] 01-06-PLAN.md — Palette legend strip explaining the colour semantics, hosting the CRT intensity control
- [ ] 01-07-PLAN.md — Scene placeholder at reserved canvas dimensions plus the single-breakpoint responsive contract

**UI hint**: yes

### Phase 2: React↔Three.js Render Boundary

**Goal**: A trivial Three.js scene mounts, runs, resizes and tears down cleanly inside React/Next.js — proving the lifecycle pattern every later 3D phase inherits
**Depends on**: Phase 1
**Requirements**: SCENE-03, SCENE-04, SCENE-09, RESP-02
**Success Criteria** (what must be TRUE):

  1. User sees a placeholder scene (sun plus one orbit ring) animating on load, with zero hydration warnings and no `window is not defined` crash under `next build && next start`, not just `next dev`
  2. Scene runs under React StrictMode with exactly one canvas, one renderer and one animation loop — behavior is identical with StrictMode on and off
  3. Repeated mount/unmount cycles show no growth in `renderer.info.memory` geometry and texture counts, and the developer can state which dispose call releases which resource
  4. Forcing context loss shows an in-theme "SIGNAL LOST" state instead of a blank canvas, and the scene recovers on `webglcontextrestored`
  5. Resizing the window or rotating the device resizes the canvas without stretching or squashing the rendered scene

**Plans**: TBD
**UI hint**: yes

### Phase 3: NASA Data Layer & Resilience

**Goal**: Every NASA request flows through one client-side fetch layer whose four distinct states are visible in terminal form, so the dashboard is never blank
**Depends on**: Phase 1
**Requirements**: DATA-01, DATA-02, DATA-03, DATA-04, DATA-05, DATA-06, DATA-07, DATA-08
**Success Criteria** (what must be TRUE):

  1. User sees a distinct terminal loading state while requests are in flight — no blank regions at any point
  2. User hitting HTTP 429 sees a rate-limited state naming the exhausted quota and when it resets, visually distinct from both the 5xx/timeout unavailable state and the "no events in range" empty state
  3. User can press a terminal refresh control to re-fetch every source without reloading the page
  4. User whose NeoWs request fails still sees DONKI data, and vice versa — the two sources degrade independently
  5. A range exceeding NeoWs' 7-day or DONKI's 30-day cap is clamped or blocked client-side before any request leaves the browser

**Plans**: TBD
**UI hint**: yes

### Phase 4: Asteroid Classifier Panel

**Goal**: Users can browse, sort and inspect near-Earth objects with a notability heuristic that never overstates what NeoWs data supports
**Depends on**: Phase 3
**Requirements**: NEO-01, NEO-02, NEO-03, NEO-04, NEO-05, NEO-06, NEO-07
**Success Criteria** (what must be TRUE):

  1. User sees a list of NEOs for the selected range showing name, close-approach date, miss distance, relative velocity and estimated diameter as a min–max range
  2. User sees NASA's `is_potentially_hazardous_asteroid` flag surfaced verbatim as NASA's own classification, visually separate from the app's notability tier
  3. User sees each NEO's three-level notability tier next to the raw miss distance, velocity and diameter it was derived from, alongside a persistent disclaimer that the tier is a heuristic and not an impact risk assessment
  4. User can sort and filter by notability tier and miss distance, and can open a detail view listing previous and upcoming close approaches
  5. User attempting a date range longer than 7 days is blocked before submission

**Plans**: TBD
**UI hint**: yes

### Phase 5: Space Weather Panel & Timeline

**Goal**: Users can read recent solar activity as terminal bulletins and see it plotted against time
**Depends on**: Phase 3
**Requirements**: SW-01, SW-02, SW-03, SW-04, SW-05, SW-06
**Success Criteria** (what must be TRUE):

  1. User reads DONKI notification bulletins rendered from `messageBody` in monospaced terminal format
  2. User sees flares with class type and peak time, CMEs with start time and source location, and geomagnetic storms with the Kp index mapped to the NOAA G1–G5 scale
  3. User sees a hand-built SVG timeline plotting flares, storms and CMEs against time across the fetched window
  4. User attempting a DONKI window longer than 30 days is blocked before submission

**Plans**: TBD
**UI hint**: yes

### Phase 6: Static Solar System Scene Graph

**Goal**: The stylized solar system exists as a navigable scene graph that the data-driven layers can attach to without restructuring
**Depends on**: Phase 2
**Requirements**: SCENE-01, SCENE-02, SCENE-08
**Success Criteria** (what must be TRUE):

  1. User sees a sun and planets as flat-shaded spheres with orbits as line geometry — schematic scale, no textures
  2. User can orbit, pan and zoom the camera with both mouse and touch
  3. User sees a persistent "not to scale" label so the schematic scale is never mistaken for accuracy
  4. The scene graph is organized into named pivot groups, and the developer can state which group owns which transform and why

**Plans**: TBD
**UI hint**: yes

### Phase 7: Data-Driven Scene Layers

**Goal**: Fetched NASA data becomes 3D objects — asteroids placed and sized by a documented mapping, CMEs shaped by real CME analysis parameters
**Depends on**: Phase 6 (scene graph), Phase 4 and Phase 5 (fetched NeoWs and DONKI data)
**Requirements**: SCENE-05, SCENE-07
**Success Criteria** (what must be TRUE):

  1. User sees the fetched NEOs as objects inside the scene, positioned and sized by a documented schematic mapping from miss distance and estimated diameter
  2. User sees CMEs as cones expanding from the Sun whose direction and width come from the real `latitude`, `longitude` and `halfAngle`, and whose expansion reflects `speed`
  3. Re-fetching updates both layers by diffing objects by id — no full scene rebuild, and removed objects leave no geometries or materials behind
  4. The developer can point at any asteroid on screen and explain from the mapping function exactly why it sits where it does at the size it is

**Plans**: TBD
**UI hint**: yes

### Phase 8: True Orbital Ellipses

**Goal**: Asteroid orbits are real ellipses derived from NeoWs orbital elements, not decorative circles — the densest piece of orbital math in the project, given its own phase deliberately
**Depends on**: Phase 7
**Requirements**: SCENE-06
**Success Criteria** (what must be TRUE):

  1. User sees each asteroid's orbit drawn as an ellipse whose shape, size, tilt and orientation come from semi-major axis, eccentricity, inclination, ascending node longitude and perihelion argument
  2. A high-eccentricity orbit visibly differs in shape from a near-circular one, and an inclined orbit visibly tilts out of the ecliptic plane
  3. The element-to-3D transform is derived and documented by the developer — rotation order and coordinate convention explained in writing, not pasted from a snippet
  4. Orbits render at a stable frame rate with the full fetched NEO set on screen

**Plans**: TBD
**UI hint**: yes

### Phase 9: Raycasting & Selection

**Goal**: Users can pick objects in the 3D scene by pointer or touch without fighting the orbit controls
**Depends on**: Phase 7
**Requirements**: PICK-01, PICK-04
**Success Criteria** (what must be TRUE):

  1. User can click a 3D object and see it become visibly selected
  2. User can tap a 3D object on a touch device and select it
  3. User dragging to orbit on a touch device never accidentally selects — a movement threshold separates tap from drag
  4. Selection state lives in a framework-agnostic store both React and the scene read, with no Three.js object ever stored in React state

**Plans**: TBD
**UI hint**: yes

### Phase 10: HUD Overlay & Bidirectional Selection

**Goal**: Selecting anything — in 3D or in a 2D panel — opens its terminal HUD and drives the camera, without leaving the scene
**Depends on**: Phase 9 (selection), Phase 4 and Phase 5 (panels)
**Requirements**: PICK-02, PICK-03, PICK-05
**Success Criteria** (what must be TRUE):

  1. User selecting a 3D object sees a terminal-style HUD overlay with that object's detail render on top of the canvas, without navigating away from the scene
  2. User selecting a row in the asteroid or space-weather panel sees the corresponding 3D object highlighted, and a 3D selection highlights the matching row — selection is shared in both directions
  3. Camera smoothly focuses on and follows the selected object, and returns to free orbit when the selection is cleared
  4. HUD content stays DOM text rather than being drawn into the WebGL canvas, so it remains selectable and unaffected by the shader chain

**Plans**: TBD
**UI hint**: yes

### Phase 11: CRT Postprocessing Chain

**Goal**: The 3D canvas renders through a hand-written shader chain that reads as a CRT, is safe for photosensitive users, and stays usable on a phone — with the safety and performance branches built in, not retrofitted
**Depends on**: Phase 10
**Requirements**: CRT-01, CRT-06, CRT-07, CRT-08, CRT-09
**Success Criteria** (what must be TRUE):

  1. User sees the canvas composited through `EffectComposer` with hand-written GLSL passes for scanlines, vignette and per-channel chromatic aberration, and the developer can explain each pass's uniforms and why the chain is ordered as it is
  2. Flicker never exceeds 3 flashes per second at ≥10% luminance delta with scanlines and data-arrival animation running together, verified by frame-by-frame analysis
  3. User with `prefers-reduced-motion` enabled sees flicker and scene animation stop
  4. Framerate stays usable on a mid-range phone with `devicePixelRatio` capped and passes reduced on low-power or narrow viewports
  5. Text contrast measured on a screenshot of the actual composited output — not flat color swatches — meets WCAG AA

**Plans**: TBD
**UI hint**: yes

### Phase 12: Real-Device Hardening, Deploy & Case Study

**Goal**: The dashboard survives a real phone, runs live on Vercel, and is documented as a portfolio case study written from understanding
**Depends on**: Phase 11
**Requirements**: RESP-03, SHIP-01, SHIP-02, SHIP-03
**Success Criteria** (what must be TRUE):

  1. On a real phone, dynamic browser chrome appearing and disappearing while scrolling never clips the canvas or the panels
  2. Anyone can open the deployed Vercel URL built from main and use the dashboard, with the NASA key supplied as an environment variable that is rotatable without a code change
  3. A reader can follow the README to obtain a NASA API key and run the project locally, and sees screenshots of the finished dashboard plus the technical decisions and learnings
  4. The README contains an architecture walkthrough of the Three.js layer — scene graph, render loop, disposal, postprocessing chain — written in the developer's own words

**Plans**: TBD
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10 → 11 → 12

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Terminal Design System & App Shell | 1/7 | In Progress|  |
| 2. React↔Three.js Render Boundary | 0/TBD | Not started | - |
| 3. NASA Data Layer & Resilience | 0/TBD | Not started | - |
| 4. Asteroid Classifier Panel | 0/TBD | Not started | - |
| 5. Space Weather Panel & Timeline | 0/TBD | Not started | - |
| 6. Static Solar System Scene Graph | 0/TBD | Not started | - |
| 7. Data-Driven Scene Layers | 0/TBD | Not started | - |
| 8. True Orbital Ellipses | 0/TBD | Not started | - |
| 9. Raycasting & Selection | 0/TBD | Not started | - |
| 10. HUD Overlay & Bidirectional Selection | 0/TBD | Not started | - |
| 11. CRT Postprocessing Chain | 0/TBD | Not started | - |
| 12. Real-Device Hardening, Deploy & Case Study | 0/TBD | Not started | - |

---
*Roadmap created: 2026-08-26*
