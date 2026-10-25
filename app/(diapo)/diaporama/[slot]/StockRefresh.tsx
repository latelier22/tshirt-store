"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import ProductUpdatesListener from "@/components/ProductUpdatesListener";

export default function StockRefresh({ slot, productIds }: {
  slot: string;
  productIds: number[];
}) {
  const router = useRouter();
  const signature = [...productIds].sort((a, b) => a - b).join(",");

  useEffect(() => {
    const controller = new AbortController();
    let pending = false;

    async function checkStock() {
      if (pending) return;
      pending = true;
      try {
        const response = await fetch(`/api/diaporama/${encodeURIComponent(slot)}/stock`, {
          cache: "no-store",
          signal: AbortSignal.any([controller.signal, AbortSignal.timeout(15000)]),
        });
        if (!response.ok) return;
        const data = await response.json();
        if (!Array.isArray(data.productIds) || !data.productIds.every(Number.isFinite)) return;
        const latest = [...data.productIds].sort((a: number, b: number) => a - b).join(",");
        if (!controller.signal.aborted && latest !== signature) router.refresh();
      } catch {
        // Keep the current display during a temporary outage; retry on the next check.
      } finally {
        pending = false;
      }
    }

    const timer = window.setInterval(checkStock, 30000);
    return () => {
      controller.abort();
      window.clearInterval(timer);
    };
  }, [router, slot, signature]);

  return <ProductUpdatesListener />;
}
