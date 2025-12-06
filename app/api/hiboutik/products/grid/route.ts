import { NextRequest, NextResponse } from "next/server";

// helper pour fabriquer une URL proxy locale
function toProxy(u?: string) {
  return u ? `/api/hiboutik/image?src=${encodeURIComponent(u)}` : undefined;
}

function extractImages(obj: any) {
  const urls = new Set<string>();
  const push = (v: any) => {
    if (!v) return;
    if (typeof v === "string" && /^https?:\/\//i.test(v)) urls.add(v);
    if (typeof v === "object" && typeof v.url === "string" && /^https?:\/\//i.test(v.url)) {
      urls.add(v.url);
    }
  };
  const walk = (x: any) => {
    if (!x) return;
    if (Array.isArray(x)) return x.forEach(walk);
    if (typeof x === "object") {
      for (const [k, v] of Object.entries(x)) {
        if (k.toLowerCase().includes("image")) {
          if (Array.isArray(v)) v.forEach(push);
          else push(v);
        }
        if (v && typeof v === "object") walk(v);
      }
    }
  };
  walk(obj);

  const list = Array.from(urls);
  const mini = list.find((u) => /\/mini_/i.test(u));
  const bigs = list.filter((u) => /\/big_/i.test(u));
  const big = bigs[0] ?? undefined;

  return {
    list,
    thumb: mini ?? big ?? list[0],
    image: big ?? mini ?? list[0],
  };
}

export async function GET(req: NextRequest) {
  const account = process.env.HIBOUTIK_ACCOUNT;
  const login = process.env.HIBOUTIK_LOGIN;
  const apiKey = process.env.HIBOUTIK_API_KEY;

  if (!account || !login || !apiKey) {
    return NextResponse.json({ error: "Missing Hiboutik env vars" }, { status: 500 });
  }

  const url = new URL(req.url);
  const searchUrl = new URL(`https://${account}.hiboutik.com/api/products/search/`);
  for (const [k, v] of url.searchParams.entries()) searchUrl.searchParams.set(k, v);
  if (!searchUrl.searchParams.has("product_display_www")) {
    searchUrl.searchParams.set("product_display_www", "1");
  }

  const token =
    (globalThis as any).Buffer
      ? Buffer.from(`${login}:${apiKey}`).toString("base64")
      : (typeof btoa !== "undefined" ? btoa(`${login}:${apiKey}`) : "");

  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const headersObj: Record<string, string> = {
    Accept: "application/json",
    Authorization: `Basic ${token}`,
  };
  if (from !== null && to !== null) headersObj["Range"] = `items=${from}-${to}`;

  const listRes = await fetch(searchUrl.toString(), { headers: headersObj, cache: "no-store" });
  if (!listRes.ok) {
    return NextResponse.json({ error: "search_failed" }, { status: 502 });
  }
  const list = await listRes.json();
  const items: any[] = Array.isArray(list) ? list : [];

  // Hydratation en parallèle (simple)
  const tasks = items.map(async (p) => {
    try {
      const detUrl = `https://${account}.hiboutik.com/api/products/${encodeURIComponent(p.product_id)}/`;
      const detRes = await fetch(detUrl, {
        headers: { Accept: "application/json", Authorization: `Basic ${token}` },
        cache: "no-store",
      });
      if (!detRes.ok) return null;

      const raw = await detRes.json();
      const det = Array.isArray(raw) ? raw[0] : raw;
      const { list, thumb, image } = extractImages(det);

      return {
        ...p,
        images: list.map(toProxy),
        thumb: toProxy(thumb),
        image: toProxy(image),
      };
    } catch {
      return null;
    }
  });

  const hydrated = await Promise.all(tasks);

  // ✅ Ne renvoyer QUE les produits avec au moins une image
  const withImages = hydrated.filter(
    (r): r is any =>
      !!r && (r.image || r.thumb || (Array.isArray(r.images) && r.images.length > 0))
  );

  return NextResponse.json(withImages, {
    headers: { "Cache-Control": "s-maxage=300, stale-while-revalidate=86400" },
  });
}
