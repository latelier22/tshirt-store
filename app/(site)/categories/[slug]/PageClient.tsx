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
  return !!(p.image || p.thumb || (Array.isArray(p.images) && p.images.length > 0));
}

function isInStock(p: HiboutikProduct): boolean {
  const anyP: any = p;

  if (anyP.stock_available_global === 1 || anyP.stock_available_global === true) return true;

  const v = anyP.stock_available;
  if (Array.isArray(v)) {
    return v.some((e: any) => e?.stock_available === 1 || e?.stock_available === true);
  }
  return v === 1 || v === true;
}

function norm(s: any) {
  return String(s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function matchesQuery(p: HiboutikProduct, q: string) {
  const qq = norm(q.trim());
  if (!qq) return true; // pas de query => tout passe

  const id = String((p as any).product_id ?? "");
  const name = norm((p as any).product_model ?? (p as any).name ?? "");
  const ean = norm((p as any).product_barcode ?? (p as any).barcode ?? "");

  return id.includes(qq) || name.includes(qq) || ean.includes(qq);
}

export default function PageClient({ products }: Props) {
  const hideOutOfStock = useProductFilters((s) => s.hideOutOfStock);
  const hideNoImage = useProductFilters((s) => s.hideNoImage);
  const query = useProductFilters((s) => s.query);

  // 1) base filter (stock + image)
  const base = useMemo(() => {
    return (products ?? []).filter((p) => {
      if (hideNoImage && !hasAnyImage(p)) return false;
      if (hideOutOfStock && !isInStock(p)) return false;
      return true;
    });
  }, [products, hideNoImage, hideOutOfStock]);

  // 2) matched (recherche)
  const matched = useMemo(() => {
    if (!query.trim()) return [];
    return base.filter((p) => matchesQuery(p, query));
  }, [base, query]);

  // 3) liste affichée
  const shownList = useMemo(() => {
    if (!query.trim()) return base;
    return matched;
  }, [base, matched, query]);

  if (!products?.length) {
    return (
      <div className="mx-auto max-w-5xl p-6">
        <p>Aucun produit dans cette catégorie.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6">
      {/* ✅ maintenant le filtre marche vraiment */}
      <ProductFilters
        total={products.length}
        shown={shownList.length}
        matched={matched.length}
      />

      {shownList.length === 0 ? (
        <div className="py-10 opacity-80">Aucun produit avec les filtres actuels.</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {shownList.map((p: any) => {
            const img = String(p.image ?? "").trim();

            return (
              <Link
                key={p.product_id}
                href={`/produits/${p.product_id}`}
                className="border rounded-lg p-4 hover:shadow-lg transition bg-white"
              >
                {img ? (
                  <div className="relative w-full h-48 mb-3">
                    <Image src={img} alt={p.product_model ?? ""} fill className="object-contain" />
                  </div>
                ) : (
                  <div className="w-full h-48 mb-3 border rounded-lg flex items-center justify-center opacity-60">
                    (pas d’image)
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
            );
          })}
        </div>
      )}
    </div>
  );
}