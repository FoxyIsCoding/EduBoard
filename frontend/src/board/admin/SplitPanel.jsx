import { useState } from 'react'
import { Columns } from 'lucide-react'

const CONTENT_OPTIONS = [
  { value: 'timetable', label: 'Rozvrh' },
  { value: 'events', label: 'Události' },
  { value: 'substitutions', label: 'Suplování' },
]

const LABEL_STYLE = {
  fontSize: '0.72rem',
  fontWeight: 800,
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
  color: '#64748B',
  marginBottom: '0.35rem',
}

const SELECT_STYLE = {
  width: '100%',
  padding: '0.5rem 0.6rem',
  border: '1.5px solid #CBD5E1',
  borderRadius: '4px',
  fontSize: '0.9rem',
  fontWeight: 700,
  background: '#FFFFFF',
  color: '#0F172A',
  cursor: 'pointer',
}

export default function SplitPanel({ remoteState, onUpdate }) {
  const [left, setLeft] = useState(remoteState?.splitLeft || 'timetable')
  const [right, setRight] = useState(remoteState?.splitRight || 'events')
  const isActive = remoteState?.mode === 'split'

  const startSplit = () => onUpdate({ mode: 'split', splitLeft: left, splitRight: right })
  const stopSplit = () => onUpdate({ mode: 'normal', splitLeft: left, splitRight: right })

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
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Columns size={18} color="#1D4ED8" />
        <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 900, color: '#0F172A' }}>
          Rozdělená obrazovka
        </h2>
        {isActive && (
          <span
            style={{
              padding: '0.2rem 0.5rem',
              borderRadius: '3px',
              background: '#DCFCE7',
              color: '#15803D',
              fontSize: '0.72rem',
              fontWeight: 800,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
            }}
          >
            Aktivní
          </span>
        )}
      </div>

      <div style={{ fontSize: '0.82rem', color: '#64748B', marginTop: '0.35rem', marginBottom: '1.1rem' }}>
        Zobrazí na TV dva obsahové panely vedle sebe (levý + pravý). Rozvrh se na levém panelu
        automaticky listuje stránkami.
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div>
          <div style={LABEL_STYLE}>Levý panel</div>
          <select value={left} onChange={(e) => setLeft(e.target.value)} style={SELECT_STYLE}>
            {CONTENT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <div style={LABEL_STYLE}>Pravý panel</div>
          <select value={right} onChange={(e) => setRight(e.target.value)} style={SELECT_STYLE}>
            {CONTENT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem', flexWrap: 'wrap' }}>
        <button
          onClick={startSplit}
          disabled={left === right}
          style={{
            padding: '0.7rem 1.1rem',
            background: left === right ? '#E2E8F0' : '#1D4ED8',
            color: left === right ? '#94A3B8' : '#FFFFFF',
            border: 'none',
            borderRadius: '4px',
            fontSize: '0.92rem',
            fontWeight: 800,
            cursor: left === right ? 'not-allowed' : 'pointer',
          }}
        >
          {isActive ? 'Aktualizovat rozdělení' : 'Zapnout rozdělení'}
        </button>

        {isActive && (
          <button
            onClick={stopSplit}
            style={{
              padding: '0.7rem 1.1rem',
              background: '#F1F5F9',
              border: '1.5px solid #CBD5E1',
              borderRadius: '4px',
              fontSize: '0.92rem',
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            Zpět na normální režim
          </button>
        )}
      </div>
    </div>
  )
}