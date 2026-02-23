'use client'
import { usePathname } from 'next/navigation'
import FooterDock from './FooterDock'

export default function FooterVisibility() {
  const pathname = usePathname()
  if (pathname?.startsWith('/personalise')) return null
  return <FooterDock autoHideMs={2500} />
}