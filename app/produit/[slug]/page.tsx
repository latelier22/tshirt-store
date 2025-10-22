import { headers } from 'next/headers'
import ProductGallery from '../../../components/ProductGallery'
import CheckoutButton from '../../../components/CheckoutButton'

interface Product {
  slug: string
  name: string
  description?: string
  price: number
  images: string[]
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  // 🧩 on "unwrap" les params (nouvelle syntaxe Next 16)
  const { slug } = await params

  // 🔗 URL du site selon environnement
  const headersList = await headers()
  const host = headersList.get('host')
  const protocol = host?.includes('localhost') ? 'http' : 'https'
  const baseUrl = `${protocol}://${host}`

  // 🔄 Récupération du JSON public
  const res = await fetch(`${baseUrl}/data/products.json`, { cache: 'no-store' })
  const products: Product[] = await res.json()
  const product = products.find((p) => p.slug === slug)

  if (!product) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-semibold text-gray-700">Produit introuvable 😢</h1>
      </main>
    )
  }

  return (
    <main className="flex flex-col items-center justify-center bg-gray-50 pt-28 pb-16 px-4">
      <section className="max-w-6xl w-full flex flex-col md:flex-row items-center justify-between gap-10 md:gap-16">
        {/* 🖼️ Galerie */}
        <div className="flex-1 w-full flex justify-center">
          <ProductGallery images={product.images} />
        </div>

        {/* 💬 Infos + bouton achat */}
        <div className="flex-1 text-center md:text-left space-y-4">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight">
            {product.name}
          </h1>
          <p className="text-gray-600 text-base md:text-lg">{product.description}</p>
          <p className="text-2xl font-semibold text-gray-900">
            {(product.price / 100).toFixed(2)} €
          </p>

          <CheckoutButton product={product} />
        </div>
      </section>
    </main>
  )
}
