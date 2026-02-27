"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo } from "react";

import { HiboutikProduct } from "@/app/types/ProductType";
import { useProductFilters } from "@/app/stores/productFilters";
import ProductFilters from "@/components/ProductFilters";

import ProductUpdatesListener from "@/components/ProductUpdatesListener";


 
 


type Props = { products: HiboutikProduct[] };

function hasAnyImage(p: HiboutikProduct): boolean {
  return !!(p.image || p.thumb || (Array.isArray(p.images) && p.images.length > 0));
}

function isInStock(p: HiboutikProduct): boolean {
  const anyP: any = p;
  if (anyP.stock_available_global === 1 || anyP.stock_available_global === true) return true;

  const v = anyP.stock_available;
  if (Array.isArray(v)) return v.some((e: any) => e?.stock_available === 1 || e?.stock_available === true);
  return v === 1 || v === true;
}

function norm(s: any) {
  return String(s ?? "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function matches(p: HiboutikProduct, q: string) {
  if (!q) return false;
  const qq = norm(q.trim());
  if (!qq) return false;

  const id = String(p.product_id ?? "");
  const name = norm((p as any).product_model ?? (p as any).name ?? "");
  const ean = norm((p as any).product_barcode ?? (p as any).barcode ?? "");
  return id.includes(qq) || name.includes(qq) || ean.includes(qq);
}

function Card({ p }: { p: HiboutikProduct }) {
  return (
    <Link
      key={p.product_id}
      href={`/produits/${p.product_id}`}
      className="border rounded-lg p-4 hover:shadow-lg transition"
    >
      {p.image && (
        <div className="relative w-full h-48 mb-3">
          <Image src={p.image} alt={p.product_model ?? ""} fill className="object-contain" />
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
}

export default function PageClient({ products }: Props) {
  const hideOutOfStock = useProductFilters((s) => s.hideOutOfStock);
  const hideNoImage = useProductFilters((s) => s.hideNoImage);
  const query = useProductFilters((s) => s.query);

  // 1) base filtered (rupture / image)
  const base = useMemo(() => {
    return products.filter((p) => {
      if (hideNoImage && !hasAnyImage(p)) return false;
      if (hideOutOfStock && !isInStock(p)) return false;
      return true;
    });
  }, [products, hideNoImage, hideOutOfStock]);

  // 2) matches
  const matched = useMemo(() => {
    if (!query.trim()) return [];
    return base.filter((p) => matches(p, query));
  }, [base, query]);

  // 3) all others (exclude matches to avoid duplicates)
  const matchedIds = useMemo(() => new Set(matched.map((p) => p.product_id)), [matched]);
  const others = useMemo(() => base.filter((p) => !matchedIds.has(p.product_id)), [base, matchedIds]);

  if (!products.length) {
    return (
      <div className="mx-auto max-w-5xl p-6">
        <p>Aucun produit dans cette catégorie.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6">
         {/* <ProductUpdatesListener /> */}
      <ProductFilters total={products.length} shown={base.length} matched={matched.length} />

      {query.trim() && (
        <section className="mb-8">
          <h2 className="text-sm font-semibold mb-3">
            Résultats pour “{query}” ({matched.length})
          </h2>

          {matched.length === 0 ? (
            <div className="opacity-70">Aucun match.</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {matched.map((p) => (
                <Card key={p.product_id} p={p} />
              ))}
            </div>
          )}
        </section>
      )}

      <section>
        <h2 className="text-sm font-semibold mb-3">
          {query.trim() ? "Tous les autres produits" : "Tous les produits"}
        </h2>

        {others.length === 0 ? (
          <div className="opacity-70">Aucun produit à afficher.</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {others.map((p) => (
              <Card key={p.product_id} p={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}