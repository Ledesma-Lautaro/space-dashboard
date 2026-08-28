import styles from "./ScenePlaceholder.module.css";

/**
 * Authored, static placeholder copy (D-10, Copywriting Contract). Module
 * constants, never props, never derived from any data source — Phase 2
 * (render boundary) replaces this whole block rather than extending its
 * copy, so no truncation rule or length guard is ever needed here.
 */
const OFFLINE_HEADING = ">> SCENE :: OFFLINE";
const RESERVED_READOUT = "[ RENDER TARGET RESERVED ]";

/**
 * Reserved render target for the Three.js scene (D-10). This component's
 * root is the positioning context and the `data-render-target` anchor the
 * render-boundary phase (Phase 2) needs to absolutely position a real
 * `<canvas>` inside without restructuring — replacing this component is a
 * swap, not a layout change.
 *
 * Entirely static (D-18): no keyframes, transition or transform anywhere in
 * this component's stylesheet. Flicker is the photosensitivity risk source
 * in this project and there is no frame-stepping verification method in
 * place until the postprocessing phase (Phase 11) — introducing motion here
 * would pull that verification forward unplanned.
 */
export function ScenePlaceholder() {
  return (
    <div className={styles.root} data-render-target="solar-system-scene">
      <p className={styles.heading}>{OFFLINE_HEADING}</p>
      <p className={styles.subheading}>{RESERVED_READOUT}</p>
    </div>
  );
}
