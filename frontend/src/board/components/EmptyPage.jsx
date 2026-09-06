export default function EmptyPage({ title, copy }) {
  return (
    <section
      style={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '2rem',
      }}
    >
      <div
        className="edupage-card"
        style={{
          padding: '2.8rem 3.6rem',
          maxWidth: '650px',
          background: 'var(--kiosk-card-bg)',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)',
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: 'clamp(2rem, 3.2vw, 3.6rem)',
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
            margin: '1rem 0 0',
            color: 'var(--kiosk-text-secondary)',
            fontSize: 'clamp(1.05rem, 1.45vw, 1.65rem)',
            lineHeight: 1.45,
            fontWeight: 500,
          }}
        >
          {copy}
        </p>
      </div>
    </section>
  )
}
