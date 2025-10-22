'use client'
import ProductGallery from '../components/ProductGallery'
import Image from 'next/image'

export default function Home() {
  const images = [
    '/tshirt-noir-face.png',
    '/tshirt-noir-logo.png',
    '/tshirt-noir-dos.png',
  ]

   async function handleCheckout() {
    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Tshirt noir Phénomène de force',
        price: 2500, // 25.00 €
        image: '/tshirt-noir-face.png',
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
            T-shirt Édition Limitée
          </h1>
          <p className="text-gray-600 text-base md:text-lg">
            100% coton bio — Coupe unisexe
          </p>
          <p className="text-2xl font-semibold text-gray-900">25,00 €</p>
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
