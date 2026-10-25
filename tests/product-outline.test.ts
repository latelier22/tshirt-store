import { test } from "node:test";
import { strict as assert } from "node:assert";
import { traceProductOutline } from "../app/lib/product-outline";

function mask(width: number, height: number, filled: (x: number, y: number) => boolean) {
  const pixels = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    pixels[(y * width + x) * 4 + 3] = filled(x, y) ? 255 : 0;
  }
  return pixels;
}

test("LED path follows an L-shaped product instead of its image bounds", () => {
  const pixels = mask(12, 12, (x, y) => x >= 2 && x <= 8 && y >= 2 && y <= 8 && (y <= 4 || x <= 4));
  const outline = traceProductOutline(pixels, 12, 12);
  assert.ok(outline);
  assert.match(outline.path, /L5\.0,5\.0/);
  assert.match(outline.path, / Z$/);
  assert.equal(outline.width, 12);
  assert.equal(outline.height, 12);
});

test("interior alpha holes do not create extra LED loops", () => {
  const pixels = mask(12, 12, (x, y) => x >= 2 && x <= 9 && y >= 2 && y <= 9 && !(x >= 4 && x <= 6 && y >= 4 && y <= 6));
  const outline = traceProductOutline(pixels, 12, 12);
  assert.ok(outline);
  assert.equal(outline.path.split("M").length - 1, 1);
});

test("two separate product silhouettes both receive an outline", () => {
  const pixels = mask(30, 15, (x, y) => y >= 2 && y <= 12 && ((x >= 2 && x <= 8) || (x >= 18 && x <= 24)));
  const outline = traceProductOutline(pixels, 30, 15);
  assert.ok(outline);
  assert.equal(outline.path.split("M").length - 1, 2);
});

test("opaque, empty and malformed images never receive a rectangular LED frame", () => {
  assert.equal(traceProductOutline(mask(10, 10, () => true), 10, 10), null);
  assert.equal(traceProductOutline(mask(10, 10, () => false), 10, 10), null);
  assert.equal(traceProductOutline(new Uint8ClampedArray(2), 10, 10), null);
});
