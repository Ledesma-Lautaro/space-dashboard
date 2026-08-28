/**
 * NASA DONKI (`/DONKI/...`) payload types.
 *
 * Modeled directly against the verified field reference in
 * `.planning/research/FEATURES.md` §0.4 — not invented shapes. Phase 5's
 * fetch layer imports these types verbatim rather than redeclaring them, so
 * a shape drift here is a compile error there, not a runtime surprise.
 */

/**
 * `GET /DONKI/notifications` entry — a pre-written, human-readable bulletin.
 * `messageBody` is a long markdown-formatted plain-text block; this project
 * renders it verbatim inside a scrollable terminal panel (SW-01).
 */
export interface DonkiNotification {
  messageType: string;
  messageID: string;
  messageIssueTime: string;
  messageBody: string;
  messageURL: string;
}

/**
 * `GET /DONKI/FLR` entry — a solar flare. An in-progress flare has neither
 * an end time nor a confirmed active region, so both are nullable rather
 * than defaulted — the consumer is forced to handle absence explicitly.
 */
export interface DonkiFlare {
  flrID: string;
  beginTime: string;
  peakTime: string;
  endTime: string | null;
  classType: string;
  sourceLocation: string;
  activeRegionNum: number | null;
}

/**
 * `GET /DONKI/CMEAnalysis` entry, nested inside a `DonkiCme`'s
 * `cmeAnalyses[]`. Deeper physical modeling of a CME's trajectory/geometry —
 * latitude/longitude of the source, the angular half-width of the ejection
 * cone in degrees, and its estimated speed in km/s.
 */
export interface DonkiCmeAnalysis {
  latitude: number;
  longitude: number;
  halfAngle: number;
  speed: number;
  type: string;
  isMostAccurate: boolean;
}

/**
 * `GET /DONKI/CME` entry. `cmeAnalyses` may legitimately be empty — real
 * CMEs routinely arrive with no analysis entry yet, which is exactly the
 * case the `Alert` grammar's degrade rule exists for.
 */
export interface DonkiCme {
  activityID: string;
  startTime: string;
  sourceLocation: string;
  note: string;
  cmeAnalyses: DonkiCmeAnalysis[];
}

/**
 * One entry in a `DonkiGeomagneticStorm`'s `allKpIndex[]`. Kp is measured
 * repeatedly through a storm, so a storm carries a small time series of
 * these, not a single number.
 */
export interface DonkiKpIndexEntry {
  observedTime: string;
  kpIndex: number;
  source: string;
}

/**
 * `GET /DONKI/GST` entry — a geomagnetic storm. NOAA scale: Kp 5=minor(G1),
 * 6=moderate(G2), 7=strong(G3), 8=severe(G4), 9=extreme(G5) — worth encoding
 * as a lookup table in the consumer, per FEATURES.md §0.4.
 */
export interface DonkiGeomagneticStorm {
  gstID: string;
  startTime: string;
  allKpIndex: DonkiKpIndexEntry[];
}
