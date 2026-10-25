import { test } from "node:test";
import { strict as assert } from "node:assert";
import { sortProductsByRecency, getProductsRevision } from "../app/lib/product-order";
import { mergeDailyProducts } from "../app/lib/diaporama-stock";

test("a recently edited older product comes before a newer product ID", () => {
  const products = [
    { product_id: 2009, updated_at: "2026-10-23 09:00:00" },
    { product_id: 1944, updated_at: "2026-10-25 20:19:53" },
  ];
  assert.deepEqual(sortProductsByRecency(products).map(p => p.product_id), [1944, 2009]);
  assert.equal(products[0].product_id, 2009);
});

test("date aliases, creation dates and ties produce a deterministic newest-first order", () => {
  const products = [
    { product_id: 1, updatedAt: "2026-10-25T18:00:00Z" },
    { product_id: 2, created_at: "2026-10-25 19:00:00" },
    { product_id: 3, updated_at: "invalid", createdAt: "2026-10-25T19:00:00Z" },
    { product_id: 4 },
  ];
  assert.deepEqual(sortProductsByRecency(products).map(p => p.product_id), [3, 2, 1, 4]);
});

test("daily browser storage cannot keep an older order or hide a new arrival", () => {
  const previous = [{ product_id: 1, updated_at: "2026-10-20 10:00:00" }];
  const current = [{ product_id: 2, updated_at: "2026-10-25 20:00:00" }];
  const sorted = sortProductsByRecency(mergeDailyProducts(previous, current));
  assert.deepEqual(sorted.map(p => p.product_id), [2, 1]);
  assert.equal(sorted[1].salePending, true);
});

test("polling detects an edit even when the product IDs have not changed", () => {
  const before = [{ product_id: 1944, updated_at: "2026-10-25 19:00:00" }];
  const after = [{ product_id: 1944, updated_at: "2026-10-25 20:00:00" }];
  assert.notEqual(getProductsRevision(before), getProductsRevision(after));
  const other = { product_id: 2009, updated_at: "2026-10-24 10:00:00" };
  assert.equal(getProductsRevision([...before, other]), getProductsRevision([other, ...before]));
});
