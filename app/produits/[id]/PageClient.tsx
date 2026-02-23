"use client";

import ProductGallery from "@/components/ProductGallery";
import CheckoutButton from "@/components/CheckoutButton";

import { HiboutikProduct , StockEntry} from "@/app/types/ProductType";
import { formatPrice } from "@/app/lib/utils";



function isInStock(p: HiboutikProduct): boolean {
  if (p.stock_available_global === 1 || p.stock_available_global === true) return true;
  return Array.isArray(p.stock_available)
    ? p.stock_available.some((e) => e?.stock_available === 1 || e?.stock_available === true)
    : false;
}

export default  function ProduitPage({ product }: { product: HiboutikProduct }) {
  

  const hasPromo = (product.product_discount_price ?? "0") !== "0" && Number(product.product_discount_price) > 0;
  const priceStr = hasPromo ? product.product_discount_price : product.product_price;
  const finalPrice = priceStr ?? "0";
  const priceCents = Math.max(0, Math.round(Number(finalPrice) * 100));
  const enStock = isInStock(product);

  // Images pour la galerie (sans miniatures si une seule image — géré dans le composant)
  const images: string[] = Array.from(new Set([product.image, ...(product.images ?? []), product.thumb].filter(Boolean) as string[]));

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
            {hasPromo && <div className="text-base line-through opacity-60">{formatPrice(product.product_price)}</div>}
          </div>

          <div className="mt-3">
            <span className={enStock ? "text-xs px-2 py-1 rounded-full bg-green-100 text-green-700" : "text-xs px-2 py-1 rounded-full bg-gray-200 text-gray-700"}>
              {enStock ? "En stock" : "Rupture"}
            </span>
          </div>

          {/* {product.product_barcode && <p className="mt-2 text-sm opacity-70">EAN : {product.product_barcode}</p>} */}
          {product.product_desc && product.product_desc.trim() !== "" && <p className="mt-4 whitespace-pre-wrap">{product.product_desc}</p>}

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
