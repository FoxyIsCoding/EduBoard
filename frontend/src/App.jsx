import { useEffect, useRef } from 'react'
import { getPageTitle } from './board/boardData'
import AccentRail from './board/components/AccentRail'
import EmptyPage from './board/components/EmptyPage'
import ErrorBoundary from './board/components/ErrorBoundary'
import EventsPage from './board/components/EventsPage'
import SubstitutionsPage from './board/components/SubstitutionsPage'
import TimetablePage from './board/components/TimetablePage'
import TopBar from './board/components/TopBar'
import { useBoardClock } from './board/hooks/useBoardClock'
import { useBoardData } from './board/hooks/useBoardData'
import { usePageRotation } from './board/hooks/usePageRotation'
import { useScreenState } from './board/hooks/useScreenState'
import { isLocalMode } from './board/localMode'
import { logBorder, logScreenState, logScreenChange } from './board/logger'

export default function App() {
  const { loading, hasBoardData, pages, periods, timetable } = useBoardData()
  const { showOverlay, overlayReason } = useScreenState(timetable, loading, hasBoardData)
  const { activePage, progress, pageIndex, pageCount } = usePageRotation(pages, showOverlay)
  const { clockLabel, dateParts } = useBoardClock()
  const pageTitle = getPageTitle(activePage)
  const activePageKey = activePage?.id ?? 'empty'
  const prevOverlayRef = useRef(showOverlay)
  const isMountedRef = useRef(false)

  useEffect(() => {
    if (!isMountedRef.current) {
      isMountedRef.current = true
      logBorder('🚀 EduBoard APP MOUNTED', 'big')
      logScreenState('First render', JSON.stringify({
        loading,
        hasBoardData,
        pagesCount: pages.length,
        periodsCount: periods.length,
        hasTimetable: Boolean(timetable),
      }))
    }
  }, [loading, hasBoardData, pages.length, periods.length, timetable])

  useEffect(() => {
    if (prevOverlayRef.current !== showOverlay) {
      prevOverlayRef.current = showOverlay
      if (showOverlay) {
        logBorder(
          '🔲🔲🔲 App — overlay ON (pageRotation paused, content hidden)',
          'warning',
        )
      } else {
        logBorder(
          '🟢🟢🟢 App — overlay OFF (pageRotation resumed, content visible)',
          'success',
        )
      }
    }
  }, [showOverlay])

  useEffect(() => {
    logScreenChange(
      `📄 page changed to "${pageTitle}" (#${pageIndex + 1}/${pageCount})`,
      `key=${activePageKey} type=${activePage?.type}`,
    )
  }, [activePageKey, pageTitle, pageIndex, pageCount, activePage?.type])

  // 24/7 Digital Signage Longevity: Soft reload at 03:00 AM to purge browser memory on Raspberry Pi
  useEffect(() => {
    if (isLocalMode) return undefined
    const checkNightlyReload = () => {
      const now = new Date()
      if (now.getHours() === 3 && now.getMinutes() < 5) {
        window.location.reload()
      }
    }
    const timer = setInterval(checkNightlyReload, 60000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="kiosk-shell">
      <div className={`board-overlay${showOverlay ? '' : ' hidden'}`}>
        {showOverlay && overlayReason === 'in_class' && (
          <>
            <div className="board-ascii-indicator top-right" aria-label="System active">
              [ <span className="board-ascii-blink">*</span> ]
            </div>
            <div style={{ textAlign: 'center', color: 'rgba(255, 255, 255, 0.55)' }}>
              <div className="board-overlay-indicator" style={{ margin: '0 auto 1.4rem' }} />
              <div style={{ fontSize: 'clamp(1.4rem, 2vw, 2.2rem)', letterSpacing: '0.04em', fontWeight: 800, color: 'var(--kiosk-text-white)' }}>
                Výuka probíhá
              </div>
              <div style={{ fontSize: 'clamp(1rem, 1.3vw, 1.4rem)', marginTop: '0.5rem', color: 'var(--kiosk-text-secondary)' }}>
                Obrazovka se aktivuje o přestávce
              </div>
              <div
                style={{
                  fontSize: 'clamp(2.5rem, 3.8vw, 4.5rem)',
                  fontWeight: 900,
                  marginTop: '1.5rem',
                  color: 'var(--kiosk-cyan)',
                  letterSpacing: '0.02em',
                  fontVariantNumeric: 'tabular-nums',
                  textShadow: '0 0 24px var(--kiosk-cyan-glow)',
                }}
              >
                {clockLabel}
              </div>
            </div>
          </>
        )}
      </div>

      {!showOverlay && (
        <>
          <div className="kiosk-surface">
            <TopBar pageTitle={pageTitle} clockLabel={clockLabel} dateParts={dateParts} isLocalMode={isLocalMode} />
          </div>

          <AccentRail progress={progress} />

          <ErrorBoundary>
            <section
              className="kiosk-surface"
              style={{
                minHeight: 0,
                minWidth: 0,
                overflow: 'hidden',
                padding: 'var(--kiosk-gap)',
              }}
            >
              <div
                key={activePageKey}
                className="kiosk-page-view"
              >
                {loading && !hasBoardData ? (
                  <EmptyPage title="Načítám Přehled" copy="Připravuji rozvrh a školní akce." />
                ) : !hasBoardData ? (
                  <EmptyPage
                    title="Přehled Není Dostupný"
                    copy="Nepodařilo se načíst data pro obrazovku."
                  />
                ) : activePage?.type === 'timetable' ? (
                  <TimetablePage rows={activePage.rows ?? []} periods={periods} />
                ) : activePage?.type === 'events' ? (
                  <EventsPage events={activePage.events ?? []} />
                ) : activePage?.type === 'substitutions' ? (
                  <SubstitutionsPage substitutions={activePage.substitutions ?? []} />
                ) : (
                  <EmptyPage title="Bez Dat" copy="Pro tuto stránku není co zobrazit." />
                )}
              </div>
            </section>
          </ErrorBoundary>
        </>
      )}
    </div>
  )
}
