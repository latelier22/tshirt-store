'use client'

import ProductGallery from '../components/ProductGallery'

export default function Home() {
  const images = [
    '/tshirt-noir-face.png',
    '/tshirt-noir-logo.png',
    '/tshirt-noir-dos.png',
  ]

  async function handleCheckout() {
    const res = await fetch('/api/checkout', { method: 'POST' })
    const { url } = await res.json()
    window.location.href = url
  }

  return (
    <main className="min-h-screen bg-gray-50 pt-24">
   
      <section className="max-w-5xl mx-auto flex flex-col md:flex-row items-center px-6 py-12 space-y-8 md:space-y-0 md:space-x-8">
        <div className="flex-1">
          <ProductGallery images={images} interval={3000} />
        </div>

        <div className="flex-1 text-center md:text-left">
          <h1 className="text-3xl font-bold mb-2 text-gray-900">T-shirt Édition Limitée</h1>
          <p className="text-gray-600 mb-4">100% coton bio — Coupe unisexe</p>
          <p className="text-xl font-semibold mb-6">25,00 €</p>
          <button
            onClick={handleCheckout}
            className="bg-black text-white px-8 py-3 rounded-lg hover:bg-gray-800 transition"
          >
            Acheter maintenant
          </button>
        </div>
      </section>

     
    </main>
  )
}
