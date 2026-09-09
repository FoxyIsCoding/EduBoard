import { startTransition, useEffect, useMemo, useRef, useState } from 'react'
import { logBorder, logDataRefresh, logScreenState, logError, logWarn } from '../logger'
import {
  fetchBoardPayload,
  getPeriods,
  collectTimetableRows,
  collectEvents,
  collectSubstitutions,
  buildPages,
} from '../boardData'
import { REFRESH_SECONDS } from '../constants'
import { useSettings } from '../settings'

const OFFLINE_CACHE_KEY = 'eduboard_payload_cache'
const OFFLINE_CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000
const OFFLINE_CACHE_WRITE_INTERVAL_MS = 2 * 60 * 60 * 1000

function loadOfflineCache() {
  try {
    const raw = window.localStorage.getItem(OFFLINE_CACHE_KEY)
    if (!raw) return { payload: null, cachedAt: null, stale: false }
    const entry = JSON.parse(raw)
    if (!entry?.payload || !entry?.savedAt) return { payload: null, cachedAt: null, stale: false }
    const ageMs = Date.now() - Number(entry.savedAt)
    if (Number.isNaN(ageMs) || ageMs < 0) return { payload: null, cachedAt: null, stale: false }
    if (ageMs > OFFLINE_CACHE_MAX_AGE_MS) {
      logWarn('🗄 offline cache too old, ignoring', `${Math.round(ageMs / 3600000)}h old`)
      window.localStorage.removeItem(OFFLINE_CACHE_KEY)
      return { payload: null, cachedAt: null, stale: false }
    }
    return { payload: entry.payload, cachedAt: Number(entry.savedAt), stale: true }
  } catch {
    return { payload: null, cachedAt: null, stale: false }
  }
}

function saveOfflineCache(payload, lastSavedAt = 0) {
  const now = Date.now()
  if (now - lastSavedAt < OFFLINE_CACHE_WRITE_INTERVAL_MS) return false
  try {
    window.localStorage.setItem(
      OFFLINE_CACHE_KEY,
      JSON.stringify({ payload, savedAt: now }),
    )
    return true
  } catch {
    logError('🗄 could not write offline cache', '')
    return false
  }
}

export function useBoardData() {
  const settings = useSettings()
  const refreshSeconds = Math.max(30, Math.min(600, Number(settings.refreshSeconds) || REFRESH_SECONDS))
  const cached = useRef(null)
  if (cached.current === null) {
    cached.current = loadOfflineCache()
  }
  const [payload, setPayload] = useState(() => cached.current.payload)
  const [loading, setLoading] = useState(() => !cached.current.payload)
  const [stale, setStale] = useState(() => cached.current.stale)
  const [fetchedAt, setFetchedAt] = useState(() => cached.current.cachedAt ?? null)
  const lastSavedAtRef = useRef(cached.current.cachedAt ?? 0)
  const inFlightRef = useRef(false)
  const hasPayloadRef = useRef(Boolean(cached.current.payload))
  const refreshCountRef = useRef(0)
  const prevTimetableRef = useRef(null)
  const didInitialLoadRef = useRef(false)

  logBorder('📦 useBoardData MOUNTED', 'big')
  logDataRefresh('INIT', JSON.stringify({ refreshInterval: `${refreshSeconds}s`, timestamp: new Date().toISOString() }))
  if (cached.current.payload) {
    logDataRefresh('🗄 offline cache loaded', JSON.stringify({ classes: cached.current.payload.timetable?.classes?.length ?? 0 }))
  }

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
          setStale(false)
          setFetchedAt(Date.now())
          hasPayloadRef.current = true
          if (saveOfflineCache(next, lastSavedAtRef.current)) {
            lastSavedAtRef.current = Date.now()
          }
        }
      } catch (loadError) {
        logError(`❌ loadBoard error (${label})`, loadError.message)
        console.error(loadError)
        if (hasPayloadRef.current && !cancelled) {
          setStale(true)
          logWarn('🗄 offline mode — serving cached/stale data', '')
        }
      } finally {
        inFlightRef.current = false
        if (!cancelled) setLoading(false)
      }
    }

    if (!didInitialLoadRef.current) {
      didInitialLoadRef.current = true
      loadBoard(false)
    }

    logDataRefresh(`⏱ refresh timer set for every ${refreshSeconds}s`, '')
    const refreshTimer = window.setInterval(() => {
      loadBoard(true)
    }, refreshSeconds * 1000)

    return () => {
      cancelled = true
      window.clearInterval(refreshTimer)
      logDataRefresh('⏹ CLEANUP (unmount)', '')
    }
  }, [refreshSeconds])

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
    stale,
    fetchedAt,
    hasBoardData: Boolean(payload?.lookup && payload?.timetable),
    pages,
    periods,
    timetable: payload?.timetable,
    timetableRows,
    events,
    substitutions,
  }
}
