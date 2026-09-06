/**
 * EduSign 2.0 - High-Contrast Accessible Theme System
 * Specially calibrated for public displays, digital signage kiosks,
 * and older/lower-brightness TVs in hallway ambient lighting.
 */

const DARK_TOKENS = {
  '--board-bg': '#070A13',
  '--board-surface': '#0D1322',
  '--board-surface-card': '#131B2E',
  '--board-surface-highlight': '#1A243B',
  '--board-border': 'rgba(255, 255, 255, 0.14)',
  '--board-border-strong': 'rgba(255, 255, 255, 0.28)',
  '--board-text-primary': '#FFFFFF',
  '--board-text-secondary': '#94A3B8',
  '--board-text-muted': '#64748B',

  // High-visibility accents
  '--board-accent-primary': '#38BDF8',
  '--board-accent-glow': 'rgba(56, 189, 248, 0.25)',
  '--board-accent-active-period': '#3B82F6',
  '--board-active-period-border': '#60A5FA',

  // Status tokens: Changed / Substitution
  '--board-status-changed-bg': 'rgba(245, 158, 11, 0.16)',
  '--board-status-changed-border': '#F59E0B',
  '--board-status-changed-text': '#FDE68A',
  '--board-status-changed-badge-bg': '#D97706',
  '--board-status-changed-badge-text': '#FFFFFF',

  // Status tokens: Cancelled / Odpadá
  '--board-status-cancelled-bg': 'rgba(239, 68, 68, 0.16)',
  '--board-status-cancelled-border': '#EF4444',
  '--board-status-cancelled-text': '#FECACA',
  '--board-status-cancelled-badge-bg': '#DC2626',
  '--board-status-cancelled-badge-text': '#FFFFFF',

  // Status tokens: Event
  '--board-status-event-bg': 'rgba(14, 165, 233, 0.16)',
  '--board-status-event-border': '#38BDF8',
  '--board-status-event-text': '#BAE6FD',
  '--board-status-event-badge-bg': '#0284C7',
  '--board-status-event-badge-text': '#FFFFFF',

  // Classroom / Room badge
  '--board-room-bg': '#1E293B',
  '--board-room-border': 'rgba(255, 255, 255, 0.2)',
  '--board-room-text': '#38BDF8',

  // Progress Bar
  '--board-progress-track': 'rgba(56, 189, 248, 0.15)',
  '--board-progress-bar': '#38BDF8',
}

const LIGHT_TOKENS = {
  '--board-bg': '#F1F5F9',
  '--board-surface': '#FFFFFF',
  '--board-surface-card': '#FFFFFF',
  '--board-surface-highlight': '#E2E8F0',
  '--board-border': 'rgba(15, 23, 42, 0.14)',
  '--board-border-strong': 'rgba(15, 23, 42, 0.3)',
  '--board-text-primary': '#0F172A',
  '--board-text-secondary': '#475569',
  '--board-text-muted': '#64748B',

  // High-visibility accents
  '--board-accent-primary': '#0284C7',
  '--board-accent-glow': 'rgba(2, 132, 199, 0.2)',
  '--board-accent-active-period': '#2563EB',
  '--board-active-period-border': '#2563EB',

  // Status tokens: Changed / Substitution
  '--board-status-changed-bg': '#FEF3C7',
  '--board-status-changed-border': '#D97706',
  '--board-status-changed-text': '#92400E',
  '--board-status-changed-badge-bg': '#D97706',
  '--board-status-changed-badge-text': '#FFFFFF',

  // Status tokens: Cancelled / Odpadá
  '--board-status-cancelled-bg': '#FEE2E2',
  '--board-status-cancelled-border': '#DC2626',
  '--board-status-cancelled-text': '#991B1B',
  '--board-status-cancelled-badge-bg': '#DC2626',
  '--board-status-cancelled-badge-text': '#FFFFFF',

  // Status tokens: Event
  '--board-status-event-bg': '#E0F2FE',
  '--board-status-event-border': '#0284C7',
  '--board-status-event-text': '#0369A1',
  '--board-status-event-badge-bg': '#0284C7',
  '--board-status-event-badge-text': '#FFFFFF',

  // Classroom / Room badge
  '--board-room-bg': '#E2E8F0',
  '--board-room-border': 'rgba(15, 23, 42, 0.2)',
  '--board-room-text': '#0369A1',

  // Progress Bar
  '--board-progress-track': 'rgba(2, 132, 199, 0.15)',
  '--board-progress-bar': '#0284C7',
}

const SHARED_TOKENS = {
  '--board-font-family': 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  '--board-kiosk-gutter': 'clamp(1rem, 1.8vw, 2.2rem)',
  '--board-kiosk-gap': 'clamp(0.45rem, 0.7vw, 1rem)',
  '--board-radius-large': '16px',
  '--board-radius-medium': '12px',
  '--board-radius-small': '8px',
  '--board-radius-pill': '999px',
}

function applyTokens(tokens) {
  const root = document.documentElement
  Object.entries(tokens).forEach(([name, value]) => {
    root.style.setProperty(name, value)
  })
}

export function applyKioskTheme() {
  const useLight = import.meta.env.VITE_USE_LIGHT_THEME === 'true'
  const tokens = useLight ? LIGHT_TOKENS : DARK_TOKENS
  applyTokens({ ...tokens, ...SHARED_TOKENS })
}
