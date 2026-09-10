const BORDERS = {
  screen: 'border:2px solid #3b82f6; background:#1e40af22; color:#93c5fd; font-weight:bold; padding:2px 6px; border-radius:4px;',
  screenOff: 'border:2px solid #6b7280; background:#37415122; color:#9ca3af; padding:2px 6px; border-radius:4px;',
  page: 'border:2px solid #22c55e; background:#16653422; color:#86efac; font-weight:bold; padding:2px 6px; border-radius:4px;',
  data: 'border:2px solid #f97316; background:#9a341222; color:#fdba74; font-weight:bold; padding:2px 6px; border-radius:4px;',
  clock: 'border:2px solid #a855f7; background:#6b21a822; color:#c084fc; padding:2px 6px; border-radius:4px;',
  tick: 'color:#6b7280; font-style:italic;',
  error: 'border:2px solid #ef4444; background:#7f1d1d22; color:#fca5a5; font-weight:bold; padding:2px 6px; border-radius:4px;',
  warn: 'border:2px solid #eab308; background:#854d0e22; color:#fde047; padding:2px 6px; border-radius:4px;',
}

const isDebug = import.meta.env.VITE_DEBUG === 'true' || import.meta.env.DEV

let tickCounter = 0

export function logScreenState(msg, data = '') {
  if (!isDebug) return
  console.log(`%c🖥 SCREEN ${msg}`, BORDERS.screen, data)
}

const SCHEDULE_STYLE = 'border:1px solid #14b8a6; background:#134e4a33; color:#5eead4; font-weight:bold; padding:2px 6px; border-radius:4px;'

export function logScheduleDay(msg, data = '') {
  console.info(`%c📅 ROZVRH ${msg}`, SCHEDULE_STYLE, data)
}

export function logScreenTick(msg, data = '') {
  if (!isDebug) return
  tickCounter++
  if (tickCounter % 10 === 0) {
    console.log(`%c  ⏱ tick#${tickCounter} ${msg}`, BORDERS.tick, data)
  }
}

export function logScreenChange(msg, data = '') {
  if (!isDebug) return
  console.log(`%c🔲 OVERLAY ${msg}`, BORDERS.screenOff, data)
}

export function logPageRotation(msg, data = '') {
  if (!isDebug) return
  console.log(`%c🔄 PAGE ${msg}`, BORDERS.page, data)
}

export function logDataRefresh(msg, data = '') {
  if (!isDebug) return
  console.log(`%c📦 DATA ${msg}`, BORDERS.data, data)
}

export function logClockTick(msg, data = '') {
  if (!isDebug) return
  console.log(`%c⏰ CLOCK ${msg}`, BORDERS.clock, data)
}

export function logError(msg, data = '') {
  console.error(`%c❌ ERROR ${msg}`, BORDERS.error, data)
}

export function logWarn(msg, data = '') {
  console.warn(`%c⚠️ WARN ${msg}`, BORDERS.warn, data)
}

export function logBorder(msg, style = 'info') {
  if (!isDebug && style !== 'error') return
  const s = {
    info: 'border:1px solid #3b82f6; background:#1e3a5f; color:#bfdbfe; padding:4px 8px; border-radius:6px; font-size:13px;',
    success: 'border:2px solid #22c55e; background:#14532d; color:#bbf7d0; padding:4px 8px; border-radius:6px; font-size:13px; font-weight:bold;',
    warning: 'border:2px solid #eab308; background:#422006; color:#fef08a; padding:4px 8px; border-radius:6px; font-size:13px; font-weight:bold;',
    error: 'border:2px solid #ef4444; background:#450a0a; color:#fecaca; padding:4px 8px; border-radius:6px; font-size:13px; font-weight:bold;',
    big: 'border:3px solid #a855f7; background:#3b0764; color:#e9d5ff; padding:6px 12px; border-radius:8px; font-size:16px; font-weight:bold;',
  }[style] || 'color:inherit;'
  console.log(`%c${msg}`, s)
}
