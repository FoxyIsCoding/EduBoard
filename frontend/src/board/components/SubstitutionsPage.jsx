import { Clock, MapPin, User, Users, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react'

function SubstitutionCard({ item, compact = false }) {
  const isCancelled = item.state === 'cancelled'

  return (
    <article
      className={`edupage-card ${isCancelled ? 'is-cancelled' : 'is-changed'}`}
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        padding: compact ? '0.8rem 1.1rem' : '1.3rem 1.6rem',
        justifyContent: 'space-between',
      }}
    >
      {/* Top Header: Class, Period and Status Badge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: compact ? '0.35rem' : '0.65rem' }}>
        <div
          style={{
            fontSize: compact ? '0.95rem' : '1.3rem',
            fontWeight: 900,
            color: 'var(--kiosk-text-primary)',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
          }}
        >
          <span style={{ color: 'var(--kiosk-brand-blue)' }}>{item.className}</span>
          <span style={{ marginInline: '0.45rem', opacity: 0.35 }}>•</span>
          <span>{item.periodShort}. hodina</span>
        </div>

        <span
          className={`edupage-badge ${isCancelled ? 'badge-cancelled' : 'badge-changed'}`}
          style={{
            fontSize: compact ? '0.74rem' : '0.88rem',
            padding: compact ? '0.18rem 0.5rem' : '0.24rem 0.65rem',
          }}
        >
          {isCancelled ? (
            <>
              <XCircle size={15} />
              <span>Odpadá</span>
            </>
          ) : (
            <>
              <AlertTriangle size={15} />
              <span>Změna</span>
            </>
          )}
        </span>
      </div>

      {/* Middle: Subject Name */}
      <div
        style={{
          fontSize: compact ? 'clamp(1.25rem, 1.65vw, 1.95rem)' : 'clamp(1.8rem, 2.6vw, 3.2rem)',
          fontWeight: 900,
          lineHeight: 1.12,
          letterSpacing: '-0.02em',
          color: isCancelled ? 'var(--kiosk-status-cancelled-text)' : 'var(--kiosk-text-primary)',
          textDecoration: isCancelled ? 'line-through' : 'none',
          marginBottom: compact ? '0.4rem' : '0.85rem',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {item.subjectLabel}
      </div>

      {/* Bottom Details: Time, Room, Teacher, Group */}
      <div
        style={{
          marginTop: 'auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: compact ? '0.4rem' : '0.75rem',
          paddingTop: '0.6rem',
          borderTop: '1px solid var(--kiosk-grid-border)',
          fontSize: compact ? 'clamp(0.8rem, 0.92vw, 1.02rem)' : 'clamp(0.95rem, 1.2vw, 1.35rem)',
          color: 'var(--kiosk-text-secondary)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', overflow: 'hidden' }}>
          <Clock size={17} color="var(--kiosk-brand-blue)" style={{ flexShrink: 0 }} />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
            {item.periodTime}
          </span>
        </div>

        {item.roomLabel ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', overflow: 'hidden', justifyContent: 'flex-end' }}>
            <span
              className="edupage-badge badge-room"
              style={{
                fontSize: compact ? '0.72rem' : '0.88rem',
                padding: '0.14rem 0.5rem',
                fontWeight: 900,
              }}
            >
              <MapPin size={13} style={{ flexShrink: 0 }} />
              <span>{item.roomLabel}</span>
            </span>
          </div>
        ) : <div />}

        {item.teacherLabel && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', overflow: 'hidden', gridColumn: 'span 2' }}>
            <User size={17} style={{ flexShrink: 0, color: 'var(--kiosk-text-secondary)' }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 800, color: 'var(--kiosk-text-primary)' }}>
              {item.teacherLabel}
            </span>
          </div>
        )}

        {item.groupLabel && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', overflow: 'hidden', gridColumn: 'span 2' }}>
            <Users size={17} style={{ flexShrink: 0, color: 'var(--kiosk-text-secondary)' }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 600 }}>
              {item.groupLabel}
            </span>
          </div>
        )}
      </div>
    </article>
  )
}

export default function SubstitutionsPage({ substitutions }) {
  if (!substitutions.length) {
    return (
      <div style={{ height: '100%', display: 'grid', placeItems: 'center' }}>
        <div
          className="edupage-card"
          style={{
            padding: '3rem 4rem',
            textAlign: 'center',
            background: 'var(--kiosk-card-bg)',
            maxWidth: '650px',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)',
          }}
        >
          <div
            style={{
              width: '68px',
              height: '68px',
              borderRadius: '50%',
              background: '#DCFCE7',
              border: '1.5px solid #86EFAC',
              display: 'grid',
              placeItems: 'center',
              color: 'var(--kiosk-brand-emerald)',
              margin: '0 auto 1.3rem',
            }}
          >
            <CheckCircle2 size={38} />
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
            Dnes bez suplování
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
            Všechny hodiny probíhají podle řádného rozvrhu. Žádné změny ani odpadlé hodiny nejsou evidovány.
          </p>
        </div>
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
        gap: 'clamp(6px, 0.7vw, 10px)',
      }}
    >
      {substitutions.map((item) => (
        <SubstitutionCard key={item.key} item={item} compact={compact} />
      ))}
    </div>
  )
}
