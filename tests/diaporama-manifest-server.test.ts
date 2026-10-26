import { test } from "node:test";
import { strict as assert } from "node:assert";
import { getSlotManifest } from "../app/lib/diaporama-manifest-server";

const body = (slot: string) => ({ schema_version: 1, slot, generated_at: "2026-10-26T12:00:00Z",
  catalog_checked_at: "2026-10-26T12:00:00Z", catalog_stale_after_seconds: 1800, products: [] });

test("manifest requests are deduplicated and cached for 30 seconds", async () => {
  const original = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async input => {
    calls++; assert.equal(String(input), "https://boutique.multimedia-services.fr/diaporama-assets/slots/test-cache/manifest.json");
    return Response.json(body("test-cache"));
  };
  try {
    const [a, b] = await Promise.all([getSlotManifest("test-cache"), getSlotManifest("test-cache")]);
    assert.equal(a, b); assert.ok(a);
    await getSlotManifest("test-cache"); assert.equal(calls, 1);
  } finally { globalThis.fetch = original; }
});

test("a failed refresh retains the previous valid image manifest", async () => {
  const original = globalThis.fetch, originalNow = Date.now;
  let now = originalNow(), calls = 0;
  Date.now = () => now;
  globalThis.fetch = async () => ++calls === 1 ? Response.json(body("test-retain")) : new Response("outage", { status: 503 });
  try {
    const first = await getSlotManifest("test-retain");
    now += 31000;
    assert.equal(await getSlotManifest("test-retain"), first);
    assert.equal(calls, 2);
  } finally { globalThis.fetch = original; Date.now = originalNow; }
});

test("invalid slots and invalid first manifests fall back without producing products", async () => {
  const original = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => { calls++; return Response.json({ schema_version: 2, products: [] }); };
  try {
    assert.equal(await getSlotManifest("../bad"), null); assert.equal(calls, 0);
    assert.equal(await getSlotManifest("test-invalid"), null); assert.equal(calls, 1);
  } finally { globalThis.fetch = original; }
});
