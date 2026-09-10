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

// Canonical bell schedule of the school day. Hardcoded on purpose: lessons are
// spent inside period slots, so even when a class is split into double hours
// (two periods back to back, possibly overlapping different classes' slots),
// the real breaks between periods must stay visible. The timetable is only used
// to detect which hours are actually occupied (see buildDaySegments).
export const BELL_SCHEDULE = [
  // 1. hodina
  { start: '08:00', end: '08:45', kind: 'in_class' },
  { start: '08:45', end: '08:55', kind: 'break' },
  // 2. hodina
  { start: '08:55', end: '09:40', kind: 'in_class' },
  { start: '09:40', end: '10:00', kind: 'break' }, // velká svačinová přestávka
  // 3. hodina
  { start: '10:00', end: '10:45', kind: 'in_class' },
  { start: '10:45', end: '10:55', kind: 'break' },
  // 4. hodina
  { start: '10:55', end: '11:40', kind: 'in_class' },
  { start: '11:40', end: '11:50', kind: 'break' },
  // 5. hodina
  { start: '11:50', end: '12:35', kind: 'in_class' },
  { start: '12:35', end: '12:45', kind: 'break' },
  // 6. hodina
  { start: '12:45', end: '13:30', kind: 'in_class' },
  { start: '13:30', end: '14:25', kind: 'break' }, // polední přestávka
  // 7. hodina
  { start: '14:25', end: '15:10', kind: 'in_class' },
  { start: '15:10', end: '15:15', kind: 'break' },
  // 8. hodina
  { start: '15:15', end: '16:00', kind: 'in_class' },
  { start: '16:00', end: '16:05', kind: 'break' },
  // 9. hodina
  { start: '16:05', end: '16:50', kind: 'in_class' },
]

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

  // Only the occupied window is derived from the timetable: the first lesson
  // (opens an arrival/"nástup" window) and the last lesson end (after it the
  // board fully turns off). The structure in between is the fixed bell schedule.
  const schoolStart = starts.reduce((a, b) => (a < b ? a : b))
  const schoolEnd = ends.reduce((a, b) => (a > b ? a : b))
  if (schoolEnd <= schoolStart) return []
  const morningStart = shiftMinutes(schoolStart, -45)

  const segments = []
  const push = (start, end, kind) => {
    if (!start || !end || start >= end) return
    segments.push({ start, end, kind })
  }

  push('00:00', morningStart, 'after')
  push(morningStart, schoolStart, 'morning')
  for (const seg of BELL_SCHEDULE) {
    // Clip each slot to the actually occupied school day (skip hours that are
    // over, truncate one that outlives the real last lesson).
    const start = seg.start > schoolStart ? seg.start : schoolStart
    const end = seg.end < schoolEnd ? seg.end : schoolEnd
    push(start, end, seg.kind)
  }
  push(schoolEnd, '24:00', 'after')
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