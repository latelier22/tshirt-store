import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import Header from "../components/Header"
import Footer from "../components/Footer"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "PHÉNOMÈNE DE FORCE",
  description: "T-shirts originaux – PHÉNOMÈNE DE FORCE",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50 text-gray-900 min-h-screen flex flex-col`}
      >
        {/* Header fixe en haut */}
        <Header />

        {/* Contenu principal qui pousse le footer vers le bas si besoin */}
        <main className="grow pt-24">{children}</main>

        {/* Footer toujours visible */}
        <Footer />
      </body>
    </html>
  )
}
