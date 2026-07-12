'use client'

import { useEffect, useState } from 'react'

/** Same photo shape the car-card carousel uses (cover first). */
export interface GalleryPhoto {
  full: string
  thumb: string
}

/**
 * Compact photo gallery for the booking summary card: the selected photo on top,
 * with a thumbnail strip of the car's OTHER photos below (click to swap). Reuses
 * the existing photo system (the same {full,thumb} renditions served from
 * /uploads/cars). A single-photo car shows just the main image with no strip; a
 * car with no photos shows the gradient placeholder. Kept small so it never
 * dominates the summary.
 */
export default function SummaryGallery({ photos, label }: { photos: GalleryPhoto[]; label: string }) {
  const [i, setI] = useState(0)
  // reset the active photo if the car (photo set) changes
  useEffect(() => {
    setI(0)
  }, [photos.length])

  const active = photos.length > 0 ? photos[Math.min(i, photos.length - 1)] : null

  return (
    <div>
      <div
        style={{
          height: 132,
          background: 'linear-gradient(135deg,#DCF3F6,#B6E6EE)',
          backgroundImage: active ? `url(${active.full})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          font: '700 12px var(--f-mono)',
          color: 'rgba(12,59,69,.4)',
        }}
      >
        {!active && label}
      </div>

      {photos.length > 1 && (
        <div style={{ display: 'flex', gap: 6, padding: '8px 12px 0', overflowX: 'auto' }}>
          {photos.map((p, k) => {
            const on = k === i
            return (
              <button
                key={k}
                type="button"
                onClick={() => setI(k)}
                aria-label={`${label} — ${k + 1}`}
                aria-current={on ? 'true' : undefined}
                style={{
                  flexShrink: 0,
                  width: 50,
                  height: 38,
                  borderRadius: 8,
                  border: on ? '2px solid #0E7E90' : '1px solid rgba(20,153,174,.22)',
                  backgroundImage: `url(${p.thumb})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  cursor: 'pointer',
                  padding: 0,
                  opacity: on ? 1 : 0.78,
                  transition: 'opacity .15s ease',
                }}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
