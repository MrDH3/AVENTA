import 'server-only'
import { prisma } from './db'

/** Plain, serializable shapes for client components (no Date fields). */
export interface CityRow {
  id: string
  name: string
  country: string
  enabled: boolean
  order: number
}
export interface OfficeRow {
  id: string
  name: string
  address: string
  city: string | null
  country: string
  lat: number
  lng: number
  enabled: boolean
  order: number
}

const CITY_SELECT = { id: true, name: true, country: true, enabled: true, order: true } as const
const OFFICE_SELECT = { id: true, name: true, address: true, city: true, country: true, lat: true, lng: true, enabled: true, order: true } as const

/** All cities (admin view), ordered. */
export async function listCitiesAdmin(): Promise<CityRow[]> {
  return prisma.city.findMany({ select: CITY_SELECT, orderBy: [{ order: 'asc' }, { name: 'asc' }] })
}

/** Only enabled cities (customer booking form), ordered. */
export async function listEnabledCities(): Promise<CityRow[]> {
  return prisma.city.findMany({ where: { enabled: true }, select: CITY_SELECT, orderBy: [{ order: 'asc' }, { name: 'asc' }] })
}

/** All offices (admin view), ordered. */
export async function listOfficesAdmin(): Promise<OfficeRow[]> {
  return prisma.office.findMany({ select: OFFICE_SELECT, orderBy: [{ order: 'asc' }, { name: 'asc' }] })
}

/** Only enabled offices (customer booking form), ordered. */
export async function listEnabledOffices(): Promise<OfficeRow[]> {
  return prisma.office.findMany({ where: { enabled: true }, select: OFFICE_SELECT, orderBy: [{ order: 'asc' }, { name: 'asc' }] })
}

/** The office a customer picks up from by default (first enabled). */
export async function getPrimaryOffice(): Promise<OfficeRow | null> {
  const offices = await listEnabledOffices()
  return offices[0] ?? null
}

/**
 * Default country for the booking form — derived from admin data (the first
 * enabled city's country), NOT hardcoded; falls back to Türkiye if empty.
 */
export async function getDefaultCountry(): Promise<string> {
  const first = await prisma.city.findFirst({ where: { enabled: true }, select: { country: true }, orderBy: [{ order: 'asc' }, { name: 'asc' }] })
  return first?.country?.trim() || 'Türkiye'
}
