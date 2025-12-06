import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "../components/Header";

import FooterVisibility from "../components/FooterVisibility"

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Multimédia services",
  description: "T-shirts édition limitée – Multimédia services",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50 text-gray-900 min-h-screen grid grid-rows-[auto_1fr_auto]`}
      >
        <Header />{/* pas fixed (recommandé ici) */}
        <main className="relative overflow-hidden">{/* <- conteneur de hauteur exacte */}
          {children}
        </main>
        <FooterVisibility />

      </body>
    </html>
  );
}
