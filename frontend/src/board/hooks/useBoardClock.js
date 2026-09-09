import { useEffect, useMemo, useState } from 'react'
import { logClockTick, logBorder } from '../logger'
import { formatClock, formatDateParts } from '../formatters'
import { getNow } from '../timeSync'
import { useSettings } from '../settings'

export function useBoardClock() {
  const settings = useSettings()
  const [now, setNow] = useState(() => getNow())
  let tickCount = 0

  logBorder('⏰ useBoardClock MOUNTED', 'big')

  useEffect(() => {
    logClockTick('⏱ 1s clock interval started', '')

    const timer = window.setInterval(() => {
      tickCount++
      const t = getNow()
      setNow(t)

      // Log every 15 seconds (not every second to avoid spam)
      if (tickCount % 15 === 0) {
        logClockTick(
          `🕐 ${formatClock(t)} — ${t.toLocaleDateString('cs-CZ', { weekday: 'long', day: 'numeric', month: 'long' })}`,
          `tick#${tickCount} ISO=${t.toISOString()}`,
        )
      }
    }, 1000)

    return () => {
      window.clearInterval(timer)
      logClockTick('⏱ clock interval CLEARED', '')
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const dateParts = useMemo(() => formatDateParts(now), [now])
  const hour12 = settings.clock24h === false
  const withSeconds = Boolean(settings.clockWithSeconds)

  return {
    now,
    clockLabel: formatClock(now, hour12, withSeconds),
    dateParts,
  }
}
