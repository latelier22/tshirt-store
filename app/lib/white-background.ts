/** Remove only near-white pixels connected to an image edge, preserving enclosed whites. */
export function removeWhiteBackground(pixels: Uint8ClampedArray, width: number, height: number): number {
  if (width <= 0 || height <= 0 || pixels.length !== width * height * 4) return 0;
  const visited = new Uint8Array(width * height);
  const queue = new Uint32Array(width * height);
  let head = 0;
  let tail = 0;

  function visit(index: number) {
    if (visited[index]) return;
    visited[index] = 1;
    const offset = index * 4;
    const min = Math.min(pixels[offset], pixels[offset + 1], pixels[offset + 2]);
    const max = Math.max(pixels[offset], pixels[offset + 1], pixels[offset + 2]);
    // A conservative threshold keeps pale device surfaces and coloured backgrounds.
    if (pixels[offset + 3] === 0 || (min >= 235 && max - min <= 18)) queue[tail++] = index;
  }

  for (let x = 0; x < width; x++) { visit(x); visit((height - 1) * width + x); }
  for (let y = 0; y < height; y++) { visit(y * width); visit(y * width + width - 1); }
  while (head < tail) {
    const index = queue[head++];
    pixels[index * 4 + 3] = 0;
    const x = index % width;
    if (x > 0) visit(index - 1);
    if (x < width - 1) visit(index + 1);
    if (index >= width) visit(index - width);
    if (index + width < width * height) visit(index + width);
  }

  // Soften just the foreground boundary and unmatte the white fringe.
  // Never feather enclosed whites: only pixels adjacent to the exterior mask qualify.
  const boundary: number[] = [];
  for (let cursor = 0; cursor < tail; cursor++) {
    const index = queue[cursor];
    const x = index % width;
    const neighbors = [x > 0 ? index - 1 : -1, x < width - 1 ? index + 1 : -1,
      index >= width ? index - width : -1, index + width < width * height ? index + width : -1];
    for (const neighbor of neighbors) {
      if (neighbor < 0 || visited[neighbor] === 2 || pixels[neighbor * 4 + 3] === 0) continue;
      visited[neighbor] = 2;
      boundary.push(neighbor);
    }
  }
  for (const index of boundary) {
    const offset = index * 4;
    const min = Math.min(pixels[offset], pixels[offset + 1], pixels[offset + 2]);
    const max = Math.max(pixels[offset], pixels[offset + 1], pixels[offset + 2]);
    if (min < 190 || max - min > 22) continue;
    const alpha = Math.max(.15, Math.min(1, (235 - min) / 45));
    pixels[offset + 3] = Math.round(pixels[offset + 3] * alpha);
    for (let channel = 0; channel < 3; channel++) {
      pixels[offset + channel] = Math.max(0, Math.round((pixels[offset + channel] - 255 * (1 - alpha)) / alpha));
    }
  }
  return tail;
}
