"use client";

import { memo, useEffect, useRef, useState, type CSSProperties } from "react";
import { imagePlanKey, selectImageCandidate, type ImagePlan } from "@/app/lib/diaporama-assets";
import ProductImage from "./ProductImage";
import { prepareImagePlan } from "./preloadImages";
import styles from "./PreparedNeon.module.css";

/** Animate a prepared halo with opacity and a rotating light; never derive a contour or blur on the TV. */
function PreparedNeon({ base, neon, sizes, onVisibleChange, prominent = false }: {
  base: ImagePlan; neon: ImagePlan; sizes: string; onVisibleChange?: (visible: boolean) => void;
  prominent?: boolean;
}) {
  const key = imagePlanKey(neon);
  const [readyKey, setReadyKey] = useState("");
  const layer = useRef<HTMLDivElement>(null);
  const [raster, setRaster] = useState<{ width: number; height: number; scale: number } | null>(null);
  useEffect(() => {
    if (!neon.effects) return;
    let cancelled = false;
    void prepareImagePlan(neon, sizes).then(() => { if (!cancelled) setReadyKey(key); });
    return () => { cancelled = true; };
  }, [key, neon, sizes]);
  useEffect(() => () => { onVisibleChange?.(false); }, [onVisibleChange]);
  const candidate = selectImageCandidate(neon);
  const haloWidth = candidate?.dimensions?.width;
  const haloHeight = candidate?.dimensions?.height;
  useEffect(() => {
    const element = layer.current;
    if (!element) return;
    const measure = () => {
      const width = haloWidth || element.clientWidth;
      const height = haloHeight || element.clientHeight;
      const fit = Math.min(element.clientWidth / width, element.clientHeight / height);
      // Limit the animated surface instead of rotating multiple full-screen masked layers.
      const limit = 320 / Math.max(1, window.devicePixelRatio || 1);
      const ratio = Math.min(1, limit / Math.max(width, height));
      const next = { width: width * ratio, height: height * ratio, scale: fit / ratio };
      setRaster(previous => previous && Math.abs(previous.scale - next.scale) < .001 &&
        previous.width === next.width && previous.height === next.height ? previous : next);
    };
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [readyKey, key, haloWidth, haloHeight]);
  if (!neon.effects || readyKey !== key || !candidate?.effects) return null;
  const normal = selectImageCandidate(base)?.dimensions;
  const halo = candidate.dimensions;
  const scale = normal && halo ? Math.min(1.25, Math.max(halo.width / normal.width, halo.height / normal.height)) : 1;
  return <div ref={layer} className={styles.layer} data-prepared-neon data-prominent={prominent} aria-hidden="true" style={{ transform: `scale(${scale})` } as CSSProperties}>
    <ProductImage plan={neon} alt="" sizes={sizes} className={styles.pulse}
      onlyEffects onEffectsChange={onVisibleChange} />
    {raster && <div className={styles.raster} style={{ width: raster.width, height: raster.height,
      transform: `translate(-50%, -50%) scale(${raster.scale})` }}><div className={styles.mask} style={{
      maskImage: `url(${JSON.stringify(candidate.url)})`,
      WebkitMaskImage: `url(${JSON.stringify(candidate.url)})`,
    }}>
      <div className={styles.glow} />
      <div className={styles.runner} />
    </div></div>}
  </div>;
}
export default memo(PreparedNeon);
