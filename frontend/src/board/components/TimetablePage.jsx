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
        gridTemplateColumns: `minmax(140px, 11vw) repeat(${periods.length}, minmax(0, 1fr))`,
        gridTemplateRows: `minmax(80px, 9vh) repeat(${CLASSES_PER_PAGE}, minmax(clamp(70px, 11vh, 180px), 1fr))`,
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
          gap: '0.5rem',
          background: 'var(--kiosk-card)',
          border: '1.5px solid var(--kiosk-border)',
        }}
      >
        <GraduationCap size={20} color="var(--kiosk-cyan)" />
        <span
          style={{
            color: 'var(--kiosk-text-secondary)',
            fontWeight: 800,
            fontSize: 'clamp(0.85rem, 1.1vw, 1.2rem)',
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
              padding: '0.4rem 0.2rem',
              background: isActive
                ? 'var(--kiosk-card-raised)'
                : 'var(--kiosk-card)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
              }}
            >
              <span
                style={{
                  fontSize: 'clamp(1.8rem, 2.4vw, 2.8rem)',
                  lineHeight: 1,
                  fontWeight: 900,
                  color: isActive ? 'var(--kiosk-cyan)' : 'var(--kiosk-text-white)',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {period.short}
              </span>
              {isActive && (
                <span
                  className="kiosk-pulse-dot"
                  style={{ color: 'var(--kiosk-cyan)' }}
                  title="Probíhající hodina"
                />
              )}
            </div>

            <div
              style={{
                marginTop: '0.25rem',
                textAlign: 'center',
                color: isActive ? 'var(--kiosk-cyan)' : 'var(--kiosk-text-secondary)',
                fontSize: 'clamp(0.75rem, 0.9vw, 1.05rem)',
                fontWeight: 700,
                lineHeight: 1.15,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              <span>{period.start}</span>
              <span style={{ marginInline: '0.25rem', opacity: 0.6 }}>–</span>
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
                  ? 'var(--kiosk-card)'
                  : 'rgba(255, 255, 255, 0.015)',
                padding: '0.5rem',
                border: '1.5px solid var(--kiosk-border)',
              }}
            >
              <span
                style={{
                  fontSize: 'clamp(1.8rem, 2.5vw, 3.4rem)',
                  fontWeight: 900,
                  letterSpacing: '-0.02em',
                  color: row ? 'var(--kiosk-text-white)' : 'var(--kiosk-text-muted)',
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
