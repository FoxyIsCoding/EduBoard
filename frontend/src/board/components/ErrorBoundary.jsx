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
              background: 'var(--md-sys-color-surface, #131416)',
              display: 'grid',
              placeItems: 'center',
              color: 'var(--md-sys-color-on-surface, #e4e6eb)',
              fontSize: '1.2rem',
              padding: '2rem',
              textAlign: 'center',
            }}
          >
            <div>
              <h2>Došlo k chybě</h2>
              <p style={{ marginTop: '0.5rem', opacity: 0.7 }}>
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
