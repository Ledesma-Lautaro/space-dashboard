# Feature Research

**Domain:** Public space-data dashboard — NEO (asteroid) risk classifier + space-weather alert feed + interactive 3D solar system
**Researched:** 2026-08-26
**Confidence:** HIGH for NASA API field names (verified against official CCMC/NASA sources, cross-checked against two independent client-library docs) · HIGH for "NeoWs does not expose Torino/Palermo" (well-established, separate JPL system) · MEDIUM for 3D-visualization UX conventions (inferred from NASA's own "Eyes on the Solar System" and the general genre, not a single authoritative spec)

---

## 0. NASA API Data Models (verified field reference)

This section exists because the downstream requirements doc will be written directly from these field names. Do not invent fields not listed here.

### 0.1 NeoWs (`/neo/rest/v1/...`)

**`GET /neo/rest/v1/feed?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD&api_key=...`**
- Date range capped at 7 days per request (NASA enforces this — a wider range 400s).
- Response shape:
  ```
  {
    links: { next, prev, self },
    element_count: number,
    near_earth_objects: {
      "YYYY-MM-DD": [ NeoObject, ... ],
      "YYYY-MM-DD": [ ... ]
    }
  }
  ```
  Note the object keyed by date, not a flat array — plan the fetch/transform layer around this.

**`GET /neo/rest/v1/neo/{asteroid_id}?api_key=...`** — single `NeoObject`, same shape as below, with the fullest `orbital_data`.

**`GET /neo/rest/v1/neo/browse?page=&size=&api_key=...`** — paginated catalog of *all* known NEOs, not date-filtered. Response wraps items in `page: {size, total_elements, total_pages, number}` plus `near_earth_objects: [...]` (flat array here, unlike feed). Low value for this project — feed already gives "what's near right now," browse gives "everything NASA has ever catalogued," which is thousands of objects with no relevance filter.

**`NeoObject` fields (present on feed items and lookup):**

| Field | Type | Notes |
|---|---|---|
| `id` | string | JPL small-body ID, use as the object's key/route param |
| `neo_reference_id` | string | Usually same as `id` |
| `name` | string | e.g. `"(2024 YR4)"` — includes parens/formatting, needs display cleanup |
| `nasa_jpl_url` | string | Deep link to the full JPL small-body record — good as an "external source" link in a detail overlay |
| `absolute_magnitude_h` | number | H magnitude — brightness at 1 AU, standard distance/phase. **Not a size in itself**; NASA derives `estimated_diameter` from it using an assumed albedo, so treat diameter as an *estimate range*, not a measurement |
| `estimated_diameter` | object | `{ kilometers: {estimated_diameter_min, estimated_diameter_max}, meters: {...}, miles: {...}, feet: {...} }` — always a min/max range, never a single number. Using the range midpoint for the 3D scene's sphere radius is defensible; presenting `estimated_diameter_max` alone as "the size" is not. |
| `is_potentially_hazardous_asteroid` | boolean | Official NASA "PHA" flag. See §1 — this is an orbit/size classification, not a live threat assessment. |
| `is_sentry_object` | boolean | Whether the object is tracked by JPL's Sentry impact-monitoring system. **This flag alone tells you nothing about the actual risk level** — Sentry tracks many objects at negligible-but-nonzero computed impact probability. The Torino/Palermo values themselves are NOT in this payload (see §1). |
| `close_approach_data` | array | One entry per known/predicted close approach. See below. |
| `orbital_data` | object | Full osculating orbital elements. See below. |

**`close_approach_data[]` fields:**

| Field | Notes |
|---|---|
| `close_approach_date` | `YYYY-MM-DD` |
| `close_approach_date_full` | Human string, e.g. `"2029-Apr-13 21:46"` |
| `epoch_date_close_approach` | Unix ms epoch |
| `relative_velocity.kilometers_per_second` / `.kilometers_per_hour` / `.miles_per_hour` | Strings (not numbers) — must `parseFloat` |
| `miss_distance.astronomical` / `.lunar` / `.kilometers` / `.miles` | Strings — same caveat. `lunar` (Lunar Distances, ~384,400 km) is the most human-intuitive unit for a "how close was that" display; raw `kilometers` reads as an incomprehensibly large number to a lay visitor. |
| `orbiting_body` | e.g. `"Earth"` — a NEO feed can include approaches to other bodies; **filter to `"Earth"` explicitly**, don't assume every entry is an Earth approach |

**`orbital_data` fields (subset relevant to this project):**
`orbit_id`, `orbit_determination_date`, `first_observation_date`, `last_observation_date`, `data_arc_in_days`, `observations_used`, `orbit_uncertainty` (0–9 scale, lower = better determined), `minimum_orbit_intersection` (MOID, in AU — the field that actually drives the PHA flag), `jupiter_tisserand_invariant`, `epoch_osculation`, `eccentricity`, `semi_major_axis`, `inclination`, `ascending_node_longitude`, `orbital_period`, `perihelion_distance`, `perihelion_argument`, `aphelion_distance`, `perihelion_time`, `mean_anomaly`, `mean_motion`, `equinox`, `orbit_class: { orbit_class_type, orbit_class_description, orbit_class_range }` (e.g. `"APO"` = Apollo-type).

These orbital elements are exactly what you'd need to actually place an asteroid's orbit ellipse in the 3D scene (semi-major axis, eccentricity, inclination, ascending node, argument of perihelion) rather than faking a random ring around the sun — genuine differentiator if used, meaningful complexity if done properly (see §4).

**Rate limits (already flagged as a known risk in PROJECT.md):** `DEMO_KEY` ≈ 30 req/hour/IP, 50 req/day. Personal key ≈ 1000 req/hour. With no backend and no polling, a single page load doing a feed call + several DONKI calls under `DEMO_KEY` can exhaust the hourly budget in a handful of reloads — reinforces why rate-limit-aware error states are table stakes, not a nice-to-have.

### 0.2 What NeoWs does **not** give you

- **No Torino Scale value.** No `torino_scale` field anywhere in the payload.
- **No Palermo Scale value.** No `palermo_scale` field anywhere.
- **No impact probability.** No `probability`, no `impact_date`, nothing of the sort.
- **No composition, mass, or albedo.** `estimated_diameter` is a *derived* range from `absolute_magnitude_h` assuming a generic albedo — treat it as an estimate, never a measured fact.
- **This data lives in a different NASA/JPL system entirely:** the Torino/Palermo scale values, impact probabilities, and "virtual impactor" data live in JPL's **Sentry API** (`ssd-api.jpl.nasa.gov/doc/sentry.html`), which is a *separate* service from `api.nasa.gov`'s NeoWs. It is explicitly out of scope per PROJECT.md ("solo NASA NeoWs... y DONKI"). Do not casually reach for it later without registering it as a new scope decision — it's a different host, different auth model, different response shape.

### 0.3 An honest client-side "risk model" (addresses the Active requirement: *"clasificador de asteroides... con modelo de riesgo"*)

Build a **composite proximity/notability indicator**, not a "risk score." It should be:

1. Transparent — always show the raw inputs next to the derived label (distance, speed, size, PHA flag), never just a number or color with no explanation.
2. Built only from fields that exist: `miss_distance.lunar`, `relative_velocity.kilometers_per_second`, `estimated_diameter.kilometers` (min/max midpoint), `is_potentially_hazardous_asteroid`.
3. Explicitly deferential to NASA's own PHA flag rather than reinventing it — surface it as *"NASA classification: Potentially Hazardous"* rather than computing a competing "hazard" judgment from the same underlying MOID/size data NASA already used.
4. Labeled with vocabulary that doesn't imply scientific certainty: "closeness," "notable pass," "fast pass," not "danger," "threat," "risk level," or "impact chance."
5. Carrying a visible disclaimer near the classifier: something like `>> CLASSIFICATION IS A HEURISTIC BASED ON DISTANCE/SIZE/SPEED — NOT AN OFFICIAL IMPACT RISK ASSESSMENT` fits the terminal aesthetic naturally and is honest.

A reasonable, defensible bucket scheme (three tiers, e.g. "Routine / Notable / Close & Fast") from thresholds on lunar distance + relative velocity + PHA flag is fine as a sort/filter/color mechanism in the UI. What would misrepresent the science: naming it "Risk Level," coloring it red/yellow/green like a threat matrix, or implying it says anything about impact probability.

### 0.4 DONKI (`/DONKI/...`)

All DONKI endpoints share `startDate`/`endDate` (`YYYY-MM-DD`, default 30-day lookback except `notifications`/`WSAEnlilSimulations` which default to 7 days) and `api_key`. Query window is capped — a request spanning more than 30 days gets clamped server-side.

**`/DONKI/CME`** — one record per observed CME:
`activityID`, `catalog`, `startTime`, `instruments[]`, `sourceLocation`, `activeRegionNum`, `note`, `submissionTime`, `versionId`, `link`, `cmeAnalyses[]` (nested physical-parameter estimates), `linkedEvents[]` (each `{activityID}` — the mechanism for cross-referencing a CME to the flare that likely caused it).

**`/DONKI/CMEAnalysis?mostAccurateOnly=true&speed=0&halfAngle=0&catalog=ALL`** — deeper physical modeling of a CME's trajectory/geometry, queryable by minimum speed and half-angle thresholds:
`time21_5`, `latitude`, `longitude`, `halfAngle` (angular width of the ejection cone, degrees), `speed` (km/s), `type` (CME "SCORE" catalog category — confirm exact letter meanings at implementation time, MEDIUM confidence on precise definitions), `isMostAccurate`, `associatedCMEID`, `note`, `catalog`, `link`.
This is the endpoint to filter on `speed` server-side (e.g. `speed=500` for "fast CMEs only") rather than fetching everything and filtering client-side — reduces payload and rate-limit pressure.

**`/DONKI/FLR`** — solar flares, filterable by `class=X` (or `M`, `C`, `B`, `A`, `ALL`, multiple allowed):
`flrID`, `catalog`, `instruments[]`, `beginTime`, `peakTime`, `endTime`, `classType` (e.g. `"M1.0"`, `"X2.3"` — the letter is the order-of-magnitude class, the number is a linear multiplier within that class), `sourceLocation`, `activeRegionNum`, `note`, `submissionTime`, `versionId`, `link`, `linkedEvents[]`.

**`/DONKI/GST`** — geomagnetic storms:
`gstID`, `startTime`, `allKpIndex[]` (each `{observedTime, kpIndex, source}` — Kp is measured repeatedly through a storm, so this is itself a small time series per storm, not a single number), `link`, `linkedEvents[]`, `submissionTime`, `versionId`.
Kp scale: 5=minor(G1), 6=moderate(G2), 7=strong(G3), 8=severe(G4), 9=extreme(G5) — standard NOAA space-weather scale, worth encoding as a lookup table for the alert feed's severity label.

**`/DONKI/notifications?type=all|FLR|SEP|CME|IPS|MPC|GST|RBE|report`** — pre-written human-readable bulletins:
`messageType`, `messageID`, `messageIssueTime`, `messageURL`, **`messageBody`** — a long markdown-formatted plain-text bulletin (NOAA/SWRC-style, e.g. `"## Message Type: Space Weather Notification - Radiation Belt Enhancement ##..."`). This field is a genuine gift for this project: it already reads like a terminal bulletin without any client-side text generation, and rendering it verbatim (monospaced, inside a scrollable HUD panel) is both easy and true to the source.

**Endpoint choice for the two required UI surfaces:**
- **Terminal-style alert feed** → `/DONKI/notifications`. It's pre-formatted, human-authored, and needs zero synthesis — pull `messageBody` and drop it into a scanline-styled `<pre>`-like block. This is the lowest-complexity, highest-payoff DONKI feature.
- **Timeline / activity chart** → `/DONKI/FLR` + `/DONKI/GST` (+ optionally `/DONKI/CME`) plotted by time, not `/DONKI/notifications` (notification text isn't structured enough to chart). Flare class (`classType`) and Kp index (`allKpIndex[].kpIndex`) are both natural y-axis values against a time x-axis.

---

## Feature Landscape

### Table Stakes (Users Expect These)

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| NEO list for a date range with distance/velocity/size/PHA flag | Baseline of any "asteroid tracker" — without it the dashboard has no core content | LOW–MEDIUM | Direct mapping from `/neo/rest/v1/feed`; the work is transform + sort/filter, not fetching |
| Asteroid detail view (approach date, velocity, size range, past/future approaches) | Users expect to click through from a list to specifics, standard drill-down pattern | LOW–MEDIUM | `close_approach_data[]` already gives history/future in one payload — no extra fetch needed |
| Space-weather alert feed (CME/flare/storm notices in readable text) | Any "space weather" dashboard implies "what happened / is happening" | LOW | `/DONKI/notifications` `messageBody` does 90% of the work already |
| Loading / error / empty / rate-limited states | A public client-side dashboard with a client-exposed API key **will** hit errors and rate limits in normal use, not edge cases | LOW–MEDIUM | Already correctly scoped as in-v1 per PROJECT.md; needs distinct states for "NASA down," "rate limited," "no results for range," not one generic error blob |
| Basic 3D orbit view of the solar system with the sun and planets | The 3D scene is the stated spine of the project — a static, non-interactive scene reads as decoration, not the promised centerpiece | MEDIUM–HIGH | Three.js vanilla scene graph, orbit lines as `THREE.Line`/`EllipseCurve`, no textures per PROJECT.md scope |
| Click-to-inspect on a 3D object (raycasting → detail HUD) | Explicitly required in PROJECT.md ("Raycasting: click sobre un objeto 3D abre un overlay HUD") — without it the 3D scene and the data panels are two disconnected apps sharing a page | MEDIUM | Requires object→data mapping (mesh ↔ NEO/CME record) decided early; retrofitting picking onto an already-built scene is painful |
| Mobile-usable layout | Stated constraint: "mobile y desktop tratados como iguales" | MEDIUM | Interacting with a WebGL raycasting scene on touch (tap vs. drag-to-orbit disambiguation) is a real UX problem, not just CSS breakpoints |
| Basic legend/key for the CRT color coding | Green-phosphor/magenta on black with no legend leaves users guessing what colors mean | LOW | Cheap to add, easy to forget |

### Differentiators (Competitive Advantage)

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Asteroids/CMEs rendered as first-class objects *inside* the 3D scene, not a separate list bolted on | This is the stated core differentiator in PROJECT.md ("no como decoración") — most hobby space dashboards either do a data table OR a pretty scene, rarely both wired together | HIGH | Requires deciding a size/distance mapping law (see Anti-Features — realistic scale kills this) and a shared data layer feeding both the 2D panels and the 3D scene from one fetch |
| CME visualized as an actual expanding cone/shell leaving the Sun, driven by real `speed`/`halfAngle`/`latitude`/`longitude` from `/DONKI/CMEAnalysis` | Turns an abstract DB record into something legible at a glance — "a fast, wide eruption toward Earth" vs. a narrow slow one aimed elsewhere | MEDIUM–HIGH | The physically-driven version (using real half-angle/speed/direction) is meaningfully more interesting than a generic particle burst, and is exactly the kind of "understand it line by line" Three.js work PROJECT.md wants — but it's optional polish once a simple placeholder burst exists |
| Camera focus/follow on a selected object (fly to asteroid, orbit around it) | Elevates picking from "shows a panel" to "feels like inspecting the actual object" | MEDIUM | Needs a camera-state machine (free orbit vs. locked-follow) layered on top of raycasting; do after picking + HUD overlay both work |
| Orbit ellipses drawn from real orbital elements for asteroids (using `orbital_data`: `semi_major_axis`, `eccentricity`, `inclination`, `ascending_node_longitude`, `perihelion_argument`) rather than a generic ring | Genuinely differentiates from "toy" asteroid visualizers that just scatter dots; also teaches real orbital-mechanics math, aligned with the project's learning goal | HIGH | Real orbital-element→3D-ellipse math (rotate by inclination/node/argument) is the single most conceptually dense piece of this project; budget real time for it |
| Time scrubber (advance/rewind simulated date, watch approaches happen) | Common in "serious" solar-system viewers (NASA's own Eyes on the Solar System has this) and turns a static scene into a story | MEDIUM–HIGH | Needs a decoupled "simulation clock" separate from wall-clock time driving the animation loop; conflicts with "fetch on demand, no polling" only if scrubbing tries to *re-fetch* data per date — should scrub within already-fetched data instead |
| Activity timeline/chart correlating flares, storms, CMEs over the fetched window | Turns disconnected alert cards into a "what's the recent trend" story; explicitly called out in PROJECT.md as wanted ("no solo lista de texto") | MEDIUM | Needs a lightweight charting approach (hand-rolled SVG/canvas fits the retro aesthetic better than pulling in a full chart library) |
| Shader-driven CRT postprocessing (scanlines, vignette, per-channel chromatic aberration via EffectComposer) | This is the visual identity of the whole project and a deliberate learning target | MEDIUM–HIGH | Real complexity is mobile performance headroom, not the shader math itself — needs a degrade path (fewer passes / lower resolution / respect `prefers-reduced-motion`) as already flagged in PROJECT.md |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|------------------|-------------|
| Realistic-scale orbits and planet sizes | "Feels more scientific/accurate" | At true scale, planets are literally invisible pixels and orbits span kilometers of screen space relative to planet size — the classic reason every hobby solar-system visualizer uses schematic scale. PROJECT.md already explicitly excludes this. | Schematic/log-ish scale with clearly stated "not to scale" — this is standard practice even in professional tools like Eyes on the Solar System's default view |
| A homemade numeric "risk score" (e.g. 0–100, or red/yellow/green "threat level") for asteroids | Feels more like a "real" hazard tool, more dramatic/impressive | Actively misrepresents science: implies a rigor (impact probability, Torino/Palermo-equivalent) that NeoWs data cannot support. Real Torino/Palermo scoring is JPL's job, done with orbit-determination uncertainty analysis this project has no access to. Alarmist "danger" framing of asteroids that pass at safe distances (most PHAs) is a well-known category of science misinformation online — being the responsible actor here is a differentiator, not a limitation | The composite "notability" heuristic from §0.3: transparent inputs, non-alarmist labels, explicit disclaimer |
| Alarmist copy/animation on "potentially hazardous" flags (klaxons, red flashing "WARNING," etc.) | Terminal/alert aesthetic invites drama, PHA sounds scary | `is_potentially_hazardous_asteroid` is true for a large fraction of catalogued NEOs by design (MOID ≤ 0.05 AU + large enough to be trackable) — most PHAs pose no near-term risk at all. Treating the flag as "danger" trains users to distrust or misread real space-weather/NEO communication | Reuse the terminal aesthetic for *neutral, information-dense* framing — "PHA flag: YES (NASA classification, see note)" styled like a status readout, not an alarm |
| Fake precision (e.g. displaying `estimated_diameter_max` to 6 decimal places, or averaging min/max and presenting it as *the* diameter with no range) | Numbers with lots of decimals look rigorous | `estimated_diameter` is a derived estimate with a real min–max spread for a reason — collapsing it to one falsely-precise number hides genuine scientific uncertainty | Always show the range, or a midpoint clearly labeled "~X km (estimated)" |
| Real-time polling / websockets / auto-refresh | "Live dashboard" feels more premium | Explicitly out of scope per PROJECT.md; also directly worsens the rate-limit problem this project already has to solve for | Fetch on load/manual-refresh only, as scoped |
| Photorealistic planet textures, lens flares, bloom-heavy "cinematic" rendering | Looks impressive in a demo reel | Explicitly out of scope ("sin texturas ni escalas realistas"); also works against the intentional retro/CRT identity — a photoreal scene fights the phosphor-green terminal aesthetic instead of complementing it | Flat-shaded or simple-material spheres + line orbits, consistent with the stated hand-drawn look |
| A general-purpose orbital-mechanics simulator (n-body physics, gravitational perturbation) | Feels like "doing it properly" once you're already computing orbital elements | Massive scope/complexity increase for a v1 whose stated goal is learning Three.js rendering/interaction, not astrodynamics simulation; NeoWs already gives pre-computed orbital elements — recomputing them from physics is redundant and a rewrite risk | Use the orbital elements NASA already provides (`orbital_data`) to *draw* correct static ellipses; do not simulate physics |
| Blank/white screen on NASA API failure | Not really "requested," but the default outcome of not handling errors | Explicitly flagged as unacceptable in PROJECT.md — a portfolio piece that blanks out on a rate limit (which is *likely* given `DEMO_KEY` limits) reads as broken, not as "NASA's fault" | Terminal-style error/empty states are already correctly scoped as v1 requirements |

---

## Feature Dependencies

```
Shared NASA fetch/cache layer (feed, neo/{id}, DONKI endpoints)
    └──requires──> Loading/Error/Rate-limit states
                       └──requires──> [none — can be built against mocked responses first]

3D solar system base scene (Sun + planets + orbit lines, schematic scale)
    └──requires──> [none — can start immediately with hardcoded orbital parameters]

Asteroids rendered in 3D scene
    └──requires──> Shared NASA fetch/cache layer
    └──requires──> 3D solar system base scene
    └──requires──> A defined size/distance mapping law (schematic, non-realistic)

CMEs rendered in 3D scene (leaving the Sun)
    └──requires──> Shared NASA fetch/cache layer (DONKI/CME + CMEAnalysis)
    └──requires──> 3D solar system base scene

Raycasting / click-to-inspect
    └──requires──> Asteroids rendered in 3D scene
    └──requires──> CMEs rendered in 3D scene
    └──requires──> A mesh↔data-record mapping (userData or lookup table) established when objects are created

Terminal HUD overlay (detail panel on click)
    └──requires──> Raycasting / click-to-inspect
    └──requires──> Asteroid detail data model (already in fetched payload, no extra call)

Camera focus/follow on selection
    └──requires──> Raycasting / click-to-inspect

Time scrubber
    └──requires──> 3D solar system base scene
    └──requires──> Asteroids/CMEs rendered in 3D scene (to have something whose position changes with the scrubbed date)
    └──conflicts-with (if implemented naively)──> "fetch on demand, no polling" constraint — scrubbing must replay already-fetched data, not trigger new NASA requests per frame/date

Orbit ellipses from real orbital elements
    └──requires──> Asteroids rendered in 3D scene
    └──enhances──> Time scrubber (a real orbit lets the scrubber move the asteroid along a physically meaningful path, not an arbitrary animation)

NEO list/classifier panel (2D)
    └──requires──> Shared NASA fetch/cache layer
    └──requires──> The composite "notability" heuristic (§0.3), computed once, reused by both the 2D list and any 3D color-coding

DONKI alert feed (terminal text)
    └──requires──> Shared NASA fetch/cache layer (DONKI/notifications)

DONKI activity timeline/chart
    └──requires──> Shared NASA fetch/cache layer (DONKI/FLR + DONKI/GST, optionally CME)
    └──enhances──> DONKI alert feed (chart gives trend, feed gives detail — not a hard dependency between them)

CRT postprocessing (EffectComposer + custom shaders)
    └──requires──> 3D solar system base scene (needs a render target to post-process)
    └──conflicts-with (perf)──> Mobile: needs a degrade path (reduced passes/resolution) or it fights the "3D scene as spine" requirement by making the whole page janky on the audience's likely devices
```

### Dependency Notes

- **The shared fetch/cache layer is the true "phase 0."** Every visible feature — 2D panels and 3D objects alike — depends on it, and it's also where rate-limit handling has to live centrally rather than being duplicated per-panel.
- **The 3D base scene and the fetch layer can be built in parallel**, then joined when asteroids/CMEs get placed into the scene — good candidate for two early, independently-plannable phases.
- **Raycasting is a hard gate for camera-follow and the HUD overlay.** Don't plan "3D scene" and "click detail" as the same phase if raycasting itself needs iteration — the mesh↔data mapping decided during object creation determines how painful picking is later.
- **The composite risk/notability heuristic (§0.3) should be computed once in the data layer**, not re-derived separately by the 2D list and the 3D color/highlight logic — otherwise the two views can silently disagree about which asteroids are "notable."
- **Time scrubber and orbit-ellipse math are mutually reinforcing but each independently high-complexity** — sequence them as late-stage differentiators after the table-stakes click/HUD loop works, not as part of the first working 3D scene.
- **CRT postprocessing should land after the 3D scene has real content** (planets + asteroids + CMEs), both because there's more to see through it and because performance tuning is more meaningful against the actual final object count than an empty scene.

---

## MVP Definition

### Launch With (v1)

- [ ] Shared NASA fetch/cache layer for NeoWs feed + DONKI (CME, FLR, GST, notifications) with typed error/rate-limit handling — everything else depends on this
- [ ] 3D solar system base scene: Sun + planets on schematic circular/elliptical orbit lines, no textures, no realistic scale
- [ ] Asteroids from NeoWs feed placed in the 3D scene with a schematic size/distance mapping
- [ ] CMEs from DONKI represented leaving the Sun (placeholder visual acceptable for v1; physically-driven speed/angle is a differentiator, not MVP-required)
- [ ] Raycasting click → terminal HUD overlay with asteroid/CME detail, without leaving the scene
- [ ] NEO list panel with the honest composite notability heuristic (§0.3), not a fabricated "risk score"
- [ ] Asteroid detail: close approach date, relative velocity, miss distance (lunar + km), estimated diameter range, PHA flag as a NASA-attributed classification
- [ ] DONKI alert feed rendering `messageBody` from `/DONKI/notifications` in a terminal-styled block
- [ ] Basic activity timeline (flare class + Kp index over the fetched window) — can be a simple hand-rolled chart, doesn't need to be sophisticated for v1
- [ ] CRT filter (scanlines, vignette, chromatic aberration) via EffectComposer with a mobile degrade path
- [ ] Loading/error/empty/rate-limited states across every data-dependent panel
- [ ] Mobile-usable interaction for the 3D scene (tap-to-select without breaking drag-to-orbit)

### Add After Validation (v1.x)

- [ ] Camera focus/follow on selected object — once picking + HUD are solid, this is a natural next iteration
- [ ] Real orbital-element-driven orbit ellipses for asteroids (replacing any placeholder ring) — meaningful math investment, worth doing once the rendering pipeline is stable
- [ ] Physically-driven CME visuals from `/DONKI/CMEAnalysis` (`speed`, `halfAngle`, `latitude`/`longitude`) replacing a placeholder burst
- [ ] Time scrubber over the already-fetched date window

### Future Consideration (v2+)

- [ ] Time scrubber extended to re-fetch adjacent date windows on demand (would need to revisit the "no polling" framing carefully — still user-triggered, not automatic)
- [ ] `/neo/rest/v1/neo/browse` exploration mode (browse the full NEO catalog beyond the current date window) — low value relative to complexity, defer indefinitely unless a specific use case emerges
- [ ] Any integration with JPL's separate Sentry API for actual Torino/Palermo values — would need its own scope/decision process, not a casual add-on

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Shared fetch/cache + error/rate-limit states | HIGH | MEDIUM | P1 |
| 3D base scene (Sun/planets/orbits) | HIGH | MEDIUM-HIGH | P1 |
| Asteroids in 3D scene | HIGH | MEDIUM | P1 |
| Raycasting + HUD overlay | HIGH | MEDIUM | P1 |
| NEO list + honest notability heuristic | HIGH | LOW-MEDIUM | P1 |
| DONKI alert feed (`messageBody`) | HIGH | LOW | P1 |
| CMEs in 3D scene (placeholder visual) | MEDIUM | MEDIUM | P1 |
| CRT postprocessing | HIGH (identity-defining) | MEDIUM-HIGH | P1 |
| Activity timeline chart | MEDIUM | MEDIUM | P1/P2 |
| Camera focus/follow | MEDIUM | MEDIUM | P2 |
| Real orbital-element ellipses | MEDIUM (high for learning goal) | HIGH | P2 |
| Physically-driven CME visuals | MEDIUM | MEDIUM-HIGH | P2 |
| Time scrubber | MEDIUM | MEDIUM-HIGH | P2 |
| `/neo/browse` catalog explorer | LOW | LOW-MEDIUM | P3 |
| Sentry/Torino/Palermo integration | LOW (scope-breaking) | HIGH | P3 / explicitly deferred |

**Priority key:**
- P1: Must have for launch
- P2: Should have, add when possible
- P3: Nice to have, future consideration

---

## Reference Points (genre survey)

No direct "competitors" in the commercial sense — this is a personal/portfolio project — but useful reference points for what the 3D-solar-system-dashboard genre typically includes:

- **NASA/JPL "Eyes on the Solar System"** (`eyes.nasa.gov`) — the closest professional analog. Notable conventions worth borrowing: schematic (not fully realistic) default scale, a time control that scrubs from past to future, a "Follow" camera mode that's the default behavior when focusing an object, and orbit-line toggles as a view option rather than always-on. This project should treat scrubbing and camera-follow the same way: optional, additive layers over a scene that already works without them.
- **JPL Sentry / CNEOS risk pages** (`cneos.jpl.nasa.gov/sentry`, `/risk`) — the actual home of Torino/Palermo scoring; useful as the reference for *how NASA itself communicates risk* (plain-language caveats, explicit "this is not a prediction" framing) even though this project won't consume this API directly.

## Sources

- [aionasa NeoWs API Reference](https://aionasa.readthedocs.io/en/latest/neows.html) — MEDIUM-HIGH confidence, third-party client docs mirroring the official NeoWs schema
- [CCMC DONKI System — official NASA/CCMC page](https://ccmc.gsfc.nasa.gov/tools/DONKI/) — HIGH confidence, official source, includes full endpoint/field enumeration and the "prototyping quality" disclaimer for DONKI data
- [Torino scale — Wikipedia](https://en.wikipedia.org/wiki/Torino_scale) and [Palermo scale — Wikipedia](https://en.wikipedia.org/wiki/Palermo_scale) — background on the scales NeoWs does not expose
- [JPL CNEOS Sentry: Earth Impact Monitoring](https://cneos.jpl.nasa.gov/sentry/) — confirms Sentry/Torino/Palermo is a separate JPL system from NeoWs
- [NASA's Eyes — eyes.nasa.gov](https://eyes.nasa.gov/apps/solar-system/) and [JPL "Explore the Solar System With NASA's New-and-Improved 3D Eyes"](https://www.jpl.nasa.gov/news/explore-the-solar-system-with-nasas-new-and-improved-3d-eyes/) — reference for 3D-solar-system UX conventions (time control, camera follow, orbit-line toggles)
- Cross-referenced DONKI `notifications` `messageBody` structure and CMEAnalysis field set via search-aggregated documentation (nasapy client library docs, DONKI web viewer example pages) — MEDIUM confidence on exact `type` (CME SCORE category) letter definitions specifically; verify against a live `/DONKI/CMEAnalysis` response at implementation time before hardcoding a lookup table

---
*Feature research for: public NEO + space-weather 3D dashboard (space-dashboard project)*
*Researched: 2026-08-26*
