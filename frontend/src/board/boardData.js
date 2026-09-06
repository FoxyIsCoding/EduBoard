import { CLASSES_PER_PAGE, EVENTS_PER_PAGE, SUBSTITUTIONS_PER_PAGE } from './constants'
import { cleanEventName, formatTimeRange, joinInline, trimJoined } from './formatters'
import { chunk, unique } from './utils'
import { isLocalMode } from './localMode'
import { getMockBoardPayload } from './mockData'

function readLookup(table, id) {
  if (!id) return ''
  return table?.data?.[id] ?? id
}

function normalizeClassLabel(value) {
  if (!value) return ''

  const romanPrefix = value.match(/^([IVX]+)(?=\.)/)?.[1]

  if (!romanPrefix) return value

  const map = {
    I: '1',
    II: '2',
    III: '3',
    IV: '4',
    V: '5',
    VI: '6',
    VII: '7',
    VIII: '8',
    IX: '9',
  }

  return map[romanPrefix] ? `${map[romanPrefix]}${value.slice(romanPrefix.length)}` : value
}

function getClassName(lookup, id) {
  return normalizeClassLabel(readLookup(lookup?.classes, id))
}

function getSubjectName(lookup, id) {
  return readLookup(lookup?.subjects, id)
}

function getTeacherName(lookup, id) {
  return readLookup(lookup?.teachers, id)
}

function getRoomName(lookup, id) {
  return readLookup(lookup?.classrooms, id)
}

export function getPeriods(lookup) {
  return Object.values(lookup?.periods?.data ?? {}).sort((left, right) => Number(left.period) - Number(right.period))
}

function getPeriodOrder(period) {
  if (period === 'ad') return -1
  const numeric = Number(period)
  return Number.isNaN(numeric) ? 999 : numeric
}

function sortItemsByPeriod(items) {
  return [...items].sort((left, right) => {
    const delta = getPeriodOrder(left.uniperiod) - getPeriodOrder(right.uniperiod)
    if (delta !== 0) return delta
    return (left.starttime ?? '').localeCompare(right.starttime ?? '')
  })
}

function allSettledSafe(promises) {
  if (typeof Promise.allSettled === 'function') {
    return Promise.allSettled(promises)
  }
  return Promise.all(
    promises.map((p) =>
      p
        .then((value) => ({ status: 'fulfilled', value }))
        .catch((reason) => ({ status: 'rejected', reason })),
    ),
  )
}

async function requestJson(path, timeoutMs = 12000) {
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null
  const timeoutId = controller ? setTimeout(() => controller.abort(), timeoutMs) : null

  try {
    const response = await fetch(path, controller ? { signal: controller.signal } : {})
    if (!response.ok) {
      throw new Error(`${path} vrátilo ${response.status}`)
    }
    return await response.json()
  } finally {
    if (timeoutId) clearTimeout(timeoutId)
  }
}

export async function fetchBoardPayload() {
  if (isLocalMode) {
    return getMockBoardPayload()
  }

  const [lookup, timetable, events] = await allSettledSafe([
    requestJson('/api/data'),
    requestJson('/api/timetable'),
    requestJson('/api/events'),
  ])

  // If backend is not running (e.g. standalone frontend dev), fallback to mock data
  if (lookup.status === 'rejected' && timetable.status === 'rejected') {
    return getMockBoardPayload()
  }

  return {
    lookup: lookup.status === 'fulfilled' ? lookup.value : null,
    timetable: timetable.status === 'fulfilled' ? timetable.value : null,
    events: events.status === 'fulfilled' ? events.value : null,
    issues: [
      ...(lookup.status === 'rejected' ? [lookup.reason?.message ?? 'Nepodařilo se načíst data.'] : []),
      ...(timetable.status === 'rejected' ? [timetable.reason?.message ?? 'Nepodařilo se načíst rozvrh.'] : []),
      ...(events.status === 'rejected' ? [events.reason?.message ?? 'Nepodařilo se načíst akce.'] : []),
    ],
  }
}

function formatCardMetaLines(item, lookup) {
  const teachers = unique((item.teacherids ?? []).map((teacherId) => getTeacherName(lookup, teacherId)))
  const rooms = unique((item.classroomids ?? []).map((roomId) => getRoomName(lookup, roomId)))
  const lines = []

  if (teachers.length) lines.push(trimJoined(teachers, 3))
  if (rooms.length) lines.push(trimJoined(rooms, 3))

  return lines
}

function normalizeGroupLabel(value) {
  if (!value) return ''

  return value
    .trim()
    .replace(/\bskupina\b/gi, 'skup.')
    .replace(/\s+/g, ' ')
}

function getGroupLabel(item) {
  return unique((item.groupnames ?? []).map((value) => normalizeGroupLabel(value)).filter(Boolean)).join(' • ')
}

function buildLessonEntry(item, lookup, period) {
  if (item.type === 'event') {
    const sameAsPeriod = period && item.starttime === period.start && item.endtime === period.end

    return {
      title: cleanEventName(item.name),
      metaLines: sameAsPeriod ? [] : [formatTimeRange(item.starttime, item.endtime)],
      kicker: '',
      type: 'event',
    }
  }

  return {
    title: getSubjectName(lookup, item.subjectid) || 'Předmět',
    metaLines: formatCardMetaLines(item, lookup),
    kicker: getGroupLabel(item),
    type: 'card',
  }
}

function timeToMinutes(time) {
  if (!time) return 0
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

function calculatePeriodSpan(item, periods) {
  if (!item.starttime || !item.endtime) return { span: 1, periodIndex: 0 }
  const itemStart = timeToMinutes(item.starttime)
  const itemEnd = timeToMinutes(item.endtime)
  let span = 0
  let firstIndex = -1
  for (let i = 0; i < periods.length; i++) {
    const pStart = timeToMinutes(periods[i].start)
    const pEnd = timeToMinutes(periods[i].end)
    if (itemStart < pEnd && itemEnd > pStart) {
      span++
      if (firstIndex === -1) firstIndex = i
    }
  }
  return { span: Math.max(span, 1), periodIndex: firstIndex >= 0 ? firstIndex : 0 }
}

function buildLessonCell(items, lookup, period, periods) {
  if (!items.length) return null

  const cards = items.filter((item) => item.type === 'card')
  const events = items.filter((item) => item.type === 'event')
  const activeCards = cards.filter((item) => !item.removed)
  const removedCards = cards.filter((item) => item.removed)
  const removedOnly = removedCards.length > 0 && activeCards.length === 0
  const changed = activeCards.some((item) => item.changed) || (removedCards.length > 0 && activeCards.length > 0)
  const showEventAsPrimary = activeCards.length === 0 && events.length > 0

  if (removedOnly) {
    return {
      layout: 'blank',
      entries: [],
      note: '',
      tone: 'empty',
      span: 1,
    }
  }

  const splitCards = activeCards.filter((item) => getGroupLabel(item))
  const splitLayout = splitCards.length >= 2
  const sourceItems = showEventAsPrimary ? events : activeCards
  const spanInfo = calculatePeriodSpan(sourceItems[0] ?? {}, periods)

  return {
    layout: splitLayout ? 'split' : 'stack',
    entries: splitLayout
      ? splitCards.slice(0, 2).map((item) => buildLessonEntry(item, lookup, period))
      : sourceItems.slice(0, 2).map((item) => buildLessonEntry(item, lookup, period)),
    note: '',
    tone: showEventAsPrimary ? 'event' : changed ? 'changed' : 'default',
    span: spanInfo.span,
  }
}

export function collectTimetableRows(timetable, lookup, periods) {
  return (timetable?.classes ?? [])
    .filter((row) => row.id !== 'global')
    .map((row) => {
      const byPeriod = new Map()

      for (const item of sortItemsByPeriod(row.ttitems ?? [])) {
        const allDay =
          item.type === 'event' &&
          (item.uniperiod === 'ad' || (item.starttime === '00:00' && item.endtime === '24:00'))

        if (allDay) continue

        const periodKey = String(item.uniperiod)
        const current = byPeriod.get(periodKey) ?? []
        current.push(item)
        byPeriod.set(periodKey, current)
      }

      const cells = Object.fromEntries(
        periods.map((period) => {
          const periodKey = String(period.period)
          return [periodKey, buildLessonCell(byPeriod.get(periodKey) ?? [], lookup, period, periods)]
        }),
      )

      return {
        id: row.id,
        name: getClassName(lookup, row.id),
        cells,
      }
    })
}

export function collectEvents(eventsFeed, timetable, lookup) {
  const eventItems = [
    ...(eventsFeed?.classes?.flatMap((row) => row.ttitems ?? []) ?? []),
    ...(timetable?.classes?.flatMap((row) =>
      (row.ttitems ?? []).filter(
        (item) =>
          item.type === 'event' &&
          (item.uniperiod === 'ad' || (item.starttime === '00:00' && item.endtime === '24:00')),
      ),
    ) ?? []),
  ]

  const seen = new Set()

  return eventItems
    .filter((item) => item.type === 'event')
    .map((item) => {
      const signature = [
        item.name,
        item.starttime,
        item.endtime,
        unique(item.classids ?? []).sort().join(','),
      ].join('|')

      if (seen.has(signature)) return null
      seen.add(signature)

      const classes = unique((item.classids ?? []).map((classId) => getClassName(lookup, classId)))
      const rooms = unique((item.classroomids ?? []).map((roomId) => getRoomName(lookup, roomId)))
      const teachers = unique((item.teacherids ?? []).map((teacherId) => getTeacherName(lookup, teacherId)))

      return {
        key: signature,
        order: getPeriodOrder(item.uniperiod),
        timeLabel: formatTimeRange(item.starttime, item.endtime),
        title: cleanEventName(item.name),
        classesLabel: classes.length ? joinInline(classes) : 'Celá škola',
        roomLabel: rooms.length ? joinInline(rooms) : '',
        teacherLabel: teachers.length ? joinInline(teachers) : '',
      }
    })
    .filter(Boolean)
    .sort((left, right) => left.order - right.order || left.title.localeCompare(right.title, 'cs'))
}

export function collectSubstitutions(timetable, lookup) {
  const seen = new Set()

  return (timetable?.classes ?? [])
    .filter((row) => row.id !== 'global')
    .flatMap((row) => {
      const className = getClassName(lookup, row.id)

      return sortItemsByPeriod(row.ttitems ?? [])
        .filter((item) => item.type === 'card' && (item.changed || item.removed))
        .map((item) => {
          const periodInfo = lookup?.periods?.data?.[String(item.uniperiod)] ?? null
          const subjectLabel = getSubjectName(lookup, item.subjectid) || 'Předmět'
          const teacherLabel = joinInline(unique((item.teacherids ?? []).map((teacherId) => getTeacherName(lookup, teacherId))))
          const roomLabel = joinInline(unique((item.classroomids ?? []).map((roomId) => getRoomName(lookup, roomId))))
          const groupLabel = getGroupLabel(item)
          const periodShort = periodInfo?.short || String(item.uniperiod ?? '?')
          const periodTime = formatTimeRange(item.starttime ?? periodInfo?.start, item.endtime ?? periodInfo?.end)
          const state = item.removed ? 'cancelled' : 'changed'
          const signature = [
            row.id,
            item.uniperiod,
            item.subjectid,
            unique(item.teacherids ?? []).sort().join(','),
            unique(item.classroomids ?? []).sort().join(','),
            unique(item.groupnames ?? []).sort().join(','),
            state,
          ].join('|')

          if (seen.has(signature)) return null
          seen.add(signature)

          return {
            key: signature,
            order: getPeriodOrder(item.uniperiod),
            className,
            subjectLabel,
            teacherLabel,
            roomLabel,
            groupLabel,
            periodShort,
            periodTime,
            state,
          }
        })
        .filter(Boolean)
    })
    .sort(
      (left, right) =>
        left.order - right.order ||
        left.className.localeCompare(right.className, 'cs') ||
        left.subjectLabel.localeCompare(right.subjectLabel, 'cs'),
    )
}

export function buildPages(rows, events, substitutions) {
  const pages = []

  chunk(rows, CLASSES_PER_PAGE).forEach((pageRows, index) => {
    pages.push({ id: `timetable-${index}`, type: 'timetable', rows: pageRows })
  })

  const eventPages = chunk(events, EVENTS_PER_PAGE)

  if (eventPages.length === 0) {
    pages.push({ id: 'events-empty', type: 'events', events: [] })
  } else {
    eventPages.forEach((pageEvents, index) => {
      pages.push({ id: `events-${index}`, type: 'events', events: pageEvents })
    })
  }

  const substitutionPages = chunk(substitutions, SUBSTITUTIONS_PER_PAGE)

  if (substitutionPages.length > 0) {
    substitutionPages.forEach((pageSubstitutions, index) => {
      pages.push({
        id: `substitutions-${index}`,
        type: 'substitutions',
        substitutions: pageSubstitutions,
      })
    })
  }

  if (pages.length === 0) pages.push({ id: 'empty', type: 'empty' })

  return pages
}

export function getPageTitle(page) {
  if (page?.type === 'events') return 'Školní Akce'
  if (page?.type === 'substitutions') return 'Suplování'
  if (page?.type === 'timetable') return 'Denní Rozvrh'
  return 'Školní Tabule'
}
