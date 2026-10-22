// Hardcoded bell schedule and screen on/off derivation.
//
// The screen turns ON only during breaks (black during lessons, before the
// first period and after the last one). The bell times below are the real
// Zvonění of ZŠ a SŠ (zssokolnice) — no live timetable data is used to decide
// when the screen is on/off; the whole schedule is fixed here.
//
// Segment kinds:
//   'break'    → content (gap between lessons — the screen is ON)
//   'in_class' → black (a lesson is in progress)
//   'after'    → black (before school / after school / weekends)

export const BELL_SCHEDULE = [
  // 0. hodina
  { start: '07:00', end: '07:45', kind: 'in_class' },
  { start: '07:45', end: '08:00', kind: 'break' },
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
  { start: '13:30', end: '13:35', kind: 'break' },
  // 7. hodina
  { start: '13:35', end: '14:20', kind: 'in_class' },
  { start: '14:20', end: '14:25', kind: 'break' },
  // 8. hodina
  { start: '14:25', end: '15:10', kind: 'in_class' },
  { start: '15:10', end: '15:15', kind: 'break' },
  // 9. hodina
  { start: '15:15', end: '16:00', kind: 'in_class' },
]

const SCHOOL_DAY_START = '07:00'
const SCHOOL_DAY_END = '16:00'

// Monday–Friday. Weekends are the only "day off" — holidays intentionally run
// the normal schedule (no timetable dependency).
export function isSchoolDay(date = new Date()) {
  const dow = date.getDay()
  return dow >= 1 && dow <= 5
}

// Returns:
//   []  → weekend (whole day black)
//   segments array otherwise (fixed weekday schedule)
export function buildDaySegments(date = new Date()) {
  if (!isSchoolDay(date)) return []

  const segments = []
  const push = (start, end, kind) => {
    if (!start || !end || start >= end) return
    segments.push({ start, end, kind })
  }

  push('00:00', SCHOOL_DAY_START, 'after')
  for (const seg of BELL_SCHEDULE) push(seg.start, seg.end, seg.kind)
  push(SCHOOL_DAY_END, '24:00', 'after')
  return segments
}

export function segmentKindIsContent(kind) {
  return kind === 'break'
}

export function findActiveSegment(segments, hhmm) {
  return (segments ?? []).find((s) => s.start <= hhmm && hhmm < s.end) ?? null
}

const KIND_LABEL = {
  after: 'černá',
  break: 'přestávka',
  in_class: 'výuka',
}

// One-line digest for console logs, e.g.:
//  Čt 22.10. · 07:00–07:45 výuka · 07:45–08:00 přestávka · 08:00–08:45 výuka …
export function formatScheduleLine(segments, dateLabel) {
  if (segments === null) return `${dateLabel} · rozvrh bez použitelných časů`
  if (segments.length === 0) return `${dateLabel} · celý den černá (víkend)`
  const parts = segments
    .filter((s) => s.kind !== 'after')
    .map((s) => `${s.start}–${s.end} ${KIND_LABEL[s.kind]}`)
  return `${dateLabel} · ${parts.length ? parts.join(' · ') : 'celý den černá'}`
}