# Requirements: Space Dashboard — Asteroides + Clima Espacial

**Defined:** 2026-08-26
**Core Value:** Aprender Three.js en profundidad construyendo una escena 3D data-driven que realmente entiendo línea por línea.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Asteroides (NeoWs)

- [ ] **NEO-01**: User can see a list of near-Earth objects for the selected date range showing name, close-approach date, miss distance, relative velocity, and estimated diameter range
- [ ] **NEO-02**: User sees NASA's `is_potentially_hazardous_asteroid` flag surfaced verbatim as an official NASA classification, not as a computed judgment of the app's own
- [ ] **NEO-03**: User sees each asteroid assigned a notability tier (three levels, e.g. Routine / Notable / Close & Fast) derived only from `miss_distance.lunar`, `relative_velocity`, and `estimated_diameter`, with the raw inputs always displayed next to the derived label
- [ ] **NEO-04**: User sees a persistent terminal-style disclaimer stating the notability tier is a heuristic and NOT an official impact risk assessment
- [ ] **NEO-05**: User can sort and filter the NEO list by notability tier and by miss distance
- [ ] **NEO-06**: User can open an asteroid's detail view showing close-approach date, relative velocity, estimated diameter as a min–max range (never collapsed to a single falsely-precise number), and its history of previous and upcoming close approaches
- [ ] **NEO-07**: User can choose the NeoWs query date range, and the UI prevents submitting a range longer than the API's 7-day maximum

### Clima Espacial (DONKI)

- [ ] **SW-01**: User can read a feed of recent space-weather bulletins rendered from `/DONKI/notifications` `messageBody` in monospaced terminal format
- [ ] **SW-02**: User sees solar flares from `/DONKI/FLR` with their class type (e.g. `M1.0`, `X2.3`) and peak time
- [ ] **SW-03**: User sees geomagnetic storms from `/DONKI/GST` with the Kp index mapped to the NOAA G1–G5 severity scale
- [ ] **SW-04**: User sees CME events from `/DONKI/CME` with start time and source location
- [ ] **SW-05**: User can view a timeline chart, hand-built in SVG, plotting flares, geomagnetic storms and CMEs against time over the fetched window
- [ ] **SW-06**: User can choose the DONKI query window, and the UI prevents submitting a range longer than the API's 30-day cap

### Escena 3D (Three.js)

- [ ] **SCENE-01**: User sees a stylized solar system rendered with vanilla Three.js — sun and planets as flat-shaded spheres, orbits as line geometry, schematic (not realistic) scale, no textures
- [ ] **SCENE-02**: Scene carries a visible "not to scale" label so schematic scale is never mistaken for accuracy
- [ ] **SCENE-03**: Scene mounts and unmounts cleanly under React StrictMode without creating duplicate renderers, canvases, or animation loops
- [ ] **SCENE-04**: All Three.js geometries, materials, textures and render targets are disposed on unmount, with no GPU memory growth across repeated remounts
- [ ] **SCENE-05**: User sees the fetched NEOs rendered as objects inside the 3D scene, positioned and sized by a documented schematic mapping from miss distance and estimated diameter
- [ ] **SCENE-06**: User sees asteroid orbits drawn as true ellipses computed from `orbital_data` (semi-major axis, eccentricity, inclination, ascending node longitude, perihelion argument)
- [ ] **SCENE-07**: User sees CMEs rendered as expanding cones from the Sun, oriented and shaped by the real `speed`, `halfAngle`, `latitude` and `longitude` from `/DONKI/CMEAnalysis`
- [ ] **SCENE-08**: User can orbit, pan and zoom the camera with both mouse and touch
- [ ] **SCENE-09**: Scene detects `webglcontextlost`, shows an in-theme "SIGNAL LOST" state instead of a blank canvas, and restores on `webglcontextrestored`

### Interacción 3D (Raycasting + HUD)

- [ ] **PICK-01**: User can click or tap a 3D object and have it become the selected object via raycasting
- [ ] **PICK-02**: Selecting a 3D object opens a terminal-style HUD overlay on top of the canvas with that object's detail, without leaving the scene
- [ ] **PICK-03**: Selecting an item in a 2D panel highlights the corresponding object in the 3D scene — selection state is shared in both directions
- [ ] **PICK-04**: On touch devices, tap-to-select is disambiguated from drag-to-orbit by a movement threshold so orbiting never accidentally selects
- [ ] **PICK-05**: Camera focuses on and follows the selected object, and returns to free orbit when the selection is cleared

### Estética CRT

- [ ] **CRT-01**: 3D canvas renders through `EffectComposer` with hand-written GLSL passes for scanlines, vignette, and per-channel chromatic aberration
- [x] **CRT-02**: 2D panels carry the CRT look via CSS at reduced intensity so data text stays legible
- [x] **CRT-03**: Palette is phosphor green + magenta/violet on deep black, applied consistently across 2D panels and the 3D scene
- [x] **CRT-04**: Typography is a pixel monospace face (VT323 or equivalent) loaded through `next/font`
- [x] **CRT-05**: Alert panels render in terminal format (e.g. `>> CME DETECTED - INTENSITY: MODERATE`)
- [ ] **CRT-06**: CRT flicker never exceeds 3 flashes per second at ≥10% luminance delta, verified by frame-by-frame analysis (WCAG 2.3.1) with scanlines and data-arrival animation running together
- [ ] **CRT-07**: `prefers-reduced-motion` disables flicker and scene animation
- [ ] **CRT-08**: `devicePixelRatio` is capped and postprocessing passes are reduced on low-power or narrow viewports so mobile framerate stays usable
- [ ] **CRT-09**: Text contrast meets WCAG AA measured over the composited CRT output, not over flat color swatches
- [x] **CRT-10**: User can reduce or turn off the CRT effect from a visible in-theme control, and the choice persists for the session

### Capa de Datos y Resiliencia

- [ ] **DATA-01**: All NASA requests go through a single client-side fetch layer that injects the API key from a `NEXT_PUBLIC_` environment variable
- [ ] **DATA-02**: User sees a distinct terminal-style loading state while data is in flight
- [ ] **DATA-03**: User sees a distinct rate-limited state on HTTP 429 that says the quota is exhausted and when it resets — never a generic error blob
- [ ] **DATA-04**: User sees a distinct API-unavailable state when NASA returns 5xx or the request times out
- [ ] **DATA-05**: User sees a distinct empty state when a valid query returns no events for the selected range
- [ ] **DATA-06**: User can manually re-fetch all data with a terminal-style refresh control, without reloading the page
- [ ] **DATA-07**: Requests respect NeoWs' 7-day and DONKI's 30-day range caps, clamping or blocking invalid ranges client-side before sending
- [ ] **DATA-08**: A failure in one data source does not blank the sections fed by the other — NeoWs and DONKI degrade independently

### Responsive y Accesibilidad

- [x] **RESP-01**: Dashboard is usable on mobile and desktop as a single screen with scroll, with no separate routes
- [ ] **RESP-02**: 3D canvas resizes correctly on viewport and orientation change without distorting the camera aspect ratio
- [ ] **RESP-03**: Mobile browser chrome (dynamic viewport height) does not clip the canvas or the panels
- [x] **RESP-04**: A legend explains what the CRT color coding means

### Entrega

- [ ] **SHIP-01**: App builds and runs on Vercel from the main branch with the NASA key configured as an environment variable
- [ ] **SHIP-02**: README documents setup, how to obtain a NASA API key, the technical decisions taken, and what was learned, with screenshots
- [ ] **SHIP-03**: README includes an architecture walkthrough of the Three.js layer (scene graph, render loop, disposal, postprocessing chain) written from understanding, not copied from tutorials

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Escena 3D

- **SCENE-10**: Time scrubber to advance/rewind a simulated date and watch approaches play out — must scrub within already-fetched data, never re-fetch per date
- **SCENE-11**: Migration evaluation from vanilla Three.js to React Three Fiber, once the raw API is well understood
- **SCENE-12**: `WebGPURenderer` / TSL exploration as a post-v1 learning exercise

### Datos

- **DATA-09**: `sessionStorage` caching of NASA responses to avoid re-consuming rate limit on every reload
- **DATA-10**: JPL Sentry API integration for real Torino/Palermo scale values and impact probabilities — different host, different auth, different response shape; requires a new scope decision

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Backend propio / API routes | La key se expone en el cliente a propósito; mantiene el MVP 100% client-side y el deploy trivial |
| Persistencia entre sesiones | No hay nada que guardar en v1 |
| Cuentas de usuario / login | El dashboard es público y de solo lectura |
| Polling automático / websockets | Fuera de scope declarado, y empeora directamente el problema de rate limit que ya hay que resolver |
| Escalas orbitales y tamaños planetarios realistas | A escala real los planetas son píxeles invisibles; es la razón por la que todo visualizador del género usa escala esquemática |
| Score numérico de riesgo propio (0-100 o semáforo) | Implica una probabilidad de impacto que la data de NeoWs no soporta. El flag PHA es true para una fracción grande de NEOs catalogados por diseño — tratarlo como "peligro" es desinformación científica |
| Copy o animación alarmista sobre el flag PHA (klaxons, "WARNING" rojo parpadeando) | Mismo motivo, y además choca con el requisito de fotosensibilidad (CRT-06) |
| Falsa precisión en diámetros (colapsar min–max a un número) | `estimated_diameter` es una estimación derivada con un rango real; colapsarlo esconde incertidumbre científica genuina |
| Texturas fotorrealistas, lens flares, bloom cinematográfico | Fuera de scope declarado, y pelea contra la identidad retro CRT en vez de complementarla |
| Simulador de mecánica orbital n-body | Aumento masivo de scope para una v1 cuyo objetivo es aprender rendering e interacción, no astrodinámica. NeoWs ya entrega los elementos orbitales pre-calculados |
| Clima de Marte (InSight Weather API) | Misión terminada en 2022; el endpoint puede no devolver datos vigentes |
| Rutas separadas / multipágina | El dashboard es una sola pantalla con scroll |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| NEO-01 | Phase 4 | Pending |
| NEO-02 | Phase 4 | Pending |
| NEO-03 | Phase 4 | Pending |
| NEO-04 | Phase 4 | Pending |
| NEO-05 | Phase 4 | Pending |
| NEO-06 | Phase 4 | Pending |
| NEO-07 | Phase 4 | Pending |
| SW-01 | Phase 5 | Pending |
| SW-02 | Phase 5 | Pending |
| SW-03 | Phase 5 | Pending |
| SW-04 | Phase 5 | Pending |
| SW-05 | Phase 5 | Pending |
| SW-06 | Phase 5 | Pending |
| SCENE-01 | Phase 6 | Pending |
| SCENE-02 | Phase 6 | Pending |
| SCENE-03 | Phase 2 | Pending |
| SCENE-04 | Phase 2 | Pending |
| SCENE-05 | Phase 7 | Pending |
| SCENE-06 | Phase 8 | Pending |
| SCENE-07 | Phase 7 | Pending |
| SCENE-08 | Phase 6 | Pending |
| SCENE-09 | Phase 2 | Pending |
| PICK-01 | Phase 9 | Pending |
| PICK-02 | Phase 10 | Pending |
| PICK-03 | Phase 10 | Pending |
| PICK-04 | Phase 9 | Pending |
| PICK-05 | Phase 10 | Pending |
| CRT-01 | Phase 11 | Pending |
| CRT-02 | Phase 1 | Complete |
| CRT-03 | Phase 1 | Complete |
| CRT-04 | Phase 1 | Complete |
| CRT-05 | Phase 1 | Complete |
| CRT-06 | Phase 11 | Pending |
| CRT-07 | Phase 11 | Pending |
| CRT-08 | Phase 11 | Pending |
| CRT-09 | Phase 11 | Pending |
| CRT-10 | Phase 1 | Complete |
| DATA-01 | Phase 3 | Pending |
| DATA-02 | Phase 3 | Pending |
| DATA-03 | Phase 3 | Pending |
| DATA-04 | Phase 3 | Pending |
| DATA-05 | Phase 3 | Pending |
| DATA-06 | Phase 3 | Pending |
| DATA-07 | Phase 3 | Pending |
| DATA-08 | Phase 3 | Pending |
| RESP-01 | Phase 1 | Complete |
| RESP-02 | Phase 2 | Pending |
| RESP-03 | Phase 12 | Pending |
| RESP-04 | Phase 1 | Complete |
| SHIP-01 | Phase 12 | Pending |
| SHIP-02 | Phase 12 | Pending |
| SHIP-03 | Phase 12 | Pending |

**Per-phase totals:**

| Phase | Requirements | Count |
|-------|--------------|-------|
| 1. Terminal Design System & App Shell | CRT-02, CRT-03, CRT-04, CRT-05, CRT-10, RESP-01, RESP-04 | 7 |
| 2. React<->Three.js Render Boundary | SCENE-03, SCENE-04, SCENE-09, RESP-02 | 4 |
| 3. NASA Data Layer & Resilience | DATA-01..DATA-08 | 8 |
| 4. Asteroid Classifier Panel | NEO-01..NEO-07 | 7 |
| 5. Space Weather Panel & Timeline | SW-01..SW-06 | 6 |
| 6. Static Solar System Scene Graph | SCENE-01, SCENE-02, SCENE-08 | 3 |
| 7. Data-Driven Scene Layers | SCENE-05, SCENE-07 | 2 |
| 8. True Orbital Ellipses | SCENE-06 | 1 |
| 9. Raycasting & Selection | PICK-01, PICK-04 | 2 |
| 10. HUD Overlay & Bidirectional Selection | PICK-02, PICK-03, PICK-05 | 3 |
| 11. CRT Postprocessing Chain | CRT-01, CRT-06, CRT-07, CRT-08, CRT-09 | 5 |
| 12. Real-Device Hardening, Deploy & Case Study | RESP-03, SHIP-01, SHIP-02, SHIP-03 | 4 |

**Coverage:**

- v1 requirements: 52 total
- Mapped to phases: 52
- Unmapped: 0

---
*Requirements defined: 2026-08-26*
*Last updated: 2026-08-26 after roadmap creation (12 phases, 51/51 mapped)*
