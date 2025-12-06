import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

// Utilise la version du SDK installé
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Construit une base URL fiable (prod Vercel, preview, local)
function buildBaseUrl(req: NextRequest): string {
  const fromEnv =
    process.env.STRIPE_ASSETS_BASE ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.VERCEL_URL; // ex: "mon-site.vercel.app" (sans protocole)
  if (fromEnv) {
    const hasProto = /^https?:\/\//i.test(fromEnv);
    return hasProto ? fromEnv : `https://${fromEnv}`;
  }
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  const proto = (req.headers.get("x-forwarded-proto") || "https").split(",")[0].trim();
  return `${proto}://${host}`;
}

// Rend absolue une URL (gère /... et //...)
function toAbsoluteUrl(raw: unknown, base: string): string | undefined {
  if (!raw || typeof raw !== "string") return undefined;
  const s = raw.trim();
  try {
    if (/^https?:\/\//i.test(s)) return new URL(s).toString(); // déjà absolue
    if (/^\/\//.test(s)) return new URL(`https:${s}`).toString(); // protocole relatif -> https
    return new URL(s, base).toString(); // chemin relatif -> absolu
  } catch {
    return undefined;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const name: string | undefined = body?.name;
    const priceCents = Number.parseInt(String(body?.priceCents ?? body?.price ?? body?.amount), 10);
    const imageRaw: string | undefined = body?.image; // ex: "/api/hiboutik/image?src=..."

    if (!name) return NextResponse.json({ error: "Missing product name" }, { status: 400 });
    if (!Number.isFinite(priceCents) || priceCents <= 0) {
      return NextResponse.json({ error: "Invalid price (cents)" }, { status: 400 });
    }

    const baseUrl = buildBaseUrl(req);

    // 1) tente avec l'image fournie, 2) fallback sur /logo.png
    let imageAbs = toAbsoluteUrl(imageRaw, baseUrl) || toAbsoluteUrl("/logo.png", baseUrl);

    // Stripe exige HTTPS absolu
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
            unit_amount: priceCents, // centimes
            product_data: {
              name,
              images: [imageAbs], // URL publique HTTPS
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
