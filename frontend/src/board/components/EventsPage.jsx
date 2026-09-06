function normalizeInlineText(value) {
  return String(value ?? '')
    .replace(/\s*\n\s*/g, ', ')
    .replace(/\s*,\s*/g, ', ')
    .replace(/\s+/g, ' ')
    .trim()
}

function getEventPageConfig(count) {
  const showcase = count === 1
  const large = count <= 2
  const medium = count <= 4

  return {
    showcase,
    large,
    medium,
    columns: showcase
      ? 'minmax(0, 1fr)'
      : count === 2
        ? 'repeat(2, minmax(0, 1fr))'
        : count <= 4
          ? 'repeat(2, minmax(0, 1fr))'
          : 'repeat(3, minmax(0, 1fr))',
    rows: count <= 2 ? 'minmax(0, 1fr)' : 'repeat(2, minmax(0, 1fr))',
    cardPx: showcase ? 2.6 : large ? 2.7 : 2.2,
    cardPy: showcase ? 2.3 : large ? 2.15 : 1.9,
    chipFont: showcase ? '1.08rem' : large ? '1rem' : '0.92rem',
    titleFont: showcase ? 'clamp(2.4rem, 4vw, 4.2rem)' : large ? 'clamp(1.7rem, 2.1vw, 2.2rem)' : medium ? '1.7rem' : 'clamp(1.32rem, 1.45vw, 1.54rem)',
    titleClamp: showcase ? 4 : 2,
    bodyFont: showcase ? 'clamp(1.24rem, 1.7vw, 1.7rem)' : large ? '1.15rem' : '0.98rem',
    detailFont: showcase ? 'clamp(1.08rem, 1.35vw, 1.34rem)' : large ? '0.96rem' : '0.82rem',
    labelFont: showcase ? '0.92rem' : large ? '0.76rem' : '0.68rem',
    lineGap: showcase ? 0.35 : large ? 0.55 : 0.42,
    sectionGap: showcase ? 1.15 : large ? 0.9 : 0.62,
    classesClamp: showcase ? null : large ? 4 : 3,
    detailClamp: showcase ? null : 3,
    maxWidth: '100%',
  }
}

function EventInfoBlock({ block, config }) {
  return (
    <div style={{ minWidth: 0, overflow: 'hidden' }}>
      <div
        style={{
          fontSize: config.labelFont,
          color: 'var(--md-sys-color-on-surface-variant)',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          fontWeight: 700,
        }}
      >
        {block.label}
      </div>
      <div
        style={{
          marginTop: `${config.lineGap}rem`,
          fontSize: block.label === 'Třídy' ? config.bodyFont : config.detailFont,
          fontWeight: block.label === 'Třídy' ? 800 : 600,
          lineHeight: 1.16,
          whiteSpace: 'normal',
          overflowWrap: 'anywhere',
          wordBreak: 'break-word',
          ...(block.label === 'Třídy' ? (config.classesClamp ? {
            display: '-webkit-box',
            overflow: 'hidden',
            WebkitBoxOrient: 'vertical',
            WebkitLineClamp: config.classesClamp,
          } : {}) : (config.detailClamp ? {
            display: '-webkit-box',
            overflow: 'hidden',
            WebkitBoxOrient: 'vertical',
            WebkitLineClamp: config.detailClamp,
          } : {})),
        }}
      >
        {normalizeInlineText(block.value)}
      </div>
    </div>
  )
}

function EventCard({ event, config }) {
  const infoBlocks = [
    { label: 'Třídy', value: event.classesLabel },
    { label: 'Učebny', value: event.roomLabel },
    { label: 'Vyučující', value: event.teacherLabel },
  ].filter((block) => block.value)

  return (
    <md-elevated-card
      style={{
        borderRadius: '12px',
        padding: `${config.cardPy}rem ${config.cardPx}rem`,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
        background: 'var(--md-sys-color-surface-container-high)',
        border: '1px solid var(--board-border-subtle)',
        boxShadow: 'none',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr)',
          gridTemplateRows: 'auto minmax(0, 1fr)',
          minHeight: 0,
          height: '100%',
        }}
      >
        <div style={{ minHeight: 0, maxWidth: config.maxWidth, minWidth: 0 }}>
          <md-assist-chip
            label={event.timeLabel}
            style={{
              '--md-assist-chip-label-text-size': config.chipFont,
              '--md-assist-chip-container-color': 'var(--md-sys-color-surface-container-highest)',
              '--md-assist-chip-label-text-color': 'var(--md-sys-color-on-surface-variant)',
            }}
          />
          <div
            style={{
              marginTop: config.showcase ? '0.9rem' : '0.6rem',
              fontSize: config.titleFont,
              lineHeight: 1.02,
              fontWeight: 800,
              letterSpacing: '-0.035em',
              overflowWrap: 'anywhere',
              wordBreak: 'break-word',
              display: '-webkit-box',
              overflow: 'hidden',
              WebkitBoxOrient: 'vertical',
              WebkitLineClamp: config.titleClamp,
            }}
          >
            {event.title}
          </div>
        </div>

        {config.showcase ? (
          <div style={{ minHeight: 0, minWidth: 0, paddingTop: '1.2rem', overflow: 'hidden', display: 'grid', gap: `${config.sectionGap}rem` }}>
            {infoBlocks.map((block) => (
              <EventInfoBlock key={block.label} block={block} config={config} />
            ))}
          </div>
        ) : (
          <div style={{ minHeight: 0, minWidth: 0, paddingTop: '1rem', overflow: 'hidden', display: 'grid', gap: `${config.sectionGap}rem` }}>
            {infoBlocks.map((block) => (
              <EventInfoBlock key={block.label} block={block} config={config} />
            ))}
          </div>
        )}
      </div>
    </md-elevated-card>
  )
}

export default function EventsPage({ events }) {
  const config = getEventPageConfig(events.length)

  if (!events.length) {
    return (
      <div style={{ height: '100%', display: 'grid', placeItems: 'center' }}>
        <md-filled-tonal-card style={{ padding: '2rem 2.4rem', borderRadius: '12px', textAlign: 'center', background: 'var(--md-sys-color-surface-container-high)' }}>
          <h3 style={{ margin: 0, fontSize: 'clamp(2rem, 3.1vw, 3rem)' }}>Bez akcí</h3>
          <p style={{ margin: '0.9rem 0 0', color: 'var(--md-sys-color-on-surface-variant)', fontSize: 'clamp(1.1rem, 1.4vw, 1.6rem)' }}>
            Na dnešní den nejsou zapsané žádné školní události.
          </p>
        </md-filled-tonal-card>
      </div>
    )
  }

  return (
    <section
      style={{
        width: '100%',
        height: '100%',
        display: 'grid',
        gridTemplateColumns: config.columns,
        gridTemplateRows: config.rows,
        gap: '0.85rem',
      }}
    >
        {events.map((event) => (
          <EventCard key={event.key} event={event} config={config} />
        ))}
    </section>
  )
}
