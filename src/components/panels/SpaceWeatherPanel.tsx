import { Alert, type AlertContent, type AlertSeverity } from "@/components/ui/Alert";
import { Panel } from "@/components/ui/Panel";
import {
  DONKI_CME_FIXTURES,
  DONKI_FLR_FIXTURES,
  DONKI_GST_FIXTURES,
  DONKI_NOTIFICATION_FIXTURES,
} from "@/lib/fixtures/donkiFixtures";
import type { DonkiCme, DonkiFlare, DonkiGeomagneticStorm } from "@/types/donki";

import styles from "./SpaceWeatherPanel.module.css";

/** `2026-11-02T08:47Z` -> `2026-11-02 08:47Z`, purely a display reformat. */
function formatIsoLikeTime(iso: string): string {
  return iso.replace("T", " ");
}

/**
 * Orders a flare classType by NASA's own letter scale (A < B < C < M < X),
 * with the trailing magnitude as a tiebreaker — this reads the letter that
 * is already part of the source field, it does not invent a new scale the
 * way a Kp-to-G-scale mapping would.
 */
function flareClassRank(classType: string): number {
  const letterOrder = ["A", "B", "C", "M", "X"];
  const letterIndex = letterOrder.indexOf(classType.charAt(0));
  const magnitude = parseFloat(classType.slice(1)) || 0;
  return letterIndex * 100 + magnitude;
}

function highestFlareId(flares: DonkiFlare[]): string {
  return flares.reduce((strongest, flare) =>
    flareClassRank(flare.classType) > flareClassRank(strongest.classType)
      ? flare
      : strongest,
  ).flrID;
}

function maxKp(storm: DonkiGeomagneticStorm): number {
  return Math.max(...storm.allKpIndex.map((entry) => entry.kpIndex));
}

function strongestStormId(storms: DonkiGeomagneticStorm[]): string {
  return storms.reduce((strongest, storm) =>
    maxKp(storm) > maxKp(strongest) ? storm : strongest,
  ).gstID;
}

/** Prefers the analysis DONKI itself marked most accurate; falls back to the first entry. */
function primaryAnalysis(cme: DonkiCme) {
  return cme.cmeAnalyses.find((analysis) => analysis.isMostAccurate) ?? cme.cmeAnalyses[0];
}

const eventCount =
  DONKI_NOTIFICATION_FIXTURES.length +
  DONKI_FLR_FIXTURES.length +
  DONKI_CME_FIXTURES.length +
  DONKI_GST_FIXTURES.length;

const strongestFlareId = highestFlareId(DONKI_FLR_FIXTURES);
const strongestGstId = strongestStormId(DONKI_GST_FIXTURES);

/**
 * SPACE WEATHER panel (SW field vocabulary, CRT-05). Every bulletin is
 * composed from typed DONKI fixture fields and rendered through `Alert` so
 * the terminal grammar — including its absent-qualifier degrade rule — is
 * exercised end to end rather than reimplemented at this call site. No
 * Kp-to-NOAA-scale mapping is computed here; that belongs to the
 * space-weather phase that owns the data (SW-03).
 */
export function SpaceWeatherPanel() {
  return (
    <Panel title={`SPACE WEATHER :: ${eventCount}`}>
      <div className={styles.groups}>
        <div className={styles.group}>
          <p className={styles.groupLabel}>BULLETINS</p>
          {DONKI_NOTIFICATION_FIXTURES.map((notification) => {
            const content: AlertContent = {
              subject: notification.messageType,
              state: "NOTIFICATION",
              qualifier: "ID",
              value: notification.messageID,
            };
            return (
              <Alert
                key={notification.messageID}
                content={content}
                severity="nominal"
              />
            );
          })}
        </div>

        <div className={styles.group}>
          <p className={styles.groupLabel}>FLARES</p>
          {DONKI_FLR_FIXTURES.map((flare) => {
            const content: AlertContent = {
              subject: "SOLAR FLARE",
              state: `${flare.classType} PEAK ${formatIsoLikeTime(flare.peakTime)}`,
              // A flare still in progress has no confirmed end time — the
              // whole trailing clause is dropped rather than filled with a
              // placeholder, per the same degrade rule Alert already owns.
              qualifier: flare.endTime ? "END" : undefined,
              value: flare.endTime ? formatIsoLikeTime(flare.endTime) : undefined,
            };
            const severity: AlertSeverity =
              flare.flrID === strongestFlareId ? "attention" : "nominal";
            return <Alert key={flare.flrID} content={content} severity={severity} />;
          })}
        </div>

        <div className={styles.group}>
          <p className={styles.groupLabel}>CME / STORMS</p>
          {DONKI_CME_FIXTURES.map((cme) => {
            const analysis = primaryAnalysis(cme);
            const content: AlertContent = {
              subject: "CME",
              state: "DETECTED",
              // No analysis entry yet (a real, routine case) — the clause
              // is dropped entirely rather than substituted with a filler.
              qualifier: analysis ? "SPEED" : undefined,
              value: analysis ? `${analysis.speed} KM/S` : undefined,
            };
            return <Alert key={cme.activityID} content={content} severity="nominal" />;
          })}
          {DONKI_GST_FIXTURES.map((storm) => {
            const content: AlertContent = {
              subject: "GEOMAGNETIC STORM",
              state: "DETECTED",
              qualifier: "KP",
              value: String(maxKp(storm)),
            };
            const severity: AlertSeverity =
              storm.gstID === strongestGstId ? "attention" : "nominal";
            return <Alert key={storm.gstID} content={content} severity={severity} />;
          })}
        </div>
      </div>
    </Panel>
  );
}
