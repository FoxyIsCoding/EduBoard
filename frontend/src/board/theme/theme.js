/**
 * EduSign - Swiss Editorial Digital Signage Design System
 * Clean, high-contrast, professional design optimized for daytime school hallway TVs.
 * Defaults to crisp Light Mode with high legibility for students (aged 8-20) and teachers.
 */

const LIGHT_TOKENS = {
  // Crisp daylight canvas & structural surfaces
  '--kiosk-bg': '#F1F5F9',
  '--kiosk-surface': '#FFFFFF',
  '--kiosk-card': '#FFFFFF',
  '--kiosk-card-subtle': '#F8FAFC',
  '--kiosk-card-hover': '#F8FAFC',
  '--kiosk-card-raised': '#FFFFFF',
  '--kiosk-header-bg': '#0F172A',

  // Structural borders with high visibility on older TV panels
  '--kiosk-border-subtle': '#E2E8F0',
  '--kiosk-border': '#CBD5E1',
  '--kiosk-border-strong': '#94A3B8',
  '--kiosk-border-accent': '#2563EB',

  // High-contrast ink typography (WCAG AAA compliant)
  '--kiosk-text-primary': '#0F172A',
  '--kiosk-text-secondary': '#475569',
  '--kiosk-text-muted': '#64748B',
  '--kiosk-text-inverse': '#FFFFFF',

  // Institutional Color Accents
  '--kiosk-primary': '#2563EB',
  '--kiosk-primary-subtle': '#EFF6FF',
  '--kiosk-primary-border': '#BFDBFE',
  '--kiosk-primary-text': '#1D4ED8',

  '--kiosk-emerald': '#16A34A',
  '--kiosk-emerald-subtle': '#DCFCE7',
  '--kiosk-emerald-border': '#86EFAC',
  '--kiosk-emerald-text': '#15803D',

  '--kiosk-amber': '#D97706',
  '--kiosk-amber-subtle': '#FFFBEB',
  '--kiosk-amber-border': '#FCD34D',
  '--kiosk-amber-text': '#B45309',

  '--kiosk-rose': '#DC2626',
  '--kiosk-rose-subtle': '#FEF2F2',
  '--kiosk-rose-border': '#FCA5A5',
  '--kiosk-rose-text': '#B91C1C',

  '--kiosk-purple': '#7C3AED',
  '--kiosk-purple-subtle': '#F5F3FF',
  '--kiosk-purple-border': '#DDD6FE',
  '--kiosk-purple-text': '#6D28D9',

  // Active period highlight
  '--kiosk-active-bg': '#EFF6FF',
  '--kiosk-active-border': '#2563EB',

  // Room pill
  '--kiosk-room-bg': '#0F172A',
  '--kiosk-room-text': '#FFFFFF',
}

const DARK_TOKENS = {
  // Deep neutral slate canvas (restrained and professional, zero neon glow)
  '--kiosk-bg': '#0B0F19',
  '--kiosk-surface': '#111827',
  '--kiosk-card': '#182234',
  '--kiosk-card-subtle': '#131B2B',
  '--kiosk-card-hover': '#1F2C42',
  '--kiosk-card-raised': '#24334C',
  '--kiosk-header-bg': '#1E293B',

  '--kiosk-border-subtle': 'rgba(255, 255, 255, 0.08)',
  '--kiosk-border': 'rgba(255, 255, 255, 0.16)',
  '--kiosk-border-strong': 'rgba(255, 255, 255, 0.28)',
  '--kiosk-border-accent': '#38BDF8',

  '--kiosk-text-primary': '#F8FAFC',
  '--kiosk-text-secondary': '#94A3B8',
  '--kiosk-text-muted': '#64748B',
  '--kiosk-text-inverse': '#0F172A',

  '--kiosk-primary': '#38BDF8',
  '--kiosk-primary-subtle': 'rgba(56, 189, 248, 0.12)',
  '--kiosk-primary-border': 'rgba(56, 189, 248, 0.3)',
  '--kiosk-primary-text': '#38BDF8',

  '--kiosk-emerald': '#10B981',
  '--kiosk-emerald-subtle': 'rgba(16, 185, 129, 0.14)',
  '--kiosk-emerald-border': 'rgba(16, 185, 129, 0.3)',
  '--kiosk-emerald-text': '#34D399',

  '--kiosk-amber': '#F59E0B',
  '--kiosk-amber-subtle': 'rgba(245, 158, 11, 0.14)',
  '--kiosk-amber-border': 'rgba(245, 158, 11, 0.35)',
  '--kiosk-amber-text': '#FBBF24',

  '--kiosk-rose': '#EF4444',
  '--kiosk-rose-subtle': 'rgba(239, 68, 68, 0.14)',
  '--kiosk-rose-border': 'rgba(239, 68, 68, 0.35)',
  '--kiosk-rose-text': '#F87171',

  '--kiosk-purple': '#A855F7',
  '--kiosk-purple-subtle': 'rgba(168, 85, 247, 0.14)',
  '--kiosk-purple-border': 'rgba(168, 85, 247, 0.3)',
  '--kiosk-purple-text': '#C084FC',

  '--kiosk-active-bg': 'rgba(56, 189, 248, 0.1)',
  '--kiosk-active-border': '#38BDF8',

  '--kiosk-room-bg': '#334155',
  '--kiosk-room-text': '#F8FAFC',
}

const SHARED_TOKENS = {
  '--kiosk-font': 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  '--kiosk-gutter': 'clamp(0.85rem, 1.4vw, 1.8rem)',
  '--kiosk-gap': 'clamp(0.4rem, 0.65vw, 0.85rem)',
  '--kiosk-radius-xl': '14px',
  '--kiosk-radius-lg': '10px',
  '--kiosk-radius-md': '8px',
  '--kiosk-radius-sm': '6px',
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

  // Default to clean, accessible Light Mode unless explicitly set to dark
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
