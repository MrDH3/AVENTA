'use client'

import { useRef, useState, useEffect } from 'react'
import { signContractAction } from '@/server/contract-actions'

/**
 * Canvas e-signature capture that persists to the booking's contract (via `signContractAction` →
 * the `ContractSignature` model).
 *
 * ⚠️ DORMANT / UNUSED as of this cleanup: this component is intentionally NOT mounted anywhere in the
 * app — no in-app signing flow exists yet, so no `ContractSignature` is ever created through the UI.
 * It is kept (with its server action + model) as ready scaffolding for a future in-app signing step.
 * The Success page therefore does NOT advertise "electronic signature available"; the contract is
 * generated automatically and signed on handover. Wire this in before making any e-signing claim.
 */
export default function SignaturePad({
  bookingId,
  signerName,
  onSigned,
}: {
  bookingId: string
  signerName: string
  onSigned?: () => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)
  const [dirty, setDirty] = useState(false)
  const [saved, setSaved] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const c = canvasRef.current
    if (!c) return
    const ctx = c.getContext('2d')
    if (!ctx) return
    ctx.lineWidth = 2.2
    ctx.lineCap = 'round'
    ctx.strokeStyle = '#0C3B45'
  }, [])

  const pos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = canvasRef.current!.getBoundingClientRect()
    return { x: e.clientX - r.left, y: e.clientY - r.top }
  }
  const down = (e: React.PointerEvent<HTMLCanvasElement>) => {
    drawing.current = true
    const ctx = canvasRef.current!.getContext('2d')!
    const { x, y } = pos(e)
    ctx.beginPath()
    ctx.moveTo(x, y)
  }
  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return
    const ctx = canvasRef.current!.getContext('2d')!
    const { x, y } = pos(e)
    ctx.lineTo(x, y)
    ctx.stroke()
    setDirty(true)
  }
  const up = () => (drawing.current = false)

  const clear = () => {
    const c = canvasRef.current!
    c.getContext('2d')!.clearRect(0, 0, c.width, c.height)
    setDirty(false)
    setSaved(false)
  }

  const save = async () => {
    if (!dirty) {
      setError('Поставьте подпись')
      return
    }
    setBusy(true)
    setError(null)
    const data = canvasRef.current!.toDataURL('image/png')
    const res = await signContractAction(bookingId, data, signerName)
    setBusy(false)
    if (res.ok) {
      setSaved(true)
      onSigned?.()
    } else {
      setError(res.error ?? 'Ошибка')
    }
  }

  return (
    <div>
      <canvas
        ref={canvasRef}
        width={440}
        height={140}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerLeave={up}
        style={{
          width: '100%',
          maxWidth: 440,
          height: 140,
          border: '1.5px dashed var(--av-hair-strong)',
          borderRadius: 12,
          background: 'var(--av-field)',
          touchAction: 'none',
          cursor: 'crosshair',
        }}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
        <button
          onClick={save}
          disabled={busy || saved}
          className="av-cta"
          style={{
            padding: '10px 18px',
            background: saved ? 'var(--av-success)' : 'var(--grad-coral)',
            color: '#fff',
            border: 'none',
            borderRadius: 'var(--r-btn)',
            font: '700 13px var(--f-ui)',
          }}
        >
          {saved ? '✓ Подписано' : busy ? '…' : 'Подписать договор'}
        </button>
        <button
          onClick={clear}
          style={{
            padding: '10px 16px',
            background: 'transparent',
            border: '1px solid var(--av-hair)',
            color: 'var(--av-muted)',
            borderRadius: 'var(--r-btn)',
            font: '600 13px var(--f-ui)',
          }}
        >
          Очистить
        </button>
        {error && <span style={{ font: '600 12px var(--f-ui)', color: 'var(--av-danger)' }}>{error}</span>}
      </div>
    </div>
  )
}
