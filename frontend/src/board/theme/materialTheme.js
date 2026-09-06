const DARK_TOKENS = {
  '--md-sys-color-primary': '#9fc5ff',
  '--md-sys-color-on-primary': '#002f67',
  '--md-sys-color-primary-container': '#11457d',
  '--md-sys-color-on-primary-container': '#d7e3ff',
  '--md-sys-color-secondary': '#c1c7d3',
  '--md-sys-color-on-secondary': '#2b313c',
  '--md-sys-color-tertiary': '#c9c6dc',
  '--md-sys-color-on-tertiary': '#302d42',
  '--md-sys-color-surface': '#131416',
  '--md-sys-color-surface-container': '#1a1c1f',
  '--md-sys-color-surface-container-high': '#212328',
  '--md-sys-color-surface-container-highest': '#2a2d33',
  '--md-sys-color-on-surface': '#e4e6eb',
  '--md-sys-color-on-surface-variant': '#c3c6cf',
  '--md-sys-color-outline': '#8d919a',
  '--md-sys-color-error': '#ffb4ab',
  '--md-sys-color-on-error': '#690005',
  '--md-sys-color-badge-success': '#baf7cf',
  '--md-sys-color-badge-warning': '#ffe1a6',
  '--board-border-subtle': 'rgba(141, 145, 154, 0.22)',
  '--board-border-medium': 'rgba(141, 145, 154, 0.35)',
  '--board-border-strong': 'rgba(141, 145, 154, 0.48)',
  '--board-surface-dim': 'rgba(33, 35, 40, 0.72)',
  '--board-progress-track-bg': 'rgba(159, 197, 255, 0.16)',
}

const LIGHT_TOKENS = {
  '--md-sys-color-primary': '#0052a5',
  '--md-sys-color-on-primary': '#ffffff',
  '--md-sys-color-primary-container': '#d7e3ff',
  '--md-sys-color-on-primary-container': '#001c3a',
  '--md-sys-color-secondary': '#535f70',
  '--md-sys-color-on-secondary': '#ffffff',
  '--md-sys-color-tertiary': '#6b5778',
  '--md-sys-color-on-tertiary': '#ffffff',
  '--md-sys-color-surface': '#f8f9ff',
  '--md-sys-color-surface-container': '#e1e2ec',
  '--md-sys-color-surface-container-high': '#d1d3d9',
  '--md-sys-color-surface-container-highest': '#c4c6cf',
  '--md-sys-color-on-surface': '#1a1c1f',
  '--md-sys-color-on-surface-variant': '#43474e',
  '--md-sys-color-outline': '#73777f',
  '--md-sys-color-error': '#ba1a1a',
  '--md-sys-color-on-error': '#ffffff',
  '--md-sys-color-badge-success': '#baf7cf',
  '--md-sys-color-badge-warning': '#ffe1a6',
  '--board-border-subtle': 'rgba(115, 119, 127, 0.22)',
  '--board-border-medium': 'rgba(115, 119, 127, 0.35)',
  '--board-border-strong': 'rgba(115, 119, 127, 0.48)',
  '--board-surface-dim': 'rgba(209, 211, 217, 0.72)',
  '--board-progress-track-bg': 'rgba(0, 82, 165, 0.16)',
}

const SHARED_TOKENS = {
  '--board-font-family': '"Roboto", "Segoe UI", sans-serif',
  // TV HDMI overscan safe-area padding:
  '--board-kiosk-gutter': 'clamp(1.5rem, 2.5vw, 2.85rem)',
  '--board-kiosk-gap': 'clamp(0.5rem, 0.8vw, 1.2rem)',
  '--board-title-size': 'clamp(2rem, 2.6vw, 3.8rem)',
  '--board-clock-size': 'clamp(3.8rem, 5.5vw, 6.8rem)',
  '--board-text-size': 'clamp(0.95rem, 1.1vw, 1.45rem)',
}

function applyTokens(tokens) {
  const root = document.documentElement
  Object.entries(tokens).forEach(([name, value]) => {
    root.style.setProperty(name, value)
  })
}

export function applyMaterialKioskTheme() {
  const useLight = import.meta.env.VITE_USE_LIGHT_THEME === 'true'
  const themeTokens = useLight ? LIGHT_TOKENS : DARK_TOKENS
  
  applyTokens({ ...themeTokens, ...SHARED_TOKENS })
}