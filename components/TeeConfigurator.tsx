'use client'
import { useEffect, useRef, useState } from 'react'
import NextImage from 'next/image' // ⬅️ alias pour éviter le conflit
import { X, RotateCcw, Download, Loader2 } from 'lucide-react'

type TeeColor = 'black' | 'white' | 'gray' | 'red' | 'blue'
type TeeSize = 'S' | 'M' | 'L' | 'XL'

const COLOR_ASSETS: Record<TeeColor, string> = {
  black: '/tshirts/base/tee-black.png',
  white: '/tshirts/base/tee-white.png',
  gray:  '/tshirts/base/tee-gray.png',
  red:   '/tshirts/base/tee-red.png',
  blue:  '/tshirts/base/tee-blue.png',
}

// prix de base + options (ex: recto seulement)
const BASE_PRICE = 2500 // 25,00 €

// Helper pour charger une image côté client
function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new window.Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
    // si assets cross-origin, décommente:
    // img.crossOrigin = 'anonymous'
  })
}

export default function TeeConfigurator() {
  // ── ÉTATS CONFIG ──────────────────────────────────────────────────────────────
  const [color, setColor] = useState<TeeColor>('black')
  const [size, setSize] = useState<TeeSize>('M')
  const [text, setText] = useState('Multimédia services')
  const [textColor, setTextColor] = useState('#ffffff')
  const [fontFamily, setFontFamily] = useState('Inter, system-ui, sans-serif')
  const [fontSize, setFontSize] = useState(42)

  // logo uploadé (dataURL)
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null)
  const [logoScale, setLogoScale] = useState(1)
  const [logoRotation, setLogoRotation] = useState(0) // en degrés
  const [logoPos, setLogoPos] = useState({ x: 0.5, y: 0.45 }) // ratio (0..1)
  const [dragging, setDragging] = useState(false)

  const [busy, setBusy] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // ── GESTION DRAG SUR LE LOGO ─────────────────────────────────────────────────
  function canvasToLogoCoords(clientX: number, clientY: number) {
    const rect = canvasRef.current!.getBoundingClientRect()
    const x = (clientX - rect.left) / rect.width
    const y = (clientY - rect.top) / rect.height
    return { x: Math.min(1, Math.max(0, x)), y: Math.min(1, Math.max(0, y)) }
  }

  const onPointerDown = (e: React.PointerEvent) => {
    if (!logoDataUrl) return
    setDragging(true)
    ;(e.target as Element).setPointerCapture(e.pointerId)
  }
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging || !canvasRef.current) return
    const { x, y } = canvasToLogoCoords(e.clientX, e.clientY)
    setLogoPos({ x, y })
  }
  const onPointerUp = (e: React.PointerEvent) => {
    setDragging(false)
    ;(e.target as Element).releasePointerCapture(e.pointerId)
  }

  // pinch-zoom (mobile) simple via wheel sur desktop
  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const next = Math.min(3, Math.max(0.3, logoScale + (-e.deltaY * 0.001)))
    setLogoScale(next)
  }

  // ── RENDU CANVAS (aperçu exportable) ─────────────────────────────────────────
  useEffect(() => {
    let cancelled = false

    async function draw() {
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')!
      const W = 900, H = 900 // carré pour simplicité
      canvas.width = W
      canvas.height = H
      ctx.clearRect(0, 0, W, H)

      // fond
      ctx.fillStyle = '#f8fafc'
      ctx.fillRect(0, 0, W, H)

      // image base du tee
      try {
        const base = await loadImage(COLOR_ASSETS[color])
        if (cancelled) return

        // dessine tee centré
        const pad = 60
        const w = W - pad * 2
        const h = H - pad * 2
        ctx.drawImage(base, pad, pad, w, h)

        // texte
        ctx.save()
        ctx.fillStyle = textColor
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.font = `${fontSize}px ${fontFamily}`
        const textX = W / 2
        const textY = H * 0.33
        ctx.fillText(text, textX, textY)
        ctx.restore()

        // logo
        if (logoDataUrl) {
          const img = await loadImage(logoDataUrl)
          if (cancelled) return

          const max = W * 0.35
          const scaledW = img.width * logoScale
          const scaledH = img.height * logoScale
          const scaleToMax = Math.min(max / Math.max(scaledW, scaledH), 1)
          const finalW = scaledW * scaleToMax
          const finalH = scaledH * scaleToMax

          const cx = W * logoPos.x
          const cy = H * logoPos.y

          ctx.save()
          ctx.translate(cx, cy)
          ctx.rotate((logoRotation * Math.PI) / 180)
          ctx.drawImage(img, -finalW / 2, -finalH / 2, finalW, finalH)
          ctx.restore()
        }
      } catch (err) {
        console.error('Erreur chargement image', err)
      }
    }

    draw()
    return () => { cancelled = true }
  }, [color, text, textColor, fontFamily, fontSize, logoDataUrl, logoScale, logoRotation, logoPos])

  // ── UPLOAD LOGO ──────────────────────────────────────────────────────────────
  function onChooseFile() {
    fileInputRef.current?.click()
  }
  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    const reader = new FileReader()
    reader.onload = () => {
      setLogoDataUrl(reader.result as string)
    }
    reader.readAsDataURL(f)
  }

  // ── EXPORT PNG ───────────────────────────────────────────────────────────────
  function downloadPNG() {
    const url = canvasRef.current?.toDataURL('image/png')
    if (!url) return
    const a = document.createElement('a')
    a.href = url
    a.download = 'tshirt-config.png'
    a.click()
  }

  // ── PAIEMENT STRIPE (session + metadata config) ─────────────────────────────
  async function pay() {
    setBusy(true)
    try {
      // on n’envoie pas l’image b64 (trop volumineuse) — juste les paramètres
      const metadata = {
        color,
        size,
        text,
        textColor,
        fontFamily,
        fontSize: String(fontSize),
        hasLogo: String(!!logoDataUrl),
        logoScale: String(logoScale),
        logoRotation: String(logoRotation),
        logoPosX: String(logoPos.x),
        logoPosY: String(logoPos.y),
      }

      const res = await fetch('/api/checkout-custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'T-shirt personnalisé',
          price: BASE_PRICE,
          image: COLOR_ASSETS[color], // image vitrine
          metadata,
        }),
      })
      const { url } = await res.json()
      window.location.href = url
    } catch (e) {
      console.error(e)
      alert('Erreur paiement')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid lg:grid-cols-2 gap-8 items-start">
      {/* Aperçu */}
      <div
        ref={containerRef}
        className="bg-white rounded-2xl shadow p-4 md:p-6 w-full"
      >
        <div
          className="relative w-full aspect-square rounded-xl border border-gray-200 overflow-hidden touch-pan-y"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onWheel={onWheel}
        >
          {/* Canvas = rendu final */}
          <canvas ref={canvasRef} className="w-full h-full block" />
          {/* Hit overlay pour montrer qu’on peut drag */}
          {logoDataUrl && (
            <div className="absolute inset-0 pointer-events-none" />
          )}
        </div>

        <div className="flex gap-3 mt-4">
          <button
            onClick={downloadPNG}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border hover:bg-gray-50"
          >
            <Download className="w-4 h-4" /> Export PNG
          </button>
          <button
            onClick={() => {
              setLogoDataUrl(null)
              setLogoScale(1)
              setLogoRotation(0)
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border hover:bg-gray-50"
          >
            <RotateCcw className="w-4 h-4" /> Réinitialiser logo
          </button>
        </div>
      </div>

      {/* Contrôles */}
      <div className="bg-white rounded-2xl shadow p-4 md:p-6">
        {/* Couleur */}
        <div className="mb-6">
          <label className="block font-semibold mb-2">Couleur</label>
          <div className="flex gap-2">
            {Object.keys(COLOR_ASSETS).map((c) => (
              <button
                key={c}
                onClick={() => setColor(c as TeeColor)}
                className={`w-9 h-9 rounded-full border ${
                  color === c ? 'ring-2 ring-black' : ''
                }`}
                style={{
                  background:
                    c === 'black'
                      ? '#111'
                      : c === 'white'
                      ? '#fff'
                      : c === 'gray'
                      ? '#9ca3af'
                      : c === 'red'
                      ? '#ef4444'
                      : '#3b82f6',
                }}
                aria-label={c}
                title={c}
              />
            ))}
          </div>
        </div>

        {/* Taille */}
        <div className="mb-6">
          <label className="block font-semibold mb-2">Taille</label>
          <div className="flex gap-2">
            {(['S', 'M', 'L', 'XL'] as TeeSize[]).map((t) => (
              <button
                key={t}
                onClick={() => setSize(t)}
                className={`px-3 py-2 rounded-lg border text-sm ${
                  size === t ? 'bg-black text-white' : 'hover:bg-gray-50'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Texte */}
        <div className="mb-6">
          <label className="block font-semibold mb-2">Texte</label>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full border rounded-lg px-3 py-2"
            placeholder="Ton texte"
          />
          <div className="flex gap-3 mt-3">
            <div className="flex-1">
              <label className="block text-sm mb-1">Police</label>
              <select
                value={fontFamily}
                onChange={(e) => setFontFamily(e.target.value)}
                className="w-full border rounded-lg px-2 py-2"
              >
                <option value="Inter, system-ui, sans-serif">Inter / Sans</option>
                <option value="Georgia, serif">Georgia / Serif</option>
                <option value="'Courier New', monospace">Courier / Mono</option>
                <option value="'Impact', system-ui, sans-serif">Impact</option>
              </select>
            </div>
            <div>
              <label className="block text-sm mb-1">Taille</label>
              <input
                type="range"
                min={20}
                max={80}
                value={fontSize}
                onChange={(e) => setFontSize(parseInt(e.target.value))}
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Couleur</label>
              <input
                type="color"
                value={textColor}
                onChange={(e) => setTextColor(e.target.value)}
                className="w-10 h-10 p-0 border rounded"
              />
            </div>
          </div>
        </div>

        {/* Logo */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <label className="font-semibold">Logo (PNG/JPG)</label>
            {logoDataUrl && (
              <button
                onClick={() => setLogoDataUrl(null)}
                className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
              >
                <X className="w-4 h-4" /> Retirer
              </button>
            )}
          </div>

          {!logoDataUrl ? (
            <div className="border rounded-lg p-4 text-center">
              <input
                ref={fileInputRef}
                className="hidden"
                type="file"
                accept="image/*"
                onChange={onFile}
              />
              <button
                onClick={onChooseFile}
                className="px-4 py-2 rounded-lg border hover:bg-gray-50"
              >
                Choisir un fichier
              </button>
              <p className="text-xs text-gray-500 mt-2">
                Astuce : une image PNG avec fond transparent rend mieux.
              </p>
            </div>
          ) : (
            <div className="rounded-lg border p-3 flex items-center gap-3">
              <div className="relative w-16 h-16">
                <NextImage src={logoDataUrl} alt="logo" fill className="object-contain" />
              </div>
              <div className="flex-1 grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm mb-1">Taille</label>
                  <input
                    type="range"
                    min={0.3}
                    max={3}
                    step={0.05}
                    value={logoScale}
                    onChange={(e) => setLogoScale(parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Rotation</label>
                  <input
                    type="range"
                    min={-45}
                    max={45}
                    step={1}
                    value={logoRotation}
                    onChange={(e) => setLogoRotation(parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Position</label>
                  <p className="text-xs text-gray-500">
                    Glisse le logo directement sur l’aperçu.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Achat */}
        <div className="sticky bottom-0 bg-white pt-3">
          <div className="flex items-center justify-between">
            <div className="text-lg">
              Total : <span className="font-semibold">{(BASE_PRICE / 100).toFixed(2)} €</span>
            </div>
            <button
              onClick={pay}
              disabled={busy}
              className="bg-orange-500 text-black font-semibold px-6 py-3 rounded-xl hover:bg-orange-400 active:bg-orange-600 transition shadow-md disabled:opacity-70"
            >
              {busy ? <span className="inline-flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Redirection…</span> : '🛒 Acheter ce t-shirt'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
