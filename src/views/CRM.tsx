'use client'

import type { CSSProperties } from 'react'
import AdminShell from '../components/AdminShell'
import { useIsMobile } from '@/components/useIsMobile'
import { useDict, type Dict } from '../i18n/lang'
import type {
  CrmFleet,
  CrmInterestRow,
  CrmKpis,
  CrmProfitCar,
  CrmRevenueDay,
  CrmTodayEvent,
} from '../app/crm/page'

/* ----------------------------------------------------------------------------
 * Props — all real, serialized data from the server route.
 * ------------------------------------------------------------------------- */

interface CRMProps {
  monthLabel: string
  kpis: CrmKpis
  fleet: CrmFleet
  revenueSeries: CrmRevenueDay[]
  profitCars: CrmProfitCar[]
  interest: CrmInterestRow[]
  todayEvents: CrmTodayEvent[]
  returnsDueTodayCount: number
}

/* ----------------------------------------------------------------------------
 * i18n — user-facing strings (RU is the authored source; en/tr/es/de translated)
 * ------------------------------------------------------------------------- */

interface Strings {
  shellTitle: string
  shellSubtitle: (month: string) => string
  rangeToday: string
  rangeWeek: string
  rangeMonth: string
  report: string
  kpiRevenueMonth: string
  kpiRevenueDay: string
  kpiAverageCheck: string
  kpiUtilization: string
  handoversToday: (n: number) => string
  averageDays: (n: number) => string
  utilizationNote: (rented: number, free: number) => string
  revenueTitle: string
  revenueSubtitle: string
  fleetStatusTitle: string
  carsUnit: string
  eventsToday: string
  noEventsToday: string
  fleetInRent: string
  fleetFree: string
  fleetService: string
  profitTitle: string
  forMonth: (month: string) => string
  noDataForPeriod: string
  leaderBadge: string
  interestsTitle: string
  interestsSource: string
  interestsDescription: string
  noInterestRequests: string
  insightInterest: (pct: number, label: string) => string
  insightLoad: (util: number, returns: number) => string
  insightBestCar: string
}

const dict: Dict<Strings> = {
  ru: {
    shellTitle: 'Дашборд бизнеса',
    shellSubtitle: (month) => `Сводка по автопарку · ${month}`,
    rangeToday: 'Сегодня',
    rangeWeek: 'Неделя',
    rangeMonth: 'Месяц',
    report: 'Отчёт',
    kpiRevenueMonth: 'ДОХОД ЗА МЕСЯЦ',
    kpiRevenueDay: 'ДОХОД ЗА ДЕНЬ',
    kpiAverageCheck: 'СРЕДНИЙ ЧЕК',
    kpiUtilization: 'ЗАГРУЗКА ПАРКА',
    handoversToday: (n) => `${n} выдач сегодня`,
    averageDays: (n) => `за ${n} сут. в среднем`,
    utilizationNote: (rented, free) => `${rented} в аренде · ${free} свободно`,
    revenueTitle: 'Доход · последние 14 дней',
    revenueSubtitle: 'Аренда + дополнительные услуги',
    fleetStatusTitle: 'Статус автопарка',
    carsUnit: 'авто',
    eventsToday: 'СОБЫТИЯ СЕГОДНЯ',
    noEventsToday: 'Событий на сегодня нет',
    fleetInRent: 'В аренде',
    fleetFree: 'Свободно',
    fleetService: 'На обслуживании',
    profitTitle: 'Прибыль по автомобилям',
    forMonth: (month) => `за ${month}`,
    noDataForPeriod: 'Нет данных за период',
    leaderBadge: 'ЛИДЕР',
    interestsTitle: 'Интересы клиентов',
    interestsSource: 'из умного подбора',
    interestsDescription: 'Доля заявок, где клиент отметил потребность',
    noInterestRequests: 'Пока нет заявок из умного подбора',
    insightInterest: (pct, label) => `${pct}% клиентов в этом месяце отметили «${label}».`,
    insightLoad: (util, returns) => `Загрузка парка — ${util}%, возвратов сегодня — ${returns}.`,
    insightBestCar: 'Самый прибыльный автомобиль —',
  },
  en: {
    shellTitle: 'Business dashboard',
    shellSubtitle: (month) => `Fleet summary · ${month}`,
    rangeToday: 'Today',
    rangeWeek: 'Week',
    rangeMonth: 'Month',
    report: 'Report',
    kpiRevenueMonth: 'REVENUE THIS MONTH',
    kpiRevenueDay: 'REVENUE TODAY',
    kpiAverageCheck: 'AVERAGE CHECK',
    kpiUtilization: 'FLEET UTILIZATION',
    handoversToday: (n) => `${n} handovers today`,
    averageDays: (n) => `${n} days on average`,
    utilizationNote: (rented, free) => `${rented} rented · ${free} free`,
    revenueTitle: 'Revenue · last 14 days',
    revenueSubtitle: 'Rental + additional services',
    fleetStatusTitle: 'Fleet status',
    carsUnit: 'cars',
    eventsToday: 'TODAY’S EVENTS',
    noEventsToday: 'No events for today',
    fleetInRent: 'Rented',
    fleetFree: 'Free',
    fleetService: 'In service',
    profitTitle: 'Profit by car',
    forMonth: (month) => `for ${month}`,
    noDataForPeriod: 'No data for this period',
    leaderBadge: 'LEADER',
    interestsTitle: 'Customer interests',
    interestsSource: 'from smart matching',
    interestsDescription: 'Share of requests where the customer flagged a need',
    noInterestRequests: 'No requests from smart matching yet',
    insightInterest: (pct, label) => `${pct}% of customers this month flagged “${label}”.`,
    insightLoad: (util, returns) => `Fleet utilization — ${util}%, returns today — ${returns}.`,
    insightBestCar: 'Most profitable car —',
  },
  tr: {
    shellTitle: 'İşletme panosu',
    shellSubtitle: (month) => `Filo özeti · ${month}`,
    rangeToday: 'Bugün',
    rangeWeek: 'Hafta',
    rangeMonth: 'Ay',
    report: 'Rapor',
    kpiRevenueMonth: 'AYLIK GELİR',
    kpiRevenueDay: 'GÜNLÜK GELİR',
    kpiAverageCheck: 'ORTALAMA SEPET',
    kpiUtilization: 'FİLO DOLULUĞU',
    handoversToday: (n) => `bugün ${n} teslim`,
    averageDays: (n) => `ortalama ${n} gün`,
    utilizationNote: (rented, free) => `${rented} kirada · ${free} müsait`,
    revenueTitle: 'Gelir · son 14 gün',
    revenueSubtitle: 'Kiralama + ek hizmetler',
    fleetStatusTitle: 'Filo durumu',
    carsUnit: 'araç',
    eventsToday: 'BUGÜNKÜ ETKİNLİKLER',
    noEventsToday: 'Bugün için etkinlik yok',
    fleetInRent: 'Kirada',
    fleetFree: 'Müsait',
    fleetService: 'Bakımda',
    profitTitle: 'Araç bazında kâr',
    forMonth: (month) => `${month} için`,
    noDataForPeriod: 'Bu dönem için veri yok',
    leaderBadge: 'LİDER',
    interestsTitle: 'Müşteri ilgi alanları',
    interestsSource: 'akıllı eşleştirmeden',
    interestsDescription: 'Müşterinin bir ihtiyaç belirttiği taleplerin oranı',
    noInterestRequests: 'Henüz akıllı eşleştirmeden talep yok',
    insightInterest: (pct, label) => `Bu ay müşterilerin %${pct} kadarı «${label}» belirtti.`,
    insightLoad: (util, returns) => `Filo doluluğu — %${util}, bugün iade — ${returns}.`,
    insightBestCar: 'En kârlı araç —',
  },
  es: {
    shellTitle: 'Panel del negocio',
    shellSubtitle: (month) => `Resumen de la flota · ${month}`,
    rangeToday: 'Hoy',
    rangeWeek: 'Semana',
    rangeMonth: 'Mes',
    report: 'Informe',
    kpiRevenueMonth: 'INGRESOS DEL MES',
    kpiRevenueDay: 'INGRESOS DEL DÍA',
    kpiAverageCheck: 'TICKET MEDIO',
    kpiUtilization: 'USO DE LA FLOTA',
    handoversToday: (n) => `${n} entregas hoy`,
    averageDays: (n) => `${n} días de media`,
    utilizationNote: (rented, free) => `${rented} alquilados · ${free} libres`,
    revenueTitle: 'Ingresos · últimos 14 días',
    revenueSubtitle: 'Alquiler + servicios adicionales',
    fleetStatusTitle: 'Estado de la flota',
    carsUnit: 'autos',
    eventsToday: 'EVENTOS DE HOY',
    noEventsToday: 'No hay eventos para hoy',
    fleetInRent: 'Alquilados',
    fleetFree: 'Libres',
    fleetService: 'En mantenimiento',
    profitTitle: 'Beneficio por auto',
    forMonth: (month) => `de ${month}`,
    noDataForPeriod: 'Sin datos del periodo',
    leaderBadge: 'LÍDER',
    interestsTitle: 'Intereses de clientes',
    interestsSource: 'del emparejamiento inteligente',
    interestsDescription: 'Proporción de solicitudes donde el cliente indicó una necesidad',
    noInterestRequests: 'Aún no hay solicitudes del emparejamiento inteligente',
    insightInterest: (pct, label) => `El ${pct}% de los clientes este mes indicó «${label}».`,
    insightLoad: (util, returns) => `Uso de la flota — ${util}%, devoluciones hoy — ${returns}.`,
    insightBestCar: 'El auto más rentable —',
  },
  de: {
    shellTitle: 'Business-Dashboard',
    shellSubtitle: (month) => `Flottenübersicht · ${month}`,
    rangeToday: 'Heute',
    rangeWeek: 'Woche',
    rangeMonth: 'Monat',
    report: 'Bericht',
    kpiRevenueMonth: 'MONATSUMSATZ',
    kpiRevenueDay: 'TAGESUMSATZ',
    kpiAverageCheck: 'Ø BUCHUNGSWERT',
    kpiUtilization: 'FLOTTENAUSLASTUNG',
    handoversToday: (n) => `${n} Übergaben heute`,
    averageDays: (n) => `${n} Tage im Schnitt`,
    utilizationNote: (rented, free) => `${rented} vermietet · ${free} frei`,
    revenueTitle: 'Umsatz · letzte 14 Tage',
    revenueSubtitle: 'Miete + Zusatzleistungen',
    fleetStatusTitle: 'Flottenstatus',
    carsUnit: 'Autos',
    eventsToday: 'HEUTIGE EREIGNISSE',
    noEventsToday: 'Keine Ereignisse für heute',
    fleetInRent: 'Vermietet',
    fleetFree: 'Frei',
    fleetService: 'In Wartung',
    profitTitle: 'Gewinn pro Auto',
    forMonth: (month) => `für ${month}`,
    noDataForPeriod: 'Keine Daten für den Zeitraum',
    leaderBadge: 'SPITZE',
    interestsTitle: 'Kundeninteressen',
    interestsSource: 'aus Smart-Matching',
    interestsDescription: 'Anteil der Anfragen, in denen der Kunde einen Bedarf angab',
    noInterestRequests: 'Noch keine Anfragen aus Smart-Matching',
    insightInterest: (pct, label) => `${pct}% der Kunden gaben diesen Monat „${label}“ an.`,
    insightLoad: (util, returns) => `Flottenauslastung — ${util}%, Rückgaben heute — ${returns}.`,
    insightBestCar: 'Profitabelstes Auto —',
  },
}

/* ----------------------------------------------------------------------------
 * Shared style fragments
 * ------------------------------------------------------------------------- */

const panel: CSSProperties = {
  background: '#0C3540',
  border: '1px solid rgba(255,255,255,.07)',
  borderRadius: 16,
}

const monoLabel: CSSProperties = {
  font: '400 10px var(--f-mono)',
  letterSpacing: '.1em',
  color: '#7E92AE',
}

const sectionTitle: CSSProperties = {
  font: '600 17px var(--f-ui)',
  color: '#ECF1F8',
}

/* ----------------------------------------------------------------------------
 * Page
 * ------------------------------------------------------------------------- */

export default function CRM({
  monthLabel,
  kpis,
  fleet,
  revenueSeries,
  profitCars,
  interest,
  todayEvents,
  returnsDueTodayCount,
}: CRMProps) {
  const isMobile = useIsMobile()
  const t = useDict(dict)
  // Panels get tighter padding on a phone so the numbers/charts keep their room.
  const panelPad = isMobile ? '16px 14px' : '22px 24px'

  /* ---- Derived view-model (heights/widths as % of the tallest bar) ---- */
  const revMax = Math.max(1, ...revenueSeries.map((r) => r.value))
  const revBars = revenueSeries.map((r, idx) => {
    const isLast = idx === revenueSeries.length - 1
    return {
      day: r.day,
      height: Math.round((r.value / revMax) * 100),
      background: isLast ? 'linear-gradient(180deg,#FFB48A,#FF7A5C)' : 'rgba(255,122,92,.4)',
    }
  })

  const profitMax = Math.max(1, ...profitCars.map((p) => p.value))
  const profitBars = profitCars.map((p, idx) => ({
    name: p.name,
    profit: p.label,
    best: idx === 0 && p.value > 0,
    width: Math.round((p.value / profitMax) * 100),
    background: idx === 0 ? 'linear-gradient(90deg,#FF7A5C,#FFB48A)' : 'rgba(255,122,92,.45)',
  }))

  const interestBars = interest.map((i) => ({
    label: i.label,
    pct: i.pct,
    width: i.pct,
    background: 'linear-gradient(90deg,#4E7FE0,#7CA0F0)',
  }))

  /* ---- Fleet-status donut: conic-gradient from real free/rented/other ---- */
  const fleetTotal = Math.max(1, fleet.total)
  const rentedEnd = (fleet.rented / fleetTotal) * 100
  const freeEnd = rentedEnd + (fleet.free / fleetTotal) * 100
  const donutGradient =
    `conic-gradient(#6FBF8F 0 ${rentedEnd}%,#E0A23E ${rentedEnd}% ${freeEnd}%,` +
    `rgba(255,255,255,.08) ${freeEnd}% 100%)`

  const donutSlices = [
    { label: t.fleetInRent, count: fleet.rented, dot: '#6FBF8F', labelColor: '#ECF1F8', countColor: '#F4F7FB' },
    { label: t.fleetFree, count: fleet.free, dot: '#E0A23E', labelColor: '#ECF1F8', countColor: '#F4F7FB' },
    { label: t.fleetService, count: fleet.service, dot: 'rgba(255,255,255,.18)', labelColor: '#9CB0CB', countColor: '#9CB0CB' },
  ]

  /* ---- KPI cards (real numbers, design preserved) ---- */
  const kpiCards = [
    {
      label: t.kpiRevenueMonth,
      value: kpis.revenueMonth,
      note: `${monthLabel}`,
      noteColor: '#8FD7AD',
      accent: false,
    },
    {
      label: t.kpiRevenueDay,
      value: kpis.revenueTodayLabel,
      note: t.handoversToday(kpis.handoversToday),
      noteColor: '#8FD7AD',
      accent: false,
    },
    {
      label: t.kpiAverageCheck,
      value: kpis.averageCheck,
      note: t.averageDays(kpis.averageDays),
      noteColor: '#9CB0CB',
      accent: false,
    },
    {
      label: t.kpiUtilization,
      value: `${kpis.utilizationPct}%`,
      note: t.utilizationNote(fleet.rented, fleet.free),
      noteColor: '#9CB0CB',
      accent: true,
    },
  ]

  const bestCar = profitBars.find((p) => p.best)

  return (
    <AdminShell active="dashboard" title={t.shellTitle} subtitle={t.shellSubtitle(monthLabel)}>
      {/* Header range toggle + report action */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: isMobile ? 'flex-start' : 'flex-end', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <div
          style={{
            display: 'flex',
            border: '1px solid rgba(255,255,255,.1)',
            borderRadius: 10,
            overflow: 'hidden',
            font: '600 12px var(--f-ui)',
          }}
        >
          <span style={{ padding: '9px 14px', color: '#9CB0CB' }}>{t.rangeToday}</span>
          <span style={{ padding: '9px 14px', color: '#9CB0CB' }}>{t.rangeWeek}</span>
          <span style={{ padding: '9px 14px', background: '#FF7A5C', color: '#082A33' }}>{t.rangeMonth}</span>
        </div>
        <span
          style={{
            padding: '10px 16px',
            border: '1px solid rgba(255,122,92,.4)',
            color: '#FFB48A',
            borderRadius: 10,
            font: '600 12px var(--f-ui)',
          }}
        >
          {t.report}
        </span>
      </div>

      {/* KPI cards — 4-up on desktop, a comfortable 2-up on a phone so every number stays legible */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: isMobile ? 12 : 16 }}>
        {kpiCards.map((k) => (
          <div
            key={k.label}
            style={{
              background: k.accent ? 'linear-gradient(150deg,#125060,#0C3540)' : '#0C3540',
              border: k.accent ? '1px solid rgba(255,122,92,.3)' : '1px solid rgba(255,255,255,.07)',
              borderRadius: 16,
              padding: isMobile ? 16 : 22,
            }}
          >
            <div style={monoLabel}>{k.label}</div>
            <div
              style={{
                marginTop: isMobile ? 8 : 10,
                font: `700 ${isMobile ? 24 : 30}px var(--f-ui)`,
                color: k.accent ? '#FFB48A' : '#F4F7FB',
              }}
            >
              {k.value}
            </div>
            <div style={{ marginTop: 8, font: '600 12px var(--f-ui)', color: k.noteColor }}>{k.note}</div>
          </div>
        ))}
      </div>

      {/* Revenue chart + fleet status */}
      <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.55fr 1fr', gap: 16 }}>
        {/* 14-day revenue bar chart */}
        <div style={{ ...panel, padding: panelPad }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 10, marginBottom: 20 }}>
            <div>
              <div style={{ ...sectionTitle, whiteSpace: isMobile ? 'normal' : 'nowrap' }}>{t.revenueTitle}</div>
              <div style={{ marginTop: 3, font: '400 12px var(--f-ui)', color: '#9CB0CB' }}>
                {t.revenueSubtitle}
              </div>
            </div>
            <div style={{ font: '700 20px var(--f-ui)', color: '#F4F7FB' }}>{kpis.revenueMonth}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 180 }}>
            {revBars.map((r, idx) => (
              <div
                key={`${r.day}-${idx}`}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-end',
                  alignItems: 'center',
                  height: '100%',
                  gap: 7,
                }}
              >
                <div
                  style={{
                    width: '100%',
                    borderRadius: '5px 5px 0 0',
                    height: `${r.height}%`,
                    background: r.background,
                  }}
                />
                <div style={{ font: '400 9px var(--f-mono)', color: '#5b6f8a' }}>{r.day}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Fleet status donut + today's events */}
        <div style={{ ...panel, padding: panelPad }}>
          <div style={{ ...sectionTitle, marginBottom: 18 }}>{t.fleetStatusTitle}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
            <div
              style={{
                width: 128,
                height: 128,
                borderRadius: '50%',
                flexShrink: 0,
                background: donutGradient,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div
                style={{
                  width: 88,
                  height: 88,
                  borderRadius: '50%',
                  background: '#0C3540',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <div style={{ font: '700 22px var(--f-ui)', color: '#F4F7FB' }}>{fleet.total}</div>
                <div style={{ font: '400 9px var(--f-mono)', color: '#7E92AE' }}>{t.carsUnit}</div>
              </div>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {donutSlices.map((s) => (
                <div key={s.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      font: '500 13px var(--f-ui)',
                      color: s.labelColor,
                    }}
                  >
                    <span style={{ width: 9, height: 9, borderRadius: 3, background: s.dot }} />
                    {s.label}
                  </span>
                  <span style={{ font: '700 14px var(--f-ui)', color: s.countColor }}>{s.count}</span>
                </div>
              ))}
            </div>
          </div>
          {/* Today's events */}
          <div style={{ marginTop: 18, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,.08)' }}>
            <div style={{ ...monoLabel, marginBottom: 12 }}>{t.eventsToday}</div>
            {todayEvents.length === 0 ? (
              <div style={{ font: '500 13px var(--f-ui)', color: '#7E92AE' }}>{t.noEventsToday}</div>
            ) : (
              todayEvents.map((e, i) => (
                <div
                  key={`${e.title}-${i}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: i < todayEvents.length - 1 ? 10 : 0,
                  }}
                >
                  <span style={{ font: '500 13px var(--f-ui)', color: '#ECF1F8' }}>{e.title}</span>
                  <span
                    style={{
                      font: '500 12px var(--f-ui)',
                      color: e.kind === 'return' ? '#E7B463' : '#8FD7AD',
                    }}
                  >
                    {e.meta}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Profit per car + client interest */}
      <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
        {/* Profit per car horizontal bars */}
        <div style={{ ...panel, padding: panelPad }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <div style={sectionTitle}>{t.profitTitle}</div>
            <div style={{ font: '400 11px var(--f-ui)', color: '#9CB0CB' }}>{t.forMonth(monthLabel)}</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {profitBars.length === 0 ? (
              <div style={{ font: '500 13px var(--f-ui)', color: '#7E92AE' }}>{t.noDataForPeriod}</div>
            ) : (
              profitBars.map((p) => (
                <div key={p.name}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ font: '500 13px var(--f-ui)', color: '#ECF1F8' }}>
                      {p.name}
                      {p.best && (
                        <span
                          style={{
                            marginLeft: 6,
                            font: '600 9px var(--f-ui)',
                            color: '#082A33',
                            background: '#FF7A5C',
                            borderRadius: 999,
                            padding: '2px 7px',
                          }}
                        >
                          {t.leaderBadge}
                        </span>
                      )}
                    </span>
                    <span style={{ font: '700 13px var(--f-ui)', color: '#F4F7FB' }}>{p.profit}</span>
                  </div>
                  <div
                    style={{
                      height: 8,
                      borderRadius: 4,
                      background: 'rgba(255,255,255,.06)',
                      overflow: 'hidden',
                    }}
                  >
                    <div style={{ height: '100%', borderRadius: 4, width: `${p.width}%`, background: p.background }} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Client interest bars */}
        <div style={{ ...panel, padding: panelPad }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <div style={sectionTitle}>{t.interestsTitle}</div>
            <div style={{ font: '400 11px var(--f-ui)', color: '#9CB0CB' }}>{t.interestsSource}</div>
          </div>
          <div style={{ font: '400 12px/1.5 var(--f-ui)', color: '#7E92AE', marginBottom: 16 }}>
            {t.interestsDescription}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {interestBars.length === 0 ? (
              <div style={{ font: '500 13px var(--f-ui)', color: '#7E92AE' }}>{t.noInterestRequests}</div>
            ) : (
              interestBars.map((i) => (
                <div key={i.label}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ font: '500 13px var(--f-ui)', color: '#ECF1F8' }}>{i.label}</span>
                    <span style={{ font: '700 13px var(--f-ui)', color: '#FFB48A' }}>{i.pct}%</span>
                  </div>
                  <div
                    style={{
                      height: 8,
                      borderRadius: 4,
                      background: 'rgba(255,255,255,.06)',
                      overflow: 'hidden',
                    }}
                  >
                    <div style={{ height: '100%', borderRadius: 4, width: `${i.width}%`, background: i.background }} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Insight banner */}
      <div
        style={{
          marginTop: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          background: 'linear-gradient(120deg,#114451,#0C3540)',
          border: '1px solid rgba(255,122,92,.22)',
          borderRadius: 14,
          padding: '16px 22px',
        }}
      >
        <span style={{ color: '#FFB48A', font: '600 16px var(--f-ui)' }}>✦</span>
        <span style={{ font: '400 13px var(--f-ui)', color: '#C9D4E4' }}>
          {interest.length > 0 && interest[0] ? (
            <>
              {t.insightInterest(interest[0].pct, interest[0].label)}{' '}
            </>
          ) : null}
          {t.insightLoad(kpis.utilizationPct, returnsDueTodayCount)}
          {bestCar ? (
            <>
              {' '}{t.insightBestCar}{' '}
              <span style={{ color: '#FFB48A' }}>{bestCar.name}</span>.
            </>
          ) : null}
        </span>
      </div>
    </AdminShell>
  )
}
