import { NextRequest, NextResponse } from "next/server";

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
    headers: {
      Accept: "application/json",
      Authorization: `Basic ${token}`,
    },
    cache: "no-store",
  });

  const text = await res.text();
  const init: ResponseInit = {
    status: res.status,
    headers: { "Content-Type": res.headers.get("Content-Type") ?? "application/json" },
  };

  try {
    return NextResponse.json(text ? JSON.parse(text) : null, init);
  } catch {
    return new NextResponse(text, init);
  }
}
