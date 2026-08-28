import { CrtControl } from "@/components/ui/CrtControl";
import { Panel } from "@/components/ui/Panel";

import styles from "./DashboardShell.module.css";

/**
 * Single-screen layout composition (RESP-01, D-06/D-07/D-09) and the CRT
 * root wrapper. Not a client component itself — CrtControl owns the one
 * client boundary this tree needs.
 */
export function DashboardShell() {
  return (
    <div className={styles.shell}>
      <section
        className={styles.canvas}
        data-render-target="solar-system-canvas"
        aria-label="Solar system scene placeholder"
      >
        <p className={styles.canvasHeading}>{">> SCENE :: OFFLINE"}</p>
        <p className={styles.canvasSubheading}>{"[ RENDER TARGET RESERVED ]"}</p>
      </section>

      <section className={styles.panels}>
        <Panel title="NEO FEED">
          <p className={styles.dataLine}>2026 QF1 -- 4.82 LD -- 18.40 KM/S</p>
          <p className={styles.dataLine}>2026 RT9 -- 12.05 LD -- 9.12 KM/S</p>
          <p className={styles.dataLine}>2026 SK2 -- 0.97 LD -- 24.63 KM/S</p>
        </Panel>
      </section>

      <section className={styles.legend}>
        <CrtControl />
      </section>

      <div className="crt-overlay" aria-hidden="true" />
    </div>
  );
}
