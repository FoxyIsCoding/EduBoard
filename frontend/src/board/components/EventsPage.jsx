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
    cardPx: showcase ? 2.8 : large ? 2.2 : 1.6,
    cardPy: showcase ? 2.4 : large ? 1.8 : 1.4,
    titleFont: showcase
      ? 'clamp(2.5rem, 4vw, 4.4rem)'
      : large
        ? 'clamp(1.9rem, 2.4vw, 2.8rem)'
        : medium
          ? 'clamp(1.55rem, 1.8vw, 2.2rem)'
          : 'clamp(1.3rem, 1.45vw, 1.7rem)',
    titleClamp: showcase ? 4 : 2,
    bodyFont: showcase ? 'clamp(1.3rem, 1.8vw, 1.8rem)' : 'clamp(1.05rem, 1.3vw, 1.35rem)',
    detailFont: showcase ? 'clamp(1.1rem, 1.4vw, 1.4rem)' : 'clamp(0.92rem, 1vw, 1.15rem)',
    labelFont: showcase ? '0.92rem' : '0.78rem',
    sectionGap: showcase ? 1.2 : 0.85,
  }
}

function EventCard({ event, config }) {
  return (
    <article
      className="kiosk-module is-event"
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
          background: 'var(--kiosk-cyan)',
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
              className="kiosk-pill pill-cyan"
              style={{
                fontSize: 'clamp(0.85rem, 1vw, 1.1rem)',
                padding: '0.25rem 0.75rem',
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
              color: 'var(--kiosk-text-white)',
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
            borderTop: '1px solid var(--kiosk-border)',
          }}
        >
          {event.classesLabel && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: 'var(--kiosk-radius-sm)',
                  background: 'rgba(56, 189, 248, 0.15)',
                  display: 'grid',
                  placeItems: 'center',
                  color: 'var(--kiosk-cyan)',
                  flexShrink: 0,
                }}
              >
                <Users size={20} />
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
                    color: 'var(--kiosk-text-white)',
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
                <span
                  className="kiosk-pill pill-room"
                  style={{
                    fontSize: config.detailFont,
                    fontWeight: 800,
                    padding: '0.2rem 0.6rem',
                  }}
                >
                  <MapPin size={16} />
                  <span>{normalizeInlineText(event.roomLabel)}</span>
                </span>
              </div>
            )}

            {event.teacherLabel && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--kiosk-text-secondary)' }}>
                <User size={18} />
                <span
                  style={{
                    fontSize: config.detailFont,
                    fontWeight: 800,
                    color: 'var(--kiosk-text-white)',
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
            border: '1.5px solid var(--kiosk-border-strong)',
          }}
        >
          <div
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              background: 'rgba(56, 189, 248, 0.15)',
              border: '1.5px solid rgba(56, 189, 248, 0.4)',
              display: 'grid',
              placeItems: 'center',
              color: 'var(--kiosk-cyan)',
              margin: '0 auto 1.5rem',
              boxShadow: '0 0 24px var(--kiosk-cyan-glow)',
            }}
          >
            <Calendar size={40} />
          </div>
          <h3
            style={{
              margin: 0,
              fontSize: 'clamp(2.2rem, 3.2vw, 3.8rem)',
              fontWeight: 900,
              color: 'var(--kiosk-text-white)',
              letterSpacing: '-0.02em',
            }}
          >
            Bez akcí
          </h3>
          <p
            style={{
              margin: '1.2rem 0 0',
              color: 'var(--kiosk-text-secondary)',
              fontSize: 'clamp(1.15rem, 1.5vw, 1.8rem)',
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
