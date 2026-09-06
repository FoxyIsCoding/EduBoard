/**
 * Local mode detection helper.
 * When enabled, the application uses realistic dummy data,
 * bypasses network/backend requirements, and completely disables
 * the screen standby / turning-off schedule.
 */
export function checkIsLocalMode() {
  if (typeof window === 'undefined') return false

  // 1. Build-time or Vite runtime env flag
  if (
    import.meta.env.VITE_LOCAL_MODE === 'true' ||
    import.meta.env.VITE_LOCAL_MODE === true ||
    import.meta.env.MODE === 'mock' ||
    import.meta.env.MODE === 'demo'
  ) {
    return true
  }

  // 2. URL search parameters: ?local=1, ?mock=1, ?demo=1
  try {
    const params = new URLSearchParams(window.location.search)
    if (params.has('local') || params.has('mock') || params.has('demo')) {
      return true
    }
  } catch {
    // ignore
  }

  // 3. LocalStorage persistence
  try {
    if (window.localStorage && window.localStorage.getItem('eduboard_local_mode') === 'true') {
      return true
    }
  } catch {
    // ignore
  }

  // 4. Global window variable
  if (typeof window !== 'undefined' && window.__EDUBOARD_LOCAL_MODE__ === true) {
    return true
  }

  return false
}

export const isLocalMode = checkIsLocalMode()
