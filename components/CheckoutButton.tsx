'use client';

import { useState } from 'react';

type LegacyProduct = { name?: string; price?: number; images?: string[] };

type Props = {
  // Nouvelle API
  name?: string;
  priceCents?: number;   // en centimes
  image?: string;

  // Ancienne API (compat)
  product?: LegacyProduct;

  disabled?: boolean;
};

export default function CheckoutButton(props: Props) {
  const [loading, setLoading] = useState(false);

  // Normalisation des données
  const finalName =
    props.name ?? props.product?.name ?? 'Produit';
  const finalPriceCents =
    typeof props.priceCents === 'number'
      ? props.priceCents
      : (typeof props.product?.price === 'number' ? props.product!.price : 0);
  const finalImage = props.image ?? props.product?.images?.[0];

  async function handleCheckout() {
    try {
      setLoading(true);
      if (!finalName || !finalPriceCents || finalPriceCents <= 0) {
        throw new Error('Données produit manquantes (name/priceCents).');
      }

      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: finalName, priceCents: finalPriceCents, image: finalImage }),
      });

      if (!res.ok) throw new Error(await res.text());
      const { url } = await res.json();
      if (!url) throw new Error('URL de paiement absente.');
      window.location.href = url;
    } catch (e: any) {
      console.error('Erreur Checkout:', e);
      alert(e?.message ?? 'Impossible de créer la session de paiement.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleCheckout}
      disabled={props.disabled || loading || !finalName || !finalPriceCents}
      className="mt-6 bg-orange-500 text-black font-semibold px-8 py-4 rounded-xl 
                 hover:bg-orange-400 active:bg-orange-600 transition w-full text-xl shadow-md
                 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? 'Redirection…' : '🛒 Acheter maintenant'}
    </button>
  );
}
