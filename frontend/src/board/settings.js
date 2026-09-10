import { useSyncExternalStore } from 'react'

const STORAGE_KEY = 'eduboard_settings'

export const DEFAULT_SETTINGS = {
  burnInDrift: false,
  forceContentOnly: false,
  simulateTime: '',
  clock24h: true,
  hideOfflineBadge: false,
  debugHud: false,
  clockWithSeconds: false,
  hideWeekBadge: false,
  rotationSeconds: 15,
  contentScale: 100,
  refreshSeconds: 60,
  manualClockOffsetMinutes: 0,
}

function loadSettings() {
  if (typeof window === 'undefined') return { ...DEFAULT_SETTINGS }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULT_SETTINGS }
    const parsed = JSON.parse(raw)
    return { ...DEFAULT_SETTINGS, ...(parsed && typeof parsed === 'object' ? parsed : {}) }
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

let settings = loadSettings()

const listeners = new Set()

function emitSettings() {
  listeners.forEach((listener) => listener())
}

export function getSettings() {
  return settings
}

export function saveSettings(partial) {
  settings = { ...settings, ...partial }
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    }
  } catch {
    // localStorage full/blocked — keep settings in memory only
  }
  emitSettings()
}

export function resetSettings() {
  saveSettings({ ...DEFAULT_SETTINGS })
}

export function subscribeSettings(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useSettings() {
  return useSyncExternalStore(subscribeSettings, getSettings)
}