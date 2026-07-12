'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import LanguageDropdown from './LanguageDropdown'
import type { CarView } from '../lib/view'

/* ════════════════════════════════════════════════════════════════════════════
   AVENTA — shared "redesign" (.rd) design kit.
   The landing (Home.tsx) and the catalogue (Catalog.tsx) both render inside a
   `.rd` wrapper and share this system: scoped tokens, icons, the real-photo fleet
   card (3D tilt + solid availability pill + bottom-pinned price/CTA), a solid nav,
   and the full stylesheet. Keeping it here means a card/token tweak lands on both
   pages at once. Nothing here leaks outside `.rd`.
   ═══════════════════════════════════════════════════════════════════════════ */

/** Lucide-style stroke icon. */
export function Ic({ d, s = 20, c = 'currentColor' }: { d: React.ReactNode; s?: number; c?: string }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{d}</svg>
}
export const I = {
  transmission: <><path d="M6 4v16M18 4v16M6 12h12M12 4v8" /><circle cx="6" cy="4" r="1.4" /><circle cx="18" cy="4" r="1.4" /><circle cx="6" cy="20" r="1.4" /></>,
  fuel: <><path d="M4 20V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v14M3 20h13" /><path d="M14 9h3l2 2v6a2 2 0 0 1-4 0v-3h-1" /></>,
  seats: <><path d="M4 18v-3a3 3 0 0 1 3-3h4a3 3 0 0 1 3 3v3M6 12V7a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v5M4 18h11M18 8v10M15 18h5" /></>,
  ac: <><path d="M12 3v18M3 8l18 8M21 8 3 16M6 4l1.5 2.6M18 20l-1.5-2.6M18 4l-1.5 2.6M6 20l1.5-2.6" /></>,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  check: <path d="M5 12l4 4 10-10" />,
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>,
  fileCheck: <><path d="M14 3v5h5M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-5-5Z" /><path d="m9 15 2 2 4-4" /></>,
  truck: <><path d="M3 7h11v9H3zM14 10h4l3 3v3h-7z" /><circle cx="7.5" cy="18" r="1.6" /><circle cx="17.5" cy="18" r="1.6" /></>,
  flag: <><path d="M5 21V4M5 4h11l-2 4 2 4H5" /></>,
  pin: <><path d="M12 21s-7-5.2-7-10a7 7 0 0 1 14 0c0 4.8-7 10-7 10Z" /><circle cx="12" cy="11" r="2.5" /></>,
  tag: <><path d="M3 12l9-9h6v6l-9 9z" /><circle cx="15" cy="9" r="1.4" /></>,
  sparkles: <><path d="M12 3l1.8 4.6L18 9.4l-4.2 1.8L12 16l-1.8-4.8L6 9.4l4.2-1.8z" /><path d="M18 15l.8 2 .2.8 2 .2-2 .8-.2 2-.8-2-2-.2 2-.8z" /></>,
  headphones: <><path d="M4 14v-2a8 8 0 0 1 16 0v2" /><path d="M4 14a2 2 0 0 1 2 2v2a2 2 0 0 1-4 0v-2a2 2 0 0 1 2-2ZM20 14a2 2 0 0 0-2 2v2a2 2 0 0 0 4 0v-2a2 2 0 0 0-2-2Z" /></>,
  shield: <><path d="M12 3l7 3v6c0 5-3.5 8-7 9-3.5-1-7-4-7-9V6z" /><path d="m9 12 2 2 4-4" /></>,
  phone: <><path d="M22 16.9v2.1a2 2 0 0 1-2.2 2 19 19 0 0 1-8.3-3 19 19 0 0 1-6-6 19 19 0 0 1-3-8.3A2 2 0 0 1 4.1 2h2.1a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.6a2 2 0 0 1-.5 2.1L7.6 9.4a16 16 0 0 0 6 6l1-1a2 2 0 0 1 2.1-.4c.8.3 1.7.6 2.6.7a2 2 0 0 1 1.7 2Z" /></>,
  globe: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  down: <path d="M12 5v14M6 13l6 6 6-6" />,
}

/** Minimal string shape a fleet card needs — both dicts satisfy it structurally. */
export type RdCardT = {
  chipInstant: string; chipCash: string; chipNoCard: string
  perDay: string; deposit: string; bookNow: string; checkDates: string
}

/* ═══════════════════════════ Fleet card (3D tilt, real photo) ═══════════════ */
export function RdCarCard({ car, t, motion, onOpen }: { car: CarView; t: RdCardT; motion: boolean; onOpen?: () => void }) {
  const photo = car.photos[0]?.full ?? car.coverUrl ?? null
  const glare = useRef<HTMLDivElement>(null)
  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!motion) return
    const el = e.currentTarget, r = el.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height
    el.style.transform = `perspective(950px) rotateX(${(0.5 - py) * 7}deg) rotateY(${(px - 0.5) * 9}deg) translateY(-8px)`
    const img = el.querySelector('img') as HTMLImageElement | null
    if (img) img.style.transform = 'scale(1.08)'
    if (glare.current) { glare.current.style.opacity = '1'; glare.current.style.background = `radial-gradient(220px circle at ${px * 100}% ${py * 100}%, rgba(255,255,255,.3), transparent 60%)` }
  }
  const onLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = e.currentTarget
    el.style.transform = ''
    const img = el.querySelector('img') as HTMLImageElement | null
    if (img) img.style.transform = ''
    if (glare.current) glare.current.style.opacity = '0'
  }
  return (
    <article className="rd-car" onMouseMove={onMove} onMouseLeave={onLeave} onClick={onOpen} style={onOpen ? { cursor: 'pointer' } : undefined}>
      <div className="rd-car-img">
        {photo
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={photo} alt={`${car.brand} ${car.model}`} loading="lazy" />
          : <div className="rd-car-ph" aria-hidden />}
        <div ref={glare} className="rd-glare" aria-hidden />
        <span className="rd-badge">{car.clsLabel}</span>
        <span className={`rd-avail ${car.available ? 'ok' : 'busy'}`}><i />{car.statusText}</span>
        <span className="rd-year">{car.year}</span>
      </div>
      <div className="rd-car-body">
        <h3>{car.brand} {car.model}</h3>
        <div className="rd-specs">
          <div><Ic d={I.transmission} s={17} c="var(--teal)" /><span>{car.gearboxLabel}</span></div>
          <div><Ic d={I.fuel} s={17} c="var(--teal)" /><span>{car.fuelLabel}</span></div>
          <div><Ic d={I.seats} s={17} c="var(--teal)" /><span>{car.seats}</span></div>
          <div><Ic d={I.ac} s={17} c="var(--teal)" /><span>{car.airConditioning ? 'A/C' : '—'}</span></div>
        </div>
        <div className="rd-chips">
          {car.available && <span><Ic d={I.check} s={13} c="var(--teal-700)" />{t.chipInstant}</span>}
          <span><Ic d={I.check} s={13} c="var(--teal-700)" />{t.chipCash}</span>
          <span><Ic d={I.check} s={13} c="var(--teal-700)" />{t.chipNoCard}</span>
        </div>
        <div className="rd-car-foot">
          <div className="rd-price">
            <b>€{car.pricePerDay}</b><span>{t.perDay}</span>
            <div className="rd-dep">{t.deposit} €{car.deposit}{car.mileageLimitPerDay ? ` · ${car.mileageLimitPerDay} km/day` : ''}</div>
          </div>
          {car.available
            ? <Link href={`/booking?car=${encodeURIComponent(car.slug)}`} onClick={(e) => e.stopPropagation()} className="rd-btn rd-btn-coral rd-btn-sm">{t.bookNow}<Ic d={I.arrow} s={16} c="#fff" /></Link>
            : <Link href={`/booking?car=${encodeURIComponent(car.slug)}`} onClick={(e) => e.stopPropagation()} className="rd-btn rd-btn-ghost-coral rd-btn-sm">{t.checkDates}</Link>}
        </div>
      </div>
    </article>
  )
}

/* ═══════════════════════════ Solid nav (interior pages) ══════════════════════
   Always-solid variant used on pages without a dark hero (e.g. the catalogue).
   The landing keeps its own transparent-over-hero nav. */
export function RdNav({ links, cta }: {
  links: { href: string; label: string }[]
  cta: { href: string; label: string }
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  return (
    <header className="rd-nav solid">
      <div className="rd-nav-in">
        <Link href="/" className="rd-logo"><span className="rd-mark">A</span><b>AVENTA</b></Link>
        <nav className="rd-links">{links.map((l) => <Link key={l.href} href={l.href}>{l.label}</Link>)}</nav>
        <div className="rd-nav-right">
          <span className="rd-lang"><LanguageDropdown variant="bar" /></span>
          <Link href={cta.href} className="rd-btn rd-btn-coral rd-btn-sm">{cta.label}<Ic d={I.arrow} s={16} c="#fff" /></Link>
          <button className="rd-burger" aria-label="Menu" onClick={() => setMenuOpen((v) => !v)}><Ic d={I.menu} s={22} /></button>
        </div>
      </div>
      {menuOpen && (
        <div className="rd-menu">
          {links.map((l) => <Link key={l.href} href={l.href} onClick={() => setMenuOpen(false)}>{l.label}</Link>)}
          <div className="rd-menu-lang"><LanguageDropdown variant="bar" /></div>
          <Link href={cta.href} className="rd-btn rd-btn-coral" onClick={() => setMenuOpen(false)}>{cta.label}</Link>
        </div>
      )}
    </header>
  )
}

/* ═══════════════════════════════ styles (scoped .rd) ═══════════════════════ */
export const RD_CSS = `
.rd{--ink:#0a2225;--muted:#5b7678;--muted-2:#8aa2a3;--bg:#eef6f5;--bg-2:#e5f1ef;--surface:#fff;--line:rgba(10,34,37,.09);
  --accent:#fb6d4c;--accent-strong:#ef5c3a;--accent-soft:rgba(251,109,76,.12);--teal:#0d9488;--teal-700:#0f6d68;--teal-deep:#0b4f52;--teal-soft:rgba(13,148,136,.1);
  --fd:'Space Grotesk',system-ui,sans-serif;--fu:'Manrope',system-ui,sans-serif;--fm:'JetBrains Mono',ui-monospace,monospace;
  font-family:var(--fu);color:var(--ink);background:var(--bg);scroll-behavior:smooth;position:relative;overflow-x:hidden}
.rd *{box-sizing:border-box}
.rd h1,.rd h2,.rd h3{font-family:var(--fd);margin:0}
.rd a{color:inherit;text-decoration:none}
.rd .rd-wrap{max-width:1240px;margin:0 auto;padding:0 24px}
.rd .rd-kick{font:600 12px/1 var(--fm);letter-spacing:.22em;text-transform:uppercase;color:var(--accent)}
.rd section[id]{scroll-margin-top:80px}
.rd .rd-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;border:none;cursor:pointer;font:700 15px var(--fu);border-radius:13px;padding:14px 22px;transition:transform .16s,box-shadow .2s,background .16s,color .16s}
.rd .rd-btn-sm{padding:10px 16px;font-size:14px;border-radius:11px}
.rd .rd-btn-coral{background:var(--accent);color:#fff;box-shadow:0 14px 30px -12px var(--accent)}
.rd .rd-btn-coral:hover{background:var(--accent-strong);transform:translateY(-2px);box-shadow:0 18px 36px -12px var(--accent)}
.rd .rd-btn-ghost{background:transparent;color:#fff;border:1.5px solid rgba(255,255,255,.4)} .rd .rd-btn-ghost:hover{background:rgba(255,255,255,.1)}
.rd .rd-btn-ghost-ink{background:transparent;color:var(--ink);border:1.5px solid var(--line)} .rd .rd-btn-ghost-ink:hover{background:rgba(10,34,37,.04)}
.rd .rd-btn-ghost-coral{background:transparent;color:var(--accent);border:1.5px solid var(--accent-soft)} .rd .rd-btn-ghost-coral:hover{background:var(--accent-soft)}

/* reveal */
.rd .rv{opacity:0;transform:translateY(38px);transition:opacity .82s cubic-bezier(.16,.84,.34,1),transform .82s cubic-bezier(.16,.84,.34,1)}
.rd .rv.in{opacity:1;transform:none}
.rd .rv-l{transform:translateX(-42px)} .rd .rv-r{transform:translateX(42px)}
@media(prefers-reduced-motion:reduce){.rd .rv{opacity:1!important;transform:none!important;transition:none} .rd .rd-float,.rd .rd-hero-chip{animation:none!important}}

/* progress */
.rd .rd-progress{position:fixed;top:0;left:0;right:0;height:3px;z-index:80;background:transparent;pointer-events:none}
.rd .rd-progress>div{height:100%;width:0;background:linear-gradient(90deg,var(--accent),var(--teal))}

/* nav */
.rd .rd-nav{position:fixed;top:0;left:0;right:0;z-index:60;transition:background .25s,box-shadow .25s,border-color .25s}
.rd .rd-nav.solid{background:rgba(255,255,255,.86);backdrop-filter:blur(16px);border-bottom:1px solid var(--line);box-shadow:0 8px 30px -18px rgba(6,33,38,.45)}
.rd .rd-nav-in{max-width:1240px;margin:0 auto;padding:14px 24px;display:flex;align-items:center;gap:20px}
.rd .rd-logo{display:flex;align-items:center;gap:11px;color:#fff}.rd-nav.solid .rd-logo{color:var(--ink)}
.rd .rd-mark{width:36px;height:36px;border-radius:11px;background:var(--accent);color:#fff;display:grid;place-items:center;font:700 20px var(--fd)}
.rd .rd-logo b{font:700 21px var(--fd);letter-spacing:.16em}
.rd .rd-links{display:flex;gap:26px;margin-left:8px}
.rd .rd-links a{font:600 15px var(--fu);color:rgba(255,255,255,.9)}.rd-nav.solid .rd-links a{color:var(--ink)}.rd .rd-links a:hover{opacity:.65}
.rd .rd-nav-right{margin-left:auto;display:flex;align-items:center;gap:12px}
.rd .rd-lang{display:inline-flex}
.rd .rd-nav:not(.solid) .rd-btn-ghost{color:#fff;border-color:rgba(255,255,255,.4)}
.rd .rd-nav.solid .rd-btn-ghost{color:var(--ink);border-color:var(--line)}
.rd .rd-burger{display:none;width:44px;height:44px;border-radius:11px;border:1.5px solid rgba(255,255,255,.4);background:transparent;color:#fff;align-items:center;justify-content:center;cursor:pointer}
.rd-nav.solid .rd-burger{color:var(--ink);border-color:var(--line)}
.rd .rd-menu{margin:0 24px;background:#fff;border-radius:18px;box-shadow:0 20px 50px -24px rgba(6,33,38,.5);padding:12px;display:flex;flex-direction:column;gap:4px}
.rd .rd-menu a{padding:12px 14px;font:600 15px var(--fu);color:var(--ink);border-radius:10px}.rd .rd-menu a:hover{background:var(--bg)}
.rd .rd-menu .rd-btn{margin-top:6px}
.rd .rd-menu-lang{padding:8px 6px 4px}
@media(max-width:900px){.rd .rd-links,.rd .rd-nav-right .rd-btn,.rd .rd-lang{display:none}.rd .rd-burger{display:inline-flex}}

/* hero */
.rd .rd-hero{position:relative;min-height:100vh;display:flex;flex-direction:column;justify-content:center;color:#fff;overflow:hidden;background:#04181b;padding:120px 0 60px}
.rd .rd-hero-bg{position:absolute;inset:-10% 0 0 0;z-index:0;background:radial-gradient(130% 120% at 72% 16%,#0f7173 0%,#0a4247 42%,#05191d 100%),repeating-linear-gradient(135deg,rgba(255,255,255,.03) 0 1px,transparent 1px 10px);will-change:transform}
.rd .rd-hero-scrim{position:absolute;inset:0;z-index:1;background:linear-gradient(90deg,rgba(3,18,21,.92) 0%,rgba(3,18,21,.55) 42%,rgba(3,18,21,0) 72%),linear-gradient(0deg,rgba(3,18,21,.6),transparent 40%)}
.rd .rd-orb{position:absolute;border-radius:50%;filter:blur(40px);z-index:1;pointer-events:none}
.rd .rd-orb-1{top:-60px;right:8%;width:280px;height:280px;background:radial-gradient(circle,rgba(19,170,160,.5),transparent 70%);animation:rd-drift 14s ease-in-out infinite}
.rd .rd-orb-2{bottom:-40px;left:4%;width:240px;height:240px;background:radial-gradient(circle,rgba(251,109,76,.4),transparent 70%);animation:rd-drift 18s ease-in-out infinite reverse}
.rd .rd-hero-in{position:relative;z-index:4;display:grid;grid-template-columns:1fr 1.2fr;gap:30px;align-items:center;width:100%}
.rd .rd-hero-copy{max-width:660px}
.rd .rd-eyebrow{display:inline-flex;align-items:center;gap:9px;font:600 12px var(--fm);letter-spacing:.22em;color:#67e3d3}
.rd .rd-eyebrow .dot{width:7px;height:7px;border-radius:50%;background:var(--accent)}
.rd .rd-hero h1{margin:18px 0 0;font:700 clamp(44px,6.4vw,86px)/1.02 var(--fd);letter-spacing:-.03em;color:#fff;text-wrap:balance}
.rd .rd-hero h1 em{font-style:normal;color:var(--accent)}
.rd .rd-hero-sub{margin:18px 0 0;font:500 clamp(16px,1.4vw,20px)/1.55 var(--fu);color:rgba(255,255,255,.82);max-width:44ch}
.rd .rd-form{margin:26px 0 0;background:rgba(255,255,255,.95);backdrop-filter:blur(18px);border:1px solid rgba(255,255,255,.7);border-radius:24px;padding:22px;box-shadow:0 34px 80px -26px rgba(0,0,0,.6);max-width:560px}
.rd .rd-form-row{display:flex;gap:10px}.rd .rd-form label{flex:1;display:block;background:var(--bg);border:1px solid var(--line);border-radius:13px;padding:10px 14px;cursor:pointer}
.rd .rd-form label>span{display:block;font:600 11px var(--fm);letter-spacing:.16em;color:var(--muted-2);margin-bottom:5px}
.rd .rd-form input,.rd .rd-form select{width:100%;border:none;background:transparent;font:700 15px var(--fu);color:var(--ink);outline:none;padding:0;cursor:pointer}
.rd .rd-form-sel{display:block;margin-top:10px}
.rd .rd-form-btn{width:100%;margin-top:12px}
.rd .rd-form-note{margin-top:12px;display:flex;align-items:center;gap:8px;font:600 12.5px var(--fu);color:var(--muted)}.rd .rd-form-note.err{color:var(--accent-strong)}
.rd .rd-trust{margin-top:22px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;font:500 11.5px var(--fm);letter-spacing:.06em;color:rgba(255,255,255,.7)}
.rd .rd-trust i{width:4px;height:4px;border-radius:50%;background:var(--accent);display:inline-block}
.rd .rd-hero-photo{position:relative;display:flex;justify-content:center;align-items:center}
.rd .rd-hero-photo img{width:100%;max-width:760px;height:auto;display:block;filter:drop-shadow(0 46px 62px rgba(0,0,0,.55))}
.rd .rd-float{animation:rd-float 6s ease-in-out infinite}
.rd .rd-hero-chip{position:absolute;left:1%;bottom:7%;background:rgba(4,24,27,.62);backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,.2);border-radius:16px;padding:11px 16px;font:600 13px var(--fu);color:#fff;box-shadow:0 22px 46px -18px rgba(0,0,0,.75);animation:rd-float 6s ease-in-out infinite}
.rd .rd-hero-chip b{font:700 14px var(--fd);color:#fff}
.rd .rd-scroll-cue{position:absolute;bottom:22px;left:50%;transform:translateX(-50%);z-index:4;display:flex;flex-direction:column;align-items:center;gap:6px;color:rgba(255,255,255,.7);font:600 10px var(--fm);letter-spacing:.22em}
.rd .rd-scroll-cue svg{animation:rd-bob 1.8s ease-in-out infinite}

/* sections */
.rd .rd-sec{padding:clamp(72px,9vh,120px) 0;background:var(--bg)}
.rd .rd-sec-b{background:var(--bg-2)}
.rd .rd-head{max-width:640px;margin-bottom:38px}
.rd .rd-head h2{margin:12px 0 0;font:700 clamp(30px,4vw,50px)/1.06 var(--fd);letter-spacing:-.02em;color:var(--ink);text-wrap:balance}
.rd .rd-head p{margin:12px 0 0;font:400 clamp(15px,1.2vw,17px)/1.6 var(--fu);color:var(--muted)}

/* search msg */
.rd .rd-searchmsg{display:flex;align-items:center;gap:14px;flex-wrap:wrap;margin:0 0 22px;padding:12px 16px;border-radius:14px;background:rgba(16,185,129,.14);border:1px solid rgba(16,185,129,.3);font:700 13px var(--fu);color:#0f6d68}
.rd .rd-searchmsg.warn{background:rgba(245,158,11,.14);border-color:rgba(245,158,11,.35);color:#9a6b12}
.rd .rd-searchmsg button{margin-left:auto;background:none;border:none;cursor:pointer;font:700 13px var(--fu);color:var(--teal)}

/* fleet */
.rd .rd-fleet{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(330px,100%),1fr));gap:26px}
.rd .rd-car{background:var(--surface);border-radius:24px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 1px 2px rgba(6,33,38,.04),0 18px 40px -28px rgba(6,33,38,.4);transition:transform .4s cubic-bezier(.16,.84,.34,1),box-shadow .3s;transform-style:preserve-3d;will-change:transform}
.rd .rd-car:hover{box-shadow:0 34px 64px -26px rgba(6,33,38,.5)}
.rd .rd-car-img{position:relative;height:212px;overflow:hidden;background:linear-gradient(135deg,#0b4f52,#0a3438)}
.rd .rd-car-img img{width:100%;height:100%;object-fit:cover;transition:transform .5s cubic-bezier(.16,.84,.34,1)}
.rd .rd-car-ph{position:absolute;inset:0;background:linear-gradient(135deg,#0b4f52,#0a3438),repeating-linear-gradient(135deg,rgba(255,255,255,.04) 0 1px,transparent 1px 10px)}
.rd .rd-glare{position:absolute;inset:0;opacity:0;transition:opacity .3s;pointer-events:none;mix-blend-mode:overlay}
.rd .rd-badge{position:absolute;top:12px;left:12px;font:600 10px var(--fm);letter-spacing:.1em;text-transform:uppercase;background:rgba(4,24,27,.68);backdrop-filter:blur(4px);color:#fff;padding:6px 10px;border-radius:999px}
.rd .rd-avail{position:absolute;top:12px;right:12px;display:inline-flex;align-items:center;gap:6px;font:700 11.5px var(--fu);letter-spacing:.01em;padding:6px 11px;border-radius:999px;box-shadow:0 8px 20px -8px rgba(6,33,38,.6);max-width:72%;white-space:nowrap}
.rd .rd-avail i{width:6px;height:6px;border-radius:50%;flex-shrink:0}
.rd .rd-avail.ok{background:#10b981;border:1px solid rgba(255,255,255,.55);color:#fff}.rd .rd-avail.ok i{background:#fff;box-shadow:0 0 0 3px rgba(255,255,255,.3)}
.rd .rd-avail.busy{background:#ea580c;border:1px solid rgba(255,255,255,.5);color:#fff}.rd .rd-avail.busy i{background:#fff}
.rd .rd-year{position:absolute;bottom:12px;right:14px;font:700 14px var(--fd);color:#fff;text-shadow:0 2px 8px rgba(0,0,0,.4)}
.rd .rd-car-body{padding:20px;display:flex;flex-direction:column;flex:1}
.rd .rd-car-body h3{font:700 21px var(--fd);letter-spacing:-.01em}
.rd .rd-specs{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:14px 0;padding:12px 0;border-top:1px solid var(--line);border-bottom:1px solid var(--line)}
.rd .rd-specs>div{display:flex;flex-direction:column;align-items:center;gap:5px;text-align:center}
.rd .rd-specs span{font:500 11.5px var(--fu);color:var(--muted)}
.rd .rd-chips{display:flex;flex-wrap:wrap;gap:7px}
.rd .rd-chips span{display:inline-flex;align-items:center;gap:5px;font:600 11.5px var(--fu);color:var(--teal-700);background:var(--teal-soft);padding:5px 10px;border-radius:999px}
.rd .rd-car-foot{display:flex;align-items:flex-end;justify-content:space-between;gap:12px;margin-top:auto;padding-top:16px;border-top:1px solid var(--line)}
.rd .rd-price b{font:700 27px var(--fd);letter-spacing:-.01em}.rd .rd-price span{font:600 14px var(--fu);color:var(--muted)}
.rd .rd-dep{font:500 11px var(--fm);letter-spacing:.02em;color:var(--muted-2);margin-top:3px}

/* steps */
.rd .rd-steps{display:grid;grid-template-columns:repeat(4,1fr);gap:20px}
.rd .rd-step{position:relative;background:var(--surface);border-radius:22px;padding:30px 26px;overflow:hidden;transition:transform .25s,box-shadow .25s}
.rd .rd-step:hover{transform:translateY(-7px);box-shadow:0 26px 52px -30px rgba(6,33,38,.4)}
.rd .rd-step-n{position:absolute;top:8px;right:18px;font:700 92px var(--fd);color:var(--accent-soft);line-height:1}
.rd .rd-step-ic{position:relative;width:54px;height:54px;border-radius:15px;background:var(--teal-soft);display:grid;place-items:center;margin-bottom:16px}
.rd .rd-step h3{position:relative;font:600 19px var(--fd)}
.rd .rd-step p{position:relative;margin:8px 0 0;font:400 14px/1.55 var(--fu);color:var(--muted)}

/* bento */
.rd .rd-bento{display:grid;grid-template-columns:repeat(4,1fr);gap:20px}
.rd .rd-tile{background:var(--surface);border-radius:24px;padding:26px;transition:transform .25s,box-shadow .25s}
.rd .rd-tile:not(.rd-tile-dark):not(.rd-tile-stat):hover{transform:translateY(-6px);box-shadow:0 26px 52px -30px rgba(6,33,38,.4)}
.rd .span2{grid-column:span 2}
.rd .rd-tile h3{font:600 20px var(--fd);margin-bottom:8px}
.rd .rd-tile p{font:400 14px/1.55 var(--fu);color:var(--muted);margin:0}
.rd .rd-tile-ic{width:48px;height:48px;border-radius:14px;background:var(--teal-soft);display:grid;place-items:center;margin-bottom:14px}
.rd .rd-tile-ic.soft{background:var(--accent-soft)} .rd .rd-tile-ic.dark{background:rgba(103,227,211,.14)}
.rd .rd-tile-dark{background:linear-gradient(150deg,#0a3238,#062126);color:#fff;position:relative;overflow:hidden}
.rd .rd-tile-dark h3{color:#fff}.rd .rd-tile-dark p{color:rgba(214,255,238,.72)}
.rd .rd-tile-est{margin-top:18px;font:600 11px var(--fm);letter-spacing:.14em;color:#67e3d3}
.rd .rd-tile-stat{background:linear-gradient(140deg,var(--accent),var(--accent-strong));color:#fff;display:flex;align-items:center;gap:24px}
.rd .rd-tile-stat b{font:700 clamp(34px,4vw,48px) var(--fd);display:block}.rd .rd-tile-stat span{font:600 13px var(--fu);opacity:.92}
.rd .rd-tile-stat>i{width:1px;height:56px;background:rgba(255,255,255,.35)}

/* insurance */
.rd .rd-ins{position:relative;border-radius:32px;padding:clamp(34px,5vw,60px);overflow:hidden;background:linear-gradient(135deg,#0b5457 0%,#0d9488 55%,#13aaa0 100%);color:#fff;box-shadow:0 30px 70px -32px rgba(11,84,87,.7)}
.rd .rd-ins-glow{position:absolute;top:-60px;right:-40px;width:220px;height:220px;border-radius:50%;background:radial-gradient(circle,rgba(245,197,66,.55),transparent 70%);animation:rd-pulse 5s ease-in-out infinite}
.rd .rd-ins-in{position:relative;z-index:2;max-width:760px}
.rd .rd-ins h2{margin:12px 0 0;font:700 clamp(26px,3.4vw,40px)/1.08 var(--fd);letter-spacing:-.02em;color:#fff;text-wrap:balance}
.rd .rd-ins p{margin:16px 0 0;font:400 15.5px/1.7 var(--fu);color:rgba(255,255,255,.92)}
.rd .rd-ins-chips{margin-top:24px;display:flex;flex-wrap:wrap;gap:10px}
.rd .rd-ins-chips span{display:inline-flex;align-items:center;gap:7px;padding:10px 16px;border-radius:999px;background:rgba(255,255,255,.16);border:1px solid rgba(255,255,255,.28);font:700 13px var(--fu);color:#fff}

/* about */
.rd .rd-about{display:grid;grid-template-columns:1fr 1.1fr;gap:44px;align-items:center}
.rd .rd-about-copy h2{margin:12px 0 0;font:700 clamp(28px,3.6vw,44px)/1.08 var(--fd);letter-spacing:-.02em;text-wrap:balance}
.rd .rd-about-copy p{margin:16px 0 0;font:400 16px/1.62 var(--fu);color:var(--muted);max-width:46ch}
.rd .rd-about-btns{margin-top:26px;display:flex;gap:12px;flex-wrap:wrap}
.rd .rd-about-photo{position:relative;border-radius:26px;overflow:hidden;aspect-ratio:4/3;background:linear-gradient(150deg,#0a3238,#062126);box-shadow:0 30px 64px -30px rgba(6,33,38,.5)}
.rd .rd-about-photo img{width:100%;height:100%;object-fit:cover}
.rd .rd-about-chip{position:absolute;top:16px;right:16px;background:#fff;border-radius:999px;padding:8px 14px;font:700 12.5px var(--fu);color:var(--ink);box-shadow:0 14px 30px -14px rgba(6,33,38,.5)}
.rd .rd-stats{margin-top:44px;display:grid;grid-template-columns:repeat(4,1fr);gap:20px}
.rd .rd-stat{background:var(--surface);border:1px solid var(--line);border-radius:22px;padding:26px}
.rd .rd-stat b{font:700 clamp(40px,5vw,58px)/1 var(--fd);color:var(--accent);display:block}
.rd .rd-stat span{display:block;margin-top:8px;font:600 14px var(--fu);color:var(--ink)}
.rd .rd-stat i{display:block;margin-top:4px;font:400 11px var(--fm);letter-spacing:.06em;color:var(--muted-2);font-style:normal}

/* reviews */
.rd .rd-rev-head{display:flex;align-items:flex-end;justify-content:space-between;gap:24px;flex-wrap:wrap;margin-bottom:34px}
.rd .rd-rev-head h2{margin:12px 0 0;font:700 clamp(28px,3.6vw,44px) var(--fd);letter-spacing:-.02em}
.rd .rd-rev-summary{display:flex;align-items:center;gap:14px;background:var(--surface);border:1px solid var(--line);border-radius:18px;padding:16px 20px;box-shadow:0 18px 40px -30px rgba(6,33,38,.4)}
.rd .rd-rev-summary b{font:700 40px var(--fd);color:var(--ink)}
.rd .rd-rev-summary span{font:400 11px var(--fm);letter-spacing:.06em;color:var(--muted-2)}
.rd .rd-stars{color:#f5b400;letter-spacing:2px;font-size:15px}
.rd .rd-reviews{display:grid;grid-template-columns:repeat(3,1fr);gap:24px}
.rd .rd-review{background:var(--surface);border:1px solid var(--line);border-radius:22px;padding:26px;transition:transform .25s,box-shadow .25s}
.rd .rd-review:hover{transform:translateY(-6px);box-shadow:0 26px 52px -30px rgba(6,33,38,.4)}
.rd .rd-review p{margin:14px 0 0;font:400 16.5px/1.55 var(--fu);color:var(--ink)}
.rd .rd-review-by{margin-top:20px;display:flex;align-items:center;gap:12px}
.rd .rd-av{width:44px;height:44px;border-radius:50%;background:linear-gradient(150deg,#0d9488,#0b4f52);color:#fff;display:grid;place-items:center;font:700 14px var(--fd)}
.rd .rd-review-by b{font:700 14px var(--fu)}.rd .rd-review-by i{display:block;font:400 11px var(--fm);letter-spacing:.06em;color:var(--muted-2);font-style:normal}

/* CTA */
.rd .rd-cta{position:relative;border-radius:32px;padding:clamp(40px,5vw,64px);overflow:hidden;background:linear-gradient(140deg,#062126 0%,#0a3a3f 100%);box-shadow:0 30px 70px -32px rgba(6,33,38,.7)}
.rd .rd-orb-3{top:-40px;right:10%;width:240px;height:240px;background:radial-gradient(circle,rgba(19,170,160,.4),transparent 70%)}
.rd .rd-orb-4{bottom:-40px;left:6%;width:200px;height:200px;background:radial-gradient(circle,rgba(251,109,76,.34),transparent 70%)}
.rd .rd-cta-in{position:relative;z-index:2;display:grid;grid-template-columns:1.15fr 1fr;gap:40px;align-items:center}
.rd .rd-cta-copy h2{margin:12px 0 0;font:700 clamp(28px,3.6vw,46px)/1.06 var(--fd);letter-spacing:-.02em;color:#fff;text-wrap:balance}
.rd .rd-cta-copy p{margin:16px 0 0;font:400 16px/1.6 var(--fu);color:rgba(214,255,238,.82);max-width:40ch}
.rd .rd-cta-btns{margin-top:26px;display:flex;gap:12px;flex-wrap:wrap}
.rd .rd-cta-panel{background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.14);border-radius:22px;padding:22px}
.rd .rd-cta-row{display:flex;align-items:center;gap:14px;padding:12px 0;border-bottom:1px solid rgba(255,255,255,.1)}
.rd .rd-cta-row:last-of-type{border-bottom:none}
.rd .rd-cta-ic{width:40px;height:40px;border-radius:12px;background:rgba(103,227,211,.12);display:grid;place-items:center;flex-shrink:0}
.rd .rd-cta-row b{font:700 14px var(--fu);color:#fff}.rd .rd-cta-row i{display:block;font:400 12px var(--fu);color:rgba(214,255,238,.6);font-style:normal;margin-top:2px}
.rd .rd-pay{margin-top:16px;display:flex;flex-wrap:wrap;gap:8px}
.rd .rd-pay span{font:600 10px var(--fm);letter-spacing:.08em;color:rgba(214,255,238,.7);background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.12);padding:6px 10px;border-radius:8px;display:inline-flex;align-items:center;gap:5px}

/* keyframes */
@keyframes rd-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-16px)}}
@keyframes rd-bob{0%,100%{transform:translateY(0)}50%{transform:translateY(6px)}}
@keyframes rd-drift{0%,100%{transform:translate(0,0)}50%{transform:translate(18px,-22px)}}
@keyframes rd-pulse{0%,100%{opacity:.7;transform:scale(1)}50%{opacity:1;transform:scale(1.08)}}

/* responsive */
@media(max-width:1000px){
  .rd .rd-hero-in{grid-template-columns:1fr}.rd .rd-hero-photo{order:-1;max-width:520px;margin:0 auto}
  .rd .rd-steps,.rd .rd-bento{grid-template-columns:repeat(2,1fr)}.rd .span2{grid-column:span 2}
  .rd .rd-about{grid-template-columns:1fr}.rd .rd-cta-in{grid-template-columns:1fr}
  .rd .rd-reviews{grid-template-columns:repeat(2,1fr)}
}
@media(max-width:760px){.rd .rd-stats{grid-template-columns:repeat(2,1fr)}}
@media(max-width:620px){
  .rd .rd-steps,.rd .rd-bento,.rd .rd-reviews{grid-template-columns:1fr}.rd .span2{grid-column:span 1}
  .rd .rd-form-row{flex-direction:column}
}
`

/* ═══════════════════════════ catalogue-only styles ══════════════════════════ */
export const RD_CAT_CSS = `
.rd .rd-cat{min-height:100vh;display:flex;flex-direction:column;background:var(--bg)}
.rd .rd-cat-main{flex:1;padding:calc(74px + clamp(22px,4vw,40px)) 0 clamp(60px,9vh,104px)}
.rd .rd-cat-head{max-width:760px}
.rd .rd-cat-head h1{margin:12px 0 0;font:700 clamp(30px,4.6vw,54px)/1.04 var(--fd);letter-spacing:-.025em;color:var(--ink);text-wrap:balance}
.rd .rd-cat-head p{margin:10px 0 0;font:400 clamp(15px,1.2vw,17px)/1.6 var(--fu);color:var(--muted)}
.rd .rd-cat-bar{margin-top:26px;background:var(--surface);border:1px solid var(--line);border-radius:20px;padding:12px;display:flex;align-items:stretch;gap:8px;flex-wrap:wrap;box-shadow:0 20px 44px -30px rgba(6,33,38,.4)}
.rd .rd-cat-field{flex:1 1 150px;min-width:0;padding:10px 16px;border-radius:14px;background:var(--bg);border:1px solid var(--line)}
.rd .rd-cat-field>span{display:block;font:600 11px var(--fm);letter-spacing:.14em;color:var(--muted-2);margin-bottom:5px}
.rd .rd-cat-field input{width:100%;border:none;background:transparent;font:700 15px var(--fu);color:var(--ink);outline:none;padding:0;cursor:pointer}
.rd .rd-cat-toggle{flex:1 1 180px;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 16px;border-radius:14px;background:var(--bg);border:1px solid var(--line)}
.rd .rd-cat-toggle .lab b{display:block;font:600 11px var(--fm);letter-spacing:.14em;color:var(--muted-2)}
.rd .rd-cat-toggle .lab span{display:block;margin-top:4px;font:700 13px var(--fu);color:var(--ink)}
.rd .rd-switch{width:44px;height:25px;border-radius:999px;background:#c9dde0;position:relative;border:none;cursor:pointer;flex-shrink:0;transition:background .16s}
.rd .rd-switch.on{background:var(--teal)}
.rd .rd-switch i{position:absolute;top:3px;left:3px;width:19px;height:19px;border-radius:50%;background:#fff;transition:left .16s;box-shadow:0 2px 5px rgba(6,33,38,.3)}
.rd .rd-switch.on i{left:22px}
.rd .rd-cat-bar>.rd-btn{flex:1 1 140px}
.rd .rd-cat-err{margin-top:10px;display:flex;align-items:center;gap:7px;font:600 12.5px var(--fu);color:var(--accent-strong)}
.rd .rd-cat-tools{margin-top:20px;display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.rd .rd-chip{padding:9px 16px;border-radius:999px;border:1px solid var(--line);background:var(--surface);font:600 13px var(--fu);color:var(--ink);cursor:pointer;transition:background .15s,border-color .15s,color .15s;white-space:nowrap}
.rd .rd-chip:hover{border-color:var(--teal)}
.rd .rd-chip.on{background:var(--teal);border-color:var(--teal);color:#fff;font-weight:700}
.rd .rd-sort{margin-left:auto;min-height:40px;padding:0 14px;border-radius:999px;border:1px solid var(--line);background:var(--surface);font:600 13px var(--fu);color:var(--ink);cursor:pointer;outline:none}
.rd .rd-count{margin:22px 0 16px;font:600 12px var(--fm);letter-spacing:.08em;text-transform:uppercase;color:var(--muted)}
.rd .rd-empty{margin-top:12px;background:var(--surface);border:1px solid var(--line);border-radius:20px;padding:44px 26px;text-align:center}
.rd .rd-empty b{font:700 19px var(--fd);color:var(--ink)}
.rd .rd-empty p{margin:8px auto 0;max-width:420px;font:400 14px/1.6 var(--fu);color:var(--muted)}
.rd .rd-empty button{margin-top:16px}
@media(max-width:720px){
  .rd .rd-cat-main{padding-bottom:calc(88px + env(safe-area-inset-bottom,0px))}
  .rd .rd-cat-field,.rd .rd-cat-toggle{flex:1 1 100%}
  .rd .rd-cat-bar>.rd-btn{flex:1 1 100%}
  .rd .rd-cat-tools{flex-wrap:nowrap;overflow-x:auto;-webkit-overflow-scrolling:touch;padding-bottom:4px}
  .rd .rd-chip{flex-shrink:0;min-height:44px}
  .rd .rd-sort{margin-left:0;flex-shrink:0;min-height:44px}
}
`
