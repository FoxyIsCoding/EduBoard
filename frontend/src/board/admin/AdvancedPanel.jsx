import { useEffect, useState, useCallback } from 'react'
import {
  RefreshCw,
  GitBranch,
  FileCode,
  Terminal,
  FlaskConical,
  LogOut,
  Lock,
  Clock,
  Power,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Save,
  Server,
  RotateCcw,
} from 'lucide-react'
import { saveSettings, resetSettings, useSettings } from '../settings'
import { syncServerClock } from '../timeSync'

const TOKEN_KEY = 'eduboard_sudo_token'

async function api(path, { method = 'GET', body, token } = {}) {
  let res
  try {
    res = await fetch(`/api/advanced${path}`, {
      method,
      headers: {
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { 'X-Sudo-Token': token } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new Error('Chyba připojení k serveru.')
  }
  let data = null
  try {
    data = await res.json()
  } catch {
    data = null
  }
  if (!res.ok) {
    throw new Error(data?.detail || `Chyba ${res.status}`)
  }
  return data
}

function formatUptime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '–'
  const d = Math.floor(seconds / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (d > 0) return `${d} d ${h} h ${m} min`
  if (h > 0) return `${h} h ${m} min`
  return `${m} min`
}

function formatMemory(kb) {
  if (!Number.isFinite(kb)) return '–'
  if (kb >= 1024 * 1024) return `${(kb / (1024 * 1024)).toFixed(1)} GB`
  return `${Math.round(kb / 1024)} MB`
}

function Drawer({ open, children }) {
  return (
    <div
      style={{
        maxHeight: open ? '28rem' : '0px',
        overflow: 'auto',
        transition: 'max-height 0.25s ease',
        background: '#0F172A',
        color: '#CBD5E1',
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        fontSize: '0.78rem',
        lineHeight: '1.5',
        borderRadius: '4px',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
      }}
    >
      {open ? <div style={{ padding: '0.75rem' }}>{children}</div> : null}
    </div>
  )
}

function Toggle({ label, sub, checked, onChange }) {
  return (
    <label
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        padding: '0.75rem 0.9rem',
        border: '1.5px solid #CBD5E1',
        borderRadius: '6px',
        cursor: 'pointer',
        background: '#FFFFFF',
      }}
    >
      <div>
        <div style={{ fontWeight: 800, color: '#0F172A' }}>{label}</div>
        {sub && <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '0.15rem' }}>{sub}</div>}
      </div>
      <input
        type="checkbox"
        checked={Boolean(checked)}
        onChange={(e) => onChange(e.target.checked)}
        style={{ width: '1.2rem', height: '1.2rem', cursor: 'pointer', flexShrink: 0 }}
      />
    </label>
  )
}

function Slider({ label, sub, value, min, max, step = 1, unit = '', onChange }) {
  return (
    <div style={{ padding: '0.7rem 0.9rem', border: '1.5px solid #CBD5E1', borderRadius: '6px', background: '#FFFFFF' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '1rem' }}>
        <div>
          <div style={{ fontWeight: 800, color: '#0F172A' }}>{label}</div>
          {sub && <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '0.15rem' }}>{sub}</div>}
        </div>
        <div style={{ fontWeight: 900, color: '#1D4ED8', fontVariantNumeric: 'tabular-nums' }}>
          {value}
          {unit}
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: '100%', marginTop: '0.5rem', cursor: 'pointer' }}
      />
    </div>
  )
}

export default function AdvancedPanel() {
  const settings = useSettings()
  const currentOffset = Number(settings.manualClockOffsetMinutes) || 0
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || '')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [activeTab, setActiveTab] = useState('system')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState(null)
  const [resultError, setResultError] = useState('')

  // System
  const [status, setStatus] = useState(null)
  const [serviceOutput, setServiceOutput] = useState('')

  // Git
  const [git, setGit] = useState(null)
  const [branches, setBranches] = useState(null)

  // Config / logs
  const [envContent, setEnvContent] = useState('')
  const [envKeys, setEnvKeys] = useState([])
  const [envSaved, setEnvSaved] = useState('')
  const [logLines, setLogLines] = useState(200)
  const [logs, setLogs] = useState('')
  const [gitRunOutput, setGitRunOutput] = useState('')

  const run = useCallback(
    async (fn) => {
      setBusy(true)
      setResult(null)
      setResultError('')
      try {
        const out = await fn()
        setResult(out)
        return out
      } catch (err) {
        setResultError(err.message)
        if (String(err.message).includes('sudo přihlášení') || String(err.message).includes('expir')) {
          localStorage.removeItem(TOKEN_KEY)
          setToken('')
          setIsAuthenticated(false)
        }
        return null
      } finally {
        setBusy(false)
      }
    },
    [],
  )

  const loadStatus = useCallback(
    () =>
      run(async () => {
        const [st, branchesData] = await Promise.all([
          api('/status', { token }),
          api('/branches', { token }),
        ])
        setStatus(st)
        setGit(st?.git ?? null)
        setBranches(branchesData)
        return st
      }),
    [run, token],
  )

  // Verify stored token on mount
  useEffect(() => {
    let cancelled = false
    if (!token) return undefined
    api('/session', { token })
      .then(() => {
        if (!cancelled) setIsAuthenticated(true)
      })
      .catch(() => {
        if (!cancelled) {
          localStorage.removeItem(TOKEN_KEY)
          setToken('')
        }
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleLogin(e) {
    e.preventDefault()
    setAuthError('')
    run(async () => {
      const data = await api('/auth', { method: 'POST', body: { password } })
      localStorage.setItem(TOKEN_KEY, data.token)
      setToken(data.token)
      setIsAuthenticated(true)
      setPassword('')
      return data
    })
  }

  function handleLogout() {
    if (token) {
      api('/logout', { method: 'POST', token }).catch(() => {})
    }
    localStorage.removeItem(TOKEN_KEY)
    setToken('')
    setIsAuthenticated(false)
    setResult(null)
    setResultError('')
  }

  useEffect(() => {
    if (isAuthenticated && activeTab === 'system') {
      loadStatus()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, activeTab])

  useEffect(() => {
    if (isAuthenticated && activeTab === 'config' && !envContent) {
      api('/env', { token })
        .then((data) => {
          setEnvContent(data.content || '')
          setEnvKeys(data.keys || [])
        })
        .catch(() => {})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, activeTab])

  useEffect(() => {
    if (isAuthenticated && activeTab === 'git' && !branches) {
      api('/branches', { token }).then(setBranches).catch(() => {})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, activeTab])

  if (!isAuthenticated) {
    return (
      <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div
          style={{
            background: '#FFFFFF',
            border: '1.5px solid #CBD5E1',
            borderRadius: '8px',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06)',
            padding: '2.5rem 2rem',
            maxWidth: '420px',
            width: '100%',
            textAlign: 'center',
          }}
        >
          <div style={{ display: 'inline-flex', padding: '0.9rem', borderRadius: '9999px', background: '#EEF2FF', color: '#1D4ED8', marginBottom: '1rem' }}>
            <Lock size={32} />
          </div>
          <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 900, color: '#0F172A' }}>EduBoard Advanced</h1>
          <p style={{ margin: '0.5rem 0 1.8rem', color: '#64748B', fontSize: '0.95rem' }}>
            Zadejte sudo heslo kiosk uživatele pro vzdálenou správu systému.
          </p>
          <form onSubmit={handleLogin}>
            <input
              type="password"
              placeholder="Sudo heslo uživatele kiosk"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              style={{
                width: '100%',
                padding: '0.85rem 1rem',
                fontSize: '1.15rem',
                textAlign: 'center',
                letterSpacing: '0.15em',
                borderRadius: '4px',
                border: '2px solid #CBD5E1',
                marginBottom: '1rem',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            {authError && (
              <div style={{ color: '#DC2626', fontSize: '0.9rem', fontWeight: 700, marginBottom: '1rem' }}>{authError}</div>
            )}
            <button
              type="submit"
              style={{
                width: '100%',
                padding: '0.9rem',
                background: '#1D4ED8',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '4px',
                fontSize: '1.1rem',
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              Přihlásit se
            </button>
          </form>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'system', label: 'Systém', icon: Server },
    { id: 'git', label: 'Aktualizace', icon: GitBranch },
    { id: 'config', label: 'Konfigurace', icon: FileCode },
    { id: 'logs', label: 'Protokoly', icon: Terminal },
    { id: 'experiments', label: 'Experimenty', icon: FlaskConical },
  ]

  const cardStyle = {
    background: '#FFFFFF',
    border: '1.5px solid #CBD5E1',
    borderRadius: '6px',
    padding: '1.5rem',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
    marginBottom: '1.5rem',
  }

  const primaryBtn = {
    padding: '0.55rem 1rem',
    background: '#1D4ED8',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '4px',
    fontWeight: 800,
    fontSize: '0.88rem',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.4rem',
  }

  const ghostBtn = {
    padding: '0.55rem 1rem',
    background: '#F1F5F9',
    color: '#0F172A',
    border: '1px solid #CBD5E1',
    borderRadius: '4px',
    fontWeight: 700,
    fontSize: '0.88rem',
    cursor: 'pointer',
  }

  const resultBar = resultError ? (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '1rem', padding: '0.75rem 1rem', borderRadius: '4px', background: '#FEF2F2', color: '#991B1B', fontWeight: 700, fontSize: '0.9rem' }}>
      <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '1px' }} />
      <span style={{ whiteSpace: 'pre-wrap' }}>{resultError}</span>
    </div>
  ) : result ? (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', padding: '0.75rem 1rem', borderRadius: '4px', background: '#DCFCE7', color: '#15803D', fontWeight: 800, fontSize: '0.9rem' }}>
      <CheckCircle2 size={18} />
      <span>{result.message || result.output || (result.ok ? 'Hotovo' : 'Operace dokončena')}</span>
    </div>
  ) : null

  return (
    <div
      className="admin-scope"
      style={{ minHeight: '100vh', background: '#F8FAFC', color: '#0F172A', fontFamily: 'system-ui, sans-serif', paddingBottom: '4rem', cursor: 'auto' }}
    >
      <header
        style={{
          background: '#FFFFFF',
          borderBottom: '1.5px solid #E2E8F0',
          padding: '0.85rem 1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
          position: 'sticky',
          top: 0,
          zIndex: 50,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ fontWeight: 900, fontSize: '1.25rem', letterSpacing: '-0.02em', color: '#0F172A' }}>EduBoard Advanced</div>
          <div style={{ padding: '0.2rem 0.6rem', borderRadius: '4px', background: '#DCFCE7', color: '#15803D', fontSize: '0.78rem', fontWeight: 800 }}>
            Sudo oprávnění aktivní
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button onClick={() => window.open('/', '_blank')} title="Otevřít kiosk" style={ghostBtn}>
            <ExternalLink size={15} />
          </button>
          <button onClick={handleLogout} title="Odhlásit" style={{ padding: '0.45rem 0.85rem', background: 'transparent', border: 'none', color: '#64748B', cursor: 'pointer' }}>
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <main style={{ maxWidth: '820px', margin: '1.5rem auto', padding: '0 1rem' }}>
        {/* Navigation Tabs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.5rem', marginBottom: '1.5rem' }}>
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isSelected = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '0.75rem 0.5rem',
                  background: isSelected ? '#1D4ED8' : '#FFFFFF',
                  color: isSelected ? '#FFFFFF' : '#0F172A',
                  border: isSelected ? '1.5px solid #1D4ED8' : '1.5px solid #CBD5E1',
                  borderRadius: '4px',
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.35rem',
                  transition: 'all 0.15s ease',
                }}
              >
                <Icon size={20} />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>

        {resultBar}

        {/* ─────────── SYSTEM ─────────── */}
        {activeTab === 'system' && (
          <div style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 900 }}>Stav systému</h2>
              <button onClick={loadStatus} disabled={busy} style={{ ...ghostBtn, ...(busy ? { opacity: 0.6 } : {}) }}>
                <RefreshCw size={15} style={{ marginRight: '0.35rem' }} />
                Obnovit
              </button>
            </div>

            {status ? (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
                  <SystemCell label="Systém" value={status.os} />
                  <SystemCell label="Kernel" value={status.kernel} />
                  <SystemCell label="Hostname" value={status.hostname} />
                  <SystemCell label="Síť (IP)" value={(status.ips || []).join(', ') || '–'} />
                  <SystemCell label="Provoz" value={formatUptime(status.uptime_seconds)} />
                  <SystemCell label="Teplota CPU" value={status.cpu_temp != null ? `${status.cpu_temp} °C` : '–'} />
                  <SystemCell
                    label="Paměť"
                    value={
                      status.mem?.available_kb != null
                        ? `${formatMemory(status.mem.available_kb)} / ${formatMemory(status.mem.total_kb)}`
                        : '–'
                    }
                  />
                  <SystemCell label="Disk" value={status.disk ? `${status.disk.used} / ${status.disk.size} (${status.disk.pct})` : '–'} />
                  <SystemCell label="Load 1 / 5 / 15" value={(status.loadavg || []).join(' / ') || '–'} />
                </div>

                <div style={{ fontSize: '0.85rem', color: '#64748B', marginBottom: '1.25rem' }}>
                  Služba: <b style={{ color: '#0F172A' }}>{status.service}</b> · větev <b style={{ color: '#0F172A' }}>{status.git?.branch || 'n/a'}</b>@{status.git?.head || 'n/a'} · {status.disk ? 'OK' : ''}
                </div>

                <Drawer open={Boolean(serviceOutput)}>{serviceOutput}</Drawer>
              </>
            ) : (
              <div style={{ color: '#64748B' }}>Načítám stav systému…</div>
            )}

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', marginTop: '1.25rem' }}>
              <button
                onClick={() =>
                  run(async () => {
                    const res = await api('/service', { method: 'POST', body: { action: 'status' }, token })
                    setServiceOutput(res.output || '(bez výstupu)')
                    return { ...res, message: 'Stav služby načten' }
                  })
                }
                disabled={busy}
                style={ghostBtn}
              >
                Stav služby
              </button>
              <button
                onClick={() =>
                  run(async () => {
                    const res = await api('/service', { method: 'POST', body: { action: 'restart' }, token })
                    return { ...res, message: 'Restart naplánován — server se za chvíli restartuje.' }
                  })
                }
                disabled={busy}
                style={{ ...primaryBtn, background: '#B45309' }}
              >
                <RotateCcw size={15} />
                Restartovat službu
              </button>
              <button
                onClick={() =>
                  run(async () => {
                    const res = await api('/service', { method: 'POST', body: { action: 'stop' }, token })
                    return { ...res, message: 'Zastavení naplánováno — kiosk se vypne.' }
                  })
                }
                disabled={busy}
                style={{ ...primaryBtn, background: '#B91C1C' }}
              >
                <Power size={15} />
                Zastavit službu
              </button>
              <button
                onClick={() =>
                  run(async () => {
                    const res = await api('/sync-clock', { method: 'POST', token })
                    return { ...res, message: res.ok ? 'Hodiny systému synchronizovány (NTP + hwclock)' : 'Synchronizace hodin skončila s chybou' }
                  })
                }
                disabled={busy}
                style={primaryBtn}
              >
                <Clock size={15} />
                Synchronizovat systémové hodiny
              </button>
            </div>
          </div>
        )}

        {/* ─────────── GIT / UPDATE ─────────── */}
        {activeTab === 'git' && (
          <>
            <div style={cardStyle}>
              <h2 style={{ margin: '0 0 1.25rem', fontSize: '1.3rem', fontWeight: 900 }}>Aktualizace z repozitáře</h2>
              {git ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
                  <SystemCell label="Větev" value={git.branch} highlight />
                  <SystemCell label="Commit" value={git.head} />
                  <SystemCell label="Upstream" value={git.upstream} />
                  <SystemCell label="Neposl. / neprijaté" value={`${git.ahead} / ${git.behind}`} />
                  <SystemCell label="Origin" value={git.origin} />
                  <SystemCell label="Lokální změny" value={git.dirty ? 'ANO (uložím do stash)' : 'ne' } dirty={git.dirty} />
                </div>
              ) : (
                <div style={{ color: '#64748B' }}>Načítám…</div>
              )}
              <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                <button
                  onClick={() =>
                    run(async () => {
                      const data = await api('/branches', { token })
                      setBranches(data)
                      setGit(data.status)
                      return { message: 'Stav repozitáře obnoven' }
                    })
                  }
                  disabled={busy}
                  style={ghostBtn}
                >
                  <RefreshCw size={15} style={{ marginRight: '0.35rem' }} />
                  Načíst stav
                </button>
                <button
                  onClick={() =>
                    run(async () => {
                      const data = await api('/update', { method: 'POST', token })
                      setBranches(null)
                      setGit(data.status)
                      setGitRunOutput(formatRunSteps(data.steps, data.buildOutput))
                      return { message: data.ok ? 'Aktualizace hotová' : 'Aktualizace dokončena s chybami' }
                    })
                  }
                  disabled={busy}
                  style={{ ...primaryBtn, background: '#15803D' }}
                >
                  <RefreshCw size={15} />
                  Stáhnout a přebudovat (git pull + npm build)
                </button>
              </div>
              <div style={{ marginTop: '0.9rem', fontSize: '0.8rem', color: '#64748B' }}>
                Po aktualizaci spusťte <b>Restartovat službu</b> v záložce Systém, aby se nový kód projevil.
              </div>
              <Drawer open={Boolean(gitRunOutput)}>{gitRunOutput}</Drawer>
            </div>

            {branches && (
              <div style={cardStyle}>
                <h2 style={{ margin: '0 0 1rem', fontSize: '1.15rem', fontWeight: 900 }}>Přepnutí větve</h2>
                {[...branches.local, ...branches.remote.filter((b) => !branches.local.includes(b.replace(/^origin\//, '')))].map((branch) => {
                  const isCurrent = GitName(branch) === GitName(git?.branch)
                  return (
                    <div
                      key={branch}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.55rem 0.75rem',
                        border: isCurrent ? '1.5px solid #1D4ED8' : '1.5px solid #E2E8F0',
                        borderRadius: '4px',
                        marginBottom: '0.5rem',
                        background: isCurrent ? '#EEF2FF' : '#FFFFFF',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
                        <GitBranch size={15} color={isCurrent ? '#1D4ED8' : '#94A3B8'} style={{ flexShrink: 0 }} />
                        <span style={{ fontWeight: isCurrent ? 900 : 700, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {branch}
                          {isCurrent ? ' (aktuální)' : ''}
                        </span>
                      </div>
                      {!isCurrent && (
                        <button
                          onClick={() =>
                            run(async () => {
                              const target = branches.local.includes(branch) ? branch : branch.replace(/^origin\//, '')
                              const data = await api('/switch-branch', { method: 'POST', body: { branch: target }, token })
                              setBranches(null)
                              setGit(data.status)
                              setGitRunOutput(formatRunSteps(data.steps, data.buildOutput))
                              return { message: `Přepnuto na '${target}'` }
                            })
                          }
                          disabled={busy}
                          style={ghostBtn}
                        >
                          Přepnout
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {branches?.commits?.length > 0 && (
              <div style={cardStyle}>
                <h2 style={{ margin: '0 0 0.75rem', fontSize: '1.05rem', fontWeight: 900 }}>Poslední commity</h2>
                {branches.commits.map((line) => (
                  <div key={line} style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: '0.82rem', padding: '0.25rem 0', color: '#334155', borderBottom: '1px solid #F1F5F9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {line}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ─────────── CONFIG ─────────── */}
        {activeTab === 'config' && (
          <div style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 900 }}>Konfigurace (.env)</h2>
              {envKeys.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                  {envKeys.map((k) => (
                    <span key={k} style={{ padding: '0.15rem 0.5rem', borderRadius: '9999px', background: '#EEF2FF', color: '#1D4ED8', fontSize: '0.72rem', fontWeight: 800, fontFamily: 'ui-monospace, monospace' }}>
                      {k}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <p style={{ margin: '0 0 1rem', fontSize: '0.85rem', color: '#64748B' }}>
              Hesla a tokeny se zobrazují maskované ({'••••••'}) a při uložení zůstávají beze změny. Po uložení restartujte službu.
            </p>
            <textarea
              value={envContent}
              onChange={(e) => setEnvContent(e.target.value)}
              spellCheck={false}
              rows={22}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                fontSize: '0.82rem',
                lineHeight: '1.5',
                padding: '0.75rem',
                borderRadius: '4px',
                border: '1.5px solid #CBD5E1',
                background: '#F8FAFC',
                color: '#0F172A',
                outline: 'none',
                resize: 'vertical',
                whiteSpace: 'pre',
              }}
            />
            <div style={{ display: 'flex', gap: '0.6rem', marginTop: '1rem', flexWrap: 'wrap' }}>
              <button
                onClick={() =>
                  run(async () => {
                    const data = await api('/env', { method: 'POST', body: { content: envContent }, token })
                    setEnvSaved(data.output || 'Uloženo')
                    return { ...data, message: data.output || 'Uloženo' }
                  })
                }
                disabled={busy}
                style={primaryBtn}
              >
                <Save size={15} />
                Uložit .env
              </button>
              <button
                onClick={() =>
                  api('/env', { token })
                    .then((data) => {
                      setEnvContent(data.content || '')
                      setEnvKeys(data.keys || [])
                    })
                    .catch(() => {})
                }
                style={ghostBtn}
              >
                <RefreshCw size={15} />
                Znovu načíst
              </button>
            </div>
            {envSaved && <div style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: '#15803D', fontWeight: 700 }}>{envSaved}</div>}
          </div>
        )}

        {/* ─────────── LOGS ─────────── */}
        {activeTab === 'logs' && (
          <div style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 900 }}>Protokoly služby</h2>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <select value={logLines} onChange={(e) => setLogLines(Number(e.target.value))} style={{ padding: '0.5rem 0.6rem', border: '1.5px solid #CBD5E1', borderRadius: '4px', fontWeight: 700 }}>
                  <option value={100}>100 řádků</option>
                  <option value={200}>200 řádků</option>
                  <option value={500}>500 řádků</option>
                  <option value={1000}>1000 řádků</option>
                </select>
                <button
                  onClick={() =>
                    run(async () => {
                      const data = await api(`/logs?lines=${logLines}`, { token })
                      setLogs(data.output || '(prázdný protokol)')
                      return { message: `Načteno ${logLines} řádků` }
                    })
                  }
                  disabled={busy}
                  style={primaryBtn}
                >
                  <RefreshCw size={15} />
                  Načíst
                </button>
              </div>
            </div>
            {logs ? (
              <Drawer open>{logs}</Drawer>
            ) : (
              <div style={{ color: '#64748B' }}>Klikněte na „Načíst“ pro zobrazení logu služby {status?.service || 'EduBoard.service'}.</div>
            )}
          </div>
        )}

        {/* ─────────── EXPERIMENTS ─────────── */}
        {activeTab === 'experiments' && (
          <div style={cardStyle}>
            <h2 style={{ margin: '0 0 0.25rem', fontSize: '1.3rem', fontWeight: 900 }}>UI experimenty</h2>
            <p style={{ margin: '0 0 1.25rem', fontSize: '0.85rem', color: '#64748B' }}>
              Nastavení se ukládají v prohlížeči displeje (localStorage) a platí při příští návštěvě stránky.
            </p>

            <div style={{ display: 'grid', gap: '0.75rem' }}>
              <Toggle
                label="Proti-vypalování (burn-in drift)"
                sub="Celá obrazovka se velmi pomalu posouvá o pár pixelů, aby se statické prvky nevypalovaly."
                checked={settings.burnInDrift}
                onChange={(v) => saveSettings({ burnInDrift: v })}
              />
              <Toggle
                label="Vynutit zobrazování obsahu"
                sub="Zcela vypne vypínací overlay — obrazovka zůstane zapnutá i během výuky."
                checked={settings.forceContentOnly}
                onChange={(v) => saveSettings({ forceContentOnly: v })}
              />
              <Toggle
                label="12hodinový formát času"
                sub="Přepne hodiny na zobrazení AM/PM (testovací volba)."
                checked={settings.clock24h === false}
                onChange={(v) => saveSettings({ clock24h: !v })}
              />
              <Toggle
                label="Skrýt badge „Offline Mode“"
                sub="Schová červený odznak při vypršení mezipaměti dat."
                checked={settings.hideOfflineBadge}
                onChange={(v) => saveSettings({ hideOfflineBadge: v })}
              />
              <Toggle
                label="Ladicí HUD"
                sub="Zobrazí v rohu obrazovky diagnostiku běhu — posun hodin, stav overlaye, stáří dat a WebSocket."
                checked={settings.debugHud}
                onChange={(v) => saveSettings({ debugHud: v })}
              />
              <Toggle
                label="Hodiny se sekundami"
                sub="Zobrazí v hodinách také sekundy (aktualizace každou sekundu)."
                checked={settings.clockWithSeconds}
                onChange={(v) => saveSettings({ clockWithSeconds: v })}
              />
              <Toggle
                label="Skrýt odznak týdne"
                sub="Schová štítek „Sudý týden“ / „Lichý týden“ u data."
                checked={settings.hideWeekBadge}
                onChange={(v) => saveSettings({ hideWeekBadge: v })}
              />

              <Slider
                label="Interval otáčení stránek"
                sub="Jak dlouho se každá stránka (rozvrh / suplování / akce) zobrazuje."
                value={Number(settings.rotationSeconds) || 15}
                min={5}
                max={60}
                step={1}
                unit=" s"
                onChange={(v) => saveSettings({ rotationSeconds: v })}
              />
              <Slider
                label="Interval obnovování dat"
                sub="Jak často se znovu stahují data z EduPage (min. 30 s)."
                value={Number(settings.refreshSeconds) || 60}
                min={30}
                max={600}
                step={5}
                unit=" s"
                onChange={(v) => saveSettings({ refreshSeconds: v })}
              />
              <Slider
                label="Zvětšení obsahu"
                sub="Zvětší / zmenší celý obsah obrazovky (test proti vypalování a čitelnosti)."
                value={Number(settings.contentScale) || 100}
                min={50}
                max={150}
                step={5}
                unit=" %"
                onChange={(v) => saveSettings({ contentScale: v })}
              />
            </div>

            <div style={{ marginTop: '1.25rem', padding: '1rem', border: '1.5px solid #CBD5E1', borderRadius: '6px', background: '#F8FAFC' }}>
              <div style={{ fontWeight: 800, color: '#0F172A', marginBottom: '0.4rem' }}>Simulace času</div>
              <div style={{ fontSize: '0.82rem', color: '#64748B', marginBottom: '0.75rem' }}>
                Nastaví hodiny na obrazovce i logiku overlaye (zkoušení přestávek / výuky). Prázdné = skutečný čas.
              </div>
              <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <input
                  type="time"
                  value={settings.simulateTime}
                  onChange={(e) => saveSettings({ simulateTime: e.target.value })}
                  style={{ padding: '0.5rem 0.7rem', border: '1.5px solid #CBD5E1', borderRadius: '4px', fontSize: '1rem', fontWeight: 700 }}
                />
                {settings.simulateTime && (
                  <button onClick={() => saveSettings({ simulateTime: '' })} style={ghostBtn}>
                    Vypnout simulaci
                  </button>
                )}
              </div>
            </div>

            <div style={{ marginTop: '1.25rem', padding: '1rem', border: '1.5px solid #CBD5E1', borderRadius: '6px', background: '#F8FAFC' }}>
              <div style={{ fontWeight: 800, color: '#0F172A', marginBottom: '0.4rem' }}>Manuální posun času</div>
              <div style={{ fontSize: '0.82rem', color: '#64748B', marginBottom: '0.75rem' }}>
                Posune hodiny i logiku overlaye o daný počet minut (test, že se displej přepíná ve správný čas).
              </div>
              <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <button
                  onClick={() => saveSettings({ manualClockOffsetMinutes: Math.max(-120, currentOffset - 5) })}
                  style={ghostBtn}
                >
                  −5 min
                </button>
                <button
                  onClick={() => saveSettings({ manualClockOffsetMinutes: Math.max(-120, currentOffset - 1) })}
                  style={ghostBtn}
                >
                  −1 min
                </button>
                <span style={{ fontWeight: 900, color: '#0F172A', fontVariantNumeric: 'tabular-nums', minWidth: '4.5rem', textAlign: 'center' }}>
                  {currentOffset >= 0 ? '+' : ''}{currentOffset} min
                </span>
                <button
                  onClick={() => saveSettings({ manualClockOffsetMinutes: Math.min(120, currentOffset + 1) })}
                  style={ghostBtn}
                >
                  +1 min
                </button>
                <button
                  onClick={() => saveSettings({ manualClockOffsetMinutes: Math.min(120, currentOffset + 5) })}
                  style={ghostBtn}
                >
                  +5 min
                </button>
                {currentOffset !== 0 && (
                  <button onClick={() => saveSettings({ manualClockOffsetMinutes: 0 })} style={ghostBtn}>
                    Vynulovat
                  </button>
                )}
              </div>
            </div>

            <div style={{ marginTop: '1.25rem' }}>
              <button
                onClick={() =>
                  run(async () => {
                    resetSettings()
                    await syncServerClock(true)
                    return { message: 'Všechna experimentální nastavení resetována' }
                  })
                }
                style={ghostBtn}
              >
                Obnovit výchozí nastavení
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

function SystemCell({ label, value, highlight, dirty }) {
  return (
    <div style={{ padding: '0.6rem 0.75rem', border: '1.5px solid #E2E8F0', borderRadius: '4px', background: '#F8FAFC', minWidth: 0 }}>
      <div style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748B' }}>{label}</div>
      <div
        style={{
          marginTop: '0.2rem',
          fontWeight: highlight ? 900 : 700,
          color: dirty ? '#B91C1C' : highlight ? '#1D4ED8' : '#0F172A',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {value}
      </div>
    </div>
  )
}

function GitName(branch) {
  return String(branch || '').replace(/^origin\//, '')
}

function formatRunSteps(steps, buildOutput) {
  const lines = (steps || [])
    .map(([label, code, output]) => `$ ${label} [${code}]\n${output || ''}`.trim())
    .join('\n\n')
  return (lines ? `${lines}\n\n` : '') + (buildOutput ? `--- frontend build ---\n${buildOutput}` : '')
}