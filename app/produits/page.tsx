"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";

type HiboutikProduct = {
  product_id: number;
  product_model?: string;
  product_price?: string;
  product_discount_price?: string;
  stock_available?: 0 | 1;
  product_barcode?: string;
  images?: string[];
  thumb?: string; // petite (mini) si dispo
  image?: string; // grande (big) si dispo
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
        const res = await fetch(
          "/api/hiboutik/products/grid?order_by=product_id&sort=ASC&from=0&to=99",
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
    <main className="mx-auto max-w-7xl mt-32 mb-96 p-6">
      <h1 className="text-2xl font-semibold mb-4">Nos produits</h1>

      {loading && <p>Chargement…</p>}
      {err && <p className="text-red-600">Erreur : {err}</p>}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {items.map((p) => {
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
              <div className="aspect-4/3 rounded-xl mb-3 relative overflow-hidden bg-gray-100">
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
                    placeholder={p.thumb ? "blur" : "empty"}
                    blurDataURL={p.thumb}
                    className="object-cover"
                    priority={false}
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

      {!loading && !err && items.length === 0 && (
        <p className="mt-6 opacity-70">Aucun produit à afficher.</p>
      )}
    </main>
  );
}
