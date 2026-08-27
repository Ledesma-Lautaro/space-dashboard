# Stack Research

**Domain:** Client-side data-visualization dashboard — Next.js + vanilla Three.js + WebGL postprocessing, consuming NASA REST APIs, deployed on Vercel
**Researched:** 2026-08-26
**Confidence:** HIGH for versions (verified against npm registry / package.json directly), MEDIUM for library-choice rationale (web search, cross-checked across multiple sources), MEDIUM-LOW for fast-moving areas (WebGPURenderer maturity, Next.js 16.x patch cadence)

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Next.js | **16.3.3** (Active LTS) | App Router, static/client shell, dev server, Vercel-native build | Verified current on npm registry (2026-08-26). Next 16 made Turbopack the default bundler, requires Node 20.9+, and replaced `middleware.ts` with `proxy.ts` running on the Node runtime instead of Edge. **None of this affects a 100%-client-side app with no middleware/API routes** — but it means any tutorial/training-data code referencing `middleware.ts`, sync `cookies()`/`searchParams`, or a webpack config is stale. **This project has no server logic, so the App Router is used purely as a static shell** — one `page.tsx`, no data fetching on the server. |
| React / React DOM | **19.2.x** (bundled default with Next 16) | UI shell around the canvas, HUD overlays | Ships as the default peer with Next 16.3.x — do not pin an older React manually or you fight the framework's own resolution. |
| Three.js | **0.185.1** (r185) | WebGL scene graph, camera, raycasting, renderer | Verified via `unpkg.com/three@latest/package.json` (2026-08-26). Three.js does **not** use semver-major "1.0" versioning — each `0.1xx` bump (a "revision", e.g. r185) can contain breaking changes to addons/examples. **Pin the exact version** (`"three": "0.185.1"`, no `^`) because `three/addons/*` imports are version-coupled to the core build and drifting between them silently breaks postprocessing passes. |
| TypeScript | latest 5.x (whatever Next 16.3 scaffolds) | Type safety across scene code, API response shapes, shader uniform types | Not directly researched by version pin, but Next 16's `create-next-app` scaffolds current stable TS by default. Standard, non-controversial choice for a project this size and for catching NASA API response-shape drift. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@types/three` | latest matching `0.185.x` (auto-resolved by npm) | TypeScript definitions for Three.js core + addons | **Still required.** Verified directly by inspecting `three@0.185.1`'s `package.json`: it has `"type": "module"` but **no `"types"` field and no bundled `.d.ts` files**. Community claims that "three ships its own types" are misleading — that refers to the separate `three-types/three-ts-types` GitHub project, whose output is what gets published *as* `@types/three` on npm. It is actively maintained and synced closely with each Three.js revision (not abandoned DefinitelyTyped cruft). Install it and keep it version-aligned with `three`. |
| `visx` (`@visx/scale`, `@visx/shape`, `@visx/axis`, `@visx/group`) | latest 3.x | SVG-based solar-activity timeline/chart | Chosen over Recharts. See Charting section below for full rationale. |
| `postprocessing` (pmndrs) — *optional, see trade-off* | 6.39.4 | Pre-built post-processing passes (bloom, vignette, chromatic aberration, noise) if you choose convenience over hand-rolled shaders | **Not the primary recommendation for this project** — see Postprocessing section. Listed here only as the alternative path if the custom-shader phase becomes a blocker. |
| `next/font/google` or `next/font/local` | bundled with Next 16 | Load VT323 / self-hosted pixel monospace font with zero layout shift | See Fonts section. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| Turbopack (Next 16 default) | Dev server + build bundler | No action needed — it's the default in Next 16.3.x; do not add a `webpack()` config in `next.config` or `next build` will fail unless you pass `--webpack` to explicitly opt out. |
| ESLint (Next.js default config) | Lint | Standard, ships with `create-next-app`. |
| Vercel CLI (optional) | Local prod-mode preview, env var pull | Useful for testing `NEXT_PUBLIC_` behavior before pushing. |

## Installation

```bash
# Core
npx create-next-app@latest space-dashboard --typescript --app --eslint
cd space-dashboard
npm install three@0.185.1

# Supporting
npm install @visx/scale @visx/shape @visx/axis @visx/group @visx/gradient

# Dev dependencies
npm install -D @types/three
```

---

## 1. Next.js version and app structure

**Version:** 16.3.3 (Active LTS as of the August 2026 security release; 15.5.24 exists as Maintenance LTS but there's no reason to target it for a greenfield project).

**⚠️ Version-sensitive — flag for the build agent:** Next.js 16 is a genuine breaking-changes release relative to 13/14/15-era training data:
- `middleware.ts` → `proxy.ts` (irrelevant here — this project has no middleware)
- Sync `cookies()`, `headers()`, `draftMode()`, `params`, `searchParams` are **fully removed**; everything is async now. Irrelevant if this app never calls these (it's client-only), but if any server component boilerplate from `create-next-app` references them, they must be awaited.
- Turbopack is the default bundler for both `next dev` and `next build`.
- Node 20.9+ required.

**Read `node_modules/next/dist/docs/` once installed**, per the project's own `AGENTS.md` instruction — this is non-negotiable for this repo and supersedes anything below if they disagree.

**App structure for this project:** Since this is a single-screen, 100%-client-side dashboard with no backend, the App Router is used minimally:
```
app/
  layout.tsx       # font loading (next/font), global CSS, <html>/<body>
  page.tsx         # renders the dashboard shell (server component, just JSX composition)
  globals.css
components/
  scene/
    Scene.tsx       # 'use client' — owns the Three.js canvas + render loop
    ...
  hud/              # terminal-style overlay panels
  timeline/         # visx chart
lib/
  nasa/             # fetch wrappers for NeoWs + DONKI
  three/            # scene setup, materials, shaders as separate .glsl.ts or template strings
```

**Mounting the WebGL canvas — recommended pattern:** Two valid approaches; pick one and be consistent.

1. **`useEffect` + ref (preferred for this project).** Mark the component `'use client'`, hold a `<canvas ref={canvasRef} />`, and do all `new THREE.Scene()`/`new THREE.WebGLRenderer()`/render-loop setup inside `useEffect`, cleaning up in the return function (dispose geometries/materials/renderer, cancel the `requestAnimationFrame`). This works because Three.js core does not touch `window`/`document` at *module import* time in modern versions — only inside constructors/methods that a client-only `useEffect` naturally defers past hydration. No extra tooling needed, and it avoids an unnecessary code-split.
2. **`next/dynamic` with `{ ssr: false }`.** Wrap the `Scene` component: `const Scene = dynamic(() => import('@/components/scene/Scene'), { ssr: false })`. This is the safety-net pattern seen throughout the ecosystem (mostly written for React Three Fiber's `<Canvas>`, which auto-initializes on render rather than in an explicit effect — vanilla Three.js has more control so this is *belt-and-braces* here, not strictly required). Use this **only if** you hit a hydration warning or SSR crash with approach 1; don't reach for it by default, since it adds an unnecessary async chunk boundary for a component that's the entire point of the app.

**Confidence:** HIGH on version number (verified npm registry). MEDIUM on the mounting-pattern recommendation (synthesized from multiple community sources, not from an official Next.js "Three.js integration" doc — none exists).

## 2. Three.js version and module layout

**Version:** 0.185.1 (r185), verified directly against the published `package.json` on unpkg (2026-08-26). **Pin exactly** — do not use `^0.185.1`, since addon APIs can shift between revisions and you want reproducible builds while learning.

**`three/addons/*` vs `three/examples/jsm/*`:** Confirmed by inspecting the actual `exports` map in `three@0.185.1/package.json`:
```json
"exports": {
  ".": { "import": "./build/three.module.js", "require": "./build/three.cjs" },
  "./examples/jsm/*": "./examples/jsm/*",
  "./addons": "./examples/jsm/Addons.js",
  "./addons/*": "./examples/jsm/*",
  "./webgpu": "./build/three.webgpu.js",
  "./tsl": "./build/three.tsl.js"
}
```
Both paths resolve to the same files today — `three/addons/*` is a shorter, forward-facing alias for `three/examples/jsm/*`. **Use `three/addons/*`** in all new code (e.g. `import { OrbitControls } from 'three/addons/controls/OrbitControls.js'`) — it's the path the Three.js team documents and demos going forward, and it reads cleaner. `three/examples/jsm/*` still works and you'll see it in older tutorials/StackOverflow answers; treat it as legacy-equivalent, not wrong.

**Do OrbitControls / EffectComposer / ShaderPass ship in-tree?** Yes, but not in `three` core (`three.module.js`) — they live under `examples/jsm/` and are reached via the `addons` export, e.g.:
```js
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
```
No separate npm install needed — installing `three` gets you all of these.

**WebGPURenderer vs WebGLRenderer:** WebGPURenderer became production-capable around r171 and Three.js is targeting full stable status for it by end of 2026, with the renderer auto-falling-back to WebGL2 on the ~5% of browsers without WebGPU support. New "Three Shader Language" (TSL) lets you write one shader that compiles to both WGSL and GLSL.

**Recommendation for THIS project: use `WebGLRenderer`, not `WebGPURenderer`.** Three explicit reasons:
1. **Learning-goal conflict.** The project's stated core value is learning the classic Three.js API — GLSL, `ShaderMaterial`, `EffectComposer`/`ShaderPass` — which is the WebGL-era mental model virtually all Three.js tutorials, forum answers, and the `discoverthreejs.com` book teach. TSL/WebGPU is a *different*, newer authoring model; mixing both in a first deep-dive project splits focus.
2. **Postprocessing ecosystem match.** `EffectComposer` + `ShaderPass` (the classic GLSL pipeline this project explicitly wants to use for the CRT effect) is a WebGL-era API. It works today on WebGPURenderer only through compatibility shims that are less battle-tested than the WebGL path.
3. **Scope fit.** This is a stylized, low-poly, non-photorealistic scene (lines for orbits, simple meshes for asteroids) — exactly the workload WebGL2 handles without breaking a sweat. WebGPU's performance edge shows up in dense/compute-heavy scenes (large particle systems, physics), which this project doesn't need in v1.

**Confidence:** HIGH on version/module facts (verified directly). MEDIUM-HIGH on the WebGL-over-WebGPU recommendation (well-supported by the learning-goal constraint in PROJECT.md, less about "WebGPU isn't ready" — it increasingly is).

## 3. Postprocessing for the CRT effect: EffectComposer+ShaderPass vs pmndrs `postprocessing`

**Recommendation: `EffectComposer` + `ShaderPass` (Three.js built-in), not the `postprocessing` npm package.**

This is a direct trade-off call requested by the downstream consumer, and PROJECT.md is explicit about wanting to learn shader authoring by writing custom scanline/vignette/chromatic-aberration GLSL — so the honest comparison:

| | `EffectComposer` + `ShaderPass` (built-in) | `postprocessing` (pmndrs, v6.39.4) |
|---|---|---|
| **What you write** | Raw GLSL fragment shader as a plain string/template, wired into a `ShaderMaterial` via `ShaderPass`. You see and control every uniform, every line of GLSL. | Extend a `Pass`/`Effect` class in JS/TS; the library's `EffectPass` merges multiple effects into fewer draw calls automatically using a code-generation step you don't see. |
| **Performance model** | Each `ShaderPass` is a full extra render pass — for 3 effects (scanlines, vignette, chromatic aberration) that's 3 full-screen passes. Fine for a scene this size. | Merges compatible effects into a single shader at runtime for efficiency; better if you're chaining many effects on a demanding scene. |
| **Learning value for THIS project** | Maximum. You write the GLSL, you own the uniform wiring, you debug it by hand — exactly matching the "learn Three.js deeply" core value. This is the same low-level surface taught in every classic Three.js shader tutorial. | Lower for the stated goal. You'd learn *pmndrs' abstraction* over post-processing (their `Effect` base class, their blending model) rather than the shader/GLSL mechanics themselves — the library optimizes away the exact hand-wiring you want to practice. |
| **Honest downside of built-in** | `EffectComposer` has no built-in way to share data (e.g. a depth or normal buffer) across passes without re-rendering the scene — for 3 simple post-only effects (not scene-data effects) this doesn't matter here, but it's a real architectural limit if the project later grows more passes. |
| **Honest downside of pmndrs** | Genuinely great library, actively maintained, ships many pre-built retro-style effects (Scanline, Noise, Vignette, ChromaticAberration, Glitch, Pixelation) — if the goal were "ship a CRT filter fast," this wins outright. It's the wrong tool only because the goal is explicitly to *write* the shader, not consume a pre-built one. |

**Verdict:** Use `three/addons/postprocessing/{EffectComposer,RenderPass,ShaderPass}.js`. Write three custom `ShaderMaterial`/`ShaderPass` instances (scanlines, vignette, chromatic aberration) chained through one `EffectComposer`. This is a full phase's worth of GLSL learning exactly as PROJECT.md's Key Decisions table already anticipates ("Costo aceptado: es una fase entera y pesa en mobile").

**Mobile performance mitigation (per PROJECT.md's known risk):** gate pass count / resolution via `renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))` and consider dropping chromatic aberration (the most expensive of the three, since it samples the scene texture 3× per pixel) on narrow viewports or when `prefers-reduced-motion` is set.

**Confidence:** HIGH — this recommendation follows directly and unambiguously from the project's own stated learning goal; the technical comparison is corroborated by both official Three.js patterns and the pmndrs library's own documentation of its abstraction model.

## 4. TypeScript setup

**`@types/three` is still required.** Verified by inspecting the actual `three@0.185.1` package.json directly (see Supporting Libraries table) — there is no `"types"` field and no `.d.ts` shipped in the npm tarball's `files` list (`build`, `examples/jsm`, `LICENSE`, `package.json`, `README.md`, `src`). Some search results claim "three ships its own types" — this is imprecise/outdated framing; what's true is that a companion project, `three-types/three-ts-types`, generates the definitions and they get published to npm *as* `@types/three`, kept closely synced per Three.js revision. Install `@types/three` as a dev dependency and let npm resolve the version compatible with your pinned `three` version.

**Confidence:** HIGH — verified directly against the published package artifact, not inferred from search summaries.

## 5. Charting/timeline library for the space-weather activity timeline

**Recommendation: `visx`** (`@visx/scale`, `@visx/shape`, `@visx/axis`, `@visx/group`), SVG-based, not `recharts` and not a canvas library like `lightweight-charts`.

Rationale:
- **Bundle weight, coexisting with a WebGL canvas.** Recharts is ~150KB gzipped as a monolithic dependency. Visx is modular — you import only the primitives you need (`scale`, `shape`, `axis`, `group`), and a typical custom chart built from 4–6 visx packages totals roughly 30–40KB gzipped. Given the app is already paying a real bundle-size cost for Three.js + custom shaders, keeping the charting layer thin matters.
- **SVG vs Canvas for this specific use case.** The timeline shows a modest number of discrete events (recent CME/FLR activity, not thousands of ticks like a stock chart), where SVG's per-element interactivity (hover tooltips on individual events, easy CSS-driven CRT-green styling) is simpler to reason about and style than a canvas-drawn chart. Canvas libraries like TradingView's `lightweight-charts` (~45KB) shine at high-density time-series (thousands of candles) — overkill and a worse styling fit here, since the retro terminal look is easier to achieve with SVG + CSS than by hand-painting canvas pixels a second time (you're already doing pixel-level custom rendering in the WebGL layer).
- **Learning-goal fit.** Visx is explicitly "primitives, not a chart component" — you assemble scales/axes/shapes yourself, similar in spirit (though far lower-stakes) to how you're assembling the 3D scene by hand rather than reaching for a framework like R3F. This keeps the whole codebase consistent in philosophy: compose from primitives, understand what's rendering.
- **Trade-off, stated honestly:** Visx requires more manual setup than Recharts (explicit scales, margins, axis config) — for a single, fairly simple timeline this is a small, one-time cost, not a recurring one.

**Confidence:** MEDIUM — bundle-size figures come from web search aggregation (blog posts, gists), not independently re-verified against a bundle analyzer; directionally correct and consistent across multiple independent sources, but treat the exact KB numbers as approximate.

## 6. Pixelated monospace fonts

**Primary recommendation: VT323**, via Google Fonts (works cleanly with `next/font/google`).
- Designed by Peter Hull to replicate DEC VT320 terminal CRT glyphs (including the horizontal phosphor-smear effect of a real CRT beam) — this is a closer aesthetic match to "terminal/CRT" than a generic monospace font.
- SIL Open Font License (OFL) — free for personal and commercial use, modification, and redistribution. No attribution friction for a portfolio piece.
- Single weight, genuinely monospaced, and — unlike blockier 8-bit fonts — legible at body-text sizes, not just display sizes, which matters since this dashboard needs to render actual asteroid data (numbers, units) not just decorative headers.

**Secondary/accent option: Press Start 2P**, also Google Fonts / OFL, by CodeMan38. Much blockier, unambiguously "8-bit arcade" rather than "terminal CRT." Use sparingly (e.g., a hero label or section header) if a stronger pixel-art accent is wanted — **do not use it for body text or data-dense areas** (asteroid lists, DONKI event details); it's hard to read at small sizes and reads more "video game" than "mission control terminal."

**Worth evaluating as an alternative to VT323 for body text:** *Departure Mono* — a free, purpose-built retro-terminal monospace font (not on Google Fonts; self-hosted download from its own site) with a more restrained, less overtly "smeared" CRT look than VT323, popular in current (2025-2026) terminal-UI/dev-tool design work. If VT323's classic CRT smear reads as too busy at data-table sizes during actual UI work, this is the fallback to try — load it via `next/font/local` since it isn't Google-Fonts-hosted.

**Loading in Next.js — `next/font/google` vs self-hosting:**
- **VT323 / Press Start 2P:** use `next/font/google`. Next.js downloads the font files at *build time* and self-hosts them from your own domain automatically — there's no runtime request to Google's CDN, so you get Google Fonts' catalog convenience with the privacy/performance profile of self-hosting, plus automatic layout-shift prevention (`next/font` computes a fallback-font size-adjust so text doesn't jump when the real font loads).
- **Departure Mono (if used):** use `next/font/local`, pointing at the downloaded `.woff2` file(s) checked into the repo (e.g. `app/fonts/DepartureMono-Regular.woff2`).
- In App Router, declare the font once in `app/layout.tsx` and apply its generated `className`/CSS variable at the highest layout that needs it — this project is single-page, so `layout.tsx` is the only place it needs to live.

**Confidence:** HIGH on VT323/Press Start 2P licensing and Google Fonts availability (directly corroborated across Font Squirrel, Google Fonts, and the font's own GitHub repo). MEDIUM on Departure Mono as a suggestion — it's a well-known font in the terminal-UI design community but wasn't independently license-verified in this pass; verify its license file before using it commercially.

## 7. Deployment on Vercel

- **Static export vs SSR:** Given this app has zero server logic (no API routes, no middleware, no per-request server rendering — confirmed by PROJECT.md's explicit "sin backend propio o API routes" constraint), the pages are effectively static after the initial client-side data fetch. You do **not** need `output: 'export'` (fully static export) to get this benefit — Next.js on Vercel already serves pages with no dynamic server data as static/prerendered by default, and Vercel's CDN handles the rest. Only reach for `output: 'export'` if you want to deploy to a plain static host instead of Vercel; on Vercel itself, the default build output is simpler to reason about and avoids `output: 'export'`'s restrictions (e.g. no Image Optimization API, no dynamic route handlers if ever needed later).
- **`NEXT_PUBLIC_` env vars:** Any variable read on the client (i.e., the NASA API key, per the project's explicit "key expuesta en el cliente" decision) **must** be prefixed `NEXT_PUBLIC_` and is inlined into the JavaScript bundle at `next build` time — it is not a secret at runtime once shipped, which matches the project's own risk-accepted decision. Set it in Vercel's dashboard (Project → Settings → Environment Variables) before the first build; changing it later requires a redeploy, since it's baked in at build time, not read at request time.
- **Bundle size:** Vercel's hard limits are on serverless/edge function payloads (not relevant here, no functions) and on total env-var payload (64KB across all vars — irrelevant for a single API key). The real bundle-size risk for this project is **client JS weight from Three.js + custom shaders + visx**, not a Vercel platform limit — mitigate with standard techniques: dynamic-import the `Scene` component if it turns out to add meaningfully to first paint, keep GLSL as separate template-string modules rather than large inline strings duplicated across files, and avoid importing all of `three/addons/*` — import only the specific control/pass files used (tree-shaking works per-file since each addon is its own ES module).
- **No API routes = simplest possible Vercel config.** No `vercel.json` customization should be needed; a default `next build` + Vercel's Next.js framework preset is sufficient.

**Confidence:** MEDIUM — Vercel's env-var/limit specifics come from web search (Vercel docs summaries + community threads), not independently re-verified against Vercel's current official docs page in this pass. The static-vs-SSR reasoning follows directly from the project's own stated constraints (HIGH confidence on that part).

## 8. What NOT to use and why

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| **React Three Fiber (`@react-three/fiber`)** | R3F is a React reconciler that wraps Three.js in JSX/declarative components and manages the scene graph, renderer, and render loop *for* you. That is precisely the layer this project exists to learn by hand — PROJECT.md explicitly excludes it for exactly this reason ("abstrae justamente la API que el proyecto existe para aprender"). Using it now would mean learning R3F's component model instead of `Scene`/`Camera`/`Renderer`/animation-loop mechanics. | Vanilla `three` with manual `requestAnimationFrame` loop, manual scene/camera/renderer setup, manual disposal on unmount. |
| **`@react-three/postprocessing` / `@react-three/drei`** | Downstream of R3F — same abstraction problem, one level higher (pre-wired effect components, pre-wired camera controls helpers). Would also quietly reintroduce R3F as a peer dependency. | `three/addons/postprocessing/*` + hand-written `ShaderMaterial`s, `three/addons/controls/OrbitControls.js` used directly if orbit controls are wanted. |
| **`postprocessing` (pmndrs) as the primary CRT pipeline** | Not deprecated or bad — actively maintained, well-engineered — but using its pre-built `ChromaticAberrationEffect`/`ScanlineEffect`/`VignetteEffect` skips the exact GLSL-writing exercise this project wants. See full trade-off in section 3. | `EffectComposer` + custom `ShaderPass` with hand-written fragment shaders. |
| **Recharts (or any "batteries-included" chart component library)** | Heavier bundle (~150KB gzip) for a single, simple timeline; hides the scale/axis mechanics behind pre-built `<LineChart>`-style components, which doesn't match the compose-from-primitives approach used everywhere else in this project. | `visx` primitives (see section 5). |
| **`three-examples`-era global `<script>` tag / non-module imports** | Legacy pattern from very old Three.js tutorials (pre-ES-modules); breaks tree-shaking, incompatible with how `three/addons/*` is packaged today (ES modules only, per the verified `exports` map). | ESM imports via npm + Next.js bundler, as shown throughout this doc. |
| **`@types/three` version far ahead/behind your `three` version** | Since `@types/three` is a separately versioned, community-synced package (not literally shipped by `three`), a large version gap between the two can produce type errors for addon APIs that changed between revisions. | Let npm resolve `@types/three` normally after pinning `three`'s exact version; re-check both together on any `three` upgrade. |
| **`output: 'export'` (static export) as a default choice on Vercel** | Not wrong, but unnecessary complexity/restriction (loses Image Optimization API, blocks any future server-side addition) for a project already deploying straight to Vercel, which serves static-content Next apps efficiently without it. | Default Next.js build output on Vercel's framework preset. |
| **WebGPURenderer as the primary renderer for v1** | Newer authoring model (TSL/WGSL-adjacent mental model) that diverges from the classic GLSL/`ShaderMaterial`/`EffectComposer` path this project is explicitly built around; splits learning focus without a compensating performance need at this scene's scale. | `WebGLRenderer` (see section 2). Revisit WebGPU as a *post-v1* migration exercise once the classic pipeline is solid — this mirrors the same "learn the fundamentals first" logic already applied to the R3F exclusion. |

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|--------------------------|
| `EffectComposer` + custom `ShaderPass` | `postprocessing` (pmndrs) | If the CRT-shader phase becomes a multi-week blocker and shipping matters more than the shader-writing exercise for that specific phase — swap in pre-built `ChromaticAberrationEffect`/`ScanlineEffect` without touching the rest of the scene code. |
| `WebGLRenderer` | `WebGPURenderer` | Post-v1, as a deliberate "learn WebGPU/TSL" follow-up milestone, or if the scene later grows compute-heavy (large particle fields, physics) where WebGPU's draw-call/compute advantages actually pay off. |
| `visx` | `lightweight-charts` (TradingView, canvas-based, ~45KB) | If the timeline evolves into a dense, continuously-updating time series (many more data points, real-time streaming) where canvas rendering outperforms SVG DOM node count. Not the case for a "recent solar activity" panel fetched on demand. |
| VT323 | Departure Mono | If VT323's authentic CRT-smear look tests as too busy/hard-to-read in actual data tables during UI polish — self-host via `next/font/local`. |
| Exact-pinned `three@0.185.1` | `^0.185.1` / `latest` | Never, for this project's timeline — pin exactly while actively learning the API surface, so a mid-project revision bump doesn't silently change addon behavior mid-lesson. Revisit pinning strategy only after v1 ships. |

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|------------------|-------|
| `three@0.185.1` | `@types/three@^0.185.x` (npm-resolved) | Keep these moving together; don't let `@types/three` drift more than a couple of revisions from `three` itself. |
| `three@0.185.1` addons (`three/addons/*`) | `three@0.185.1` core only | Addons live inside the same package and are revision-locked to core — never mix an addon file copied from a different Three.js version into this project. |
| Next.js `16.3.3` | React `19.2.x`, Node `20.9+` | Don't manually override the React version Next.js resolves; don't deploy from/build on a Node version below 20.9. |
| Turbopack (Next 16 default) | No custom `webpack()` config in `next.config.*` | Adding one causes `next build` to fail outright unless `--webpack` is explicitly passed — irrelevant here since this project needs no custom bundler config for Three.js (ESM imports work natively). |

## Sources

- `https://registry.npmjs.org/three/latest` and `https://unpkg.com/three@0.185.1/package.json` — directly fetched and inspected; confirms version 0.185.1, `exports` map (`addons` alias), and absence of a `types` field. **HIGH confidence, primary source.**
- `https://registry.npmjs.org/next/latest` — directly fetched; confirms Next.js 16.3.3. **HIGH confidence, primary source.**
- `https://registry.npmjs.org/postprocessing/latest` — directly fetched; confirms pmndrs `postprocessing` v6.39.4. **HIGH confidence, primary source.**
- Web search aggregation (multiple independent results per topic, cross-checked) on: Next.js 16 breaking changes (proxy.ts, Turbopack default, sync-API removal, Node 20.9+ requirement), Three.js WebGPURenderer maturity/roadmap, `three/addons` vs `examples/jsm` community usage patterns, pmndrs `postprocessing` architecture vs `EffectComposer`, R3F-vs-vanilla learning trade-offs, visx/Recharts bundle-size comparisons, VT323/Press Start 2P licensing (Font Squirrel, Google Fonts, GitHub repo), `next/font` self-hosting behavior, Vercel `NEXT_PUBLIC_` env var and bundle-limit behavior. **MEDIUM confidence** — no single official doc covers "Three.js + Next.js integration," so this synthesizes multiple independent community/blog sources that agreed directionally; exact numeric claims (bundle KB figures, WebGPU browser-coverage %) are approximate and not independently re-verified.
- `node_modules/next/dist/docs/` — **not yet available** (greenfield repo, Next.js not installed at research time). Per this repo's own `AGENTS.md`, this must be consulted directly once `next` is installed, and takes precedence over any Next.js-version claim in this document if a conflict appears.

---
*Stack research for: Next.js + vanilla Three.js retro CRT dashboard consuming NASA APIs*
*Researched: 2026-08-26*
