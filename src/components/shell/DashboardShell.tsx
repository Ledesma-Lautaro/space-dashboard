import { NeoFeedPanel } from "@/components/panels/NeoFeedPanel";
import { SpaceWeatherPanel } from "@/components/panels/SpaceWeatherPanel";
import { Legend } from "@/components/ui/Legend";

import styles from "./DashboardShell.module.css";
import { SceneCanvas } from "../canvas/SceneCanvas";

/**
 * Single-screen layout composition (RESP-01, D-06/D-07/D-09) and the CRT
 * root wrapper. Not a client component itself — the CRT control now lives
 * inside Legend, which owns the one client boundary this tree needs.
 */
export function DashboardShell() {
  return (
    <div className={styles.shell}>
      <section
        className={styles.canvas}
        aria-label="Solar system scene placeholder"
      >
        <SceneCanvas/>
      </section>

      <section className={styles.panels}>
        <NeoFeedPanel />
        <SpaceWeatherPanel />
      </section>

      <section className={styles.legend}>
        <Legend />
      </section>

      <div className="crt-overlay" aria-hidden="true" />
    </div>
  );
}
