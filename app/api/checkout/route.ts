import { NextResponse } from "next/server"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16", // ✅ version stable actuelle
})

export async function POST() {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: "T-shirt Édition Limitée",
              images: ["https://phenomenedeforce.fr/tshirt-noir-face.png"],
            },
            unit_amount: 2500, // 💶 25,00 €
          },
          quantity: 1,
        },
      ],
      shipping_address_collection: {
        allowed_countries: ["FR", "BE", "LU", "CH", "DE", "ES", "IT"],
      },
      shipping_options: [
        {
          shipping_rate_data: {
            type: "fixed_amount",
            fixed_amount: { amount: 600, currency: "eur" },
            display_name: "Livraison standard (2-4 jours)",
            delivery_estimate: {
              minimum: { unit: "business_day", value: 2 },
              maximum: { unit: "business_day", value: 4 },
            },
          },
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/success`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/`,
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error("Erreur Stripe :", err)
    return NextResponse.json({ error: "Erreur lors de la création du paiement" }, { status: 500 })
  }
}
