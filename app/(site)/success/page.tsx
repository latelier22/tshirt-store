import Link from "next/link"

export default function SuccessPage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-center p-8">
      <h1 className="text-3xl font-bold mb-4 text-green-600">✅ Paiement réussi !</h1>
      <p className="text-gray-700 mb-6">
        Merci pour votre achat ! Votre T-shirt sera expédié sous 48h.
      </p>
      <Link href="/" className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition">
        Retour à la boutique
      </Link>
    </main>
  )
}
