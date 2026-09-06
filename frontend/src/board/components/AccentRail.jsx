export default function AccentRail({
  progress = 0,
  indeterminate = false,
}) {
  const safeProgress = Math.max(0, Math.min(100, Number(progress) || 0))
  const activeWidth = indeterminate ? '35%' : `${safeProgress}%`

  return (
    <div style={{ paddingInline: '0.1rem' }}>
      <div
        className="kiosk-progress-rail"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={indeterminate ? undefined : safeProgress}
        aria-valuetext={indeterminate ? 'Načítání' : `${Math.round(safeProgress)}%`}
      >
        <div
          className={`kiosk-progress-fill${indeterminate ? ' is-indeterminate' : ''}`}
          style={{ width: activeWidth }}
        />
      </div>
    </div>
  )
}
