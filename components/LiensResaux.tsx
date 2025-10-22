import React from 'react'
import { FaFacebookF, FaInstagram, FaTiktok } from 'react-icons/fa'
import Link from 'next/link'

export default function LiensReseaux() {

  return (
  <>

<Link href="https://www.facebook.com/profile.php?id=100088681437185" target="_blank" rel="noopener noreferrer" className="hover:text-blue-500 transition"><FaFacebookF /></Link>
          <Link href="https://www.instagram.com/phenomene_de_force/" target="_blank" rel="noopener noreferrer" className="hover:text-pink-500 transition"><FaInstagram /></Link>
          <Link href="https://www.tiktok.com/@phenomenedeforce" target="_blank" rel="noopener noreferrer" className="hover:text-gray-200 transition"><FaTiktok /></Link>
  </>
  )
}
