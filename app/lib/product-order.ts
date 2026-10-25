type DatedProduct = {
  product_id: number;
  updated_at?: string;
  updatedAt?: string;
  created_at?: string;
  createdAt?: string;
};

function productTimestamp(product: DatedProduct): number {
  for (const value of [product.updated_at, product.updatedAt, product.created_at, product.createdAt]) {
    if (!value) continue;
    let normalized = value.trim().replace(" ", "T");
    // Naive API dates must sort identically on the server and in every browser.
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?$/.test(normalized)) normalized += "Z";
    const timestamp = Date.parse(normalized);
    if (Number.isFinite(timestamp)) return timestamp;
  }
  return 0;
}

export function sortProductsByRecency<T extends DatedProduct>(products: T[]): T[] {
  return [...products].sort((a, b) => productTimestamp(b) - productTimestamp(a) || b.product_id - a.product_id);
}

/** Detect edits as well as stock changes without refreshing an unchanged screen. */
export function getProductsRevision(products: DatedProduct[]): string {
  return [...products].sort((a, b) => a.product_id - b.product_id)
    .map(product => `${product.product_id}:${productTimestamp(product)}`).join(",");
}
