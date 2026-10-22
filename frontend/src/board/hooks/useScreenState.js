import { useEffect, useRef, useState } from 'react'
import { isLocalMode } from '../localMode'
import { getNow } from '../timeSync'
import { getSettings } from '../settings'
import { logScreenState, logScheduleDay } from '../logger'
import { buildDaySegments, findActiveSegment, segmentKindIsContent, formatScheduleLine } from '../schedule'

// Screen on/off is driven entirely by the hardcoded bell schedule in
// schedule.js (breaks = ON, lessons/outside = black). The live timetable is no
// longer consulted, so the on/off timing is stable even when EduPage data is
// stale or unavailable. The clock is corrected against the server via timeSync
// (`getNow`), so the schedule stays in sync automatically.
export function useScreenState() {
  const [showOverlay, setShowOverlay] = useState(false)
  const [overlayReason, setOverlayReason] = useState('after_school')
  const showOverlayRef = useRef(false)
  const overlayReasonRef = useRef('after_school')
  const scheduleKeyRef = useRef('')

  // In local mode, the display turning-off schedule is completely disabled
  const isOverlayFeatureEnabled = !isLocalMode && import.meta.env.VITE_ENABLE_BREAK_ONLY_OVERLAY === 'true'

  // Human-checkable digest of the day's on/off schedule (segments). Hardcoded,
  // so it depends only on the current weekday.
  const t = getNow()
  const dayKey = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`
  const segments = buildDaySegments(t)
  const scheduleDay = { dayKey, valid: true, segments }

  // Log the digest whenever the day (or its schedule) changes so the school can
  // verify the break times the board actually uses.
  useEffect(() => {
    const key = `${dayKey}|${segments.map((s) => `${s.start}-${s.end}:${s.kind}`).join(',')}`
    if (key === scheduleKeyRef.current) return
    scheduleKeyRef.current = key
    const dateLabel = getNow().toLocaleDateString('cs-CZ', { weekday: 'short', day: '2-digit', month: '2-digit' })
    logScheduleDay(formatScheduleLine(segments, dateLabel), '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dayKey])

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
      const now = getNow()
      const deviceTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`

      // Experiment: never allow the overlay — always show content
      if (getSettings().forceContentOnly) {
        setContent()
        return
      }

      const segs = buildDaySegments(now)
      const active = findActiveSegment(segs, deviceTime)
      const shouldShowContent = active ? segmentKindIsContent(active.kind) : false

      if (shouldShowContent) {
        setContent()
        return
      }

      const reason = active?.kind === 'in_class' ? 'in_class' : 'after_school'

      // Debounce entering black. A transient blip (clock jitter, boundary
      // rounding) observed for less than BLACK_CONFIRM_MS must never blank+stick
      // the screen: once black with no animation the compositor throttles the
      // timer, so a bad transition is almost impossible to recover from.
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