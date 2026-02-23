import { NextRequest, NextResponse } from "next/server";

function safeParseJson(s: string) {
  try { return JSON.parse(s); } catch { return null; }
}

export async function POST(req: NextRequest) {
  const secret = process.env.HIBOUTIK_WEBHOOK_SECRET || "";
  const got = req.nextUrl.searchParams.get("secret") || "";

  if (!secret || got !== secret) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const contentType = req.headers.get("content-type") || "";
  const raw = await req.text(); // 👈 marche pour JSON, form, etc.

  // ⚠️ log court + safe
  console.log("[HIBOUTIK WEBHOOK] content-type=", contentType);
  console.log("[HIBOUTIK WEBHOOK] raw(body, first 2000)=", raw.slice(0, 2000));

  const json = contentType.includes("application/json") ? safeParseJson(raw) : null;
  if (json) {
    // log un extrait utile
    console.log("[HIBOUTIK WEBHOOK] json keys=", Object.keys(json));
    console.log("[HIBOUTIK WEBHOOK] json snippet=", JSON.stringify(json).slice(0, 2000));
  }

  return NextResponse.json({ ok: true });
}