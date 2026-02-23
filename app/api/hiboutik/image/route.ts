import { NextRequest } from "next/server";
import { hiboutikEnv, hiboutikToken } from "@/app/lib/hiboutik/core";

export async function GET(req: NextRequest) {
  const { account, login, apiKey } = hiboutikEnv();
  const token = hiboutikToken(login, apiKey);

  const url = new URL(req.url);
  const src = url.searchParams.get("src");
  if (!src) return new Response("Missing src", { status: 400 });

  let u: URL;
  try {
    u = new URL(src);
  } catch {
    return new Response("Bad src", { status: 400 });
  }

  const allowedHost = `${account}.hiboutik.com`;
  if (
    u.protocol !== "https:" ||
    u.hostname !== allowedHost ||
    !u.pathname.startsWith("/api/products_images/")
  ) {
    return new Response("Forbidden host/path", { status: 403 });
  }

  const upstream = await fetch(u.toString(), {
    headers: { Authorization: `Basic ${token}`, Accept: "*/*" },
    next: { revalidate: 900 }, // ✅ 15 min
  });

  if (!upstream.ok || !upstream.body) {
    const t = await upstream.text().catch(() => "");
    return new Response(`Upstream error ${upstream.status}\n${t}`, { status: 502 });
  }

  return new Response(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": upstream.headers.get("content-type") || "image/jpeg",
      "Cache-Control": "public, max-age=86400, immutable",
    },
  });
}