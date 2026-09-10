import { useEffect, useMemo, useRef, useState } from 'react'
import { isLocalMode } from '../localMode'
import { getNow } from '../timeSync'
import { getSettings } from '../settings'
import { logScreenState, logScheduleDay } from '../logger'
import { buildDaySegments, findActiveSegment, segmentKindIsContent, formatScheduleLine } from '../schedule'

function isSameLocalDay(dateA, dateB) {
  return (
    dateA.getFullYear() === dateB.getFullYear() &&
    dateA.getMonth() === dateB.getMonth() &&
    dateA.getDate() === dateB.getDate()
  )
}

export function useScreenState(timetable, loading, hasBoardData, fetchedAt) {
  const [showOverlay, setShowOverlay] = useState(false)
  const [overlayReason, setOverlayReason] = useState('after_school')
  const showOverlayRef = useRef(false)
  const overlayReasonRef = useRef('after_school')
  const scheduleKeyRef = useRef('')
  const timetableRef = useRef(timetable)
  const loadingRef = useRef(loading)
  const hasDataRef = useRef(hasBoardData)
  const fetchedAtRef = useRef(fetchedAt)

  // In local mode, the display turning-off schedule is completely disabled
  const isOverlayFeatureEnabled = !isLocalMode && import.meta.env.VITE_ENABLE_BREAK_ONLY_OVERLAY === 'true'

  useEffect(() => {
    timetableRef.current = timetable
    loadingRef.current = loading
    hasDataRef.current = hasBoardData
    fetchedAtRef.current = fetchedAt
  }, [timetable, loading, hasBoardData, fetchedAt])

  // Human-checkable digest of the day's on/off schedule (segments). Derived
  // during render so it always reflects the exact logic the overlay uses.
  const scheduleDay = useMemo(() => {
    if (timetable == null && fetchedAt == null) return null
    const t = getNow()
    const dayKey = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`
    const segments = buildDaySegments(timetable?.classes)
    const valid = !fetchedAt || isSameLocalDay(new Date(fetchedAt), t)
    return { dayKey, valid, segments }
  }, [timetable, fetchedAt])

  // Log the digest every time it changes so the school can verify break times
  // against the real bell schedule for a whole week.
  useEffect(() => {
    if (!scheduleDay) return
    const key = `${scheduleDay.dayKey}|${scheduleDay.valid ? '1' : '0'}|${scheduleDay.segments === null ? 'null' : (scheduleDay.segments?.map((s) => `${s.start}-${s.end}:${s.kind}`).join(',') ?? 'empty')}`
    if (key === scheduleKeyRef.current) return
    scheduleKeyRef.current = key
    const dateLabel = getNow().toLocaleDateString('cs-CZ', { weekday: 'short', day: '2-digit', month: '2-digit' })
    logScheduleDay(
      formatScheduleLine(scheduleDay.segments, dateLabel),
      scheduleDay.valid
        ? ''
        : `⚠️ data ${new Date(fetchedAt).toLocaleDateString('cs-CZ')} — rozvrh je starší, vypínání NEpoužito`,
    )
  }, [scheduleDay, fetchedAt])

  useEffect(() => {
    if (!isOverlayFeatureEnabled) {
      return undefined
    }

    const BLACK_CONFIRM_MS = 15000
    let pendingSince = 0

    const setContent = () => {
      if (showOverlayRef.current) {
        showOverlayRef.current = false
        logScreenState('screen ON (content)', overlayReasonRef.current)
        setShowOverlay(false)
      }
      pendingSince = 0
    }

    const setBlack = (reason) => {
      if (reason !== overlayReasonRef.current) {
        overlayReasonRef.current = reason
        setOverlayReason(reason)
      }
      if (!showOverlayRef.current) {
        showOverlayRef.current = true
        logScreenState('screen OFF (black overlay)', reason)
        setShowOverlay(true)
      }
    }

    const evaluate = () => {
      const t = getNow()
      const deviceTime = `${t.getHours().toString().padStart(2, '0')}:${t.getMinutes().toString().padStart(2, '0')}`

      // Experiment: never allow the overlay — always show content
      if (getSettings().forceContentOnly) {
        setContent()
        return
      }

      // No data loaded yet or still loading — show content
      if (loadingRef.current || !hasDataRef.current) {
        setContent()
        return
      }

      // No timetable available — show content
      if (!timetableRef.current?.classes) {
        setContent()
        return
      }

      const nowStr = deviceTime

      // The timetable is fetched daily. If the data we have was fetched on a
      // previous day (e.g. offline cache from yesterday), it is not valid for
      // today — never use it to blank the screen.
      const fetchedAtDate = fetchedAtRef.current ? new Date(fetchedAtRef.current) : null
      if (fetchedAtDate && !isSameLocalDay(fetchedAtDate, t)) {
        setContent()
        return
      }

      const segments = buildDaySegments(timetableRef.current.classes)

      // Items exist but none carry usable times — show content, never blank.
      if (segments === null) {
        setContent()
        return
      }

      // Weekend or holiday (no items) — stable standby, blank immediately.
      if (segments.length === 0) {
        pendingSince = 0
        setBlack('after_school')
        return
      }

      const active = findActiveSegment(segments, nowStr)
      const isInClass = active?.kind === 'in_class'
      const shouldShowContent = active ? segmentKindIsContent(active.kind) : false

      if (shouldShowContent) {
        setContent()
        return
      }

      const reason = isInClass ? 'in_class' : 'after_school'

      // Debounce entering black. A transient blip (data refresh, boundary jitter)
      // observed for less than BLACK_CONFIRM_MS must never blank+stick the screen:
      // once black with no animation the compositor throttles the timer, so a bad
      // transition is almost impossible to recover from. Content shows meanwhile.
      if (!pendingSince) {
        pendingSince = Date.now()
        logScreenState('black pending…', reason)
        return
      }
      if (Date.now() - pendingSince < BLACK_CONFIRM_MS) {
        return
      }
      pendingSince = 0
      setBlack(reason)
    }

    evaluate()
    // Two staggered timers: if the compositor throttles the fast one (static black
    // screen gets deprioritized), the slow one still re-evaluates and recovers.
    const fastTimer = setInterval(evaluate, 1000)
    const slowTimer = setInterval(evaluate, 7000)
    const onVisible = () => {
      pendingSince = 0
      evaluate()
    }
    window.addEventListener('focus', onVisible)
    window.addEventListener('visibilitychange', onVisible)

    return () => {
      clearInterval(fastTimer)
      clearInterval(slowTimer)
      window.removeEventListener('focus', onVisible)
      window.removeEventListener('visibilitychange', onVisible)
    }
  }, [isOverlayFeatureEnabled])

  return {
    showOverlay: !isLocalMode && isOverlayFeatureEnabled ? showOverlay : false,
    overlayReason: isLocalMode ? null : overlayReason,
    scheduleDay,
  }
}
