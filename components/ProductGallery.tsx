'use client'
import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'

interface GalleryProps {
  images: string[]
  interval?: number // en millisecondes
}

export default function ProductGallery({ images, interval = 3000 }: GalleryProps) {
  const [current, setCurrent] = useState(0)
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [isDragging, setDragging] = useState(false)
  const [isModalOpen, setModalOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)

  // 🔁 Rotation automatique
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % images.length)
    }, interval)
    return () => clearInterval(timer)
  }, [images.length, interval])

  // 🖱️ Zoom molette (image principale)
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const newZoom = Math.min(Math.max(zoom - e.deltaY * 0.001, 1), 3)
    setZoom(newZoom)
  }

  // 🖐️ Déplacement pendant zoom
  const handleMouseDown = (e: React.MouseEvent) => {
    setDragging(true)
    setOffset({ x: e.clientX, y: e.clientY })
  }

  const handleMouseUp = () => setDragging(false)

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return
    const dx = e.clientX - offset.x
    const dy = e.clientY - offset.y
    containerRef.current.scrollLeft -= dx
    containerRef.current.scrollTop -= dy
    setOffset({ x: e.clientX, y: e.clientY })
  }

  // 💡 Gestion du clic miniature
  const handleClick = (index: number) => {
    setCurrent(index)
    setZoom(1)
  }

  // 🪟 Modale plein écran
  const openModal = () => setModalOpen(true)
  const closeModal = () => {
    setModalOpen(false)
    setZoom(1)
  }

  const nextImage = () => {
    setCurrent((prev) => (prev + 1) % images.length)
    setZoom(1)
  }

  const prevImage = () => {
    setCurrent((prev) => (prev - 1 + images.length) % images.length)
    setZoom(1)
  }

  // 📱 Zoom tactile (pinch)
  const [touches, setTouches] = useState<{ distance: number | null }>({ distance: null })

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      )
      if (touches.distance) {
        const scaleChange = dist / touches.distance
        const newZoom = Math.min(Math.max(zoom * scaleChange, 1), 3)
        setZoom(newZoom)
      }
      setTouches({ distance: dist })
    }
  }

  const handleTouchEnd = () => setTouches({ distance: null })

  return (
    <div className="flex flex-col items-center w-full">
      {/* Image principale */}
      <div
        ref={containerRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={openModal}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="relative w-full max-w-md h-96 mb-4 overflow-hidden rounded-xl shadow-lg bg-white cursor-zoom-in select-none"
      >
        <Image
          key={images[current]}
          src={images[current]}
          alt={`Image ${current + 1}`}
          fill
          className="object-contain transition-transform duration-300 ease-in-out"
          style={{ transform: `scale(${zoom})` }}
        />
      </div>

      {/* Miniatures */}
      <div className="flex space-x-3 justify-center">
        {images.map((img, index) => (
          <button
            key={img}
            onClick={() => handleClick(index)}
            className={`relative w-20 h-20 rounded overflow-hidden border-2 ${
              index === current ? 'border-black' : 'border-transparent'
            }`}
          >
            <Image
              src={img}
              alt={`Miniature ${index + 1}`}
              fill
              className="object-cover hover:opacity-80 transition"
            />
          </button>
        ))}
      </div>

      {/* 🪟 Modale plein écran */}
      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 select-none"
          onClick={closeModal}
        >
          <button
            onClick={(e) => {
              e.stopPropagation()
              closeModal()
            }}
            className="absolute top-6 right-6 text-white text-3xl hover:text-gray-400"
          >
            <X />
          </button>

          <div
            className="relative w-[90vw] h-[80vh] max-w-5xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            onWheel={handleWheel}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <Image
              src={images[current]}
              alt={`Image ${current + 1}`}
              fill
              className="object-contain transition-transform duration-300 ease-in-out"
              style={{ transform: `scale(${zoom})` }}
            />
            <button
              onClick={(e) => {
                e.stopPropagation()
                prevImage()
              }}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white text-4xl hover:text-gray-400"
            >
              <ChevronLeft size={40} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                nextImage()
              }}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white text-4xl hover:text-gray-400"
            >
              <ChevronRight size={40} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
