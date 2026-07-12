import 'server-only'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { PDFDocument, rgb, type PDFFont, type PDFPage } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import type { Booking, Car, User, BookingExtra, Insurance } from '@prisma/client'
import { formatMoney } from './money'

type BookingForContract = Booking & {
  car: Car
  user: User
  extras: BookingExtra[]
  insurance: Insurance | null
}

const TEAL = rgb(0.05, 0.49, 0.56)
const INK = rgb(0.047, 0.231, 0.271)
const MUTE = rgb(0.37, 0.54, 0.57)
const LINE = rgb(0.8, 0.9, 0.91)

async function loadFonts(doc: PDFDocument): Promise<{ reg: PDFFont; bold: PDFFont }> {
  doc.registerFontkit(fontkit)
  const dir = path.resolve(process.cwd(), 'assets/fonts')
  const [reg, bold] = await Promise.all([
    doc.embedFont(await readFile(path.join(dir, 'DejaVuSans.ttf')), { subset: true }),
    doc.embedFont(await readFile(path.join(dir, 'DejaVuSans-Bold.ttf')), { subset: true }),
  ])
  return { reg, bold }
}

/** Generate the rental-contract PDF for a booking. Returns raw bytes. */
export async function generateContractPdf(
  b: BookingForContract,
  signature?: { data: string; name: string } | null,
): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  const { reg, bold } = await loadFonts(doc)
  const page: PDFPage = doc.addPage([595.28, 841.89]) // A4
  const W = 595.28
  const M = 48
  let y = 800

  const text = (s: string, x: number, size: number, font = reg, color = INK) =>
    page.drawText(s, { x, y, size, font, color })
  const line = (x1: number, x2: number, yy: number, color = LINE) =>
    page.drawLine({ start: { x: x1, y: yy }, end: { x: x2, y: yy }, thickness: 1, color })

  // Header
  text('AVENTA', M, 22, bold, TEAL)
  text('ДОГОВОР АРЕНДЫ АВТОМОБИЛЯ', M, 11, bold, INK)
  page.drawText(`№ ${b.number}`, { x: W - M - reg.widthOfTextAtSize(`№ ${b.number}`, 11), y: 802, size: 11, font: bold, color: TEAL })
  page.drawText('Premium car rental · Antalya', { x: W - M - reg.widthOfTextAtSize('Premium car rental · Antalya', 8), y: 788, size: 8, font: reg, color: MUTE })
  y = 770
  line(M, W - M, y)
  y -= 26

  const dateStr = new Date(b.createdAt).toLocaleDateString('ru-RU')
  text(`г. Анталия, Турция`, M, 10, reg, MUTE)
  page.drawText(dateStr, { x: W - M - reg.widthOfTextAtSize(dateStr, 10), y, size: 10, font: reg, color: MUTE })
  y -= 30

  // Parties
  const colW = (W - M * 2 - 20) / 2
  text('АРЕНДОДАТЕЛЬ', M, 8, bold, MUTE)
  text('АРЕНДАТОР', M + colW + 20, 8, bold, MUTE)
  y -= 16
  text('AVENTA Turizm ve Rent A Car Ltd.', M, 10, reg)
  const clientName = `${b.user.firstName ?? ''} ${b.user.lastName ?? ''}`.trim() || b.user.email
  text(clientName, M + colW + 20, 10, reg)
  y -= 14
  text('Antalya, Türkiye', M, 9, reg, MUTE)
  text(b.user.email, M + colW + 20, 9, reg, MUTE)
  y -= 28

  // Subject table
  text('1. ПРЕДМЕТ ДОГОВОРА', M, 10, bold, TEAL)
  y -= 8
  line(M, W - M, y)
  y -= 18
  const row = (label: string, value: string) => {
    text(label, M, 10, reg, MUTE)
    text(value, M + 200, 10, reg, INK)
    y -= 20
  }
  row('Автомобиль', `${b.car.brand} ${b.car.model} (${b.car.year})`)
  row('Период аренды', `${new Date(b.startAt).toLocaleDateString('ru-RU')} — ${new Date(b.endAt).toLocaleDateString('ru-RU')}`)
  row('Срок', `${b.days} сут.`)
  row('Место подачи', b.pickupAddress || b.pickupCity || 'Аэропорт Анталии (AYT)')
  y -= 8

  // Cost breakdown
  text('2. СТОИМОСТЬ', M, 10, bold, TEAL)
  y -= 8
  line(M, W - M, y)
  y -= 18
  const cur = b.currency
  const money = (v: unknown) => formatMoney(Number(v), cur)
  const costRow = (label: string, value: string, strong = false) => {
    text(label, M, 10, strong ? bold : reg, strong ? INK : MUTE)
    const f = strong ? bold : reg
    page.drawText(value, { x: W - M - f.widthOfTextAtSize(value, 10), y, size: 10, font: f, color: strong ? TEAL : INK })
    y -= 20
  }
  costRow('Аренда автомобиля', money(b.rentTotal))
  if (Number(b.extrasTotal) > 0) costRow('Дополнительные услуги', money(b.extrasTotal))
  if (Number(b.insuranceTotal) > 0) costRow('Страховка', money(b.insuranceTotal))
  line(M, W - M, y + 6)
  y -= 4
  costRow('ИТОГО', money(b.subtotal), true)
  costRow('Депозит (залог)', money(b.depositAmount))
  y -= 10

  // Conditions
  text('3. УСЛОВИЯ', M, 10, bold, TEAL)
  y -= 8
  line(M, W - M, y)
  y -= 16
  const conditions = (b.car.conditionsRu || 'Возраст 21+, стаж 2+ года. Базовая страховка включена. Топливо «полный → полный».')
    .split('·')
    .map((s) => s.trim())
    .filter(Boolean)
  for (const c of conditions) {
    text('•  ' + c, M, 9, reg, INK)
    y -= 15
  }
  y -= 20

  // Signatures — embed the drawn e-signature above the renter's line if present
  if (signature?.data?.startsWith('data:image/png')) {
    try {
      const png = await doc.embedPng(Buffer.from(signature.data.split(',')[1] ?? '', 'base64'))
      const dims = png.scale(1)
      const maxW = 150
      const scale = Math.min(maxW / dims.width, 40 / dims.height, 1)
      page.drawImage(png, { x: W - M - 175, y: y + 6, width: dims.width * scale, height: dims.height * scale })
    } catch {
      /* ignore bad signature image */
    }
  }
  line(M, M + 180, y)
  line(W - M - 180, W - M, y)
  y -= 14
  text('Арендодатель / AVENTA', M, 8, reg, MUTE)
  text('Арендатор / ' + (signature?.name || clientName), W - M - 180, 8, reg, MUTE)
  y -= 26
  page.drawText(
    'Документ сформирован автоматически. Электронная подпись имеет юридическую силу согласно соглашению сторон.',
    { x: M, y, size: 7.5, font: reg, color: MUTE, maxWidth: W - M * 2 },
  )

  return doc.save()
}
