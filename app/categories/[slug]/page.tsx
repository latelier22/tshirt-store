// app/categories/[slug]/page.tsx
import PageClient from "./PageClient";
import { hiboutikGetGrid } from "@/app/lib/hiboutik";
import { HiboutikProduct } from "@/app/types/ProductType";

function parseIdFromSlug(slug?: string): number | null {
  if (!slug) return null;
  const m = slug.match(/-(\d+)$/);
  if (!m) return null;
  const id = Number(m[1]);
  return Number.isFinite(id) ? id : null;
}

type Props = {
  params: Promise<{ slug: string }>; // ✅ important chez toi
};

export const dynamic = "force-dynamic";

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params; // ✅ obligatoire chez toi
  const categoryId = parseIdFromSlug(slug);

  if (!categoryId) {
    return (
      <main className="mx-auto max-w-5xl p-6 mt-28">
        <h1 className="text-xl font-semibold">Catégorie introuvable</h1>
        <p className="mt-2 opacity-80">Slug reçu : {String(slug)}</p>
      </main>
    );
  }

  const products = (await hiboutikGetGrid({
    product_category: String(categoryId),
    include_children: "1",
    from: 0,
    to: 99,
    order_by: "product_id",
    sort: "ASC",
  })) as HiboutikProduct[];

  return (
    <main className="mt-28">
      <PageClient products={products} />
    </main>
  );
}