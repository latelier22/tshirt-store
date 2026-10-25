import { test } from "node:test";
import { strict as assert } from "node:assert";
import {
  getStockAvailable, isDiaporamaProductAvailable, getDiaporamaDay, mergeDailyProducts,
} from "../app/lib/diaporama-stock";

test("a sold product is excluded even when it is still published online", () => {
  for (const stock of [0, "0", false, -1, [], [{ stock_available: 0 }]]) {
    assert.equal(isDiaporamaProductAvailable({
      stock_available: stock, product_display_www: true,
    }), false);
  }
});

test("positive stock supports cache quantities and Hiboutik warehouse rows", () => {
  for (const stock of [1, 5, "2", true, [{ stock_available: 0 }, { stock_available: 2 }]]) {
    for (const visible of [true, 1, "1"]) {
      assert.equal(isDiaporamaProductAvailable({
        stock_available: stock, product_display_www: visible,
      }), true);
    }
  }
});

test("invalid or missing stock never counts as available", () => {
  for (const stock of [undefined, null, "invalid", NaN, Infinity, {}, [{}]]) {
    assert.equal(getStockAvailable(stock), 0);
  }
});

test("unpublished products remain excluded even with positive stock", () => {
  for (const visible of [false, 0, "0", undefined]) {
    assert.equal(isDiaporamaProductAvailable({
      stock_available: 1, product_display_www: visible,
    }), false);
  }
});

test("a sale removes the product from the next eligible list", () => {
  const products = [
    { product_id: 18, stock_available: 1, product_display_www: true },
    { product_id: 19, stock_available: 2, product_display_www: true },
  ];
  assert.deepEqual(products.filter(isDiaporamaProductAvailable).map(p => p.product_id), [18, 19]);
  products[0].stock_available = 0;
  assert.deepEqual(products.filter(isDiaporamaProductAvailable).map(p => p.product_id), [19]);
});

test("a product sold today stays visible with a pending-sale flag, including after reload", () => {
  const previous = [{ product_id: 18 }, { product_id: 19 }];
  const available = [{ product_id: 19 }];
  const daily = mergeDailyProducts(previous, available);
  assert.deepEqual(daily, [
    { product_id: 18, salePending: true },
    { product_id: 19, salePending: false },
  ]);
  const saved = JSON.parse(JSON.stringify(daily));
  assert.deepEqual(mergeDailyProducts(saved, available), daily);
});

test("a new daily snapshot excludes yesterday's sold products", () => {
  assert.deepEqual(mergeDailyProducts([], [{ product_id: 19 }]), [
    { product_id: 19, salePending: false },
  ]);
});

test("restocking removes the pending-sale flag and new arrivals join the display", () => {
  assert.deepEqual(mergeDailyProducts(
    [{ product_id: 18, salePending: true }],
    [{ product_id: 18, salePending: false }, { product_id: 20, salePending: false }]
  ), [
    { product_id: 18, salePending: false },
    { product_id: 20, salePending: false },
  ]);
});

test("the daily cutoff follows midnight in Paris, in summer and winter", () => {
  assert.equal(getDiaporamaDay(new Date("2026-07-01T21:59:59Z")), "2026-07-01");
  assert.equal(getDiaporamaDay(new Date("2026-07-01T22:00:00Z")), "2026-07-02");
  assert.equal(getDiaporamaDay(new Date("2026-12-01T22:59:59Z")), "2026-12-01");
  assert.equal(getDiaporamaDay(new Date("2026-12-01T23:00:00Z")), "2026-12-02");
});
