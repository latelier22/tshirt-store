// app/diaporama/[slot]/page.tsx
import TabletSocketClient from "./TabletSocketClient";
import DiaporamaClient from "./DiaporamaClient";
import { hiboutikGetGrid } from "@/app/lib/hiboutik-cache";
import type { HiboutikProduct } from "@/app/types/ProductType";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slot: string }>;
};

function hasImage(p: any) {
  if (p?.image) return true;
  if (p?.thumb) return true;
  if (Array.isArray(p?.images) && p.images.length > 0) return true;
  return false;
}

export default async function DiaporamaSlotPage({ params }: Props) {
  const { slot } = await params;

  // ✅ SLOT SPECIAL : TABLETTE => écoute socket et redirige
  if (slot === "tablette") {
    return <TabletSocketClient />;
  }

  // sinon diaporama classique
  const products = (await hiboutikGetGrid({
    order_by: "updated_at",
    sort: "DESC",
    from: 0,
    to: 300,
  })) as HiboutikProduct[];

  const withImages = (Array.isArray(products) ? products : []).filter(hasImage);

  if (!withImages.length) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-black text-white p-8">
        <div className="text-center">
          <div className="text-2xl font-semibold">Diaporama</div>
          <div className="opacity-80 mt-2">Aucun produit avec image.</div>
        </div>
      </main>
    );
  }

  return <DiaporamaClient slot={slot} products={withImages} />;
}