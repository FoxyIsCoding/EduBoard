import { LayoutDashboard } from 'lucide-react'

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
        minHeight: 'clamp(5rem, 8vh, 7.2rem)',
        padding: 'clamp(0.55rem, 0.9vw, 1rem) clamp(1rem, 1.8vw, 2.2rem)',
        display: 'grid',
        gridTemplateColumns: 'minmax(280px, 1.2fr) auto minmax(280px, 1.2fr)',
        gap: '1.2rem',
        alignItems: 'center',
      }}
    >
      {/* Left Column: Brand, Status, & Active Page Title */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              color: 'var(--kiosk-primary)',
              fontWeight: 900,
              fontSize: 'clamp(1rem, 1.25vw, 1.4rem)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            <LayoutDashboard size={22} color="var(--kiosk-primary)" />
            <span style={{ color: 'var(--kiosk-text-primary)' }}>EduBoard</span>
          </div>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.18rem 0.55rem',
              borderRadius: 'var(--kiosk-radius-pill)',
              background: 'var(--kiosk-emerald-subtle)',
              border: '1px solid var(--kiosk-emerald-border)',
              color: 'var(--kiosk-emerald-text)',
              fontSize: 'clamp(0.7rem, 0.78vw, 0.85rem)',
              fontWeight: 800,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}
          >
            <span className="kiosk-live-dot" />
            <span>Informační systém</span>
          </div>

          {isLocalMode && (
            <span
              className="kiosk-pill pill-room"
              style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem' }}
            >
              Demo Mode
            </span>
          )}
        </div>

        <div
          style={{
            fontSize: 'clamp(1.55rem, 2.1vw, 2.6rem)',
            fontWeight: 900,
            letterSpacing: '-0.025em',
            lineHeight: 1.1,
            color: 'var(--kiosk-text-primary)',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis',
          }}
        >
          {pageTitle}
        </div>
      </div>

      {/* Center Column: Giant Digital Clock */}
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
            fontSize: 'clamp(3.5rem, 5.5vw, 6.4rem)',
            fontWeight: 900,
            lineHeight: 0.95,
            letterSpacing: '-0.03em',
            color: 'var(--kiosk-text-primary)',
            fontVariantNumeric: 'tabular-nums',
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
          gap: '0.25rem',
        }}
      >
        <div
          style={{
            fontSize: 'clamp(1.4rem, 1.95vw, 2.3rem)',
            fontWeight: 900,
            lineHeight: 1.1,
            color: 'var(--kiosk-text-primary)',
            letterSpacing: '-0.01em',
          }}
        >
          {dateParts.weekday}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
          <span
            style={{
              fontSize: 'clamp(0.92rem, 1.15vw, 1.35rem)',
              color: 'var(--kiosk-text-secondary)',
              fontWeight: 700,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {dateParts.fullDate}
          </span>

          <span
            style={{
              padding: '0.15rem 0.5rem',
              borderRadius: 'var(--kiosk-radius-pill)',
              background: 'var(--kiosk-card-subtle)',
              border: '1px solid var(--kiosk-border)',
              color: 'var(--kiosk-text-secondary)',
              fontSize: 'clamp(0.68rem, 0.78vw, 0.85rem)',
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
