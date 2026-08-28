import { NeoFeedPanel } from "@/components/panels/NeoFeedPanel";
import { SpaceWeatherPanel } from "@/components/panels/SpaceWeatherPanel";
import { CrtControl } from "@/components/ui/CrtControl";

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
        <NeoFeedPanel />
        <SpaceWeatherPanel />
      </section>

      <section className={styles.legend}>
        <CrtControl />
      </section>

      <div className="crt-overlay" aria-hidden="true" />
    </div>
  );
}
