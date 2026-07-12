/**
 * Canonical phone normalization used everywhere a phone is stored or compared,
 * so formatting differences ("+90 555 123 45 67" vs "+905551234567") never
 * create duplicate accounts. Not full E.164 (no country inference) — it strips
 * spacing/punctuation and preserves a leading "+".
 */
export function normalizePhone(raw: string | null | undefined): string | null {
  if (!raw) return null
  // Digits only — so "+90 555 123 45 67", "90-555-123-45-67" and "(90)5551234567"
  // all collapse to the same canonical value. (Not full E.164: it does not reconcile
  // national trunk prefixes like RU "8…" vs "+7…" — that would need libphonenumber.)
  const digits = String(raw).replace(/\D/g, '')
  if (digits.length < 7) return null // too short to be a real number
  return digits
}
