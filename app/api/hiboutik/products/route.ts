import { NextRequest, NextResponse } from "next/server";

/**
 * Proxy Hiboutik (server-side) vers /api/products/search/ :
 * - Auth Basic (login = HIBOUTIK_LOGIN, pass = HIBOUTIK_API_KEY)
 * - Force product_display_www=1 par défaut
 * - Propage tous les query params
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

  // Endpoint SEARCH qui respecte product_display_www
  const upstream = new URL(`https://${account}.hiboutik.com/api/products/search/`);

  // Copie tous les paramètres de la requête
  for (const [k, v] of searchParams.entries()) upstream.searchParams.set(k, v);

  // Force product_display_www=1 sauf si déjà fourni
  if (!upstream.searchParams.has("product_display_www")) {
    upstream.searchParams.set("product_display_www", "1");
  }

  // Pagination via Range header si from/to fournis
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const rangeHeader = from !== null && to !== null ? { Range: `items=${from}-${to}` } : {};

  // Basic Auth (compatible Node/Edge)
  const token =
    (globalThis as any).Buffer
      ? Buffer.from(`${login}:${apiKey}`).toString("base64")
      : (typeof btoa !== "undefined" ? btoa(`${login}:${apiKey}`) : "");

  const res = await fetch(upstream.toString(), {
    method: "GET",
    headers: {
      "Accept": "application/json",
      "Authorization": `Basic ${token}`,
      ...rangeHeader,
    },
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
