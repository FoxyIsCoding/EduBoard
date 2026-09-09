import { useEffect, useRef, useState } from 'react'
import { logPageRotation, logBorder } from '../logger'
import { DEBUG_HOLD_SECONDS, ROTATE_SECONDS } from '../constants'
import { useSettings } from '../settings'

export function usePageRotation(pages, paused = false) {
  const settings = useSettings()
  const rotateSeconds = Math.max(3, Math.min(300, Number(settings.rotationSeconds) || ROTATE_SECONDS))
  const [pageIndex, setPageIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  const manualPageUntilRef = useRef(0)
  const cycleStartedAtRef = useRef(Date.now())
  const pageCount = pages.length
  const safePageIndex = pageCount > 0 ? Math.min(pageIndex, pageCount - 1) : 0
  const activePage = pages[safePageIndex] ?? pages[0]
  const prevPausedRef = useRef(paused)
  const pausedRef = useRef(paused)
  const pageCountRef = useRef(pageCount)
  const pageIndexRef = useRef(safePageIndex)

  useEffect(() => {
    pausedRef.current = paused
    pageCountRef.current = pageCount
    pageIndexRef.current = safePageIndex
  }, [paused, pageCount, safePageIndex])

  // Log mount
  useEffect(() => {
    logPageRotation('MOUNTED', JSON.stringify({ pageCount, rotateSeconds, initialPaused: paused }))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Log pause/resume transitions
  useEffect(() => {
    if (prevPausedRef.current !== paused) {
      prevPausedRef.current = paused
      if (paused) {
        logBorder(
          `⏸️⏸️⏸️ PAGE ROTATION PAUSED (overlay active) — ${pageCount} pages, current #${safePageIndex + 1}`,
          'warning',
        )
      } else {
        logBorder(
          `▶️▶️▶️ PAGE ROTATION RESUMED (overlay hidden) — ${pageCount} pages, resumed #${safePageIndex + 1}`,
          'success',
        )
      }
    }
  }, [paused, pageCount, safePageIndex])

  useEffect(() => {
    cycleStartedAtRef.current = Date.now()
    logPageRotation(`📄 showing page #${safePageIndex + 1}/${pageCount}`, `type=${activePage?.type} id=${activePage?.id}`)
  }, [safePageIndex, pageCount, activePage?.id, activePage?.type])

  const hasMultiplePages = pageCount > 1

  useEffect(() => {
    if (!hasMultiplePages) {
      logPageRotation('⏸ only 1 page — rotation disabled', '')
      return undefined
    }

    cycleStartedAtRef.current = Date.now()

    const timer = window.setInterval(() => {
      if (pausedRef.current || pageCountRef.current <= 1) {
        cycleStartedAtRef.current = Date.now()
        setProgress(0)
        return
      }

      if (Date.now() < manualPageUntilRef.current) {
        cycleStartedAtRef.current = Date.now()
        setProgress(0)
        return
      }

      const elapsed = Date.now() - cycleStartedAtRef.current
      const durationMs = rotateSeconds * 1000
      const nextProgress = Math.min(100, (elapsed / durationMs) * 100)

      if (nextProgress >= 100) {
        cycleStartedAtRef.current = Date.now()
        setProgress(0)
        setPageIndex((prev) => {
          const count = pageCountRef.current
          return count > 0 ? (prev + 1) % count : 0
        })
        return
      }

      setProgress(nextProgress)
    }, 250)

    return () => {
      window.clearInterval(timer)
      logPageRotation('⏱ rotation interval CLEARED', '')
    }
  }, [hasMultiplePages, rotateSeconds])

  useEffect(() => {
    const globalScope = typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : this)
    if (!globalScope) return

    globalScope.__boardDebug = {
      pageCount,
      getPageIndex: () => pageIndexRef.current,
      setPageIndex: (nextIndex) => {
        const safeIndex = Math.max(0, Math.min(pageCount - 1, Number(nextIndex) || 0))
        logPageRotation(`🔄 MANUAL page set to #${safeIndex + 1}`, `from #${pageIndexRef.current + 1}`)
        manualPageUntilRef.current = Date.now() + DEBUG_HOLD_SECONDS * 1000
        cycleStartedAtRef.current = Date.now()
        setProgress(0)
        setPageIndex(safeIndex)
      },
      holdRotation: (seconds = DEBUG_HOLD_SECONDS) => {
        const s = Math.max(1, Number(seconds) || DEBUG_HOLD_SECONDS)
        logPageRotation(`⏸ MANUAL hold for ${s}s`, '')
        manualPageUntilRef.current = Date.now() + s * 1000
        cycleStartedAtRef.current = Date.now()
        setProgress(0)
      },
      pages: pages.map((page) => ({ id: page.id, type: page.type })),
    }

    return () => {
      try {
        delete globalScope.__boardDebug
      } catch {
        globalScope.__boardDebug = undefined
      }
    }
  }, [pageCount, pages])

  return {
    activePage,
    pageCount,
    pageIndex: safePageIndex,
    progress: pageCount <= 1 ? 100 : progress,
  }
}
