'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useDict } from '../i18n/lang'
import type { CarView } from '../lib/view'

/**
 * CarDetailDrawer — a slide-in right drawer showing a single car's info (photo, specs,
 * what's-included, price, deposit, "Book this car"). Self-contained tokens/styles scoped to
 * `.cdd` so it drops onto any page. Driven by a `car` prop (null = closed); the last car is
 * kept during the close animation so the content slides out with the drawer.
 */
const dict = {
  en: { included: "What's included", km: (n: number | null) => `${n ?? 250} km/day included`, fuel: 'Full-to-full fuel policy', road: '24/7 roadside assistance', cancel: 'Free cancellation up to 48h', insur: 'Comprehensive insurance available', delivery: 'Airport, hotel or seaside delivery', deposit: 'Refundable deposit', book: 'Book this car', taxes: 'Taxes & basic cover included', perDay: '/day', close: 'Close' },
  ru: { included: 'Что входит', km: (n: number | null) => `${n ?? 250} км/день включено`, fuel: 'Топливо: полный → полный', road: 'Помощь на дороге 24/7', cancel: 'Бесплатная отмена за 48ч', insur: 'Доступна полная страховка', delivery: 'Подача в аэропорт, отель или к морю', deposit: 'Возвратный депозит', book: 'Забронировать это авто', taxes: 'Налоги и базовая страховка включены', perDay: '/день', close: 'Закрыть' },
  tr: { included: 'Neler dahil', km: (n: number | null) => `${n ?? 250} km/gün dahil`, fuel: 'Dolu-dolu yakıt politikası', road: '7/24 yol yardımı', cancel: '48 saate kadar ücretsiz iptal', insur: 'Kapsamlı sigorta mevcut', delivery: 'Havalimanı, otel veya sahile teslim', deposit: 'İade edilebilir depozito', book: 'Bu aracı kirala', taxes: 'Vergiler ve temel teminat dahil', perDay: '/gün', close: 'Kapat' },
  es: { included: 'Qué incluye', km: (n: number | null) => `${n ?? 250} km/día incluidos`, fuel: 'Combustible lleno-lleno', road: 'Asistencia en carretera 24/7', cancel: 'Cancelación gratis hasta 48h', insur: 'Seguro a todo riesgo disponible', delivery: 'Entrega en aeropuerto, hotel o playa', deposit: 'Depósito reembolsable', book: 'Reservar este coche', taxes: 'Impuestos y cobertura básica incluidos', perDay: '/día', close: 'Cerrar' },
  de: { included: 'Inbegriffen', km: (n: number | null) => `${n ?? 250} km/Tag inbegriffen`, fuel: 'Voll-zu-voll-Tankregelung', road: '24/7 Pannenhilfe', cancel: 'Kostenlose Stornierung bis 48h', insur: 'Vollkasko verfügbar', delivery: 'Lieferung: Flughafen, Hotel oder Strand', deposit: 'Erstattbare Kaution', book: 'Dieses Auto buchen', taxes: 'Steuern & Grunddeckung inbegriffen', perDay: '/Tag', close: 'Schließen' },
}

const CDD_CSS = `
.cdd{--c-ink:#0a2225;--c-muted:#5b7678;--c-muted2:#8aa2a3;--c-line:rgba(10,34,37,.10);--c-bg:#eef6f5;--c-surface:#fff;--c-teal:#0d9488;--c-teal7:#0f6d68;--c-tealsoft:rgba(13,148,136,.10);--c-accent:#fb6d4c;--c-accentStrong:#ef5c3a;--c-ok:#0f9d6f;--c-fd:'Space Grotesk',system-ui,sans-serif;--c-fu:'Manrope',system-ui,sans-serif;--c-fm:'JetBrains Mono',monospace}
.cdd-scrim{position:fixed;inset:0;z-index:200;background:rgba(4,20,23,.5);transition:opacity .32s}
.cdd-drawer{position:fixed;top:0;right:0;bottom:0;z-index:201;width:min(440px,100vw);display:flex;flex-direction:column;background:var(--c-bg);box-shadow:-24px 0 70px -24px rgba(6,33,38,.55);transition:transform .42s cubic-bezier(.16,.84,.34,1);will-change:transform}
.cdd-hero{position:relative;flex-shrink:0;height:230px;background:#0b2b30;overflow:hidden}
.cdd-hero img{width:100%;height:100%;object-fit:cover;display:block}
.cdd-hero::after{content:'';position:absolute;inset:0;background:linear-gradient(0deg,rgba(4,20,23,.7),transparent 46%)}
.cdd-x{position:absolute;top:14px;right:14px;z-index:2;width:38px;height:38px;border-radius:12px;border:none;background:rgba(4,20,23,.5);backdrop-filter:blur(6px);color:#fff;display:grid;place-items:center;cursor:pointer}
.cdd-chip{position:absolute;top:16px;left:16px;z-index:2;padding:6px 11px;border-radius:999px;background:rgba(4,20,23,.5);backdrop-filter:blur(6px);font:700 10px var(--c-fm);letter-spacing:.08em;text-transform:uppercase;color:#fff}
.cdd-title{position:absolute;left:18px;bottom:14px;z-index:2;margin:0;font:700 25px var(--c-fd);letter-spacing:-.01em;color:#fff;text-shadow:0 2px 12px rgba(0,0,0,.5)}
.cdd-body{flex:1;overflow-y:auto;padding:18px}
.cdd-specs{display:grid;grid-template-columns:repeat(4,1fr);gap:9px}
.cdd-spec{background:var(--c-surface);border:1px solid var(--c-line);border-radius:13px;padding:11px 6px;text-align:center}
.cdd-spec svg{display:block;margin:0 auto 5px}
.cdd-spec span{font:600 11px var(--c-fu);color:var(--c-ink)}
.cdd-lbl{font:600 10px var(--c-fm);letter-spacing:.14em;text-transform:uppercase;color:var(--c-muted);margin:20px 0 11px}
.cdd-incl{display:flex;flex-direction:column;gap:10px}
.cdd-incl li{display:flex;align-items:center;gap:10px;font:500 13.5px var(--c-fu);color:var(--c-ink);list-style:none}
.cdd-tick{width:22px;height:22px;flex-shrink:0;border-radius:7px;background:var(--c-tealsoft);display:grid;place-items:center}
.cdd-dep{margin-top:18px;background:var(--c-tealsoft);border:1px solid rgba(13,148,136,.2);border-radius:14px;padding:13px 15px;display:flex;align-items:baseline;justify-content:space-between;gap:10px}
.cdd-dep .k{font:700 10px var(--c-fm);letter-spacing:.1em;text-transform:uppercase;color:var(--c-teal7)}
.cdd-dep .v{font:800 18px var(--c-fd);color:var(--c-ink)}
.cdd-foot{flex-shrink:0;border-top:1px solid var(--c-line);background:var(--c-surface);padding:15px 18px;display:flex;align-items:center;gap:12px}
.cdd-price b{font:800 24px var(--c-fd);color:var(--c-ink)}
.cdd-price span{font:500 12px var(--c-fu);color:var(--c-muted)}
.cdd-price small{display:block;font:500 10.5px var(--c-fu);color:var(--c-muted2)}
.cdd-cta{margin-left:auto;flex-shrink:0;display:inline-flex;align-items:center;gap:8px;padding:14px 20px;border-radius:14px;background:var(--c-accent);color:#fff;font:700 14.5px var(--c-fd);text-decoration:none;box-shadow:0 12px 26px -12px var(--c-accent);transition:background .16s,transform .16s}
.cdd-cta:hover{background:var(--c-accentStrong);transform:translateY(-2px)}
`

function SpecIcon({ kind }: { kind: 'gear' | 'fuel' | 'seat' | 'ac' }) {
  const p =
    kind === 'gear' ? <><circle cx="12" cy="12" r="3" /><path d="M12 2v4M12 18v4M2 12h4M18 12h4" /></> :
    kind === 'fuel' ? <><line x1="3" x2="15" y1="22" y2="22" /><line x1="4" x2="14" y1="9" y2="9" /><path d="M14 22V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v18" /><path d="M14 13h2a2 2 0 0 1 2 2v2a2 2 0 0 0 2 2 2 2 0 0 0 2-2V9.83a2 2 0 0 0-.59-1.42L18 5" /></> :
    kind === 'seat' ? <><path d="M19 9V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v3" /><path d="M3 16a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2H3Z" /><path d="M5 18v2M19 18v2" /></> :
    <><path d="M12 2v20M2 12h20M5 5l14 14M19 5 5 19" /></>
  return <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="var(--c-teal)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{p}</svg>
}

export default function CarDetailDrawer({ car, onClose }: { car: CarView | null; onClose: () => void }) {
  const t = useDict(dict)
  // Keep the last car during the slide-out so content doesn't vanish mid-animation.
  const [shown, setShown] = useState<CarView | null>(car)
  useEffect(() => { if (car) setShown(car) }, [car])
  // Esc to close + lock body scroll while open.
  useEffect(() => {
    if (!car) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [car, onClose])

  const open = !!car
  const c = shown
  const img = c ? (c.photos[0]?.full ?? c.coverUrl ?? `/api/car-photo/${c.slug}`) : null

  return (
    <div className="cdd" aria-hidden={!open}>
      <style dangerouslySetInnerHTML={{ __html: CDD_CSS }} />
      <div className="cdd-scrim" onClick={onClose} style={{ opacity: open ? 1 : 0, pointerEvents: open ? 'auto' : 'none' }} />
      <div className="cdd-drawer" role="dialog" aria-modal="true" style={{ transform: open ? 'translateX(0)' : 'translateX(101%)', pointerEvents: open ? 'auto' : 'none' }}>
        {c && (
          <>
            <div className="cdd-hero">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {img && <img src={img} alt={`${c.brand} ${c.model}`} />}
              <span className="cdd-chip">{c.clsLabel} · {c.year}</span>
              <button type="button" className="cdd-x" aria-label={t.close} onClick={onClose}>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
              </button>
              <h2 className="cdd-title">{c.brand} {c.model}</h2>
            </div>

            <div className="cdd-body">
              <div className="cdd-specs">
                <div className="cdd-spec"><SpecIcon kind="gear" /><span>{c.gearboxLabel}</span></div>
                <div className="cdd-spec"><SpecIcon kind="fuel" /><span>{c.fuelLabel}</span></div>
                <div className="cdd-spec"><SpecIcon kind="seat" /><span>{c.seats}</span></div>
                <div className="cdd-spec"><SpecIcon kind="ac" /><span>{c.airConditioning ? 'A/C' : '—'}</span></div>
              </div>

              <div className="cdd-lbl">{t.included}</div>
              <ul className="cdd-incl" style={{ margin: 0, padding: 0 }}>
                {[t.km(c.mileageLimitPerDay), t.fuel, t.road, t.cancel, t.insur, t.delivery].map((it) => (
                  <li key={it}>
                    <span className="cdd-tick"><svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="var(--c-teal7)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg></span>
                    {it}
                  </li>
                ))}
              </ul>

              <div className="cdd-dep">
                <span className="k">{t.deposit}</span>
                <span className="v">€{c.deposit}</span>
              </div>
            </div>

            <div className="cdd-foot">
              <div className="cdd-price">
                <div><b>€{c.pricePerDay}</b><span>{t.perDay}</span></div>
                <small>{t.taxes}</small>
              </div>
              <Link href={`/booking?car=${encodeURIComponent(c.slug)}`} className="cdd-cta">
                {t.book}
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
