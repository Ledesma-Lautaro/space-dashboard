# Fix: Phone-width horizontal overflow in Panel ASCII chrome

**Type:** targeted defect fix (not a new plan)
**Files touched:** `src/components/ui/Panel.tsx`, `src/components/ui/Panel.module.css`, `src/components/shell/DashboardShell.module.css`

## Root cause

Two mechanisms decided a panel's rendered width independently, and disagreed:

1. `Panel.tsx` built the top/bottom ASCII border rows as fixed-length JS
   strings — `buildBorderRow`/`buildBottomRow` always emitted exactly
   `PANEL_TIER_CH[tier]` characters for whatever single `tier` prop the
   panel was called with (64 characters for every Phase 1 panel, since all
   three call sites use the default tier).
2. `DashboardShell.module.css` changed the panel **box**'s effective tier
   in CSS only, via a `@media (max-width: 767px)`-adjacent rule that
   overrode `--panel-w-default` to the compact tier's width (44ch) below
   the 768px viewport breakpoint. `Panel.tsx` sized its `<section>` with an
   inline `width: min(var(--panel-w-default), 100%)`.

At phone widths the box shrank to 352px (44ch) while the ASCII text stayed
64 unbreakable monospace characters (512px) — 160px of overflow, which
widened `document.documentElement.scrollWidth` and, because the panels
region's own inline size grew to accommodate the overflow, also permanently
prevented the pre-existing `@container panels (max-width: 352px)`
sub-compact degrade rule from ever firing (that rule needs the *container*
to genuinely measure ≤352px, and the overflow kept it wider).

Measured before the fix: `scrollWidth` 446 vs `clientWidth` 375 at a 375px
viewport (71px overflow).

## Fix

**Render all three tier rows, reveal exactly one with container queries** —
the approach specified by the user, implemented as follows.

### `Panel.tsx`

- Added `resolveAllowedTiers(maxTier)`, returning every tier from
  `"compact"` up to (and including) the requested `tier` prop — e.g.
  `tier="default"` → `["compact", "default"]`. `tier` remains a **maximum**:
  a panel can never render a tier wider than it asked for, because a wider
  tier's row/box markup simply isn't emitted for it.
- For each allowed tier, `Panel` now calls `buildBorderRow`/`buildBottomRow`
  independently (as before, per-tier — `assertRowLength`'s dev-mode
  invariant still fires for every row emitted, at every tier) and renders
  one top + one bottom `<pre>` row pair, each tagged with a
  tier-specific CSS Modules class (`tierRowCompact` / `tierRowDefault` /
  `tierRowWide`).
- The box's width is no longer an inline style computed from a single
  `tier` value. It's a static base class (`panel`, always compact-width) plus
  cumulative modifier classes (`panelDefault`, `panelWide`) added only up to
  the requested tier — CSS decides, via container queries, how far up that
  ladder the box actually climbs.

### `Panel.module.css`

- Base state (mobile-first, no container query matched): compact-tier row
  visible, compact-tier box width (`min(var(--panel-w-compact), 100%)`).
- `@container panels (min-width: 512px)` (512px = the default tier's 64ch
  at the measured 8px/char VT323 advance): switches to the default-tier row
  and, on panels carrying `.panelDefault`/`.panelWide`, the default-tier box
  width.
- `@container panels (min-width: 704px)` (704px = the wide tier's 88ch):
  same pattern one tier up, gated on `.panelWide`.
- Hidden row tiers use `display: none` (never `visibility`/`opacity`), so a
  hidden 64- or 88-char row contributes **zero** intrinsic width to the
  container — the exact failure mode being fixed (a "hidden" but still
  width-contributing row) can't recur.
- The pre-existing sub-compact degrade rule
  (`@container panels (max-width: 352px) { .chromeRow { display: none } ... }`)
  is unchanged and still wins by source order (it's declared after the new
  tier-reveal rules; equal specificity, later rule wins) — below 352px of
  real container width, all ASCII chrome hides and the plain-text title +
  CSS top/bottom borders take over, exactly as before.

### `DashboardShell.module.css`

- Removed the `--panel-w-default` viewport-media-query override on
  `.panels` — it was the second, disagreeing mechanism described above and
  is now fully superseded by the container-query ladder in
  `Panel.module.css`, which reads the real container inline size instead of
  a viewport breakpoint.
- **Also marked `.legend` as its own `container-type: inline-size;
  container-name: panels;`.** `.legend` is a sibling of `.panels` in
  `DashboardShell.tsx`, not a descendant, so without this the Legend panel
  (which requests `tier="default"`) would never match any `@container
  panels (...)` ancestor and would be stuck at the compact tier forever,
  regardless of how much real width was available — a correctness gap, not
  a cosmetic one, since it's the same class of "CSS mechanism doesn't see
  the panel it needs to size" bug this fix exists to close. This is a CSS
  container declaration on the existing DashboardShell wrapper, not a
  change to `Legend.tsx`.

## Verification

`npm run lint` and `npm run build` both exit 0, run as separate steps —
confirmed after every source edit, including the final state.

**Live measurement performed** (not just asserted): built the app,
served it via `next start` on `localhost:4790`, and drove headless
Microsoft Edge (`msedge.exe --headless=new --remote-debugging-port=9333`)
over raw Chrome DevTools Protocol — using the `ws` module already bundled
inside `node_modules/next/dist/compiled/ws` rather than installing a new
package — to set an exact device viewport and read
`document.documentElement.scrollWidth`/`clientWidth`, each panel's
`getBoundingClientRect().width`, and the character count of whichever
`<pre>` row currently computes `display !== 'none'`.

| Viewport | scrollWidth | clientWidth | overflow | Panel box width | Visible row char count | Tier |
|---|---|---|---|---|---|---|
| 320px | 320 | 320 | **0px** | 272px (container) | 0 rows visible | sub-compact degrade (plain title) |
| 375px | 375 | 375 | **0px** | 327px (container) | 0 rows visible | sub-compact degrade (plain title) |
| 900px | 885 | 885 | **0px** | 512px | 64 | default |
| 1400px | 1385 | 1385 | **0px** | 512px | 64 | default (correctly capped — no panel requests `tier="wide"`, so none ever promotes to 88ch even with 1400px of viewport) |

At 900px (large enough for the default tier's full 64ch grid to fit) every
panel — including Legend, previously excluded from the container-query
mechanism entirely — shows a 512px box with a matching 64-character visible
row: the exact invariant this fix exists to establish (visible row length
always matches the applied box width). No horizontal overflow was observed
at any tested width.

## Known follow-up (not a defect, documented for Phase 4/5 awareness)

`.panels`'s own `max-width: var(--panel-w-wide)` (704px) is applied to the
element that also carries the 512px-of-total horizontal padding subtracted
before container-query measurement, so its *content*-box inline size tops
out at roughly 656px — never reaching the 704px "wide" tier threshold no
matter how wide the viewport gets. No Phase 1 panel requests `tier="wide"`,
so this has no visible effect today. If a future phase adds a panel that
requests `tier="wide"`, this ceiling should be re-checked against the
`.panels` max-width and padding tokens at that time.
