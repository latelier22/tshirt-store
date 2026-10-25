export type ProductOutline = { path: string; width: number; height: number };
export type ProcessedProductImage = { blob: Blob | null; outline: ProductOutline | null };

/** Trace the exterior alpha silhouette at display resolution, omitting interior holes. */
export function traceProductOutline(pixels: Uint8ClampedArray, width: number, height: number): ProductOutline | null {
  if (width <= 0 || height <= 0 || pixels.length !== width * height * 4) return null;
  const scale = Math.max(1, Math.max(width, height) / 360);
  const w = Math.ceil(width / scale);
  const h = Math.ceil(height / scale);
  const mask = new Uint8Array(w * h);
  let transparent = false;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const px = Math.min(width - 1, Math.floor((x + .5) * width / w));
    const py = Math.min(height - 1, Math.floor((y + .5) * height / h));
    const filled = pixels[(py * width + px) * 4 + 3] >= 100;
    mask[y * w + x] = filled ? 1 : 0;
    if (!filled) transparent = true;
  }
  // Do not draw a misleading LED rectangle around a photo that could not be cut out.
  if (!transparent) return null;
  const stride = w + 1;
  const edges = new Map<number, number[]>();
  const add = (x1: number, y1: number, x2: number, y2: number) => {
    const start = y1 * stride + x1;
    const list = edges.get(start) ?? [];
    list.push(y2 * stride + x2); edges.set(start, list);
  };
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (!mask[y * w + x]) continue;
    if (y === 0 || !mask[(y - 1) * w + x]) add(x, y, x + 1, y);
    if (x === w - 1 || !mask[y * w + x + 1]) add(x + 1, y, x + 1, y + 1);
    if (y === h - 1 || !mask[(y + 1) * w + x]) add(x + 1, y + 1, x, y + 1);
    if (x === 0 || !mask[y * w + x - 1]) add(x, y + 1, x, y);
  }
  const paths: { area: number; path: string }[] = [];
  while (edges.size) {
    const start = edges.keys().next().value!;
    const loop: number[] = [];
    let current = start;
    let closed = false;
    const limit = (w + 1) * (h + 1) * 4;
    for (let step = 0; step < limit; step++) {
      loop.push(current);
      const list = edges.get(current);
      if (!list?.length) break;
      const next = list.pop()!;
      if (!list.length) edges.delete(current);
      current = next;
      if (current === start) { closed = true; break; }
    }
    if (!closed || loop.length < 12) continue;
    let area = 0;
    const points: [number, number][] = [];
    for (let i = 0; i < loop.length; i++) {
      const a = loop[i], b = loop[(i + 1) % loop.length];
      area += (a % stride) * Math.floor(b / stride) - (b % stride) * Math.floor(a / stride);
      const prev = loop[(i - 1 + loop.length) % loop.length];
      // Preserve corners only; long straight edges do not need extra path vertices.
      if (a - prev !== b - a) points.push([a % stride, Math.floor(a / stride)]);
    }
    if (area <= 32 || points.length < 3) continue;
    const path = points.map(([x, y], i) => `${i ? "L" : "M"}${(x * width / w).toFixed(1)},${(y * height / h).toFixed(1)}`).join(" ") + " Z";
    paths.push({ area, path });
  }
  const path = paths.sort((a, b) => b.area - a.area).slice(0, 4).map(item => item.path).join(" ");
  return path ? { path, width, height } : null;
}
