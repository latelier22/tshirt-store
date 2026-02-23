"use client";

import { useProductFilters } from "@/app/stores/productFilters";

export default function ProductFilters({
  total,
  shown,
  matched = 0,
}: {
  total: number;
  shown: number;
  matched?: number; // ✅ optionnel
}) {
  const hideOutOfStock = useProductFilters((s) => s.hideOutOfStock);
  const hideNoImage = useProductFilters((s) => s.hideNoImage);
  const toggleOutOfStock = useProductFilters((s) => s.toggleOutOfStock);
  const toggleNoImage = useProductFilters((s) => s.toggleNoImage);

  const query = useProductFilters((s) => s.query);
  const setQuery = useProductFilters((s) => s.setQuery);
  const clearQuery = useProductFilters((s) => s.clearQuery);

  return (
    <div className="flex flex-col gap-3 mb-4">
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={toggleOutOfStock} className="px-3 py-2 rounded-lg border text-sm">
          {hideOutOfStock ? "✅ Ruptures masquées" : "👁️ Afficher ruptures"}
        </button>

        <button type="button" onClick={toggleNoImage} className="px-3 py-2 rounded-lg border text-sm">
          {hideNoImage ? "✅ Sans image masqués" : "👁️ Afficher sans image"}
        </button>

        <div className="ml-auto text-sm opacity-70">
          {shown}/{total} {query ? `— ${matched} match` : ""}
        </div>
      </div>

      <div className="flex gap-2 items-center">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher (nom, EAN, id)…"
          className="w-full px-3 py-2 rounded-lg border text-sm"
        />
        {query && (
          <button type="button" onClick={clearQuery} className="px-3 py-2 rounded-lg border text-sm">
            ✕
          </button>
        )}
      </div>
    </div>
  );
}