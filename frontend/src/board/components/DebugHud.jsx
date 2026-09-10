import { useEffect, useState } from 'react'
import { useTimeSync, getNow } from '../timeSync'
import { useSettings } from '../settings'
import { formatClock } from '../formatters'
import { isLocalMode } from '../localMode'
import { findActiveSegment } from '../schedule'

function fmtOffset(ms) {
  if (ms == null || !Number.isFinite(ms)) return '–'
  const sign = ms < 0 ? '' : '+'
  return `${sign}${Math.round(ms)} ms`
}

function fmtAge(ms) {
  if (ms == null) return '–'
  const s = Math.max(0, Math.floor(ms / 1000))
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ${s % 60}s`
  return `${Math.floor(m / 60)}h ${m % 60}m`
}

export default function DebugHud({ showOverlay, overlayReason, fetchedAt, remoteState, isConnected, scheduleDay }) {
  const [now, setNow] = useState(() => getNow())
  const { offsetMs, synced } = useTimeSync()
  const settings = useSettings()

  useEffect(() => {
    const timer = window.setInterval(() => setNow(getNow()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  const clockLabel = formatClock(now, settings.clock24h === false, true)
  const ageMs = fetchedAt ? now.getTime() - fetchedAt : null
  const manualOffset = Number(settings.manualClockOffsetMinutes) || 0
  const mode = remoteState?.mode ?? 'normal'

  const nowStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  const active = scheduleDay ? findActiveSegment(scheduleDay.segments, nowStr) : null

  const chip = (label, value, state = 'ok') => (
    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'baseline' }}>
      <span style={{ color: '#64748B' }}>{label}</span>
      <span
        style={{
          fontWeight: 800,
          color:
            state === 'ok' ? '#4ADE80' :
            state === 'warn' ? '#FBBF24' : '#F87171',
        }}
      >
        {value}
      </span>
    </div>
  )

  const SEGMENT_STYLE = {
    morning: { color: '#34D399', label: 'nástup' },
    break: { color: '#34D399', label: 'přestávka' },
    in_class: { color: '#F87171', label: 'výuka' },
    after: { color: '#64748B', label: 'černá' },
  }

  return (
    <div
      style={{
        position: 'fixed',
        left: '0.5rem',
        bottom: '2rem',
        zIndex: 10050,
        padding: '0.5rem 0.7rem',
        borderRadius: '6px',
        background: 'rgba(2, 6, 23, 0.88)',
        border: '1px solid rgba(148, 163, 184, 0.35)',
        boxShadow: '0 2px 10px rgba(0,0,0,0.35)',
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        fontSize: '0.7rem',
        lineHeight: '1.5',
        color: '#E2E8F0',
        display: 'grid',
        gridTemplateColumns: 'auto auto',
        columnGap: '1.4rem',
        rowGap: '0.1rem',
        pointerEvents: 'none',
        userSelect: 'none',
      }}
    >
      <div style={{ display: 'contents' }}>
        {chip('clock', clockLabel)}
        {chip('sync', `${synced ? 'OK' : 'N/A'} ${fmtOffset(offsetMs)}`, synced ? 'ok' : 'warn')}
        {chip('offset', `${manualOffset >= 0 ? '+' : ''}${manualOffset} min`, manualOffset === 0 ? 'ok' : 'warn')}
        {chip('overlay', `${showOverlay ? 'ON' : 'off'} (${showOverlay ? overlayReason : 'content'})`, showOverlay ? 'warn' : 'ok')}
        {chip('data age', fmtAge(ageMs), ageMs && ageMs > 120000 ? 'warn' : 'ok')}
        {chip('ws', isConnected ? 'connected' : 'OFFLINE', isConnected ? 'ok' : 'warn')}
        {chip('mode', mode)}
        {chip('scale', `${settings.contentScale || 100}%`)}
        {chip('rotate', `${settings.rotationSeconds || 15}s`)}
        {chip('refresh', `${settings.refreshSeconds || 60}s`)}
        {chip('seconds', settings.clockWithSeconds ? 'on' : 'off')}
        {chip('week', settings.hideWeekBadge ? 'hidden' : 'shown')}
        {chip('demo', isLocalMode ? 'local' : 'live', isLocalMode ? 'warn' : 'ok')}
      </div>
      <div
        style={{
          gridColumn: '1 / -1',
          marginTop: '0.35rem',
          borderTop: '1px dashed rgba(148, 163, 184, 0.35)',
          paddingTop: '0.4rem',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.25rem 0.3rem',
          alignItems: 'center',
          maxWidth: '640px',
        }}
      >
        {!scheduleDay && <span style={{ color: '#94A3B8' }}>rozvrh: –</span>}
        {scheduleDay && (
          <>
            <span style={{ color: '#67E8F9', fontWeight: 700, marginRight: '0.2rem' }}>
              {scheduleDay.valid ? '' : '⚠ '}
              {new Date(`${scheduleDay.dayKey}T12:00:00`).toLocaleDateString('cs-CZ', { weekday: 'short', day: '2-digit' })}
            </span>
            {scheduleDay.segments === null && (
              <span style={{ color: '#F87171' }}>rozvrh bez časů</span>
            )}
            {scheduleDay.segments?.length === 0 && (
              <span style={{ color: '#64748B' }}>celý den černá (bez rozvrhu)</span>
            )}
            {(scheduleDay.segments?.length ?? 0) > 0 &&
              scheduleDay.segments.map((s, i) => {
                const isActive = active === s
                const p = SEGMENT_STYLE[s.kind]
                return (
                  <span
                    key={`${s.start}-${i}`}
                    style={{
                      padding: '1px 5px',
                      borderRadius: '4px',
                      color: p.color,
                      fontWeight: isActive ? 900 : 700,
                      background: isActive
                        ? `color-mix(in srgb, ${p.color} 22%, transparent)`
                        : 'transparent',
                      outline: isActive ? `1px solid ${p.color}` : 'none',
                    }}
                  >
                    {s.start}–{s.end} {p.label}
                  </span>
                )
              })}
          </>
        )}
      </div>
    </div>
  )
}