'use client'

import { useEffect, useState } from 'react'
import { createStripeIntentAction } from '@/server/payment-actions'
import StripeCardForm from './StripeCardForm'
import type { Lang } from '../i18n/lang'

/**
 * Card payment for an EXISTING booking (deposit). Creates a PaymentIntent for `bookingId` via
 * `createStripeIntentAction`, then hands the client secret to the shared <StripeCardForm> (Stripe
 * Elements — the card number never touches our code). On success the signature-verified webhook
 * (/api/webhooks/stripe) marks the Payment PAID and advances the booking (via canTransition).
 *
 * Used on the customer Payments surface for bank/crypto bookings that still owe a deposit/balance.
 * (Booking-time card payment uses the pay-before-create flow instead — see prepareCardBookingAction.)
 */
const label: Record<Lang, string> = {
  en: 'Loading the secure card form…',
  ru: 'Загружаем защищённую форму карты…',
  tr: 'Güvenli kart formu yükleniyor…',
  es: 'Cargando el formulario seguro de tarjeta…',
  de: 'Sicheres Kartenformular wird geladen…',
}

export default function StripeCardPayment({
  bookingId,
  bookingNumber,
  lang,
  onAmount,
}: {
  bookingId: string
  bookingNumber: string
  lang: Lang
  onAmount?: (label: string) => void
}) {
  const [init, setInit] = useState<{ clientSecret: string; pk: string; amountLabel?: string } | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    void (async () => {
      const res = await createStripeIntentAction(bookingId)
      if (!alive) return
      if (res.ok && res.clientSecret && res.publishableKey) {
        setInit({ clientSecret: res.clientSecret, pk: res.publishableKey, amountLabel: res.amountLabel })
        if (res.amountLabel) onAmount?.(res.amountLabel)
      } else {
        setError(res.error ?? 'Card payment is unavailable.')
      }
    })()
    return () => { alive = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId])

  const box: React.CSSProperties = { marginTop: 18, padding: '14px 16px', borderRadius: 12, font: '600 13px/1.5 var(--f-ui)' }
  if (error) return <div style={{ ...box, background: '#FCEEE9', border: '1px solid rgba(214,75,61,.3)', color: '#C6392B' }}>{error}</div>
  if (!init) return <div style={{ ...box, background: '#fff', border: '1px solid #C7E4E9', color: '#5E8A92' }}>{label[lang] ?? label.en}</div>

  return (
    <div style={{ marginTop: 18 }}>
      <StripeCardForm
        clientSecret={init.clientSecret}
        publishableKey={init.pk}
        amountLabel={init.amountLabel}
        lang={lang}
        returnUrl={typeof window !== 'undefined' ? `${window.location.origin}/success?b=${encodeURIComponent(bookingNumber)}` : undefined}
      />
    </div>
  )
}
