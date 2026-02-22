// app/produits/[id]/PageClient.tsx
"use client";

import ProductGallery from "@/components/ProductGallery";
import CheckoutButton from "@/components/CheckoutButton";
import type { HiboutikProduct } from "./page";

function formatPrice(p?: string) {
  const n = Number(p ?? 0);
  return Number.isFinite(n) ? n.toFixed(2).replace(".", ",") + " €" : "—";
}

export default function PageClient(props: {
  product: HiboutikProduct;
  images: string[];
  hasPromo: boolean;
  finalPrice: string;
  priceCents: number;
  enStock: boolean;
}) {
  const { product, images, hasPromo, finalPrice, priceCents, enStock } = props;

  return (
    <main className="mx-auto max-w-5xl mt-28 p-6">
      <div className="grid md:grid-cols-2 gap-8">
        <ProductGallery images={images} />

        <div>
          <h1 className="text-2xl font-semibold">
            {product.product_model ?? "(Sans nom)"}{" "}
            <span className="text-sm opacity-60">#{product.product_id}</span>
          </h1>

          <div className="mt-3 flex items-baseline gap-3">
            <div className="text-2xl font-bold">{formatPrice(finalPrice)}</div>
            {hasPromo && (
              <div className="text-base line-through opacity-60">
                {formatPrice(product.product_price)}
              </div>
            )}
          </div>

          <div className="mt-3">
            <span
              className={
                enStock
                  ? "text-xs px-2 py-1 rounded-full bg-green-100 text-green-700"
                  : "text-xs px-2 py-1 rounded-full bg-gray-200 text-gray-700"
              }
            >
              {enStock ? "En stock" : "Rupture"}
            </span>
          </div>

          {product.product_desc && product.product_desc.trim() !== "" && (
            <p className="mt-4 whitespace-pre-wrap">{product.product_desc}</p>
          )}

          <div className="mt-6">
            <CheckoutButton
              name={product.product_model ?? `Produit ${product.product_id}`}
              priceCents={priceCents}
              image={images[0]}
              disabled={!enStock || priceCents <= 0}
            />
          </div>
        </div>
      </div>
    </main>
  );
}