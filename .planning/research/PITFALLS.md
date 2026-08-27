# Pitfalls Research

**Domain:** Client-side Next.js + vanilla Three.js data dashboard (NASA NeoWs/DONKI) with custom CRT postprocessing, deployed on Vercel
**Researched:** 2026-08-26
**Confidence:** HIGH (rate limits and API date-range behavior verified against api.nasa.gov / api.data.gov docs and NASA API source discussions; Three.js/React/Next.js patterns verified against official docs and maintainer discussions; WCAG flash threshold verified against W3C understanding doc)

## Critical Pitfalls

### Pitfall 1: NASA rate limit exhaustion from a client-only app

**What goes wrong:**
`DEMO_KEY` is capped at **30 requests/hour AND 50 requests/day per IP** — not just per hour. A personal key defaults to the api.data.gov standard of **1,000 requests/hour** (no separate daily cap documented for personal keys, but the hourly bucket resets on a rolling basis, not at a fixed clock hour). Because this dashboard is 100% client-side with the key embedded in the JS bundle, *every visitor's browser* makes requests directly against NASA's servers using **the same key** shared across all users. On `DEMO_KEY` in particular, 50/day means roughly 5-8 full page loads (NeoWs feed + DONKI CME + DONKI FLR + per-asteroid detail lookups) before the whole app is dead for the rest of the day, for everyone testing/viewing it — not just you.

**Why it happens:**
Developers test locally with `DEMO_KEY`, see it "work," and don't realize the quota is shared IP-wide and day-wide, not per-user. They also don't count *all* the requests a single page load fires — feed + multiple DONKI endpoints + retries + React StrictMode double-fetch (see Pitfall 4) can turn "3 API calls" into 6-8 real HTTP requests per load.

**How to avoid:**
- Register a personal key (`https://api.nasa.gov/`) on day one — do not build against `DEMO_KEY` past the first smoke test.
- Read `X-RateLimit-Limit` and `X-RateLimit-Remaining` response headers on every fetch and surface remaining quota in a debug corner (useful while developing, removable/hidden for prod).
- Batch requests deliberately: NeoWs `/feed` already returns multiple days in one call — never loop day-by-day. Cache the DONKI + NeoWs response in `sessionStorage` (or in-memory module state) for the session so re-renders, tab-switches, and StrictMode's double-invoke don't refire network calls.
- Design the fetch-on-demand model (already scoped: no polling) to fire once per explicit reload, not on every component mount.
- Treat 429 as an expected, designed-for state (see Pitfall 2), not an edge case discovered in prod.

**Warning signs:**
- `X-RateLimit-Remaining` header dropping fast during normal dev usage (check Network tab).
- Getting `429` while just refreshing the page a few times during development.
- No caching layer — every mount/remount triggers a fresh fetch.

**Phase to address:** Data-fetching/API integration phase (the phase that adds NeoWs + DONKI calls) — build the rate-limit-aware fetch wrapper and caching before wiring more than one panel to live data.

---

### Pitfall 2: Treating the exposed API key as a non-issue instead of designing for its actual risk

**What goes wrong:**
The key is visible in the shipped JS bundle (view-source, DevTools Network tab, or a simple `curl` of the bundle). This is an accepted, explicit project decision (see PROJECT.md), which is reasonable for a free, revocable, no-billing NASA key — but "accepted risk" still has a concrete failure mode: **anyone can copy the key out of the bundle and hammer NASA's API with it from elsewhere**, exhausting the shared hourly/daily quota for your own deployed dashboard (a denial-of-service against yourself, not a data breach). Because the key isn't tied to billing or PII, the actual blast radius is low — but "low risk" is not "zero risk," and the failure mode (dashboard shows nothing but rate-limit banners) is directly user-visible.

**Why it happens:**
"No backend = no secret to protect" is only half true — the *key* isn't a secret in the security sense (it's free, revocable, rate-limited only), but it's still a **shared, finite resource** that any bundle-reader can drain.

**How to avoid:**
- Confirm with NASA's docs that the key has no cost/billing implications (it doesn't — it's a free rate-limiting token, not an auth secret for paid resources).
- Because there's no backend to hide it behind, the only real mitigations are: (a) design the rate-limit/error UI so quota exhaustion degrades gracefully instead of looking broken (already in scope), (b) know that the key is trivially rotatable — if it's ever abused, generate a new one and redeploy via Vercel env var, no code change needed, (c) do **not** reuse this same key in any other project or for anything with actual cost implications.
- Do not architect around "hiding" the key (e.g. trivial base64 obfuscation) — it adds complexity for zero real protection and creates false confidence.

**Warning signs:**
- Dashboard suddenly rate-limited despite low real traffic → check if the key leaked and is being used elsewhere (can't be fully verified without a backend, but NASA's per-key usage isn't visible to you anyway — this is a structural limitation to accept, not solve).

**Phase to address:** Deployment/hardening phase — document the key as an env var (`NEXT_PUBLIC_NASA_API_KEY`), never hardcoded, so it can be rotated via Vercel dashboard without a code change.

---

### Pitfall 3: NeoWs `/feed` silently truncated or rejected beyond 7 days

**What goes wrong:**
`GET /neo/rest/v1/feed` has a **hard 7-day maximum range** between `start_date` and `end_date`. If `end_date` is omitted, it defaults to `start_date + 7 days`. Exceeding the range doesn't always fail loudly — depending on how the request is constructed, you may get a truncated/adjusted response rather than a clear error, which is worse than an outright 400 because it looks like it "worked" with quietly wrong data.

**Why it happens:**
Developers reach for a wider window ("show asteroids for the whole month") without checking NeoWs docs, then are confused when a 30-day request returns partial or unexpected data.

**How to avoid:**
- Never request more than a 7-day window from `/feed`. If a wider historical view is ever wanted, that means multiple sequential 7-day-capped requests — which multiplies your rate-limit consumption, so avoid unless truly needed for v1.
- Validate the date range client-side before firing the request; log/assert if `end_date - start_date > 7`.
- For "today's near-earth objects," just omit `end_date` and let it default rather than hand-computing a range.

**Warning signs:** Asteroid counts that look suspiciously low/high compared to manual API testing; date range in your fetch code exceeding 7 days.

**Phase to address:** NeoWs integration phase.

---

### Pitfall 4: Two renderers, two canvases, two animation loops from React StrictMode

**What goes wrong:**
In development, React 18/19 StrictMode **intentionally double-invokes** effects (mount → cleanup → mount) to surface non-idempotent side effects. A naive `useEffect` that does `const renderer = new THREE.WebGLRenderer(); container.appendChild(renderer.domElement); requestAnimationFrame(animate);` without proper cleanup will run **twice**, appending two `<canvas>` elements and starting two overlapping `requestAnimationFrame` loops — doubling GPU work, doubling event listeners (so raycasting/click handlers fire twice), and often causing visibly janky or duplicated 3D content. This is dev-only behavior (StrictMode's double-invoke does not happen in production builds), which is exactly why it's dangerous: it can look "fine" in a quick prod deploy check while actively breaking local dev, or worse, mask an underlying leak that *does* still occur once in prod but never gets noticed because there's no second run to make it obvious.

**Why it happens:**
Three.js setup code (`new WebGLRenderer`, `scene.add(...)`, `renderer.setAnimationLoop` / `requestAnimationFrame`) is written like a one-time imperative script, not like a React effect that must be idempotent and cleanly reversible.

**How to avoid:**
- Every value created in the effect (renderer, scene, geometries, materials, event listeners, animation frame id) must be disposed/removed in the effect's cleanup function, and the cleanup must fully undo the mount (remove canvas from DOM, `cancelAnimationFrame`, `renderer.dispose()`, remove all `addEventListener` calls added for resize/pointer events).
- Guard against the double-invoke either by writing effects that are naturally idempotent (cleanup fully reverses mount, so mount→cleanup→mount produces one correct scene, not two) — this is the *correct* fix — rather than reaching for a "only run once" ref-based hack that suppresses StrictMode's warning without fixing the underlying non-idempotency.
- Keep StrictMode **on** during development specifically so this class of bug surfaces early, rather than disabling it to make the symptom go away.

**Warning signs:**
- Two `<canvas>` elements in DevTools Elements panel after one mount.
- Click/raycasting handlers firing your click logic twice per click.
- Animation looking "faster" or micro-stuttering compared to a production build of the same code.
- FPS counter showing roughly double the expected draw calls in dev vs. prod.

**Phase to address:** 3D scene foundation phase (the phase that first wires Three.js into a React/Next.js component) — this must be solved before any other Three.js feature is layered on top, or the bug compounds across every subsequent scene addition.

---

### Pitfall 5: `window is not defined` / hydration mismatch from SSR touching WebGL

**What goes wrong:**
Next.js renders components on the server first (even for a "100% client-side app," page shells still go through Next's SSR/RSC pipeline unless explicitly opted out). Any Three.js setup code that runs during render (not inside `useEffect`) will crash with `ReferenceError: window is not defined` or `document is not defined` on the server, because `WebGLRenderer` needs `window`/`document`/`canvas.getContext('webgl2')`, none of which exist in Node. A related but sneakier variant: if the component *does* render conditionally based on `typeof window !== 'undefined'` directly in the render body (rather than via `dynamic(..., { ssr: false })` or an effect), the server-rendered HTML and the first client render will differ, producing a **hydration mismatch** warning/error even if nothing crashes outright.

**Why it happens:**
Copy-pasting Three.js "vanilla" tutorials that assume a plain HTML page with no SSR step, then dropping that code directly into a Next.js component body instead of an effect.

**How to avoid:**
- All Three.js instantiation lives inside `useEffect` (runs client-only, after hydration) — never in the component body or in module-level code that runs during import.
- For the top-level scene component itself, wrap it with `next/dynamic` and `{ ssr: false }`:
  ```tsx
  const SolarSystemScene = dynamic(() => import('./SolarSystemScene'), { ssr: false });
  ```
  This skips the component entirely on the server and during the first hydration pass, avoiding both the crash and the mismatch, and lets you show a loading placeholder (`loading: () => <CrtLoadingScreen />`) that matches what the CRT aesthetic wants anyway (in-scope: loading states with terminal styling).
- Do not reach for `useEffect` + `isMounted` state as a substitute for `dynamic(ssr:false)` at the canvas-owning component boundary — it works but produces an extra render pass and is easy to get subtly wrong (state set in an effect still causes a client-only re-render, which is essentially reimplementing what `dynamic` does for you, with more surface area for bugs).

**Warning signs:** Build/dev server crash mentioning `window is not defined`; browser console hydration warnings (`Text content does not match server-rendered HTML` or similar); canvas flashing/re-mounting once right after page load.

**Phase to address:** 3D scene foundation phase — decide the SSR boundary before writing any Three.js instantiation code.

---

### Pitfall 6: Postprocessing chain tanks mobile framerate because of DPR, not pass count alone

**What goes wrong:**
`EffectComposer` renders the full scene to an off-screen render target, then runs each pass (scanlines, vignette, chromatic aberration) as a full-screen shader over every pixel of that render target. The pixel count is driven by **canvas resolution × `devicePixelRatio`**. Many modern phones report `devicePixelRatio` of 2.5–4. Left uncapped (`renderer.setPixelRatio(window.devicePixelRatio)`), a phone with DPR 3 renders **9× the pixels** of a DPR-1 render, and every postprocessing pass re-touches all of those pixels, often multiple times (each shader pass is a full-screen draw). Combined with a phone GPU that's already far weaker than a desktop's, a 3-pass CRT chain that's imperceptible on desktop can drop mobile to single-digit FPS.

**Why it happens:**
Desktop dev testing (likely DPR 1–2 on a monitor) never surfaces the problem; it only appears once tested on an actual high-DPR phone, which is easy to skip during development.

**How to avoid:**
- Cap pixel ratio explicitly: `renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))`. Going to 2 instead of the native 3-4 is visually near-indistinguishable on a phone screen (pixels are already tiny) but is a 2-4x compute win.
- Consider capping lower still (1.5, or even 1) specifically on mobile/low-end detection, since the CRT scanline effect itself *adds* visual texture that partially hides resolution loss — this aesthetic actually works in your favor for degrading gracefully.
- Render target memory also scales with the same DPR²-driven pixel count; each additional full-resolution render target (composer's read/write buffers, plus any extra targets a custom pass needs) multiplies GPU memory pressure. Keep the postprocessing pass count minimal — combine scanlines + vignette + chromatic aberration into as few custom shader passes as reasonably possible rather than one pass per effect, since each pass is a full render-target round-trip.
- Provide a genuine "low-power" degrade path: on mobile or low-end GPU (detect via a simple heuristic — DPR combined with `navigator.hardwareConcurrency`, or simply "is this a touch-primary device"), either skip the composer entirely and fall back to a CSS-based scanline overlay, or reduce to a single combined shader pass with cheaper math (skip chromatic aberration, keep scanlines/vignette).

**Warning signs:** Dev-tools "no throttling" desktop FPS looks fine, but real-device (not just Chrome DevTools mobile emulation — actual phone) testing shows visible frame drops or a hot/throttling phone within a minute of use.

**Phase to address:** CRT postprocessing phase (build the degrade path in the same phase the shaders are built, not as an afterthought) — and re-verify in the mobile/responsive phase with a real device.

---

### Pitfall 7: Photosensitive-seizure risk from scanline flicker + rapid animation (real safety issue, not just polish)

**What goes wrong:**
WCAG 2.3.1 (Level A — the *minimum* bar for any published site) prohibits content that flashes more than **3 times per second**, where a "flash" is a pair of opposing luminance changes of ≥10% (with an even stricter threshold for saturated red). A CRT scanline effect that animates (moves, pulses, or flickers) plus rapid data-driven animation (e.g., a CME event "erupting" from the sun, or a chromatic-aberration pulse on new-data-arrival) can combine to cross this threshold even if neither effect alone would. This is a genuine legal/accessibility floor (Level A, not an "AA nice-to-have"), and separately a real safety concern for the ~1 in 4,000 people with photosensitive epilepsy — this is not a hypothetical edge case, it's a documented trigger category.

**Why it happens:**
"CRT flicker" is treated as a purely aesthetic decision made by eye ("does it look retro enough?") without ever measuring flash rate/luminance delta, and scanlines are often implemented as a *static* pattern that only becomes risky once someone later adds animation/pulsing to make it feel more "alive" — the risk creeps in incrementally.

**How to avoid:**
- Keep the scanline shader itself **static or very subtly animated** (well under 3Hz, e.g., a slow scroll over multiple seconds, not a flicker) — this preserves the CRT aesthetic (real CRTs have visible but non-seizure-inducing scan patterns) without approaching the flash threshold.
- Any moment-to-moment "alert" animation (new CME detected, new hazardous asteroid flagged) should use a smooth fade/glow, not a hard strobe, and should never exceed 3 luminance-changes/second on a significant portion of the viewport.
- Implement `prefers-reduced-motion` as a **hard gate**, not just "reduce speed a bit": when `matchMedia('(prefers-reduced-motion: reduce)').matches` is true, disable camera auto-rotation/idle animation, disable any pulsing/flicker shader uniform (freeze it at a static value), and keep the 3D scene navigable but visually calm. This is both an accessibility requirement and a pragmatic mobile-battery win.
- Do a manual check before shipping: record a short screen capture of the CRT effect in motion and step through frame-by-frame (or use a tool like PEAT — Photosensitive Epilepsy Analysis Tool) to confirm no region flashes >3×/sec at >10% luminance delta. This is cheap to do once and is the actual verification method the accessibility field uses, not just "eyeballing it."
- Treat this as launch-blocking for the CRT postprocessing phase, not a "we'll add reduced-motion support later" backlog item — flicker safety and the aesthetic are built together or the retrofit is painful (every animated shader uniform needs a reduced-motion branch).

**Warning signs:** Any shader uniform that oscillates (sin/cos-driven flicker, noise-driven flicker) without a documented frequency; no `prefers-reduced-motion` handling anywhere in the postprocessing code; "flicker" implemented as a per-frame random opacity jitter (a very common and very risky CRT-effect shortcut).

**Phase to address:** CRT postprocessing phase — design the flicker/scanline shader with an explicit frequency cap and a `prefers-reduced-motion` uniform branch from the start. Verify in the mobile/accessibility phase.

---

### Pitfall 8: Phosphor green / magenta on black looks high-contrast but scanlines/aberration silently erode it

**What goes wrong:**
Bright phosphor green (e.g. `#33FF33`/`#00FF66`-range) or magenta (`#FF00FF`-range) text on near-black background produces a very high raw contrast ratio (well above the WCAG AA 4.5:1 text minimum and typically above the AAA 7:1 bar too) — so a naive contrast check passes easily. The actual risk isn't the base colors, it's what gets layered **on top**: a scanline overlay that darkens alternating rows (reducing local luminance under text), a vignette that dims the edges of the viewport (where HUD panels often live), and chromatic-aberration channel-shifting that can fringe text edges with color halos that reduce perceived sharpness/legibility even when measured contrast is technically still compliant. Contrast checkers evaluate the *base* colors, not the *rendered-with-effects* pixels — so a compliant palette can still ship an illegible screen once the CRT filter is composited on top.

**Why it happens:**
Contrast is checked once, early, against flat color swatches — then postprocessing is added later as a separate visual layer without re-checking legibility of actual on-screen text through the final composited effect.

**How to avoid:**
- Never apply scanline darkening or vignette dimming *over actual text/data* at full effect strength — dedicate the CRT effect intensity mainly to the 3D scene canvas and empty space, and reduce (not eliminate — keep the aesthetic) scanline/vignette opacity specifically over HUD text panels, either via a lower-intensity shader region, a semi-opaque panel backdrop behind text, or applying the CRT postprocessing only to the 3D canvas layer while HUD/overlay text renders as separate DOM elements *above* the postprocessing composite (a well-known cheap trick: keep data-critical text as real HTML/CSS outside the WebGL canvas, apply CRT-style CSS filters like `text-shadow`/subtle scanline background separately and more conservatively, so critical text never depends on the WebGL shader chain for legibility).
- Cap chromatic aberration intensity specifically — a small, tasteful RGB channel offset (a few pixels at most) reads as "CRT" without meaningfully blurring text; a heavy-handed aberration used purely for visual drama over data panels defeats the dashboard's actual job (users need to read asteroid distances/velocities, not just admire the aesthetic).
- Re-verify contrast/legibility with the actual composited output (screenshot the final rendered HUD, not the flat design swatches) before considering the CRT phase done.

**Warning signs:** Contrast checker passes on the design tokens but a real screenshot of a HUD panel with full CRT effect applied is genuinely hard to read at a glance; testers/self-review need to squint or increase brightness to read numbers.

**Phase to address:** CRT postprocessing phase for the effect design; HUD/overlay phase for the decision to keep critical text outside the WebGL-shader chain.

---

### Pitfall 9: WebGL context loss on mobile — this is not a hypothetical, it will happen

**What goes wrong:**
Mobile browsers (especially iOS Safari, and Android Chrome under memory pressure) aggressively reclaim GPU resources when a tab is backgrounded, when the device is low on memory, or sometimes even just when switching apps briefly. This fires a `webglcontextlost` event on the canvas, after which **all WebGL resources (textures, buffers, programs, the renderer's GL context itself) become invalid** — draw calls silently no-op or the canvas goes blank/black. Without an explicit listener, the app doesn't crash, it just stops rendering and gives the user zero signal that anything is wrong (worse than an error, because it looks like a frozen/broken page with no way to tell what happened). If a context is later restored (`webglcontextrestored`), Three.js does **not** automatically re-upload all your resources — geometries/materials/textures need to be effectively re-initialized against the new context, or need to have originally been created in a way Three.js can rebuild automatically (which is not guaranteed for custom shader materials/render targets without extra handling).

**Why it happens:**
Desktop development rarely triggers context loss (desktop GPUs have far more headroom), so the failure mode is invisible until real mobile usage — often after the app has been "done" for a while, making it a nasty pre-launch or post-launch surprise.

**How to avoid:**
- Explicitly listen for both events on the canvas:
  ```js
  canvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault(); // required to allow context restoration
    // stop the render loop, show a CRT-styled "signal lost / reconnecting" state
  }, false);
  canvas.addEventListener('webglcontextrestored', () => {
    // reinitialize renderer-dependent resources, restart the render loop
  }, false);
  ```
  Calling `e.preventDefault()` in the `contextlost` handler is required — without it, the browser will not attempt to restore the context at all.
  On the aesthetic side, a "SIGNAL LOST — RECONNECTING" terminal-style message is a natural fit for this exact failure mode and turns a bug into an in-theme feature.
- Test this for real: Chrome DevTools has a way to force context loss (via the WEBGL_lose_context extension, or the "GPU crashed" simulation in some versions) — use it during the mobile phase rather than waiting to hit it organically on a real device.
- Keep the render loop paused (via `document.visibilitychange` or `renderer.setAnimationLoop(null)`) when the tab is hidden anyway — this reduces the *frequency* of context loss (less GPU pressure while backgrounded) and saves battery, which is good practice regardless.

**Warning signs:** Canvas goes solid black/blank after switching apps on a phone and returning; no console error, just dead rendering; works fine in every desktop test.

**Phase to address:** Mobile/responsive phase — but the event listeners and pause-on-hidden logic should live in the same module as the renderer setup (3D scene foundation phase), since it's core render-loop lifecycle management, not a mobile-only add-on.

---

### Pitfall 10: Touch/orbit-control conflicts and viewport height issues break mobile interaction

**What goes wrong:**
Two related but distinct mobile issues: (1) Raycasting click handlers written against `mousedown`/`click` work on mobile too (touch generates synthetic mouse/pointer events in modern browsers), but **orbit/drag controls and raycasting can fight each other** — a touch-drag intended to rotate the camera can also register as a "click" on release, triggering an unwanted HUD overlay open, or conversely a tap intended to select an asteroid gets swallowed by the drag-controls' touch handling. Using the unified Pointer Events API (`pointerdown`/`pointermove`/`pointerup` with `event.pointerType`) rather than mixing `touchstart`/`mousedown` listeners avoids most of this, but still requires explicit drag-vs-tap disambiguation (e.g., only treat it as a "click" for raycasting if pointer movement between down/up stayed under a small pixel threshold). (2) `100vh` in CSS does **not** account for mobile browser chrome (address bar, bottom toolbar) that shows/hides on scroll — a full-height single-screen dashboard laid out with `100vh` will have content cut off or an ugly resize-jump as the browser chrome collapses on scroll, which is especially bad for a "single screen, no scroll-to-navigate" layout where every pixel of vertical space is planned around.

**Why it happens:**
`100vh` "just works" on desktop (no dynamic chrome), so it's rarely questioned until mobile testing; touch/click conflicts are invisible until testing on an actual touchscreen since desktop mouse testing never exercises drag-vs-tap ambiguity.

**How to avoid:**
- Use Pointer Events uniformly (`addEventListener('pointerdown', ...)` etc.) for both orbit controls and raycasting selection, and implement a small movement-threshold check (e.g., <5-10px total movement between down/up) to distinguish "tap to select" from "drag to orbit."
- Use the modern CSS dynamic viewport units — `100dvh` (dynamic viewport height, accounts for browser chrome show/hide) instead of `100vh` for the full-screen layout, with a `100vh` fallback for browsers that don't support `dvh` (support is now broad across current mobile browsers, but a fallback costs nothing).
- Test on a real phone, not just DevTools' mobile viewport emulation, specifically for the scroll-triggered browser-chrome collapse behavior — emulation does not reproduce this.

**Warning signs:** Bottom of the layout (often exactly where a HUD panel or the CRT vignette edge lives) getting clipped or jumping on real-phone scroll; taps on asteroids in the 3D scene either not registering or triggering an unwanted camera-drag; clicks that only work reliably with a very precise, still tap.

**Phase to address:** Raycasting/HUD interaction phase for the pointer-event handling; mobile/responsive phase for the `dvh` viewport fix — both should be verified together since they're both "real device only" bugs.

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|--------------------|-----------------|------------------|
| Skipping `X-RateLimit-Remaining` tracking, just handling 429 reactively | Less code up front | Users see failures with no warning; no way to degrade proactively before hitting the wall | Never for this project — rate limits are a named, in-scope risk |
| Uncapped `devicePixelRatio` during initial dev | Sharper visuals on your own dev monitor, one less line of code | Invisible until real mobile testing, then a late-stage performance fire drill | Never past the first working prototype — cap it from the first `WebGLRenderer` setup |
| One `useEffect` per Three.js "feature" (lights, camera, objects) each creating/disposing independently | Faster to write incrementally, feels modular | Partial-cleanup bugs — one effect's cleanup can run while another still references shared scene/renderer state, causing null-reference errors on fast refresh/unmount | Only acceptable if each effect owns fully independent resources; shared renderer/scene should be a single lifecycle, not scattered across effects |
| Skipping `webglcontextlost` handling because "it works on my desktop" | Zero extra code | Silent, unrecoverable blank canvas for real mobile users with no error signal | Never — this is a certainty on mobile, not an edge case |
| Applying CRT postprocessing effects at full intensity everywhere, including over text/HUD panels | Visually striking, consistent effect everywhere, simpler shader | Data becomes hard to read, defeating the dashboard's actual purpose | Only for the 3D scene background; never at full intensity over data-critical text |

## Integration Gotchas

Common mistakes when connecting to external services.

| Integration | Common Mistake | Correct Approach |
|--------------|------------------|--------------------|
| NASA NeoWs `/feed` | Requesting >7-day ranges, or looping single-day requests to build a longer history | Single request within the 7-day cap; if `end_date` omitted, it defaults to `start_date + 7` — use that default rather than hand-computing dates |
| NASA DONKI (`/CME`, `/FLR`, notifications) | Omitting `startDate`/`endDate` and being surprised by the ~30-day default window (much more data than expected, or unexpectedly empty if the last 30 days had no events for a given event type) | Explicitly pass a deliberate, small date range appropriate for a "recent activity" panel rather than relying on the 30-day default; treat an empty array as a normal "no recent events" state, not an error |
| Both NeoWs and DONKI | Treating an empty `[]` response the same as a fetch error in the UI (e.g., both render a generic "ERROR" state) | Distinguish "successfully fetched, zero results" (e.g., "NO HAZARDOUS OBJECTS DETECTED — ALL CLEAR" in terminal style, which fits the aesthetic) from "fetch failed / rate-limited" (distinct CRT-styled error/rate-limit banner, already in scope) |
| Both APIs, from the browser | Assuming CORS could block requests and reaching for a proxy "just in case" | api.nasa.gov endpoints support direct browser CORS requests (this is how DEMO_KEY-based client demos work at all) — no proxy is needed for CORS reasons; the only reason you'd want a backend is to hide the key, which this project has explicitly decided against |
| Rate-limited responses | Only checking `response.ok`/status code and showing a generic error for a 429 | Special-case 429 specifically with a distinct "RATE LIMIT — TRY AGAIN LATER" terminal message (different from a 500/network-error message), since the user's next action (wait vs. retry immediately) differs |

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|------------------|
| Uncapped `devicePixelRatio` | Smooth on your dev monitor; janky/hot on phones | `renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))` set once, at renderer creation | Any phone with DPR ≥2.5 (very common — most mid/high-end phones from the last several years) |
| One `EffectComposer` pass per visual effect (separate scanline pass, separate vignette pass, separate CA pass) | Fine on desktop GPU; compounding cost on mobile as each pass round-trips a full-resolution render target | Combine scanlines + vignette + chromatic aberration into fewer custom shader passes where feasible | Mobile GPUs, especially mid-range/older devices, once 3+ full-screen passes stack |
| Re-creating geometries/materials every render/frame instead of once at setup | Invisible at first (few asteroids), then dropped frames as data grows | Create geometries/materials once, reuse via instancing or object pooling if the asteroid/CME count is data-driven and can vary | As soon as NeoWs returns a non-trivial number of near-earth objects for a busy week (can be dozens) |
| No pause on `document.visibilitychange` for the render loop | Wastes battery/GPU even when tab isn't visible; increases odds of mobile context loss under pressure | Pause `requestAnimationFrame`/`setAnimationLoop` when `document.hidden` | Any extended background-tab session on mobile |

## Security Mistakes

Domain-specific security issues beyond general web security.

| Mistake | Risk | Prevention |
|---------|------|------------|
| Hardcoding the NASA API key directly in source instead of an env var | Key can't be rotated without a code change/redeploy if it's ever abused/exhausted | Use `NEXT_PUBLIC_NASA_API_KEY` via Vercel environment variables — still bundle-visible (expected/accepted), but rotatable without touching code |
| Assuming "no backend" means "no attack surface" | False sense of security; actual exposure is quota-drain via key scraping (low severity but real, see Pitfall 2) | Document the accepted risk explicitly (already done in PROJECT.md); don't reuse this key for anything with cost/PII implications |
| Rendering any NASA API response fields directly into the DOM without escaping (e.g., a notification `title`/`body` from DONKI) | Low-likelihood but real XSS surface if NASA ever returns unexpected content in a text field and it's inserted via `innerHTML` | Use React's default text rendering (`{data.title}`) rather than `dangerouslySetInnerHTML`; never construct HTML strings from API text fields |

## UX Pitfalls

Common user experience mistakes in this domain.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-------------------|
| Blank screen on API failure/rate-limit | Looks broken; portfolio visitors bounce immediately | Already scoped: CRT-styled error/rate-limit/loading states so a NASA outage or quota exhaustion reads as an intentional in-universe state ("SIGNAL LOST"), not a bug |
| CRT effect intensity uniform everywhere, including over data | Data illegible, defeats the dashboard's purpose | Keep full CRT intensity on the 3D scene/background, dial it back over HUD text panels (Pitfall 8) |
| No distinction between "zero results" and "fetch failed" | User can't tell if there's genuinely no hazardous asteroid today or if the app is broken | Distinct copy/visual state for each (see Integration Gotchas table) |
| Orbit-drag and tap-to-select fighting each other on mobile | Frustrating, feels broken, users give up interacting with the 3D scene entirely | Pointer Events + movement-threshold disambiguation (Pitfall 10) |
| Auto-rotating camera / constant scene motion with no way to stop it | Distracting at best, uncomfortable/unsafe at worst for motion-sensitive or photosensitive users | `prefers-reduced-motion` hard-gates idle animation and flicker (Pitfall 7); consider also a manual pause control regardless of OS setting |

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **Three.js scene lifecycle:** Often missing full `dispose()` of geometries/materials/textures/render-targets and renderer on unmount — verify by mounting/unmounting the scene component repeatedly (or toggling StrictMode) and watching the Chrome Performance Monitor's GPU memory / "JS Heap" and the `about:gpu` or DevTools Memory tab for growth that never comes back down.
- [ ] **Rate-limit handling:** Often "handled" only as a generic error toast — verify by actually exhausting the quota in a dev session (or mocking a 429 response) and confirming the specific rate-limit UI (not a generic error) appears.
- [ ] **Mobile testing:** Often only verified via DevTools device emulation — verify on at least one real phone for: DPR-driven performance, `webglcontextlost` on backgrounding, touch/orbit interaction, and `100vh`/browser-chrome viewport clipping. Emulation does not reproduce any of these four reliably.
- [ ] **`prefers-reduced-motion`:** Often implemented as "slow the animation down a bit" — verify it fully freezes flicker/pulse uniforms and idle camera motion, and test by toggling the OS-level reduced-motion setting (not just a CSS media query in isolation) and confirming the shader actually stops animating those properties.
- [ ] **SSR boundary:** Often "fixed" with a scattered `typeof window !== 'undefined'` check rather than a clean `dynamic(..., { ssr: false })` boundary — verify there's no hydration-mismatch warning in the browser console on a fresh page load (not just a fast-refresh reload, which can mask it).
- [ ] **Empty-state vs error-state for API data:** Often both collapse to the same "no data" UI — verify a genuinely empty DONKI response (e.g., request a date range you know had no CMEs) renders differently from a simulated fetch failure.

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|----------------|------------------|
| DEMO_KEY quota exhausted mid-development | LOW | Register a personal key immediately (instant, free); switch env var; resume |
| Discovered memory leak (GPU memory climbing on navigation) late in development | MEDIUM | Audit every `new THREE.*` call for a matching `.dispose()` in cleanup; usually isolated to 1-2 components once found via Memory tab heap snapshots diffed across mount/unmount cycles |
| Postprocessing chain performs badly on mobile after CRT phase is "done" | MEDIUM | Add the DPR cap (one line) first — often resolves most of it; if still slow, add a low-power fallback path (fewer/combined passes) gated on a simple device heuristic |
| Photosensitivity/flash-threshold issue found late (shader flickers too fast) | LOW–MEDIUM | Usually a single frequency constant in the shader; cap it and add the `prefers-reduced-motion` branch if missing — contained fix, not an architecture change, *if* the shader was written with a tunable frequency uniform from the start (this is why doing it right in Pitfall 7's phase matters — retrofitting a hardcoded flicker is more invasive) |
| `webglcontextlost` never handled, discovered via real-device testing | MEDIUM | Add the listener pair (Pitfall 9); reinitializing resources on restore may require refactoring resource creation into a callable `initScene()` function if it was originally inline in the mount effect only |

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|--------------------|----------------|
| Rate limit exhaustion (client-only, shared key) | Data-fetching/API integration phase | Exhaust quota deliberately in dev (or mock 429) and confirm graceful UI + no wasted retries |
| Exposed key risk framing | Deployment/hardening phase | Key lives in a Vercel env var, documented as rotatable, not hardcoded |
| NeoWs 7-day range | NeoWs integration phase | Date-range assertion/validation in the fetch code; manual test of a >7-day request rejected/clamped before it ships |
| DONKI default window surprises | DONKI integration phase | Explicit date params always passed; empty-array response renders a distinct "no events" state |
| StrictMode double renderer/canvas | 3D scene foundation phase | Toggle StrictMode on/off and confirm identical single-canvas, single-loop behavior either way |
| SSR/`window` crash + hydration mismatch | 3D scene foundation phase | Fresh page load with console open shows zero hydration warnings; `next build && next start` (prod mode) tested, not just `next dev` |
| Postprocessing mobile performance | CRT postprocessing phase, re-verified in mobile/responsive phase | Real-device FPS check with DPR cap in place; degrade path exercised on a real low/mid-end phone |
| Photosensitive flicker / `prefers-reduced-motion` | CRT postprocessing phase | Frame-by-frame flicker check (manual or PEAT-style) under 3Hz; OS-level reduced-motion toggle verified to freeze animation |
| CRT effect vs. text legibility | CRT postprocessing phase + HUD/overlay phase | Screenshot of composited HUD panel reviewed for actual readability, not just flat-color contrast check |
| `webglcontextlost` on mobile | 3D scene foundation phase (listener wiring), mobile/responsive phase (real-device verification) | Forced context-loss test (DevTools extension or real backgrounding on a phone) shows a themed "signal lost" state, not a blank canvas |
| Touch/orbit/raycast conflicts + `100vh` | Raycasting/HUD interaction phase (pointer events), mobile/responsive phase (`dvh` viewport) | Real-phone tap-to-select and drag-to-orbit both work reliably; layout doesn't clip/jump on scroll |

## Sources

- [api.data.gov Developer Manual — rate limits](https://api.data.gov/docs/rate-limits/) — HIGH confidence, official source for the api.data.gov platform that issues NASA API keys; confirms default 1,000 req/hour for registered keys and 429 behavior on exceeding limits
- NASA API DEMO_KEY limits (30/hour, 50/day per IP) — corroborated across multiple independent developer write-ups referencing api.nasa.gov's published limits (Zuplo, Nexla docs, DEV Community); MEDIUM-HIGH confidence — consistent across sources and matches the figure already noted in PROJECT.md's own risk assessment
- NeoWs `/feed` 7-day maximum range and `end_date` default behavior — corroborated across `nasa/api-docs` GitHub issue discussion, multiple third-party NeoWs client libraries/wrappers (npm `nasa-neows`, Go `nasa` package docs), and tutorial write-ups; HIGH confidence — this is a load-bearing, consistently-documented constraint
- DONKI `startDate`/`endDate` ~30-day default window — corroborated across ToolUniverse's DONKI tool docs and multiple NASA API wrapper libraries describing the same default; MEDIUM-HIGH confidence
- [Three.js official manual — How to dispose of objects](https://threejs.org/manual/en/how-to-dispose-of-objects.html) — HIGH confidence, official documentation; confirms geometries/materials/textures/render targets/scenes all require explicit `.dispose()` and are not garbage-collected by the browser while the page is alive
- WCAG 2.1 Success Criterion 2.3.1 "Three Flashes or Below Threshold" (W3C Understanding doc, boia.org, digitala11y.com, getstark.co) — HIGH confidence, this is a Level A normative requirement with a precisely defined threshold (>3 flashes/sec, ≥10% luminance delta), directly applicable to an animated CRT/scanline effect
- `devicePixelRatio` / `setPixelRatio` mobile performance guidance — corroborated across three.js Discourse forum threads and multiple WebGL/Three.js performance guides describing the DPR-squared pixel-fill cost and the common `Math.min(devicePixelRatio, 2)` mitigation; MEDIUM-HIGH confidence (community consensus, not a single official source, but very consistent)
- `webglcontextlost`/`webglcontextrestored` event behavior and the required `preventDefault()` call — general WebGL spec behavior, consistent with MDN and Khronos WebGL documentation on context loss handling; HIGH confidence
- React StrictMode double-invoke behavior (dev-only, mount→cleanup→mount) — official React documentation behavior for `useEffect` under StrictMode, well-established and unchanged across React 18/19; HIGH confidence
- `next/dynamic` with `{ ssr: false }` as the standard pattern for client-only WebGL/canvas components in Next.js — consistent with Next.js official documentation on dynamic imports and disabling SSR for browser-only libraries; HIGH confidence

---
*Pitfalls research for: client-side Next.js + vanilla Three.js NASA data dashboard with CRT postprocessing*
*Researched: 2026-08-26*
