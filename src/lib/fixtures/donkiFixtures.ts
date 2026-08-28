/**
 * Realistic-density DONKI-shaped mock records (D-05, D-11).
 *
 * These records are shaped and typed exactly like real `/DONKI/notifications`,
 * `/DONKI/FLR`, `/DONKI/CME` and `/DONKI/GST` responses, including the
 * awkward parts — a flare still in progress, a CME with no analysis entry
 * yet — because those awkward parts are exactly what the `Alert` grammar's
 * degrade rule and later phases have to handle correctly.
 *
 * Phase 5's fetch layer reuses this exact module to exercise its loading,
 * rate-limited, unavailable and empty states — do not delete it once real
 * fetching exists.
 */

import type {
  DonkiCme,
  DonkiFlare,
  DonkiGeomagneticStorm,
  DonkiNotification,
} from "@/types/donki";

export const DONKI_NOTIFICATION_FIXTURES: DonkiNotification[] = [
  {
    messageType: "CME",
    messageID: "20261103-AL-001",
    messageIssueTime: "2026-11-03T14:32Z",
    messageBody:
      "## Message Type: CME Update ##\n\n" +
      "## Message ID: 20261103-AL-001 ##\n\n" +
      "A coronal mass ejection (CME) was observed on 2026-11-03 around " +
      "09:12 UT associated with an eruption from active region 13897. " +
      "The CME is estimated to be moving at approximately 812 km/s with " +
      "a half angle of 32 degrees, centered near S15E10. Analysis " +
      "suggests a possible glancing blow to the Earth's magnetosphere " +
      "in the 2026-11-06 to 2026-11-07 timeframe.\n\n" +
      "## Source Location: S15E10 ##\n" +
      "## Linked Event: 2026-11-02-FLR-001 ##",
    messageURL:
      "https://webtools.ccmc.gsfc.nasa.gov/DONKI/view/notification/20261103-AL-001",
  },
  {
    messageType: "FLR",
    messageID: "20261105-AL-002",
    messageIssueTime: "2026-11-05T02:11Z",
    messageBody:
      "## Message Type: Space Weather Notification - Solar Flare ##\n\n" +
      "## Message ID: 20261105-AL-002 ##\n\n" +
      "An X1.1 class solar flare occurred on 2026-11-04 with a peak time " +
      "of 21:47 UT. The event was associated with active region 13901 " +
      "located near N09W35. Radio blackouts (R3-Strong) were observed " +
      "on the sunlit side of Earth at the time of the flare.\n\n" +
      "## Near-Term Space Weather Impacts ##\n" +
      "R3-Strong radio blackout, degraded HF communication on the dayside.",
    messageURL:
      "https://webtools.ccmc.gsfc.nasa.gov/DONKI/view/notification/20261105-AL-002",
  },
  {
    messageType: "GST",
    messageID: "20261108-AL-003",
    messageIssueTime: "2026-11-08T19:05Z",
    messageBody:
      "## Message Type: Space Weather Notification - Geomagnetic Storm ##\n\n" +
      "## Message ID: 20261108-AL-003 ##\n\n" +
      "A geomagnetic storm reached G3 (Strong) levels beginning " +
      "2026-11-08 18:00 UT, driven by the arrival of a CME observed " +
      "departing the Sun on 2026-11-05. Kp index values of 7 were " +
      "recorded during the peak of the storm. Aurora may have been " +
      "visible at unusually low geomagnetic latitudes.\n\n" +
      "## Linked Event: 2026-11-05T22:48:00-CME-002 ##",
    messageURL:
      "https://webtools.ccmc.gsfc.nasa.gov/DONKI/view/notification/20261108-AL-003",
  },
];

export const DONKI_FLR_FIXTURES: DonkiFlare[] = [
  {
    flrID: "2026-11-02-FLR-001",
    beginTime: "2026-11-02T08:12Z",
    peakTime: "2026-11-02T08:47Z",
    endTime: "2026-11-02T09:15Z",
    classType: "M2.4",
    sourceLocation: "S18E22",
    activeRegionNum: 13897,
  },
  {
    // In-progress flare — no confirmed end time and no confirmed active
    // region yet, hence both are null rather than a placeholder value.
    flrID: "2026-11-04-FLR-002",
    beginTime: "2026-11-04T21:22Z",
    peakTime: "2026-11-04T21:47Z",
    endTime: null,
    classType: "X1.1",
    sourceLocation: "N09W35",
    activeRegionNum: null,
  },
  {
    flrID: "2026-11-06-FLR-003",
    beginTime: "2026-11-06T03:58Z",
    peakTime: "2026-11-06T04:12Z",
    endTime: "2026-11-06T04:26Z",
    classType: "C6.8",
    sourceLocation: "S22W41",
    activeRegionNum: 13901,
  },
  {
    flrID: "2026-11-08-FLR-004",
    beginTime: "2026-11-08T16:03Z",
    peakTime: "2026-11-08T16:29Z",
    endTime: "2026-11-08T16:58Z",
    classType: "M9.3",
    sourceLocation: "N14E05",
    activeRegionNum: 13905,
  },
];

export const DONKI_CME_FIXTURES: DonkiCme[] = [
  {
    activityID: "2026-11-03T09:12:00-CME-001",
    startTime: "2026-11-03T09:12Z",
    sourceLocation: "S15E10",
    note:
      "CME observed in SOHO/LASCO C2 and C3 imagery, associated with " +
      "M2.4 flare from AR 13897.",
    cmeAnalyses: [
      {
        latitude: -14,
        longitude: 8,
        halfAngle: 32,
        speed: 812,
        type: "S",
        isMostAccurate: true,
      },
    ],
  },
  {
    // No analyses yet — this is the record the Alert grammar's degrade rule
    // exists for. Must stay empty; do not backfill an analysis here.
    activityID: "2026-11-05T22:48:00-CME-002",
    startTime: "2026-11-05T22:48Z",
    sourceLocation: "N06W12",
    note: "Faint partial-halo CME, still under review by the SWRC forecast team.",
    cmeAnalyses: [],
  },
  {
    activityID: "2026-11-07T03:05:00-CME-003",
    startTime: "2026-11-07T03:05Z",
    sourceLocation: "S27E48",
    note:
      "Fast, wide CME associated with X1.1 flare from AR 13901; Earth-" +
      "directed component considered likely.",
    cmeAnalyses: [
      {
        latitude: -27,
        longitude: -48,
        halfAngle: 58,
        speed: 1340,
        type: "C",
        isMostAccurate: true,
      },
      {
        latitude: -25,
        longitude: -46,
        halfAngle: 55,
        speed: 1298,
        type: "S",
        isMostAccurate: false,
      },
    ],
  },
];

export const DONKI_GST_FIXTURES: DonkiGeomagneticStorm[] = [
  {
    gstID: "2026-11-08T18:00:00-GST-001",
    startTime: "2026-11-08T18:00Z",
    allKpIndex: [
      { observedTime: "2026-11-08T18:00Z", kpIndex: 6, source: "NOAA" },
      { observedTime: "2026-11-08T21:00Z", kpIndex: 7, source: "NOAA" },
      { observedTime: "2026-11-09T00:00Z", kpIndex: 6, source: "NOAA" },
    ],
  },
  {
    gstID: "2026-11-10T03:00:00-GST-002",
    startTime: "2026-11-10T03:00Z",
    allKpIndex: [
      { observedTime: "2026-11-10T03:00Z", kpIndex: 7, source: "NOAA" },
      { observedTime: "2026-11-10T06:00Z", kpIndex: 8, source: "NOAA" },
      { observedTime: "2026-11-10T09:00Z", kpIndex: 8, source: "NOAA" },
      { observedTime: "2026-11-10T12:00Z", kpIndex: 7, source: "NOAA" },
    ],
  },
];
