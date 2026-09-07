import { useEffect, useRef, useState, useMemo } from 'react'
import { getPageTitle } from './board/boardData'
import AccentRail from './board/components/AccentRail'
import EmptyPage from './board/components/EmptyPage'
import ErrorBoundary from './board/components/ErrorBoundary'
import EventsPage from './board/components/EventsPage'
import SubstitutionsPage from './board/components/SubstitutionsPage'
import TimetablePage from './board/components/TimetablePage'
import TopBar from './board/components/TopBar'
import AlertBannerView from './board/components/remote/AlertBannerView'
import BrowserView from './board/components/remote/BrowserView'
import ScreenCastView from './board/components/remote/ScreenCastView'
import SlideshowView from './board/components/remote/SlideshowView'
import AdminRemote from './board/admin/AdminRemote'
import { useBoardClock } from './board/hooks/useBoardClock'
import { useBoardData } from './board/hooks/useBoardData'
import { usePageRotation } from './board/hooks/usePageRotation'
import { useRemoteControl } from './board/hooks/useRemoteControl'
import { useScreenState } from './board/hooks/useScreenState'
import { isLocalMode } from './board/localMode'
import { logBorder, logScreenState, logScreenChange } from './board/logger'

export default function App() {
  const [route, setRoute] = useState(() =>
    typeof window !== 'undefined' ? window.location.pathname + window.location.hash : '',
  )

  useEffect(() => {
    const handleNav = () => setRoute(window.location.pathname + window.location.hash)
    window.addEventListener('popstate', handleNav)
    window.addEventListener('hashchange', handleNav)
    return () => {
      window.removeEventListener('popstate', handleNav)
      window.removeEventListener('hashchange', handleNav)
    }
  }, [])

  const { remoteState, castStream } = useRemoteControl()
  const { loading, hasBoardData, pages, periods, timetable, timetableRows } = useBoardData()
  const { showOverlay, overlayReason } = useScreenState(timetable, loading, hasBoardData)

  const frozenClass = remoteState?.frozenClass
  const displayPages = useMemo(() => {
    if (frozenClass && timetableRows?.length) {
      const match = timetableRows.filter(
        (r) =>
          r.name?.toLowerCase() === frozenClass?.toLowerCase() ||
          r.id?.toLowerCase() === frozenClass?.toLowerCase(),
      )
      if (match.length > 0) {
        return [{ id: `frozen-${frozenClass}`, type: 'timetable', rows: match, isFrozen: true }]
      }
    }
    return pages
  }, [frozenClass, timetableRows, pages])

  const effectiveShowOverlay = frozenClass ? false : showOverlay
  const { activePage, progress, pageIndex, pageCount } = usePageRotation(displayPages, effectiveShowOverlay)
  const { clockLabel, dateParts } = useBoardClock()
  const rawPageTitle = getPageTitle(activePage)
  const pageTitle = activePage?.isFrozen ? `Denní Rozvrh — ${frozenClass}` : rawPageTitle
  const activePageKey = activePage?.id ?? 'empty'
  const prevOverlayRef = useRef(effectiveShowOverlay)
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
    if (prevOverlayRef.current !== effectiveShowOverlay) {
      prevOverlayRef.current = effectiveShowOverlay
      if (effectiveShowOverlay) {
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
  }, [effectiveShowOverlay])

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

  const isAdmin = route.startsWith('/admin') || route.includes('#admin')

  useEffect(() => {
    if (isAdmin) {
      document.body.classList.add('admin-mode')
      document.body.style.cursor = 'auto'
      document.documentElement.style.cursor = 'auto'
    } else {
      document.body.classList.remove('admin-mode')
      document.body.style.cursor = ''
      document.documentElement.style.cursor = ''
    }
  }, [isAdmin])

  // If navigating to /admin or #admin, show Admin Remote Control panel
  if (isAdmin) {
    return (
      <ErrorBoundary>
        <div className="admin-scope" style={{ width: '100%', height: '100%', overflowY: 'auto', background: '#F8FAFC' }}>
          <AdminRemote />
        </div>
      </ErrorBoundary>
    )
  }

  // TV Hardware / Software Standby (pitch-black screen)
  if (!remoteState?.tvPower) {
    return (
      <div
        style={{
          width: '100vw',
          height: '100vh',
          background: '#000000',
          cursor: 'none',
        }}
        aria-hidden="true"
      />
    )
  }

  // High Priority Emergency Alert Broadcast
  if (remoteState?.mode === 'alert') {
    return (
      <div className="edupage-shell">
        <AlertBannerView message={remoteState.alertMessage} level={remoteState.alertLevel} />
      </div>
    )
  }

  // Photo Slideshow Mode
  if (remoteState?.mode === 'slideshow') {
    return (
      <div className="edupage-shell">
        <SlideshowView
          images={remoteState.images}
          intervalMs={remoteState.slideIntervalMs}
          transition={remoteState.slideTransition}
          fit={remoteState.slideFit}
          zoom={remoteState.slideZoom}
          showCaptions={remoteState.showCaptions}
        />
      </div>
    )
  }

  // Remote Web Browser / Stream Mode
  if (remoteState?.mode === 'browser') {
    return (
      <div className="edupage-shell">
        <BrowserView url={remoteState.browserUrl} />
      </div>
    )
  }

  // Wireless Screen Share / WebRTC Cast Mode
  if (remoteState?.mode === 'cast') {
    return (
      <div className="edupage-shell">
        <ScreenCastView stream={castStream} />
      </div>
    )
  }

  // Normal School Kiosk Mode (Timetable, Substitutions, Events)
  return (
    <div className="edupage-shell">
      <div className={`board-overlay${effectiveShowOverlay ? '' : ' hidden'}`}>
        {effectiveShowOverlay && overlayReason === 'in_class' && (
          <>
            <div className="board-ascii-indicator top-right" aria-label="System active">
              [ <span className="board-ascii-blink">*</span> ]
            </div>
            <div style={{ textAlign: 'center' }}>
              <div className="board-overlay-indicator" style={{ margin: '0 auto 1.4rem' }} />
              <div style={{ fontSize: 'clamp(1.5rem, 2.2vw, 2.4rem)', letterSpacing: '0.04em', fontWeight: 900, color: '#FFFFFF' }}>
                Výuka probíhá
              </div>
              <div style={{ fontSize: 'clamp(1rem, 1.3vw, 1.45rem)', marginTop: '0.5rem', color: 'rgba(255, 255, 255, 0.72)' }}>
                Obrazovka se aktivuje o přestávce
              </div>
              <div
                style={{
                  fontSize: 'clamp(2.6rem, 4vw, 4.8rem)',
                  fontWeight: 900,
                  marginTop: '1.5rem',
                  color: '#FFFFFF',
                  letterSpacing: '0.02em',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {clockLabel}
              </div>
            </div>
          </>
        )}
      </div>

      {!effectiveShowOverlay && (
        <>
          <TopBar pageTitle={pageTitle} clockLabel={clockLabel} dateParts={dateParts} isLocalMode={isLocalMode} />
          <AccentRail progress={progress} />

          <main className="edupage-content">
            <ErrorBoundary>
              <div
                key={activePageKey}
                className="edupage-page-view"
              >
                {loading && !hasBoardData ? (
                  <EmptyPage title="Načítám Rozvrh" copy="Připravuji data ze systému EduPage..." />
                ) : !hasBoardData ? (
                  <EmptyPage
                    title="Rozvrh Není Dostupný"
                    copy="Nepodařilo se načíst data ze systému EduPage."
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
            </ErrorBoundary>
          </main>
        </>
      )}
    </div>
  )
}
