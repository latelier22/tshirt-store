// app/page.tsx
import HomeClient from "./HomeClient";

type CategoryRow = {
  category_id: number;
  slug: string;
  name: string;
  parent_id: number | null;
  product_count?: number;
};

export const dynamic = "force-dynamic";

async function fetchJson(url: string) {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Fetch failed ${res.status} ${url}`);
  return res.json();
}

export default async function HomePage() {
  const base = (process.env.CACHE_API_BASE || "https://api.multimedia-services.fr").replace(/\/+$/, "");

  // catégories + produits récents
  const [catsRes, recentRes] = await Promise.all([
    fetchJson(`${base}/api/categories?with_counts=1`),
    // ✅ on récupère plus large pour garantir >= 6 produits affichables même avec filtres
    fetchJson(`${base}/api/products?order_by=updated_at&sort=DESC&from=0&to=47`),
  ]);

  const categories: CategoryRow[] = Array.isArray(catsRes?.data) ? catsRes.data : [];
  const recentProducts = Array.isArray(recentRes?.data) ? recentRes.data : [];

  const categoriesWithProducts = categories
    .filter((c) => (c.product_count ?? 0) > 0 && (c.name ?? "").trim() !== "")
    .slice(0, 40);

  return (
    <main className="mt-28">
      <HomeClient categories={categoriesWithProducts} recentProducts={recentProducts} />
    </main>
  );
}