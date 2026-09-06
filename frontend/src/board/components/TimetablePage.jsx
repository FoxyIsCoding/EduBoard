import { Fragment } from 'react'
import { CLASSES_PER_PAGE } from '../constants'
import LessonCard from './LessonCard'

function timeToMinutes(time) {
  if (!time) return 0
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

function getActivePeriodIndex(periods) {
  const now = new Date()
  const minutes = now.getHours() * 60 + now.getMinutes()
  for (let i = 0; i < periods.length; i++) {
    const start = timeToMinutes(periods[i].start)
    const end = timeToMinutes(periods[i].end)
    if (minutes >= start && minutes < end) return i
  }
  return -1
}

export default function TimetablePage({ rows, periods }) {
  const activePeriod = getActivePeriodIndex(periods)
  const paddedRows = [...rows]

  while (paddedRows.length < CLASSES_PER_PAGE) paddedRows.push(null)

  return (
    <section
      style={{
        width: '100%',
        height: '100%',
        display: 'grid',
        gridTemplateColumns: `minmax(140px, 11.5vw) repeat(${periods.length}, minmax(0, 1fr))`,
        gridTemplateRows: `minmax(85px, 9.5vh) repeat(${CLASSES_PER_PAGE}, minmax(clamp(70px, 11vh, 180px), 1fr))`,
        gap: '0.45rem',
      }}
    >
      {/* Top-left Corner Header */}
      <div
        className="edusign-card"
        style={{
          display: 'grid',
          placeItems: 'center',
          background: 'var(--board-surface-highlight)',
        }}
      >
        <span
          style={{
            color: 'var(--board-text-secondary)',
            fontWeight: 800,
            fontSize: 'clamp(0.8rem, 1vw, 1.1rem)',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}
        >
          Třída
        </span>
      </div>

      {/* Period Headers */}
      {periods.map((period, pIdx) => {
        const isActive = pIdx === activePeriod
        return (
          <div
            key={period.period}
            className={`edusign-card ${isActive ? 'active-period' : ''}`}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0.35rem 0.2rem',
              background: isActive
                ? 'var(--board-surface-highlight)'
                : 'var(--board-surface-card)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              <span
                style={{
                  fontSize: 'clamp(1.7rem, 2.1vw, 2.4rem)',
                  lineHeight: 1,
                  fontWeight: 900,
                  color: isActive ? 'var(--board-accent-primary)' : 'var(--board-text-primary)',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {period.short}
              </span>
              {isActive && (
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: 'var(--board-accent-primary)',
                    boxShadow: '0 0 8px var(--board-accent-primary)',
                    animation: 'ascii-blink 1.5s infinite',
                  }}
                  title="Probíhající hodina"
                />
              )}
            </div>

            <div
              style={{
                marginTop: '0.2rem',
                textAlign: 'center',
                color: 'var(--board-text-secondary)',
                fontSize: 'clamp(0.72rem, 0.84vw, 0.96rem)',
                fontWeight: 600,
                lineHeight: 1.15,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              <span>{period.start}</span>
              <span style={{ marginInline: '0.2rem', opacity: 0.5 }}>–</span>
              <span>{period.end}</span>
            </div>
          </div>
        )
      })}

      {/* Class Rows */}
      {paddedRows.map((row, rowIndex) => {
        const rowCells = periods.map((period, periodIndex) => {
          const cell = row?.cells?.[String(period.period)] ?? null
          return { cell, period, periodIndex, consumed: false }
        })

        for (let i = 0; i < rowCells.length; i++) {
          const span = rowCells[i].cell?.span ?? 0
          if (span > 1) {
            for (let j = 1; j < span && i + j < rowCells.length; j++) {
              rowCells[i + j].consumed = true
            }
          }
        }

        return (
          <Fragment key={row?.id ?? `empty-row-${rowIndex}`}>
            {/* Class Label Column */}
            <div
              className="edusign-card"
              style={{
                display: 'grid',
                placeItems: 'center',
                background: row
                  ? 'var(--board-surface-highlight)'
                  : 'rgba(255, 255, 255, 0.02)',
                padding: '0.5rem',
              }}
            >
              <span
                style={{
                  fontSize: 'clamp(1.8rem, 2.4vw, 3.4rem)',
                  fontWeight: 900,
                  letterSpacing: '-0.02em',
                  color: row ? 'var(--board-text-primary)' : 'var(--board-text-muted)',
                  textAlign: 'center',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {row?.name ?? '—'}
              </span>
            </div>

            {/* Lesson Grid Cells */}
            {rowCells.map(({ cell, periodIndex, consumed }) => {
              if (consumed) return null
              const span = cell?.span ?? 1
              const isActiveCol = periodIndex === activePeriod
              return (
                <div
                  key={`${row?.id ?? `empty-${rowIndex}`}-${periodIndex}`}
                  className={isActiveCol && cell && cell.layout !== 'blank' ? 'active-period' : ''}
                  style={{
                    gridColumn: span > 1 ? `span ${span}` : undefined,
                    minWidth: 0,
                    height: '100%',
                    borderRadius: 'var(--board-radius-medium)',
                    overflow: 'hidden',
                  }}
                >
                  <LessonCard cell={cell} />
                </div>
              )
            })}
          </Fragment>
        )
      })}
    </section>
  )
}
