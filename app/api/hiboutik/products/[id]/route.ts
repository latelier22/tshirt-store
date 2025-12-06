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
  const mini = list.find(u => /\/mini_/i.test(u));
  const bigs = list.filter(u => /\/big_/i.test(u));
  const big = bigs[0] ?? undefined;

  return {
    list,
    thumb: mini ?? big ?? list[0],   // petite (ou fallback)
    image: big ?? mini ?? list[0],   // grande (ou fallback)
  };
}

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;

  const account = process.env.HIBOUTIK_ACCOUNT;
  const login = process.env.HIBOUTIK_LOGIN;
  const apiKey = process.env.HIBOUTIK_API_KEY;

  if (!account || !login || !apiKey) {
    return NextResponse.json({ error: "Missing Hiboutik env vars" }, { status: 500 });
  }

  const upstream = `https://${account}.hiboutik.com/api/products/${encodeURIComponent(id)}/`;

  const token =
    (globalThis as any).Buffer
      ? Buffer.from(`${login}:${apiKey}`).toString("base64")
      : (typeof btoa !== "undefined" ? btoa(`${login}:${apiKey}`) : "");

  const res = await fetch(upstream, {
    headers: { Accept: "application/json", Authorization: `Basic ${token}` },
    cache: "no-store",
  });

  const text = await res.text();
  if (!res.ok) {
    return new NextResponse(text, { status: res.status, headers: { "Content-Type": "application/json" } });
  }

  const raw = text ? JSON.parse(text) : null;
  const p = Array.isArray(raw) ? raw[0] : raw;

  if (!p) return NextResponse.json(null);

 const { list, thumb, image } = extractImages(p);

const out = {
  ...p,
  images: list.map(toProxy),   // <= proxifiées
  thumb: toProxy(thumb),
  image: toProxy(image),
};

return NextResponse.json(out);
}
