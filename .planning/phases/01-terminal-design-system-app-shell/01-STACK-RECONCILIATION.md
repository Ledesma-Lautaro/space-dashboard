---
phase: 1
source: node_modules/next/dist/docs
next_version: 16.3.3
reconciled: 2026-08-27
---

# Phase 1 — Installed Next.js Docs Reconciliation

This record answers the four questions `01-01-PLAN.md` Task 2 requires, sourced from the
documentation and manifests that ship inside the installed `next@16.3.3` package (not from
`.planning/research/STACK.md`, not from training-data recall), per `.claude/CLAUDE.md`'s mandate
that the installed docs take precedence.

## Questions Answered

### 1. Does `next.config.*` need any setting to enable scoped stylesheets, or is the `.module.css` filename convention sufficient with zero configuration?

**Path:** `node_modules/next/dist/docs/01-app/01-getting-started/11-css.md`

**Answer:** Zero configuration is sufficient. The filename convention alone is what triggers CSS
Modules scoping.

> "To start using CSS Modules, create a new file with the extension `.module.css` and import it
> into any component inside the `app` directory"

No `next.config.ts` entry, no plugin registration, and no `turbopack.rules` configuration is
required to enable `.module.css` scoping — this is confirmed independently by
`node_modules/next/dist/docs/01-app/03-api-reference/08-turbopack.md`, whose CSS-and-styling
support table lists `.module.css` files as "**Supported** — `.module.css` files work natively
(Lightning CSS)" with no configuration column entry.

### 2. Does the default bundler change scoped-stylesheet class-name generation or the syntax of the global-selector escape hatch relative to the older bundler? Record the exact supported form.

**Path:** `node_modules/next/dist/docs/01-app/03-api-reference/08-turbopack.md`

**Answer:** Turbopack uses Lightning CSS (a Rust-based CSS compiler) instead of webpack's
`css-loader`/PostCSS pipeline for CSS Modules, and this narrows the supported global-selector
syntax to the function-call form only. The docs do not publish the literal generated class-name
hash format for either bundler (neither webpack's nor Turbopack's exact scoped class-name string
is documented as a stable public API — both are implementation details), so no specific hash
pattern claim is made or refuted here; what the docs do state definitively is the escape-hatch
syntax constraint:

> "Some low-usage CSS Modules features (like `:local/:global` as standalone pseudo-classes) are
> not yet supported."

And, spelled out fully in the "Unsupported and unplanned features" section:

> "**Legacy CSS Modules features** — Standalone `:local` and `:global` pseudo-classes (only the
> function variant `:global(...)` is supported)."

**Exact supported form:** `:global(.someClassName) { ... }` — the bare block form
`:global { .someClassName { ... } }` is NOT supported under Turbopack. This phase's `.module.css`
files (none yet written — that is plan 01-02's scope) must use the function-call form exclusively
if any global escape is ever needed.

Also relevant and confirmed in the same doc: Turbopack additionally does not support `composes`
or `@import` pulling in a plain `.css` file as if it were a CSS Module — a `.css` file is always
global under Turbopack, unlike some webpack configurations. If a future plan wants `composes`
across files, both files must use the `.module.css` extension.

### 3. What is the current `next/font/google` API surface — specifically whether an explicit `weight` is required for a non-variable font, what `display` values are accepted, and what the `variable` option emits.

**Path:** `node_modules/next/dist/docs/01-app/03-api-reference/02-components/font.md`

**Answer, `weight`:**

> "`weight` ... Used in `next/font/google` and `next/font/local` — Required if the font being
> used is **not** [variable](https://fonts.google.com/variablefonts)"

VT323 is confirmed non-variable by the installed font-data manifest (see Question 4) — its
`weights` array contains exactly one entry, `"400"` — so `weight: '400'` is required, matching
`01-RESEARCH.md` Pattern 1 exactly, CONFIRMED.

**Answer, `display`:**

> "`display` — The font [`display`] with possible string values of `'auto'`, `'block'`, `'swap'`,
> `'fallback'` or `'optional'` with default value of `'swap'`."

All five CSS `font-display` values are accepted verbatim; `'optional'` (the value
`01-RESEARCH.md` Pattern 2 recommends for the no-flash requirement) is a legal, documented value.
The **default** if `display` is omitted is `'swap'`, not `'optional'` — so plan 01-02 must pass
`display: 'optional'` explicitly; omitting it silently reverts to the flashing default. This is
worth flagging even though it does not contradict the research (the research already recommends
passing it explicitly), because it is an easy accidental omission.

**Answer, `variable`:**

> "`variable` — A string value to define the CSS variable name to be used if the style is applied
> with the [CSS variable method](#css-variables) ... Examples: `variable: '--my-font'`: The CSS
> variable `--my-font` is declared"

Concretely: passing `variable: '--font-terminal'` causes Next to emit a CSS class (via
`vt323.variable`) that, when applied to an ancestor element (e.g. `<html className={vt323.variable}>`),
declares the custom property `--font-terminal: <generated font-family stack>` in scope for all
descendants. Consuming code then reads it with `font-family: var(--font-terminal), monospace;` —
exactly the token-flow pattern `01-RESEARCH.md` Pattern 3 describes. CONFIRMED, no divergence.

### 4. What is the exact exported identifier for the VT323 family in `next/font/google`? Resolve this against the installed font-data manifest inside `node_modules/next`, not against a guess.

**Path:** `node_modules/next/dist/compiled/@next/font/dist/google/font-data.json`

**Answer:** The manifest's top-level key for this family is the literal string `"VT323"` — a
single, undivided identifier, no underscore substitution needed (VT323 has no internal spaces in
its Google Fonts name, unlike e.g. `Roboto_Mono`, which the font.md docs note needs an
underscore for the space). Inspected directly via:

```
node -e "console.log(Object.keys(require('./node_modules/next/dist/compiled/@next/font/dist/google/font-data.json')).filter(k => k.toLowerCase().includes('vt323')))"
// => ["VT323"]
```

The full manifest entry for `"VT323"`:

```json
{
  "weights": ["400"],
  "styles": ["normal"],
  "subsets": ["latin", "latin-ext", "vietnamese"]
}
```

So the correct import is `import { VT323 } from 'next/font/google';`, matching
`01-RESEARCH.md`'s assumption A1 exactly. **This closes assumption A1**: A1 is CONFIRMED, not
refuted — the literal identifier `VT323` is correct with no underscore substitution, weights
confirm to exactly `["400"]` (non-variable, single weight, matching Pattern 1's requirement that
`weight: '400'` be passed), and `subsets` includes `"latin"` (matching the `subsets: ['latin']`
value already used in the research's code example).

## Divergences From Research

| Claim | Source (research file / section) | Installed-Docs Finding | Resolution |
|---|---|---|---|
| `next.config.*` needs no setting to enable CSS Modules; `.module.css` filename alone is sufficient | `01-RESEARCH.md` Pattern 3 | CONFIRMED — `11-css.md` and `08-turbopack.md` both state zero-config `.module.css` support | CONFIRMED — no downstream correction needed |
| Turbopack supports only the function-call form of the global escape hatch (`:global(...)`), not the standalone `:local`/`:global` pseudo-classes | `01-RESEARCH.md` Pattern 3 | CONFIRMED verbatim — `08-turbopack.md` "Unsupported and unplanned features" lists standalone `:local`/`:global` as unsupported, function form as the only supported variant | CONFIRMED — plan 01-02's `.module.css` files must use `:global(.class)` form if ever needed |
| `weight: '400'` is required for VT323 because it is a non-variable Google Font | `01-RESEARCH.md` Pattern 1 | CONFIRMED — `font.md`'s `weight` reference row states "Required if the font being used is not variable"; `font-data.json`'s `"VT323"` entry has exactly one weight, `"400"`, confirming non-variable | CONFIRMED — no downstream correction needed |
| `display: 'optional'` (not `'swap'`) must be passed explicitly to avoid a flash of fallback font | `01-RESEARCH.md` Pattern 2 | CONFIRMED that `'optional'` is a legal documented value; ADDITIONALLY confirms the *default* (if omitted) is `'swap'`, not `'optional'` — so explicit passing is mandatory, not just recommended | CONFIRMED, with an added implementation note: plan 01-02 must not omit `display: 'optional'` — the scaffolder's default layout used `display: 'swap'` implicitly (Geist fonts had no `display` set at all in the generated `layout.tsx`), so this is an easy silent regression if copy-pasted |
| Google Fonts export identifier for VT323 is the literal string `VT323`, no underscore substitution (research Assumption A1) | `01-RESEARCH.md` Pattern 1 code example, Assumptions Log A1 | CONFIRMED — `font-data.json`'s only VT323-matching key is exactly `"VT323"` | CONFIRMED — closes A1, no downstream correction needed |
| `variable: '--font-terminal'` emits a CSS custom property consumable via `var(--font-terminal)` in any descendant `.module.css` | `01-RESEARCH.md` Pattern 3, "Token flow for this project" | CONFIRMED — `font.md`'s CSS Variables section describes exactly this mechanism | CONFIRMED — no downstream correction needed |

**Summary:** Every claim in `01-RESEARCH.md` that this reconciliation was scoped to check was
CONFIRMED against the installed package — no divergence required a downstream plan correction.
The one genuinely new finding not previously called out in the research is that `next/font/google`'s
`display` option defaults to `'swap'` when omitted (not `'optional'`), which raises the stakes on
plan 01-02 passing `display: 'optional'` explicitly rather than relying on any default.
