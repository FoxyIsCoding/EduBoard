import { startTransition, useEffect, useMemo, useRef, useState } from 'react'
import { logBorder, logDataRefresh, logScreenState, logError } from '../logger'
import {
  fetchBoardPayload,
  getPeriods,
  collectTimetableRows,
  collectEvents,
  collectSubstitutions,
  buildPages,
} from '../boardData'
import { REFRESH_SECONDS } from '../constants'

export function useBoardData() {
  const [payload, setPayload] = useState(null)
  const [loading, setLoading] = useState(true)
  const inFlightRef = useRef(false)
  const hasPayloadRef = useRef(false)
  const refreshCountRef = useRef(0)
  const prevTimetableRef = useRef(null)

  logBorder('📦 useBoardData MOUNTED', 'big')
  logDataRefresh('INIT', JSON.stringify({ refreshInterval: `${REFRESH_SECONDS}s`, timestamp: new Date().toISOString() }))

  useEffect(() => {
    hasPayloadRef.current = Boolean(payload)
    if (payload?.timetable) {
      const items = (payload.timetable.classes ?? []).flatMap(c => c.ttitems ?? [])
      const startTimes = items.map(i => i.starttime).filter(Boolean)
      const endTimes = items.map(i => i.endtime).filter(Boolean)
      const schoolStart = startTimes.length ? startTimes.reduce((a, b) => a < b ? a : b) : 'N/A'
      const schoolEnd = endTimes.length ? endTimes.reduce((a, b) => a > b ? a : b) : 'N/A'
      logDataRefresh('📋 payload updated', JSON.stringify({
        classes: payload.timetable.classes?.length ?? 0,
        items: items.length,
        schoolRange: `${schoolStart}–${schoolEnd}`,
        hasEvents: Boolean(payload.events),
        lookupKeys: Object.keys(payload.lookup ?? {}).length,
      }))
    }
  }, [payload])

  // Log timetable changes specifically (for overlay debug)
  useEffect(() => {
    const current = payload?.timetable
    if (current !== prevTimetableRef.current && current) {
      prevTimetableRef.current = current
      logScreenState('📋 timetable data updated (useScreenState will pick this up via ref)', '')
    }
  }, [payload?.timetable])

  useEffect(() => {
    let cancelled = false

    const loadBoard = async (isBackgroundRefresh = false) => {
      if (inFlightRef.current) {
        logDataRefresh('⏸ SKIP (already in flight)', '')
        return
      }
      inFlightRef.current = true
      refreshCountRef.current++

      if (!cancelled && !(hasPayloadRef.current || isBackgroundRefresh)) {
        setLoading(true)
      }

      const label = isBackgroundRefresh ? `background refresh #${refreshCountRef.current}` : `initial load`
      logBorder(`📦📦📦 FETCH BOARD DATA (${label}) [${new Date().toLocaleTimeString()}]`, 'info')

      try {
        const next = await fetchBoardPayload()

        if (!next.lookup || !next.timetable) {
          const errMsg = next.issues?.[0] ?? 'Nepodařilo se načíst rozvrh.'
          logError(`❌ fetch failed`, errMsg)
          throw new Error(errMsg)
        }

        if (!cancelled) {
          logDataRefresh(`✅ fetch success (${label})`, JSON.stringify({
            lookupKeys: Object.keys(next.lookup ?? {}).length,
            timetableClasses: next.timetable.classes?.length ?? 0,
            events: next.events ? 'yes' : 'no',
          }))
          startTransition(() => {
            setPayload(next)
          })
          hasPayloadRef.current = true
        }
      } catch (loadError) {
        logError(`❌ loadBoard error (${label})`, loadError.message)
        console.error(loadError)
      } finally {
        inFlightRef.current = false
        if (!cancelled) setLoading(false)
      }
    }

    loadBoard(false)

    logDataRefresh(`⏱ refresh timer set for every ${REFRESH_SECONDS}s`, '')
    const refreshTimer = window.setInterval(() => {
      loadBoard(true)
    }, REFRESH_SECONDS * 1000)

    return () => {
      cancelled = true
      window.clearInterval(refreshTimer)
      logDataRefresh('⏹ CLEANUP (unmount)', '')
    }
  }, [])

  const periods = useMemo(() => getPeriods(payload?.lookup), [payload?.lookup])

  const timetableRows = useMemo(
    () => collectTimetableRows(payload?.timetable, payload?.lookup, periods),
    [payload?.timetable, payload?.lookup, periods],
  )

  const events = useMemo(
    () => collectEvents(payload?.events, payload?.timetable, payload?.lookup),
    [payload?.events, payload?.timetable, payload?.lookup],
  )

  const substitutions = useMemo(
    () => collectSubstitutions(payload?.timetable, payload?.lookup),
    [payload?.timetable, payload?.lookup],
  )

  const pages = useMemo(
    () => buildPages(timetableRows, events, substitutions),
    [timetableRows, events, substitutions],
  )

  return {
    loading,
    hasBoardData: Boolean(payload?.lookup && payload?.timetable),
    pages,
    periods,
    timetable: payload?.timetable,
    timetableRows,
    events,
    substitutions,
  }
}
