import { Panel } from "@/components/ui/Panel";
import { NEO_FIXTURES } from "@/lib/fixtures/neoFixtures";
import type { NeoCloseApproach, NeoObject } from "@/types/neows";

import styles from "./NeoFeedPanel.module.css";

/**
 * Picks the soonest close approach on record for an object rather than
 * assuming `close_approach_data[0]` is already chronological — the fixture
 * data happens to be ordered, but a future real feed entry is not
 * guaranteed to be, so this is the one small piece of derivation this panel
 * does (selecting which approach is "next", not judging the object itself).
 */
function nextCloseApproach(neo: NeoObject): NeoCloseApproach {
  return [...neo.close_approach_data].sort(
    (a, b) => a.epoch_date_close_approach - b.epoch_date_close_approach,
  )[0];
}

interface NumericField {
  value: string;
  unit: string;
}

function formatMissDistance(approach: NeoCloseApproach): NumericField {
  return {
    value: parseFloat(approach.miss_distance.lunar).toFixed(2),
    unit: "LD",
  };
}

function formatVelocity(approach: NeoCloseApproach): NumericField {
  return {
    value: parseFloat(
      approach.relative_velocity.kilometers_per_second,
    ).toFixed(2),
    unit: "KM/S",
  };
}

function formatDiameterRange(neo: NeoObject): NumericField {
  const { estimated_diameter_min, estimated_diameter_max } =
    neo.estimated_diameter.meters;
  return {
    value: `${Math.round(estimated_diameter_min)}-${Math.round(estimated_diameter_max)}`,
    unit: "M",
  };
}

/**
 * Renders a right-aligned numeric column: the value in the nominal token so
 * the digits dominate the row, its unit in the dim token, always inline
 * with the value it belongs to (never on a separate line, never omitted).
 */
function NumericCell({ field }: { field: NumericField }) {
  return (
    <span className={styles.numeric}>
      <span className={styles.numericValue}>{field.value}</span>{" "}
      <span className={styles.numericUnit}>{field.unit}</span>
    </span>
  );
}

/**
 * NEO FEED panel (NEO-01/NEO-02 field vocabulary, CRT-02). Renders every
 * fixture object as a place-value-aligned terminal row: name and NASA's own
 * hazard classification on one line, then close-approach date, miss
 * distance, relative velocity and estimated-diameter range laid out on a
 * fixed `ch`-column grid on the next. No notability tier, risk score or
 * single-value diameter is computed or rendered here — those belong to the
 * asteroid-classifier phase and its own disclaimer obligations (NEO-03/04).
 */
export function NeoFeedPanel() {
  return (
    <Panel title={`NEO FEED :: ${NEO_FIXTURES.length}`}>
      <div className={styles.list}>
        {NEO_FIXTURES.map((neo) => {
          const approach = nextCloseApproach(neo);
          return (
            <div key={neo.id} className={styles.row}>
              <p className={styles.nameLine}>
                <span className={styles.name}>{neo.name}</span>
                <span
                  className={
                    neo.is_potentially_hazardous_asteroid
                      ? styles.hazardFlagged
                      : styles.hazardClear
                  }
                >
                  {`NASA CLASS: ${
                    neo.is_potentially_hazardous_asteroid
                      ? "HAZARDOUS"
                      : "NON-HAZARDOUS"
                  }`}
                </span>
              </p>
              <div className={styles.dataGrid}>
                <span className={styles.date}>
                  {approach.close_approach_date}
                </span>
                <NumericCell field={formatMissDistance(approach)} />
                <NumericCell field={formatVelocity(approach)} />
                <NumericCell field={formatDiameterRange(neo)} />
              </div>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}
