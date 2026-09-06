function getToneDetails(tone) {
  if (tone === 'event') {
    return {
      className: 'tone-event',
      indicatorColor: 'var(--board-status-event-border)',
      badgeClass: 'badge-event',
      badgeLabel: 'Akce',
    }
  }
  if (tone === 'changed') {
    return {
      className: 'tone-changed',
      indicatorColor: 'var(--board-status-changed-border)',
      badgeClass: 'badge-changed',
      badgeLabel: 'Změna',
    }
  }
  return {
    className: '',
    indicatorColor: null,
    badgeClass: null,
    badgeLabel: null,
  }
}

function LessonEntry({ entry, compact = false, isCancelled = false }) {
  const rooms = (entry.metaLines ?? []).filter((l) => /^U\d|LAB|INF|Těl|Aul|Díl/i.test(l) || l.length <= 8)
  const teachers = (entry.metaLines ?? []).filter((l) => !rooms.includes(l))

  return (
    <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
      <div>
        {entry.kicker ? (
          <div
            style={{
              color: 'var(--board-accent-primary)',
              fontWeight: 800,
              fontSize: compact ? '0.62rem' : '0.74rem',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {entry.kicker}
          </div>
        ) : null}

        <div
          style={{
            marginTop: compact ? '0.1rem' : '0.18rem',
            fontWeight: 800,
            fontSize: compact ? 'clamp(0.85rem, 0.95vw, 1.15rem)' : 'clamp(1rem, 1.15vw, 1.55rem)',
            lineHeight: 1.14,
            color: isCancelled ? 'var(--board-status-cancelled-text)' : 'var(--board-text-primary)',
            textDecoration: isCancelled ? 'line-through' : 'none',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {entry.title}
        </div>
      </div>

      <div style={{ marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'nowrap', overflow: 'hidden' }}>
        {teachers.length > 0 && (
          <span
            style={{
              color: 'var(--board-text-secondary)',
              fontSize: compact ? 'clamp(0.65rem, 0.72vw, 0.88rem)' : 'clamp(0.74rem, 0.82vw, 1rem)',
              fontWeight: 600,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              flex: 1,
            }}
          >
            {teachers.join(', ')}
          </span>
        )}

        {rooms.length > 0 && (
          <span
            className="edusign-badge badge-room"
            style={{
              fontSize: compact ? '0.62rem' : '0.74rem',
              padding: '0.12rem 0.45rem',
              fontWeight: 800,
              flexShrink: 0,
            }}
          >
            {rooms.join(', ')}
          </span>
        )}
      </div>
    </div>
  )
}

export default function LessonCard({ cell }) {
  if (!cell || cell.layout === 'blank') {
    return (
      <div
        style={{
          height: '100%',
          borderRadius: 'var(--board-radius-medium)',
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px dashed var(--board-border)',
        }}
      />
    )
  }

  const isCancelled = cell.tone === 'empty'
  const toneDetails = getToneDetails(cell.tone)
  const isSplit = cell.layout === 'split'

  return (
    <article
      className={`edusign-card ${toneDetails.className}`}
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {toneDetails.indicatorColor && (
        <div
          style={{
            height: '4px',
            width: '100%',
            background: toneDetails.indicatorColor,
            flexShrink: 0,
          }}
        />
      )}

      <div
        style={{
          padding: isSplit ? '0.4rem 0.6rem' : '0.55rem 0.75rem',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        {toneDetails.badgeLabel && (
          <div style={{ marginBottom: '0.25rem' }}>
            <span
              className={`edusign-badge ${toneDetails.badgeClass}`}
              style={{ fontSize: '0.62rem', padding: '0.1rem 0.45rem' }}
            >
              {toneDetails.badgeLabel}
            </span>
          </div>
        )}

        {isSplit ? (
          <div style={{ display: 'grid', gridTemplateRows: '1fr 1fr', gap: '0.4rem', height: '100%' }}>
            {cell.entries.map((entry, idx) => (
              <div
                key={idx}
                style={{
                  borderTop: idx > 0 ? '1px dashed var(--board-border)' : 'none',
                  paddingTop: idx > 0 ? '0.35rem' : '0',
                }}
              >
                <LessonEntry entry={entry} compact isCancelled={isCancelled} />
              </div>
            ))}
          </div>
        ) : (
          cell.entries.map((entry, idx) => (
            <LessonEntry key={idx} entry={entry} isCancelled={isCancelled} />
          ))
        )}
      </div>
    </article>
  )
}
