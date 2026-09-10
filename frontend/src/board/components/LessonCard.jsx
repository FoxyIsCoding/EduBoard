function LessonEntry({ entry, compact = false, isCancelled = false, isChanged = false }) {
  const rooms = (entry.metaLines ?? []).filter((l) => /^U\d|LAB|INF|Těl|Aul|Díl/i.test(l) || l.length <= 8)
  const teachers = (entry.metaLines ?? []).filter((l) => !rooms.includes(l))

  return (
    <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
      <div>
        {entry.kicker && (
          <div
            style={{
              color: isChanged ? 'var(--kiosk-status-changed-text)' : 'var(--kiosk-brand-blue)',
              fontWeight: 800,
              fontSize: compact ? '0.62rem' : '0.72rem',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {entry.kicker}
          </div>
        )}

        <div
          style={{
            marginTop: compact ? '0.04rem' : '0.12rem',
            fontWeight: 900,
            fontSize: compact ? 'clamp(0.85rem, 1vw, 1.15rem)' : 'clamp(1.05rem, 1.25vw, 1.55rem)',
            lineHeight: 1.15,
            color: isCancelled
              ? 'var(--kiosk-status-cancelled-text)'
              : isChanged
                ? 'var(--kiosk-status-changed-text)'
                : 'var(--kiosk-text-primary)',
            textDecoration: isCancelled ? 'line-through' : 'none',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {entry.title}
        </div>
      </div>

      <div
        style={{
          marginTop: '0.2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.3rem',
          overflow: 'hidden',
        }}
      >
        <span
          style={{
            color: 'var(--kiosk-text-secondary)',
            fontSize: compact ? 'clamp(0.68rem, 0.76vw, 0.9rem)' : 'clamp(0.78rem, 0.88vw, 1.05rem)',
            fontWeight: 700,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            flex: 1,
          }}
        >
          {teachers.join(', ')}
        </span>

        {rooms.length > 0 && (
          <span
            className="edupage-badge badge-room"
            style={{
              fontSize: compact ? '0.64rem' : '0.76rem',
              padding: '0.12rem 0.4rem',
              fontWeight: 900,
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

export default function LessonCard({ cell, isActive = false }) {
  if (!cell || cell.layout === 'blank') {
    return (
      <div
        className="edupage-card"
        style={{
          height: '100%',
          background: 'var(--kiosk-card-empty)',
          borderStyle: 'dashed',
        }}
      />
    )
  }

  const isChanged = cell.tone === 'changed'
  const isCancelled = cell.tone === 'empty'
  const isEvent = cell.tone === 'event'
  const isSplit = cell.layout === 'split'

  let modifierClass = ''
  if (isCancelled) modifierClass = 'is-cancelled'
  else if (isChanged) modifierClass = 'is-changed'
  else if (isEvent) modifierClass = 'is-event'
  else if (isActive) modifierClass = 'is-active-period-cell'

  return (
    <article
      className={`edupage-card ${modifierClass}`}
      style={{
        height: '100%',
        padding: isSplit ? '0.35rem 0.5rem' : '0.55rem 0.75rem',
        justifyContent: 'space-between',
      }}
    >
      {/* Top Status Header if cancelled or changed */}
      {(isChanged || isCancelled || isEvent) && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.15rem' }}>
          <span
            className={`edupage-badge ${
              isCancelled
                ? 'badge-cancelled'
                : isChanged
                  ? 'badge-changed'
                  : 'badge-event'
            }`}
            style={{ fontSize: '0.62rem', padding: '0.1rem 0.38rem' }}
          >
            {isCancelled ? 'Odpadá' : isChanged ? 'Změna' : 'Akce'}
          </span>
        </div>
      )}

      {isSplit ? (
        <div style={{ display: 'grid', gridTemplateRows: '1fr 1fr', gap: '0.35rem', height: '100%' }}>
          {cell.entries.map((entry, idx) => (
            <div
              key={idx}
              style={{
                borderTop: idx > 0 ? '1px dashed var(--kiosk-grid-border)' : 'none',
                paddingTop: idx > 0 ? '0.25rem' : '0',
              }}
            >
              <LessonEntry
                entry={entry}
                compact
                isCancelled={isCancelled}
                isChanged={isChanged}
              />
            </div>
          ))}
        </div>
      ) : (
        cell.entries.map((entry, idx) => (
          <LessonEntry
            key={idx}
            entry={entry}
            isCancelled={isCancelled}
            isChanged={isChanged}
          />
        ))
      )}
    </article>
  )
}
