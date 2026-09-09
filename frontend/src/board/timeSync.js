import { useSyncExternalStore } from 'react'
import { getSettings } from './settings'

const SYNC_INTERVAL_MS = 15 * 60 * 1000

let state = { offsetMs: 0, synced: false }
const listeners = new Set()
let lastSyncAt = 0

function emit() {
  listeners.forEach((listener) => listener())
}

async function fetchServerEpochMs() {
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null
  const timeoutId = controller ? setTimeout(() => controller.abort(), 6000) : null
  try {
    const res = await fetch('/api/time', controller ? { signal: controller.signal } : {})
    if (!res.ok) throw new Error(`time ${res.status}`)
    const data = await res.json()
    return Number(data.epoch_ms)
  } finally {
    if (timeoutId) clearTimeout(timeoutId)
  }
}

/** Fetch the server clock, measure the local offset, and store it. */
export async function syncServerClock(force = false) {
  if (!force && Date.now() - lastSyncAt < SYNC_INTERVAL_MS) return state
  try {
    const before = Date.now()
    const serverMs = await fetchServerEpochMs()
    const after = Date.now()
    state = { offsetMs: serverMs - (before + after) / 2, synced: true }
    lastSyncAt = Date.now()
  } catch {
    // Backend unreachable — keep the last known offset so the kiosk clock stays stable
  }
  emit()
  return state
}

/** Current "effective" time: device clock corrected by the measured server offset,
 *  overridden by the simulateTime experiment when it is active. */
export function getNow() {
  const base = new Date(Date.now() + state.offsetMs)
  const simulate = String(getSettings().simulateTime || '').trim()
  if (simulate) {
    const [hRaw, mRaw] = simulate.replace('.', ':').split(':')
    const h = Number(hRaw)
    const m = Number(mRaw)
    if (Number.isFinite(h) && h >= 0 && h <= 23) {
      const out = new Date(base)
      out.setHours(h)
      out.setMinutes(Number.isFinite(m) && m >= 0 && m < 60 ? m : 0)
      out.setSeconds(0)
      out.setMilliseconds(0)
      return out
    }
  }
  return base
}

export function getServerOffsetMs() {
  return state.offsetMs
}

export function isTimeSynced() {
  return state.synced
}

function getTimeSyncSnapshot() {
  return state
}

export function subscribeTimeSync(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useTimeSync() {
  return useSyncExternalStore(subscribeTimeSync, getTimeSyncSnapshot)
}