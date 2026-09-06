export default function EmptyPage({ title, copy }) {
  return (
    <section
      style={{
        height: '100%',
        borderRadius: 'var(--board-radius-large)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        background: 'var(--board-surface)',
        padding: '2rem',
      }}
    >
      <div
        className="edusign-card"
        style={{
          padding: '2.5rem 3.2rem',
          maxWidth: '650px',
          background: 'var(--board-surface-card)',
          border: '1.5px solid var(--board-border-strong)',
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: 'clamp(2rem, 3.2vw, 3.6rem)',
            fontWeight: 800,
            lineHeight: 1.1,
            color: 'var(--board-text-primary)',
          }}
        >
          {title}
        </h2>
        <p
          style={{
            margin: '1rem 0 0',
            color: 'var(--board-text-secondary)',
            fontSize: 'clamp(1.1rem, 1.5vw, 1.6rem)',
            lineHeight: 1.45,
          }}
        >
          {copy}
        </p>
      </div>
    </section>
  )
}
