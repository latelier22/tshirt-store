'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

interface Product {
  slug: string
  name: string
  price: number
  description?: string
  images: string[]
}

export default function ProductsList() {
  const [products, setProducts] = useState<Product[]>([])

  useEffect(() => {
    fetch('/data/products.json')
      .then((res) => res.json())
      .then((data) => setProducts(data))
      .catch((err) => console.error('Erreur chargement produits:', err))
  }, [])

  if (!products.length)
    return <p className="text-center mt-20 text-gray-500">Chargement des produits...</p>

  return (
    <main className="bg-gray-50 min-h-screen pt-28 pb-12 px-6">
      <h1 className="text-3xl font-bold text-center mb-10 text-gray-900">Nos produits</h1>

      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {products.map((p) => (
          <Link
            key={p.slug}
            href={`/produit/${p.slug}`}
            className="bg-white rounded-xl shadow-md hover:shadow-lg transition overflow-hidden flex flex-col items-center text-center"
          >
            <Image
              src={p.images[0]}
              alt={p.name}
              width={400}
              height={400}
              className="object-contain w-full h-64"
            />
            <div className="p-4">
              <h2 className="font-semibold text-lg">{p.name}</h2>
              <p className="text-gray-500">{(p.price / 100).toFixed(2)} €</p>
            </div>
          </Link>
        ))}
      </div>
    </main>
  )
}
