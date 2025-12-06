"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type HiboutikProduct = {
  product_id: number;
  product_model?: string;
  product_price?: string;           // "249.00"
  product_discount_price?: string;  // "0.00"
  stock_available?: 0 | 1;
  product_barcode?: string;
};

function formatPrice(p?: string) {
  const n = Number(p ?? 0);
  return isNaN(n) ? "—" : n.toFixed(2).replace(".", ",") + " €";
}

export default function HiboutikGridPage() {
  const [items, setItems] = useState<HiboutikProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        // Le proxy force déjà product_display_www=1, mais on le met explicitement
        const res = await fetch(
          "/api/hiboutik/products?order_by=product_id&sort=ASC&from=0&to=99&product_display_www=1",
          { cache: "no-store" }
        );
        if (!res.ok) throw new Error(await res.text());
        const json = await res.json();
        setItems(Array.isArray(json) ? json : []);
      } catch (e: any) {
        setErr(e?.message ?? "Erreur inconnue");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <main className="mx-auto max-w-7xl p-6">
      <h1 className="text-2xl font-semibold mt-16 mb-4">Produits (display_www=1)</h1>

      {loading && <p>Chargement…</p>}
      {err && <p className="text-red-600">Erreur : {err}</p>}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {items.map((p) => {
          const hasPromo =
            (p.product_discount_price ?? "0") !== "0" &&
            Number(p.product_discount_price) > 0;
          const finalPrice = hasPromo ? p.product_discount_price : p.product_price;

          return (
            <Link
              key={p.product_id}
              href={`/produits/${p.product_id}`}
              className="group block border rounded-2xl p-4 hover:shadow-lg transition-shadow"
            >
              {/* Placeholder image / logo éventuel si tu en as un */}
              <div className="aspect-[4/3] bg-gray-100 rounded-xl mb-3 flex items-center justify-center">
                <span className="opacity-40 text-sm">Image</span>
              </div>

              <h2 className="text-sm font-medium line-clamp-2 min-h-[3rem]">
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

              <div className="mt-2 flex items-center justify-between">
                <span
                  className={
                    p.stock_available
                      ? "text-xs px-2 py-1 rounded-full bg-green-100 text-green-700"
                      : "text-xs px-2 py-1 rounded-full bg-gray-200 text-gray-700"
                  }
                >
                  {p.stock_available ? "En stock" : "Rupture"}
                </span>
                {p.product_barcode && (
                  <span className="text-[10px] opacity-60">
                    {p.product_barcode}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>

      {!loading && !err && items.length === 0 && (
        <p className="mt-6 opacity-70">Aucun produit à afficher.</p>
      )}
    </main>
  );
}
