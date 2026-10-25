/** Filter the complete catalogue; the legacy productsByTag endpoint truncates at 100. */
export function selectProductsByTag<T extends { tags_slug?: unknown }>(products: T[], tag: string): T[] {
  return products.filter(product => Array.isArray(product.tags_slug) && product.tags_slug.includes(tag));
}
