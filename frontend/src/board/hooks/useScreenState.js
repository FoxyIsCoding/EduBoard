import { useEffect, useRef, useState } from 'react'

function shiftMinutes(timeStr, deltaMinutes) {
  const [h, m] = (timeStr || '00:00').split(':').map(Number)
  const total = h * 60 + m + deltaMinutes
  if (total <= 0) return '00:00'
  if (total >= 1440) return '23:59'
  const newH = Math.floor(total / 60)
  const newM = total % 60
  return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`
}

export function useScreenState(timetable, loading, hasBoardData) {
  const [showOverlay, setShowOverlay] = useState(false)
  const [overlayReason, setOverlayReason] = useState('in_class')
  const showOverlayRef = useRef(false)
  const timetableRef = useRef(timetable)
  const loadingRef = useRef(loading)
  const hasDataRef = useRef(hasBoardData)

  const isOverlayFeatureEnabled = import.meta.env.VITE_ENABLE_BREAK_ONLY_OVERLAY === 'true'

  useEffect(() => {
    timetableRef.current = timetable
    loadingRef.current = loading
    hasDataRef.current = hasBoardData
  }, [timetable, loading, hasBoardData])

  useEffect(() => {
    if (!isOverlayFeatureEnabled) {
      return undefined
    }

    const timer = setInterval(() => {
      const t = new Date()
      const deviceTime = `${t.getHours().toString().padStart(2, '0')}:${t.getMinutes().toString().padStart(2, '0')}`

      // No data loaded yet or still loading — show content
      if (loadingRef.current || !hasDataRef.current) {
        if (showOverlayRef.current) {
          showOverlayRef.current = false
          setShowOverlay(false)
        }
        return
      }

      // No timetable available — show content
      if (!timetableRef.current?.classes) {
        if (showOverlayRef.current) {
          showOverlayRef.current = false
          setShowOverlay(false)
        }
        return
      }

      const nowStr = deviceTime
      const allItems = timetableRef.current.classes.flatMap((cls) => cls.ttitems ?? [])

      // Weekend or holiday (no items) — show standby overlay (pure black)
      if (allItems.length === 0) {
        if (!showOverlayRef.current) {
          showOverlayRef.current = true
          setOverlayReason('after_school')
          setShowOverlay(true)
        }
        return
      }

      const isInClass = allItems.some(
        (item) => item.starttime <= nowStr && nowStr < item.endtime,
      )
      const startTimes = allItems.map((i) => i.starttime).filter(Boolean)
      const endTimes = allItems.map((i) => i.endtime).filter(Boolean)

      if (startTimes.length === 0 || endTimes.length === 0) {
        if (showOverlayRef.current) {
          showOverlayRef.current = false
          setShowOverlay(false)
        }
        return
      }

      const schoolStart = startTimes.reduce((a, b) => (a < b ? a : b))
      const schoolEnd = endTimes.reduce((a, b) => (a > b ? a : b))
      const morningStart = shiftMinutes(schoolStart, -45)

      const isSchoolTime = nowStr >= schoolStart && nowStr < schoolEnd
      const isMorning = nowStr >= morningStart && nowStr < schoolStart
      const isBreak = isSchoolTime && !isInClass

      // Content displays only during morning arrival (45m before first period) and class breaks
      const shouldShowContent = isMorning || isBreak
      const next = !shouldShowContent

      if (next) {
        setOverlayReason(isInClass ? 'in_class' : 'after_school')
      }

      if (next !== showOverlayRef.current) {
        showOverlayRef.current = next
        setShowOverlay(next)
      }
    }, 1000)

    return () => {
      clearInterval(timer)
    }
  }, [isOverlayFeatureEnabled])

  return {
    showOverlay: isOverlayFeatureEnabled ? showOverlay : false,
    overlayReason,
  }
}
