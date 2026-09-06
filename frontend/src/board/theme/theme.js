/**
 * EduSign 2.0 - Airport-grade High-Contrast Digital Signage Theme
 * Optimized for distance legibility, high glare corridors, and older dim TV panels.
 */

const DARK_TOKENS = {
  // Deep space canvas & structural surfaces
  '--kiosk-bg': '#070A12',
  '--kiosk-surface': '#0C111E',
  '--kiosk-card': '#111728',
  '--kiosk-card-hover': '#162035',
  '--kiosk-card-raised': '#1A243C',
  
  // Structural borders with high visibility (prevents muddy display on older panels)
  '--kiosk-border-subtle': 'rgba(255, 255, 255, 0.08)',
  '--kiosk-border': 'rgba(255, 255, 255, 0.16)',
  '--kiosk-border-strong': 'rgba(255, 255, 255, 0.28)',
  '--kiosk-border-accent': 'rgba(56, 189, 248, 0.5)',

  // Text Hierarchy (WCAG AAA compliant against #070A12)
  '--kiosk-text-white': '#FFFFFF',
  '--kiosk-text-primary': '#F1F5F9',
  '--kiosk-text-secondary': '#94A3B8',
  '--kiosk-text-muted': '#64748B',

  // Electric Signage Accents
  '--kiosk-cyan': '#38BDF8',
  '--kiosk-cyan-glow': 'rgba(56, 189, 248, 0.25)',
  '--kiosk-cyan-dark': '#0369A1',
  '--kiosk-cyan-subtle': 'rgba(56, 189, 248, 0.12)',

  '--kiosk-emerald': '#10B981',
  '--kiosk-emerald-glow': 'rgba(16, 185, 129, 0.25)',
  '--kiosk-emerald-subtle': 'rgba(16, 185, 129, 0.14)',

  '--kiosk-amber': '#F59E0B',
  '--kiosk-amber-glow': 'rgba(245, 158, 11, 0.28)',
  '--kiosk-amber-subtle': 'rgba(245, 158, 11, 0.15)',
  '--kiosk-amber-text': '#FDE68A',

  '--kiosk-rose': '#F43F5E',
  '--kiosk-rose-glow': 'rgba(244, 63, 94, 0.28)',
  '--kiosk-rose-subtle': 'rgba(244, 63, 94, 0.15)',
  '--kiosk-rose-text': '#FECDD3',

  '--kiosk-purple': '#A855F7',
  '--kiosk-purple-subtle': 'rgba(168, 85, 247, 0.14)',

  // Active period column glow
  '--kiosk-active-col-border': '#38BDF8',
  '--kiosk-active-col-bg': 'rgba(56, 189, 248, 0.04)',
}

const LIGHT_TOKENS = {
  '--kiosk-bg': '#F1F5F9',
  '--kiosk-surface': '#FFFFFF',
  '--kiosk-card': '#F8FAFC',
  '--kiosk-card-hover': '#F1F5F9',
  '--kiosk-card-raised': '#E2E8F0',

  '--kiosk-border-subtle': 'rgba(15, 23, 42, 0.08)',
  '--kiosk-border': 'rgba(15, 23, 42, 0.16)',
  '--kiosk-border-strong': 'rgba(15, 23, 42, 0.32)',
  '--kiosk-border-accent': 'rgba(2, 132, 199, 0.6)',

  '--kiosk-text-white': '#0F172A',
  '--kiosk-text-primary': '#0F172A',
  '--kiosk-text-secondary': '#475569',
  '--kiosk-text-muted': '#64748B',

  '--kiosk-cyan': '#0284C7',
  '--kiosk-cyan-glow': 'rgba(2, 132, 199, 0.2)',
  '--kiosk-cyan-dark': '#0369A1',
  '--kiosk-cyan-subtle': '#E0F2FE',

  '--kiosk-emerald': '#059669',
  '--kiosk-emerald-glow': 'rgba(5, 150, 105, 0.2)',
  '--kiosk-emerald-subtle': '#D1FAE5',

  '--kiosk-amber': '#D97706',
  '--kiosk-amber-glow': 'rgba(217, 119, 6, 0.2)',
  '--kiosk-amber-subtle': '#FEF3C7',
  '--kiosk-amber-text': '#78350F',

  '--kiosk-rose': '#E11D48',
  '--kiosk-rose-glow': 'rgba(225, 29, 72, 0.2)',
  '--kiosk-rose-subtle': '#FFE4E6',
  '--kiosk-rose-text': '#881337',

  '--kiosk-purple': '#7E22CE',
  '--kiosk-purple-subtle': '#F3E8FF',

  '--kiosk-active-col-border': '#0284C7',
  '--kiosk-active-col-bg': 'rgba(2, 132, 199, 0.06)',
}

const SHARED_TOKENS = {
  '--kiosk-font': 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  '--kiosk-gutter': 'clamp(1rem, 1.6vw, 2.2rem)',
  '--kiosk-gap': 'clamp(0.45rem, 0.75vw, 1rem)',
  '--kiosk-radius-xl': '18px',
  '--kiosk-radius-lg': '14px',
  '--kiosk-radius-md': '10px',
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
  const useLight = import.meta.env.VITE_USE_LIGHT_THEME === 'true'
  const tokens = useLight ? LIGHT_TOKENS : DARK_TOKENS
  applyTokens({ ...tokens, ...SHARED_TOKENS })
}
