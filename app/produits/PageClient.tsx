"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { GridItem } from "@/lib/mappers/mapHiboutikToGrid";

export default function PageClient({ products }: { products: GridItem[] }) {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return products;
    return products.filter((p) => p.name.toLowerCase().includes(s));
  }, [products, q]);

  return (
    <main style={{ padding: 16 }}>
      <h1>Produits</h1>

      <div style={{ margin: "12px 0" }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Rechercher…"
          style={{ padding: 10, width: "min(520px, 100%)" }}
        />
      </div>

      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}>
        {filtered.map((p) => (
          <Link
            key={p.id}
            href={p.href}
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <article style={{ border: "1px solid #ddd", borderRadius: 12, padding: 12 }}>
              {p.thumb ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.thumb}
                  alt={p.name}
                  style={{ width: "100%", height: 160, objectFit: "cover", borderRadius: 10 }}
                />
              ) : null}

              <div style={{ marginTop: 10, fontWeight: 600 }}>{p.name}</div>

              <div style={{ opacity: 0.75, marginTop: 6 }}>
                {(p.priceCents / 100).toFixed(2)} €
                {typeof p.inStock === "boolean" ? (p.inStock ? " • en stock" : " • rupture") : ""}
              </div>
            </article>
          </Link>
        ))}
      </div>
    </main>
  );
}