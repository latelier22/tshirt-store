import { NextResponse } from "next/server";
import { validSlot, normalizeProductId } from "@/app/lib/diaporama-assets";
import { getSlotManifest } from "@/app/lib/diaporama-manifest-server";
import { approvedOutlineImage, getPreparedOutline } from "@/app/lib/diaporama-outline-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request, { params }: { params: Promise<{ slot: string; id: string }> }) {
  const { slot, id } = await params;
  const productId = normalizeProductId(id);
  const query = new URL(request.url).searchParams;
  const context = query.get("context");
  const revision = query.get("revision");
  if (!validSlot(slot) || !productId || !["board", "individual"].includes(context ?? "") || !/^[a-f0-9]{64}$/i.test(revision ?? "")) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  if (process.env.DIAPORAMA_PREPARED_IMAGES === "0") return new NextResponse(null, { status: 204 });
  const manifest = await getSlotManifest(slot);
  const entry = manifest?.products.find(product => product.product_id === productId);
  if (!entry || entry.revision !== revision) return new NextResponse(null, { status: 409 });
  const image = approvedOutlineImage(entry, context as "board" | "individual");
  if (!image) return new NextResponse(null, { status: 204 });
  const outline = await getPreparedOutline(image);
  if (!outline) return new NextResponse(null, { status: 204 });
  return NextResponse.json({ image_url: image, outline }, { headers: {
    "Cache-Control": "public, max-age=31536000, immutable",
  } });
}
