// Shared derivation of the board's on/off schedule from EduPage timetable
// data. This single source of truth is used BOTH by useScreenState (the live
// overlay decision) and by the debug/logging surfaces, so the printed break
// times always match what the board actually does.
//
// Segment kinds:
//   'morning'   → content (45 min arrival window before the first period)
//   'break'     → content (gap between periods inside the school day)
//   'in_class'  → black
//   'after'     → black (before morning window / after school end / weekends)

export function shiftMinutes(timeStr, deltaMinutes) {
  const [h, m] = (timeStr || '00:00').split(':').map(Number)
  const total = h * 60 + m + deltaMinutes
  if (total <= 0) return '00:00'
  if (total >= 1440) return '23:59'
  const newH = Math.floor(total / 60)
  const newM = total % 60
  return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`
}

export function isAllDayEvent(item) {
  return (
    item.type === 'event' &&
    (item.uniperiod === 'ad' || (item.starttime === '00:00' && item.endtime === '24:00'))
  )
}

export function collectDayItems(classes) {
  return (classes ?? [])
    .filter((cls) => cls.id !== 'global')
    .flatMap((cls) => (cls.ttitems ?? []).filter((item) => !isAllDayEvent(item)))
}

// Returns:
//   []  → no timetable items at all (weekend/holiday → black the whole day)
//   null → items exist but none carry usable times (never blank the screen)
//   segments array otherwise
export function buildDaySegments(classes) {
  const items = collectDayItems(classes)
  if (items.length === 0) return []

  const starts = items.map((i) => i.starttime).filter(Boolean)
  const ends = items.map((i) => i.endtime).filter(Boolean)
  if (starts.length === 0 || ends.length === 0) return null

  const schoolStart = starts.reduce((a, b) => (a < b ? a : b))
  const morningStart = shiftMinutes(schoolStart, -45)

  const merged = []
  const sorted = items
    .map((i) => ({ start: i.starttime, end: i.endtime }))
    .filter((p) => p.start && p.end)
    .sort((a, b) => a.start.localeCompare(b.start) || a.end.localeCompare(b.end))
  for (const p of sorted) {
    const last = merged[merged.length - 1]
    if (last && p.start <= last.end) {
      if (p.end > last.end) last.end = p.end
    } else {
      merged.push({ start: p.start, end: p.end })
    }
  }

  const segments = []
  const push = (start, end, kind) => {
    if (!start || !end || start >= end) return
    segments.push({ start, end, kind })
  }

  push('00:00', morningStart, 'after')
  push(morningStart, schoolStart, 'morning')
  let cursor = schoolStart
  for (const p of merged) {
    push(cursor, p.start, 'break')
    push(p.start, p.end, 'in_class')
    cursor = p.end > cursor ? p.end : cursor
  }
  push(cursor, '24:00', 'after')
  return segments
}

export function segmentKindIsContent(kind) {
  return kind === 'morning' || kind === 'break'
}

export function findActiveSegment(segments, hhmm) {
  return (segments ?? []).find((s) => s.start <= hhmm && hhmm < s.end) ?? null
}

const KIND_LABEL = {
  after: 'černá',
  morning: 'nástup',
  break: 'přestávka',
  in_class: 'výuka',
}

// One-line digest for console logs, e.g.:
//  Čt 10.09. · 07:15–08:00 nástup · 08:00–08:45 výuka · 08:45–08:55 přestávka …
export function formatScheduleLine(segments, dateLabel) {
  if (!segments) return `${dateLabel} · rozvrh bez použitelných časů`
  if (segments.length === 0) return `${dateLabel} · celý den černá (bez rozvrhu)`
  const parts = segments
    .filter((s) => s.kind !== 'after')
    .map((s) => `${s.start}–${s.end} ${KIND_LABEL[s.kind]}`)
  return `${dateLabel} · ${parts.length ? parts.join(' · ') : 'celý den černá'}`
}