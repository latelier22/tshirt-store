import { test } from "node:test";
import { strict as assert } from "node:assert";
import {
  ASSET_ORIGIN, parsePreparedManifest, resolveProductImage, isManifestStale, imagePlanKey,
  imageCandidateAfterFailure, normalizeProductId, preparedImageUrl, validSlot,
} from "../app/lib/diaporama-assets";
import { selectProductsByTag } from "../app/lib/products-by-tag";
import { isDiaporamaProductAvailable } from "../app/lib/diaporama-stock";

const revision = "a".repeat(64);
const asset = (name: string) => `${ASSET_ORIGIN}/diaporama-assets/1944/${revision}/${name}.webp`;
const product = { product_id: 1944, image: "/api/hiboutik/image?src=original" };
function entry(overrides: Record<string, unknown> = {}) {
  return { product_id: "1944", slots: ["vitrine-droite"], revision,
    status: "ready", effects_ready: true, has_transparency: true, cutout_applied: true,
    board_url: asset("board"), individual_url: asset("individual"),
    fallback_board_url: asset("fallback_board"), fallback_individual_url: asset("fallback_individual"),
    neon_board_url: asset("neon_board"), neon_individual_url: asset("neon_individual"),
    source_url: "https://must-not-be-downloaded.invalid/private", dimensions: { board: { width: 480, height: 480, bytes: 10000 } }, ...overrides };
}
function manifest(products: unknown[] = [entry()], overrides: Record<string, unknown> = {}) {
  return { schema_version: 1, slot: "vitrine-droite", generated_at: "2026-10-26T12:00:00Z",
    catalog_checked_at: "2026-10-26T12:00:00Z", catalog_stale_after_seconds: 1800, products, ...overrides };
}
function parsed(overrides: Record<string, unknown> = {}) {
  return parsePreparedManifest(manifest([entry(overrides)]), "vitrine-droite")!.products[0];
}

test("validated images choose board, baked active halo and an individual without neon", () => {
  const e = parsed();
  assert.equal(resolveProductImage(product, e, "board").candidates[0].url, asset("board"));
  const active = resolveProductImage(product, e, "active");
  assert.equal(active.candidates[0].url, asset("neon_board"));
  assert.equal(active.effects, true);
  assert.deepEqual(active.candidates[1].dimensions, { width: 480, height: 480, bytes: 10000 });
  const individual = resolveProductImage(product, e, "individual");
  assert.equal(individual.candidates[0].url, asset("individual"));
  assert.equal(individual.effects, false);
  assert.ok(!JSON.stringify(individual).includes("neon_individual"));
});

test("unapproved images never enable silhouette effects, even if the neon file exists", () => {
  for (const override of [{ effects_ready: false }, { status: "fallback" }, { status: "needs_review" }, { has_transparency: false }, { cutout_applied: false }]) {
    const plan = resolveProductImage(product, parsed(override), "active");
    assert.equal(plan.effects, false);
    assert.equal(plan.candidates[0].url, asset("board"));
  }
});

test("individual neon is enabled explicitly only for an approved transparent cutout", () => {
  const plan = resolveProductImage(product, parsed(), "individual-neon");
  assert.equal(plan.effects, true);
  assert.equal(plan.candidates[0].url, asset("neon_individual"));
  assert.equal(plan.candidates[1].url, asset("individual"));
  assert.equal(plan.candidates[2].url, asset("fallback_individual"));
  for (const override of [{ effects_ready: false }, { status: "fallback" }, { has_transparency: false }, { cutout_applied: false }, { neon_individual_url: null }]) {
    assert.equal(resolveProductImage(product, parsed(override), "individual-neon").effects, false);
  }
});

test("missing or mismatched entries preserve the ordinary photo and normalize numeric IDs", () => {
  assert.equal(normalizeProductId("1944"), 1944);
  assert.equal(normalizeProductId(true), null);
  assert.equal(resolveProductImage({ ...product, product_id: "1944" }, parsed(), "board").candidates[0].prepared, true);
  assert.deepEqual(resolveProductImage(product, undefined, "board").candidates, [{ url: product.image, prepared: false }]);
  assert.equal(resolveProductImage({ ...product, product_id: 20 }, parsed(), "board").candidates[0].url, product.image);
});

test("invalid entries are isolated; only HTTPS on the exact image host is allowed", () => {
  const result = parsePreparedManifest(manifest([entry(), entry({ product_id: 2, board_url: "http://evil.test/a.webp" })]), "vitrine-droite");
  assert.equal(result!.products.length, 1);
  for (const url of ["http://boutique.multimedia-services.fr/diaporama-assets/a.webp", "https://boutique.multimedia-services.fr.evil.test/diaporama-assets/a.webp", "https://user:password@boutique.multimedia-services.fr/diaporama-assets/a.webp", "https://boutique.multimedia-services.fr/private/a.webp"]) {
    assert.equal(preparedImageUrl(url), null);
  }
  for (const slot of ["../private", "vitrine/droite", "vitrine-droite?x=1", ""]) assert.equal(validSlot(slot), false);
  assert.equal(parsePreparedManifest(manifest([], { schema_version: 2 }), "vitrine-droite"), null);
  assert.equal(parsePreparedManifest(manifest([], { slot: "vitrine-gauche" }), "vitrine-droite"), null);
  assert.equal(parsePreparedManifest(manifest([], { catalog_checked_at: "invalid" }), "vitrine-droite"), null);
});

test("stale manifests remain usable only as image metadata and never expose the source URL", () => {
  const result = parsePreparedManifest(manifest(), "vitrine-droite")!;
  assert.equal(isManifestStale(result, Date.parse("2026-10-26T13:00:00Z")), true);
  assert.equal(isManifestStale(result, Date.parse("2026-10-26T12:01:00Z")), false);
  assert.equal(resolveProductImage(product, result.products[0], "board").candidates[0].url, asset("board"));
  assert.ok(!JSON.stringify(result).includes("must-not-be-downloaded"));
});

test("failure advances through each distinct fallback, stops after the ordinary photo, and does not loop", () => {
  const e = parsed({ board_url: asset("failure_board"), fallback_board_url: asset("failure_fallback") });
  const p = { product_id: 1944, image: "/ordinary-failure.jpg" };
  const plan = resolveProductImage(p, e, "board");
  assert.equal(imageCandidateAfterFailure(plan, plan.candidates[0].url)!.url, asset("failure_fallback"));
  assert.equal(imageCandidateAfterFailure(plan, asset("failure_fallback"))!.url, p.image);
  assert.equal(imageCandidateAfterFailure(plan, p.image), undefined);
  const duplicate = resolveProductImage(product, parsed({ fallback_board_url: asset("board") }), "board");
  assert.equal(duplicate.candidates.length, 2);
});

test("image identity follows versioned URLs, not a metadata-only revision change", () => {
  const old = resolveProductImage(product, parsed(), "board");
  const same = resolveProductImage(product, parsed({ revision: "b".repeat(64) }), "board");
  const changed = resolveProductImage(product, parsed({ board_url: asset("new_board") }), "board");
  assert.equal(imagePlanKey(old), imagePlanKey(same));
  assert.notEqual(imagePlanKey(old), imagePlanKey(changed));
});

test("joining image metadata does not add sold, unpublished or wrongly tagged products", () => {
  const commercial = [
    { ...product, stock_available: 1, product_display_www: true, tags_slug: ["vitrine-droite"] },
    { ...product, product_id: 2, stock_available: 0, product_display_www: true, tags_slug: ["vitrine-droite"] },
    { ...product, product_id: 3, stock_available: 1, product_display_www: false, tags_slug: ["vitrine-droite"] },
    { ...product, product_id: 4, stock_available: 1, product_display_www: true, tags_slug: ["vitrine-gauche"] },
  ];
  const selected = selectProductsByTag(commercial, "vitrine-droite").filter(isDiaporamaProductAvailable);
  const entries = parsePreparedManifest(manifest([entry(), entry({ product_id: 2 }), entry({ product_id: 3 }), entry({ product_id: 4 })]), "vitrine-droite")!.products;
  const joined = selected.map(p => ({ id: p.product_id, plan: resolveProductImage(p, entries.find(e => e.product_id === p.product_id), "board") }));
  assert.deepEqual(joined.map(p => p.id), [1944]);
});
