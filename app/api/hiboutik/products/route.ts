import { NextRequest, NextResponse } from "next/server";

/**
 * Proxy Hiboutik vers /api/products/search/ :
 * - Basic Auth (login = HIBOUTIK_LOGIN, pass = HIBOUTIK_API_KEY)
 * - Force product_display_www=1 par défaut
 * - Supporte pagination via ?from=0&to=99 -> Range: items=0-99
 */
export async function GET(req: NextRequest) {
  const account = process.env.HIBOUTIK_ACCOUNT;
  const login = process.env.HIBOUTIK_LOGIN;
  const apiKey = process.env.HIBOUTIK_API_KEY;

  if (!account || !login || !apiKey) {
    return NextResponse.json({ error: "Missing Hiboutik env vars" }, { status: 500 });
  }

  const { searchParams } = new URL(req.url);

  // Endpoint SEARCH (respecte product_display_www)
  const upstream = new URL(`https://${account}.hiboutik.com/api/products/search/`);

  // Copie tous les query params
  for (const [k, v] of searchParams.entries()) upstream.searchParams.set(k, v);

  // Force product_display_www=1 sauf si déjà fourni
  if (!upstream.searchParams.has("product_display_www")) {
    upstream.searchParams.set("product_display_www", "1");
  }

  // Pagination via Range si from/to fournis
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  // -----  ✅ FIX TypeScript: construire un objet headers simple
  const token =
    (globalThis as any).Buffer
      ? Buffer.from(`${login}:${apiKey}`).toString("base64")
      : (typeof btoa !== "undefined" ? btoa(`${login}:${apiKey}`) : "");

  const headersObj: Record<string, string> = {
    Accept: "application/json",
    Authorization: `Basic ${token}`,
  };
  if (from !== null && to !== null) {
    headersObj["Range"] = `items=${from}-${to}`;
  }
  // -----------------------------------------------

  const res = await fetch(upstream.toString(), {
    method: "GET",
    headers: headersObj, // ✅ plus de spread d’union
    cache: "no-store",
  });

  const text = await res.text();
  const init: ResponseInit = {
    status: res.status,
    headers: {
      "Content-Type": res.headers.get("Content-Type") || "application/json; charset=utf-8",
      "Content-Range": res.headers.get("Content-Range") || "",
    },
  };

  try {
    const json = text ? JSON.parse(text) : null;
    return NextResponse.json(json, init);
  } catch {
    return new NextResponse(text, init);
  }
}
