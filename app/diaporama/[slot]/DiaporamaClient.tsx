"use client";

import React from "react";
import Image from "next/image";
import type { HiboutikProduct } from "@/app/types/ProductType";
import { formatPrice } from "@/app/lib/utils";

function firstImage(p: any) {
  const list = Array.isArray(p?.images) ? p.images : [];
  return p?.image ?? p?.thumb ?? list[0];
}

export default function DiaporamaClient({
  products,
}: {
  products: HiboutikProduct[];
}) {
  const [index, setIndex] = React.useState(0);
  const slideMs = 5000;

  React.useEffect(() => {
    const t = setInterval(() => {
      setIndex((prev) => (prev + 1) % products.length);
    }, slideMs);
    return () => clearInterval(t);
  }, [products.length]);

  const p: any = products[index];
  const img = firstImage(p);

  const hasPromo =
    (p.product_discount_price ?? "0") !== "0" &&
    Number(p.product_discount_price) > 0;

  const priceStr = hasPromo
    ? p.product_discount_price
    : p.product_price;

  return (
    <main
      className="fixed inset-0 bg-black text-white"
      onClick={() =>
        setIndex((prev) => (prev + 1) % products.length)
      }
    >
      {/* IMAGE */}
      <div className="absolute inset-0">
        <Image
          src={img}
          alt={p.product_model ?? "Produit"}
          fill
          priority
          className="object-contain"
          sizes="100vw"
        />
      </div>

      {/* OVERLAY BAS */}
      <div className="absolute bottom-0 left-0 right-0 p-10 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
        <div className="max-w-5xl mx-auto">
          <div className="text-4xl md:text-6xl font-bold">
            {p.product_model}
          </div>

          <div className="mt-4 text-3xl font-semibold">
            {formatPrice(priceStr ?? "0")}
          </div>

          {hasPromo && (
            <div className="line-through opacity-70 text-lg">
              {formatPrice(p.product_price)}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}