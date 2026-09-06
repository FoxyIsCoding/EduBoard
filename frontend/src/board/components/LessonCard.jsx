function toneStyle(tone) {
  if (tone === 'event') {
    return {
      borderColor: 'rgba(34, 197, 94, 0.85)',
      background: 'rgba(22, 163, 74, 0.1)',
      badgeBg: 'rgba(22, 163, 74, 0.22)',
      badgeColor: 'var(--md-sys-color-badge-success)',
      rail: '#2cd67b',
    }
  }
  if (tone === 'changed') {
    return {
      borderColor: 'rgba(251, 191, 36, 0.88)',
      background: 'rgba(245, 158, 11, 0.12)',
      badgeBg: 'rgba(245, 158, 11, 0.24)',
      badgeColor: 'var(--md-sys-color-badge-warning)',
      rail: '#ffb020',
    }
  }
  return { borderColor: 'var(--board-border-subtle)', background: 'var(--md-sys-color-surface-container-high)' }
}

function LessonEntry({ entry, compact = false }) {
  return (
    <div style={{ minWidth: 0 }}>
      {entry.kicker ? (
        <div
          style={{
            color: 'var(--md-sys-color-primary)',
            fontWeight: 700,
            fontSize: compact ? '0.62rem' : '0.74rem',
            letterSpacing: '0.08em',
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
          marginTop: compact ? '0.1rem' : '0.2rem',
          fontWeight: 800,
          fontSize: compact ? 'clamp(0.82rem, 0.9vw, 1.06rem)' : 'clamp(0.95rem, 1.05vw, 1.42rem)',
          lineHeight: compact ? 1.08 : 1.15,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {entry.title}
      </div>
      {(entry.metaLines ?? []).slice(0, compact ? 1 : 2).map((line, index) => (
        <div
          key={`${line}-${index}`}
          style={{
            marginTop: compact ? '0.06rem' : '0.12rem',
            color: 'var(--md-sys-color-on-surface-variant)',
            fontSize: compact ? 'clamp(0.64rem, 0.68vw, 0.86rem)' : 'clamp(0.72rem, 0.76vw, 1rem)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {line}
        </div>
      ))}
    </div>
  )
}

export default function LessonCard({ cell }) {
  if (!cell || cell.layout === 'blank') {
    return (
      <div
        style={{
          height: '100%',
          borderRadius: 'var(--board-shape-medium)',
          background: 'var(--md-sys-color-surface-container)',
          border: '1px solid var(--board-border-subtle)',
        }}
      />
    )
  }

  const cardStyle = toneStyle(cell.tone)
  const showSubstitutionTag = cell.tone === 'event' || cell.tone === 'changed'
  const compactSplit = cell.layout === 'split'

  return (
    <md-outlined-card
      style={{
        position: 'relative',
        height: '100%',
        borderRadius: 'var(--board-shape-medium)',
        borderColor: cardStyle.borderColor,
        background: cardStyle.background,
        overflow: 'hidden',
      }}
    >
      {showSubstitutionTag ? (
        <div
          style={{
            height: '6px',
            width: '100%',
            background: cardStyle.rail,
          }}
        />
      ) : null}
      <div style={{ padding: '0.58rem 0.8rem 0.68rem' }}>
        {showSubstitutionTag ? (
          <span
            style={{
              display: 'inline-block',
              marginBottom: compactSplit ? '0.18rem' : '0.38rem',
              padding: compactSplit ? '0.05rem 0.36rem' : '0.08rem 0.46rem',
              borderRadius: '999px',
              background: cardStyle.badgeBg,
              color: cardStyle.badgeColor,
              fontSize: compactSplit ? '0.56rem' : '0.66rem',
              lineHeight: 1.35,
              letterSpacing: '0.08em',
              fontWeight: 700,
              textTransform: 'uppercase',
            }}
          >
            {cell.tone === 'changed' ? 'Změna' : 'Akce'}
          </span>
        ) : null}
        <div
          style={{
            height: '100%',
            display: 'grid',
            gridTemplateRows: `repeat(${cell.entries.length}, minmax(0, 1fr))`,
            gap: compactSplit ? '0.14rem' : '0.34rem',
          }}
        >
          {cell.entries.map((entry, index) => (
            <div
              key={`${entry.title}-${index}`}
              style={{
                minHeight: 0,
                overflow: 'hidden',
                borderTop: index > 0 ? '1px solid var(--board-border-subtle)' : 'none',
                paddingTop: index > 0 ? (compactSplit ? '0.16rem' : '0.35rem') : 0,
              }}
            >
              <LessonEntry entry={entry} compact={compactSplit} />
            </div>
          ))}
        </div>
      </div>
    </md-outlined-card>
  )
}
