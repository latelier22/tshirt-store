// app/produits/[id]/page.tsx
import PageClient from "./PageClient";
import { HiboutikProduct } from "@/app/types/ProductType";
import { hiboutikGetProduct } from "@/app/lib/hiboutik";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ProduitPage({ params }: Props) {
  const { id } = await params;

  let product: HiboutikProduct | null = null;

  try {
    product = (await hiboutikGetProduct(id)) as HiboutikProduct | null;
  } catch {
    product = null;
  }

  if (!product) {
    return (
      <main className="mx-auto max-w-3xl p-6">
        <h1 className="text-xl font-semibold">Produit introuvable</h1>
        <p className="mt-2 text-sm opacity-80">ID demandé : {id}</p>
      </main>
    );
  }

  return <PageClient product={product} />;
}