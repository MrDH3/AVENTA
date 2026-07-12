'use client'

/** Load an external map SDK <script> once (cached by key). Used by the Google/Yandex map adapters. */
export function loadMapScript(src: string, marker: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[data-map="${marker}"]`)
    if (existing) {
      if (existing.dataset.loaded === '1') return resolve()
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', () => reject(new Error(`${marker} failed`)))
      return
    }
    const s = document.createElement('script')
    s.src = src
    s.async = true
    s.dataset.map = marker
    s.onload = () => { s.dataset.loaded = '1'; resolve() }
    s.onerror = () => reject(new Error(`${marker} failed`))
    document.head.appendChild(s)
  })
}

export function round6(n: number): number {
  return Math.round(n * 1e6) / 1e6
}
