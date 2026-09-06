import { Globe } from 'lucide-react'

export default function BrowserView({ url }) {
  if (!url) {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'grid',
          placeItems: 'center',
          background: 'var(--kiosk-bg)',
        }}
      >
        <div
          className="edupage-card"
          style={{
            padding: '3rem 4rem',
            textAlign: 'center',
            maxWidth: '600px',
            background: 'var(--kiosk-card-bg)',
          }}
        >
          <Globe size={48} color="var(--kiosk-brand-blue)" style={{ margin: '0 auto 1.2rem' }} />
          <h2 style={{ margin: 0, fontSize: '2rem', fontWeight: 900, color: 'var(--kiosk-text-primary)' }}>
            Režim Webové Stránky
          </h2>
          <p style={{ marginTop: '0.8rem', color: 'var(--kiosk-text-secondary)', fontSize: '1.1rem' }}>
            V administraci (<code>/admin</code>) zadejte platnou URL adresu pro promítnutí na obrazovku.
          </p>
        </div>
      </div>
    )
  }

  // Handle YouTube watch URLs to embed URLs automatically
  let embedUrl = url
  if (url.includes('youtube.com/watch?v=')) {
    const videoId = url.split('v=')[1]?.split('&')[0]
    if (videoId) embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1`
  } else if (url.includes('youtu.be/')) {
    const videoId = url.split('youtu.be/')[1]?.split('?')[0]
    if (videoId) embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1`
  }

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        background: '#FFFFFF',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: '0.8rem',
          right: '1rem',
          zIndex: 100,
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.4rem',
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(6px)',
          color: '#FFFFFF',
          padding: '0.25rem 0.75rem',
          borderRadius: 'var(--kiosk-radius-pill)',
          fontSize: '0.78rem',
          fontWeight: 700,
          pointerEvents: 'none',
        }}
      >
        <Globe size={14} color="#38BDF8" />
        <span>Vysílání z webu</span>
      </div>

      <iframe
        src={embedUrl}
        title="EduBoard Web View"
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          flex: 1,
        }}
        allow="autoplay; encrypted-media; fullscreen"
        sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-presentation"
      />
    </div>
  )
}
