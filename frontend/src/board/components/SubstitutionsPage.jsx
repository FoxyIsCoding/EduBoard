function SubstitutionCard({ item, compact = false }) {
  const isCancelled = item.state === 'cancelled'
  const stateColor = isCancelled ? 'var(--md-sys-color-error)' : 'var(--md-sys-color-tertiary)'
  const stateOnColor = isCancelled ? 'var(--md-sys-color-on-error)' : 'var(--md-sys-color-on-tertiary)'
  const containerColor = isCancelled
    ? 'rgba(255, 180, 171, 0.12)'
    : 'rgba(201, 198, 220, 0.12)'

  return (
    <md-outlined-card
      style={{
        '--md-outlined-card-container-color': containerColor,
        '--md-outlined-card-outline-color': isCancelled ? 'rgba(255, 180, 171, 0.35)' : 'rgba(201, 198, 220, 0.35)',
        borderRadius: 'var(--board-shape-medium)',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <div
        style={{
          height: compact ? '4px' : '6px',
          width: '100%',
          background: stateColor,
        }}
      />
      <div style={{ padding: compact ? '0.75rem 1rem' : '1.5rem 1.8rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: compact ? '0.4rem' : '0.8rem' }}>
          <div
            style={{
              fontSize: compact ? '0.72rem' : '1.1rem',
              fontWeight: 700,
              color: 'var(--md-sys-color-primary)',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}
          >
            {item.className} • {item.periodShort}. hod
          </div>
          <span
            style={{
              fontSize: compact ? '0.62rem' : '0.9rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              padding: compact ? '0.15rem 0.5rem' : '0.25rem 0.8rem',
              borderRadius: '999px',
              background: stateColor,
              color: stateOnColor,
              letterSpacing: '0.05em',
            }}
          >
            {isCancelled ? 'Zrušeno' : 'Změna'}
          </span>
        </div>

        <div
          style={{
            fontSize: compact ? 'clamp(1.1rem, 1.3vw, 1.6rem)' : 'clamp(1.8rem, 2.8vw, 3.2rem)',
            fontWeight: 800,
            lineHeight: 1.1,
            marginBottom: compact ? '0.4rem' : '1.2rem',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {item.subjectLabel}
        </div>

        <div
          style={{
            marginTop: 'auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: compact ? '0.4rem' : '1rem',
            fontSize: compact ? 'clamp(0.75rem, 0.85vw, 1rem)' : 'clamp(1.1rem, 1.4vw, 1.6rem)',
            color: 'var(--md-sys-color-on-surface-variant)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: compact ? '0.3rem' : '0.6rem', overflow: 'hidden' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '1.2em', opacity: 0.8 }}>schedule</span>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.periodTime}</span>
          </div>
          {item.roomLabel && (
            <div style={{ display: 'flex', alignItems: 'center', gap: compact ? '0.3rem' : '0.6rem', overflow: 'hidden' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '1.2em', opacity: 0.8 }}>location_on</span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.roomLabel}</span>
            </div>
          )}
          {item.teacherLabel && (
            <div style={{ display: 'flex', alignItems: 'center', gap: compact ? '0.3rem' : '0.6rem', overflow: 'hidden', gridColumn: 'span 2' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '1.2em', opacity: 0.8 }}>person</span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.teacherLabel}</span>
            </div>
          )}
          {item.groupLabel && (
            <div style={{ display: 'flex', alignItems: 'center', gap: compact ? '0.3rem' : '0.6rem', overflow: 'hidden', gridColumn: 'span 2' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '1.2em', opacity: 0.8 }}>group</span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.groupLabel}</span>
            </div>
          )}
        </div>
      </div>
    </md-outlined-card>
  )
}

export default function SubstitutionsPage({ substitutions }) {
  if (!substitutions.length) {
    return (
      <div style={{ height: '100%', display: 'grid', placeItems: 'center' }}>
        <md-filled-tonal-card
          style={{
            padding: '2.5rem 3rem',
            borderRadius: '24px',
            textAlign: 'center',
            background: 'var(--md-sys-color-surface-container-high)',
            maxWidth: '600px',
          }}
        >
          <div style={{ fontSize: '5rem', marginBottom: '1.5rem' }}>🎉</div>
          <h3 style={{ margin: 0, fontSize: '2.6rem', fontWeight: 800, color: 'var(--md-sys-color-primary)' }}>Bez suplování</h3>
          <p
            style={{
              margin: '1.2rem 0 0',
              color: 'var(--md-sys-color-on-surface-variant)',
              fontSize: '1.4rem',
              lineHeight: 1.5,
            }}
          >
            V aktuálním rozvrhu nejsou evidované žádné změny hodin. Užijte si klidný den!
          </p>
        </md-filled-tonal-card>
      </div>
    )
  }

  const count = substitutions.length
  const compact = count > 4

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'grid',
        gridTemplateColumns: count === 1 ? '1fr' : 'repeat(2, 1fr)',
        gridAutoRows: '1fr',
        gap: 'var(--board-kiosk-gap)',
      }}
    >
      {substitutions.map((item) => (
        <SubstitutionCard key={item.key} item={item} compact={compact} />
      ))}
    </div>
  )
}
