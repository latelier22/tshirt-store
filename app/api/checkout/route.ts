import Stripe from 'stripe';
import { NextResponse } from 'next/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  try {
    const { name, priceCents, image } = await req.json();

    if (!name || typeof priceCents !== 'number' || priceCents <= 0) {
      return NextResponse.json({ error: 'Bad payload' }, { status: 400 });
    }

    // Base URL pour images/success/cancel
    // 1) ORIGIN (dev et prod), 2) NEXT_PUBLIC_BASE_URL (fallback)
    const origin = req.headers.get('origin');
    const baseUrl =
      origin ||
      process.env.NEXT_PUBLIC_BASE_URL ||
      'https://multimedia-services.multimedia-services.fr';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'eur',
            unit_amount: priceCents, // ⚠️ en centimes
            product_data: {
              name,
              images: [image ? image : `${baseUrl}/logo.png`], // URL absolue préférable
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/success`,
      cancel_url: `${baseUrl}/`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('Erreur Stripe :', err);
    return NextResponse.json({ error: 'Erreur création session' }, { status: 500 });
  }
}
