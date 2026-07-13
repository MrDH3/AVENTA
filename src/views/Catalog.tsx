'use client'

import { useEffect, useMemo, useRef, useState, type ReactNode, type CSSProperties } from 'react'
import Link from 'next/link'
import type { CarClass } from '@prisma/client'
import { useDict, useLang } from '../i18n/lang'
import LangToggle from '../components/LangToggle'
import { useIsMobile } from '../components/useIsMobile'
import type { CarView } from '../lib/view'
import type { ShellUser } from '../lib/shell-user'
import { logoutAction } from '@/server/auth-actions'
import { searchAvailabilityAction } from '@/server/misc-actions'
import { RD_CSS, RD_CAT_CSS } from '../components/RdKit'

/* ════════════════════════════════════════════════════════════════════════════
   AVENTA — Car catalogue, rebuilt on the shared `.rd` design system (RdKit) so it
   matches the landing: solid nav, the real-photo fleet card (3D tilt + solid
   availability pill + bottom-pinned price/CTA), coral buttons, glassy filter bar.
   Reachable by everyone; `authed`/`isStaff` only pick the nav's account CTA.
   ═══════════════════════════════════════════════════════════════════════════ */

const dict = {
  ru: {
    navHome: 'Главная', navHow: 'Как это работает', navWhy: 'Почему Aventa', navReviews: 'Отзывы',
    signIn: 'Войти', myAccount: 'Кабинет',
    kicker: 'ВЕСЬ ПАРК', title: 'Каталог автомобилей', subtitle: 'Премиум-парк · подача в аэропорт, отель или к морю',
    fFrom: 'С', fTo: 'ПО', onlyFree: 'ТОЛЬКО СВОБОДНЫЕ', onText: 'на ваши даты',
    update: 'Обновить', searching: 'Ищем…', noDates: 'Выберите даты',
    all: 'Все', business: 'Бизнес', minivan: 'Минивэн',
    sort: 'Сортировка', sortRec: 'Рекомендуем', sortLow: 'Сначала дешевле', sortHigh: 'Сначала дороже',
    carsFound: (n: number) => `${n} авто`,
    chipInstant: 'Мгновенная бронь', chipCash: 'Залог наличными', chipNoCard: 'Без кредитной карты', checkDates: 'Проверить даты',
    perDay: '/сут', deposit: 'Залог', bookNow: 'Забронировать',
    emptyTitle: 'Ничего не найдено', emptyBody: 'Измените даты или сбросьте фильтры, чтобы увидеть весь парк.', reset: 'Сбросить фильтры',
  },
  en: {
    navHome: 'Home', navHow: 'How it works', navWhy: 'Why Aventa', navReviews: 'Reviews',
    signIn: 'Sign in', myAccount: 'My account',
    kicker: 'FULL FLEET', title: 'Car catalogue', subtitle: 'Premium fleet · delivery to airport, hotel or seaside',
    fFrom: 'FROM', fTo: 'TO', onlyFree: 'ONLY AVAILABLE', onText: 'for your dates',
    update: 'Update', searching: 'Searching…', noDates: 'Pick dates',
    all: 'All', business: 'Business', minivan: 'Minivan',
    sort: 'Sort', sortRec: 'Recommended', sortLow: 'Price: low to high', sortHigh: 'Price: high to low',
    carsFound: (n: number) => `${n} cars`,
    chipInstant: 'Instant booking', chipCash: 'Cash deposit possible', chipNoCard: 'No credit card', checkDates: 'Check dates',
    perDay: '/day', deposit: 'Deposit', bookNow: 'Book now',
    emptyTitle: 'No cars match', emptyBody: 'Try different dates or clear the filters to see the full fleet.', reset: 'Clear filters',
  },
  tr: {
    navHome: 'Ana sayfa', navHow: 'Nasıl çalışır', navWhy: 'Neden Aventa', navReviews: 'Yorumlar',
    signIn: 'Giriş', myAccount: 'Hesabım',
    kicker: 'TÜM FİLO', title: 'Araç kataloğu', subtitle: 'Premium filo · havalimanı, otel veya sahile teslimat',
    fFrom: 'BAŞLANGIÇ', fTo: 'BİTİŞ', onlyFree: 'SADECE MÜSAİT', onText: 'tarihleriniz için',
    update: 'Güncelle', searching: 'Aranıyor…', noDates: 'Tarih seçin',
    all: 'Tümü', business: 'Business', minivan: 'Minivan',
    sort: 'Sırala', sortRec: 'Önerilen', sortLow: 'Fiyat: artan', sortHigh: 'Fiyat: azalan',
    carsFound: (n: number) => `${n} araç`,
    chipInstant: 'Anında rezervasyon', chipCash: 'Nakit depozito mümkün', chipNoCard: 'Kredi kartı gerekmez', checkDates: 'Tarihleri kontrol et',
    perDay: '/gün', deposit: 'Depozito', bookNow: 'Hemen kirala',
    emptyTitle: 'Uygun araç yok', emptyBody: 'Farklı tarih deneyin veya tüm filoyu görmek için filtreleri temizleyin.', reset: 'Filtreleri temizle',
  },
  es: {
    navHome: 'Inicio', navHow: 'Cómo funciona', navWhy: 'Por qué Aventa', navReviews: 'Opiniones',
    signIn: 'Entrar', myAccount: 'Mi cuenta',
    kicker: 'FLOTA COMPLETA', title: 'Catálogo de coches', subtitle: 'Flota premium · entrega en aeropuerto, hotel o playa',
    fFrom: 'DESDE', fTo: 'HASTA', onlyFree: 'SOLO DISPONIBLES', onText: 'para tus fechas',
    update: 'Actualizar', searching: 'Buscando…', noDates: 'Elige las fechas',
    all: 'Todos', business: 'Business', minivan: 'Monovolumen',
    sort: 'Ordenar', sortRec: 'Recomendados', sortLow: 'Precio: de menor a mayor', sortHigh: 'Precio: de mayor a menor',
    carsFound: (n: number) => `${n} coches`,
    chipInstant: 'Reserva instantánea', chipCash: 'Depósito en efectivo posible', chipNoCard: 'Sin tarjeta de crédito', checkDates: 'Ver fechas',
    perDay: '/día', deposit: 'Depósito', bookNow: 'Reservar ahora',
    emptyTitle: 'Sin coches disponibles', emptyBody: 'Prueba con otras fechas o quita los filtros para ver toda la flota.', reset: 'Quitar filtros',
  },
  de: {
    navHome: 'Startseite', navHow: 'So funktioniert’s', navWhy: 'Warum Aventa', navReviews: 'Bewertungen',
    signIn: 'Anmelden', myAccount: 'Mein Konto',
    kicker: 'GESAMTE FLOTTE', title: 'Fahrzeugkatalog', subtitle: 'Premium-Flotte · Lieferung zum Flughafen, Hotel oder ans Meer',
    fFrom: 'VON', fTo: 'BIS', onlyFree: 'NUR VERFÜGBARE', onText: 'für Ihren Zeitraum',
    update: 'Aktualisieren', searching: 'Suche läuft…', noDates: 'Bitte Zeitraum wählen',
    all: 'Alle', business: 'Business', minivan: 'Van',
    sort: 'Sortieren', sortRec: 'Empfohlen', sortLow: 'Preis: aufsteigend', sortHigh: 'Preis: absteigend',
    carsFound: (n: number) => `${n} Autos`,
    chipInstant: 'Sofortbuchung', chipCash: 'Barkaution möglich', chipNoCard: 'Keine Kreditkarte', checkDates: 'Termine prüfen',
    perDay: '/Tag', deposit: 'Kaution', bookNow: 'Jetzt buchen',
    emptyTitle: 'Keine passenden Autos', emptyBody: 'Wählen Sie andere Daten oder setzen Sie die Filter zurück, um die ganze Flotte zu sehen.', reset: 'Filter zurücksetzen',
  },
}

type ClassFilter = 'all' | CarClass

/* Desktop catalogue shell (design_handoff_aventa_catalogue_desktop): the cabinet's left green sidebar
 * + a category rail, top bar, filter toolbar, sort popover, car grid and a right-side detail drawer. */
const CATD_CSS = `
.catd{--ink:#0a2225;--muted:#5b7678;--muted-2:#8aa2a3;--bg:#eef6f5;--bg-2:#e7f1ef;--surface:#ffffff;--line:rgba(10,34,37,.10);--teal:#0d9488;--teal-700:#0f6d68;--teal-deep:#0b4f52;--teal-bright:#67e3d3;--teal-soft:rgba(13,148,136,.10);--accent:#fb6d4c;--accent-strong:#ef5c3a;--accent-soft:rgba(251,109,76,.12);--ok:#0f9d6f;--ok-soft:rgba(16,185,129,.12);--gold:#f5b400;--f-display:'Space Grotesk',system-ui,sans-serif;--f-ui:'Manrope',system-ui,sans-serif;--f-mono:'JetBrains Mono',ui-monospace,monospace;position:relative;display:flex;min-height:100vh;font-family:var(--f-ui);color:var(--ink);background:var(--bg)}
.catd *{box-sizing:border-box}
.catd a{text-decoration:none;color:inherit}
.catd .catd-cat:hover{background:rgba(255,255,255,.08)}
.catd .catd-ask{transition:background .2s}
.catd .catd-ask:hover{background:rgba(255,255,255,.18)!important}
.catd .catd-out:hover{color:#fff!important;background:rgba(255,255,255,.14)!important}
.catd .catd-card:hover{transform:translateY(-6px);box-shadow:0 1px 2px rgba(6,33,38,.04),0 34px 60px -30px rgba(6,33,38,.6);border-color:rgba(13,148,136,.32)}
.catd .catd-cta{transition:transform .18s,background .18s,box-shadow .18s}
.catd .catd-cta:hover{transform:translateY(-1px);background:var(--accent-strong)}
.catd .catd-card{transition:transform .28s cubic-bezier(.16,.84,.34,1),box-shadow .28s,border-color .28s}
.catd .catd-field:focus{border-color:var(--teal)!important;box-shadow:0 0 0 4px var(--teal-soft)}
.catd .catd-search:focus-within{border-color:var(--teal);box-shadow:0 0 0 4px var(--teal-soft)}
.catd .catd-drawer{transition:transform .42s cubic-bezier(.16,.84,.34,1)}
.catd .catd-sheen{position:absolute;top:0;bottom:0;left:0;width:55%;background:linear-gradient(100deg,transparent,rgba(255,255,255,.32),transparent);animation:catdSheen 3.9s ease-in-out infinite;pointer-events:none}
@keyframes catdSheen{0%{transform:translateX(-130%)}55%,100%{transform:translateX(240%)}}
.catd .catd-orb1{animation:catdFloat 15s ease-in-out infinite}
.catd .catd-orb2{animation:catdFloatS 13s ease-in-out infinite}
@keyframes catdFloat{0%,100%{transform:translate(0,0)}50%{transform:translate(14px,-22px)}}
@keyframes catdFloatS{0%,100%{transform:translate(0,0)}50%{transform:translate(-20px,24px)}}
@keyframes catdDot{0%,100%{opacity:1}50%{opacity:.35}}
.catd .catd-dot{animation:catdDot 2s ease-in-out infinite}
.catd .catd-side{position:sticky;top:0;align-self:flex-start;flex-shrink:0;width:270px;height:100vh;z-index:99;overflow:hidden}
.catd .catd-scrim{position:fixed;inset:0;z-index:98;background:rgba(4,20,23,.5);opacity:0;pointer-events:none;transition:opacity .3s}
.catd.nav-open .catd-scrim{opacity:1;pointer-events:auto}
.catd .catd-burger{display:none}
@media(max-width:1000px){
  .catd .catd-side{position:fixed;left:0;top:0;transform:translateX(-108%);transition:transform .34s cubic-bezier(.16,.84,.34,1);box-shadow:0 20px 60px -20px rgba(0,0,0,.6)}
  .catd.nav-open .catd-side{transform:translateX(0)}
  .catd .catd-burger{display:inline-flex}
}
@media(prefers-reduced-motion:reduce){.catd .catd-orb1,.catd .catd-orb2,.catd .catd-sheen,.catd .catd-dot{animation:none}}
`

export default function Catalog({
  cars,
  authed = false,
  isStaff = false,
  contactWhatsapp = null,
  shellUser = null,
}: {
  cars: CarView[]
  authed?: boolean
  isStaff?: boolean
  contactWhatsapp?: string | null
  shellUser?: ShellUser | null
}) {
  const t = useDict(dict)
  const { lang } = useLang()
  const isMobile = useIsMobile()

  const [classFilter, setClassFilter] = useState<ClassFilter>('all')
  const [onlyAvailable, setOnlyAvailable] = useState(true)
  const [sortKey, setSortKey] = useState<'rec' | 'low' | 'high'>('rec')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [availableSlugs, setAvailableSlugs] = useState<string[] | null>(null)
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [motion, setMotion] = useState(false)
  const [sortOpen, setSortOpen] = useState(false)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [pickup, setPickup] = useState('airport')
  const [navOpen, setNavOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMotion(window.matchMedia('(pointer:fine)').matches && !window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  }, [])

  // Scroll-reveal for the header/bar/toolbar (the grid itself appears instantly).
  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      root.querySelectorAll('.rv').forEach((e) => e.classList.add('in'))
      return
    }
    const io = new IntersectionObserver((entries) => {
      for (const en of entries) if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target) }
    }, { threshold: 0.14, rootMargin: '0px 0px -6% 0px' })
    root.querySelectorAll('.rv').forEach((e) => io.observe(e))
    return () => io.disconnect()
  }, [])

  const runSearch = async () => {
    if (!startDate || !endDate) { setSearchError(t.noDates); return }
    setSearching(true); setSearchError(null)
    try {
      const startISO = new Date(`${startDate}T00:00:00`).toISOString()
      const endISO = new Date(`${endDate}T00:00:00`).toISOString()
      const res = await searchAvailabilityAction(startISO, endISO)
      if (res.ok && res.availableSlugs) setAvailableSlugs(res.availableSlugs)
      else { setSearchError(res.error ?? 'Error'); setAvailableSlugs(null) }
    } finally { setSearching(false) }
  }

  const visibleCars = useMemo<CarView[]>(() => {
    const q = query.trim().toLowerCase()
    const filtered = cars.filter(
      (c) =>
        (classFilter === 'all' || c.cls === classFilter) &&
        (!onlyAvailable || c.available) &&
        (availableSlugs === null || availableSlugs.includes(c.slug)) &&
        (q === '' || `${c.brand} ${c.model}`.toLowerCase().includes(q)),
    )
    if (sortKey === 'rec') return filtered
    return [...filtered].sort((a, b) => (sortKey === 'low' ? a.pricePerDay - b.pricePerDay : b.pricePerDay - a.pricePerDay))
  }, [cars, classFilter, onlyAvailable, availableSlugs, sortKey, query])

  const chips: { key: ClassFilter; label: string; count?: number }[] = [
    { key: 'all', label: t.all, count: cars.length },
    { key: 'BUSINESS', label: t.business },
    { key: 'SUV', label: 'SUV' },
    { key: 'MINIVAN', label: t.minivan },
  ]
  const navLinks = [
    { href: '/', label: t.navHome },
    { href: '/#how', label: t.navHow },
    { href: '/#why', label: t.navWhy },
    { href: '/#reviews', label: t.navReviews },
  ]
  const cta = authed ? { href: isStaff ? '/admin' : '/account', label: t.myAccount } : { href: '/auth', label: t.signIn }

  const resetAll = () => { setClassFilter('all'); setOnlyAvailable(false); setAvailableSlugs(null); setSearchError(null) }

  // ═══════════════════════ MOBILE — dedicated fleet browser (seaside handoff) ═══════════════════════
  if (isMobile) {
    const matchAvail = (c: CarView) => (!onlyAvailable || c.available) && (availableSlugs === null || availableSlugs.includes(c.slug))
    const countFor = (key: ClassFilter) => cars.filter((c) => (key === 'all' || c.cls === key) && matchAvail(c)).length
    const catsM: { key: ClassFilter; label: string }[] = [
      { key: 'all', label: t.all }, { key: 'BUSINESS', label: t.business }, { key: 'SUV', label: 'SUV' }, { key: 'MINIVAN', label: t.minivan }, { key: 'ECONOMY', label: lang === 'ru' ? 'Эконом' : 'Economy' },
    ]
    const sortLabelM = sortKey === 'low' ? t.sortLow : sortKey === 'high' ? t.sortHigh : t.sortRec
    const detailCar = cars.find((c) => c.id === detailId) || null
    const cmlAll: Record<string, { included: string; kmIncl: (n: number | null) => string; fuel: string; road: string; cancel: string; insur: string; delivery: string; refDeposit: string; minAge: string; minAgeVal: string; bookThis: string; taxes: string; notify: string; wholeFleet: string; notSure: string; elenaReplies: string; askElena: string; sortBy: string; free: string; available: string; booked: string }> = {
      en: { included: "What's included", kmIncl: (n) => `${n ?? 250} km/day included`, fuel: 'Full-to-full fuel policy', road: '24/7 roadside assistance', cancel: 'Free cancellation up to 48h', insur: 'Comprehensive insurance available', delivery: 'Airport, hotel or seaside delivery', refDeposit: 'Refundable deposit', minAge: 'Min. age', minAgeVal: '21+ · 2 yrs licence', bookThis: 'Book this car', taxes: 'Taxes & basic cover included', notify: 'Notify me', wholeFleet: "That's the whole fleet for these dates", notSure: 'Not sure which car?', elenaReplies: 'We reply in ~5 min', askElena: 'Ask us', sortBy: 'Sort by', free: 'Free delivery', available: 'Available', booked: 'Booked' },
      ru: { included: 'Что включено', kmIncl: (n) => `${n ?? 250} км/день включено`, fuel: 'Топливо: полный → полный', road: 'Помощь на дороге 24/7', cancel: 'Бесплатная отмена за 48ч', insur: 'Доступна полная страховка', delivery: 'Подача в аэропорт, отель или к морю', refDeposit: 'Возвратный залог', minAge: 'Мин. возраст', minAgeVal: '21+ · стаж 2 года', bookThis: 'Забронировать это авто', taxes: 'Налоги и базовая страховка включены', notify: 'Сообщить', wholeFleet: 'Это весь парк на эти даты', notSure: 'Не знаете, что выбрать?', elenaReplies: 'Ответим за ~5 мин', askElena: 'Спросить', sortBy: 'Сортировка', free: 'Бесплатная подача', available: 'Свободна', booked: 'Занята' },
    }
    const cml = cmlAll[lang] ?? cmlAll.en
    const specIcon = (kind: 'gear' | 'fuel' | 'seat' | 'ac') => {
      const p = kind === 'gear' ? <><circle cx="12" cy="12" r="3" /><path d="M12 2v4M12 18v4M2 12h4M18 12h4" /></> : kind === 'fuel' ? <><line x1="3" x2="15" y1="22" y2="22" /><line x1="4" x2="14" y1="9" y2="9" /><path d="M14 22V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v18" /><path d="M14 13h2a2 2 0 0 1 2 2v2a2 2 0 0 0 2 2 2 2 0 0 0 2-2V9.83a2 2 0 0 0-.59-1.42L18 5" /></> : kind === 'seat' ? <><path d="M19 9V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v3" /><path d="M3 16a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2H3Z" /><path d="M5 18v2M19 18v2" /></> : <><path d="M2 12h20M12 2v20M6 6l12 12M18 6 6 18" /></>
      return <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="var(--teal)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{p}</svg>
    }
    const carImg = (c: CarView, h: number) => (
      <div style={{ position: 'relative', width: '100%', height: h, background: 'linear-gradient(135deg,#0b4f52,#0a3438)', overflow: 'hidden' }}>
        {c.coverUrl && <img src={c.coverUrl} alt={`${c.brand} ${c.model}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
        {!c.coverUrl && <svg viewBox="0 0 24 24" width="54" height="54" fill="none" stroke="rgba(255,255,255,.4)" strokeWidth="1.3" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }}><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" /><circle cx="7" cy="17" r="2" /><circle cx="17" cy="17" r="2" /></svg>}
        <div aria-hidden style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,transparent 55%,rgba(4,20,23,.42))' }} />
      </div>
    )

    return (
      <div className="rd catm" style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', flexDirection: 'column', background: '#05191d' }}>
        <style dangerouslySetInnerHTML={{ __html: RD_CSS + RD_CAT_CSS }} />
        <style dangerouslySetInnerHTML={{ __html: `@keyframes ctFloat{0%,100%{transform:translate(0,0)}50%{transform:translate(-12px,14px)}}@keyframes ctFloatS{0%,100%{transform:translate(0,0)}50%{transform:translate(16px,-18px)}}@keyframes ctDot{0%,100%{opacity:1}50%{opacity:.4}}.ct-orb1{animation:ctFloat 15s ease-in-out infinite}.ct-orb2{animation:ctFloatS 18s ease-in-out infinite}.ct-dot{animation:ctDot 2s ease-in-out infinite}.ct-sheet{transition:transform .42s cubic-bezier(.16,.84,.34,1)}.ct-press:active{transform:scale(.98)}.ct-chips::-webkit-scrollbar{display:none}@media(prefers-reduced-motion:reduce){.ct-orb1,.ct-orb2,.ct-dot{animation:none}}` }} />

        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', WebkitOverflowScrolling: 'touch' }}>
          {/* HERO */}
          <header style={{ position: 'relative', overflow: 'hidden', padding: '50px 20px 56px', background: 'radial-gradient(130% 120% at 80% 2%,#0f7173 0%,#0a4247 46%,#05191d 100%)', color: '#fff' }}>
            <div aria-hidden style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(135deg,rgba(255,255,255,.045) 0 1.5px,transparent 1.5px 22px)', opacity: 0.5, pointerEvents: 'none' }} />
            <div className="ct-orb1" aria-hidden style={{ position: 'absolute', top: '-16%', right: '-14%', width: 230, height: 230, borderRadius: '50%', background: 'radial-gradient(circle,rgba(45,212,191,.4),transparent 62%)', filter: 'blur(26px)', pointerEvents: 'none' }} />
            <div className="ct-orb2" aria-hidden style={{ position: 'absolute', bottom: '-30%', left: '-20%', width: 220, height: 220, borderRadius: '50%', background: 'radial-gradient(circle,rgba(251,109,76,.26),transparent 64%)', filter: 'blur(30px)', pointerEvents: 'none' }} />
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 10 }}>
              <Link href="/" style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.16)', display: 'grid', placeItems: 'center', color: '#fff', flexShrink: 0 }}>
                <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
              </Link>
              <span style={{ flex: 1 }} />
              <Link href={authed ? '/account' : '/auth'} aria-label={authed ? t.myAccount : t.signIn} style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg,#fb6d4c,#ef5c3a)', display: 'grid', placeItems: 'center', color: '#fff', font: '700 15px var(--f-display)', flexShrink: 0, position: 'relative' }}>
                {shellUser ? shellUser.initial : <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6.5 8-6.5s8 2.5 8 6.5" /></svg>}
                {shellUser && <span style={{ position: 'absolute', right: 0, bottom: 0, width: 11, height: 11, borderRadius: '50%', background: '#0f9d6f', border: '2px solid #0a4247' }} />}
              </Link>
              <span style={{ display: 'inline-flex' }}><LangToggle glass /></span>
            </div>
            <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 7, marginTop: 20, font: '600 10px var(--f-mono)', letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--teal-bright)' }}>
              <span className="ct-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)' }} />{t.kicker} · {cars.length}
            </div>
            <h1 style={{ position: 'relative', font: '700 32px var(--f-display)', letterSpacing: '-.02em', color: '#fff', margin: '10px 0 0' }}>{t.title}</h1>
            <p style={{ position: 'relative', font: '500 13.5px/1.5 var(--f-ui)', color: 'rgba(255,255,255,.78)', margin: '8px 0 0' }}>{t.subtitle}</p>
            <div style={{ position: 'relative', display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 16 }}>
              {[cml.free, t.chipInstant, t.chipNoCard].map((c) => (
                <span key={c} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 11px', borderRadius: 999, background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.14)', font: '600 11px var(--f-ui)', color: '#fff', whiteSpace: 'nowrap' }}>
                  <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="var(--teal-bright)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>{c}
                </span>
              ))}
            </div>
          </header>

          {/* SHEET */}
          <div style={{ position: 'relative', marginTop: -34, borderRadius: '26px 26px 0 0', background: 'var(--bg)', padding: '8px 16px 24px' }}>
            <div style={{ width: 40, height: 4, borderRadius: 999, background: 'var(--line)', margin: '0 auto 16px' }} />

            {/* date + availability filter */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 20, padding: 16, boxShadow: '0 14px 36px -26px rgba(6,33,38,.5)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
                {[{ lbl: t.fFrom, v: startDate, set: setStartDate }, { lbl: t.fTo, v: endDate, set: setEndDate }].map((d) => (
                  <label key={d.lbl} style={{ display: 'block' }}>
                    <span style={{ display: 'block', font: '600 9.5px var(--f-mono)', letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--muted-2)', marginBottom: 7 }}>{d.lbl}</span>
                    <input type="date" value={d.v} onChange={(e) => d.set(e.target.value)} style={{ width: '100%', boxSizing: 'border-box', padding: '12px 12px', border: '1px solid var(--line)', borderRadius: 12, background: 'var(--bg)', color: 'var(--ink)', font: '600 14px var(--f-ui)' }} />
                  </label>
                ))}
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 13, padding: '11px 13px', borderRadius: 13, background: 'var(--bg)', cursor: 'pointer' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ font: '700 13.5px var(--f-display)', color: 'var(--ink)' }}>{t.onlyFree}</div>
                  <div style={{ font: '500 11.5px var(--f-ui)', color: 'var(--muted)' }}>{t.onText}</div>
                </div>
                <span onClick={() => setOnlyAvailable((v) => !v)} style={{ position: 'relative', width: 46, height: 27, borderRadius: 999, flexShrink: 0, background: onlyAvailable ? 'var(--teal)' : 'var(--bg-2)', transition: 'background .25s', cursor: 'pointer' }}>
                  <span style={{ position: 'absolute', top: 3, left: onlyAvailable ? 22 : 3, width: 21, height: 21, borderRadius: '50%', background: '#fff', transition: 'left .25s cubic-bezier(.16,.84,.34,1)', boxShadow: '0 2px 6px rgba(0,0,0,.25)' }} />
                </span>
              </label>
              <button type="button" onClick={runSearch} className="ct-press" style={{ width: '100%', marginTop: 12, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 13, border: 'none', borderRadius: 13, background: 'var(--accent)', color: '#fff', font: '700 14px var(--f-display)', cursor: 'pointer', boxShadow: '0 12px 26px -12px var(--accent)' }}>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>{searching ? t.searching : t.update}
              </button>
              {searchError && <div style={{ marginTop: 8, font: '600 12px var(--f-ui)', color: 'var(--accent-strong)', textAlign: 'center' }}>{searchError}</div>}
            </div>

            {/* category chips */}
            <div className="ct-chips" style={{ display: 'flex', gap: 8, marginTop: 14, overflowX: 'auto', paddingBottom: 2 }}>
              {catsM.map((c) => {
                const on = classFilter === c.key
                return (
                  <button key={c.key} type="button" onClick={() => setClassFilter(c.key)} style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 14px', borderRadius: 999, cursor: 'pointer', font: '600 13px var(--f-ui)', border: on ? '1px solid var(--teal)' : '1px solid var(--line)', background: on ? 'var(--teal-soft)' : 'var(--surface)', color: on ? 'var(--teal-700)' : 'var(--ink)' }}>
                    {c.label}<span style={{ minWidth: 18, height: 18, padding: '0 5px', borderRadius: 999, display: 'inline-grid', placeItems: 'center', font: '700 10px var(--f-mono)', background: on ? 'var(--teal)' : 'var(--bg-2)', color: on ? '#fff' : 'var(--muted)' }}>{countFor(c.key)}</span>
                  </button>
                )
              })}
            </div>

            {/* count + sort */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, margin: '16px 2px 12px' }}>
              <span style={{ font: '600 11px var(--f-mono)', letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--muted)' }}>{t.carsFound(visibleCars.length)}</span>
              <button type="button" onClick={() => setSortOpen(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 13px', borderRadius: 999, border: '1px solid var(--line)', background: 'var(--surface)', color: 'var(--ink)', font: '600 12.5px var(--f-ui)', cursor: 'pointer' }}>
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="var(--muted)" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M7 12h10M11 18h2" /></svg>{sortLabelM}
              </button>
            </div>

            {/* car list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {visibleCars.map((car) => (
                <div key={car.id} onClick={() => setDetailId(car.id)} style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 20, overflow: 'hidden', boxShadow: '0 14px 36px -26px rgba(6,33,38,.5)', cursor: 'pointer' }}>
                  <div style={{ position: 'relative' }}>
                    {carImg(car, 172)}
                    <span style={{ position: 'absolute', top: 10, left: 10, padding: '5px 10px', borderRadius: 999, background: 'rgba(4,20,23,.55)', backdropFilter: 'blur(5px)', font: '600 9.5px var(--f-mono)', letterSpacing: '.06em', textTransform: 'uppercase', color: '#fff' }}>{car.clsLabel}</span>
                    <span style={{ position: 'absolute', top: 10, right: 10, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 10px', borderRadius: 999, font: '600 9.5px var(--f-mono)', letterSpacing: '.06em', textTransform: 'uppercase', color: '#fff', background: car.available ? 'rgba(15,157,111,.94)' : 'rgba(4,20,23,.6)', backdropFilter: car.available ? 'none' : 'blur(5px)' }}>
                      <span className="ct-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: car.available ? '#fff' : 'var(--accent)' }} />{car.available ? cml.available : cml.booked}
                    </span>
                    <span style={{ position: 'absolute', bottom: 10, right: 12, font: '700 15px var(--f-display)', color: '#fff', textShadow: '0 2px 8px rgba(0,0,0,.5)' }}>{car.year}</span>
                  </div>
                  <div style={{ padding: 16 }}>
                    <div style={{ font: '700 18px var(--f-display)', color: 'var(--ink)' }}>{car.brand} {car.model}</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6, marginTop: 12 }}>
                      {[{ i: 'gear' as const, v: car.gearboxLabel }, { i: 'fuel' as const, v: car.fuelLabel }, { i: 'seat' as const, v: String(car.seats) }, { i: 'ac' as const, v: 'A/C' }].map((s, idx) => (
                        <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, padding: '10px 4px', borderRadius: 12, background: 'var(--bg)' }}>
                          {specIcon(s.i)}<span style={{ font: '600 10px var(--f-ui)', color: 'var(--muted)', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>{s.v}</span>
                        </div>
                      ))}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
                      {[t.chipInstant, t.chipCash, t.chipNoCard].map((f) => (
                        <span key={f} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 999, background: 'var(--teal-soft)', color: 'var(--teal-700)', font: '600 10.5px var(--f-ui)' }}>
                          <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>{f}
                        </span>
                      ))}
                    </div>
                    <div style={{ height: 1, background: 'var(--line)', margin: '14px 0' }} />
                    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 }}>
                      <div>
                        <div><span style={{ font: '700 25px var(--f-display)', color: 'var(--ink)' }}>€{car.pricePerDay}</span><span style={{ font: '500 13px var(--f-ui)', color: 'var(--muted)' }}>{t.perDay}</span></div>
                        <div style={{ font: '500 11px var(--f-ui)', color: 'var(--muted-2)', marginTop: 2 }}>{t.deposit} €{car.deposit} · {car.mileageLimitPerDay ?? 250} km/day</div>
                      </div>
                      {car.available ? (
                        <Link href={`/booking?car=${car.slug}`} onClick={(e) => e.stopPropagation()} className="ct-press" style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 7, padding: '12px 16px', borderRadius: 13, background: 'var(--accent)', color: '#fff', font: '700 13.5px var(--f-display)', textDecoration: 'none', boxShadow: '0 12px 26px -12px var(--accent)' }}>{t.bookNow}<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg></Link>
                      ) : (
                        <button type="button" onClick={(e) => e.stopPropagation()} style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 7, padding: '12px 16px', borderRadius: 13, border: '1.5px solid var(--line)', background: 'var(--surface)', color: 'var(--muted)', font: '700 13.5px var(--f-display)', cursor: 'pointer' }}><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>{cml.notify}</button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {visibleCars.length === 0 && (
                <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 20, padding: '30px 22px', textAlign: 'center' }}>
                  <div style={{ font: '700 18px var(--f-display)', color: 'var(--ink)' }}>{t.emptyTitle}</div>
                  <p style={{ margin: '8px auto 0', maxWidth: 300, font: '400 13.5px/1.6 var(--f-ui)', color: 'var(--muted)' }}>{t.emptyBody}</p>
                </div>
              )}
            </div>

            {visibleCars.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 4px 0' }}>
                <span style={{ flex: 1, height: 1, background: 'var(--line)' }} />
                <span style={{ font: '500 11px var(--f-ui)', color: 'var(--muted-2)', textAlign: 'center', whiteSpace: 'nowrap' }}>{cml.wholeFleet}</span>
                <span style={{ flex: 1, height: 1, background: 'var(--line)' }} />
              </div>
            )}
          </div>
        </div>

        {/* ── sticky concierge bar ── */}
        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 12, padding: '11px 16px calc(env(safe-area-inset-bottom,0px) + 12px)', background: 'rgba(255,255,255,.92)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', borderTop: '1px solid var(--line)' }}>
          <span style={{ position: 'relative', width: 42, height: 42, borderRadius: '50%', background: 'linear-gradient(135deg,var(--accent),var(--accent-strong))', display: 'grid', placeItems: 'center', color: '#fff', font: '700 16px var(--f-display)', flexShrink: 0 }}>Е<span style={{ position: 'absolute', right: -1, bottom: -1, width: 11, height: 11, borderRadius: '50%', background: 'var(--ok)', border: '2px solid #fff' }} /></span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ font: '700 13px var(--f-display)', color: 'var(--ink)' }}>{cml.notSure}</div>
            <div style={{ font: '500 11px var(--f-ui)', color: 'var(--muted)' }}>{cml.elenaReplies}</div>
          </div>
          {contactWhatsapp && (
            <a href={contactWhatsapp} target="_blank" rel="noopener noreferrer" className="ct-press" style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 7, padding: '11px 16px', borderRadius: 13, background: '#25d366', color: '#fff', font: '700 13px var(--f-display)', textDecoration: 'none' }}><svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2Zm5.8 14.01c-.24.68-1.4 1.3-1.94 1.38-.5.07-1.13.1-1.82-.11-.42-.13-.96-.31-1.65-.61-2.9-1.25-4.79-4.17-4.94-4.36-.14-.19-1.18-1.57-1.18-2.99 0-1.42.75-2.12 1.01-2.41.26-.29.57-.36.76-.36.19 0 .38 0 .55.01.18.01.41-.07.65.5.24.57.82 1.99.89 2.13.07.14.12.31.02.5-.09.19-.14.31-.28.48-.14.17-.29.37-.42.5-.14.14-.28.29-.12.57.16.28.71 1.17 1.53 1.9 1.05.94 1.94 1.23 2.22 1.37.28.14.44.12.6-.07.16-.19.69-.8.87-1.08.18-.28.36-.23.61-.14.25.09 1.6.75 1.87.89.28.14.46.21.53.33.07.12.07.68-.17 1.36Z" /></svg>{cml.askElena}</a>
          )}
        </div>

        {/* ── sort sheet ── */}
        <div onClick={() => setSortOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 80, background: 'rgba(4,20,23,.55)', opacity: sortOpen ? 1 : 0, pointerEvents: sortOpen ? 'auto' : 'none', transition: 'opacity .3s' }} />
        <div className="ct-sheet" style={{ position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 81, background: 'var(--surface)', borderRadius: '24px 24px 0 0', padding: '10px 16px calc(env(safe-area-inset-bottom,0px) + 20px)', transform: sortOpen ? 'translateY(0)' : 'translateY(101%)', boxShadow: '0 -20px 50px -20px rgba(6,33,38,.4)' }}>
          <div style={{ width: 40, height: 4, borderRadius: 999, background: 'var(--line)', margin: '0 auto 14px' }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ font: '700 17px var(--f-display)', color: 'var(--ink)' }}>{cml.sortBy}</span>
            <button type="button" onClick={() => setSortOpen(false)} style={{ width: 32, height: 32, borderRadius: 10, border: '1px solid var(--line)', background: 'var(--surface)', color: 'var(--muted)', display: 'grid', placeItems: 'center', cursor: 'pointer' }}><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg></button>
          </div>
          {([{ k: 'rec', l: t.sortRec }, { k: 'low', l: t.sortLow }, { k: 'high', l: t.sortHigh }] as const).map((o) => (
            <button key={o.k} type="button" onClick={() => { setSortKey(o.k); setSortOpen(false) }} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '14px 14px', borderRadius: 13, border: 'none', background: sortKey === o.k ? 'var(--teal-soft)' : 'transparent', color: 'var(--ink)', font: `${sortKey === o.k ? 700 : 500} 14.5px var(--f-ui)`, cursor: 'pointer', marginBottom: 4 }}>
              {o.l}{sortKey === o.k && <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="var(--teal)" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>}
            </button>
          ))}
        </div>

        {/* ── car detail sheet ── */}
        <div onClick={() => setDetailId(null)} style={{ position: 'fixed', inset: 0, zIndex: 90, background: 'rgba(4,20,23,.5)', opacity: detailCar ? 1 : 0, pointerEvents: detailCar ? 'auto' : 'none', transition: 'opacity .32s' }} />
        <div className="ct-sheet" style={{ position: 'fixed', left: 0, right: 0, bottom: 0, top: 40, zIndex: 91, display: 'flex', flexDirection: 'column', background: 'var(--bg)', borderRadius: '24px 24px 0 0', overflow: 'hidden', transform: detailCar ? 'translateY(0)' : 'translateY(101%)', pointerEvents: detailCar ? 'auto' : 'none', boxShadow: '0 -20px 50px -20px rgba(6,33,38,.4)' }}>
          {detailCar && (
            <>
              <div style={{ position: 'relative', flexShrink: 0 }}>
                {carImg(detailCar, 210)}
                <button type="button" onClick={() => setDetailId(null)} style={{ position: 'absolute', top: 14, right: 14, width: 36, height: 36, borderRadius: 12, border: 'none', background: 'rgba(4,20,23,.5)', backdropFilter: 'blur(6px)', color: '#fff', display: 'grid', placeItems: 'center', cursor: 'pointer' }}><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg></button>
                <span style={{ position: 'absolute', top: 14, left: 14, padding: '6px 11px', borderRadius: 999, background: 'rgba(4,20,23,.5)', backdropFilter: 'blur(6px)', font: '600 10px var(--f-mono)', letterSpacing: '.06em', textTransform: 'uppercase', color: '#fff' }}>{detailCar.clsLabel} · {detailCar.year}</span>
                <h2 style={{ position: 'absolute', left: 16, bottom: 14, font: '700 24px var(--f-display)', color: '#fff', margin: 0, textShadow: '0 2px 10px rgba(0,0,0,.5)' }}>{detailCar.brand} {detailCar.model}</h2>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
                  {[{ i: 'gear' as const, v: detailCar.gearboxLabel }, { i: 'fuel' as const, v: detailCar.fuelLabel }, { i: 'seat' as const, v: `${detailCar.seats}` }, { i: 'ac' as const, v: 'A/C' }].map((s, idx) => (
                    <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '13px 4px', borderRadius: 13, background: 'var(--surface)', border: '1px solid var(--line)' }}>{specIcon(s.i)}<span style={{ font: '600 10.5px var(--f-ui)', color: 'var(--muted)', textAlign: 'center' }}>{s.v}</span></div>
                  ))}
                </div>
                <div style={{ marginTop: 16, background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 16, padding: 16 }}>
                  <div style={{ font: '600 10px var(--f-mono)', letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 12 }}>{cml.included}</div>
                  {[cml.kmIncl(detailCar.mileageLimitPerDay), cml.fuel, cml.road, cml.cancel, cml.insur, cml.delivery].map((it) => (
                    <div key={it} style={{ display: 'flex', gap: 9, padding: '4px 0', font: '500 13px/1.5 var(--f-ui)', color: 'var(--ink)' }}><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="var(--ok)" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}><path d="M20 6 9 17l-5-5" /></svg><span>{it}</span></div>
                  ))}
                </div>
                <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div style={{ background: 'var(--teal-soft)', border: '1px solid rgba(13,148,136,.2)', borderRadius: 14, padding: '13px 14px' }}><div style={{ font: '600 10px var(--f-mono)', letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--teal-700)' }}>{cml.refDeposit}</div><div style={{ font: '700 18px var(--f-display)', color: 'var(--ink)', marginTop: 4 }}>€{detailCar.deposit}</div></div>
                  <div style={{ background: 'var(--teal-soft)', border: '1px solid rgba(13,148,136,.2)', borderRadius: 14, padding: '13px 14px' }}><div style={{ font: '600 10px var(--f-mono)', letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--teal-700)' }}>{cml.minAge}</div><div style={{ font: '600 13px var(--f-ui)', color: 'var(--ink)', marginTop: 6 }}>{cml.minAgeVal}</div></div>
                </div>
              </div>
              <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px calc(env(safe-area-inset-bottom,0px) + 14px)', borderTop: '1px solid var(--line)', background: 'var(--surface)' }}>
                <div style={{ minWidth: 0 }}><div><span style={{ font: '700 22px var(--f-display)', color: 'var(--ink)' }}>€{detailCar.pricePerDay}</span><span style={{ font: '500 12px var(--f-ui)', color: 'var(--muted)' }}>{t.perDay}</span></div><div style={{ font: '500 10.5px var(--f-ui)', color: 'var(--muted-2)' }}>{cml.taxes}</div></div>
                <Link href={`/booking?car=${detailCar.slug}`} className="ct-press" style={{ marginLeft: 'auto', flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 20px', borderRadius: 14, background: 'var(--accent)', color: '#fff', font: '700 14.5px var(--f-display)', textDecoration: 'none', boxShadow: '0 12px 26px -12px var(--accent)' }}>{cml.bookThis}<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg></Link>
              </div>
            </>
          )}
        </div>
      </div>
    )
  }

  // ═══════════════════ DESKTOP — left-sidebar fleet browser (seaside handoff) ═══════════════════
  const dMatchAvail = (c: CarView) => (!onlyAvailable || c.available) && (availableSlugs === null || availableSlugs.includes(c.slug))
  const dCountFor = (key: ClassFilter) => cars.filter((c) => (key === 'all' || c.cls === key) && dMatchAvail(c)).length
  const CAT_ICON = {
    all: (<><rect width="7" height="9" x="3" y="3" rx="1" /><rect width="7" height="5" x="14" y="3" rx="1" /><rect width="7" height="9" x="14" y="12" rx="1" /><rect width="7" height="5" x="3" y="16" rx="1" /></>),
    BUSINESS: (<><rect width="20" height="14" x="2" y="7" rx="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></>),
    SUV: (<><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" /><circle cx="7" cy="17" r="2" /><path d="M9 17h6" /><circle cx="17" cy="17" r="2" /></>),
    MINIVAN: (<><path d="M19 9V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v3" /><path d="M3 11v5a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2Z" /><circle cx="8" cy="18" r="1.6" /><circle cx="16" cy="18" r="1.6" /></>),
    ECONOMY: (<><circle cx="12" cy="12" r="9" /><path d="M15 9.5a3.5 3.5 0 0 0-3-1.5c-2 0-3.5 1.8-3.5 4s1.5 4 3.5 4a3.5 3.5 0 0 0 3-1.5" /><path d="M7 11h6M7 13.5h5" /></>),
  } as Record<string, ReactNode>
  const catsD: { key: ClassFilter; label: string }[] = [
    { key: 'all', label: lang === 'ru' ? 'Все авто' : 'All cars' }, { key: 'BUSINESS', label: t.business }, { key: 'SUV', label: 'SUV' }, { key: 'MINIVAN', label: t.minivan }, { key: 'ECONOMY', label: lang === 'ru' ? 'Эконом' : 'Economy' },
  ]
  const activeCatIdx = Math.max(0, catsD.findIndex((c) => c.key === classFilter))
  const detailCarD = cars.find((c) => c.id === detailId) || null
  const sortLabelD = sortKey === 'low' ? t.sortLow : sortKey === 'high' ? t.sortHigh : t.sortRec
  const catLabelD = catsD[activeCatIdx].label
  const cmlDAll: Record<string, { included: string; kmIncl: (n: number | null) => string; fuel: string; road: string; cancel: string; insur: string; delivery: string; refDeposit: string; minAge: string; minAgeVal: string; bookThis: string; taxes: string; notify: string; wholeFleet: string; notSure: string; elenaReplies: string; askElena: string; browse: string; carsIn: string; available: string; booked: string; signIn: string; details: string; searchPh: string }> = {
    en: { included: "What's included", kmIncl: (n) => `${n ?? 250} km/day included`, fuel: 'Full-to-full fuel policy', road: '24/7 roadside assistance', cancel: 'Free cancellation up to 48h', insur: 'Comprehensive insurance available', delivery: 'Airport, hotel or seaside delivery', refDeposit: 'Refundable deposit', minAge: 'Min. age', minAgeVal: '21+ · 2 yrs licence', bookThis: 'Book this car', taxes: 'Taxes & basic cover included', notify: 'Notify', wholeFleet: "That's the whole fleet for these dates", notSure: 'Not sure which car?', elenaReplies: 'We reply in ~5 min', askElena: 'Ask us', browse: 'Browse fleet', carsIn: 'cars in', available: 'Available', booked: 'Booked', signIn: 'Sign in', details: 'Details', searchPh: 'Search cars…' },
    ru: { included: 'Что входит', kmIncl: (n) => `${n ?? 250} км/день включено`, fuel: 'Топливо: полный → полный', road: 'Помощь на дороге 24/7', cancel: 'Бесплатная отмена за 48ч', insur: 'Доступна полная страховка', delivery: 'Подача в аэропорт, отель или к морю', refDeposit: 'Возвратный депозит', minAge: 'Мин. возраст', minAgeVal: '21+ · стаж 2 года', bookThis: 'Забронировать это авто', taxes: 'Налоги и базовая страховка включены', notify: 'Сообщить', wholeFleet: 'Это весь автопарк на эти даты', notSure: 'Не знаете, что выбрать?', elenaReplies: 'Ответим за ~5 мин', askElena: 'Спросить', browse: 'Автопарк', carsIn: 'авто в', available: 'Свободен', booked: 'Занят', signIn: 'Войти', details: 'Детали', searchPh: 'Поиск авто…' },
  }
  const cmlD = cmlDAll[lang] ?? cmlDAll.en
  const dSpecIcon = (kind: 'gear' | 'fuel' | 'seat' | 'ac', sz = 19) => {
    const p = kind === 'gear' ? <><circle cx="12" cy="12" r="3" /><path d="M12 2v4M12 18v4M2 12h4M18 12h4" /></> : kind === 'fuel' ? <><line x1="3" x2="15" y1="22" y2="22" /><line x1="4" x2="14" y1="9" y2="9" /><path d="M14 22V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v18" /><path d="M14 13h2a2 2 0 0 1 2 2v2a2 2 0 0 0 2 2 2 2 0 0 0 2-2V9.83a2 2 0 0 0-.59-1.42L18 5" /></> : kind === 'seat' ? <><path d="M19 9V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v3" /><path d="M3 16a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2H3Z" /><path d="M5 18v2M19 18v2" /></> : <><path d="M2 12h20M12 2v20M6 6l12 12M18 6 6 18" /></>
    return <svg viewBox="0 0 24 24" width={sz} height={sz} fill="none" stroke="var(--teal)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{p}</svg>
  }
  const dCarImg = (c: CarView, h: number) => (
    <div style={{ position: 'relative', width: '100%', height: h, background: 'linear-gradient(135deg,#0b4f52,#0a3438)', overflow: 'hidden', flexShrink: 0 }}>
      {c.coverUrl && <img src={c.coverUrl} alt={`${c.brand} ${c.model}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
      {!c.coverUrl && <svg viewBox="0 0 24 24" width="56" height="56" fill="none" stroke="rgba(255,255,255,.4)" strokeWidth="1.3" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }}><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" /><circle cx="7" cy="17" r="2" /><circle cx="17" cy="17" r="2" /></svg>}
      <div aria-hidden style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,rgba(4,20,23,.3) 0%,transparent 32%,transparent 60%,rgba(4,20,23,.44))' }} />
    </div>
  )
  const dField: CSSProperties = { width: '100%', padding: '12px', border: '1.5px solid var(--line)', borderRadius: 12, fontSize: 14, fontWeight: 600, color: 'var(--ink)', background: 'var(--bg)', outline: 'none' }

  return (
    <div className={`catd${navOpen ? ' nav-open' : ''}`} ref={rootRef}>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Manrope:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" />
      <style dangerouslySetInnerHTML={{ __html: CATD_CSS }} />
      <div className="catd-scrim" onClick={() => setNavOpen(false)} />

      {/* ═══════ SIDEBAR ═══════ */}
      <aside className="catd-side" style={{ display: 'flex', flexDirection: 'column', padding: '22px 18px', color: '#fff', background: 'linear-gradient(176deg,#0b5457 0%,#083a3e 46%,#052024 100%)' }}>
        <div className="catd-orb1" aria-hidden style={{ position: 'absolute', top: '-6%', right: '-30%', width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle,rgba(45,212,191,.34),transparent 62%)', filter: 'blur(28px)', pointerEvents: 'none' }} />
        <div className="catd-orb2" aria-hidden style={{ position: 'absolute', bottom: '6%', left: '-34%', width: 260, height: 260, borderRadius: '50%', background: 'radial-gradient(circle,rgba(251,109,76,.24),transparent 62%)', filter: 'blur(30px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(135deg,rgba(255,255,255,.04) 0 1.5px,transparent 1.5px 22px)', opacity: 0.6, pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', height: '100%' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '4px 6px 2px' }}>
            <span style={{ width: 38, height: 38, borderRadius: 12, background: 'var(--accent)', display: 'grid', placeItems: 'center', color: '#fff', font: '700 20px var(--f-display)', boxShadow: '0 10px 22px -8px var(--accent)' }}>A</span>
            <span style={{ font: '700 21px var(--f-display)', letterSpacing: '.17em', color: '#fff' }}>AVENTA</span>
          </Link>
          <div style={{ margin: '24px 6px 14px', height: 1, background: 'rgba(255,255,255,.12)' }} />
          <span style={{ padding: '0 8px', font: '600 10px var(--f-mono)', letterSpacing: '.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,.42)' }}>{cmlD.browse}</span>
          <nav style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 3, marginTop: 12 }}>
            <span aria-hidden style={{ position: 'absolute', left: 0, top: 0, width: 3, height: 44, borderRadius: 3, background: 'var(--accent)', boxShadow: '0 0 14px var(--accent)', transform: `translateY(${activeCatIdx * 47}px)`, transition: 'transform .38s cubic-bezier(.16,.84,.34,1)' }} />
            {catsD.map((c) => {
              const on = c.key === classFilter
              return (
                <button key={c.key} type="button" onClick={() => { setClassFilter(c.key); setNavOpen(false) }} className="catd-cat" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 12px', borderRadius: 12, border: 'none', cursor: 'pointer', font: '600 14.5px var(--f-display)', textAlign: 'left', color: on ? '#fff' : 'rgba(255,255,255,.72)', background: on ? 'rgba(255,255,255,.1)' : 'transparent' }}>
                  <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke={on ? '#fff' : 'rgba(255,255,255,.62)'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>{CAT_ICON[c.key]}</svg>
                  <span style={{ flex: 1 }}>{c.label}</span>
                  <span style={{ minWidth: 22, padding: '2px 7px', borderRadius: 999, textAlign: 'center', font: '600 11px var(--f-mono)', background: on ? 'var(--accent)' : 'rgba(255,255,255,.12)', color: '#fff' }}>{dCountFor(c.key)}</span>
                </button>
              )
            })}
          </nav>
          <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ position: 'relative', overflow: 'hidden', padding: '15px 15px 16px', borderRadius: 15, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ position: 'relative', width: 38, height: 38, borderRadius: '50%', background: 'linear-gradient(135deg,var(--accent),var(--accent-strong))', display: 'grid', placeItems: 'center', color: '#fff', font: '700 15px var(--f-display)', flexShrink: 0 }}>Е<span style={{ position: 'absolute', right: -1, bottom: -1, width: 10, height: 10, borderRadius: '50%', background: 'var(--ok)', border: '2px solid #093a3e' }} /></span>
                <div style={{ minWidth: 0 }}><div style={{ font: '700 13.5px var(--f-display)', color: '#fff', lineHeight: 1.15 }}>{cmlD.notSure}</div><div style={{ font: '500 11px var(--f-ui)', color: 'rgba(255,255,255,.6)', marginTop: 2 }}>{cmlD.elenaReplies}</div></div>
              </div>
              {contactWhatsapp && (
                <a href={contactWhatsapp} target="_blank" rel="noopener noreferrer" className="catd-ask" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 12, padding: 10, borderRadius: 11, background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.16)', color: '#fff', font: '700 13px var(--f-display)' }}><svg viewBox="0 0 24 24" width="15" height="15" fill="#25d366"><path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2Zm5.8 14.01c-.24.68-1.4 1.3-1.94 1.38-.5.07-1.13.1-1.82-.11-.42-.13-.96-.31-1.65-.61-2.9-1.25-4.79-4.17-4.94-4.36-.14-.19-1.18-1.57-1.18-2.99 0-1.42.75-2.12 1.01-2.41.26-.29.57-.36.76-.36.19 0 .38 0 .55.01.18.01.41-.07.65.5.24.57.82 1.99.89 2.13.07.14.12.31.02.5-.09.19-.14.31-.28.48-.14.17-.29.37-.42.5-.14.14-.28.29-.12.57.16.28.71 1.17 1.53 1.9 1.05.94 1.94 1.23 2.22 1.37.28.14.44.12.6-.07.16-.19.69-.8.87-1.08.18-.28.36-.23.61-.14.25.09 1.6.75 1.87.89.28.14.46.21.53.33.07.12.07.68-.17 1.36Z" /></svg>{cmlD.askElena}</a>
              )}
            </div>
            <div style={{ height: 1, background: 'rgba(255,255,255,.12)', margin: '0 6px' }} />
            {shellUser ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '2px 6px 4px' }}>
                <Link href="/account" style={{ position: 'relative', width: 40, height: 40, borderRadius: 13, background: 'linear-gradient(135deg,var(--accent),var(--accent-strong))', display: 'grid', placeItems: 'center', color: '#fff', font: '700 16px var(--f-display)', flexShrink: 0 }}>{shellUser.initial}<span style={{ position: 'absolute', right: -2, bottom: -2, width: 13, height: 13, borderRadius: '50%', background: 'var(--gold)', border: '2px solid #083a3e' }} /></Link>
                <Link href="/account" style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                  <span style={{ font: '700 14px var(--f-display)', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{shellUser.fullName}</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, font: '10.5px var(--f-mono)', letterSpacing: '.08em', color: 'var(--gold)' }}><svg viewBox="0 0 24 24" width="11" height="11" fill="currentColor" stroke="none"><polygon points="12 2 15 9 22 9.3 16.5 13.8 18.3 21 12 17 5.7 21 7.5 13.8 2 9.3 9 9" /></svg>{shellUser.tierName.toUpperCase()}</span>
                </Link>
                <form action={logoutAction} style={{ marginLeft: 'auto', display: 'flex' }}>
                  <button type="submit" className="catd-out" title="Sign out" style={{ width: 34, height: 34, borderRadius: 10, display: 'grid', placeItems: 'center', color: 'rgba(255,255,255,.6)', background: 'rgba(255,255,255,.06)', border: 'none', cursor: 'pointer' }}><svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" x2="9" y1="12" y2="12" /></svg></button>
                </form>
              </div>
            ) : (
              <Link href="/auth" className="catd-ask" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 12, borderRadius: 12, background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.16)', color: '#fff', font: '700 13.5px var(--f-display)' }}>{cmlD.signIn}</Link>
            )}
          </div>
        </div>
      </aside>

      {/* ═══════ MAIN ═══════ */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <header style={{ position: 'sticky', top: 0, zIndex: 60, display: 'flex', alignItems: 'center', gap: 14, padding: '13px 26px', background: 'rgba(238,246,245,.82)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', borderBottom: '1px solid var(--line)' }}>
          <button type="button" className="catd-burger" onClick={() => setNavOpen(true)} style={{ width: 42, height: 42, borderRadius: 11, border: '1px solid var(--line)', background: 'var(--surface)', color: 'var(--ink)', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="6" y2="6" /><line x1="4" x2="20" y1="12" y2="12" /><line x1="4" x2="20" y1="18" y2="18" /></svg></button>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ font: '600 10.5px var(--f-mono)', letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--muted-2)' }}>{lang === 'ru' ? 'Автопарк Aventa' : 'Aventa fleet'}</span>
            <span style={{ font: '700 16px var(--f-display)', color: 'var(--ink)', lineHeight: 1.1 }}>{t.title}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 'auto' }}>
            <label className="catd-search" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 13px', border: '1px solid var(--line)', borderRadius: 11, background: 'var(--surface)', width: 236 }}>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="var(--muted-2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={cmlD.searchPh} style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 13.5, color: 'var(--ink)', width: '100%' }} />
              {query && <button type="button" onClick={() => setQuery('')} style={{ border: 'none', background: 'transparent', color: 'var(--muted-2)', cursor: 'pointer', display: 'grid', placeItems: 'center', padding: 0 }}><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg></button>}
            </label>
            <span style={{ display: 'inline-flex' }}><LangToggle glass={false} /></span>
          </div>
        </header>

        <main style={{ flex: 1, padding: 'clamp(22px,3vw,40px) clamp(18px,3vw,40px) 60px' }}>
          <div style={{ maxWidth: 1240, margin: '0 auto', width: '100%' }}>
            {/* HERO */}
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
              <div>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 9, font: '600 12px var(--f-mono)', letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--accent-strong)' }}><span className="catd-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)' }} />{t.kicker} · {cars.length}</span>
                <h1 style={{ font: '700 clamp(32px,4.2vw,50px) var(--f-display)', lineHeight: 1.02, letterSpacing: '-.025em', color: 'var(--ink)', margin: '12px 0 0' }}>{t.title}</h1>
                <p style={{ font: '400 15.5px/1.55 var(--f-ui)', color: 'var(--muted)', margin: '11px 0 0', maxWidth: 520 }}>{t.subtitle}</p>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, maxWidth: 420, justifyContent: 'flex-end' }}>
                {[{ i: <><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" /><path d="M15 18H9" /><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62l-3.48-4.35A1 1 0 0 0 17.52 8H14" /><circle cx="17" cy="18" r="2" /><circle cx="7" cy="18" r="2" /></>, l: t.chipInstant === '' ? '' : (lang === 'ru' ? 'Бесплатная доставка' : 'Free delivery') }, { i: <path d="M13 2 3 14h9l-1 8 10-12h-9z" />, l: t.chipInstant }, { i: <><path d="M12 2v20" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></>, l: t.chipNoCard }].map((c) => (
                  <span key={c.l} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 13px', borderRadius: 999, background: 'var(--surface)', border: '1px solid var(--line)', font: '600 12.5px var(--f-ui)', color: 'var(--ink)', whiteSpace: 'nowrap' }}><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="var(--teal)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{c.i}</svg>{c.l}</span>
                ))}
              </div>
            </div>

            {/* FILTER TOOLBAR */}
            <div style={{ display: 'flex', alignItems: 'flex-end', flexWrap: 'wrap', gap: 14, marginTop: 26, background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 20, padding: '18px 20px', boxShadow: '0 1px 2px rgba(6,33,38,.04),0 22px 44px -34px rgba(6,33,38,.5)' }}>
              {[{ lbl: t.fFrom, v: startDate, set: setStartDate }, { lbl: t.fTo, v: endDate, set: setEndDate }].map((d) => (
                <label key={d.lbl} style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1, minWidth: 150 }}>
                  <span style={{ font: '600 9.5px var(--f-mono)', letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--muted-2)' }}>{d.lbl}</span>
                  <input type="date" value={d.v} onChange={(e) => d.set(e.target.value)} className="catd-field" style={dField} />
                </label>
              ))}
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1.3, minWidth: 190 }}>
                <span style={{ font: '600 9.5px var(--f-mono)', letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--muted-2)' }}>{lang === 'ru' ? 'Получение' : 'Pick-up'}</span>
                <div style={{ position: 'relative' }}>
                  <select value={pickup} onChange={(e) => setPickup(e.target.value)} className="catd-field" style={{ ...dField, padding: '12px 38px 12px 12px', cursor: 'pointer', appearance: 'none', WebkitAppearance: 'none' }}>
                    <option value="airport">{lang === 'ru' ? 'Аэропорт Анталии (AYT)' : 'Antalya Airport (AYT)'}</option>
                    <option value="hotel">{lang === 'ru' ? 'Ваш отель' : 'Your hotel'}</option>
                    <option value="office">{lang === 'ru' ? 'Городской офис' : 'City office'}</option>
                    <option value="seaside">{lang === 'ru' ? 'Побережье · Лара' : 'Seaside · Lara'}</option>
                  </select>
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}><path d="m6 9 6 6 6-6" /></svg>
                </div>
              </label>
              <button type="button" onClick={() => setOnlyAvailable((v) => !v)} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '12px 15px', border: '1.5px solid var(--line)', borderRadius: 13, background: 'var(--bg)', cursor: 'pointer', height: 46 }}>
                <span style={{ font: '700 13px var(--f-display)', color: 'var(--ink)', whiteSpace: 'nowrap' }}>{lang === 'ru' ? 'Свободные на даты' : 'Available for my dates'}</span>
                <span style={{ position: 'relative', width: 44, height: 26, borderRadius: 999, flexShrink: 0, background: onlyAvailable ? 'var(--teal)' : 'var(--bg-2)', transition: 'background .25s' }}><span style={{ position: 'absolute', top: 3, left: onlyAvailable ? 21 : 3, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left .25s cubic-bezier(.16,.84,.34,1)', boxShadow: '0 2px 6px rgba(0,0,0,.25)' }} /></span>
              </button>
              <button type="button" onClick={runSearch} className="catd-cta" style={{ position: 'relative', overflow: 'hidden', height: 46, padding: '0 22px', border: 'none', borderRadius: 13, background: 'var(--accent)', color: '#fff', font: '700 15px var(--f-display)', cursor: 'pointer', boxShadow: '0 12px 26px -12px var(--accent)', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <span className="catd-sheen" aria-hidden />
                <span style={{ position: 'relative' }}>{searching ? t.searching : t.update}</span>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'relative' }}><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
              </button>
            </div>
            {searchError && <div style={{ marginTop: 10, font: '600 13px var(--f-ui)', color: 'var(--accent-strong)' }}>{searchError}</div>}

            {/* RESULT ROW */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginTop: 22 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ font: '700 20px var(--f-display)', color: 'var(--ink)' }}>{visibleCars.length}</span>
                <span style={{ font: '500 13.5px var(--f-ui)', color: 'var(--muted)' }}>{cmlD.carsIn}</span>
                <span style={{ font: '700 14px var(--f-display)', color: 'var(--teal-700)' }}>{catLabelD}</span>
              </div>
              <div style={{ position: 'relative' }}>
                <button type="button" onClick={() => setSortOpen((v) => !v)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 14px', border: '1px solid var(--line)', borderRadius: 12, background: 'var(--surface)', color: 'var(--ink)', font: '700 13.5px var(--f-ui)', cursor: 'pointer' }}>
                  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="var(--muted)" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M7 12h10M11 18h2" /></svg>{sortLabelD}
                  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: sortOpen ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}><path d="m6 9 6 6 6-6" /></svg>
                </button>
                {sortOpen && (
                  <>
                    <div onClick={() => setSortOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
                    <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, zIndex: 41, minWidth: 220, background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 14, boxShadow: '0 24px 50px -20px rgba(6,33,38,.4)', padding: 6 }}>
                      {([{ k: 'rec', l: t.sortRec }, { k: 'low', l: t.sortLow }, { k: 'high', l: t.sortHigh }] as const).map((o) => (
                        <button key={o.k} type="button" onClick={() => { setSortKey(o.k); setSortOpen(false) }} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '11px 14px', borderRadius: 11, border: 'none', background: sortKey === o.k ? 'var(--teal-soft)' : 'transparent', color: 'var(--ink)', font: `${sortKey === o.k ? 700 : 500} 13.5px var(--f-ui)`, cursor: 'pointer' }}>
                          {o.l}<span style={{ width: 20, height: 20, borderRadius: '50%', flexShrink: 0, display: 'grid', placeItems: 'center', border: sortKey === o.k ? 'none' : '1.5px solid var(--line)', background: sortKey === o.k ? 'var(--teal)' : 'transparent' }}>{sortKey === o.k && <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>}</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* CAR GRID */}
            {visibleCars.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(332px,1fr))', gap: 22, marginTop: 18 }}>
                {visibleCars.map((car) => (
                  <div key={car.id} onClick={() => setDetailId(car.id)} className="catd-card" style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 20, overflow: 'hidden', boxShadow: '0 1px 2px rgba(6,33,38,.04),0 20px 44px -34px rgba(6,33,38,.55)', cursor: 'pointer', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ position: 'relative' }}>
                      {dCarImg(car, 206)}
                      <span style={{ position: 'absolute', top: 12, left: 12, padding: '5px 10px', borderRadius: 8, background: 'rgba(4,20,23,.5)', backdropFilter: 'blur(5px)', font: '600 9.5px var(--f-mono)', letterSpacing: '.12em', textTransform: 'uppercase', color: '#fff' }}>{car.clsLabel}</span>
                      <span style={{ position: 'absolute', top: 12, right: 12, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 11px', borderRadius: 999, font: '600 9.5px var(--f-mono)', color: '#fff', background: car.available ? 'rgba(15,157,111,.94)' : 'rgba(4,20,23,.62)', backdropFilter: 'blur(5px)' }}><span className="catd-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: car.available ? '#fff' : 'var(--accent)' }} />{car.available ? cmlD.available : cmlD.booked}</span>
                      <span style={{ position: 'absolute', bottom: 12, right: 14, font: '700 16px var(--f-display)', color: '#fff', textShadow: '0 2px 8px rgba(0,0,0,.5)' }}>{car.year}</span>
                    </div>
                    <div style={{ padding: '17px 18px 18px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                      <div style={{ font: '700 19px var(--f-display)', color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{car.brand} {car.model}</div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 4, marginTop: 13 }}>
                        {[{ i: 'gear' as const, v: car.gearboxLabel }, { i: 'fuel' as const, v: car.fuelLabel }, { i: 'seat' as const, v: String(car.seats) }, { i: 'ac' as const, v: 'A/C' }].map((s, idx) => (
                          <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, padding: 8, borderRadius: 11, background: 'var(--bg)' }}>{dSpecIcon(s.i)}<span style={{ font: '600 10px var(--f-mono)', color: 'var(--muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>{s.v}</span></div>
                        ))}
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 13 }}>
                        {[t.chipInstant, t.chipCash, t.chipNoCard].map((f) => (
                          <span key={f} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 9px', borderRadius: 8, background: 'var(--teal-soft)', color: 'var(--teal-700)', font: '600 11px var(--f-ui)' }}><svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>{f}</span>
                        ))}
                      </div>
                      <div style={{ height: 1, background: 'var(--line)', margin: '15px 0' }} />
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 10, marginTop: 'auto' }}>
                        <div>
                          <div><span style={{ font: '700 26px var(--f-display)', color: 'var(--ink)' }}>€{car.pricePerDay}</span><span style={{ font: '500 13px var(--f-ui)', color: 'var(--muted)' }}>{t.perDay}</span></div>
                          <div style={{ font: '500 11.5px var(--f-ui)', color: 'var(--muted-2)', marginTop: 2 }}>{t.deposit} €{car.deposit} · {car.mileageLimitPerDay ?? 250} km/day</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                          <button type="button" onClick={(e) => { e.stopPropagation(); setDetailId(car.id) }} title={cmlD.details} style={{ width: 44, height: 44, borderRadius: 12, border: '1.5px solid var(--line)', background: 'var(--surface)', color: 'var(--teal-700)', display: 'grid', placeItems: 'center', cursor: 'pointer' }}><svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6" /><path d="M10 14 21 3" /><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /></svg></button>
                          {car.available ? (
                            <Link href={`/booking?car=${car.slug}`} onClick={(e) => e.stopPropagation()} className="catd-cta" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, height: 44, padding: '0 16px', borderRadius: 12, background: 'var(--accent)', color: '#fff', font: '700 13.5px var(--f-display)', boxShadow: '0 12px 26px -12px var(--accent)' }}>{t.bookNow}<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg></Link>
                          ) : (
                            <button type="button" onClick={(e) => e.stopPropagation()} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, height: 44, padding: '0 14px', borderRadius: 12, border: '1.5px solid var(--line)', background: 'var(--surface)', color: 'var(--muted)', font: '700 13.5px var(--f-display)', cursor: 'pointer' }}><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>{cmlD.notify}</button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '56px 20px' }}>
                <div style={{ width: 64, height: 64, margin: '0 auto', borderRadius: 18, background: 'var(--teal-soft)', display: 'grid', placeItems: 'center', color: 'var(--teal)' }}><svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /><path d="M8 11h6" /></svg></div>
                <div style={{ marginTop: 16, font: '700 19px var(--f-display)', color: 'var(--ink)' }}>{t.emptyTitle}</div>
                <p style={{ margin: '8px auto 0', maxWidth: 340, font: '400 14px/1.6 var(--f-ui)', color: 'var(--muted)' }}>{t.emptyBody}</p>
                <button type="button" onClick={() => { setClassFilter('all'); setOnlyAvailable(false); setQuery(''); setAvailableSlugs(null) }} style={{ marginTop: 16, padding: '11px 20px', borderRadius: 12, border: '1.5px solid var(--line)', background: 'var(--surface)', color: 'var(--ink)', font: '700 13.5px var(--f-display)', cursor: 'pointer' }}>{t.reset}</button>
              </div>
            )}

            {visibleCars.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, margin: '30px auto 0', maxWidth: 620 }}>
                <span style={{ flex: 1, height: 1, background: 'var(--line)' }} />
                <span style={{ font: '500 12px var(--f-ui)', color: 'var(--muted-2)', whiteSpace: 'nowrap' }}>{cmlD.wholeFleet}</span>
                <span style={{ flex: 1, height: 1, background: 'var(--line)' }} />
              </div>
            )}
          </div>
        </main>
      </div>

      {/* ═══════ DETAIL DRAWER ═══════ */}
      <div onClick={() => setDetailId(null)} style={{ position: 'fixed', inset: 0, zIndex: 125, background: 'rgba(4,20,23,.5)', opacity: detailCarD ? 1 : 0, pointerEvents: detailCarD ? 'auto' : 'none', transition: 'opacity .32s' }} />
      <div className="catd-drawer" style={{ position: 'fixed', top: 0, right: 0, height: '100vh', width: 'min(460px,94vw)', zIndex: 130, display: 'flex', flexDirection: 'column', background: 'var(--bg)', boxShadow: '-30px 0 80px -30px rgba(6,33,38,.5)', transform: detailCarD ? 'translateX(0)' : 'translateX(101%)', pointerEvents: detailCarD ? 'auto' : 'none' }}>
        {detailCarD && (
          <>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              {dCarImg(detailCarD, 248)}
              <button type="button" onClick={() => setDetailId(null)} style={{ position: 'absolute', top: 16, right: 16, width: 38, height: 38, borderRadius: 12, border: 'none', background: 'rgba(4,20,23,.5)', backdropFilter: 'blur(6px)', color: '#fff', display: 'grid', placeItems: 'center', cursor: 'pointer' }}><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg></button>
              <span style={{ position: 'absolute', top: 16, left: 16, padding: '6px 11px', borderRadius: 999, background: 'rgba(4,20,23,.5)', backdropFilter: 'blur(6px)', font: '600 10px var(--f-mono)', letterSpacing: '.06em', textTransform: 'uppercase', color: '#fff' }}>{detailCarD.clsLabel} · {detailCarD.year}</span>
              <h2 style={{ position: 'absolute', left: 20, bottom: 16, font: '700 27px var(--f-display)', color: '#fff', margin: 0, textShadow: '0 2px 10px rgba(0,0,0,.5)' }}>{detailCarD.brand} {detailCarD.model}</h2>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
                {[{ i: 'gear' as const, v: detailCarD.gearboxLabel }, { i: 'fuel' as const, v: detailCarD.fuelLabel }, { i: 'seat' as const, v: `${detailCarD.seats}` }, { i: 'ac' as const, v: 'A/C' }].map((s, idx) => (
                  <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '13px 4px', borderRadius: 14, background: 'var(--surface)', border: '1px solid var(--line)' }}>{dSpecIcon(s.i)}<span style={{ font: '600 10.5px var(--f-ui)', color: 'var(--muted)', textAlign: 'center' }}>{s.v}</span></div>
                ))}
              </div>
              <div style={{ marginTop: 8, font: '600 10px var(--f-mono)', letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--muted)', padding: '12px 2px 0' }}>{cmlD.included}</div>
              <div style={{ marginTop: 8, background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 16, padding: 16 }}>
                {[cmlD.kmIncl(detailCarD.mileageLimitPerDay), cmlD.fuel, cmlD.road, cmlD.cancel, cmlD.insur, cmlD.delivery].map((it) => (
                  <div key={it} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', font: '600 14px var(--f-ui)', color: 'var(--ink)' }}><span style={{ width: 28, height: 28, borderRadius: 9, flexShrink: 0, background: 'var(--ok-soft)', color: 'var(--ok)', display: 'grid', placeItems: 'center' }}><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg></span>{it}</div>
                ))}
              </div>
              <div style={{ marginTop: 14, background: 'linear-gradient(120deg,var(--teal-soft),rgba(13,148,136,.02))', border: '1px solid rgba(13,148,136,.18)', borderRadius: 16, padding: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div><div style={{ font: '600 10px var(--f-mono)', letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--teal-700)' }}>{cmlD.refDeposit}</div><div style={{ font: '700 20px var(--f-display)', color: 'var(--ink)', marginTop: 5 }}>€{detailCarD.deposit}</div></div>
                <div><div style={{ font: '600 10px var(--f-mono)', letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--teal-700)' }}>{cmlD.minAge}</div><div style={{ font: '600 13.5px var(--f-ui)', color: 'var(--ink)', marginTop: 7 }}>{cmlD.minAgeVal}</div></div>
              </div>
            </div>
            <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px', borderTop: '1px solid var(--line)', background: 'var(--surface)' }}>
              <div style={{ minWidth: 0 }}><div><span style={{ font: '700 26px var(--f-display)', color: 'var(--ink)' }}>€{detailCarD.pricePerDay}</span><span style={{ font: '500 13px var(--f-ui)', color: 'var(--muted)' }}>{t.perDay}</span></div><div style={{ font: '500 11px var(--f-ui)', color: 'var(--muted-2)' }}>{cmlD.taxes}</div></div>
              <Link href={`/booking?car=${detailCarD.slug}`} className="catd-cta" style={{ position: 'relative', overflow: 'hidden', marginLeft: 'auto', flex: 1, maxWidth: 240, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '14px 20px', borderRadius: 14, background: 'var(--accent)', color: '#fff', font: '700 15px var(--f-display)', boxShadow: '0 12px 26px -12px var(--accent)' }}><span className="catd-sheen" aria-hidden /><span style={{ position: 'relative' }}>{cmlD.bookThis}</span><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'relative' }}><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg></Link>
            </div>
          </>
        )}
      </div>
    </div>
  )

}
