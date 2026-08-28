import type { ReactNode } from "react";

import styles from "./Panel.module.css";

/**
 * Terminal chrome (D-12, as amended). VT323 has zero glyphs in the Unicode
 * Box Drawing block, so all border/swatch characters here are plain ASCII
 * (+, -, |) at the font's own advance width — never a Unicode box-drawing or
 * block-element codepoint, which would fall back to a different font at a
 * different advance and break the character-grid alignment this exists to
 * protect.
 *
 * Two invariants a future editor must not break:
 *   1. Every row `buildBorderRow`/`buildBottomRow` constructs is exactly the
 *      tier's character count long — no exceptions, no fractional overhang.
 *   2. A constructed row is built only from `+`, `-`, a space, and the
 *      (truncated) title text — nothing else.
 */

export type PanelTier = "compact" | "default" | "wide";

export const PANEL_TIER_CH: Record<PanelTier, number> = {
  compact: 44,
  default: 64,
  wide: 88,
};

/**
 * Ascending tier order, narrowest first. `tier` on `PanelProps` is a MAXIMUM
 * a panel will ever render at, not a fixed choice — `resolveAllowedTiers`
 * below returns every tier from "compact" up to (and including) the
 * requested one, and the component renders one ASCII row pair + one box
 * width per allowed tier, letting CSS container queries (Panel.module.css)
 * reveal exactly the pair that fits the real space available. A panel
 * requesting "compact" only ever gets the compact pair; it can never be
 * promoted wider by CSS having more room than it asked for.
 */
const PANEL_TIER_ORDER: PanelTier[] = ["compact", "default", "wide"];

export function resolveAllowedTiers(maxTier: PanelTier): PanelTier[] {
  return PANEL_TIER_ORDER.slice(0, PANEL_TIER_ORDER.indexOf(maxTier) + 1);
}

// "+-- " (4 chars) + " --" (3 chars) + the closing "+" (1 char) = 8 fixed
// chrome characters on the top row. The bottom row spends its two "+"
// characters on the ends of a full-width hyphen run instead.
export const PANEL_CHROME_CHARS = 8;

/**
 * Dev-only guard for invariant #1 above. A one-character drift is invisible
 * until someone looks closely at a rendered corner, so this asserts rather
 * than trusts — stripped in production builds via the NODE_ENV check.
 */
function assertRowLength(row: string, tier: PanelTier, label: string): void {
  if (process.env.NODE_ENV === "production") return;
  const expected = PANEL_TIER_CH[tier];
  if (row.length !== expected) {
    throw new Error(
      `Panel invariant violated: ${label}("${tier}") produced a row of ` +
        `${row.length} chars, expected exactly ${expected}.`,
    );
  }
}

/**
 * Truncates a title to the tier's max character budget, appending a single
 * ellipsis as the last character when truncation is required. Not exercised
 * by any Phase 1 panel title, but the formula is load-bearing for later
 * phases whose titles may include a live count.
 */
export function truncateTitle(title: string, tier: PanelTier): string {
  const maxTitleChars = PANEL_TIER_CH[tier] - PANEL_CHROME_CHARS;
  if (maxTitleChars <= 0) return "";
  if (title.length <= maxTitleChars) return title;
  if (maxTitleChars === 1) return title.slice(0, 1);
  return `${title.slice(0, maxTitleChars - 1)}…`;
}

/**
 * Builds the top ASCII border row, exactly the tier's character count long:
 * a plus, two hyphens, a space, the (truncated) title, a space, two hyphens,
 * a computed hyphen pad run, and a closing plus.
 */
export function buildBorderRow(title: string, tier: PanelTier): string {
  const width = PANEL_TIER_CH[tier];
  const safeTitle = truncateTitle(title, tier);
  const padLength = Math.max(width - PANEL_CHROME_CHARS - safeTitle.length, 0);
  const row = `+-- ${safeTitle} --${"-".repeat(padLength)}+`;
  assertRowLength(row, tier, "buildBorderRow");
  return row;
}

/**
 * Builds the bottom ASCII border row, exactly the tier's character count
 * long: a plus, a full-width hyphen pad run, and a closing plus. No title.
 */
export function buildBottomRow(tier: PanelTier): string {
  const width = PANEL_TIER_CH[tier];
  const row = `+${"-".repeat(Math.max(width - 2, 0))}+`;
  assertRowLength(row, tier, "buildBottomRow");
  return row;
}

export interface PanelProps {
  title: string;
  tier?: PanelTier;
  children: ReactNode;
}

// Maps each tier to the CSS module class that reveals its row pair / box
// width only once the "panels" named container (DashboardShell.module.css)
// actually measures enough real inline size to hold that tier's full
// character grid — see the tier-reveal container queries in
// Panel.module.css. Class names are looked up by tier rather than
// interpolated into a template string so a typo can never silently produce
// an unmatched (thus permanently invisible) CSS Modules class.
const ROW_TIER_CLASS: Record<PanelTier, string> = {
  compact: styles.tierRowCompact,
  default: styles.tierRowDefault,
  wide: styles.tierRowWide,
};

// Box width modifier classes are cumulative (unlike the row classes above):
// a panel allowed up to "wide" needs BOTH the default-width step and the
// wide-width step present so the box can climb tier-by-tier as the
// container grows, capping at its own requested maximum — never at a wider
// tier than it asked for. See BOX_TIER_MODIFIER_CLASSES below.
const BOX_TIER_MODIFIER_CLASSES: Record<PanelTier, string[]> = {
  compact: [],
  default: [styles.panelDefault],
  wide: [styles.panelDefault, styles.panelWide],
};

export function Panel({ title, tier = "default", children }: PanelProps) {
  const allowedTiers = resolveAllowedTiers(tier);

  const boxClassName = [styles.panel, ...BOX_TIER_MODIFIER_CLASSES[tier]].join(" ");

  // One row pair per allowed tier (never more than the requested maximum —
  // see resolveAllowedTiers). Each tier's title truncation, padding, and
  // assertRowLength invariant are computed independently via
  // buildBorderRow/buildBottomRow, exactly as before, just once per tier
  // instead of once per panel.
  const tierRows = allowedTiers.map((rowTier) => {
    const safeTitle = truncateTitle(title, rowTier);
    const topRow = buildBorderRow(title, rowTier);
    const bottomRow = buildBottomRow(rowTier);

    // Split the already-computed top row string around the title substring
    // so the title can carry emphasis color while the surrounding chrome
    // stays dim — this reuses buildBorderRow's own output as the single
    // source of truth rather than re-deriving the padding math a second
    // time.
    const titleStart = topRow.indexOf(safeTitle, 4);
    const prefix = topRow.slice(0, titleStart);
    const suffix = topRow.slice(titleStart + safeTitle.length);

    return { tier: rowTier, safeTitle, prefix, suffix, bottomRow };
  });

  return (
    <section className={boxClassName} aria-label={title}>
      {/*
        Plain-text title, always in the markup. CSS alone decides — via the
        sub-compact container query in Panel.module.css — whether this or
        one of the ASCII chrome rows' decorative titles is visible; no
        JavaScript width branch, no resize observer, no hydration surface.
        The ASCII rows are aria-hidden below, so this plain title is the
        only presentation ever exposed to the accessibility tree.
      */}
      <p className={styles.plainTitle}>{title}</p>
      {tierRows.map((row) => (
        <pre
          key={`top-${row.tier}`}
          className={`${styles.chromeRow} ${ROW_TIER_CLASS[row.tier]}`}
          aria-hidden="true"
        >
          {row.prefix}
          <span className={styles.title}>{row.safeTitle}</span>
          {row.suffix}
        </pre>
      ))}
      <div className={styles.body}>{children}</div>
      {tierRows.map((row) => (
        <pre
          key={`bottom-${row.tier}`}
          className={`${styles.chromeRow} ${ROW_TIER_CLASS[row.tier]}`}
          aria-hidden="true"
        >
          {row.bottomRow}
        </pre>
      ))}
    </section>
  );
}
