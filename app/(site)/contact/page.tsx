'use client'
import { useState } from 'react'
import Header from '../../components/Header'

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', message: '' })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  return (
    <main className="pt-24 p-8 max-w-3xl mx-auto text-gray-800 leading-relaxed">
      <Header />

      <h1 className="text-3xl font-bold mb-6 text-center">Contact</h1>
      <p className="text-center mb-8">
        Une question sur nos produits ou votre commande ?  
        Vous pouvez nous écrire directement à <br />
        <a
          href="mailto:contact@multimedia-services.fr"
          className="text-blue-600 hover:underline"
        >
          contact@multimedia-services.fr
        </a>{' '}
        ou utiliser le formulaire ci-dessous.
      </p>

      <form
        action={`mailto:contact@multimedia-services.fr`}
        method="POST"
        encType="text/plain"
        className="bg-gray-50 p-6 rounded-lg shadow-md space-y-4"
      >
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Nom :
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            value={form.name}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-black outline-none"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            E-mail :
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            value={form.email}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-black outline-none"
          />
        </div>

        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
            Message :
          </label>
          <textarea
            id="message"
            name="message"
            rows={5}
            required
            value={form.message}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-black outline-none resize-none"
          />
        </div>

        <div className="text-center">
          <button
            type="submit"
            className="bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition"
          >
            Envoyer
          </button>
        </div>
      </form>

      <section className="mt-10 bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-2xl font-semibold mb-2">Coordonnées</h2>
        <p><strong>Multimédia services</strong></p>
        <p>Entreprise individuelle MULTIMEDIA SERVICES</p>
        <p>7 Boulevard de la Gare, 22600 Loudéac, France</p>
        <p>SIREN : 985 382 423 – SIRET : 985 382 423 00038</p>
        <p>TVA intracom : FR16985382423</p>
        <p>
          📧{' '}
          <a
            href="mailto:contact@multimedia-services.fr"
            className="text-blue-600 hover:underline"
          >
            contact@multimedia-services.fr
          </a>
        </p>
      </section>

      <p className="text-center text-sm text-gray-500 mt-8">
        Nous répondons généralement sous 24 à 48h ouvrées.
      </p>
    </main>
  )
}
