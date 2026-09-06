export default function TopBar({ pageTitle, clockLabel, dateParts, isLocalMode = false }) {
  return (
    <header
      style={{
        minHeight: 'clamp(5.5rem, 9vh, 8.5rem)',
        padding: 'clamp(0.75rem, 1.2vw, 1.4rem) clamp(1rem, 1.6vw, 2rem)',
        display: 'grid',
        gridTemplateColumns: 'minmax(280px, 1fr) auto minmax(280px, 1fr)',
        gap: '1.2rem',
        alignItems: 'center',
      }}
    >
      <div style={{ minWidth: 0, display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
        <div
          style={{
            color: 'var(--board-text-primary)',
            fontWeight: 800,
            fontSize: 'clamp(1.8rem, 2.2vw, 3rem)',
            letterSpacing: '-0.02em',
            lineHeight: 1.1,
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis',
          }}
        >
          {pageTitle}
        </div>
        {isLocalMode && (
          <span
            className="edusign-badge badge-room"
            style={{
              fontSize: 'clamp(0.68rem, 0.8vw, 0.85rem)',
              opacity: 0.9,
              flexShrink: 0,
            }}
          >
            Local Demo
          </span>
        )}
      </div>

      <div
        style={{
          textAlign: 'center',
          fontWeight: 800,
          lineHeight: 1,
          fontSize: 'clamp(3.5rem, 5.2vw, 6.2rem)',
          letterSpacing: '-0.03em',
          color: 'var(--board-accent-primary)',
          fontVariantNumeric: 'tabular-nums',
          textShadow: '0 0 24px var(--board-accent-glow)',
        }}
      >
        {clockLabel}
      </div>

      <div style={{ textAlign: 'right' }}>
        <div
          style={{
            fontSize: 'clamp(1.4rem, 1.9vw, 2.2rem)',
            fontWeight: 700,
            lineHeight: 1.1,
            color: 'var(--board-text-primary)',
          }}
        >
          {dateParts.weekday}
        </div>
        <div
          style={{
            marginTop: '0.35rem',
            color: 'var(--board-text-secondary)',
            fontSize: 'clamp(1rem, 1.3vw, 1.6rem)',
            fontWeight: 600,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {dateParts.fullDate}
        </div>
      </div>
    </header>
  )
}
