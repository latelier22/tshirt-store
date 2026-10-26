"use client";

import { memo, useEffect, useState, type CSSProperties } from "react";
import { imagePlanKey, selectImageCandidate, type ImagePlan } from "@/app/lib/diaporama-assets";
import ProductImage from "./ProductImage";
import { prepareImagePlan } from "./preloadImages";
import styles from "./DiaporamaClient.module.css";

/** Animate a prepared halo with opacity and a rotating light; never derive a contour or blur on the TV. */
function PreparedNeon({ base, neon, sizes, onVisibleChange, prominent = false }: {
  base: ImagePlan; neon: ImagePlan; sizes: string; onVisibleChange?: (visible: boolean) => void;
  prominent?: boolean;
}) {
  const key = imagePlanKey(neon);
  const [readyKey, setReadyKey] = useState("");
  useEffect(() => {
    if (!neon.effects) return;
    let cancelled = false;
    void prepareImagePlan(neon, sizes).then(() => { if (!cancelled) setReadyKey(key); });
    return () => { cancelled = true; };
  }, [key, neon, sizes]);
  useEffect(() => () => { onVisibleChange?.(false); }, [onVisibleChange]);
  const candidate = selectImageCandidate(neon);
  if (!neon.effects || readyKey !== key || !candidate?.effects) return null;
  const normal = selectImageCandidate(base)?.dimensions;
  const halo = candidate.dimensions;
  const scale = normal && halo ? Math.min(1.25, Math.max(halo.width / normal.width, halo.height / normal.height)) : 1;
  return <div className={styles.preparedNeonLayer} data-prominent={prominent} aria-hidden="true" style={{ transform: `scale(${scale})` } as CSSProperties}>
    <ProductImage plan={neon} alt="" sizes={sizes} className={styles.preparedNeonPulse}
      onlyEffects onEffectsChange={onVisibleChange} />
    <div className={styles.preparedNeonMask} style={{
      maskImage: `url(${JSON.stringify(candidate.url)})`,
      WebkitMaskImage: `url(${JSON.stringify(candidate.url)})`,
    }}>
      <div className={styles.preparedNeonGlow} />
      <div className={styles.preparedNeonRunner} />
      {prominent && <div className={styles.preparedNeonRunnerSecond} />}
    </div>
  </div>;
}
export default memo(PreparedNeon);
