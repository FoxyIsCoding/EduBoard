import { Clock, MapPin, User, Users, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react'

function SubstitutionCard({ item, compact = false }) {
  const isCancelled = item.state === 'cancelled'

  return (
    <article
      className={`edusign-card ${isCancelled ? 'tone-cancelled' : 'tone-changed'}`}
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
            ? 'var(--board-status-cancelled-border)'
            : 'var(--board-status-changed-border)',
          flexShrink: 0,
        }}
      />

      <div
        style={{
          padding: compact ? '0.75rem 1rem' : '1.25rem 1.6rem',
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
              fontSize: compact ? '0.88rem' : '1.25rem',
              fontWeight: 900,
              color: 'var(--board-text-primary)',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}
          >
            <span style={{ color: 'var(--board-accent-primary)' }}>{item.className}</span>
            <span style={{ marginInline: '0.4rem', opacity: 0.4 }}>•</span>
            <span>{item.periodShort}. hod</span>
          </div>

          <span
            className={`edusign-badge ${isCancelled ? 'badge-cancelled' : 'badge-changed'}`}
            style={{
              fontSize: compact ? '0.7rem' : '0.88rem',
              padding: compact ? '0.15rem 0.5rem' : '0.22rem 0.65rem',
            }}
          >
            {isCancelled ? (
              <>
                <XCircle size={14} />
                <span>Odpadá</span>
              </>
            ) : (
              <>
                <AlertTriangle size={14} />
                <span>Změna</span>
              </>
            )}
          </span>
        </div>

        {/* Middle: Subject Name */}
        <div
          style={{
            fontSize: compact ? 'clamp(1.2rem, 1.5vw, 1.8rem)' : 'clamp(1.8rem, 2.5vw, 3rem)',
            fontWeight: 900,
            lineHeight: 1.12,
            letterSpacing: '-0.02em',
            color: isCancelled ? 'var(--board-status-cancelled-text)' : 'var(--board-text-primary)',
            textDecoration: isCancelled ? 'line-through' : 'none',
            marginBottom: compact ? '0.4rem' : '1rem',
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
            gap: compact ? '0.4rem' : '0.75rem',
            paddingTop: '0.5rem',
            borderTop: '1px solid var(--board-border)',
            fontSize: compact ? 'clamp(0.78rem, 0.9vw, 1rem)' : 'clamp(0.95rem, 1.2vw, 1.4rem)',
            color: 'var(--board-text-secondary)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', overflow: 'hidden' }}>
            <Clock size={16} color="var(--board-accent-primary)" style={{ flexShrink: 0 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 600 }}>
              {item.periodTime}
            </span>
          </div>

          {item.roomLabel ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', overflow: 'hidden' }}>
              <MapPin size={16} color="var(--board-accent-primary)" style={{ flexShrink: 0 }} />
              <span
                className="edusign-badge badge-room"
                style={{
                  fontSize: compact ? '0.72rem' : '0.88rem',
                  padding: '0.1rem 0.45rem',
                  fontWeight: 800,
                }}
              >
                {item.roomLabel}
              </span>
            </div>
          ) : <div />}

          {item.teacherLabel && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', overflow: 'hidden', gridColumn: 'span 2' }}>
              <User size={16} style={{ flexShrink: 0 }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 700, color: 'var(--board-text-primary)' }}>
                {item.teacherLabel}
              </span>
            </div>
          )}

          {item.groupLabel && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', overflow: 'hidden', gridColumn: 'span 2' }}>
              <Users size={16} style={{ flexShrink: 0 }} />
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
          className="edusign-card"
          style={{
            padding: '2.5rem 3.5rem',
            borderRadius: 'var(--board-radius-large)',
            textAlign: 'center',
            background: 'var(--board-surface-card)',
            maxWidth: '600px',
            border: '1.5px solid var(--board-border-strong)',
          }}
        >
          <div style={{ marginBottom: '1.2rem', color: 'var(--board-accent-primary)' }}>
            <CheckCircle2 size={56} style={{ margin: '0 auto' }} />
          </div>
          <h3
            style={{
              margin: 0,
              fontSize: 'clamp(2rem, 2.8vw, 3.2rem)',
              fontWeight: 800,
              color: 'var(--board-text-primary)',
            }}
          >
            Bez suplování
          </h3>
          <p
            style={{
              margin: '0.9rem 0 0',
              color: 'var(--board-text-secondary)',
              fontSize: 'clamp(1.1rem, 1.4vw, 1.6rem)',
              lineHeight: 1.45,
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
        gap: 'var(--board-kiosk-gap)',
      }}
    >
      {substitutions.map((item) => (
        <SubstitutionCard key={item.key} item={item} compact={compact} />
      ))}
    </div>
  )
}
