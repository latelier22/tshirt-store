import Stripe from 'stripe'
import { NextResponse } from 'next/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(req: Request) {
  try {
    const { name, price, image } = await req.json()

    if (!name || !price) {
      return NextResponse.json({ error: 'Missing product data' }, { status: 400 })
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL || 'https://multimedia-servicesdeforce.multimedia-services.fr'

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name,
              images: [image ? `${baseUrl}${image}` : `${baseUrl}/logo.png`],
            },
            unit_amount: price,
          },
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/success`,
      cancel_url: `${baseUrl}/`,
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('Erreur Stripe :', err)
    return NextResponse.json({ error: 'Erreur création session' }, { status: 500 })
  }
}
