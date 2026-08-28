/**
 * Pure, dependency-free CRT intensity preference module. No React import —
 * deliberately, so it is trivially unit-testable once Phase 3 introduces a
 * test runner.
 *
 * The stored preference is the only input this phase reads that a user can
 * edit out from under it — it is same-origin editable through DevTools, and
 * it can be missing, malformed, or impossible to write at all (Safari
 * private browsing sets sessionStorage's quota to 0; some browsers/
 * extensions block site data entirely, throwing on both getItem/setItem).
 * Every one of those cases is a defined behaviour here, never an exception
 * that reaches React.
 */

export type CrtLevel = "FULL" | "REDUCED" | "OFF";

export const CRT_LEVELS: readonly CrtLevel[] = ["FULL", "REDUCED", "OFF"] as const;

const STORAGE_KEY = "crt-intensity";

let memoryFallback: CrtLevel = "FULL";

const INTENSITY_BY_LEVEL: Record<CrtLevel, number> = {
  FULL: 1,
  REDUCED: 0.4,
  OFF: 0,
};

/**
 * Maps a CRT level to its --crt-intensity value. Any argument outside the
 * fixed enum (e.g. a value that slipped past a TypeScript cast, or a direct
 * call from a future test with bad input) returns the full-intensity
 * default rather than `undefined`, which would otherwise land in the custom
 * property as an invalid CSS value and leave the overlay in an undefined
 * visual state.
 */
export function crtIntensityValue(level: CrtLevel): number {
  return CRT_LEVELS.includes(level) ? INTENSITY_BY_LEVEL[level] : INTENSITY_BY_LEVEL.FULL;
}

/**
 * Reads the persisted CRT level. Validates the stored string by membership
 * against CRT_LEVELS — not a cast, not a truthiness check, since a cast
 * would let any string through into the intensity calculation — and returns
 * the module's in-memory value for anything that is not an exact member,
 * including a null, an empty string, a differently-cased variant, or an
 * arbitrary attacker-supplied string. Wrapped in try/catch because
 * sessionStorage.getItem throws under the same storage-blocked conditions
 * writeCrtLevel guards against below.
 */
export function readCrtLevel(): CrtLevel {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    return CRT_LEVELS.includes(raw as CrtLevel) ? (raw as CrtLevel) : memoryFallback;
  } catch {
    return memoryFallback;
  }
}

/**
 * Persists the CRT level. The in-memory value is assigned BEFORE the
 * storage write is attempted — order matters: this is what keeps the
 * control working for the rest of the session in a browser where site data
 * is blocked or the private-mode quota is zero. The throw from the write is
 * swallowed deliberately; do not delete this catch as dead code, it is the
 * one behaviour in this phase (the UI Considerations "backstop" row) that
 * can silently ship broken if removed.
 */
export function writeCrtLevel(level: CrtLevel): void {
  memoryFallback = level;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, level);
  } catch {
    // Swallowed intentionally — memoryFallback already holds the value, so
    // the control keeps working in-memory for the rest of this tab session;
    // it just won't survive a reload under this storage policy.
  }
}
