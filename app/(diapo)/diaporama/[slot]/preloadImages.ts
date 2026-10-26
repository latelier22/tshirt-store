"use client";

import { getImageProps } from "next/image";
import { createImageReadiness, type ImageRequest } from "@/app/lib/image-readiness";
import type { HiboutikProduct } from "@/app/types/ProductType";
import { firstImage } from "./helpers";

export const BOARD_IMAGE_SIZES = "(max-width: 800px) 30vw, 20vw";
export const HERO_IMAGE_SIZES = "(max-width: 800px) 90vw, 60vw";

function loadAndDecode({ src, sizes }: ImageRequest): Promise<boolean> {
  return new Promise(resolve => {
    const image = new window.Image();
    let settled = false;
    const finish = (ready: boolean) => {
      if (settled) return;
      settled = true; window.clearTimeout(timer);
      image.onload = null; image.onerror = null;
      if (!ready) { image.removeAttribute("srcset"); image.removeAttribute("src"); }
      resolve(ready);
    };
    const timer = window.setTimeout(() => finish(false), 20000);
    image.onload = () => {
      if (typeof image.decode === "function") {
        void image.decode().then(() => finish(true), () => finish(false));
      } else finish(image.naturalWidth > 0);
    };
    image.onerror = () => finish(false);
    image.decoding = "async";
    try {
      const { props } = getImageProps({ src, alt: "", fill: true, sizes, quality: 75 });
      if (props.sizes) image.sizes = props.sizes;
      if (props.srcSet) image.srcset = props.srcSet;
      image.src = props.src;
    } catch { finish(false); }
  });
}

const readiness = createImageReadiness(loadAndDecode);
export function preloadProductImages(products: HiboutikProduct[], sizes: string) {
  return readiness.prepare(products.flatMap(product => {
    const src = firstImage(product);
    return src ? [{ src, sizes }] : [];
  }));
}

/** Failed photos are retried while the current message stays visible. */
export async function waitForProductImages(products: HiboutikProduct[], sizes: string, valid: () => boolean) {
  while (valid()) {
    if (await preloadProductImages(products, sizes)) return valid();
    if (!valid()) return false;
    await new Promise(resolve => window.setTimeout(resolve, 2000));
  }
  return false;
}
