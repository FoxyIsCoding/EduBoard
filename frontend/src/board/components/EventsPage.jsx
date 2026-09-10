import { Clock, MapPin, Users, User, Calendar } from 'lucide-react'

function normalizeInlineText(value) {
  return String(value ?? '')
    .replace(/\s*[\r\n]+\s*/g, ', ')
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
    cardPx: showcase ? 2.4 : large ? 1.8 : 1.4,
    cardPy: showcase ? 2.0 : large ? 1.5 : 1.2,
    titleFont: showcase
      ? 'clamp(2.3rem, 3.6vw, 4rem)'
      : large
        ? 'clamp(1.7rem, 2.2vw, 2.6rem)'
        : medium
          ? 'clamp(1.4rem, 1.65vw, 2rem)'
          : 'clamp(1.2rem, 1.35vw, 1.55rem)',
    titleClamp: showcase ? 4 : 2,
    bodyFont: showcase ? 'clamp(1.2rem, 1.6vw, 1.65rem)' : 'clamp(0.95rem, 1.18vw, 1.25rem)',
    detailFont: showcase ? 'clamp(1rem, 1.25vw, 1.28rem)' : 'clamp(0.85rem, 0.95vw, 1.05rem)',
    labelFont: showcase ? '0.85rem' : '0.74rem',
    sectionGap: showcase ? 1.0 : 0.75,
  }
}

function EventCard({ event, config }) {
  return (
    <article
      className="edupage-card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        padding: `${config.cardPy}rem ${config.cardPx}rem`,
        justifyContent: 'space-between',
        borderTop: '4px solid var(--kiosk-brand-blue)',
      }}
    >
      {/* Header: Time Badge & Title */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', marginBottom: '0.65rem' }}>
          <span
            className="edupage-badge badge-room"
            style={{
              fontSize: 'clamp(0.8rem, 0.92vw, 1.02rem)',
              padding: '0.2rem 0.6rem',
              background: 'var(--kiosk-nav-bg)',
            }}
          >
            <Clock size={15} color="var(--kiosk-nav-accent)" />
            <span>{event.timeLabel}</span>
          </span>
        </div>

        <h2
          style={{
            margin: 0,
            fontSize: config.titleFont,
            lineHeight: 1.15,
            fontWeight: 900,
            letterSpacing: '-0.02em',
            color: 'var(--kiosk-text-primary)',
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
          paddingTop: '0.65rem',
          borderTop: '1px solid var(--kiosk-grid-border)',
        }}
      >
        {event.classesLabel && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: 'var(--kiosk-radius-sm)',
                background: 'var(--kiosk-active-cell-bg)',
                border: '1px solid var(--kiosk-grid-border)',
                display: 'grid',
                placeItems: 'center',
                color: 'var(--kiosk-brand-blue)',
                flexShrink: 0,
              }}
            >
              <Users size={17} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: config.labelFont,
                  color: 'var(--kiosk-text-secondary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  fontWeight: 800,
                }}
              >
                Třídy
              </div>
              <div
                style={{
                  fontSize: config.bodyFont,
                  fontWeight: 800,
                  color: 'var(--kiosk-text-primary)',
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
            gap: '0.8rem',
            flexWrap: 'wrap',
          }}
        >
          {event.roomLabel && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span
                className="edupage-badge badge-room"
                style={{
                  fontSize: config.detailFont,
                  fontWeight: 800,
                  padding: '0.18rem 0.5rem',
                }}
              >
                <MapPin size={14} />
                <span>{normalizeInlineText(event.roomLabel)}</span>
              </span>
            </div>
          )}

          {event.teacherLabel && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--kiosk-text-secondary)' }}>
              <User size={16} />
              <span
                style={{
                  fontSize: config.detailFont,
                  fontWeight: 800,
                  color: 'var(--kiosk-text-primary)',
                }}
              >
                {normalizeInlineText(event.teacherLabel)}
              </span>
            </div>
          )}
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
          className="edupage-card"
          style={{
            padding: '3rem 4rem',
            textAlign: 'center',
            maxWidth: '650px',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)',
          }}
        >
          <div
            style={{
              width: '68px',
              height: '68px',
              borderRadius: '50%',
              background: 'var(--kiosk-active-cell-bg)',
              border: '1.5px solid var(--kiosk-grid-border)',
              display: 'grid',
              placeItems: 'center',
              color: 'var(--kiosk-brand-blue)',
              margin: '0 auto 1.3rem',
            }}
          >
            <Calendar size={36} />
          </div>
          <h3
            style={{
              margin: 0,
              fontSize: 'clamp(2rem, 3vw, 3.4rem)',
              fontWeight: 900,
              color: 'var(--kiosk-text-primary)',
              letterSpacing: '-0.02em',
            }}
          >
            Bez mimořádných akcí
          </h3>
          <p
            style={{
              margin: '1rem 0 0',
              color: 'var(--kiosk-text-secondary)',
              fontSize: 'clamp(1.05rem, 1.4vw, 1.55rem)',
              lineHeight: 1.45,
              fontWeight: 500,
            }}
          >
            Na dnešní den nejsou hlášeny žádné mimořádné školní události ani exkurze.
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
        gap: 'clamp(6px, 0.7vw, 10px)',
      }}
    >
      {events.map((event) => (
        <EventCard key={event.key} event={event} config={config} />
      ))}
    </section>
  )
}
