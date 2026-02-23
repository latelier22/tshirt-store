"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo } from "react";

import { HiboutikProduct } from "@/app/types/ProductType";
import { useProductFilters } from "@/app/stores/productFilters";
import ProductFilters from "@/components/ProductFilters";

type Props = {
  products: HiboutikProduct[];
};

function hasAnyImage(p: HiboutikProduct): boolean {
  if (p.image) return true;
  if (p.thumb) return true;
  if (Array.isArray(p.images) && p.images.length > 0) return true;
  return false;
}

function isInStock(p: HiboutikProduct): boolean {
  // Compatible avec ton type "detail" + ton type "grid"
  const anyP: any = p;

  if (anyP.stock_available_global === 1 || anyP.stock_available_global === true) return true;

  const v = anyP.stock_available;
  if (Array.isArray(v)) {
    return v.some((e: any) => e?.stock_available === 1 || e?.stock_available === true);
  }
  return v === 1 || v === true;
}

export default function PageClient({ products }: Props) {
  const hideOutOfStock = useProductFilters((s) => s.hideOutOfStock);
  const hideNoImage = useProductFilters((s) => s.hideNoImage);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (hideNoImage && !hasAnyImage(p)) return false;
      if (hideOutOfStock && !isInStock(p)) return false;
      return true;
    });
  }, [products, hideNoImage, hideOutOfStock]);

  if (!products.length) {
    return (
      <div className="mx-auto max-w-5xl p-6">
        <p>Aucun produit dans cette catégorie.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6">
      <ProductFilters total={products.length} shown={filtered.length} />

      {filtered.length === 0 ? (
        <div className="py-10 opacity-80">
          Aucun produit avec les filtres actuels.
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {filtered.map((p) => (
            <Link
              key={p.product_id}
              href={`/produits/${p.product_id}`}
              className="border rounded-lg p-4 hover:shadow-lg transition"
            >
              {p.image && (
                <div className="relative w-full h-48 mb-3">
                  <Image
                    src={p.image}
                    alt={p.product_model ?? ""}
                    fill
                    className="object-contain"
                  />
                </div>
              )}

              <h3 className="text-sm font-semibold">{p.product_model}</h3>

              <p className="mt-2 font-bold text-lg">{p.product_price} €</p>

              {isInStock(p) ? (
                <p className="text-green-600 text-sm">En stock</p>
              ) : (
                <p className="text-red-500 text-sm">Rupture</p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}