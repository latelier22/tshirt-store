import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";

function safeJsonParse(s: string) {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const secret = process.env.HIBOUTIK_WEBHOOK_SECRET || "";
  const got = req.headers.get("x-webhook-secret") || req.nextUrl.searchParams.get("secret") || "";

  if (!secret || got !== secret) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const rawBody = await req.text();
  const json = safeJsonParse(rawBody);

  // ⚠️ log dans /tmp (OK sur VPS, OK en Node). En Vercel ce serait éphémère.
  const logPath = "/tmp/hiboutik-webhook.log";
  const entry = {
    at: new Date().toISOString(),
    method: req.method,
    url: req.nextUrl.toString(),
    headers: {
      "content-type": req.headers.get("content-type"),
      "user-agent": req.headers.get("user-agent"),
    },
    body_raw: rawBody.slice(0, 5000),
    body_json: json,
  };

  fs.appendFileSync(logPath, JSON.stringify(entry) + "\n", "utf8");

  return NextResponse.json({ ok: true });
}

// Optionnel : GET pour lire le dernier log (protégé pareil)
export async function GET(req: NextRequest) {
  const secret = process.env.HIBOUTIK_WEBHOOK_SECRET || "";
  const got = req.headers.get("x-webhook-secret") || req.nextUrl.searchParams.get("secret") || "";

  if (!secret || got !== secret) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const logPath = "/tmp/hiboutik-webhook.log";
  if (!fs.existsSync(logPath)) return NextResponse.json({ ok: true, lines: [] });

  const lines = fs.readFileSync(logPath, "utf8").trim().split("\n");
  const last = lines.slice(-10).map((l) => {
    try { return JSON.parse(l); } catch { return { bad: l }; }
  });

  return NextResponse.json({ ok: true, last });
}