import { test } from "node:test";
import { strict as assert } from "node:assert";
import { selectProductsByTag } from "../app/lib/products-by-tag";
import { isDiaporamaProductAvailable } from "../app/lib/diaporama-stock";

test("eligible products beyond the first 100 tag matches are included", () => {
  const catalogue = Array.from({ length: 106 }, (_, index) => ({
    product_id: index + 1, tags_slug: ["vitrine-droite"],
    stock_available: index < 3 || index >= 100 ? 1 : 0,
    product_display_www: true,
  }));
  assert.equal(selectProductsByTag(catalogue.slice(0, 100), "vitrine-droite").filter(isDiaporamaProductAvailable).length, 3);
  assert.equal(selectProductsByTag(catalogue, "vitrine-droite").filter(isDiaporamaProductAvailable).length, 9);
});

test("only the exact screen tag is matched", () => {
  const catalogue = [
    { product_id: 1, tags_slug: ["vitrine-droite"] },
    { product_id: 2, tags_slug: ["vitrine-droite-annexe"] },
    { product_id: 3, tags_slug: ["vitrine-gauche"] },
    { product_id: 4 },
  ];
  assert.deepEqual(selectProductsByTag(catalogue, "vitrine-droite").map(p => p.product_id), [1]);
});
