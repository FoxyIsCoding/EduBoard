import { AlertTriangle } from 'lucide-react'

export default function AlertBannerView({ message = '', level = 'critical' }) {
  const isCritical = level === 'critical'
  const bgColor = isCritical ? '#DC2626' : '#D97706'

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: bgColor,
        color: '#FFFFFF',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'clamp(2rem, 5vw, 6rem)',
        textAlign: 'center',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: '96px',
          height: '96px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.2)',
          display: 'grid',
          placeItems: 'center',
          marginBottom: '2rem',
        }}
      >
        <AlertTriangle size={56} color="#FFFFFF" />
      </div>

      <div
        style={{
          fontSize: 'clamp(1.5rem, 2.5vw, 3.2rem)',
          fontWeight: 900,
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          marginBottom: '1rem',
          opacity: 0.95,
        }}
      >
        Mimořádné Hlášení
      </div>

      <h1
        style={{
          margin: 0,
          fontSize: 'clamp(2.4rem, 4.8vw, 5.8rem)',
          fontWeight: 900,
          lineHeight: 1.15,
          letterSpacing: '-0.02em',
          maxWidth: '1200px',
        }}
      >
        {message || 'POZOR: Probíhá bezpečnostní cvičení.'}
      </h1>

      <div
        style={{
          marginTop: '3rem',
          fontSize: 'clamp(1.1rem, 1.6vw, 1.8rem)',
          fontWeight: 700,
          opacity: 0.85,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
        }}
      >
        Vydáno vedením školy
      </div>
    </div>
  )
}
