'use client'

import { useEffect, useRef, useState } from 'react'

interface ImageSlotProps {
  id: string
  label?: string
  height?: number | string
  radius?: number
  /** Decorative gradient placeholder shown when empty. */
  placeholderBg?: string
  caption?: string
  compact?: boolean
}

/**
 * Drag-and-drop photo placeholder. Click or drop an image; the data URL is
 * persisted to localStorage under a stable id so fleet photos survive reloads.
 * Mirrors the design's <image-slot> behaviour.
 */
export default function ImageSlot({
  id,
  label = 'Перетащите фото',
  height = 178,
  radius = 0,
  placeholderBg = 'linear-gradient(135deg,#DCF3F6,#B6E6EE)',
  caption,
  compact = false,
}: ImageSlotProps) {
  const key = `aventa_img_${id}`
  const [src, setSrc] = useState<string | null>(null)
  const [over, setOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    try {
      const v = localStorage.getItem(key)
      if (v) setSrc(v)
    } catch {
      /* ignore */
    }
  }, [key])

  const accept = (file?: File) => {
    if (!file || !file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = () => {
      const data = String(reader.result)
      setSrc(data)
      try {
        localStorage.setItem(key, data)
      } catch {
        /* quota — keep in-memory only */
      }
    }
    reader.readAsDataURL(file)
  }

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault()
        setOver(true)
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setOver(false)
        accept(e.dataTransfer.files?.[0])
      }}
      role="button"
      tabIndex={0}
      style={{
        position: 'relative',
        height,
        borderRadius: radius,
        background: src ? `center/cover no-repeat url(${src})` : placeholderBg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        overflow: 'hidden',
        outline: over ? '2px dashed var(--av-coral)' : 'none',
        outlineOffset: -6,
        transition: 'outline .15s ease',
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => accept(e.target.files?.[0] ?? undefined)}
      />
      {!src && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 7,
            color: 'rgba(12,59,69,.42)',
            textAlign: 'center',
            padding: 8,
          }}
        >
          <svg
            width={compact ? 18 : 24}
            height={compact ? 18 : 24}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 7h3l1.5-2h7L17 7h3a1 1 0 011 1v10a1 1 0 01-1 1H4a1 1 0 01-1-1V8a1 1 0 011-1z" />
            <circle cx="12" cy="13" r="3.2" />
          </svg>
          {!compact && (
            <span style={{ font: "700 11px var(--f-ui)" }}>{label}</span>
          )}
        </div>
      )}
      {caption && !src && (
        <span
          style={{
            position: 'absolute',
            bottom: 8,
            left: 0,
            right: 0,
            textAlign: 'center',
            font: "700 11px var(--f-mono)",
            color: 'rgba(12,59,69,.4)',
          }}
        >
          {caption}
        </span>
      )}
    </div>
  )
}
