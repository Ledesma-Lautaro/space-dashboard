import styles from "./Alert.module.css";

/**
 * D-13: green is the base state of everything, magenta marks the
 * exceptional. `nominal` is the default; `attention` opts into the reserved
 * `--color-alert` family and is only ever used when a bulletin genuinely
 * requires it.
 */
export type AlertSeverity = "nominal" | "attention";

/**
 * The typed inputs to the fixed CRT-05 grammar. `qualifier` and `value` are
 * a matched pair — a record with a qualifier but no value (or vice versa)
 * is treated the same as having neither, per the degrade rule below.
 */
export interface AlertContent {
  subject: string;
  state: string;
  qualifier?: string;
  value?: string;
}

export interface AlertProps {
  /**
   * `null`/`undefined` means "no bulletin to show" — `Alert` renders
   * nothing at all in that case rather than an empty styled shell, so a
   * feed with nothing in it leaves its containing Panel to show the
   * Panel's own empty presentation instead of stacking two empty states.
   */
  content: AlertContent | null | undefined;
  severity?: AlertSeverity;
}

/**
 * Pure formatter for the fixed terminal alert grammar (CRT-05):
 * `>> {SUBJECT} {STATE} - {QUALIFIER}: {VALUE}`, e.g.
 * `>> CME DETECTED - INTENSITY: MODERATE`.
 *
 * The degrade rule is the part that matters and is a new decision this
 * phase makes rather than inherits (D-15, UI-SPEC Copywriting Contract):
 * when the qualifier or the value is absent, the entire trailing clause is
 * dropped — no dangling hyphen, no filler or placeholder token stands in
 * for a missing value. A record with no analysis entry (a CME with no
 * `cmeAnalyses[]` entry has no intensity) produces a subject and a state
 * and stops there: just `>> CME DETECTED`.
 */
export function formatAlertLine({
  subject,
  state,
  qualifier,
  value,
}: AlertContent): string {
  const base = `>> ${subject} ${state}`;
  if (qualifier && value) {
    return `${base} - ${qualifier}: ${value}`;
  }
  return base;
}

/**
 * A single terminal bulletin (D-15). Its own component, not a `Panel`
 * modifier — its own prefix, severity colour and spacing — so Phase 5 can
 * drop real DONKI bulletins into it without touching panel chrome.
 *
 * Renders through React's default text interpolation only. The raw-HTML
 * injection API is never used here, even though Phase 5 feeds this exact
 * component untrusted remote `messageBody` text — establishing that habit
 * now is why this component exists before Phase 5, not during it.
 *
 * Carries no character-grid chrome of its own (unlike `Panel`), so its
 * text wraps freely and never truncates.
 */
export function Alert({ content, severity = "nominal" }: AlertProps) {
  if (!content) {
    return null;
  }

  const line = formatAlertLine(content);
  const severityClass =
    severity === "attention" ? styles.attention : styles.nominal;

  return <p className={`${styles.alert} ${severityClass}`}>{line}</p>;
}
