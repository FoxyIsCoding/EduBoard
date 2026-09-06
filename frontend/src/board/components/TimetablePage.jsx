import { Fragment } from 'react'
import { GraduationCap } from 'lucide-react'
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
        gridTemplateColumns: `minmax(130px, 10.5vw) repeat(${periods.length}, minmax(0, 1fr))`,
        gridTemplateRows: `minmax(75px, 8.5vh) repeat(${CLASSES_PER_PAGE}, minmax(clamp(70px, 11vh, 180px), 1fr))`,
        gap: 'var(--kiosk-gap)',
      }}
    >
      {/* Top-left Corner Header */}
      <div
        className="kiosk-module"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.45rem',
          background: 'var(--kiosk-header-bg)',
          border: '1.5px solid var(--kiosk-header-bg)',
        }}
      >
        <GraduationCap size={20} color="#FFFFFF" />
        <span
          style={{
            color: '#FFFFFF',
            fontWeight: 900,
            fontSize: 'clamp(0.85rem, 1.05vw, 1.2rem)',
            letterSpacing: '0.12em',
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
            className={`kiosk-module ${isActive ? 'is-active-period' : ''}`}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0.35rem 0.2rem',
              background: isActive
                ? 'var(--kiosk-primary)'
                : 'var(--kiosk-card)',
              borderColor: isActive
                ? 'var(--kiosk-primary)'
                : 'var(--kiosk-border)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              <span
                style={{
                  fontSize: 'clamp(1.7rem, 2.3vw, 2.7rem)',
                  lineHeight: 1,
                  fontWeight: 900,
                  color: isActive ? '#FFFFFF' : 'var(--kiosk-text-primary)',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {period.short}
              </span>
              {isActive && (
                <span
                  style={{
                    fontSize: '0.62rem',
                    fontWeight: 900,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    padding: '0.1rem 0.35rem',
                    borderRadius: 'var(--kiosk-radius-pill)',
                    background: 'rgba(255, 255, 255, 0.25)',
                    color: '#FFFFFF',
                  }}
                >
                  Probíhá
                </span>
              )}
            </div>

            <div
              style={{
                marginTop: '0.2rem',
                textAlign: 'center',
                color: isActive ? 'rgba(255, 255, 255, 0.9)' : 'var(--kiosk-text-secondary)',
                fontSize: 'clamp(0.72rem, 0.85vw, 1rem)',
                fontWeight: 700,
                lineHeight: 1.15,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              <span>{period.start}</span>
              <span style={{ marginInline: '0.2rem', opacity: 0.6 }}>–</span>
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
              className="kiosk-module"
              style={{
                display: 'grid',
                placeItems: 'center',
                background: row
                  ? 'var(--kiosk-header-bg)'
                  : 'var(--kiosk-card-subtle)',
                padding: '0.4rem',
                borderColor: row
                  ? 'var(--kiosk-header-bg)'
                  : 'var(--kiosk-border-subtle)',
              }}
            >
              <span
                style={{
                  fontSize: 'clamp(1.8rem, 2.5vw, 3.4rem)',
                  fontWeight: 900,
                  letterSpacing: '-0.02em',
                  color: row ? '#FFFFFF' : 'var(--kiosk-text-muted)',
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
                    borderRadius: 'var(--kiosk-radius-lg)',
                    overflow: 'hidden',
                  }}
                >
                  <LessonCard cell={cell} isActive={isActiveCol} />
                </div>
              )
            })}
          </Fragment>
        )
      })}
    </section>
  )
}
