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
        gridTemplateColumns: `minmax(140px, 11vw) repeat(${periods.length}, minmax(0, 1fr))`,
        gridTemplateRows: `minmax(85px, 9.5vh) repeat(${CLASSES_PER_PAGE}, minmax(clamp(70px, 11vh, 180px), 1fr))`,
        gap: '0.45rem',
      }}
    >
      <md-filled-tonal-card
        style={{
          borderRadius: 'var(--board-shape-medium)',
          display: 'grid',
          placeItems: 'center',
          background: 'var(--md-sys-color-surface-container-high)',
          '--md-filled-tonal-card-container-color': 'var(--md-sys-color-surface-container-high)',
        }}
      >
        <span style={{ color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 600, fontSize: '0.78rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Třída</span>
      </md-filled-tonal-card>

      {periods.map((period, pIdx) => (
        <md-outlined-card
          key={period.period}
          style={{
            borderRadius: '12px',
            borderColor: pIdx === activePeriod
              ? 'var(--md-sys-color-primary)'
              : 'var(--board-border-subtle)',
            borderStyle: 'solid',
            borderWidth: pIdx === activePeriod ? '2px' : '1px',
            padding: '0',
          }}
        >
          <md-filled-tonal-card
            style={{
              borderRadius: 'var(--board-shape-medium)',
              display: 'grid',
              placeItems: 'center',
              padding: '0.3rem',
              background: 'var(--md-sys-color-surface-container-high)',
              '--md-filled-tonal-card-container-color': 'var(--md-sys-color-surface-container-high)',
            }}
          >
            <div style={{ fontSize: 'clamp(1.65rem, 2vw, 2.2rem)', lineHeight: 1, fontWeight: 700, color: 'var(--md-sys-color-primary)' }}>{period.short}</div>
            <div style={{ marginTop: '0.22rem', textAlign: 'center', color: 'var(--md-sys-color-on-surface-variant)', fontSize: 'clamp(0.74rem, 0.86vw, 0.96rem)', fontWeight: 500 }}>
              {period.start}
              <br />
              {period.end}
            </div>
          </md-filled-tonal-card>
        </md-outlined-card>
      ))}

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
            <md-outlined-card
              style={{
                borderRadius: '12px',
                display: 'grid',
                placeItems: 'center',
                borderColor: 'var(--board-border-subtle)',
                borderStyle: 'solid',
                borderWidth: '1px',
                background: row
                  ? 'var(--md-sys-color-surface-container-high)'
                  : 'var(--board-surface-dim)',
                padding: '0.45rem',
              }}
            >
              <span
                style={{
                  fontSize: 'clamp(1.7rem, 2.35vw, 3.25rem)',
                  fontWeight: 700,
                  letterSpacing: '-0.03em',
                  color: row ? 'var(--md-sys-color-on-surface)' : 'var(--md-sys-color-on-surface-variant)',
                  textAlign: 'center',
                }}
              >
                {row?.name ?? '—'}
              </span>
            </md-outlined-card>

            {rowCells.map(({ cell, periodIndex, consumed }) => {
              if (consumed) return null
              const span = cell?.span ?? 1
              const isActiveCol = periodIndex === activePeriod
              return (
                <md-outlined-card
                  key={`${row?.id ?? `empty-${rowIndex}`}-${periodIndex}`}
                  style={{
                    gridColumn: span > 1 ? `span ${span}` : undefined,
                    minWidth: 0,
                    borderRadius: '12px',
                    borderColor: isActiveCol && cell && cell.layout !== 'blank'
                      ? 'var(--md-sys-color-primary)'
                      : 'var(--board-border-subtle)',
                    borderStyle: 'solid',
                    borderWidth: isActiveCol && cell && cell.layout !== 'blank' ? '2px' : '1px',
                    overflow: 'hidden',
                  }}
                >
                  <LessonCard cell={cell} />
                </md-outlined-card>
              )
            })}
          </Fragment>
        )
      })}
    </section>
  )
}
