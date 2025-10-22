'use client'

export default function CheckoutButton({ product }: { product: any }) {
  async function handleCheckout() {
    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: product.name,
        price: product.price,
        image: product.images[0],
      }),
    })

    const { url } = await res.json()
    window.location.href = url
  }

  return (
    <button
      onClick={handleCheckout}
      className="mt-6 bg-orange-500 text-black font-semibold px-8 py-4 rounded-xl 
                 hover:bg-orange-400 active:bg-orange-600 transition w-full text-xl shadow-md"
    >
      🛒 Acheter maintenant
    </button>
  )
}
