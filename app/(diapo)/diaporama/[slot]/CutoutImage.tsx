"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import type { ProcessedProductImage, ProductOutline } from "@/app/lib/product-outline";
import ProductLedOutline from "./ProductLedOutline";
import styles from "./DiaporamaClient.module.css";

const cache = new Map<string, Promise<ProcessedProductImage | null>>();
const pending = new Map<number, (asset: ProcessedProductImage | null) => void>();
let worker: Worker | undefined;
let nextId = 0;

/** Shared worker keeps pixel processing off the animation thread. Cache blobs, not object URLs. */
export function prepareCutout(src: string): Promise<ProcessedProductImage | null> {
  const existing = cache.get(src);
  if (existing) return existing;
  if (typeof Worker === "undefined" || typeof OffscreenCanvas === "undefined") return Promise.resolve(null);
  try {
    if (!worker) {
      worker = new Worker(new URL("./whiteBackground.worker.ts", import.meta.url));
      worker.onmessage = ({ data }: MessageEvent<{ id: number; asset: ProcessedProductImage | null }>) => {
        pending.get(data.id)?.(data.asset);
        pending.delete(data.id);
      };
      worker.onerror = () => {
        for (const resolve of pending.values()) resolve(null);
        pending.clear(); cache.clear(); worker?.terminate(); worker = undefined;
      };
    }
    const result = new Promise<ProcessedProductImage | null>(resolve => {
      const id = nextId++;
      const timer = window.setTimeout(() => { pending.delete(id); cache.delete(src); resolve(null); }, 15000);
      pending.set(id, asset => { window.clearTimeout(timer); resolve(asset); });
      worker!.postMessage({ id, src });
    });
    cache.set(src, result);
    // Bound memory usage during all-day playback of a large catalogue.
    if (cache.size > 24) cache.delete(cache.keys().next().value!);
    return result;
  } catch {
    return Promise.resolve(null);
  }
}

export default function CutoutImage({ src, alt, className, sizes = "70vw", priority = false, lighting }: {
  src: string; alt: string; className?: string; sizes?: string; priority?: boolean; lighting?: number;
}) {
  const [processed, setProcessed] = useState<{ source: string; url: string; outline: ProductOutline | null } | null>(null);
  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | undefined;
    void prepareCutout(src).then(asset => {
      if (cancelled) return;
      objectUrl = asset?.blob ? URL.createObjectURL(asset.blob) : undefined;
      setProcessed({ source: src, url: objectUrl || src, outline: asset?.outline ?? null });
    });
    return () => { cancelled = true; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [src]);
  if (processed?.source !== src) return null;
  return <span className={lighting !== undefined ? styles.ledArtwork : styles.cutoutArtwork}>
    <Image src={processed.url} alt={alt} fill unoptimized sizes={sizes} priority={priority} className={className} />
    {lighting !== undefined && processed.outline && <ProductLedOutline outline={processed.outline} variant={lighting} />}
  </span>;
}
