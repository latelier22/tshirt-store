"use client";

import { getImageProps } from "next/image";
import { createImageReadiness, type ImageRequest } from "@/app/lib/image-readiness";
import {
  BOARD_IMAGE_SIZES, HERO_IMAGE_SIZES, imageCandidateAfterFailure, resolveProductImage, selectImageCandidate,
  type ImageContext, type ImagePlan, type ImageProduct, type PreparedEntry,
} from "@/app/lib/diaporama-assets";

export { BOARD_IMAGE_SIZES, HERO_IMAGE_SIZES };
function loadAndDecode({ src, sizes, prepared }: ImageRequest): Promise<boolean> {
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
    const timer = window.setTimeout(() => finish(false), 7000);
    image.onload = () => {
      if (typeof image.decode === "function") void image.decode().then(() => finish(true), () => finish(false));
      else finish(image.naturalWidth > 0);
    };
    image.onerror = () => finish(false);
    image.decoding = "async";
    try {
      const { props } = getImageProps({ src, alt: "", fill: true, sizes, quality: 75, unoptimized: !!prepared });
      if (props.sizes) image.sizes = props.sizes;
      if (props.srcSet) image.srcset = props.srcSet;
      image.src = props.src;
    } catch { finish(false); }
  });
}
const readiness = createImageReadiness(loadAndDecode);
export async function prepareImagePlan(plan: ImagePlan, sizes: string): Promise<void> {
  // One attempt per candidate, in order. A complete failure gets a visible placeholder, never an endless welcome screen.
  for (let attempt = 0; attempt < plan.candidates.length; attempt++) {
    const candidate = selectImageCandidate(plan);
    if (!candidate) return;
    const ready = await readiness.prepare([{ src: candidate.url, sizes, prepared: candidate.prepared }]);
    if (ready) return;
    imageCandidateAfterFailure(plan, candidate.url);
  }
}
export async function preloadProductImages(
  products: ImageProduct[], sizes: string, entries: ReadonlyMap<number, PreparedEntry> = new Map(), valid = () => true
) {
  const context: ImageContext = sizes === BOARD_IMAGE_SIZES ? "board" : "individual";
  for (let index = 0; index < products.length && valid(); index += 2) {
    await Promise.all(products.slice(index, index + 2).map(async product => {
      const entry = entries.get(Number(product.product_id));
      await prepareImagePlan(resolveProductImage(product, entry, context), sizes);
      if (context === "individual" && valid()) {
        const neon = resolveProductImage(product, entry, "individual-neon");
        if (neon.effects) await prepareImagePlan(neon, sizes);
      }
    }));
  }
  return valid();
}
export const waitForProductImages = preloadProductImages;

export function preloadBoardEffect(product: ImageProduct, entries: ReadonlyMap<number, PreparedEntry>) {
  const plan = resolveProductImage(product, entries.get(Number(product.product_id)), "active");
  return plan.effects ? prepareImagePlan(plan, BOARD_IMAGE_SIZES) : Promise.resolve();
}
