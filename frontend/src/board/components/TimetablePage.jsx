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
    <div
      className="edupage-grid"
      style={{
        gridTemplateColumns: `minmax(120px, 9.5vw) repeat(${periods.length}, minmax(0, 1fr))`,
        gridTemplateRows: `minmax(65px, 8vh) repeat(${CLASSES_PER_PAGE}, minmax(clamp(65px, 10.5vh, 180px), 1fr))`,
      }}
    >
      {/* Top-left Corner Header */}
      <div
        className="edupage-card"
        style={{
          display: 'grid',
          placeItems: 'center',
          background: 'var(--kiosk-header-bg)',
        }}
      >
        <span
          style={{
            color: 'var(--kiosk-text-primary)',
            fontWeight: 900,
            fontSize: 'clamp(0.95rem, 1.2vw, 1.35rem)',
            letterSpacing: '0.08em',
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
            className={`edupage-card ${isActive ? 'is-active-period-header' : ''}`}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0.25rem 0.2rem',
              background: isActive ? undefined : 'var(--kiosk-header-bg)',
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
                  fontSize: 'clamp(1.5rem, 2.1vw, 2.4rem)',
                  lineHeight: 1,
                  fontWeight: 900,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {period.short}
              </span>
              {isActive && (
                <span
                  className="edupage-badge badge-active"
                  style={{ fontSize: '0.62rem', padding: '0.08rem 0.35rem' }}
                >
                  Probíhá
                </span>
              )}
            </div>

            <div
              style={{
                marginTop: '0.15rem',
                textAlign: 'center',
                color: isActive ? 'rgba(255, 255, 255, 0.9)' : 'var(--kiosk-text-secondary)',
                fontSize: 'clamp(0.7rem, 0.82vw, 0.96rem)',
                fontWeight: 700,
                lineHeight: 1.15,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              <span>{period.start}</span>
              <span style={{ marginInline: '0.15rem', opacity: 0.6 }}>–</span>
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
              className="edupage-card"
              style={{
                display: 'grid',
                placeItems: 'center',
                background: row ? 'var(--kiosk-card-bg)' : 'var(--kiosk-card-empty)',
                padding: '0.35rem',
              }}
            >
              <span
                style={{
                  fontSize: 'clamp(1.8rem, 2.5vw, 3.4rem)',
                  fontWeight: 900,
                  letterSpacing: '-0.02em',
                  color: row ? 'var(--kiosk-text-primary)' : 'var(--kiosk-text-muted)',
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
                  style={{
                    gridColumn: span > 1 ? `span ${span}` : undefined,
                    minWidth: 0,
                    height: '100%',
                  }}
                >
                  <LessonCard cell={cell} isActive={isActiveCol} />
                </div>
              )
            })}
          </Fragment>
        )
      })}
    </div>
  )
}
