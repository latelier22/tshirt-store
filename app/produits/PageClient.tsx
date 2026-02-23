"use client";

import Link from "next/link";
import Image from "next/image";
import { HiboutikProduct } from "../types/ProductType";
import { formatPrice } from "../lib/utils";



export default function PageClient({ products }: { products: HiboutikProduct[] }) {
  return (
    <main className="mx-auto max-w-7xl mt-32 mb-96 p-6">
      <h1 className="text-2xl font-semibold mb-4">Nos produits</h1>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {products.map((p) => {
          const hasPromo =
            (p.product_discount_price ?? "0") !== "0" &&
            Number(p.product_discount_price) > 0;

          const finalPrice = hasPromo ? p.product_discount_price : p.product_price;
          const img = p.image || p.thumb;

          return (
            <Link
              key={p.product_id}
              href={`/produits/${p.product_id}`}
              className="group block border rounded-2xl p-4 hover:shadow-lg transition-shadow"
            >
              <div className="aspect-[4/3] rounded-xl mb-3 relative overflow-hidden bg-gray-100">
                {img ? (
                  <Image
                    src={img}
                    alt={p.product_model ?? "Produit"}
                    fill
                    sizes="
                      (max-width: 640px) 50vw,
                      (max-width: 1024px) 33vw,
                      (max-width: 1280px) 25vw,
                      20vw
                    "
                    // ⚠️ blurDataURL doit être une data URL base64 normalement.
                    // Donc on évite d’activer blur avec une URL HTTP (sinon comportement bizarre / requêtes en plus)
                    placeholder="empty"
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="opacity-40 text-sm">Image</span>
                  </div>
                )}
              </div>

              <h2 className="text-sm font-medium line-clamp-2 min-h-12">
                {p.product_model || "(Sans nom)"}
              </h2>

              <div className="mt-2 flex items-baseline gap-2">
                <div className="text-lg font-semibold">{formatPrice(finalPrice)}</div>
                {hasPromo && (
                  <div className="text-sm line-through opacity-60">
                    {formatPrice(p.product_price)}
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </main>
  );
}