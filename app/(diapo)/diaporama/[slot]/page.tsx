// app/diaporama/[slot]/page.tsx

import { redirect } from "next/navigation";
import DiaporamaClient from "./DiaporamaClient";
import { hiboutikGetProductsByTag } from "@/app/lib/hiboutik-cache";
import type { HiboutikProduct } from "@/app/types/ProductType";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slot: string }>;
  searchParams: Promise<{ portrait?: string }>;
};

export default async function DiaporamaSlotPage({ params, searchParams }: Props) {
  const { slot } = await params;
  const sp = await searchParams;

  const portraitMode = sp?.portrait ?? "0";

  // ✅ redirection tablette
  if (slot === "tablette") {
    redirect("https://boutique.multimedia-services.fr/tablet/wait?device=TAB1");
  }

  // 🚀 récupération directe via ton API optimisée
  const products: HiboutikProduct[] = await hiboutikGetProductsByTag(slot);

  if (!products.length) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-black text-white p-8">
        Aucun produit avec le tag "{slot}".
      </main>
    );
  }

  return <DiaporamaClient products={products} portrait={portraitMode} />;
}