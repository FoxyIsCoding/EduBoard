function LessonEntry({ entry, compact = false, isCancelled = false, isChanged = false }) {
  const rooms = (entry.metaLines ?? []).filter((l) => /^U\d|LAB|INF|Těl|Aul|Díl/i.test(l) || l.length <= 8)
  const teachers = (entry.metaLines ?? []).filter((l) => !rooms.includes(l))

  return (
    <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
      <div>
        {entry.kicker && (
          <div
            style={{
              color: isChanged ? 'var(--kiosk-amber-text)' : 'var(--kiosk-primary)',
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
        )}

        <div
          style={{
            marginTop: compact ? '0.05rem' : '0.15rem',
            fontWeight: 900,
            fontSize: compact ? 'clamp(0.88rem, 1vw, 1.18rem)' : 'clamp(1.05rem, 1.25vw, 1.6rem)',
            lineHeight: 1.15,
            color: isCancelled
              ? 'var(--kiosk-rose-text)'
              : isChanged
                ? 'var(--kiosk-amber-text)'
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
          marginTop: '0.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.35rem',
          overflow: 'hidden',
        }}
      >
        <span
          style={{
            color: 'var(--kiosk-text-secondary)',
            fontSize: compact ? 'clamp(0.68rem, 0.76vw, 0.92rem)' : 'clamp(0.78rem, 0.88vw, 1.05rem)',
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
            className="kiosk-pill pill-room"
            style={{
              fontSize: compact ? '0.62rem' : '0.74rem',
              padding: '0.12rem 0.42rem',
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
        style={{
          height: '100%',
          borderRadius: 'var(--kiosk-radius-lg)',
          background: 'var(--kiosk-card-subtle)',
          border: '1.5px dashed var(--kiosk-border-subtle)',
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
  else if (isChanged) modifierClass = 'is-substitution'
  else if (isEvent) modifierClass = 'is-event'
  else if (isActive) modifierClass = 'is-active-period'

  return (
    <article
      className={`kiosk-module ${modifierClass}`}
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Top Status Accent Bar */}
      {(isChanged || isCancelled || isEvent) && (
        <div
          style={{
            height: '4px',
            width: '100%',
            background: isCancelled
              ? 'var(--kiosk-rose)'
              : isChanged
                ? 'var(--kiosk-amber)'
                : 'var(--kiosk-primary)',
            flexShrink: 0,
          }}
        />
      )}

      <div
        style={{
          padding: isSplit ? '0.4rem 0.6rem' : '0.6rem 0.8rem',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        {/* Status Tag Header if modified */}
        {(isChanged || isCancelled || isEvent) && (
          <div style={{ marginBottom: '0.2rem' }}>
            <span
              className={`kiosk-pill ${
                isCancelled
                  ? 'pill-rose'
                  : isChanged
                    ? 'pill-amber'
                    : 'pill-primary'
              }`}
              style={{ fontSize: '0.62rem', padding: '0.1rem 0.42rem' }}
            >
              {isCancelled ? 'Odpadá' : isChanged ? 'Změna' : 'Akce'}
            </span>
          </div>
        )}

        {isSplit ? (
          <div style={{ display: 'grid', gridTemplateRows: '1fr 1fr', gap: '0.4rem', height: '100%' }}>
            {cell.entries.map((entry, idx) => (
              <div
                key={idx}
                style={{
                  borderTop: idx > 0 ? '1px dashed var(--kiosk-border)' : 'none',
                  paddingTop: idx > 0 ? '0.3rem' : '0',
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
      </div>
    </article>
  )
}
