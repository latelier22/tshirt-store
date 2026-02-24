"use client";

import { useEffect, useRef, useState } from "react";
import ProductUpdateModal from "./ProductUpdateModal";

const API_BASE = "https://api.multimedia-services.fr"; // ton hiboutik-cache

export default function ProductUpdatesListener() {
  const [open, setOpen] = useState(false);
  const [product, setProduct] = useState<any>(null);

  const queueRef = useRef<number[]>([]);
  const busyRef = useRef(false);

  async function showProduct(productId: number) {
    try {
      const res = await fetch(`${API_BASE}/api/products/${productId}`, { cache: "no-store" });
      const json = await res.json();
      if (json?.ok) {
        setProduct(json.data);
        setOpen(true);
      }
    } catch {
      // ignore
    }
  }

  async function pumpQueue() {
    if (busyRef.current) return;
    busyRef.current = true;
    try {
      while (queueRef.current.length > 0) {
        const id = queueRef.current.shift()!;
        await showProduct(id);

        // attendre fermeture modale avant suivant
        await new Promise<void>((resolve) => {
          const iv = setInterval(() => {
            if (!open) {
              clearInterval(iv);
              resolve();
            }
          }, 200);
        });
      }
    } finally {
      busyRef.current = false;
    }
  }

  useEffect(() => {
    const es = new EventSource(`${API_BASE}/api/events`);

    es.addEventListener("product_updated", (ev: any) => {
      try {
        const data = JSON.parse(ev.data);
        const id = Number(data?.product_id);
        if (!id) return;

        // anti-doublon
        if (!queueRef.current.includes(id)) queueRef.current.push(id);

        // lance l’affichage
        pumpQueue();
      } catch {}
    });

    es.addEventListener("ping", () => {});
    es.onerror = () => {
      // l’EventSource va auto-retry
    };

    return () => es.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <ProductUpdateModal open={open} onClose={() => setOpen(false)} product={product} />
    </>
  );
}