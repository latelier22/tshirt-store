"use client";

import { useEffect, useState } from "react";
import type { HiboutikProduct } from "@/app/types/ProductType";
import { getDiaporamaDay, mergeDailyProducts } from "@/app/lib/diaporama-stock";
import { sortProductsByRecency } from "@/app/lib/product-order";
import type { DisplayMessage } from "./types";
import DiaporamaClient from "./DiaporamaClient";
import PreparationScreen from "./PreparationScreen";
import DiaporamaMessagesClient from "./DiaporamaMessagesClient";
import PreparedImagesProvider from "./PreparedImagesProvider";

type RememberedProduct = HiboutikProduct & { salePending?: boolean };

function readProducts(key: string): RememberedProduct[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(key) ?? "[]");
    return Array.isArray(value) ? value.filter(product =>
      product && typeof product === "object" && Number.isFinite(product.product_id)
    ) : [];
  } catch {
    return [];
  }
}

export default function DailyDiaporamaClient({ slot, products, messages, portrait, preparedImagesEnabled = true, commercialReliable = true }: {
  slot: string;
  products: HiboutikProduct[];
  messages: DisplayMessage[];
  portrait: string;
  preparedImagesEnabled?: boolean;
  commercialReliable?: boolean;
}) {
  const [day, setDay] = useState<string | null>(null);
  const [dailyProducts, setDailyProducts] = useState<RememberedProduct[] | null>(null);

  useEffect(() => {
    const checkDay = () => setDay(getDiaporamaDay());
    checkDay();
    const timer = window.setInterval(checkDay, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!day || !commercialReliable) return;
    const prefix = `diaporama-daily:${encodeURIComponent(slot)}:`;
    const key = `${prefix}${day}`;
    const next = sortProductsByRecency(mergeDailyProducts(readProducts(key), products));
    // Hydrate the display from the browser's persistent daily stock snapshot.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDailyProducts(next);
    try {
      localStorage.setItem(key, JSON.stringify(next));
      for (const oldKey of Object.keys(localStorage)) {
        if (oldKey.startsWith(prefix) && oldKey !== key) localStorage.removeItem(oldKey);
      }
    } catch {
      // The display still works when the browser disallows persistent storage.
    }
  }, [slot, day, products, commercialReliable]);

  if (!commercialReliable) return <DiaporamaMessagesClient messages={messages}
    portrait={portrait === "1" ? 1 : portrait === "-1" ? -1 : 0} notice="À découvrir en magasin" />;

  // Wait for local storage so a reload never briefly hides today's sold products.
  if (!dailyProducts) return <PreparationScreen portrait={portrait} message={messages[0]} />;

  if (!dailyProducts.length) {
    if (messages.length) {
      return <DiaporamaMessagesClient messages={messages}
        portrait={portrait === "1" ? 1 : portrait === "-1" ? -1 : 0} />;
    }
    return <main className="fixed inset-0 flex items-center justify-center bg-black p-8 text-white">
      Aucun produit avec le tag &quot;{slot}&quot;.
    </main>;
  }

  const signature = dailyProducts.map(product =>
    `${product.product_id}:${product.salePending ? "sold" : "stock"}`
  ).join(",");

  return <PreparedImagesProvider key={slot} slot={slot} enabled={preparedImagesEnabled}>
    <DiaporamaClient key={signature} products={dailyProducts} messages={messages} portrait={portrait} />
  </PreparedImagesProvider>;
}
