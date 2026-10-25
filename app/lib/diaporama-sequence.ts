export type AlternatingStep<P, M> =
  | { type: "product"; key: string; product: P }
  | { type: "message"; key: string; message: M };

/** One message before every product; rotate messages across boards without starvation. */
export function buildAlternatingSequence<P extends { product_id: number }, M extends { id: number; sortOrder: number | null }>(
  products: P[], messages: M[], messageOffset = 0
): AlternatingStep<P, M>[] {
  const sorted = [...messages].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.id - b.id);
  const steps: AlternatingStep<P, M>[] = [];
  products.forEach((product, index) => {
    if (sorted.length) {
      const message = sorted[(messageOffset + index) % sorted.length];
      steps.push({ type: "message", key: `message-${message.id}-${index}`, message });
    }
    steps.push({ type: "product", key: `product-${product.product_id}-${index}`, product });
  });
  return steps;
}
