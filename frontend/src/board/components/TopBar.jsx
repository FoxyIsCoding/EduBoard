import { LayoutDashboard, Radio } from 'lucide-react'

export default function TopBar({ pageTitle, clockLabel, dateParts, isLocalMode = false }) {
  // Determine if current week is even (sudý) or odd (lichý) for Czech school calendar
  const now = new Date()
  const startOfYear = new Date(now.getFullYear(), 0, 1)
  const weekNum = Math.ceil(((now - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7)
  const isEvenWeek = weekNum % 2 === 0
  const weekLabel = isEvenWeek ? 'Sudý týden' : 'Lichý týden'

  return (
    <header
      style={{
        minHeight: 'clamp(5.2rem, 8.5vh, 7.8rem)',
        padding: 'clamp(0.6rem, 1vw, 1.2rem) clamp(1rem, 1.8vw, 2.4rem)',
        display: 'grid',
        gridTemplateColumns: 'minmax(280px, 1.2fr) auto minmax(280px, 1.2fr)',
        gap: '1.2rem',
        alignItems: 'center',
      }}
    >
      {/* Left Column: Brand & Active Screen Pill */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: 'var(--kiosk-cyan)',
              fontWeight: 900,
              fontSize: 'clamp(1rem, 1.3vw, 1.5rem)',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
            }}
          >
            <LayoutDashboard size={22} style={{ filter: 'drop-shadow(0 0 8px var(--kiosk-cyan-glow))' }} />
            <span>EduBoard</span>
          </div>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.2rem 0.65rem',
              borderRadius: 'var(--kiosk-radius-pill)',
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: 'var(--kiosk-emerald)',
              fontSize: 'clamp(0.7rem, 0.8vw, 0.88rem)',
              fontWeight: 800,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}
          >
            <span className="kiosk-pulse-dot" />
            <span>Informační systém</span>
          </div>

          {isLocalMode && (
            <span
              className="kiosk-pill pill-room"
              style={{ fontSize: '0.7rem', opacity: 0.9 }}
            >
              Demo Mode
            </span>
          )}
        </div>

        <div
          style={{
            fontSize: 'clamp(1.6rem, 2.2vw, 2.8rem)',
            fontWeight: 900,
            letterSpacing: '-0.025em',
            lineHeight: 1.1,
            color: 'var(--kiosk-text-white)',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis',
          }}
        >
          {pageTitle}
        </div>
      </div>

      {/* Center Column: Huge Digital Clock */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            fontSize: 'clamp(3.6rem, 5.8vw, 6.8rem)',
            fontWeight: 900,
            lineHeight: 0.95,
            letterSpacing: '-0.03em',
            color: 'var(--kiosk-cyan)',
            fontVariantNumeric: 'tabular-nums',
            textShadow: '0 0 28px var(--kiosk-cyan-glow)',
          }}
        >
          {clockLabel}
        </div>
      </div>

      {/* Right Column: Weekday, Date & School Week Type */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          justifyContent: 'center',
          gap: '0.35rem',
        }}
      >
        <div
          style={{
            fontSize: 'clamp(1.5rem, 2.1vw, 2.5rem)',
            fontWeight: 900,
            lineHeight: 1.1,
            color: 'var(--kiosk-text-white)',
            letterSpacing: '-0.01em',
          }}
        >
          {dateParts.weekday}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span
            style={{
              fontSize: 'clamp(0.95rem, 1.25vw, 1.5rem)',
              color: 'var(--kiosk-text-secondary)',
              fontWeight: 700,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {dateParts.fullDate}
          </span>

          <span
            style={{
              padding: '0.15rem 0.55rem',
              borderRadius: 'var(--kiosk-radius-pill)',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid var(--kiosk-border)',
              color: 'var(--kiosk-text-secondary)',
              fontSize: 'clamp(0.7rem, 0.8vw, 0.88rem)',
              fontWeight: 700,
              letterSpacing: '0.04em',
            }}
          >
            {weekLabel}
          </span>
        </div>
      </div>
    </header>
  )
}
