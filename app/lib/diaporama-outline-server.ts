import sharp from "sharp";
import { traceProductOutline, type ProductOutline } from "./product-outline";
import { preparedImageUrl, type PreparedEntry } from "./diaporama-assets";

type OutlineContext = "board" | "individual";
const cached = new Map<string, ProductOutline>();
const pending = new Map<string, Promise<ProductOutline | null>>();

export function approvedOutlineImage(entry: PreparedEntry, context: OutlineContext): string | null {
  if (entry.status !== "ready" || !entry.effects_ready || !entry.has_transparency || !entry.cutout_applied) return null;
  return preparedImageUrl(context === "board" ? entry.board_url : entry.individual_url);
}

/** Extract only a vector from an existing cutout, once per version. Never remove a background here. */
export async function outlineFromPreparedBytes(bytes: Buffer): Promise<ProductOutline | null> {
  const { data, info } = await sharp(bytes, { limitInputPixels: 16777216 })
    .rotate().resize({ width: 360, height: 360, fit: "inside", withoutEnlargement: true })
    .toColourspace("srgb").ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return traceProductOutline(new Uint8ClampedArray(data.buffer, data.byteOffset, data.byteLength), info.width, info.height);
}

export async function getPreparedOutline(url: string): Promise<ProductOutline | null> {
  if (!preparedImageUrl(url)) return null;
  const previous = cached.get(url);
  if (previous) return previous;
  const existing = pending.get(url);
  if (existing) return existing;
  const request = (async () => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);
    try {
      const response = await fetch(url, { cache: "force-cache", signal: controller.signal, redirect: "error" });
      if (!response.ok || !response.body) return null;
      const reader = response.body.getReader();
      const chunks: Uint8Array[] = [];
      let length = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        length += value.byteLength;
        if (length > 8388608) { await reader.cancel(); return null; }
        chunks.push(value);
      }
      const outline = await outlineFromPreparedBytes(Buffer.concat(chunks));
      if (outline) {
        cached.set(url, outline);
        if (cached.size > 32) cached.delete(cached.keys().next().value!);
      }
      return outline;
    } catch { return null; }
    finally { clearTimeout(timer); pending.delete(url); }
  })();
  pending.set(url, request);
  return request;
}
