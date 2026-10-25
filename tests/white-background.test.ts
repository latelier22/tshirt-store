import { test } from "node:test";
import { strict as assert } from "node:assert";
import { removeWhiteBackground } from "../app/lib/white-background";

function image(width: number, height: number, color = [255, 255, 255, 255]) {
  const pixels = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < pixels.length; i += 4) pixels.set(color, i);
  return pixels;
}
function setPixel(pixels: Uint8ClampedArray, width: number, x: number, y: number, color: number[]) {
  pixels.set(color, (y * width + x) * 4);
}
function alpha(pixels: Uint8ClampedArray, width: number, x: number, y: number) {
  return pixels[(y * width + x) * 4 + 3];
}

test("white exterior becomes transparent while enclosed device whites survive", () => {
  const pixels = image(7, 7);
  for (let y = 1; y <= 5; y++) for (let x = 1; x <= 5; x++) {
    if (x === 1 || x === 5 || y === 1 || y === 5) setPixel(pixels, 7, x, y, [30, 30, 30, 255]);
  }
  assert.equal(removeWhiteBackground(pixels, 7, 7), 24);
  assert.equal(alpha(pixels, 7, 0, 0), 0);
  assert.equal(alpha(pixels, 7, 3, 0), 0);
  assert.equal(alpha(pixels, 7, 3, 3), 255);
  assert.equal(alpha(pixels, 7, 1, 3), 255);
});

test("coloured or dark backgrounds are left untouched", () => {
  for (const color of [[200, 210, 220, 255], [255, 245, 190, 255], [20, 30, 40, 255]]) {
    const pixels = image(4, 4, color);
    const before = pixels.slice();
    assert.equal(removeWhiteBackground(pixels, 4, 4), 0);
    assert.deepEqual(pixels, before);
  }
});

test("near-white JPEG background is removed and the edge is softened", () => {
  const pixels = image(5, 5, [248, 247, 246, 255]);
  setPixel(pixels, 5, 2, 2, [20, 20, 20, 255]);
  setPixel(pixels, 5, 2, 1, [220, 220, 220, 255]);
  removeWhiteBackground(pixels, 5, 5);
  assert.equal(alpha(pixels, 5, 0, 0), 0);
  assert.equal(alpha(pixels, 5, 2, 2), 255);
  assert.ok(alpha(pixels, 5, 2, 1) > 0 && alpha(pixels, 5, 2, 1) < 255);
});

test("existing transparency and malformed image data do not fail", () => {
  const pixels = image(3, 3, [0, 0, 0, 0]);
  setPixel(pixels, 3, 1, 1, [255, 0, 0, 128]);
  removeWhiteBackground(pixels, 3, 3);
  assert.equal(alpha(pixels, 3, 1, 1), 128);
  assert.equal(removeWhiteBackground(new Uint8ClampedArray(3), 2, 2), 0);
});
