import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info?.componentStack)
    if (!this.recoveryTimer && typeof window !== 'undefined') {
      this.recoveryTimer = setTimeout(() => {
        window.location.reload()
      }, 20000)
    }
  }

  componentWillUnmount() {
    if (this.recoveryTimer) {
      clearTimeout(this.recoveryTimer)
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'var(--kiosk-bg, #070A12)',
              display: 'grid',
              placeItems: 'center',
              color: 'var(--kiosk-text-primary, #F1F5F9)',
              fontSize: '1.2rem',
              padding: '2rem',
              textAlign: 'center',
            }}
          >
            <div
              className="kiosk-module"
              style={{
                padding: '2.5rem 3.5rem',
                maxWidth: '600px',
                borderRadius: 'var(--kiosk-radius-xl)',
                border: '1.5px solid var(--kiosk-border-strong)',
              }}
            >
              <h2 style={{ margin: 0, fontSize: '2rem', fontWeight: 900, color: 'var(--kiosk-text-white)' }}>
                Došlo k chybě
              </h2>
              <p style={{ marginTop: '0.8rem', color: 'var(--kiosk-text-secondary)', fontSize: '1.1rem' }}>
                Obrazovka se automaticky obnoví za několik sekund...
              </p>
            </div>
          </div>
        )
      )
    }
    return this.props.children
  }
}
