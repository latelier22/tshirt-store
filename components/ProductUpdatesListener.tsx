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

    es.addEventListener("messages_updated", (event: Event) => {
      try {
        const e = event as MessageEvent;
        const payload = JSON.parse(e.data || "{}");
        const slot = String(payload?.slot || "").trim();

        // si pas de slot => reload partout
        if (!slot) {
          hardReload();
          return;
        }

        // reload seulement si on est sur le bon diaporama
        const path = window.location.pathname;
        if (path.includes(`/diaporama/${slot}`)) {
          hardReload();
        }
      } catch (err) {
        console.error("messages_updated parse error", err);
        hardReload();
      }
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