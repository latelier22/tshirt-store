import { test } from "node:test";
import { strict as assert } from "node:assert";
import sharp from "sharp";
import { approvedOutlineImage, outlineFromPreparedBytes, getPreparedOutline } from "../app/lib/diaporama-outline-server";
import type { PreparedEntry } from "../app/lib/diaporama-assets";

const base = "https://boutique.multimedia-services.fr/diaporama-assets/351/" + "a".repeat(64);
const entry: PreparedEntry = {
  product_id: 351, slots: ["vitrine-droite"], revision: "a".repeat(64), status: "ready", effects_ready: true,
  has_transparency: true, cutout_applied: true, board_url: `${base}/board.webp`, individual_url: `${base}/individual.webp`,
  fallback_board_url: null, fallback_individual_url: null, neon_board_url: null, neon_individual_url: null, dimensions: {},
};
async function cutout() {
  const width = 32, height = 32;
  const data = Buffer.alloc(width * height * 4);
  for (let y = 5; y < 27; y++) for (let x = 9; x < 23; x++) {
    const offset = (y * width + x) * 4;
    data[offset] = 255; data[offset + 1] = 255; data[offset + 2] = 255; data[offset + 3] = 255;
  }
  return sharp(data, { raw: { width, height, channels: 4 } }).webp({ lossless: true }).toBuffer();
}

test("only approved transparent cutouts can supply an original SVG neon outline", () => {
  assert.equal(approvedOutlineImage(entry, "board"), entry.board_url);
  assert.equal(approvedOutlineImage(entry, "individual"), entry.individual_url);
  for (const update of [{ status: "fallback" as const }, { effects_ready: false }, { has_transparency: false }, { cutout_applied: false }, { individual_url: "https://evil.test/a.webp" }]) {
    assert.equal(approvedOutlineImage({ ...entry, ...update }, "individual"), null);
  }
});

test("server extracts a white device contour from alpha without deleting any white pixels", async () => {
  const outline = await outlineFromPreparedBytes(await cutout());
  assert.ok(outline);
  assert.equal(outline.width, 32); assert.equal(outline.height, 32);
  assert.match(outline.path, /^M/); assert.match(outline.path, / Z$/);
});

test("an opaque photograph never receives a rectangular contour", async () => {
  const bytes = await sharp({ create: { width: 32, height: 32, channels: 3, background: "white" } }).png().toBuffer();
  assert.equal(await outlineFromPreparedBytes(bytes), null);
});

test("a versioned cutout is fetched and analysed once, and arbitrary hosts are rejected", async () => {
  const original = globalThis.fetch;
  const bytes = await cutout();
  let calls = 0;
  globalThis.fetch = async () => { calls++; return new Response(new Uint8Array(bytes), { headers: { "Content-Type": "image/webp" } }); };
  try {
    assert.equal(await getPreparedOutline("https://evil.test/a.webp"), null);
    assert.equal(calls, 0);
    const [first, second] = await Promise.all([getPreparedOutline(entry.individual_url), getPreparedOutline(entry.individual_url)]);
    assert.ok(first); assert.equal(first, second);
    assert.equal(await getPreparedOutline(entry.individual_url), first);
    assert.equal(calls, 1);
  } finally { globalThis.fetch = original; }
});
