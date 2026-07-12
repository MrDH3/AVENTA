/**
 * Single source of truth for the legal / consent layer.
 *
 * IMPORTANT: the three regulated documents (privacy, distance-selling, delivery-returns)
 * currently ship with clearly-labelled PLACEHOLDER text. The binding wording must be
 * replaced with lawyer-reviewed text before launch — see LegalDocPage's banner.
 *
 * `LEGAL_VERSION` is stamped onto every consent record so we always know exactly which
 * revision of the documents a customer agreed to. Bump it whenever the binding text changes
 * (e.g. after the lawyer delivers the real terms → '2026-01').
 */
export const LEGAL_VERSION = '2026-01-DRAFT'

/** Canonical routes for the legal documents — referenced by the footer, nav and consent links. */
export const LEGAL_ROUTES = {
  index: '/legal',
  privacy: '/legal/privacy',
  distanceSelling: '/legal/distance-selling',
  deliveryReturns: '/legal/delivery-returns',
} as const

export type LegalDocKey = 'privacy' | 'distance-selling' | 'delivery-returns'
