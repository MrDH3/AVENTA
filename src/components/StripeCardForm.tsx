'use client'

import { useState } from 'react'
// `/pure` entrypoint: Stripe.js is fetched only when loadStripe() is actually CALLED, not merely on
// import. This keeps pages that transitively import this module (e.g. the success page, which renders
// no card form) from loading Stripe.js + its beacon iframe. See stripe/stripe-js "pure" docs.
import { loadStripe } from '@stripe/stripe-js/pure'
import type { Stripe } from '@stripe/stripe-js' // type-only → erased at build, no auto-load side effect
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import type { Lang } from '../i18n/lang'

/**
 * Reusable Stripe card form (test or live). PCI-critical: the card number is entered ONLY inside
 * Stripe's own <PaymentElement> (a Stripe-hosted iframe). This app never renders a card-number field
 * and never sees the PAN — we only handle the PaymentIntent client secret + the confirmation result.
 *
 * Given a `clientSecret` (from any server action that created a PaymentIntent), it mounts Elements,
 * confirms the payment, and reports the result. Two modes:
 *  - `onPaid` provided → on success it calls `onPaid(paymentIntentId)` and lets the PARENT decide what
 *    happens next (e.g. create the booking). Used by the pay-before-create booking flow.
 *  - `onPaid` omitted → it shows its own "payment received" state (the webhook finalises the booking).
 */

const stripeLoaders: Record<string, Promise<Stripe | null>> = {}
function getStripe(pk: string): Promise<Stripe | null> {
  if (!stripeLoaders[pk]) stripeLoaders[pk] = loadStripe(pk)
  return stripeLoaders[pk]
}

const dict = {
  en: {
    pay: 'Pay',
    processing: 'Processing…',
    finalizing: 'Confirming your booking…',
    successTitle: 'Payment received',
    successBody: 'Your card payment succeeded. We’re finalising the confirmation — your booking updates automatically.',
    pendingTitle: 'Payment processing',
    pendingBody: 'Your payment is still being processed. We’ll confirm your booking automatically once it clears — please don’t pay again.',
    failed: 'The payment could not be completed. Check the card details and try again.',
    secured: 'Secured by Stripe · your card details are entered directly with Stripe and never reach our servers.',
    test: 'TEST MODE — use Stripe test cards (e.g. 4242 4242 4242 4242).',
  },
  ru: {
    pay: 'Оплатить',
    processing: 'Обработка…',
    finalizing: 'Подтверждаем бронирование…',
    successTitle: 'Платёж получен',
    successBody: 'Оплата картой прошла успешно. Мы завершаем подтверждение — статус брони обновится автоматически.',
    pendingTitle: 'Платёж обрабатывается',
    pendingBody: 'Ваш платёж ещё обрабатывается. Мы автоматически подтвердим бронирование, как только он пройдёт — платить повторно не нужно.',
    failed: 'Не удалось выполнить платёж. Проверьте данные карты и попробуйте снова.',
    secured: 'Защищено Stripe · данные карты вводятся напрямую в Stripe и не попадают на наши серверы.',
    test: 'ТЕСТОВЫЙ РЕЖИМ — используйте тестовые карты Stripe (например 4242 4242 4242 4242).',
  },
  tr: {
    pay: 'Öde',
    processing: 'İşleniyor…',
    finalizing: 'Rezervasyonunuz onaylanıyor…',
    successTitle: 'Ödeme alındı',
    successBody: 'Kart ödemeniz başarıyla tamamlandı. Onayı sonlandırıyoruz — rezervasyonunuz otomatik olarak güncellenir.',
    pendingTitle: 'Ödeme işleniyor',
    pendingBody: 'Ödemeniz hâlâ işleniyor. Ödeme tamamlanır tamamlanmaz rezervasyonunuzu otomatik olarak onaylayacağız — lütfen tekrar ödeme yapmayın.',
    failed: 'Ödeme tamamlanamadı. Kart bilgilerinizi kontrol edip tekrar deneyin.',
    secured: 'Stripe ile güvence altında · kart bilgileriniz doğrudan Stripe üzerinden girilir ve hiçbir zaman sunucularımıza ulaşmaz.',
    test: 'TEST MODU — Stripe test kartlarını kullanın (örn. 4242 4242 4242 4242).',
  },
  es: {
    pay: 'Pagar',
    processing: 'Procesando…',
    finalizing: 'Confirmando su reserva…',
    successTitle: 'Pago recibido',
    successBody: 'El pago con tarjeta se ha realizado correctamente. Estamos finalizando la confirmación — su reserva se actualiza automáticamente.',
    pendingTitle: 'Pago en proceso',
    pendingBody: 'Su pago aún se está procesando. Confirmaremos su reserva automáticamente en cuanto se complete — por favor, no vuelva a pagar.',
    failed: 'No se pudo completar el pago. Revise los datos de la tarjeta e inténtelo de nuevo.',
    secured: 'Protegido por Stripe · los datos de su tarjeta se introducen directamente en Stripe y nunca llegan a nuestros servidores.',
    test: 'MODO DE PRUEBA — utilice tarjetas de prueba de Stripe (p. ej. 4242 4242 4242 4242).',
  },
  de: {
    pay: 'Bezahlen',
    processing: 'Wird verarbeitet…',
    finalizing: 'Ihre Buchung wird bestätigt…',
    successTitle: 'Zahlung erhalten',
    successBody: 'Ihre Kartenzahlung war erfolgreich. Wir schließen die Bestätigung ab — Ihre Buchung wird automatisch aktualisiert.',
    pendingTitle: 'Zahlung wird verarbeitet',
    pendingBody: 'Ihre Zahlung wird noch verarbeitet. Sobald sie abgeschlossen ist, bestätigen wir Ihre Buchung automatisch — bitte zahlen Sie nicht erneut.',
    failed: 'Die Zahlung konnte nicht abgeschlossen werden. Bitte überprüfen Sie die Kartendaten und versuchen Sie es erneut.',
    secured: 'Gesichert durch Stripe · Ihre Kartendaten werden direkt bei Stripe eingegeben und erreichen niemals unsere Server.',
    test: 'TESTMODUS — verwenden Sie Stripe-Testkarten (z. B. 4242 4242 4242 4242).',
  },
}
export type CardDict = (typeof dict)['en']

const notice: React.CSSProperties = { padding: '14px 16px', borderRadius: 12, font: '600 13px/1.5 var(--f-ui)' }

export default function StripeCardForm({
  clientSecret,
  publishableKey,
  amountLabel,
  lang,
  returnUrl,
  onPaid,
  payLabel,
}: {
  clientSecret: string
  publishableKey: string
  amountLabel?: string
  lang: Lang
  /** Where Stripe returns after a redirect method (3-D Secure). Card 4242 never redirects. */
  returnUrl?: string
  onPaid?: (paymentIntentId: string) => void | Promise<void>
  payLabel?: string
}) {
  const t = dict[lang] ?? dict.en
  return (
    <Elements
      stripe={getStripe(publishableKey)}
      options={{
        clientSecret,
        appearance: {
          theme: 'flat',
          // Compact, on-brand sizing so the Element doesn't dwarf the surrounding UI.
          variables: {
            colorPrimary: '#0E7E90',
            colorText: '#0C3B45',
            colorTextSecondary: '#5E8A92',
            colorBackground: '#ffffff',
            fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif',
            fontSizeBase: '13.5px',
            fontSizeSm: '11.5px',
            spacingUnit: '3px',
            spacingGridRow: '9px',
            borderRadius: '10px',
          },
          rules: {
            '.Label': { fontSize: '10.5px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '.05em', color: '#5E8A92', marginBottom: '4px' },
            '.Input': { padding: '9px 11px', fontSize: '13.5px', border: '1px solid #C7E4E9', boxShadow: 'none', backgroundColor: '#FBFEFE' },
            '.Input:focus': { border: '1px solid #0E7E90', boxShadow: '0 0 0 3px rgba(14,126,144,.12)' },
            '.Tab': { padding: '7px 10px', border: '1px solid #C7E4E9' },
            '.Tab:hover': { color: '#0E7E90' },
            '.Tab--selected': { borderColor: '#0E7E90', boxShadow: '0 0 0 1px #0E7E90' },
            '.Text': { fontSize: '12px' },
            '.Text--redirect': { fontSize: '11px' },
          },
        },
      }}
    >
      <CardCheckout t={t} amountLabel={amountLabel} returnUrl={returnUrl} onPaid={onPaid} payLabel={payLabel} />
    </Elements>
  )
}

function CardCheckout({
  t,
  amountLabel,
  returnUrl,
  onPaid,
  payLabel,
}: {
  t: CardDict
  amountLabel?: string
  returnUrl?: string
  onPaid?: (paymentIntentId: string) => void | Promise<void>
  payLabel?: string
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [phase, setPhase] = useState<'idle' | 'processing' | 'finalizing' | 'succeeded' | 'pending' | 'failed'>('idle')
  const [message, setMessage] = useState<string | null>(null)

  const pay = async () => {
    if (!stripe || !elements) return
    setPhase('processing')
    setMessage(null)
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: returnUrl ?? (typeof window !== 'undefined' ? window.location.href : '') },
      redirect: 'if_required',
    })
    if (error) {
      setPhase('failed')
      setMessage(error.message ?? t.failed)
      return
    }
    // Only a CAPTURED ('succeeded') intent may finalise a booking — the deposit is actually collected.
    // 'processing' means the charge is still settling: finalising now would try to verify an uncaptured
    // charge (rejected server-side, no booking) and, if it later settles, strand the funds. So we do NOT
    // create the booking here; the webhook confirms it and the reconciliation sweep refunds any charge
    // that can never be tied to a booking. (Rare for card — mostly async methods.)
    if (paymentIntent?.status === 'succeeded') {
      if (onPaid) {
        // Parent finalises (e.g. creates the booking). Keep a "finalizing" state; if the parent returns
        // control (i.e. it failed), fall back to idle so the user can retry.
        setPhase('finalizing')
        try {
          await onPaid(paymentIntent.id)
          setPhase('idle')
        } catch {
          setPhase('failed')
          setMessage(t.failed)
        }
      } else {
        setPhase('succeeded')
      }
    } else if (paymentIntent?.status === 'processing') {
      setPhase('pending')
    } else {
      setPhase('failed')
      setMessage(t.failed)
    }
  }

  if (phase === 'succeeded') {
    return (
      <div style={{ ...notice, background: '#E9FBF2', border: '1px solid rgba(39,181,118,.35)', color: '#1F9E6B' }}>
        <div style={{ font: '800 15px var(--f-display)', color: '#1F9E6B' }}>✓ {t.successTitle}</div>
        <div style={{ marginTop: 6, font: '500 12.5px/1.5 var(--f-ui)', color: '#3F6670' }}>{t.successBody}</div>
      </div>
    )
  }

  if (phase === 'pending') {
    return (
      <div style={{ ...notice, background: '#FFF6E9', border: '1px solid rgba(224,161,6,.35)', color: '#B45309' }}>
        <div style={{ font: '800 15px var(--f-display)', color: '#B45309' }}>⏳ {t.pendingTitle}</div>
        <div style={{ marginTop: 6, font: '500 12.5px/1.5 var(--f-ui)', color: '#8A6410' }}>{t.pendingBody}</div>
      </div>
    )
  }

  const busy = phase === 'processing' || phase === 'finalizing'
  return (
    <div style={{ background: '#fff', borderRadius: 12, padding: '14px 13px', boxShadow: '0 14px 32px -24px rgba(11,85,96,.4)', border: '1px solid #EAF3F4' }}>
      <div style={{ font: '700 9px var(--f-mono)', letterSpacing: '.08em', color: '#B45309', background: '#FFF6E9', border: '1px solid rgba(224,161,6,.3)', borderRadius: 7, padding: '5px 8px', marginBottom: 11 }}>{t.test}</div>

      {/* Stripe's own card field — rendered inside a Stripe iframe. The PAN never touches our code.
          `accordion` keeps a single compact method row (no oversized Link header). */}
      <PaymentElement options={{ layout: { type: 'accordion', defaultCollapsed: false, spacedAccordionItems: false } }} />

      {phase === 'failed' && message && <div style={{ marginTop: 10, font: '600 11.5px/1.5 var(--f-ui)', color: '#C6392B' }}>{message}</div>}

      <button
        type="button"
        onClick={pay}
        disabled={!stripe || busy}
        className="av-cta av-tap"
        style={{ marginTop: 12, width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minHeight: 44, padding: '11px 18px', border: 'none', borderRadius: 11, background: 'linear-gradient(180deg,#FF8A5B,#FF6F61)', color: '#fff', font: '800 13.5px var(--f-ui)', cursor: busy ? 'wait' : 'pointer', opacity: busy ? 0.75 : 1, boxShadow: '0 12px 24px -12px rgba(255,111,97,.7)' }}
      >
        {phase === 'finalizing' ? t.finalizing : phase === 'processing' ? t.processing : `${payLabel ?? t.pay} ${amountLabel ?? ''}`.trim()}
      </button>

      <div style={{ marginTop: 10, display: 'flex', alignItems: 'flex-start', gap: 7, font: '500 10.5px/1.5 var(--f-ui)', color: '#5E8A92' }}>
        <span aria-hidden>🔒</span>
        <span>{t.secured}</span>
      </div>
    </div>
  )
}
