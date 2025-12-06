'use client';

import { useState } from 'react';

type LegacyProduct = {
  name?: string;
  /** Héritage : souvent prix en euros (number) */
  price?: number | string;
  images?: string[];
};

type Props = {
  // Nouvelle API
  name?: string;
  /** Prix en centimes (entier) */
  priceCents?: number;
  /** URL (relative ou absolue) – le backend fera l’URL absolue pour Stripe */
  image?: string;

  // Ancienne API (compat)
  product?: LegacyProduct;

  disabled?: boolean;
};

function toIntCents(v: unknown): number {
  // Accepte number ou string (euros ou centimes), renvoie toujours un entier en centimes
  if (v == null) return 0;

  // Si v est un entier raisonnable (> 20 et < 1e9), on suppose centimes déjà
  if (typeof v === 'number' && Number.isFinite(v)) {
    // cas “déjà centimes”
    if (Number.isInteger(v) && v >= 20) return v;
    // cas “euros en number”
    return Math.round(v * 100);
  }

  // string => parse
  if (typeof v === 'string') {
    const s = v.replace(',', '.').trim();
    const n = Number(s);
    if (!Number.isFinite(n)) return 0;
    // heuristique : si entier >= 20 et pas de '.', on considère centimes
    if (Number.isInteger(n) && !s.includes('.') && n >= 20) return n;
    return Math.round(n * 100);
  }

  return 0;
}

export default function CheckoutButton(props: Props) {
  const [loading, setLoading] = useState(false);

  // Normalisation
  const finalName =
    props.name ??
    props.product?.name ??
    'Produit';

  // Priorité au prop “priceCents”; sinon on convertit l’héritage “price” (euros) en centimes
  const centsFromLegacy = toIntCents(props.product?.price);
  const centsFromProp   = toIntCents(props.priceCents);
  const finalPriceCents = centsFromProp || centsFromLegacy;

  const finalImage =
    props.image ??
    props.product?.images?.[0];

  async function handleCheckout() {
    try {
      setLoading(true);

      if (!finalName || !Number.isFinite(finalPriceCents) || finalPriceCents <= 0) {
        throw new Error('Données produit manquantes ou prix invalide (centimes).');
      }

      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: finalName,
          priceCents: finalPriceCents, // toujours un entier en centimes
          image: finalImage,           // peut être relatif (/api/hiboutik/image?...), l’API le rendra absolu
        }),
      });

      let data: any = {};
      try { data = await res.json(); } catch { /* no-op */ }

      if (!res.ok) {
        const msg = typeof data?.error === 'string' ? data.error : `HTTP ${res.status}`;
        throw new Error(msg);
      }

      const url = data?.url;
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
      type="button"
      onClick={handleCheckout}
      disabled={props.disabled || loading || !finalName || finalPriceCents <= 0}
      className="mt-6 bg-orange-500 text-black font-semibold px-8 py-4 rounded-xl 
                 hover:bg-orange-400 active:bg-orange-600 transition w-full text-xl shadow-md
                 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? 'Redirection…' : '🛒 Acheter maintenant'}
    </button>
  );
}
