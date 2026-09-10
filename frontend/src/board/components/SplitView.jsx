import { useMemo } from 'react'
import TopBar from './TopBar'
import AccentRail from './AccentRail'
import TimetablePage from './TimetablePage'
import EventsPage from './EventsPage'
import SubstitutionsPage from './SubstitutionsPage'
import { buildPages } from '../boardData'
import { usePageRotation } from '../hooks/usePageRotation'

const CONTENT_LABELS = {
  timetable: 'Rozvrh',
  events: 'Události',
  substitutions: 'Suplování',
}

function Pane({ label, children }) {
  return (
    <section
      style={{
        flex: 1,
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.4rem',
      }}
    >
      <div
        style={{
          fontSize: 'clamp(0.85rem, 1.1vw, 1.3rem)',
          fontWeight: 900,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: 'var(--kiosk-brand-blue)',
        }}
      >
        {label}
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>{children}</div>
    </section>
  )
}

export default function SplitView({
  rows,
  periods,
  events,
  substitutions,
  splitLeft = 'timetable',
  splitRight = 'events',
  clockLabel,
  dateParts,
  isLocalMode,
  isOffline,
}) {
  const timetablePages = useMemo(
    () =>
      buildPages(rows, [], []).filter((page) => page.type === 'timetable'),
    [rows]
  )

  const { activePage, progress } = usePageRotation(timetablePages, false)

  const renderPane = (kind) => {
    if (kind === 'events') return <EventsPage events={events} />
    if (kind === 'substitutions')
      return <SubstitutionsPage substitutions={substitutions} />
    return <TimetablePage rows={activePage?.rows ?? []} periods={periods} />
  }

  const pageTitle =
    CONTENT_LABELS[splitLeft] + ' + ' + CONTENT_LABELS[splitRight]

  return (
    <>
      <TopBar
        pageTitle={pageTitle}
        clockLabel={clockLabel}
        dateParts={dateParts}
        isLocalMode={isLocalMode}
        isOffline={isOffline}
      />
      {splitLeft === 'timetable' && <AccentRail progress={progress} />}
      <main
        className="edupage-content"
        style={{ display: 'flex', gap: '1.25rem', padding: '1rem 1.25rem' }}
      >
        <Pane label={CONTENT_LABELS[splitLeft]}>{renderPane(splitLeft)}</Pane>
        <Pane label={CONTENT_LABELS[splitRight]}>
          {renderPane(splitRight)}
        </Pane>
      </main>
    </>
  )
}