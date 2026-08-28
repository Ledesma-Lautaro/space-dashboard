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

export function Panel({ title, tier = "default", children }: PanelProps) {
  const safeTitle = truncateTitle(title, tier);
  const topRow = buildBorderRow(title, tier);
  const bottomRow = buildBottomRow(tier);

  // Split the already-computed top row string around the title substring so
  // the title can carry emphasis color while the surrounding chrome stays
  // dim — this reuses buildBorderRow's own output as the single source of
  // truth rather than re-deriving the padding math a second time.
  const titleStart = topRow.indexOf(safeTitle, 4);
  const prefix = topRow.slice(0, titleStart);
  const suffix = topRow.slice(titleStart + safeTitle.length);

  return (
    <section
      className={styles.panel}
      style={{ width: `min(var(--panel-w-${tier}), 100%)` }}
      aria-label={title}
    >
      {/*
        Plain-text title, always in the markup. CSS alone decides — via the
        sub-compact container query in Panel.module.css — whether this or
        the ASCII chrome row's decorative title is visible; no JavaScript
        width branch, no resize observer, no hydration surface. The ASCII
        rows are aria-hidden below, so this plain title is the only
        presentation ever exposed to the accessibility tree.
      */}
      <p className={styles.plainTitle}>{title}</p>
      <pre className={styles.chromeRow} aria-hidden="true">
        {prefix}
        <span className={styles.title}>{safeTitle}</span>
        {suffix}
      </pre>
      <div className={styles.body}>{children}</div>
      <pre className={styles.chromeRow} aria-hidden="true">
        {bottomRow}
      </pre>
    </section>
  );
}
