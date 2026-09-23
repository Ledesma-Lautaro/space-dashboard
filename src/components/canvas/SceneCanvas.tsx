"use client";

import { useEffect, useRef, useState } from "react";
import { SceneEngine } from "@/lib/scene/SceneEngine";
import { SignalLost } from "./SignalLost";
import styles from "./SceneCanvas.module.css";

const NOT_TO_SCALE= "[ SCHEMATIC VIEW :: NOT TO SCALE ]";

export function SceneCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [contextLost, setContextLost] = useState(false);

  useEffect(() => {
    if (!canvasRef.current) return;
    const engine = new SceneEngine(canvasRef.current, {
      onContextLost: () => setContextLost(true),
      onContextRestored: () => setContextLost(false),
    });

    return () => {
      engine.dispose();
    };
  }, []);

  return (
    <div className={styles.root}>
      <canvas ref={canvasRef} className={styles.canvas} />
      <p className={styles.notToScale}>{NOT_TO_SCALE}</p>
      {contextLost && (
        <div className={styles.overlay}>
          <SignalLost />
        </div>
      )}
    </div>
  );
}