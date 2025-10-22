// components/config3d/Overlay3D.tsx
'use client'

import { Logo } from '@pmndrs/branding'
import { motion, AnimatePresence, type Transition } from 'framer-motion'
import { AiFillCamera, AiOutlineArrowLeft, AiOutlineHighlight, AiOutlineShopping } from 'react-icons/ai'
import { useSnapshot } from 'valtio'
import { state } from './store'

export default function Overlay3D() {
  const snap = useSnapshot(state)

  // ✅ Transition typée et compatible (tween autorise duration)
  const transition: Transition = { type: 'tween', ease: 'easeOut', duration: 0.6 }

  // Variants simples pour les sections
  const config = {
    initial: { x: -100, opacity: 0, transition: { ...transition, delay: 0.5 } },
    animate: { x: 0, opacity: 1, transition },
    exit:    { x: -100, opacity: 0, transition },
  }

  return (
    <div className="w-full h-full relative">
      {/* Header flottant dans la zone */}
      <motion.header
        initial={{ opacity: 0, y: -100 }}
        animate={{ opacity: 1, y: 0 }}
        transition={transition}
        className="absolute top-0 left-0 w-full p-6 flex items-center justify-between z-10"
        style={{ pointerEvents: 'auto' }}
      >
        <Logo width="40" height="40" />
        <motion.div
          animate={{ x: snap.intro ? 0 : 100, opacity: snap.intro ? 1 : 0 }}
          transition={transition}
        >
          <AiOutlineShopping size="3em" />
        </motion.div>
      </motion.header>

      <AnimatePresence>
        {snap.intro ? (
          <motion.section key="main" {...config} className="absolute inset-0 flex gap-3 items-center">
            <div className="ml-[5vw] mt-[2vh] mb-50 max-w-md ">
              <motion.div
                key="title"
                initial={{ x: 100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ type: 'tween', ease: 'easeOut', duration: 0.3 }}  // ✅ tween
              >
                <h1 className="font-black italic leading-[0.8] text-[clamp(2rem,8vw,8rem)]">
                  CHOISIS TA COULEUR
                </h1>
              </motion.div>

              <div className="relative md:left-36 md:top-72 max-w-[420px]">
                <motion.div
                  key="p"
                  initial={{ y: 100, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{
                    type: 'tween', ease: 'easeOut', duration: 0.6, delay: 0.2,
                  }} // ✅ tween + delay
                >
                  <p className="mb-6 leading-relaxed">
                    Personnaliser votre T-shirt.{' '}
                    <strong> "Phénomène de force"</strong> et visualise le en 3D.
                  </p>
                  <button
                    style={{ background: snap.color }}
                    className="px-5 py-3 rounded text-white font-bold"
                    onClick={() => (state.intro = false)}
                  >
                    PERONNALISE-LE ! <AiOutlineHighlight size="1.3em" />
                  </button>
                </motion.div>
              </div>
            </div>
          </motion.section>
        ) : (
          <motion.section key="custom" {...config} className="absolute inset-0">
            <Customizer3D />
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  )
}

function Customizer3D() {
  const snap = useSnapshot(state)

  return (
    <div className="absolute inset-0 flex items-end justify-center pb-8" style={{ pointerEvents: 'auto' }}>
      {/* Couleurs */}
      <div className="absolute left-6 bottom-6 flex gap-3">
        {snap.colors.map((color) => (
          <div
            key={color}
            className="w-8 h-8 rounded-full border-2 border-white shadow cursor-pointer"
            style={{ background: color }}
            onClick={() => (state.color = color)}
          />
        ))}
      </div>

      {/* Décals */}
      <div className="absolute left-6 bottom-20 flex gap-4 items-center">
        {snap.decals.map((decal) => (
          <button
            key={decal}
            className="p-2 rounded bg-black/70 hover:bg-black text-white"
            onClick={() => (state.decal = decal)}
          >
            <img src={`${decal}_thumb.png`} alt={decal} className="w-6 h-6 invert" />
          </button>
        ))}
      </div>

      {/* Download */}
      <button
        className="px-5 py-3 rounded text-white font-bold mr-4"
        style={{ background: snap.color }}
        onClick={() => {
          const canvas = document.querySelector('canvas') as HTMLCanvasElement | null
          if (!canvas) return
          const link = document.createElement('a')
          link.setAttribute('download', 'canvas.png')
          link.setAttribute(
            'href',
            canvas.toDataURL('image/png').replace('image/png', 'image/octet-stream')
          )
          link.click()
        }}
      >
        DOWNLOAD <AiFillCamera size="1.3em" />
      </button>

      {/* Back */}
      <button
        className="px-5 py-3 rounded text-white font-bold bg-black"
        onClick={() => (state.intro = true)}
      >
        GO BACK <AiOutlineArrowLeft size="1.3em" />
      </button>
    </div>
  )
}
