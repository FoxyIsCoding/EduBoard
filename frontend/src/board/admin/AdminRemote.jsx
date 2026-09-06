import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Calendar,
  Image as ImageIcon,
  Globe,
  Cast,
  AlertTriangle,
  Clock,
  Power,
  Trash2,
  Upload,
  Lock,
  LogOut,
  Monitor,
  RotateCcw
} from 'lucide-react'

export default function AdminRemote() {
  const [pin, setPin] = useState(() => localStorage.getItem('eduboard_admin_pin') || '')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [pinInput, setPinInput] = useState('')
  const [authError, setAuthError] = useState('')
  const [activeTab, setActiveTab] = useState('timetable')

  // Remote State
  const [remoteState, setRemoteState] = useState({
    mode: 'normal',
    frozenClass: null,
    images: [],
    slideIntervalMs: 8000,
    browserUrl: '',
    alertMessage: '',
    alertLevel: 'critical',
    tvPower: true,
    autoRevertSeconds: null,
    revertAt: null,
  })
  const [connectedDisplays, setConnectedDisplays] = useState(0)
  const [classesList, setClassesList] = useState([])

  // Input states
  const [urlInput, setUrlInput] = useState('')
  const [alertInput, setAlertInput] = useState('')
  const [alertLevelInput, setAlertLevelInput] = useState('critical')
  const [isCasting, setIsCasting] = useState(false)
  const [castError, setCastError] = useState('')

  const wsRef = useRef(null)
  const peerRef = useRef(null)
  const localStreamRef = useRef(null)

  const fetchState = useCallback(async (token) => {
    try {
      const res = await fetch('/api/remote/state', {
        headers: { 'X-Admin-PIN': token || pin },
      })
      if (res.ok) {
        const data = await res.json()
        setRemoteState(data)
        if (data.browserUrl) setUrlInput(data.browserUrl)
        if (data.alertMessage) setAlertInput(data.alertMessage)
      }
    } catch (err) {
      console.warn('[AdminRemote] Failed to fetch state:', err)
    }
  }, [pin])

  async function verifyToken(token) {
    try {
      const res = await fetch('/api/remote/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: token }),
      })
      if (res.ok) {
        setIsAuthenticated(true)
        localStorage.setItem('eduboard_admin_pin', token)
        setAuthError('')
        fetchState(token)
      } else {
        setIsAuthenticated(false)
        setAuthError('Neplatný administrátorský PIN.')
      }
    } catch {
      setAuthError('Chyba připojení k serveru.')
    }
  }

  // Verify PIN on mount if stored
  useEffect(() => {
    let cancelled = false
    if (pin) {
      fetch('/api/remote/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      })
        .then((res) => {
          if (cancelled) return
          if (res.ok) {
            setIsAuthenticated(true)
            localStorage.setItem('eduboard_admin_pin', pin)
            setAuthError('')
            fetchState(pin)
          } else {
            setIsAuthenticated(false)
            setAuthError('Neplatný administrátorský PIN.')
          }
        })
        .catch(() => {
          if (!cancelled) setAuthError('Chyba připojení k serveru.')
        })
    }
    return () => {
      cancelled = true
    }
  }, [pin, fetchState])

  // Load available school classes for freeze dropdown
  useEffect(() => {
    fetch('/api/data')
      .then((r) => r.json())
      .then((data) => {
        const raw = Object.values(data?.classes?.data ?? {})
        const cls = raw
          .map((c) => (typeof c === 'object' && c !== null ? c.name || c.short || c.id : c))
          .filter(Boolean)
        if (cls.length) setClassesList(cls)
      })
      .catch(() => {})
  }, [])

  // WebSocket connection for live status and WebRTC signaling
  useEffect(() => {
    if (!isAuthenticated) return

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = window.location.host || 'localhost:8000'
    const wsUrl = `${protocol}//${host}/ws/kiosk?role=controller`

    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    async function handleWebRTCSignal(data) {
      if (!data || !peerRef.current) return
      if (data.type === 'answer') {
        await peerRef.current.setRemoteDescription(new RTCSessionDescription(data.answer))
      } else if (data.type === 'candidate') {
        try {
          await peerRef.current.addIceCandidate(new RTCIceCandidate(data.candidate))
        } catch (e) {
          console.warn('[AdminRemote] ICE error:', e)
        }
      }
    }

    ws.onmessage = async (event) => {
      try {
        const msg = JSON.parse(event.data)
        if (msg.type === 'state') {
          setRemoteState(msg.data)
          if (msg.connectedDisplays !== undefined) {
            setConnectedDisplays(msg.connectedDisplays)
          }
        } else if (msg.type === 'webrtc_signal') {
          handleWebRTCSignal(msg.data)
        }
      } catch (err) {
        console.error('[AdminRemote] WS error:', err)
      }
    }

    return () => {
      ws.close()
    }
  }, [isAuthenticated])

  async function updateRemoteState(partial) {
    try {
      const res = await fetch('/api/remote/state', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-PIN': pin,
        },
        body: JSON.stringify(partial),
      })
      if (res.ok) {
        const data = await res.json()
        setRemoteState(data.state)
      }
    } catch (err) {
      console.error('[AdminRemote] Update failed:', err)
    }
  }

  // --- Image Upload Handlers ---
  function handleImageUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async () => {
      const b64 = reader.result
      const caption = prompt('Popisek snímku (volitelné):', file.name.replace(/\.[^/.]+$/, '')) || ''
      try {
        await fetch('/api/remote/slides', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Admin-PIN': pin,
          },
          body: JSON.stringify({ data: b64, caption }),
        })
        fetchState(pin)
      } catch {
        alert('Nahrání snímku selhalo.')
      }
    }
    reader.readAsDataURL(file)
  }

  async function handleDeleteSlide(id) {
    if (!confirm('Opravdu chcete tento snímek smazat?')) return
    try {
      await fetch(`/api/remote/slides/${id}`, {
        method: 'DELETE',
        headers: { 'X-Admin-PIN': pin },
      })
      fetchState(pin)
    } catch (err) {
      console.warn('[AdminRemote] Delete slide failed:', err)
    }
  }

  // --- WebRTC Wireless Screen Sharing ---
  async function stopScreenCast() {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop())
      localStreamRef.current = null
    }
    if (peerRef.current) {
      peerRef.current.close()
      peerRef.current = null
    }
    if (wsRef.current) {
      wsRef.current.send(JSON.stringify({
        type: 'webrtc_signal',
        data: { type: 'stop' },
      }))
    }
    setIsCasting(false)
    await updateRemoteState({ mode: 'normal' })
  }

  async function startScreenCast() {
    setCastError('')
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { width: { ideal: 1920 }, height: { ideal: 1080 }, frameRate: { ideal: 60 } },
        audio: false,
      })
      localStreamRef.current = stream

      const peer = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
      })
      peerRef.current = peer

      stream.getTracks().forEach((track) => {
        peer.addTrack(track, stream)
        track.onended = () => stopScreenCast()
      })

      peer.onicecandidate = (event) => {
        if (event.candidate && wsRef.current) {
          wsRef.current.send(JSON.stringify({
            type: 'webrtc_signal',
            data: { type: 'candidate', candidate: event.candidate },
          }))
        }
      }

      const offer = await peer.createOffer()
      await peer.setLocalDescription(offer)

      if (wsRef.current) {
        wsRef.current.send(JSON.stringify({
          type: 'webrtc_signal',
          data: { type: 'offer', offer },
        }))
      }

      await updateRemoteState({ mode: 'cast' })
      setIsCasting(true)
    } catch {
      setCastError('Sdílení obrazovky bylo zrušeno nebo není podporováno.')
      setIsCasting(false)
    }
  }

  function handleLogout() {
    localStorage.removeItem('eduboard_admin_pin')
    setPin('')
    setIsAuthenticated(false)
  }

  // --- Render Authentication Gate ---
  if (!isAuthenticated) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          background: '#F1F5F9',
          padding: '1.5rem',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div
          style={{
            background: '#FFFFFF',
            border: '1.5px solid #CBD5E1',
            borderRadius: '16px',
            padding: '2.5rem 2rem',
            width: '100%',
            maxWidth: '420px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: '#EFF6FF',
              border: '1.5px solid #BFDBFE',
              display: 'grid',
              placeItems: 'center',
              color: '#1D4ED8',
              margin: '0 auto 1.5rem',
            }}
          >
            <Lock size={32} />
          </div>

          <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 900, color: '#0F172A' }}>
            EduBoard Remote
          </h1>
          <p style={{ margin: '0.5rem 0 1.8rem', color: '#64748B', fontSize: '0.95rem' }}>
            Zadejte administrátorský PIN pro ovládání školní obrazovky.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              setPin(pinInput)
              verifyToken(pinInput)
            }}
          >
            <input
              type="password"
              placeholder="PIN nebo heslo (výchozí: 1234)"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              style={{
                width: '100%',
                padding: '0.85rem 1rem',
                fontSize: '1.2rem',
                textAlign: 'center',
                letterSpacing: '0.2em',
                borderRadius: '8px',
                border: '2px solid #CBD5E1',
                marginBottom: '1rem',
                outline: 'none',
                boxSizing: 'border-box',
              }}
              autoFocus
            />

            {authError && (
              <div style={{ color: '#DC2626', fontSize: '0.9rem', fontWeight: 700, marginBottom: '1rem' }}>
                {authError}
              </div>
            )}

            <button
              type="submit"
              style={{
                width: '100%',
                padding: '0.9rem',
                background: '#1D4ED8',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '8px',
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

  const currentMode = remoteState.mode || 'normal'

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#F8FAFC',
        color: '#0F172A',
        fontFamily: 'system-ui, sans-serif',
        paddingBottom: '4rem',
      }}
    >
      {/* Top Header */}
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
          <div style={{ fontWeight: 900, fontSize: '1.25rem', letterSpacing: '-0.02em', color: '#0F172A' }}>
            EduBoard Remote
          </div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.2rem 0.6rem',
              borderRadius: '999px',
              background: connectedDisplays > 0 ? '#DCFCE7' : '#FEF2F2',
              color: connectedDisplays > 0 ? '#15803D' : '#991B1B',
              fontSize: '0.78rem',
              fontWeight: 800,
            }}
          >
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: connectedDisplays > 0 ? '#16A34A' : '#DC2626',
              }}
            />
            <span>{connectedDisplays > 0 ? `${connectedDisplays} TV připojena` : 'Hledám TV...'}</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={() => window.open('/', '_blank')}
            style={{
              padding: '0.45rem 0.85rem',
              background: '#F1F5F9',
              border: '1px solid #CBD5E1',
              borderRadius: '6px',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
            }}
          >
            <Monitor size={16} />
            <span>Zobrazit TV</span>
          </button>

          <button
            onClick={handleLogout}
            title="Odhlásit"
            style={{
              padding: '0.45rem',
              background: 'transparent',
              border: 'none',
              color: '#64748B',
              cursor: 'pointer',
            }}
          >
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main style={{ maxWidth: '800px', margin: '1.5rem auto', padding: '0 1rem' }}>
        {/* Active Status Bar */}
        <div
          style={{
            background: '#FFFFFF',
            border: '1.5px solid #CBD5E1',
            borderRadius: '12px',
            padding: '1rem 1.25rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.5rem',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
          }}
        >
          <div>
            <div style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Aktuální režim obrazovky
            </div>
            <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#0F172A', marginTop: '0.15rem' }}>
              {currentMode === 'normal' && (remoteState.frozenClass ? `Rozvrh (Zafixována ${remoteState.frozenClass})` : 'Běžný rozvrh a suplování')}
              {currentMode === 'slideshow' && 'Prezentace fotografií'}
              {currentMode === 'browser' && 'Webové vysílání'}
              {currentMode === 'cast' && 'Bezdrátové sdílení obrazovky'}
              {currentMode === 'alert' && 'Mimořádné hlášení (Poplach)'}
              {currentMode === 'standby' && 'Vypnutá obrazovka (Pohotovostní režim)'}
            </div>
          </div>

          {currentMode !== 'normal' && (
            <button
              onClick={() => {
                if (isCasting) stopScreenCast()
                updateRemoteState({ mode: 'normal', frozenClass: null, autoRevertSeconds: null })
              }}
              style={{
                padding: '0.55rem 1rem',
                background: '#1D4ED8',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 800,
                fontSize: '0.9rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              <RotateCcw size={16} />
              <span>Vrátit na rozvrh</span>
            </button>
          )}
        </div>

        {/* Navigation Tabs */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: '0.5rem',
            marginBottom: '1.5rem',
          }}
        >
          {[
            { id: 'timetable', label: 'Rozvrh', icon: Calendar },
            { id: 'slideshow', label: 'Prezentace', icon: ImageIcon },
            { id: 'browser', label: 'Webová URL', icon: Globe },
            { id: 'cast', label: 'Sdílet plochu', icon: Cast },
            { id: 'alert', label: 'Hlášení', icon: AlertTriangle },
          ].map((tab) => {
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
                  borderRadius: '10px',
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

        {/* Tab 1: Rozvrh (Timetable Controls) */}
        {activeTab === 'timetable' && (
          <div
            style={{
              background: '#FFFFFF',
              border: '1.5px solid #CBD5E1',
              borderRadius: '12px',
              padding: '1.5rem',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
            }}
          >
            <h2 style={{ margin: '0 0 1rem', fontSize: '1.3rem', fontWeight: 900 }}>
              Ovládání rozvrhu a rotace
            </h2>

            <div style={{ display: 'grid', gap: '1.25rem' }}>
              <div>
                <button
                  onClick={() => updateRemoteState({ mode: 'normal', frozenClass: null })}
                  style={{
                    width: '100%',
                    padding: '0.9rem',
                    background: '#1D4ED8',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  Obnovit běžnou rotaci rozvrhu
                </button>
              </div>

              {classesList.length > 0 && (
                <div style={{ paddingTop: '1rem', borderTop: '1px solid #E2E8F0' }}>
                  <label style={{ display: 'block', fontWeight: 800, fontSize: '0.95rem', marginBottom: '0.5rem' }}>
                    Zafixovat zobrazení na konkrétní třídu:
                  </label>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {classesList.map((cls) => (
                      <button
                        key={cls}
                        onClick={() => updateRemoteState({ mode: 'normal', frozenClass: cls })}
                        style={{
                          padding: '0.45rem 0.85rem',
                          borderRadius: '6px',
                          border: remoteState.frozenClass === cls ? '2px solid #1D4ED8' : '1.5px solid #CBD5E1',
                          background: remoteState.frozenClass === cls ? '#EFF6FF' : '#FFFFFF',
                          color: remoteState.frozenClass === cls ? '#1D4ED8' : '#0F172A',
                          fontWeight: 800,
                          cursor: 'pointer',
                        }}
                      >
                        {cls}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Prezentace (Slideshow) */}
        {activeTab === 'slideshow' && (
          <div
            style={{
              background: '#FFFFFF',
              border: '1.5px solid #CBD5E1',
              borderRadius: '12px',
              padding: '1.5rem',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 900 }}>
                Prezentace fotografií ({remoteState.images?.length || 0})
              </h2>

              <button
                onClick={() => updateRemoteState({ mode: 'slideshow' })}
                style={{
                  padding: '0.6rem 1.1rem',
                  background: '#1D4ED8',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 800,
                  fontSize: '0.92rem',
                  cursor: 'pointer',
                }}
              >
                Spustit prezentaci na TV
              </button>
            </div>

            {/* Upload Button */}
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.6rem',
                padding: '1.5rem',
                border: '2px dashed #CBD5E1',
                borderRadius: '10px',
                background: '#F8FAFC',
                cursor: 'pointer',
                marginBottom: '1.5rem',
                fontWeight: 700,
                color: '#1D4ED8',
              }}
            >
              <Upload size={22} />
              <span>Klikněte pro nahrání nové fotografie z telefonu/počítače</span>
              <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
            </label>

            {/* Interval Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#475569' }}>Doba zobrazení snímku:</span>
              {[5000, 8000, 12000, 20000].map((ms) => (
                <button
                  key={ms}
                  onClick={() => updateRemoteState({ slideIntervalMs: ms })}
                  style={{
                    padding: '0.35rem 0.75rem',
                    borderRadius: '6px',
                    border: remoteState.slideIntervalMs === ms ? '2px solid #1D4ED8' : '1px solid #CBD5E1',
                    background: remoteState.slideIntervalMs === ms ? '#EFF6FF' : '#FFFFFF',
                    color: remoteState.slideIntervalMs === ms ? '#1D4ED8' : '#0F172A',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                  }}
                >
                  {ms / 1000} s
                </button>
              ))}
            </div>

            {/* Thumbnails Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.85rem' }}>
              {(remoteState.images || []).map((img) => (
                <div
                  key={img.id}
                  style={{
                    position: 'relative',
                    border: '1.5px solid #CBD5E1',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    background: '#000000',
                    aspectRatio: '16/9',
                  }}
                >
                  <img src={img.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button
                    onClick={() => handleDeleteSlide(img.id)}
                    style={{
                      position: 'absolute',
                      top: '0.3rem',
                      right: '0.3rem',
                      background: 'rgba(220, 38, 38, 0.9)',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '0.3rem',
                      cursor: 'pointer',
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                  {img.caption && (
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        insetInline: 0,
                        background: 'rgba(0, 0, 0, 0.7)',
                        color: '#FFFFFF',
                        fontSize: '0.72rem',
                        padding: '0.2rem 0.4rem',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {img.caption}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Webová URL (Browser) */}
        {activeTab === 'browser' && (
          <div
            style={{
              background: '#FFFFFF',
              border: '1.5px solid #CBD5E1',
              borderRadius: '12px',
              padding: '1.5rem',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
            }}
          >
            <h2 style={{ margin: '0 0 1rem', fontSize: '1.3rem', fontWeight: 900 }}>
              Promítnout webovou stránku na TV
            </h2>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (urlInput.trim()) {
                  updateRemoteState({ mode: 'browser', browserUrl: urlInput.trim() })
                }
              }}
            >
              <input
                type="url"
                placeholder="https://..."
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.8rem 1rem',
                  fontSize: '1rem',
                  borderRadius: '8px',
                  border: '1.5px solid #CBD5E1',
                  marginBottom: '1rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />

              <div style={{ marginBottom: '1.25rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#64748B', display: 'block', marginBottom: '0.4rem' }}>
                  Rychlé předvolby:
                </span>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {[
                    { label: 'YouTube Stream', url: 'https://www.youtube.com' },
                    { label: 'Školní web', url: 'https://www.edupage.org' },
                    { label: 'Kahoot', url: 'https://kahoot.it' },
                  ].map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => setUrlInput(p.url)}
                      style={{
                        padding: '0.35rem 0.75rem',
                        borderRadius: '6px',
                        border: '1px solid #CBD5E1',
                        background: '#F8FAFC',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                style={{
                  width: '100%',
                  padding: '0.85rem',
                  background: '#1D4ED8',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                Zobrazit web na obrazovce
              </button>
            </form>
          </div>
        )}

        {/* Tab 4: Sdílet plochu (Screen Cast) */}
        {activeTab === 'cast' && (
          <div
            style={{
              background: '#FFFFFF',
              border: '1.5px solid #CBD5E1',
              borderRadius: '12px',
              padding: '1.5rem',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: isCasting ? '#FEE2E2' : '#EFF6FF',
                color: isCasting ? '#DC2626' : '#1D4ED8',
                display: 'grid',
                placeItems: 'center',
                margin: '0 auto 1.25rem',
              }}
            >
              <Cast size={34} />
            </div>

            <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.35rem', fontWeight: 900 }}>
              {isCasting ? 'Obrazovka se právě promítá na TV' : 'Bezdrátové sdílení obrazovky'}
            </h2>
            <p style={{ margin: '0 0 1.5rem', color: '#64748B', fontSize: '0.95rem' }}>
              Bez instalace softwaru: kliknutím nasdílíte celou obrazovku, okno nebo kartu prohlížeče v reálném čase.
            </p>

            {castError && (
              <div style={{ color: '#DC2626', fontWeight: 700, fontSize: '0.9rem', marginBottom: '1rem' }}>
                {castError}
              </div>
            )}

            {!isCasting ? (
              <button
                onClick={startScreenCast}
                style={{
                  padding: '0.9rem 2rem',
                  background: '#1D4ED8',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '1.05rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <Cast size={20} />
                <span>Začít sdílet obrazovku</span>
              </button>
            ) : (
              <button
                onClick={stopScreenCast}
                style={{
                  padding: '0.9rem 2rem',
                  background: '#DC2626',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '1.05rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <span>Ukončit sdílení</span>
              </button>
            )}
          </div>
        )}

        {/* Tab 5: Mimořádné hlášení (Alert) */}
        {activeTab === 'alert' && (
          <div
            style={{
              background: '#FFFFFF',
              border: '1.5px solid #CBD5E1',
              borderRadius: '12px',
              padding: '1.5rem',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
            }}
          >
            <h2 style={{ margin: '0 0 1rem', fontSize: '1.3rem', fontWeight: 900, color: '#DC2626' }}>
              Mimořádné hlášení (Poplach)
            </h2>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (alertInput.trim()) {
                  updateRemoteState({
                    mode: 'alert',
                    alertMessage: alertInput.trim(),
                    alertLevel: alertLevelInput,
                  })
                }
              }}
            >
              <textarea
                rows={3}
                placeholder="Text mimořádného oznámení..."
                value={alertInput}
                onChange={(e) => setAlertInput(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.8rem 1rem',
                  fontSize: '1.1rem',
                  borderRadius: '8px',
                  border: '1.5px solid #CBD5E1',
                  marginBottom: '1rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                }}
              />

              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '1.25rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#64748B' }}>Úroveň:</span>
                <button
                  type="button"
                  onClick={() => setAlertLevelInput('critical')}
                  style={{
                    padding: '0.3rem 0.65rem',
                    borderRadius: '6px',
                    border: alertLevelInput === 'critical' ? '2px solid #DC2626' : '1px solid #CBD5E1',
                    background: alertLevelInput === 'critical' ? '#FEE2E2' : '#FFFFFF',
                    color: alertLevelInput === 'critical' ? '#DC2626' : '#0F172A',
                    fontWeight: 800,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                  }}
                >
                  Kritické (Červené)
                </button>
                <button
                  type="button"
                  onClick={() => setAlertLevelInput('warning')}
                  style={{
                    padding: '0.3rem 0.65rem',
                    borderRadius: '6px',
                    border: alertLevelInput === 'warning' ? '2px solid #D97706' : '1px solid #CBD5E1',
                    background: alertLevelInput === 'warning' ? '#FEF3C7' : '#FFFFFF',
                    color: alertLevelInput === 'warning' ? '#D97706' : '#0F172A',
                    fontWeight: 800,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                  }}
                >
                  Varování (Oranžové)
                </button>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#64748B', display: 'block', marginBottom: '0.4rem' }}>
                  Rychlé šablony:
                </span>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {[
                    'POŽÁRNÍ POPLACH - OKAMŽITÁ EVAKUACE BUDOVY',
                    'Dnešní odpolední výuka je zrušena',
                    'Ředitelské volno vyhlášeno',
                    'Upozornění: Zákaz vstupu do tělocvičny',
                  ].map((tpl) => (
                    <button
                      key={tpl}
                      type="button"
                      onClick={() => setAlertInput(tpl)}
                      style={{
                        padding: '0.35rem 0.65rem',
                        borderRadius: '6px',
                        border: '1px solid #CBD5E1',
                        background: '#F8FAFC',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      {tpl}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: '0.85rem',
                    background: '#DC2626',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    fontWeight: 900,
                    cursor: 'pointer',
                  }}
                >
                  Vyhlásit hlášení na TV
                </button>

                {currentMode === 'alert' && (
                  <button
                    type="button"
                    onClick={() => updateRemoteState({ mode: 'normal' })}
                    style={{
                      padding: '0.85rem 1.25rem',
                      background: '#F1F5F9',
                      border: '1.5px solid #CBD5E1',
                      borderRadius: '8px',
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                  >
                    Zrušit
                  </button>
                )}
              </div>
            </form>
          </div>
        )}

        {/* Global Settings Card: Auto-revert & TV Power */}
        <div
          style={{
            marginTop: '1.5rem',
            background: '#FFFFFF',
            border: '1.5px solid #CBD5E1',
            borderRadius: '12px',
            padding: '1.25rem',
            display: 'grid',
            gap: '1rem',
          }}
        >
          {/* Auto Revert */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 800, fontSize: '0.92rem', marginBottom: '0.5rem' }}>
              <Clock size={16} color="#1D4ED8" />
              <span>Automatický návrat na rozvrh po:</span>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {[
                { label: 'Bez limitu', sec: null },
                { label: '5 min', sec: 300 },
                { label: '15 min', sec: 900 },
                { label: '30 min', sec: 1800 },
                { label: '1 hodina', sec: 3600 },
              ].map((opt) => (
                <button
                  key={opt.label}
                  onClick={() => updateRemoteState({ autoRevertSeconds: opt.sec })}
                  style={{
                    padding: '0.35rem 0.75rem',
                    borderRadius: '6px',
                    border: remoteState.autoRevertSeconds === opt.sec ? '2px solid #1D4ED8' : '1px solid #CBD5E1',
                    background: remoteState.autoRevertSeconds === opt.sec ? '#EFF6FF' : '#FFFFFF',
                    color: remoteState.autoRevertSeconds === opt.sec ? '#1D4ED8' : '#0F172A',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* TV Power Standby Toggle */}
          <div style={{ paddingTop: '0.85rem', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>Stav TV obrazovky</div>
              <div style={{ fontSize: '0.82rem', color: '#64748B' }}>Přepnout obrazovku do černého pohotovostního režimu</div>
            </div>

            <button
              onClick={() => updateRemoteState({ tvPower: !remoteState.tvPower })}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                border: 'none',
                background: remoteState.tvPower ? '#DC2626' : '#16A34A',
                color: '#FFFFFF',
                fontWeight: 800,
                fontSize: '0.88rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              <Power size={16} />
              <span>{remoteState.tvPower ? 'Vypnout obrazovku' : 'Zapnout obrazovku'}</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
