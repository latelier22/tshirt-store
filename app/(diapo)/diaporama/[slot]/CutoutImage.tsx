"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

const cache = new Map<string, Promise<Blob | null>>();
const pending = new Map<number, (blob: Blob | null) => void>();
let worker: Worker | undefined;
let nextId = 0;

/** Shared worker keeps pixel processing off the animation thread. Cache blobs, not object URLs. */
export function prepareCutout(src: string): Promise<Blob | null> {
  const existing = cache.get(src);
  if (existing) return existing;
  if (typeof Worker === "undefined" || typeof OffscreenCanvas === "undefined") return Promise.resolve(null);
  try {
    if (!worker) {
      worker = new Worker(new URL("./whiteBackground.worker.ts", import.meta.url));
      worker.onmessage = ({ data }: MessageEvent<{ id: number; blob: Blob | null }>) => {
        pending.get(data.id)?.(data.blob);
        pending.delete(data.id);
      };
      worker.onerror = () => {
        for (const resolve of pending.values()) resolve(null);
        pending.clear(); cache.clear(); worker?.terminate(); worker = undefined;
      };
    }
    const result = new Promise<Blob | null>(resolve => {
      const id = nextId++;
      const timer = window.setTimeout(() => { pending.delete(id); cache.delete(src); resolve(null); }, 15000);
      pending.set(id, blob => { window.clearTimeout(timer); resolve(blob); });
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

export default function CutoutImage({ src, alt, className, sizes = "70vw", priority = false }: {
  src: string; alt: string; className?: string; sizes?: string; priority?: boolean;
}) {
  const [processed, setProcessed] = useState<{ source: string; url: string } | null>(null);
  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | undefined;
    void prepareCutout(src).then(blob => {
      if (cancelled) return;
      objectUrl = blob ? URL.createObjectURL(blob) : undefined;
      setProcessed({ source: src, url: objectUrl || src });
    });
    return () => { cancelled = true; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [src]);
  if (processed?.source !== src) return null;
  return <Image src={processed.url} alt={alt} fill unoptimized sizes={sizes} priority={priority} className={className} />;
}
