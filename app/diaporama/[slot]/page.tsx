// app/diaporama/[slot]/page.tsx
import { redirect } from "next/navigation";
import DiaporamaClient from "./DiaporamaClient";
import { hiboutikGetGrid } from "@/app/lib/hiboutik-cache";
import type { HiboutikProduct } from "@/app/types/ProductType";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slot: string }>;
};

function hasImage(p: HiboutikProduct) {
  if (p.image) return true;
  if (p.thumb) return true;
  if (Array.isArray(p.images) && p.images.length > 0) return true;
  return false;
}

export default async function DiaporamaSlotPage({ params }: Props) {
  const { slot } = await params;

  // ✅ tablette => redirect vers ton Sylius wait
  if (slot === "tablette") {
    redirect("https://boutique.multimedia-services.fr/tablet/wait?device=TAB1");
  }

  const products = (await hiboutikGetGrid({
    order_by: "updated_at",
    sort: "DESC",
    from: 0,
    to: 400,
  })) as HiboutikProduct[];

  const withImages = (products ?? []).filter(hasImage);

  if (!withImages.length) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-black text-white p-8">
        Aucun produit avec image.
      </main>
    );
  }

  return <DiaporamaClient products={withImages} />;
}