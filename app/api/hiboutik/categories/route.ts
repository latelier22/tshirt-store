import { NextRequest, NextResponse } from "next/server";

function token(login: string, apiKey: string) {
  return Buffer.from(`${login}:${apiKey}`).toString("base64");
}

export async function GET(_req: NextRequest) {
  const account = process.env.HIBOUTIK_ACCOUNT;
  const login = process.env.HIBOUTIK_LOGIN;
  const apiKey = process.env.HIBOUTIK_API_KEY;

  if (!account || !login || !apiKey) {
    return NextResponse.json({ error: "Missing Hiboutik env vars" }, { status: 500 });
  }

  const upstream = `https://${account}.hiboutik.com/api/categories/`;

  const res = await fetch(upstream, {
    headers: {
      Accept: "application/json",
      Authorization: `Basic ${token(login, apiKey)}`,
    },
    cache: "no-store",
  });

  const text = await res.text();
  if (!res.ok) {
    return NextResponse.json(
      { error: "hiboutik_error", status: res.status, body: text.slice(0, 300) },
      { status: 502 }
    );
  }

  const json = text ? JSON.parse(text) : [];
  return NextResponse.json(json, {
    headers: { "Cache-Control": "s-maxage=600, stale-while-revalidate=86400" },
  });
}