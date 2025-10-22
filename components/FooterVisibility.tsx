// components/FooterVisibility.tsx
'use client'
import { usePathname } from 'next/navigation'
import Footer from './Footer'

export default function FooterVisibility() {
  const pathname = usePathname()
  // Cache le footer sur /personalise (et éventuels sous-routes)
  if (pathname?.startsWith('/personalise')) return null
  return <Footer />
}
