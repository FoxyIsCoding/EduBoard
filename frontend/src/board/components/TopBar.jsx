export default function TopBar({ pageTitle, clockLabel, dateParts, isLocalMode = false, isOffline = false }) {
  // Czech academic calendar: determine even (sudý) or odd (lichý) week
  const now = new Date()
  const startOfYear = new Date(now.getFullYear(), 0, 1)
  const weekNum = Math.ceil(((now - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7)
  const isEvenWeek = weekNum % 2 === 0
  const weekLabel = isEvenWeek ? 'Sudý týden' : 'Lichý týden'

  return (
    <header className="edupage-topbar">
      {/* Left Column: View Title */}
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div
          style={{
            fontSize: 'clamp(1.4rem, 1.9vw, 2.4rem)',
            fontWeight: 900,
            letterSpacing: '-0.02em',
            color: 'var(--kiosk-text-primary)',
            lineHeight: 1.1,
          }}
        >
          {pageTitle}
        </div>
        {isLocalMode && (
          <span style={{ fontSize: '0.72rem', color: 'var(--kiosk-brand-blue)', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase', marginTop: '0.15rem' }}>
            Demo Mode
          </span>
        )}
        {!isLocalMode && isOffline && (
          <span style={{ fontSize: '0.72rem', color: '#B91C1C', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase', marginTop: '0.15rem' }}>
            Offline Mode
          </span>
        )}
      </div>

      {/* Center Column: Large Authoritative Digital Clock */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            fontSize: 'clamp(2.6rem, 3.8vw, 4.6rem)',
            fontWeight: 900,
            letterSpacing: '-0.02em',
            color: 'var(--kiosk-text-primary)',
            fontVariantNumeric: 'tabular-nums',
            lineHeight: 1,
          }}
        >
          {clockLabel}
        </div>
      </div>

      {/* Right Column: Date, Czech Weekday & School Week Type */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          justifyContent: 'center',
          gap: '0.2rem',
        }}
      >
        <div
          style={{
            fontSize: 'clamp(1.15rem, 1.45vw, 1.7rem)',
            fontWeight: 800,
            color: 'var(--kiosk-text-primary)',
            lineHeight: 1.15,
          }}
        >
          {dateParts.weekday}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span
            style={{
              fontSize: 'clamp(0.85rem, 1.05vw, 1.25rem)',
              color: 'var(--kiosk-text-secondary)',
              fontWeight: 700,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {dateParts.fullDate}
          </span>

          <span
            style={{
              padding: '0.12rem 0.45rem',
              borderRadius: 'var(--kiosk-radius-sm)',
              background: 'var(--kiosk-header-bg)',
              border: '1px solid var(--kiosk-grid-border)',
              color: 'var(--kiosk-text-secondary)',
              fontSize: 'clamp(0.68rem, 0.75vw, 0.85rem)',
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
