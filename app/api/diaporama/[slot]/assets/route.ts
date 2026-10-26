import { NextResponse } from "next/server";
import { validSlot } from "@/app/lib/diaporama-assets";
import { getSlotManifest } from "@/app/lib/diaporama-manifest-server";

export const dynamic = "force-dynamic";
export async function GET(_request: Request, { params }: { params: Promise<{ slot: string }> }) {
  const { slot } = await params;
  if (!validSlot(slot)) return NextResponse.json({ error: "Invalid slot" }, { status: 400 });
  if (process.env.DIAPORAMA_PREPARED_IMAGES === "0") return NextResponse.json({ disabled: true });
  const manifest = await getSlotManifest(slot);
  return NextResponse.json(manifest ?? { error: "Manifest unavailable" }, {
    status: manifest ? 200 : 502, headers: { "Cache-Control": "no-store" },
  });
}
