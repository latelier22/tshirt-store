import { removeWhiteBackground } from "@/app/lib/white-background";
import { traceProductOutline, type ProcessedProductImage } from "@/app/lib/product-outline";

type Job = { id: number; src: string };
const scope = self as unknown as {
  onmessage: ((event: MessageEvent<Job>) => void) | null;
  postMessage: (data: { id: number; asset: ProcessedProductImage | null }) => void;
};

scope.onmessage = async ({ data: { id, src } }) => {
  let bitmap: ImageBitmap | undefined;
  try {
    const response = await fetch(src, { signal: AbortSignal.timeout(12000) });
    if (!response.ok) throw new Error("Image unavailable");
    bitmap = await createImageBitmap(await response.blob());
    const scale = Math.min(1, 1400 / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = new OffscreenCanvas(width, height);
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) throw new Error("Canvas unavailable");
    context.drawImage(bitmap, 0, 0, width, height);
    const image = context.getImageData(0, 0, width, height);
    const changed = removeWhiteBackground(image.data, width, height);
    const outline = traceProductOutline(image.data, width, height);
    if (!changed) { scope.postMessage({ id, asset: { blob: null, outline } }); return; }
    context.putImageData(image, 0, 0);
    scope.postMessage({ id, asset: { blob: await canvas.convertToBlob({ type: "image/png" }), outline } });
  } catch {
    scope.postMessage({ id, asset: null });
  } finally {
    bitmap?.close();
  }
};
