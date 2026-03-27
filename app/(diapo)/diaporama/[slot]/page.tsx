// app/diaporama/[slot]/page.tsx

import { redirect } from "next/navigation";
import DiaporamaClient from "./DiaporamaClient";
import { hiboutikGetProductsByTag } from "@/app/lib/hiboutik-cache";
import type { HiboutikProduct, HiboutikResolvedTag } from "@/app/types/ProductType";
import { hiboutikGetTagsProductsIndex } from "@/app/lib/hiboutik";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slot: string }>;
  searchParams: Promise<{ portrait?: string }>;
};

type HiboutikProductWithFullTags = HiboutikProduct & {
  fullTags: HiboutikResolvedTag[];
};

function extractTagIds(rawTags: unknown): number[] {
  if (!Array.isArray(rawTags)) return [];

  const ids = rawTags
    .map((x: any) => Number(x?.tag_id ?? x?.id ?? x))
    .filter((n) => Number.isFinite(n) && n > 0);

  return Array.from(new Set(ids));
}

export default async function DiaporamaSlotPage({ params, searchParams }: Props) {
  const { slot } = await params;
  const sp = await searchParams;

  const portraitMode = sp?.portrait ?? "0";

  if (slot === "tablette") {
    redirect("https://boutique.multimedia-services.fr/tablet/wait?device=TAB1");
  }

  const products: HiboutikProduct[] = await hiboutikGetProductsByTag(slot);

  

  if (!products.length) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-black text-white p-8">
        Aucun produit avec le tag "{slot}".
      </main>
    );
  }

  // index global des tags Hiboutik : id -> { tag, tag_cat, ... }
  const tagIndex = await hiboutikGetTagsProductsIndex();

  const productsWithTags: HiboutikProductWithFullTags[] = products.map((p: any) => {
    const tagIds = extractTagIds(p.tags);

    const fullTags = tagIds
      .map((id) => tagIndex.get(id))
      .filter((t): t is HiboutikResolvedTag => !!t);

    return {
      ...p,
      fullTags,
    };
  });

  return (
    <DiaporamaClient
      products={productsWithTags}
      portrait={portraitMode}
    />
  );
}