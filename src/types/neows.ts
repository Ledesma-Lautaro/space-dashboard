/**
 * NASA NeoWs (`/neo/rest/v1/...`) payload types.
 *
 * Modeled directly against the verified field reference in
 * `.planning/research/FEATURES.md` §0.1 — not invented shapes. Phase 3's
 * fetch layer imports these types verbatim rather than redeclaring them, so
 * a shape drift here is a compile error there, not a runtime surprise.
 */

/**
 * A single unit's estimated-diameter bounds. NASA derives this range from
 * `absolute_magnitude_h` assuming a generic albedo — it is always a min/max
 * spread, never a single measured value. Collapsing it to one number is
 * explicitly out of scope for this whole project (REQUIREMENTS.md).
 */
export interface NeoDiameterBounds {
  estimated_diameter_min: number;
  estimated_diameter_max: number;
}

/**
 * `estimated_diameter`, keyed by unit. Only kilometers and meters are
 * consumed by this project's UI (REQUIREMENTS.md NEO-01/NEO-06), but miles
 * and feet are present on the real payload — carried here so a fixture or a
 * future consumer copying the raw NASA shape does not need to strip fields.
 */
export interface NeoDiameterRange {
  kilometers: NeoDiameterBounds;
  meters: NeoDiameterBounds;
  miles: NeoDiameterBounds;
  feet: NeoDiameterBounds;
}

/**
 * Relative velocity at close approach. NeoWs really does return these as
 * strings, not numbers — deliberate, matches the wire format. A consumer
 * must `parseFloat` before doing arithmetic; typing this as `number` here
 * would push a silent parse bug into Phase 4.
 */
export interface NeoRelativeVelocity {
  kilometers_per_second: string;
  kilometers_per_hour: string;
  miles_per_hour: string;
}

/**
 * Miss distance at close approach, in four units. Strings on the wire, same
 * caveat as `NeoRelativeVelocity` above. `lunar` (Lunar Distances, ~384,400
 * km) is the most human-intuitive unit for a "how close was that" display
 * per FEATURES.md §0.1 — raw `kilometers` reads as incomprehensible to a lay
 * visitor.
 */
export interface NeoMissDistance {
  astronomical: string;
  lunar: string;
  kilometers: string;
  miles: string;
}

/**
 * One entry in `close_approach_data[]`. A NEO feed can include approaches to
 * bodies other than Earth — `orbiting_body` must be checked by the consumer,
 * never assumed to be `"Earth"`.
 */
export interface NeoCloseApproach {
  close_approach_date: string;
  close_approach_date_full: string;
  epoch_date_close_approach: number;
  relative_velocity: NeoRelativeVelocity;
  miss_distance: NeoMissDistance;
  orbiting_body: string;
}

/**
 * The `orbit_class` sub-object of `orbital_data` — e.g. `orbit_class_type:
 * "APO"` for Apollo-type.
 */
export interface NeoOrbitClass {
  orbit_class_type: string;
  orbit_class_description: string;
  orbit_class_range: string;
}

/**
 * Full osculating orbital elements. Not consumed by this phase's UI, but
 * modeled in full because Phase 4's detail view and any later 3D orbit-line
 * rendering both read from this object, and partially typing it now would
 * force a breaking type change later.
 */
export interface NeoOrbitalData {
  orbit_id: string;
  orbit_determination_date: string;
  first_observation_date: string;
  last_observation_date: string;
  data_arc_in_days: number;
  observations_used: number;
  orbit_uncertainty: string;
  minimum_orbit_intersection: string;
  jupiter_tisserand_invariant: string;
  epoch_osculation: string;
  eccentricity: string;
  semi_major_axis: string;
  inclination: string;
  ascending_node_longitude: string;
  orbital_period: string;
  perihelion_distance: string;
  perihelion_argument: string;
  aphelion_distance: string;
  perihelion_time: string;
  mean_anomaly: string;
  mean_motion: string;
  equinox: string;
  orbit_class: NeoOrbitClass;
}

/**
 * A single near-earth object, as returned by both `/neo/rest/v1/feed` list
 * entries and the `/neo/rest/v1/neo/{id}` lookup. `orbital_data` is
 * optional: feed list entries carry a thinner record than the single-object
 * lookup does on the real API, so a consumer must handle its absence rather
 * than assume it is always present.
 */
export interface NeoObject {
  id: string;
  neo_reference_id: string;
  name: string;
  nasa_jpl_url: string;
  absolute_magnitude_h: number;
  estimated_diameter: NeoDiameterRange;
  is_potentially_hazardous_asteroid: boolean;
  is_sentry_object: boolean;
  close_approach_data: NeoCloseApproach[];
  orbital_data?: NeoOrbitalData;
}

/**
 * `GET /neo/rest/v1/feed` response. `near_earth_objects` is an object keyed
 * by `YYYY-MM-DD` date string, not a flat array — the fetch/transform layer
 * must plan around this shape.
 */
export interface NeoFeedResponse {
  element_count: number;
  near_earth_objects: Record<string, NeoObject[]>;
}
