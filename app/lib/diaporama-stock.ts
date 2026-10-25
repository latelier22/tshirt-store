/** Unknown or invalid stock must never make a product available. */
export function getStockAvailable(stock: unknown): number {
  if (Array.isArray(stock)) {
    return stock.reduce((total, row) => {
      const value = row && typeof row === "object" ? row.stock_available : undefined;
      return total + getStockAvailable(value);
    }, 0);
  }

  if (typeof stock !== "number" && typeof stock !== "string" && typeof stock !== "boolean") {
    return 0;
  }
  const quantity = Number(stock);
  return Number.isFinite(quantity) ? quantity : 0;
}

export function isDiaporamaProductAvailable(product: {
  stock_available?: unknown;
  product_display_www?: unknown;
}) {
  const visible = product.product_display_www;
  return getStockAvailable(product.stock_available) > 0 &&
    (visible === true || visible === 1 || visible === "1");
}

export function getDiaporamaDay(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(now);
}

/** Keep today's previously available products, marking those no longer available. */
export function mergeDailyProducts<T extends { product_id: number }>(
  previous: T[], current: T[]
): (T & { salePending: boolean })[] {
  const available = new Map(current.map(product => [product.product_id, product]));
  const remembered = new Map(previous.map(product => [product.product_id, product]));
  for (const product of current) remembered.set(product.product_id, product);
  return [...remembered.values()].map(product => ({
    ...product, salePending: !available.has(product.product_id),
  }));
}
