import { NextRequest, NextResponse } from "next/server";
import { hiboutikGetProduct } from "@/app/lib/hiboutik/api";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const out = await hiboutikGetProduct(id);
    return NextResponse.json(out);
  } catch (e: any) {
    return NextResponse.json(
      { error: "hiboutik_error", message: e?.message ?? "Unknown error" },
      { status: 502 }
    );
  }
}