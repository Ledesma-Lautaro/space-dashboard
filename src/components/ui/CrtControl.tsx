"use client";

import { useEffect, useState } from "react";

import {
  crtIntensityValue,
  readCrtLevel,
  writeCrtLevel,
  type CrtLevel,
} from "@/lib/crt/crtIntensity";

import styles from "./CrtControl.module.css";

const NEXT_LEVEL: Record<CrtLevel, CrtLevel> = {
  FULL: "REDUCED",
  REDUCED: "OFF",
  OFF: "FULL",
};

export function CrtControl() {
  // Fixed server-safe default — matches the first client render. The real
  // persisted value is read only inside an effect after mount, never in the
  // render body or a state initializer, because both execute during the
  // server pass and would produce a hydration mismatch.
  const [level, setLevel] = useState<CrtLevel>("FULL");

  useEffect(() => {
    // Intentional hydration-safe read: state must start at the fixed
    // SSR-safe default above and pick up the real persisted value only
    // after mount, so the first client render matches the server-rendered
    // markup exactly. This is a one-shot read, not a subscription to an
    // externally-changing store, so useSyncExternalStore does not fit
    // better here.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLevel(readCrtLevel());
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--crt-intensity",
      String(crtIntensityValue(level)),
    );
  }, [level]);

  const cycle = () => {
    const next = NEXT_LEVEL[level];
    setLevel(next);
    writeCrtLevel(next);
  };

  return (
    <button
      type="button"
      className={styles.control}
      onClick={cycle}
      aria-label={`CRT intensity ${level}. Activate to cycle to the next level.`}
    >
      {`[ CRT: ${level} ]`}
    </button>
  );
}
