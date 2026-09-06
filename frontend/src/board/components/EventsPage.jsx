import { Clock, MapPin, Users, User, Calendar } from 'lucide-react'

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
    cardPx: showcase ? 2.8 : large ? 2.4 : 1.8,
    cardPy: showcase ? 2.4 : large ? 2.0 : 1.5,
    titleFont: showcase
      ? 'clamp(2.5rem, 4vw, 4.4rem)'
      : large
        ? 'clamp(1.9rem, 2.4vw, 2.6rem)'
        : medium
          ? 'clamp(1.55rem, 1.8vw, 2rem)'
          : 'clamp(1.3rem, 1.45vw, 1.6rem)',
    titleClamp: showcase ? 4 : 2,
    bodyFont: showcase ? 'clamp(1.3rem, 1.8vw, 1.8rem)' : 'clamp(1.05rem, 1.3vw, 1.35rem)',
    detailFont: showcase ? 'clamp(1.1rem, 1.4vw, 1.4rem)' : 'clamp(0.92rem, 1vw, 1.15rem)',
    labelFont: showcase ? '0.92rem' : '0.78rem',
    lineGap: showcase ? 0.4 : 0.35,
    sectionGap: showcase ? 1.2 : 0.85,
  }
}

function EventCard({ event, config }) {
  return (
    <article
      className="edusign-card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
        background: 'var(--board-surface-card)',
        border: '1.5px solid var(--board-border-strong)',
      }}
    >
      {/* Top Accent Strip */}
      <div
        style={{
          height: '6px',
          width: '100%',
          background: 'var(--board-status-event-border)',
          flexShrink: 0,
        }}
      />

      <div
        style={{
          padding: `${config.cardPy}rem ${config.cardPx}rem`,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          height: '100%',
          gap: '1rem',
        }}
      >
        {/* Header: Time Badge & Title */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.8rem' }}>
            <span
              className="edusign-badge badge-event"
              style={{
                fontSize: 'clamp(0.85rem, 1vw, 1.1rem)',
                padding: '0.25rem 0.75rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
              }}
            >
              <Clock size={16} />
              <span>{event.timeLabel}</span>
            </span>
          </div>

          <h2
            style={{
              margin: 0,
              fontSize: config.titleFont,
              lineHeight: 1.1,
              fontWeight: 900,
              letterSpacing: '-0.025em',
              color: 'var(--board-text-primary)',
              display: '-webkit-box',
              overflow: 'hidden',
              WebkitBoxOrient: 'vertical',
              WebkitLineClamp: config.titleClamp,
            }}
          >
            {event.title}
          </h2>
        </div>

        {/* Footer Details: Classes, Location, Teacher */}
        <div
          style={{
            display: 'grid',
            gap: `${config.sectionGap}rem`,
            paddingTop: '0.8rem',
            borderTop: '1px solid var(--board-border)',
          }}
        >
          {event.classesLabel && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: 'var(--board-radius-small)',
                  background: 'rgba(56, 189, 248, 0.12)',
                  display: 'grid',
                  placeItems: 'center',
                  color: 'var(--board-accent-primary)',
                  flexShrink: 0,
                }}
              >
                <Users size={20} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: config.labelFont,
                    color: 'var(--board-text-secondary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    fontWeight: 700,
                  }}
                >
                  Třídy
                </div>
                <div
                  style={{
                    fontSize: config.bodyFont,
                    fontWeight: 800,
                    color: 'var(--board-text-primary)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {normalizeInlineText(event.classesLabel)}
                </div>
              </div>
            </div>
          )}

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              flexWrap: 'wrap',
            }}
          >
            {event.roomLabel && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MapPin size={18} color="var(--board-accent-primary)" />
                <span
                  className="edusign-badge badge-room"
                  style={{
                    fontSize: config.detailFont,
                    fontWeight: 800,
                    padding: '0.2rem 0.6rem',
                  }}
                >
                  {normalizeInlineText(event.roomLabel)}
                </span>
              </div>
            )}

            {event.teacherLabel && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--board-text-secondary)' }}>
                <User size={18} />
                <span
                  style={{
                    fontSize: config.detailFont,
                    fontWeight: 700,
                  }}
                >
                  {normalizeInlineText(event.teacherLabel)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  )
}

export default function EventsPage({ events }) {
  const config = getEventPageConfig(events.length)

  if (!events.length) {
    return (
      <div style={{ height: '100%', display: 'grid', placeItems: 'center' }}>
        <div
          className="edusign-card"
          style={{
            padding: '2.5rem 3.5rem',
            textAlign: 'center',
            maxWidth: '600px',
            background: 'var(--board-surface-card)',
          }}
        >
          <div style={{ marginBottom: '1.2rem', color: 'var(--board-accent-primary)' }}>
            <Calendar size={48} style={{ margin: '0 auto' }} />
          </div>
          <h3
            style={{
              margin: 0,
              fontSize: 'clamp(2rem, 2.8vw, 3.2rem)',
              fontWeight: 800,
              color: 'var(--board-text-primary)',
            }}
          >
            Bez akcí
          </h3>
          <p
            style={{
              margin: '0.8rem 0 0',
              color: 'var(--board-text-secondary)',
              fontSize: 'clamp(1.1rem, 1.4vw, 1.6rem)',
              lineHeight: 1.4,
            }}
          >
            Na dnešní den nejsou vyhlášeny žádné mimořádné školní události.
          </p>
        </div>
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
