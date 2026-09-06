export default function EmptyPage({ title, copy }) {
  return (
    <section
      style={{
        height: '100%',
        borderRadius: 'var(--kiosk-radius-xl)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '2rem',
      }}
    >
      <div
        className="kiosk-module"
        style={{
          padding: '2.8rem 3.8rem',
          maxWidth: '680px',
          background: 'var(--kiosk-card)',
          border: '1.5px solid var(--kiosk-border-strong)',
          borderRadius: 'var(--kiosk-radius-xl)',
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: 'clamp(2.2rem, 3.4vw, 3.8rem)',
            fontWeight: 900,
            lineHeight: 1.1,
            color: 'var(--kiosk-text-primary)',
            letterSpacing: '-0.02em',
          }}
        >
          {title}
        </h2>
        <p
          style={{
            margin: '1.2rem 0 0',
            color: 'var(--kiosk-text-secondary)',
            fontSize: 'clamp(1.15rem, 1.5vw, 1.7rem)',
            lineHeight: 1.5,
            fontWeight: 500,
          }}
        >
          {copy}
        </p>
      </div>
    </section>
  )
}
