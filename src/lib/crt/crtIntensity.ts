/**
 * Pure, dependency-free CRT intensity preference module. No React import —
 * deliberately, so it is trivially unit-testable once Phase 3 introduces a
 * test runner. Storage hardening (enum validation, in-memory fallback on a
 * throwing write) lands in plan 01-02 Task 2; this is the happy path that
 * closes the circuit end to end.
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

export function crtIntensityValue(level: CrtLevel): number {
  return INTENSITY_BY_LEVEL[level];
}

export function readCrtLevel(): CrtLevel {
  const raw = window.sessionStorage.getItem(STORAGE_KEY);
  return raw === "FULL" || raw === "REDUCED" || raw === "OFF" ? raw : memoryFallback;
}

export function writeCrtLevel(level: CrtLevel): void {
  memoryFallback = level;
  window.sessionStorage.setItem(STORAGE_KEY, level);
}
