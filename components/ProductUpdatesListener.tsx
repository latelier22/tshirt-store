"use client";

import { useEffect, useRef } from "react";

const API_BASE = "https://api.multimedia-services.fr";

export default function ProductUpdatesListener() {
  const reloadingRef = useRef(false);

  useEffect(() => {
    const es = new EventSource(`${API_BASE}/api/events`);

    const hardReload = () => {
      if (reloadingRef.current) return;
      reloadingRef.current = true;

      window.setTimeout(() => {
        window.location.reload();
      }, 150);
    };

    es.addEventListener("product_updated", () => {
      hardReload();
    });

    es.addEventListener("product_created", () => {
      hardReload();
    });

    es.addEventListener("product_deleted", () => {
      hardReload();
    });

    es.addEventListener("categories_updated", () => {
      hardReload();
    });

    es.onerror = (err) => {
      console.error("SSE error", err);
    };

    return () => {
      es.close();
    };
  }, []);

  return null;
}