import { useState, useEffect, useCallback } from 'react'

async function authedJson(pin, path, init) {
  const res = await fetch(path, {
    ...(init || {}),
    headers: {
      'X-Admin-PIN': pin,
      ...(init?.headers || {}),
    },
  })
  if (!res.ok) throw new Error(`${path} → ${res.status}`)
  return res.json()
}

export default function ClassesPanel({ pin, onToggle }) {
  const [classes, setClasses] = useState([])
  const [blocked, setBlocked] = useState([])
  const [busyId, setBusyId] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [data, blockedRes] = await Promise.all([
        authedJson(pin, '/api/data'),
        authedJson(pin, '/api/remote/blocked'),
      ])
      const lookup = data?.classes?.data ?? {}
      const cls = Object.entries(lookup)
        .map(([id, c]) => ({
          id,
          name: (typeof c === 'object' && c !== null ? c.name || c.short : c) || id,
        }))
        .filter((item) => item.name)
        .sort((a, b) => a.name.localeCompare(b.name, 'cs'))
      setClasses(cls)
      setBlocked((blockedRes.blocked ?? []).map((b) => String(b).toLowerCase()))
    } catch {
      setError('Nelze načíst seznam tříd ze serveru.')
    } finally {
      setLoading(false)
    }
  }, [pin])

  useEffect(() => {
    load()
  }, [load])

  const toggle = async (item) => {
    setBusyId(item.id)
    setError('')
    try {
      const res = await authedJson(pin, '/api/remote/blocked', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id }),
      })
      setBlocked((res.blocked ?? []).map((b) => String(b).toLowerCase()))
      await onToggle?.(res.blocked ?? [])
    } catch {
      setError('Uložení změny se nezdařilo.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '1.5px solid #CBD5E1',
        borderRadius: '6px',
        padding: '1.25rem 1.5rem',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '0.75rem',
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 900, color: '#0F172A' }}>
            Viditelné třídy
          </h2>
          <div style={{ fontSize: '0.82rem', color: '#64748B', marginTop: '0.25rem' }}>
            Skryté třídy se nezobrazí na TV, v rozvrhu ani v seznamu zamrznutí.
          </div>
        </div>
        <button
          onClick={load}
          style={{
            padding: '0.4rem 0.7rem',
            background: '#F1F5F9',
            border: '1px solid #CBD5E1',
            borderRadius: '4px',
            fontSize: '0.82rem',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Obnovit
        </button>
      </div>

      {error && (
        <div
          style={{
            padding: '0.5rem 0.75rem',
            marginBottom: '0.75rem',
            borderRadius: '4px',
            background: '#FEF2F2',
            color: '#B91C1C',
            fontSize: '0.85rem',
            fontWeight: 700,
          }}
        >
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ color: '#64748B', fontSize: '0.9rem', padding: '0.5rem 0' }}>
          Načítám třídy...
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
            gap: '0.5rem',
          }}
        >
          {classes.map((item) => {
            const isHidden = blocked.includes(item.id.toLowerCase())
            return (
              <button
                key={item.id}
                onClick={() => toggle(item)}
                disabled={busyId === item.id}
                title={isHidden ? 'Kliknutím zobrazit' : 'Kliknutím skrýt'}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.25rem',
                  padding: '0.55rem 0.4rem',
                  borderRadius: '4px',
                  border: isHidden ? '1.5px solid #FCA5A5' : '1.5px solid #CBD5E1',
                  background: isHidden ? '#FEF2F2' : '#FFFFFF',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0F172A' }}>
                  {item.name}
                </span>
                <span
                  style={{
                    fontSize: '0.66rem',
                    fontWeight: 800,
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    color: isHidden ? '#DC2626' : '#16A34A',
                  }}
                >
                  {isHidden ? 'Skrytá' : 'Zobrazená'}
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}