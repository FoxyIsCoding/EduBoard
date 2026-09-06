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
    cardPx: showcase ? 2.6 : large ? 2.0 : 1.5,
    cardPy: showcase ? 2.2 : large ? 1.7 : 1.3,
    titleFont: showcase
      ? 'clamp(2.4rem, 3.8vw, 4.2rem)'
      : large
        ? 'clamp(1.8rem, 2.3vw, 2.7rem)'
        : medium
          ? 'clamp(1.5rem, 1.75vw, 2.1rem)'
          : 'clamp(1.25rem, 1.4vw, 1.65rem)',
    titleClamp: showcase ? 4 : 2,
    bodyFont: showcase ? 'clamp(1.25rem, 1.7vw, 1.75rem)' : 'clamp(1rem, 1.25vw, 1.3rem)',
    detailFont: showcase ? 'clamp(1.05rem, 1.35vw, 1.35rem)' : 'clamp(0.9rem, 1vw, 1.12rem)',
    labelFont: showcase ? '0.9rem' : '0.76rem',
    sectionGap: showcase ? 1.1 : 0.8,
  }
}

function EventCard({ event, config }) {
  return (
    <article
      className="kiosk-module"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {/* Top Accent Strip */}
      <div
        style={{
          height: '6px',
          width: '100%',
          background: 'var(--kiosk-primary)',
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
          gap: '0.85rem',
        }}
      >
        {/* Header: Time Badge & Title */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
            <span
              className="kiosk-pill pill-primary"
              style={{
                fontSize: 'clamp(0.82rem, 0.95vw, 1.05rem)',
                padding: '0.22rem 0.7rem',
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
              lineHeight: 1.12,
              fontWeight: 900,
              letterSpacing: '-0.025em',
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
            paddingTop: '0.75rem',
            borderTop: '1px solid var(--kiosk-border)',
          }}
        >
          {event.classesLabel && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: 'var(--kiosk-radius-sm)',
                  background: 'var(--kiosk-primary-subtle)',
                  display: 'grid',
                  placeItems: 'center',
                  color: 'var(--kiosk-primary)',
                  flexShrink: 0,
                }}
              >
                <Users size={18} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: config.labelFont,
                    color: 'var(--kiosk-text-secondary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
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
              gap: '0.85rem',
              flexWrap: 'wrap',
            }}
          >
            {event.roomLabel && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <span
                  className="kiosk-pill pill-room"
                  style={{
                    fontSize: config.detailFont,
                    fontWeight: 800,
                    padding: '0.2rem 0.55rem',
                  }}
                >
                  <MapPin size={15} />
                  <span>{normalizeInlineText(event.roomLabel)}</span>
                </span>
              </div>
            )}

            {event.teacherLabel && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: 'var(--kiosk-text-secondary)' }}>
                <User size={17} />
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
          className="kiosk-module"
          style={{
            padding: '3rem 4.5rem',
            textAlign: 'center',
            maxWidth: '680px',
            background: 'var(--kiosk-card)',
            borderRadius: 'var(--kiosk-radius-xl)',
            border: '1.5px solid var(--kiosk-border)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
          }}
        >
          <div
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              background: 'var(--kiosk-primary-subtle)',
              border: '1.5px solid var(--kiosk-primary-border)',
              display: 'grid',
              placeItems: 'center',
              color: 'var(--kiosk-primary)',
              margin: '0 auto 1.5rem',
            }}
          >
            <Calendar size={38} />
          </div>
          <h3
            style={{
              margin: 0,
              fontSize: 'clamp(2.2rem, 3.2vw, 3.6rem)',
              fontWeight: 900,
              color: 'var(--kiosk-text-primary)',
              letterSpacing: '-0.02em',
            }}
          >
            Bez akcí
          </h3>
          <p
            style={{
              margin: '1.1rem 0 0',
              color: 'var(--kiosk-text-secondary)',
              fontSize: 'clamp(1.1rem, 1.45vw, 1.65rem)',
              lineHeight: 1.5,
              fontWeight: 500,
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
        gap: 'var(--kiosk-gap)',
      }}
    >
      {events.map((event) => (
        <EventCard key={event.key} event={event} config={config} />
      ))}
    </section>
  )
}
