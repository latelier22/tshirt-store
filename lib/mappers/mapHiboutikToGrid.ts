export type GridItem = {
  id: number;
  name: string;
  priceCents: number;
  thumb: string | null;
  image: string | null;
  href: string; // lien vers la fiche
  inStock?: boolean;
};

type HibProduct = {
  product_id: number;
  product_model: string;
  product_price: string; // "89.00"
  thumb?: string;
  image?: string;
  images?: string[];
  stock_available?: number;
};

export function mapHiboutikToGrid(p: HibProduct): GridItem {
  const price = Number(p.product_price || "0");
  const thumb = p.thumb || p.images?.[0] || null;
  const image = p.image || p.images?.[0] || null;

  return {
    id: p.product_id,
    name: p.product_model,
    priceCents: Math.round(price * 100),
    thumb,
    image,
    href: `/produits/${p.product_id}`,
    inStock: typeof p.stock_available === "number" ? p.stock_available > 0 : undefined,
  };
}