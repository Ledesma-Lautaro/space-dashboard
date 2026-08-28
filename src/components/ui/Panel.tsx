import type { ReactNode } from "react";

import styles from "./Panel.module.css";

/**
 * Terminal chrome (D-12, as amended). VT323 has zero glyphs in the Unicode
 * Box Drawing block, so all border/swatch characters here are plain ASCII
 * (+, -, |) at the font's own advance width — never a Unicode box-drawing or
 * block-element codepoint, which would fall back to a different font at a
 * different advance and break the character-grid alignment this exists to
 * protect.
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
const CHROME_FIXED_CHARS = 8;

/**
 * Truncates a title to the tier's max character budget, appending a single
 * ellipsis as the last character when truncation is required. Not exercised
 * by any Phase 1 panel title, but the formula is load-bearing for later
 * phases whose titles may include a live count.
 */
export function truncateTitle(title: string, tier: PanelTier): string {
  const maxTitleChars = PANEL_TIER_CH[tier] - CHROME_FIXED_CHARS;
  if (maxTitleChars <= 0) return "";
  if (title.length <= maxTitleChars) return title;
  if (maxTitleChars === 1) return title.slice(0, 1);
  return `${title.slice(0, maxTitleChars - 1)}…`;
}

/**
 * Builds one ASCII border row, exactly the tier's character count long.
 * Pass `title: null` for the bottom row (a full-width hyphen run between two
 * "+" characters); pass the panel title for the top row.
 */
export function buildBorderRow(title: string | null, tier: PanelTier): string {
  const width = PANEL_TIER_CH[tier];
  if (title === null) {
    return `+${"-".repeat(Math.max(width - 2, 0))}+`;
  }
  const safeTitle = truncateTitle(title, tier);
  const padLength = Math.max(width - CHROME_FIXED_CHARS - safeTitle.length, 0);
  return `+-- ${safeTitle} --${"-".repeat(padLength)}+`;
}

export interface PanelProps {
  title: string;
  tier?: PanelTier;
  children: ReactNode;
}

export function Panel({ title, tier = "default", children }: PanelProps) {
  const safeTitle = truncateTitle(title, tier);
  const topRow = buildBorderRow(title, tier);
  const bottomRow = buildBorderRow(null, tier);

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
      style={{ width: `var(--panel-w-${tier})` }}
      aria-label={title}
    >
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
