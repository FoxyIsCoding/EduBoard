export default function EmptyPage({ title, copy }) {
  return (
    <section
      style={{
        height: '100%',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        background: 'var(--md-sys-color-surface-container)',
      }}
    >
      <md-outlined-card
        style={{
          padding: '2.2rem 2.6rem',
          borderRadius: '12px',
          maxWidth: '70ch',
          borderColor: 'var(--board-border-medium)',
          background: 'var(--md-sys-color-surface-container-high)',
        }}
      >
        <h2 style={{ margin: 0, fontSize: 'clamp(2rem, 3vw, 3.2rem)', lineHeight: 1.05 }}>{title}</h2>
        <p
          style={{
            margin: '0.9rem 0 0',
            color: 'var(--md-sys-color-on-surface-variant)',
            fontSize: 'clamp(1.05rem, 1.5vw, 1.6rem)',
          }}
        >
          {copy}
        </p>
      </md-outlined-card>
    </section>
  )
}
