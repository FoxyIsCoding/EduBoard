import { capitalize, chunk, unique } from './utils'

const clockFormatter = new Intl.DateTimeFormat('cs-CZ', {
  hour: '2-digit',
  minute: '2-digit',
})

const clock12Formatter = new Intl.DateTimeFormat('en-US', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: true,
})

const clockSecondsFormatter = new Intl.DateTimeFormat('cs-CZ', {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
})

const clock12SecondsFormatter = new Intl.DateTimeFormat('en-US', {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: true,
})

const longDateFormatter = new Intl.DateTimeFormat('cs-CZ', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

export function formatClock(value, hour12 = false, withSeconds = false) {
  if (withSeconds) return (hour12 ? clock12SecondsFormatter : clockSecondsFormatter).format(value)
  return (hour12 ? clock12Formatter : clockFormatter).format(value)
}

export function formatCurrentDate(now) {
  return capitalize(longDateFormatter.format(now))
}

export function formatDateParts(now) {
  const full = formatCurrentDate(now)
  const [weekday, ...rest] = full.split(' ')

  return {
    weekday,
    fullDate: rest.join(' '),
  }
}

export function formatTimeRange(start, end) {
  if (!start && !end) return 'Bez času'
  if (start === '00:00' && end === '24:00') return 'Celý den'
  if (start && end) return `${start} - ${end}`
  return start || end || 'Bez času'
}

export function trimJoined(values, limit = 3, separator = ', ') {
  if (!values.length) return ''
  if (values.length <= limit) return values.join(separator)
  return `${values.slice(0, limit).join(separator)} +${values.length - limit}`
}

export function joinInline(values, separator = ', ') {
  const filtered = unique(values)

  if (!filtered.length) return ''

  return filtered.join(separator)
}

export function joinLines(values, perLine = 3) {
  const filtered = unique(values)

  if (!filtered.length) return ''

  return chunk(filtered, perLine)
    .map((group) => group.join(', '))
    .join('\n')
}

export function cleanEventName(name) {
  if (!name) return 'Událost'
  const parts = name.trim().split(':')
  return parts.length > 1 ? parts.slice(1).join(':').trim() : name.trim()
}
