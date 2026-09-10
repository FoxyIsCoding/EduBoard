import { useRef, useEffect } from 'react'
import { Cast, Radio } from 'lucide-react'

export default function ScreenCastView({ stream }) {
  const videoRef = useRef(null)

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream
    }
  }, [stream])

  if (!stream) {
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
            maxWidth: '620px',
            background: 'var(--kiosk-card-bg)',
          }}
        >
          <Cast size={52} color="var(--kiosk-brand-blue)" style={{ margin: '0 auto 1.2rem' }} />
          <h2 style={{ margin: 0, fontSize: '2.1rem', fontWeight: 900, color: 'var(--kiosk-text-primary)' }}>
            Bezdrátové Promítání Obrazovky
          </h2>
          <p style={{ marginTop: '0.8rem', color: 'var(--kiosk-text-secondary)', fontSize: '1.15rem' }}>
            Čekání na zahájení přenosu. Na svém zařízení otevřete administraci (<code>/admin</code>) a klikněte na <strong>Sdílet obrazovku</strong>.
          </p>
        </div>
      </div>
    )
  }

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
      <div
        style={{
          position: 'absolute',
          top: '1rem',
          right: '1.5rem',
          zIndex: 50,
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.45rem',
          background: '#DC2626',
          color: '#FFFFFF',
          padding: '0.3rem 0.8rem',
          borderRadius: 'var(--kiosk-radius-pill)',
          fontSize: '0.82rem',
          fontWeight: 900,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          boxShadow: '0 2px 10px rgba(220, 38, 38, 0.4)',
        }}
      >
        <Radio size={16} />
        <span>Živé vysílání obrazovky</span>
      </div>

      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
        }}
      />
    </div>
  )
}
