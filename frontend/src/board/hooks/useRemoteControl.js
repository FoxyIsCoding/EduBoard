import { useState, useEffect, useRef } from 'react'

export function useRemoteControl() {
  const [remoteState, setRemoteState] = useState({
    mode: 'normal',
    frozenClass: null,
    images: [],
    slideIntervalMs: 8000,
    browserUrl: '',
    alertMessage: '',
    alertLevel: 'critical',
    tvPower: true,
  })
  const [castStream, setCastStream] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const wsRef = useRef(null)
  const peerRef = useRef(null)

  useEffect(() => {
    let reconnectTimeout = null
    let isUnmounted = false

    function connect() {
      if (isUnmounted) return
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const host = window.location.host || 'localhost:8000'
      const isPreview = typeof window !== 'undefined' && window.location.search.includes('preview=1')
      const role = isPreview ? 'preview' : 'display'
      const wsUrl = `${protocol}//${host}/ws/kiosk?role=${role}`

      try {
        const ws = new WebSocket(wsUrl)
        wsRef.current = ws

        ws.onopen = () => {
          setIsConnected(true)
        }

        ws.onmessage = async (event) => {
          try {
            const msg = JSON.parse(event.data)
            if (msg.type === 'state') {
              setRemoteState(msg.data)
            } else if (msg.type === 'webrtc_signal') {
              handleWebRTCSignal(msg.data)
            }
          } catch (err) {
            console.error('[RemoteControl] Message parse error:', err)
          }
        }

        ws.onclose = () => {
          setIsConnected(false)
          wsRef.current = null
          if (!isUnmounted) {
            reconnectTimeout = setTimeout(connect, 3000)
          }
        }

        ws.onerror = () => {
          ws.close()
        }
      } catch {
        if (!isUnmounted) {
          reconnectTimeout = setTimeout(connect, 3000)
        }
      }
    }

    async function handleWebRTCSignal(data) {
      if (!data) return

      if (data.type === 'offer') {
        if (peerRef.current) {
          peerRef.current.close()
        }

        const peer = new RTCPeerConnection({
          iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
        })
        peerRef.current = peer

        peer.ontrack = (event) => {
          if (event.streams && event.streams[0]) {
            setCastStream(event.streams[0])
          }
        }

        peer.onicecandidate = (event) => {
          if (event.candidate && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
              type: 'webrtc_signal',
              data: { type: 'candidate', candidate: event.candidate },
            }))
          }
        }

        await peer.setRemoteDescription(new RTCSessionDescription(data.offer))
        const answer = await peer.createAnswer()
        await peer.setLocalDescription(answer)

        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: 'webrtc_signal',
            data: { type: 'answer', answer },
          }))
        }
      } else if (data.type === 'candidate' && peerRef.current) {
        try {
          await peerRef.current.addIceCandidate(new RTCIceCandidate(data.candidate))
        } catch (e) {
          console.warn('[RemoteControl] Add ICE candidate failed:', e)
        }
      } else if (data.type === 'stop') {
        if (peerRef.current) {
          peerRef.current.close()
          peerRef.current = null
        }
        setCastStream(null)
      }
    }

    connect()

    return () => {
      isUnmounted = true
      if (reconnectTimeout) clearTimeout(reconnectTimeout)
      if (wsRef.current) wsRef.current.close()
      if (peerRef.current) peerRef.current.close()
    }
  }, [])

  return {
    remoteState,
    castStream,
    isConnected,
  }
}
