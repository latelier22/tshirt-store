import { NextRequest } from "next/server";

/**
 * GET /api/hiboutik/image?src=<URL_HIBOUTIK>&w=<width>&q=<quality>
 * Proxy authentifié (Basic) vers les images Hiboutik protégées.
 */
export async function GET(req: NextRequest) {
  const account = process.env.HIBOUTIK_ACCOUNT;
  const login = process.env.HIBOUTIK_LOGIN;
  const apiKey = process.env.HIBOUTIK_API_KEY;

  if (!account || !login || !apiKey) {
    return new Response("Missing Hiboutik env vars", { status: 500 });
  }

  const url = new URL(req.url);
  const src = url.searchParams.get("src");
  // Next/Image ajoute souvent w et q ; on les lit sans s'en servir
  const _w = url.searchParams.get("w");
  const _q = url.searchParams.get("q");

  if (!src) return new Response("Missing src", { status: 400 });

  // Sécurité : n'autoriser que ton hôte Hiboutik + chemin images
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

  const token =
    (globalThis as any).Buffer
      ? Buffer.from(`${login}:${apiKey}`).toString("base64")
      : (typeof btoa !== "undefined" ? btoa(`${login}:${apiKey}`) : "");

  // Récupération upstream (on ignore w/q côté Hiboutik qui ne supporte pas le resize)
  const upstream = await fetch(u.toString(), {
    headers: {
      Authorization: `Basic ${token}`,
      Accept: "*/*",
    },
    // Laisse le cache aux intermédiaires ; on sert des fichiers statiques
    cache: "no-store",
  });

  if (!upstream.ok || !upstream.body) {
    const t = await upstream.text().catch(() => "");
    return new Response(`Upstream error ${upstream.status}\n${t}`, { status: 502 });
  }

  return new Response(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": upstream.headers.get("content-type") || "image/jpeg",
      // bon caching public ; next/image ajoutera son propre etag côté CDN
      "Cache-Control": "public, max-age=86400, immutable",
    },
  });
}
