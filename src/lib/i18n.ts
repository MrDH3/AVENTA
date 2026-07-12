import { cookies } from 'next/headers'
import { prisma } from './db'

// Mirror of the client LANGUAGES registry (kept here to avoid importing a 'use client' module
// into server code). Keep in sync with src/i18n/lang.tsx.
export type Locale = 'ru' | 'en' | 'tr' | 'es' | 'de'
export const LOCALES: Locale[] = ['en', 'ru', 'tr', 'es', 'de']
export const DEFAULT_LOCALE: Locale = 'en'
const LANG_COOKIE = 'aventa_lang'

/** Resolve the active locale from the cookie (server components). English is the default. */
export function getLocale(): Locale {
  const v = cookies().get(LANG_COOKIE)?.value
  return v && (LOCALES as string[]).includes(v) ? (v as Locale) : DEFAULT_LOCALE
}

/**
 * Admin-editable site strings, keyed and localized. Static defaults live here;
 * rows in SiteContent override them so staff can edit copy without a deploy.
 */
export const SITE_DEFAULTS: Record<string, Partial<Record<Locale, string>> & { en: string }> = {
  'home.hero.title': {
    ru: 'Ваше море, солнце и дорога — начинаются здесь',
    en: 'Your sea, sun and the open road — start here',
  },
  'home.hero.sub': {
    ru: 'Премиум-парк, подача в аэропорт и к морю, трансферы, экскурсии и недвижимость — в одном бронировании.',
    en: 'Premium fleet, airport & seaside delivery, transfers, tours and real estate — all in one booking.',
  },
  'company.name': { ru: 'AVENTA', en: 'AVENTA' },
  'company.phone': { ru: '+90 555 000 00 00', en: '+90 555 000 00 00' },
  'company.email': { ru: 'hello@aventa.rent', en: 'hello@aventa.rent' },
  'company.address': { ru: 'Анталия, Турция', en: 'Antalya, Türkiye' },
}

export type SiteStrings = Record<string, string>

/** Load merged site strings for a locale (DB overrides on top of defaults). */
export async function getSiteContent(locale: Locale = getLocale()): Promise<SiteStrings> {
  const base: SiteStrings = {}
  for (const [key, byLocale] of Object.entries(SITE_DEFAULTS)) base[key] = byLocale[locale] ?? byLocale.en
  try {
    const rows = await prisma.siteContent.findMany({ where: { locale } })
    for (const r of rows) base[r.key] = r.value
  } catch {
    /* DB not ready — defaults only */
  }
  return base
}
