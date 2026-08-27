# Architecture Research

**Domain:** Client-side Next.js dashboard with a vanilla Three.js scene as primary view, driven by NASA REST data, with shared selection state between 3D scene and 2D terminal panels
**Researched:** 2026-08-26
**Confidence:** MEDIUM-HIGH (core React/Three.js boundary and postprocessing patterns are well-established, cross-checked across multiple community and official sources; StrictMode-specific guidance is community consensus, not an official React doc)

## Standard Architecture

### System Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│                         React / Next.js Layer                         │
├──────────────────────────────────────────────────────────────────────┤
│  ┌───────────────┐  ┌────────────────┐  ┌─────────────────────────┐  │
│  │ Page (RSC)    │  │ DashboardShell  │  │ SceneCanvas (client)    │  │
│  │ static shell  │  │ (client)        │  │ owns <canvas> + mount   │  │
│  └───────┬───────┘  └────────┬────────┘  └────────────┬────────────┘  │
│          │                   │                         │              │
│          │         ┌─────────┴─────────┐               │              │
│          │         │  2D Panels (React) │              │              │
│          │         │  Asteroid list,    │              │              │
│          │         │  DONKI alerts,     │              │              │
│          │         │  HUD overlay       │              │              │
│          │         └─────────┬─────────┘               │              │
├──────────┴────────────────────┴─────────────────────────┴─────────────┤
│                    Data Layer (React-owned, hooks)                    │
│  ┌────────────────────┐   ┌────────────────────┐                     │
│  │ useNeoWsFeed()      │   │ useDonkiEvents()    │  fetch + cache      │
│  └──────────┬──────────┘   └──────────┬──────────┘                    │
├─────────────┴──────────────────────────┴───────────────────────────────┤
│                  Shared State (Zustand store, framework-agnostic)      │
│  ┌───────────────┐  ┌────────────────┐  ┌──────────────────────────┐  │
│  │ selectedId    │  │ hoveredId       │  │ hudOpen / hudData        │  │
│  └───────────────┘  └────────────────┘  └──────────────────────────┘  │
├──────────────────────────────────────────────────────────────────────┤
│                Three.js Layer (imperative, outside React state)       │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌──────────────────┐   │
│  │ SceneEngine│ │ Raycaster  │ │ AsteroidLayer│ │ EffectComposer   │   │
│  │ (renderer, │ │ (pointer→  │ │ CmeLayer     │ │ (CRT postFX)     │   │
│  │ camera,    │ │ picks obj, │ │ (data-driven,│ │                  │   │
│  │ loop)      │ │ writes to  │ │ built from   │ │                  │   │
│  │            │ │ store)     │ │ NASA data)   │ │                  │   │
│  └────────────┘ └────────────┘ └────────────┘ └──────────────────┘   │
└──────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|-------------------------|
| `SceneCanvas` (React client component) | Owns the `<canvas>` DOM node, mounts/unmounts the Three.js engine via `useEffect`, owns nothing about scene internals | `useRef<HTMLCanvasElement>`, single `useEffect` with full setup+teardown |
| `SceneEngine` (plain TS class, not React) | Renderer, camera, scene graph, render loop, resize handling, disposal | Constructed once per mount; exposes `updateAsteroids(data)`, `updateCme(data)`, `dispose()` |
| Data hooks (`useNeoWsFeed`, `useDonkiEvents`) | Fetch NASA data on demand, expose `{data, error, isLoading}` to React tree | `fetch` in `useEffect` or SWR/TanStack Query for caching + retry/backoff on rate limits |
| Zustand store (`useSceneStore`) | Single source of truth for selection/hover/HUD state, readable and writable from both React and imperative Three.js code | Plain store created with `create()`, used via hook in React, via `getState()/setState()` in Three.js callbacks |
| 2D Panels (React) | Render asteroid list, DONKI alerts, timeline chart — read data hooks + store, dispatch selection on click | Plain function components subscribing to the store |
| HUD overlay | Absolutely positioned React component anchored over the canvas, shows detail for `selectedId` | Reads `selectedId` + data cache from store/hooks, projects 3D position if anchored |
| `EffectComposer` chain | CRT postprocessing (chromatic aberration → scanlines → vignette) | Lives inside `SceneEngine`, driven by the same render loop, no React involvement |

## Recommended Project Structure

```
src/
├── app/
│   ├── layout.tsx              # RSC root layout, fonts, global CSS
│   ├── page.tsx                # RSC shell; renders <DashboardShell /> (client)
│   └── globals.css             # CRT palette tokens, terminal font, base resets
├── components/
│   ├── scene/
│   │   ├── SceneCanvas.tsx     # client component: canvas ref, mount effect, resize
│   │   └── SceneHudOverlay.tsx # anchored HTML labels/HUD driven by Vector3.project
│   ├── panels/
│   │   ├── AsteroidListPanel.tsx
│   │   ├── AsteroidDetailPanel.tsx
│   │   ├── SpaceWeatherPanel.tsx
│   │   └── SolarActivityChart.tsx
│   ├── hud/
│   │   └── TerminalHud.tsx     # click-triggered detail overlay (asteroid/CME)
│   └── ui/                     # generic terminal-styled primitives (Panel, Badge, Loader)
├── three/
│   ├── SceneEngine.ts          # renderer/camera/scene/loop/resize/dispose — the ONLY class that touches THREE directly at the top level
│   ├── createSolarSystem.ts    # sun, planet pivots, orbit LineLoops
│   ├── AsteroidLayer.ts        # builds/updates asteroid meshes from NeoWs data
│   ├── CmeLayer.ts             # builds/updates CME burst effects from DONKI data
│   ├── raycastController.ts    # pointer/touch → raycaster → store.setSelection()
│   ├── postprocessing/
│   │   ├── composer.ts         # EffectComposer wiring, pass order
│   │   ├── ChromaticAberrationShader.ts
│   │   ├── ScanlineShader.ts
│   │   └── VignetteShader.ts
│   └── utils/
│       ├── dispose.ts          # recursive geometry/material/texture disposal helper
│       └── projectToScreen.ts  # Vector3.project → pixel coords helper
├── lib/
│   ├── nasa/
│   │   ├── client.ts           # fetch wrapper, API key, base URLs, error normalization
│   │   ├── neows.ts            # NeoWs feed + lookup + response mappers
│   │   └── donki.ts            # DONKI CME/FLR + mappers
│   ├── hooks/
│   │   ├── useNeoWsFeed.ts
│   │   └── useDonkiEvents.ts
│   └── risk/
│       └── classifyAsteroid.ts # distance/velocity/size → risk model (pure functions)
├── store/
│   └── sceneStore.ts           # Zustand store: selectedId, hoveredId, hudOpen, setters
└── types/
    ├── neows.ts
    └── donki.ts
```

### Structure Rationale

- **`three/` is isolated from `components/`:** nothing under `three/` imports React or JSX. This enforces the boundary — Three.js code is plain TypeScript that receives data and DOM refs as plain arguments/callbacks, never hooks. This is what makes the vanilla-Three.js learning goal real: you cannot accidentally lean on React's reactivity to solve a Three.js problem.
- **`SceneEngine.ts` is the single owning class:** one object per mount, holds `renderer`, `scene`, `camera`, `composer`, and layer instances. `SceneCanvas.tsx` never touches `THREE.*` directly — it only calls `new SceneEngine(canvas)`, `engine.updateAsteroids(data)`, `engine.dispose()`. This is the thin adapter boundary.
- **`store/sceneStore.ts` at the top level, not under `components/` or `three/`:** it is the shared seam both sides import. Neither side owns it exclusively.
- **`lib/nasa/` is fetch/mapping only, no React:** hooks in `lib/hooks/` wrap it for React consumption. This lets `SceneEngine` layers (if ever needed) or tests call the same mappers without React.
- **`lib/risk/` is pure functions:** the asteroid risk classifier has no framework dependency, easy to unit test, callable from both a React panel and (if ever needed) a Three.js label.

## Architectural Patterns

### Pattern 1: React owns the mount point, a plain class owns the Three.js world

**What:** A single client component (`SceneCanvas`) is the only place `useRef`/`useEffect` touch Three.js. Everything Three.js-side — scene graph, materials, render loop, disposal — lives in a plain TypeScript class (`SceneEngine`) instantiated inside the effect. React never re-renders because of anything happening inside `SceneEngine`; `SceneEngine` never triggers a React re-render directly (it only writes to the Zustand store, which React subscribes to separately).

**When to use:** Always, for this project. This is the canonical non-R3F integration pattern.

**Trade-offs:** More boilerplate than R3F (you write the render loop, disposal, and resize handling by hand) — but this is explicitly the point: the user is learning the real Three.js API, not a declarative wrapper over it.

**Example:**
```typescript
// components/scene/SceneCanvas.tsx
'use client';
import { useEffect, useRef } from 'react';
import { SceneEngine } from '@/three/SceneEngine';
import { useSceneStore } from '@/store/sceneStore';

export function SceneCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<SceneEngine | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Setup: create the whole world fresh every mount.
    const engine = new SceneEngine(canvasRef.current);
    engineRef.current = engine;
    engine.start(); // internally: renderer.setAnimationLoop(...)

    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      engine.resize(width, height);
    });
    ro.observe(canvasRef.current);

    // Cleanup: fully tear down. Must be symmetric with setup.
    return () => {
      ro.disconnect();
      engine.dispose(); // stops loop, disposes geometries/materials/renderer, removes listeners
      engineRef.current = null;
    };
  }, []); // empty deps: this effect owns a whole lifecycle, not a reactive value

  return <canvas ref={canvasRef} />;
}
```

```typescript
// three/SceneEngine.ts — plain class, no React import anywhere in this file
export class SceneEngine {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private composer: EffectComposer;
  private disposed = false;

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
    // ...build sun, orbit groups, lights...
    this.composer = createComposer(this.renderer, this.scene, this.camera);
  }

  start() {
    this.renderer.setAnimationLoop(() => {
      if (this.disposed) return;
      // update orbit rotations, then composer.render() instead of renderer.render()
      this.composer.render();
    });
  }

  resize(width: number, height: number) {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
    this.composer.setSize(width, height);
  }

  dispose() {
    this.disposed = true;
    this.renderer.setAnimationLoop(null); // stops the loop cleanly
    this.scene.traverse((obj) => disposeObject3D(obj)); // geometry/material/texture
    this.renderer.dispose();
  }
}
```

### Pattern 2: StrictMode double-mount survival via idempotent setup/teardown (not disabling StrictMode)

**What:** React 18/19 development mode invokes `useEffect` setup → cleanup → setup again on initial mount, specifically to surface effects that leak resources or assume "runs once." A naive Three.js `useEffect` that creates a renderer/WebGL context without a matching, complete cleanup will leak a GPU context and/or end up with two render loops racing.

**When to use:** Always — this is not optional for any Three.js-in-React integration.

**Trade-offs:** None real; the "cost" is writing a genuinely complete `dispose()` (renderer, geometries, materials, textures, event listeners, animation loop), which you should be writing anyway to avoid leaks on route changes / hot reload. The common wrong "fix" — wrapping init in a ref-guard that skips the second run — hides an incomplete cleanup instead of fixing it, and can bite you later during Fast Refresh or when the component genuinely remounts (e.g. conditional rendering).

**The correct fix, concretely:**
1. `dispose()` must call `renderer.setAnimationLoop(null)` (stops the RAF loop registered via the renderer, safer than manually tracking a `requestAnimationFrame` id across an unmount).
2. `dispose()` must traverse the scene graph and call `.geometry.dispose()` / `.material.dispose()` (and dispose any textures) on every mesh — Three.js does **not** do this automatically on `scene.remove()`.
3. `dispose()` must call `renderer.dispose()` to free the WebGL context.
4. `dispose()` must remove every `addEventListener` the setup added (pointer/touch listeners, `ResizeObserver`).
5. With all four in place, mount → unmount → remount (what StrictMode simulates) produces an identical end state to a single mount. This is the actual fix: make the effect idempotent under double invocation, don't suppress the invocation.

### Pattern 3: A framework-agnostic store as the React ↔ Three.js selection bridge

**What:** A Zustand store (or equivalent — any store exposing `getState()/setState()/subscribe()` outside of hooks) holds `selectedId`, `hoveredId`, and derived HUD state. Because Zustand's store object works identically whether called from a React hook or from plain JS, the Three.js raycast callback can call `useSceneStore.getState().selectObject(id)` directly — no hooks, no React import in `three/` — while React panels use `useSceneStore((s) => s.selectedId)` to subscribe and re-render.

**When to use:** This is the recommended approach over the alternatives for this project:
- **Lifted React state** (`useState` in a shared parent) would force the Three.js mount effect to live in — or receive callbacks threaded through — the same component tree level as the state, coupling scene lifecycle to render-triggering state and risking re-running the mount effect on selection changes if dependencies aren't guarded carefully.
- **A raw `EventEmitter`** works but reinvents subscription management, batching, and equality checks that Zustand (built on `useSyncExternalStore`) already provides for free, and gives you no single inspectable "current state" object for debugging.
- **Zustand** gives both: imperative access for Three.js, subscription-based reactivity for React, with no coupling between scene lifecycle and store updates.

**Trade-offs:** One more dependency (small, ~1kB, zero-config). Worth it specifically because this project's core interaction (raycast hit → HUD open, panel click → 3D highlight) is a two-way bridge, which is exactly Zustand's sweet spot.

**Example:**
```typescript
// store/sceneStore.ts
import { create } from 'zustand';

interface SceneState {
  selectedId: string | null;
  hoveredId: string | null;
  selectObject: (id: string | null) => void;
  hoverObject: (id: string | null) => void;
}

export const useSceneStore = create<SceneState>((set) => ({
  selectedId: null,
  hoveredId: null,
  selectObject: (id) => set({ selectedId: id }),
  hoverObject: (id) => set({ hoveredId: id }),
}));
```

```typescript
// three/raycastController.ts — no React import
import { useSceneStore } from '@/store/sceneStore';

export function handlePointerDown(event: PointerEvent, raycaster: THREE.Raycaster, pickables: THREE.Object3D[]) {
  const hits = raycaster.intersectObjects(pickables, false);
  useSceneStore.getState().selectObject(hits[0]?.object.userData.neoId ?? null);
}
```

```tsx
// components/panels/AsteroidListPanel.tsx — React side reacts to the same store
const selectedId = useSceneStore((s) => s.selectedId);
const selectObject = useSceneStore((s) => s.selectObject);
// clicking a list row calls selectObject(id) too — same store, both directions
```

And symmetrically, `SceneEngine` subscribes to the store (via `useSceneStore.subscribe`) to know when a *panel* click should highlight a mesh — no React re-render involved on the Three.js side, just an imperative subscription callback that changes material emissive color.

## Data Flow

### Fetch → Render Flow

```
[Panel mounts] → useNeoWsFeed()/useDonkiEvents() (client-side fetch, on demand)
    ↓ (data, error, isLoading)
[React panels] render list/alerts directly from hook state
    ↓ (same data, passed as prop / read via a small data cache)
[SceneCanvas] passes new data into engine.updateAsteroids(data) / engine.updateCme(data)
    ↓ (imperative call, NOT a prop causing remount)
[AsteroidLayer / CmeLayer] diff data by id, add/remove/update meshes in place
```

Key rule: **the data fetch effect and the Three.js mount effect are separate, independently-lifecycled effects.** The mount effect (`[]` deps) creates the engine once. A second effect watches the fetched data (`[neoWsData]` deps) and calls `engineRef.current?.updateAsteroids(neoWsData)` — it does NOT recreate the engine. This is the "React owns data, Three.js owns rendering, a thin adapter syncs them" pattern: `SceneCanvas` is the adapter; it holds a ref to the live engine and pushes data into it via method calls, never via re-mounting.

```typescript
// inside SceneCanvas, a second effect for data sync
const { data: neoData } = useNeoWsFeed();
useEffect(() => {
  if (neoData) engineRef.current?.updateAsteroids(neoData);
}, [neoData]);
```

### Selection Flow (both directions)

```
3D → 2D:
[pointer/touch on canvas] → raycaster.intersectObjects()
    → useSceneStore.getState().selectObject(id)     (imperative write)
    → React panels subscribed via useSceneStore(selector) re-render
    → HUD overlay reads selectedId + cached NASA data → opens with detail

2D → 3D:
[click in AsteroidListPanel row] → useSceneStore.getState().selectObject(id)  (same setter)
    → SceneEngine's store.subscribe callback fires
    → AsteroidLayer finds mesh by id, sets emissive/highlight material
```

Both directions call the *same* store setter — there is exactly one code path for "selection changed," regardless of which side triggered it. This avoids divergent state (e.g. 3D thinks X is selected, panel thinks Y is selected).

### Key Data Flows

1. **NASA fetch on demand:** No polling. Each panel's hook fetches once on mount (and on manual refresh if you add a retry button), normalizes the response, and independently manages loading/error/rate-limit state so a DONKI failure doesn't blank the NeoWs panel or the 3D scene.
2. **Data → geometry diffing:** `AsteroidLayer`/`CmeLayer` keep an internal `Map<id, THREE.Object3D>`. On `update(data)`, they add meshes for new ids, remove meshes for ids no longer present, and update transform/material for existing ones — never destroy-and-rebuild the whole layer on each fetch.
3. **Selection as single source of truth:** the Zustand store's `selectedId` is read by the HUD, by the panel list (for row highlighting), and by the 3D layer (for mesh highlighting) — three consumers, one writer path.

## Scaling Considerations

This is a single-user, client-only, single-screen portfolio dashboard — "scale" here means degrading gracefully under device/network constraints, not concurrent users.

| Scale dimension | Low-end mobile | Typical desktop | Notes |
|---|---|---|---|
| Postprocessing passes | Consider skipping composer entirely or reducing to 1-2 passes; respect `prefers-reduced-motion` | Full 4-pass CRT chain (render + aberration + scanlines + vignette) | Gate via a simple device-tier check (e.g. `navigator.hardwareConcurrency`, or a manual toggle) rather than complex feature detection |
| Renderer pixel ratio | Cap `renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))` | Up to native DPR, capped at 2 | Uncapped DPR on high-DPI mobile is the single biggest GPU cost lever |
| Asteroid count | NeoWs feed typically returns tens of objects per day-range query — individual `Mesh` per asteroid is fine at this scale | Same | `InstancedMesh` only pays off past ~100+ shared-geometry objects; not needed here unless you add a decorative background asteroid field |
| Resize handling | `ResizeObserver` on the canvas container, debounced/throttled if resizes are frequent (e.g. mobile orientation change + browser chrome animation) | Same | Avoid `window.resize` listener — it fires for reasons unrelated to the canvas's actual box (address bar show/hide) |

### Scaling Priorities

1. **First bottleneck: postprocessing cost on mobile GPUs.** Shader passes are full-screen fragment shader passes — cost scales with pixel count, not scene complexity. Mitigate with capped pixel ratio and a reduced-pass fallback tier.
2. **Second bottleneck: NASA API rate limits, not rendering.** With `DEMO_KEY` (~30 req/hour/IP) or a personal key (~1000/hour) exposed client-side, the real constraint is fetch frequency, not the 3D scene — reinforces the "fetch on demand, no polling" decision already in scope.

## Anti-Patterns

### Anti-Pattern 1: Storing Three.js objects (meshes, scenes, renderers) in React state

**What people do:** `const [scene, setScene] = useState<THREE.Scene>()` or storing the camera/renderer in `useState`.

**Why it's wrong:** React state triggers re-renders and is meant for values that affect what JSX renders. Three.js objects are mutated in place, every frame, outside React's render cycle — putting them in `useState` either does nothing useful (React re-renders produce no different JSX) or actively causes bugs if you ever call the setter (React would schedule a re-render for a value that isn't supposed to trigger one, and closures over stale state become a real risk).

**Do this instead:** Scene objects live in `useRef` (for the single top-level engine instance) or, better, entirely inside a plain class (`SceneEngine`) that React only reaches through a ref. React state should hold only what's needed to render JSX (loading flags, fetched data, selection id via the store) — never the Three.js objects themselves.

### Anti-Pattern 2: Re-creating the scene/engine on every data fetch

**What people do:** Put the fetched NASA data in the mount `useEffect`'s dependency array, so the whole `SceneEngine` is destroyed and rebuilt whenever data changes (e.g. `useEffect(() => { const engine = new SceneEngine(...); ... }, [neoData])`).

**Why it's wrong:** Rebuilds the WebGL context, all geometries/materials, and restarts the render loop on every fetch — visible flicker, wasted GPU work, and defeats the purpose of persistent orbit animation state (camera angle, elapsed time reset).

**Do this instead:** Mount effect has empty deps (`[]`) and creates the engine exactly once. A separate effect watches data and calls an update *method* on the already-live engine (`engine.updateAsteroids(data)`), which diffs and patches the scene graph in place.

### Anti-Pattern 3: Disabling StrictMode to "fix" double-effect Three.js bugs

**What people do:** Set `reactStrictMode: false` in `next.config` because the Three.js setup runs twice and appears to create two renderers/canvases.

**Why it's wrong:** This hides a real resource leak that will also occur in production during any legitimate remount (conditional rendering, route transitions, Fast Refresh in dev) — StrictMode is surfacing a real bug, not manufacturing a fake one. Removing the safety net doesn't fix the leak, it just makes it invisible until it causes a production issue (stacked WebGL contexts eventually hit the browser's context limit and start silently failing).

**Do this instead:** Write a complete, symmetric `dispose()` as described in Pattern 2. Verify the fix by temporarily logging renderer/context creation count and confirming it stays at 1 through a double-invoke, with StrictMode left on.

### Anti-Pattern 4: Using `Vector3.project()` results without checking depth or recomputing every frame

**What people do:** Project a 3D position to screen coordinates once (e.g. on selection) and leave the HUD label static, or forget to hide/clip labels for objects that rotate behind the camera or behind the sun.

**Why it's wrong:** Anchored labels drift out of sync as the orbit animation continues (planets/asteroids keep moving every frame) and labels for off-screen or occluded objects remain visibly pinned to the wrong place or float over objects that should hide them.

**Do this instead:** Recompute `position.clone().project(camera)` inside the render loop (or a lighter-weight loop synced to it) for any currently-anchored label, and check the resulting `z` (>1 means behind the camera — hide the label) plus optionally an occlusion raycast against the sun/planets if labels must respect line-of-sight.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| NASA NeoWs (`/neo/rest/v1/feed`, detail lookup) | `fetch` from a client-side hook (`useNeoWsFeed`), API key in a public env var (`NEXT_PUBLIC_NASA_API_KEY`) since there's no backend proxy by design | Normalize response shape into internal types immediately in `lib/nasa/neows.ts` so the rest of the app never touches NASA's raw JSON shape |
| NASA DONKI (`/DONKI/CME`, `/DONKI/FLR`, notifications) | Same pattern as NeoWs, separate hook/module | Different response shape per endpoint — keep separate mapper functions per endpoint, don't force a shared generic type |
| Rate limiting (`DEMO_KEY` ~30/hr, personal key ~1000/hr) | Each hook catches 429/403 and surfaces a distinct "rate limited" state (not a generic error), rendered with terminal-styled messaging per the project's resilience requirement | Consider a simple in-memory request log (module-level array of timestamps) to proactively warn before hitting the limit, since state is not persisted across reloads anyway |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| React panels ↔ Three.js scene | Zustand store (selection/hover/HUD state) + direct method calls from `SceneCanvas` into `SceneEngine` (data updates) | No boundary crossing happens via props into `three/` code — `three/` never imports from `components/` |
| `SceneCanvas` (React) ↔ `SceneEngine` (plain class) | `useRef<SceneEngine>`, imperative method calls (`start`, `resize`, `updateAsteroids`, `updateCme`, `dispose`) | This ref is the entire adapter surface — keep its public method list small and intentional |
| `lib/nasa/*` ↔ everything else | Plain async functions returning typed data, consumed by both `lib/hooks/*` (for React) and, if ever needed, directly by test code or scene layers | No fetch calls should happen inside `three/` — data always arrives via `SceneEngine.update*(data)` from the React side |
| HUD overlay ↔ canvas | Absolutely-positioned React element in the same stacking context as the `<canvas>`, positioned via `projectToScreen` for anchored variants, or simply centered/docked for the "click opens detail panel" variant per the PROJECT.md decision (overlay opens over the scene, not a scroll-to-panel) | Pointer events on the overlay itself must not fall through to the canvas's raycaster listener — set `pointer-events: none` on non-interactive overlay chrome and `pointer-events: auto` only on its interactive controls |

## Suggested Build Order

This directly informs roadmap phase sequencing — each item depends on the one(s) above it existing and working.

1. **Static shell + terminal design system.** Next.js app shell, CRT color tokens, monospace type, layout grid (single screen, scroll-based, responsive from the start). No Three.js, no data yet. Establishes the visual language everything else sits inside.
2. **Bare Three.js scene mounted via the React boundary.** `SceneCanvas` + `SceneEngine` with a spinning placeholder (sun + one orbit ring), full render loop, resize handling, and — critically — verified StrictMode-safe disposal (mount/unmount/remount cleanly, no leaked contexts). Nothing data-driven yet. This phase's whole purpose is proving the boundary pattern works before anything is built on top of it.
3. **NASA data fetching + 2D panels, independent of the 3D scene.** `lib/nasa/*`, hooks, `AsteroidListPanel`, `SpaceWeatherPanel`, loading/error/rate-limit states. Validates data plumbing and resilience requirements in isolation, without coupling to Three.js timing.
4. **Static solar system scene graph.** Sun, planet pivot groups, orbit `LineLoop`s, camera framing — stylized, not data-driven yet. Establishes the scene hierarchy the data-driven layers will attach to.
5. **Data-driven asteroid layer.** Wire NeoWs data (already fetched in step 3) into `AsteroidLayer.update()`, diffing meshes by id, deriving size/distance mapping. First point where the "React owns data, Three.js owns rendering" adapter is exercised for real.
6. **CME/event layer.** Same pattern as step 5 for DONKI data — by this point the update/diff pattern is proven, so this should be comparatively fast.
7. **Zustand selection store + raycasting.** Pointer/touch raycast on the asteroid layer writes to the store; this is the first point selection state needs to exist, so it comes after there are pickable objects (step 5) to select.
8. **HUD overlay + 2D↔3D selection sync.** Panel click → store → 3D highlight, and raycast hit → store → HUD open. Depends on both the store (step 7) and the panels (step 3) existing.
9. **Postprocessing (EffectComposer + CRT shader chain).** Deliberately last among the "core" scene work: it wraps the render loop established in step 2 and should be added once the scene actually has content worth degrading gracefully (mobile pass-reduction decisions are easier to make against a populated scene, not a bare orbit ring).
10. **Responsive/performance polish + deploy.** Device-tier gating for postprocessing, pixel ratio caps, final responsive pass across the whole single-screen layout, Vercel deploy.

Rationale for this order: the React↔Three.js boundary (step 2) is the highest-risk, hardest-to-retrofit piece — proving it early with a trivial scene means every subsequent phase inherits a working, StrictMode-safe mount pattern instead of debugging it under the added complexity of data and postprocessing simultaneously. Data fetching (step 3) is deliberately decoupled from the 3D scene so NASA API issues (rate limits, shape surprises) don't block 3D progress and vice versa. Postprocessing is last among scene work because a shader chain is easiest to reason about and performance-tune against a scene that already has its final visual complexity.

## Sources

- [UseEffect() Double Mounting in Strict Mode — Medium](https://medium.com/@sahil90085/useeffect-double-mounting-in-strict-mode-1beb339f1919) — MEDIUM confidence (community explainer, consistent with React's documented StrictMode intent)
- [React Strict Mode useEffect Double Mount Fix — StackEngine](https://stackengine.dev/react-strict-mode-useeffect-double-mount) — MEDIUM confidence
- [Three.js – Post Processing (official manual)](https://threejs.org/manual/en/post-processing.html) — HIGH confidence (official docs)
- [EffectComposer – three.js docs](https://threejs.org/docs/pages/EffectComposer.html) — HIGH confidence (official docs)
- [Cyberpunk inspired Three.js Scene — Codrops](https://tympanus.net/codrops/2023/03/22/cyberpunk-inspired-three-js-scene-with-javascript-and-blender/) — MEDIUM confidence (established tutorial publication)
- [Raycaster with InstancedMesh — three.js forum](https://discourse.threejs.org/t/raycaster-with-instancedmesh/10028) — MEDIUM confidence (official project forum, maintainer-adjacent)
- [InstancedMesh how to use raycast for every instance? — mrdoob/three.js#17906](https://github.com/mrdoob/three.js/issues/17906) — HIGH confidence (official repo issue thread)
- [Project world position to screen coordinate system — three.js forum](https://discourse.threejs.org/t/project-world-position-to-screen-coordinate-system/2477) — MEDIUM confidence
- [Aligning HTML Elements to 3D — three.js manual mirror](https://neofixer.arizona.edu/css/CSSOrbit/asteroidJS/three/manual/en/align-html-elements-to-3d.html) — HIGH confidence (mirrors official manual content)
- [Zustand: Introduction](https://zustand.docs.pmnd.rs/) — HIGH confidence (official docs)
- [Zustand and React Context — tkdodo.eu](https://tkdodo.eu/blog/zustand-and-react-context) — MEDIUM confidence (recognized React ecosystem authority, TanStack Query maintainer)

---
*Architecture research for: Next.js + vanilla Three.js data-driven dashboard*
*Researched: 2026-08-26*
