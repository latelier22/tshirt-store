import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Construit une base URL fiable (prod Vercel, preview, local)
function buildBaseUrl(req: NextRequest): string {
  // priorité à une env explicite
  const fromEnv =
    process.env.STRIPE_ASSETS_BASE ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.VERCEL_URL; // host sans protocole sur Vercel

  if (fromEnv) {
    const hasProto = /^https?:\/\//i.test(fromEnv);
    return hasProto ? fromEnv : `https://${fromEnv}`;
  }

  // fallback depuis headers
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  const proto = (req.headers.get("x-forwarded-proto") || "https").split(",")[0].trim();
  return `${proto}://${host}`;
}

function toAbsoluteUrl(maybeUrl: string | null | undefined, base: string): string | undefined {
  if (!maybeUrl) return undefined;
  try {
    if (/^https?:\/\//i.test(maybeUrl)) return new URL(maybeUrl).toString();
    return new URL(maybeUrl, base).toString(); // ex: /api/hiboutik/image?... -> https://domain/api/...
  } catch {
    return undefined;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name: string | undefined = body?.name;

    // tu envoies déjà priceCents côté client : sécu supplémentaire
    const priceCents = Number.parseInt(String(body?.priceCents ?? body?.price ?? body?.amount), 10);

    const imageRaw: string | undefined = body?.image; // peut être /api/hiboutik/image?src=...

    if (!name) return NextResponse.json({ error: "Missing product name" }, { status: 400 });
    if (!Number.isFinite(priceCents) || priceCents <= 0) {
      return NextResponse.json({ error: "Invalid price (cents)" }, { status: 400 });
    }

    const baseUrl = buildBaseUrl(req);

    // URL absolue obligatoire pour Stripe
    let imageAbs = toAbsoluteUrl(imageRaw, baseUrl) || toAbsoluteUrl("/logo.png", baseUrl);
    if (!imageAbs || !/^https:\/\//i.test(imageAbs)) {
      return NextResponse.json({ error: "Invalid image URL for Stripe" }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "eur",
            unit_amount: priceCents, // en centimes
            product_data: {
              name,
              images: [imageAbs], // doit être HTTPS absolu
            },
          },
        },
      ],
      success_url: `${baseUrl}/success`,
      cancel_url: `${baseUrl}/`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("Stripe checkout error:", err);
    const msg = err?.raw?.message || err?.message || "Erreur création session";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
