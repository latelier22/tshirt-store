'use client';

import { useState } from 'react';

type Props = {
  name: string;
  priceCents: number;      // prix en centimes (Stripe exige un entier)
  image?: string;          // URL absolue préférable
  disabled?: boolean;
};

export default function CheckoutButton({ name, priceCents, image, disabled }: Props) {
  const [loading, setLoading] = useState(false);

  async function handleCheckout() {
    try {
      setLoading(true);
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, priceCents, image }),
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || 'Erreur serveur');
      }

      const { url } = await res.json();
      if (!url) throw new Error('URL de paiement introuvable');
      window.location.href = url;
    } catch (e) {
      console.error('Erreur Checkout:', e);
      alert('Impossible de créer la session de paiement.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleCheckout}
      disabled={disabled || loading}
      className={`mt-6 bg-orange-500 text-black font-semibold px-8 py-4 rounded-xl 
                  hover:bg-orange-400 active:bg-orange-600 transition w-full text-xl shadow-md
                  disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {loading ? 'Redirection…' : '🛒 Acheter maintenant'}
    </button>
  );
}
