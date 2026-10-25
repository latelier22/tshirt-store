import { NextResponse } from "next/server";
import { hiboutikGetProductsListByTag } from "@/app/lib/hiboutik-cache";
import { isDiaporamaProductAvailable } from "@/app/lib/diaporama-stock";
import { hasUsableImage } from "@/app/(diapo)/diaporama/[slot]/helpers";
import { getProductsRevision } from "@/app/lib/product-order";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slot: string }> }
) {
  try {
    const { slot } = await params;
    const products = await hiboutikGetProductsListByTag(slot);
    const availableProducts = products
      .filter((product) => isDiaporamaProductAvailable(product) && hasUsableImage(product));
    const productIds = availableProducts
      .map((product) => Number(product.product_id))
      .sort((a, b) => a - b);

    return NextResponse.json({ productIds, revision: getProductsRevision(availableProducts) }, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json({ error: "Stock indisponible" }, { status: 502 });
  }
}
