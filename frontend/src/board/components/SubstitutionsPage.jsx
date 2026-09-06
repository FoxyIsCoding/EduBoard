import { Clock, MapPin, User, Users, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react'

function SubstitutionCard({ item, compact = false }) {
  const isCancelled = item.state === 'cancelled'

  return (
    <article
      className={`kiosk-module ${isCancelled ? 'is-cancelled' : 'is-substitution'}`}
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Top Accent Strip */}
      <div
        style={{
          height: compact ? '4px' : '6px',
          width: '100%',
          background: isCancelled
            ? 'var(--kiosk-rose)'
            : 'var(--kiosk-amber)',
          flexShrink: 0,
        }}
      />

      <div
        style={{
          padding: compact ? '0.85rem 1.1rem' : '1.35rem 1.8rem',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        {/* Top line: Class, Period and Status Badge */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: compact ? '0.35rem' : '0.75rem' }}>
          <div
            style={{
              fontSize: compact ? '0.95rem' : '1.35rem',
              fontWeight: 900,
              color: 'var(--kiosk-text-primary)',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}
          >
            <span style={{ color: 'var(--kiosk-primary)' }}>{item.className}</span>
            <span style={{ marginInline: '0.45rem', opacity: 0.35 }}>•</span>
            <span>{item.periodShort}. hodina</span>
          </div>

          <span
            className={`kiosk-pill ${isCancelled ? 'pill-rose' : 'pill-amber'}`}
            style={{
              fontSize: compact ? '0.74rem' : '0.88rem',
              padding: compact ? '0.18rem 0.55rem' : '0.24rem 0.72rem',
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
            fontSize: compact ? 'clamp(1.3rem, 1.7vw, 2rem)' : 'clamp(2rem, 2.8vw, 3.4rem)',
            fontWeight: 900,
            lineHeight: 1.12,
            letterSpacing: '-0.025em',
            color: isCancelled ? 'var(--kiosk-rose-text)' : 'var(--kiosk-text-primary)',
            textDecoration: isCancelled ? 'line-through' : 'none',
            marginBottom: compact ? '0.45rem' : '0.95rem',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {item.subjectLabel}
        </div>

        {/* Bottom Metadata: Time, Room, Teacher, Group */}
        <div
          style={{
            marginTop: 'auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: compact ? '0.45rem' : '0.8rem',
            paddingTop: '0.65rem',
            borderTop: '1px solid var(--kiosk-border)',
            fontSize: compact ? 'clamp(0.82rem, 0.95vw, 1.05rem)' : 'clamp(1rem, 1.25vw, 1.45rem)',
            color: 'var(--kiosk-text-secondary)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
            <Clock size={18} color="var(--kiosk-primary)" style={{ flexShrink: 0 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
              {item.periodTime}
            </span>
          </div>

          {item.roomLabel ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden', justifyContent: 'flex-end' }}>
              <span
                className="kiosk-pill pill-room"
                style={{
                  fontSize: compact ? '0.74rem' : '0.9rem',
                  padding: '0.15rem 0.55rem',
                  fontWeight: 900,
                }}
              >
                <MapPin size={14} style={{ flexShrink: 0 }} />
                <span>{item.roomLabel}</span>
              </span>
            </div>
          ) : <div />}

          {item.teacherLabel && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden', gridColumn: 'span 2' }}>
              <User size={18} style={{ flexShrink: 0, color: 'var(--kiosk-text-secondary)' }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 800, color: 'var(--kiosk-text-primary)' }}>
                {item.teacherLabel}
              </span>
            </div>
          )}

          {item.groupLabel && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden', gridColumn: 'span 2' }}>
              <Users size={18} style={{ flexShrink: 0, color: 'var(--kiosk-text-secondary)' }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 600 }}>
                {item.groupLabel}
              </span>
            </div>
          )}
        </div>
      </div>
    </article>
  )
}

export default function SubstitutionsPage({ substitutions }) {
  if (!substitutions.length) {
    return (
      <div style={{ height: '100%', display: 'grid', placeItems: 'center' }}>
        <div
          className="kiosk-module"
          style={{
            padding: '3rem 4.5rem',
            borderRadius: 'var(--kiosk-radius-xl)',
            textAlign: 'center',
            background: 'var(--kiosk-card)',
            maxWidth: '680px',
            border: '1.5px solid var(--kiosk-border)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
          }}
        >
          <div
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              background: 'var(--kiosk-emerald-subtle)',
              border: '1.5px solid var(--kiosk-emerald-border)',
              display: 'grid',
              placeItems: 'center',
              color: 'var(--kiosk-emerald)',
              margin: '0 auto 1.5rem',
            }}
          >
            <CheckCircle2 size={40} />
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
            Bez suplování
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
            V aktuálním rozvrhu nejsou evidované žádné změny hodin. Výuka probíhá podle řádného rozvrhu.
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
        gap: 'var(--kiosk-gap)',
      }}
    >
      {substitutions.map((item) => (
        <SubstitutionCard key={item.key} item={item} compact={compact} />
      ))}
    </div>
  )
}
