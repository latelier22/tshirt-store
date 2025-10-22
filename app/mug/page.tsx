'use client'
import ProductGallery from '../../components/ProductGallery'

export default function MugPage() {
  const images = [
    '/mug-orange-face.png',
    '/mug-orange-gauche.png',
    '/mug-orange-droite.png',
  ]

  async function handleCheckout() {
    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Mug couleur Phénomène de force',
        price: 1500, // 15.00 €
        image: '/mug-orange-face.png',
      }),
    })
    const { url } = await res.json()
    window.location.href = url
  }

  return (
    <main className="flex flex-col items-center justify-center bg-gray-50 pt-28 pb-16 px-4">
      <section className="max-w-6xl w-full flex flex-col md:flex-row items-center justify-between gap-10 md:gap-16">
        <div className="flex-1 w-full flex justify-center">
          <ProductGallery images={images} />
        </div>

        <div className="flex-1 text-center md:text-left space-y-4">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight">
            Mug couleur Phénomène de force
          </h1>
          <p className="text-gray-600 text-base md:text-lg">
            Céramique blanche 330 ml – Impression haute qualité
          </p>
          <p className="text-2xl font-semibold text-gray-900">15,00 €</p>

          <button
            onClick={handleCheckout}
            className="mt-6 bg-orange-500 text-black font-semibold px-8 py-4 rounded-xl hover:bg-orange-400 active:bg-orange-600 transition w-full text-xl shadow-md"
          >
            🛒 Acheter maintenant
          </button>
        </div>
      </section>
    </main>
  )
}
