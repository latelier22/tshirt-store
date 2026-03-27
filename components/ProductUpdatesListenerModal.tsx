"use client";

import { useEffect, useRef, useState } from "react";
import ProductUpdateModal from "./ProductUpdateModal";
import ProductUpdateModalLabel from "./ProductUpdateModalLabel";

const API_BASE = "https://api.multimedia-services.fr";

export default function ProductUpdatesListener() {
  const [open, setOpen] = useState(false);
  const [product, setProduct] = useState<any>(null);

  const queueRef = useRef<number[]>([]);
  const queuedIdsRef = useRef<Set<number>>(new Set());
  const busyRef = useRef(false);
  const mountedRef = useRef(false);
  const closeResolverRef = useRef<null | (() => void)>(null);

  async function fetchProduct(productId: number) {
    try {
      const res = await fetch(`${API_BASE}/api/products/${productId}`, {
        cache: "no-store",
      });

      const json = await res.json();
      if (json?.ok) return json.data;
      return null;
    } catch {
      return null;
    }
  }

  function waitForClose() {
    return new Promise<void>((resolve) => {
      closeResolverRef.current = resolve;
    });
  }

  async function pumpQueue() {
    if (busyRef.current) return;
    busyRef.current = true;

    try {
      while (mountedRef.current && queueRef.current.length > 0) {
        const id = queueRef.current.shift()!;
        queuedIdsRef.current.delete(id);

        const data = await fetchProduct(id);
        if (!data) continue;
        if (!mountedRef.current) return;

        setProduct(data);
        setOpen(true);

        await waitForClose();
      }
    } finally {
      busyRef.current = false;
    }
  }

  function enqueueProduct(productId: number) {
    if (!productId) return;
    if (queuedIdsRef.current.has(productId)) return;

    queuedIdsRef.current.add(productId);
    queueRef.current.push(productId);

    void pumpQueue();
  }

  function handleClose() {
    setOpen(false);

    const resolve = closeResolverRef.current;
    closeResolverRef.current = null;

    if (resolve) {
      resolve();
    }
  }

  useEffect(() => {
    mountedRef.current = true;

    const es = new EventSource(`${API_BASE}/api/events`);

    const onProductEvent = (ev: MessageEvent) => {
      try {
        const data = JSON.parse(ev.data);
        const id = Number(data?.product_id);
        if (!id) return;

        enqueueProduct(id);
      } catch {
        // ignore
      }
    };

    es.addEventListener("product_updated", onProductEvent);
    es.addEventListener("product_created", onProductEvent);

    es.addEventListener("ping", () => {});
    es.addEventListener("hello", () => {});

    es.onerror = () => {
      // EventSource retente tout seul
    };

    return () => {
      mountedRef.current = false;
      es.close();

      if (closeResolverRef.current) {
        closeResolverRef.current();
        closeResolverRef.current = null;
      }
    };
  }, []);

  return (
    <ProductUpdateModalLabel
      open={open}
      onClose={handleClose}
      product={product}
    />
  );
}