/**
 * Authentic EduPage & School Kiosk Design System
 * Faithfully adapted from official aSc EduPage Infoscreen and European school hallway displays.
 * Clean, high-contrast institutional design engineered for maximum distance readability.
 */

const LIGHT_TOKENS = {
  // TopBar / Navigation Banner (EduPage deep navy header)
  '--kiosk-nav-bg': '#0F1E36',
  '--kiosk-nav-text': '#FFFFFF',
  '--kiosk-nav-subtext': '#94A3B8',
  '--kiosk-nav-accent': '#38BDF8',

  // Grid Canvas & Surfaces
  '--kiosk-bg': '#E2E8F0',
  '--kiosk-surface': '#FFFFFF',
  '--kiosk-grid-border': '#CBD5E1',
  '--kiosk-header-bg': '#F1F5F9',
  '--kiosk-card-bg': '#FFFFFF',
  '--kiosk-card-empty': '#F8FAFC',

  // Active period highlight (EduPage royal blue)
  '--kiosk-active-header-bg': '#1D4ED8',
  '--kiosk-active-header-text': '#FFFFFF',
  '--kiosk-active-cell-border': '#2563EB',
  '--kiosk-active-cell-bg': '#EFF6FF',

  // Typography
  '--kiosk-text-primary': '#0F172A',
  '--kiosk-text-secondary': '#475569',
  '--kiosk-text-muted': '#64748B',

  // EduPage Status Colors
  '--kiosk-status-cancelled-bg': '#FEF2F2',
  '--kiosk-status-cancelled-border': '#EF4444',
  '--kiosk-status-cancelled-badge': '#DC2626',
  '--kiosk-status-cancelled-text': '#991B1B',

  '--kiosk-status-changed-bg': '#FFFBEB',
  '--kiosk-status-changed-border': '#F59E0B',
  '--kiosk-status-changed-badge': '#D97706',
  '--kiosk-status-changed-text': '#92400E',

  '--kiosk-status-event-bg': '#F0FDF4',
  '--kiosk-status-event-border': '#10B981',
  '--kiosk-status-event-badge': '#059669',
  '--kiosk-status-event-text': '#166534',

  // Room pill
  '--kiosk-room-bg': '#1E293B',
  '--kiosk-room-text': '#FFFFFF',

  // Brand accents
  '--kiosk-brand-blue': '#1D4ED8',
  '--kiosk-brand-emerald': '#16A34A',
}

const DARK_TOKENS = {
  // Slate Dark fallback if requested
  '--kiosk-nav-bg': '#090D16',
  '--kiosk-nav-text': '#FFFFFF',
  '--kiosk-nav-subtext': '#94A3B8',
  '--kiosk-nav-accent': '#38BDF8',

  '--kiosk-bg': '#0F172A',
  '--kiosk-surface': '#1E293B',
  '--kiosk-grid-border': 'rgba(255, 255, 255, 0.15)',
  '--kiosk-header-bg': '#1E293B',
  '--kiosk-card-bg': '#182234',
  '--kiosk-card-empty': '#111827',

  '--kiosk-active-header-bg': '#2563EB',
  '--kiosk-active-header-text': '#FFFFFF',
  '--kiosk-active-cell-border': '#38BDF8',
  '--kiosk-active-cell-bg': 'rgba(56, 189, 248, 0.1)',

  '--kiosk-text-primary': '#F8FAFC',
  '--kiosk-text-secondary': '#94A3B8',
  '--kiosk-text-muted': '#64748B',

  '--kiosk-status-cancelled-bg': 'rgba(239, 68, 68, 0.15)',
  '--kiosk-status-cancelled-border': '#EF4444',
  '--kiosk-status-cancelled-badge': '#DC2626',
  '--kiosk-status-cancelled-text': '#FCA5A5',

  '--kiosk-status-changed-bg': 'rgba(245, 158, 11, 0.15)',
  '--kiosk-status-changed-border': '#F59E0B',
  '--kiosk-status-changed-badge': '#D97706',
  '--kiosk-status-changed-text': '#FDE68A',

  '--kiosk-status-event-bg': 'rgba(16, 185, 129, 0.15)',
  '--kiosk-status-event-border': '#10B981',
  '--kiosk-status-event-badge': '#059669',
  '--kiosk-status-event-text': '#86EFAC',

  '--kiosk-room-bg': '#334155',
  '--kiosk-room-text': '#FFFFFF',

  '--kiosk-brand-blue': '#38BDF8',
  '--kiosk-brand-emerald': '#10B981',
}

const SHARED_TOKENS = {
  '--kiosk-font': 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  '--kiosk-radius-sm': '4px',
  '--kiosk-radius-md': '6px',
  '--kiosk-radius-lg': '8px',
  '--kiosk-radius-pill': '999px',
}

function applyTokens(tokens) {
  const root = document.documentElement
  Object.entries(tokens).forEach(([name, value]) => {
    root.style.setProperty(name, value)
  })
}

export function applyKioskTheme() {
  const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
  const urlTheme = urlParams?.get('theme')
  const envTheme = import.meta.env.VITE_USE_LIGHT_THEME

  // Default to official institutional Light Mode
  let isLight = true
  if (urlTheme === 'dark') {
    isLight = false
  } else if (urlTheme === 'light') {
    isLight = true
  } else if (envTheme === 'false') {
    isLight = false
  } else if (envTheme === 'true') {
    isLight = true
  }

  const tokens = isLight ? LIGHT_TOKENS : DARK_TOKENS
  applyTokens({ ...tokens, ...SHARED_TOKENS })
}
