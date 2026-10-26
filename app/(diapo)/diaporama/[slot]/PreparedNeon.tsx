"use client";

import { memo, useEffect, useState } from "react";
import { imagePlanKey, preparedImageUrl, selectImageCandidate, type ImagePlan } from "@/app/lib/diaporama-assets";
import type { ProductOutline } from "@/app/lib/product-outline";
import ProductImage from "./ProductImage";
import ProductLedOutline from "./ProductLedOutline";
import { prepareImagePlan } from "./preloadImages";
import { usePreparedImages } from "./PreparedImagesProvider";
import styles from "./ProductLedOutline.module.css";

type ReadyOutline = { image_url: string; outline: ProductOutline };
const cache = new Map<string, Promise<ReadyOutline | null>>();
function loadOutline(url: string): Promise<ReadyOutline | null> {
  const existing = cache.get(url);
  if (existing) return existing;
  const job = (async () => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 6500);
    try {
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok || response.status === 204) return null;
      const result = await response.json();
      const outline = result?.outline;
      if (!preparedImageUrl(result?.image_url) || !outline || typeof outline.path !== "string" ||
        outline.path.length > 160000 || !/^[MLZ\d.,\s-]+$/.test(outline.path) ||
        ![outline.width, outline.height].every(n => Number.isFinite(n) && n > 0 && n <= 360)) return null;
      return result as ReadyOutline;
    } catch { return null; }
    finally { window.clearTimeout(timer); }
  })();
  cache.set(url, job);
  if (cache.size > 24) cache.delete(cache.keys().next().value!);
  void job.then(result => { if (!result) cache.delete(url); });
  return job;
}

/** Exact SVG choreography from eb66ff11; only the server reads the cutout's pixels. */
function PreparedNeon({ base, neon, sizes, productId, variant = 0, onVisibleChange, prominent = false }: {
  base: ImagePlan; neon: ImagePlan; sizes: string; productId: number; variant?: number;
  onVisibleChange?: (visible: boolean) => void; prominent?: boolean;
}) {
  const { slot } = usePreparedImages();
  const key = imagePlanKey(neon);
  const image = selectImageCandidate(base)?.url;
  const [ready, setReady] = useState<{ key: string; contour: ReadyOutline | null } | null>(null);
  useEffect(() => {
    if (!neon.effects || !neon.revision || !slot) return;
    let cancelled = false;
    const query = new URLSearchParams({ context: prominent ? "individual" : "board", revision: neon.revision });
    const url = `/api/diaporama/${encodeURIComponent(slot)}/outline/${productId}?${query}`;
    void loadOutline(url).then(async contour => {
      if (!contour) await prepareImagePlan(neon, sizes);
      if (cancelled) return;
      setReady({ key, contour });
      if (contour) onVisibleChange?.(true);
    });
    return () => { cancelled = true; };
  }, [key, neon, slot, productId, prominent, sizes, onVisibleChange]);
  useEffect(() => () => { onVisibleChange?.(false); }, [onVisibleChange]);
  if (!neon.effects || ready?.key !== key) return null;
  if (ready.contour && ready.contour.image_url === image) return <div className={styles.layer} data-original-neon aria-hidden="true">
    <ProductLedOutline outline={ready.contour.outline} variant={variant} />
  </div>;
  if (!selectImageCandidate(neon)?.effects) return null;
  // Keep the baked server halo if contour preparation is temporarily unavailable.
  return <div className={styles.fallback} aria-hidden="true">
    <ProductImage plan={neon} alt="" sizes={sizes} className={styles.fallbackImage} onlyEffects onEffectsChange={onVisibleChange} />
  </div>;
}
export default memo(PreparedNeon);
