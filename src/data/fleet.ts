import type { Lang, Dict } from '../i18n/lang'
import { useLang } from '../i18n/lang'

/** Pick a localized value, falling back to English. */
function pick<T>(m: Dict<T>, l: Lang): T {
  return m[l] ?? m.en
}

export type CarClass = 'business' | 'suv' | 'minivan'
export type Fuel = 'petrol' | 'diesel'

export interface RawCar {
  id: string
  brand: string
  model: string
  year: number
  cls: CarClass
  fuel: Fuel
  seats: number
  doors: number
  pricePerDay: number
  deposit: number
  available: boolean
  /** Day in August the car frees up, when busy. */
  busyUntilDay?: number
  mileagePerDay: number
}

export const FLEET: RawCar[] = [
  { id: 'e200', brand: 'Mercedes-Benz', model: 'E 200', year: 2024, cls: 'business', fuel: 'petrol', seats: 5, doors: 4, pricePerDay: 120, deposit: 800, available: true, mileagePerDay: 250 },
  { id: 'velar', brand: 'Range Rover', model: 'Velar', year: 2024, cls: 'suv', fuel: 'petrol', seats: 5, doors: 4, pricePerDay: 180, deposit: 1500, available: true, mileagePerDay: 250 },
  { id: 'a6', brand: 'Audi', model: 'A6', year: 2023, cls: 'business', fuel: 'petrol', seats: 5, doors: 4, pricePerDay: 115, deposit: 800, available: true, mileagePerDay: 250 },
  { id: '520i', brand: 'BMW', model: '520i', year: 2023, cls: 'business', fuel: 'diesel', seats: 5, doors: 4, pricePerDay: 110, deposit: 750, available: false, busyUntilDay: 18, mileagePerDay: 250 },
  { id: 'vclass', brand: 'Mercedes-Benz', model: 'V-Class', year: 2024, cls: 'minivan', fuel: 'diesel', seats: 7, doors: 4, pricePerDay: 160, deposit: 1200, available: false, busyUntilDay: 12, mileagePerDay: 200 },
]

const CLS_LABEL: Record<CarClass, Dict<string>> = {
  business: { ru: 'Бизнес', en: 'Business', tr: 'Business', es: 'Business', de: 'Business' },
  suv: { ru: 'Премиум SUV', en: 'Premium SUV', tr: 'Premium SUV', es: 'SUV Premium', de: 'Premium-SUV' },
  minivan: { ru: 'Минивэн VIP', en: 'Minivan VIP', tr: 'VIP Minivan', es: 'Minivan VIP', de: 'VIP-Minivan' },
}

const FUEL_LABEL: Record<Fuel, Dict<string>> = {
  petrol: { ru: 'Бензин', en: 'Petrol', tr: 'Benzin', es: 'Gasolina', de: 'Benzin' },
  diesel: { ru: 'Дизель', en: 'Diesel', tr: 'Dizel', es: 'Diésel', de: 'Diesel' },
}

const WORDS: {
  auto: Dict<string>
  seats: Dict<string>
  available: Dict<string>
  busyUntil: Dict<(d: number) => string>
} = {
  auto: { ru: 'Автомат', en: 'Automatic', tr: 'Otomatik', es: 'Automático', de: 'Automatik' },
  seats: { ru: 'мест', en: 'seats', tr: 'koltuk', es: 'asientos', de: 'Sitze' },
  available: { ru: 'Свободен', en: 'Available', tr: 'Müsait', es: 'Disponible', de: 'Verfügbar' },
  busyUntil: { ru: (d: number) => `Занят до ${d} авг`, en: (d: number) => `Busy until Aug ${d}`, tr: (d: number) => `${d} Ağustos'a kadar dolu`, es: (d: number) => `Ocupado hasta el ${d} de agosto`, de: (d: number) => `Belegt bis ${d}. Aug.` },
}

export interface LocalizedCar extends RawCar {
  clsLabel: string
  specs: string
  statusText: string
}

export function localizeCar(car: RawCar, lang: Lang): LocalizedCar {
  const statusText = car.available
    ? pick(WORDS.available, lang)
    : pick(WORDS.busyUntil, lang)(car.busyUntilDay ?? 0)
  const specs = `${pick(WORDS.auto, lang)} · ${pick(FUEL_LABEL[car.fuel], lang)} · ${car.seats} ${pick(WORDS.seats, lang)}`
  return { ...car, clsLabel: pick(CLS_LABEL[car.cls], lang), specs, statusText }
}

/** Localized fleet for the active language. */
export function useFleet(): LocalizedCar[] {
  const { lang } = useLang()
  return FLEET.map((c) => localizeCar(c, lang))
}

export function useCar(id: string): LocalizedCar | undefined {
  const { lang } = useLang()
  const c = FLEET.find((x) => x.id === id)
  return c ? localizeCar(c, lang) : undefined
}
