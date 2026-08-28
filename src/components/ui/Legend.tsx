import { CrtControl } from "./CrtControl";
import styles from "./Legend.module.css";
import { Panel } from "./Panel";

/**
 * Palette legend (RESP-04, D-13, D-14) — the colour vocabulary this whole
 * project uses, stated in one place a visitor can actually read, plus the
 * CRT intensity control (CRT-10, D-20) living in the same strip a visitor
 * discovering the colours also discovers the control in.
 *
 * Entries are hand-authored below and never fetched. Adding an entry is a
 * code change: re-check the new line's rendered length ("# " + label + " :: "
 * + meaning) against the default tier's usable width (PANEL_TIER_CH.default
 * (64) minus the panel's 2ch side padding on each edge, from Panel.tsx) at
 * authoring time. With the corrected 0.4em/8px character advance the longest
 * current line ("# MAGENTA :: REQUIRES ATTENTION", 31 chars) has comfortable
 * margin, but that margin is finite and the check is cheap.
 */
const LEGEND_ENTRIES = [
  {
    id: "nominal",
    tone: styles.toneNominal,
    label: "GREEN",
    meaning: "NOMINAL / ROUTINE",
  },
  {
    id: "alert",
    tone: styles.toneAlert,
    label: "MAGENTA",
    meaning: "REQUIRES ATTENTION",
  },
] as const;

export function Legend() {
  return (
    <div className={styles.strip}>
      <Panel title="SYSTEM LEGEND" tier="default">
        <ul className={styles.entries}>
          {LEGEND_ENTRIES.map((entry) => (
            <li key={entry.id} className={styles.entry}>
              <span className={`${styles.swatch} ${entry.tone}`} aria-hidden="true">
                #
              </span>
              <span className={`${styles.label} ${entry.tone}`}>{entry.label}</span>
              <span className={styles.separator} aria-hidden="true">
                {"::"}
              </span>
              <span className={styles.meaning}>{entry.meaning}</span>
            </li>
          ))}
        </ul>

        <p className={styles.note}>
          {"(brightness = emphasis, not a different meaning)"}
        </p>

        {/*
          Demonstrative only — the sample row shows the three brightness
          steps of one hue concretely so the note above has something to
          point at. Not real legend content, so it is hidden from the
          accessibility tree rather than announced as another entry.
        */}
        <p className={styles.sample} aria-hidden="true">
          <span className={styles.sampleDim}>{"#"}</span>
          <span className={styles.sampleNormal}>{"#"}</span>
          <span className={styles.sampleBright}>{"#"}</span>
          {" BRIGHTNESS: DIM / NORMAL / BRIGHT"}
        </p>

        <div className={styles.control}>
          <CrtControl />
        </div>
      </Panel>
    </div>
  );
}
