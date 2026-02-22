import { myFetch } from "@/lib/myFetch";
import PageClient from "./PageClient";
import { mapHiboutikToGrid, type GridItem } from "@/lib/mappers/mapHiboutikToGrid";

type HibProduct = {
  product_id: number;
  product_model: string;
  product_price: string;
  thumb?: string;
  image?: string;
  images?: string[];
  stock_available?: number;
};

export const dynamic = "force-dynamic";

export default async function ProduitsPage() {
  const raw = await myFetch<HibProduct[]>("/api/hiboutik/products/grid", { cache: "no-store" });

  const products: GridItem[] = raw.map(mapHiboutikToGrid);

  return <PageClient products={products} />;
}