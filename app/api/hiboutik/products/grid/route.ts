import { NextRequest, NextResponse } from "next/server";
import { hiboutikSearchHydrated } from "@/app/lib/hiboutik/api";

export async function GET(req: NextRequest) {
  try {
    const out = await hiboutikSearchHydrated(req.url, 8); // 8 requêtes détail max en // (réglable)
    return NextResponse.json(out, {
      headers: { "Cache-Control": "s-maxage=300, stale-while-revalidate=86400" },
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: "hiboutik_error", message: e?.message ?? "Unknown error" },
      { status: 502 }
    );
  }
}