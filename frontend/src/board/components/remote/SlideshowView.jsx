import { useState, useEffect } from 'react'
import { Image as ImageIcon } from 'lucide-react'

export default function SlideshowView({
  images = [],
  intervalMs = 8000,
  transition = 'fade',
  fit = 'contain',
  zoom = 100,
  showCaptions = true,
}) {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    if (!images || images.length <= 1) return
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length)
    }, intervalMs || 8000)
    return () => clearInterval(timer)
  }, [images, intervalMs])

  if (!images || images.length === 0) {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'grid',
          placeItems: 'center',
          background: '#000000',
        }}
      >
        <div
          className="edupage-card"
          style={{
            padding: '3rem 4rem',
            textAlign: 'center',
            maxWidth: '600px',
            background: '#0F172A',
          }}
        >
          <ImageIcon size={48} color="#38BDF8" style={{ margin: '0 auto 1.2rem' }} />
          <h2 style={{ margin: 0, fontSize: '2rem', fontWeight: 900, color: '#F8FAFC' }}>
            Režim Prezentace Fotografií
          </h2>
          <p style={{ marginTop: '0.8rem', color: '#94A3B8', fontSize: '1.1rem' }}>
            V administraci (<code>/admin</code>) nahrajte fotografie pro spuštění školní prezentace.
          </p>
        </div>
      </div>
    )
  }

  const currentSlide = images[currentIndex] || images[0]
  const zoomScale = Math.min(Math.max(Number(zoom) || 100, 100), 300) / 100
  const showChrome = showCaptions !== false
  const activeTransition = transition || 'fade'

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        background: '#000000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      {/* Zoom wrapper: scales/crops the slide; the transition animation runs on the img */}
      <div
        style={{
          width: '100%',
          height: '100%',
          transform: `scale(${zoomScale})`,
        }}
      >
        <img
          key={currentSlide.id || currentIndex}
          className={`slide-anim slide-anim-${activeTransition}`}
          src={currentSlide.url}
          alt={currentSlide.caption || 'Prezentace'}
          style={{
            width: '100%',
            height: '100%',
            objectFit: fit || 'contain',
            display: 'block',
          }}
        />
      </div>

      {showChrome && currentSlide.caption && (
        <div
          style={{
            position: 'absolute',
            bottom: '2rem',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(8px)',
            color: '#FFFFFF',
            padding: '0.6rem 1.6rem',
            borderRadius: 'var(--kiosk-radius-pill)',
            fontSize: 'clamp(1.1rem, 1.5vw, 1.8rem)',
            fontWeight: 800,
            letterSpacing: '0.02em',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
            maxWidth: '85%',
            textAlign: 'center',
          }}
        >
          {currentSlide.caption}
        </div>
      )}

      {showChrome && images.length > 1 && (
        <div
          style={{
            position: 'absolute',
            top: '1.2rem',
            right: '1.5rem',
            display: 'flex',
            gap: '0.4rem',
            background: 'rgba(0, 0, 0, 0.5)',
            padding: '0.35rem 0.75rem',
            borderRadius: 'var(--kiosk-radius-pill)',
          }}
        >
          <span style={{ color: '#FFFFFF', fontSize: '0.85rem', fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>
            {currentIndex + 1} / {images.length}
          </span>
        </div>
      )}
    </div>
  )
}