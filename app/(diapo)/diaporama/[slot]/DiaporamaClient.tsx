// app/diaporama/[slot]/DiaporamaClient.tsx
"use client";
import React from "react";
import Image from "next/image";
import type { HiboutikProduct } from "@/app/types/ProductType";
import { formatPrice } from "@/app/lib/utils";

function firstImage(p: any) {
  const list = Array.isArray(p?.images) ? p.images : [];
  return p?.image ?? p?.thumb ?? list[0];
}

export default function DiaporamaClient({ products }: { products: HiboutikProduct[] }) {
  const items = products ?? [];
  const [i, setI] = React.useState(0);

  React.useEffect(() => {
    if (!items.length) return;
    const t = window.setInterval(() => setI((p) => (p + 1) % items.length), 5000);
    return () => window.clearInterval(t);
  }, [items.length]);

  if (!items.length) return null;

  const p: any = items[i];
  const img = firstImage(p);

  const hasPromo = (p.product_discount_price ?? "0") !== "0" && Number(p.product_discount_price) > 0;
  const priceStr = hasPromo ? p.product_discount_price : p.product_price;

  return (
    <main className="fixed inset-0 bg-black text-white" onClick={() => setI((x) => (x + 1) % items.length)}>
      <div className="absolute inset-0">
        <Image src={img} alt={p.product_model ?? "Produit"} fill priority sizes="100vw" className="object-contain" />
      </div>

      <div className="absolute left-0 right-0 bottom-0 p-10 bg-gradient-to-t from-black/85 via-black/35 to-transparent">
        <div className="max-w-6xl mx-auto">
          <div className="mt-2 text-4xl md:text-6xl font-bold leading-tight">{p.product_model ?? "(Sans nom)"}</div>
          <div className="mt-4 text-3xl md:text-4xl font-semibold">{formatPrice(priceStr ?? "0")}</div>
        </div>
      </div>
    </main>
  );
}