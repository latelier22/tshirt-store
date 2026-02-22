// app/produits/[id]/page.tsx
import { myFetch } from "@/lib/myFetch";
import PageClient from "./PageClient";

export const dynamic = "force-dynamic";

type StockEntry = { stock_available?: 0 | 1 | boolean; [k: string]: any };

export type HiboutikProduct = {
  product_id: number;
  product_model?: string;
  product_price?: string;
  product_discount_price?: string;
  product_desc?: string;
  product_barcode?: string;

  stock_available_global?: 0 | 1 | boolean;
  stock_available?: StockEntry[];

  images?: string[];
  thumb?: string;
  image?: string;
};

function isInStock(p: HiboutikProduct): boolean {
  if (p.stock_available_global === 1 || p.stock_available_global === true) return true;
  return Array.isArray(p.stock_available)
    ? p.stock_available.some((e) => e?.stock_available === 1 || e?.stock_available === true)
    : false;
}

function normalizeImages(p: HiboutikProduct): string[] {
  return Array.from(new Set([p.image, ...(p.images ?? []), p.thumb].filter(Boolean) as string[]));
}

export default async function ProduitPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // ✅ Next “sync dynamic APIs”: params est une Promise
  const { id } = await params;

  const product = await myFetch<HiboutikProduct | null>(`/api/hiboutik/products/${id}`, {
    cache: "no-store",
    softFail: true,
  });

  if (!product) {
    return (
      <main className="mx-auto max-w-3xl p-6">
        <h1 className="text-xl font-semibold">Produit introuvable</h1>
      </main>
    );
  }

  const hasPromo =
    (product.product_discount_price ?? "0") !== "0" &&
    Number(product.product_discount_price) > 0;

  const priceStr = hasPromo ? product.product_discount_price : product.product_price;
  const finalPrice = priceStr ?? "0";
  const priceCents = Math.max(0, Math.round(Number(finalPrice) * 100));
  const enStock = isInStock(product);
  const images = normalizeImages(product);

  return (
    <PageClient
      product={product}
      images={images}
      hasPromo={hasPromo}
      finalPrice={finalPrice}
      priceCents={priceCents}
      enStock={enStock}
    />
  );
}