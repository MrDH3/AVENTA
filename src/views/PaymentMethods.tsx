'use client'

import Link from 'next/link'
import { useDict } from '../i18n/lang'

const DICT = {
  en: {
    heading: 'Payment methods',
    back: 'Back to profile',
    badge: 'Coming soon',
    title: 'Saved cards aren’t available yet',
    body: 'Card management will be available once online card payments are enabled. We don’t store card details until a payment processor is connected — so there’s nothing to add here for now.',
    howTitle: 'How you pay today',
    howBody: 'For each booking you can pay by bank transfer or crypto, and upload your receipt at checkout. Our team confirms the payment against your booking.',
    browse: 'Browse cars',
  },
  ru: {
    heading: 'Способы оплаты',
    back: 'Назад в профиль',
    badge: 'Скоро',
    title: 'Сохранённые карты пока недоступны',
    body: 'Управление картами станет доступно после подключения онлайн-оплаты картой. Мы не храним данные карт, пока не подключён платёжный провайдер — поэтому добавлять здесь пока нечего.',
    howTitle: 'Как оплатить сейчас',
    howBody: 'Для каждой брони можно оплатить банковским переводом или криптовалютой и загрузить чек при оформлении. Наша команда подтверждает оплату по вашей брони.',
    browse: 'Выбрать авто',
  },
  tr: {
    heading: 'Ödeme yöntemleri',
    back: 'Profile dön',
    badge: 'Yakında',
    title: 'Kayıtlı kartlar henüz kullanılamıyor',
    body: 'Kart yönetimi, çevrimiçi kart ödemeleri etkinleştirildiğinde kullanılabilir olacak. Bir ödeme sağlayıcısı bağlanana kadar kart bilgilerinizi saklamıyoruz — bu yüzden şimdilik burada eklenecek bir şey yok.',
    howTitle: 'Şu anda nasıl ödeme yaparsınız',
    howBody: 'Her rezervasyon için banka havalesi veya kripto ile ödeme yapabilir ve ödeme sırasında makbuzunuzu yükleyebilirsiniz. Ekibimiz ödemeyi rezervasyonunuzla eşleştirerek onaylar.',
    browse: 'Araçlara göz atın',
  },
  es: {
    heading: 'Métodos de pago',
    back: 'Volver al perfil',
    badge: 'Próximamente',
    title: 'Las tarjetas guardadas aún no están disponibles',
    body: 'La gestión de tarjetas estará disponible cuando se activen los pagos con tarjeta en línea. No almacenamos los datos de tu tarjeta hasta que se conecte una pasarela de pago, así que por ahora no hay nada que añadir aquí.',
    howTitle: 'Cómo pagas ahora',
    howBody: 'En cada reserva puedes pagar por transferencia bancaria o con criptomonedas y subir tu comprobante al finalizar la compra. Nuestro equipo confirma el pago con tu reserva.',
    browse: 'Ver coches',
  },
  de: {
    heading: 'Zahlungsmethoden',
    back: 'Zurück zum Profil',
    badge: 'Demnächst',
    title: 'Gespeicherte Karten sind noch nicht verfügbar',
    body: 'Die Kartenverwaltung wird verfügbar, sobald Online-Kartenzahlungen aktiviert sind. Wir speichern keine Kartendaten, solange kein Zahlungsdienstleister verbunden ist — daher gibt es hier vorerst nichts hinzuzufügen.',
    howTitle: 'So bezahlen Sie derzeit',
    howBody: 'Für jede Buchung können Sie per Banküberweisung oder Krypto bezahlen und Ihren Beleg beim Checkout hochladen. Unser Team bestätigt die Zahlung anhand Ihrer Buchung.',
    browse: 'Autos ansehen',
  },
}

export default function PaymentMethods() {
  const t = useDict(DICT)
  const card: React.CSSProperties = { background: '#fff', borderRadius: 18, padding: 22, boxShadow: '0 18px 40px -30px rgba(11,85,96,.4)', border: '1px solid rgba(20,153,174,.1)' }

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: '22px 16px 40px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <Link href="/account" style={{ font: '700 12px var(--f-ui)', color: 'var(--av-teal)', textDecoration: 'none' }}>‹ {t.back}</Link>
        <h1 style={{ margin: '8px 0 0', font: '800 26px var(--f-display)', color: 'var(--av-text)' }}>{t.heading}</h1>
      </div>

      {/* honest placeholder — NO fake saved cards */}
      <div style={{ ...card, background: 'linear-gradient(180deg,#F3FAFB,#EAF7F8)', textAlign: 'center' }}>
        <div aria-hidden style={{ width: 60, height: 60, margin: '0 auto', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#E0F6F2', fontSize: 28 }}>💳</div>
        <div style={{ marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 999, background: 'var(--av-warn-bg,#fff0e0)', color: 'var(--av-warn-text,#e07a1e)', font: '700 10px var(--f-mono)', letterSpacing: '.08em', textTransform: 'uppercase' }}>{t.badge}</div>
        <h2 style={{ margin: '12px 0 0', font: '800 19px var(--f-display)', color: 'var(--av-text)' }}>{t.title}</h2>
        <p style={{ margin: '10px auto 0', maxWidth: 380, font: '500 13px/1.6 var(--f-ui)', color: 'var(--av-muted)' }}>{t.body}</p>
      </div>

      {/* how they actually pay today */}
      <div style={card}>
        <div style={{ font: '700 10px var(--f-mono)', letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--av-label)' }}>{t.howTitle}</div>
        <p style={{ margin: '10px 0 16px', font: '500 13px/1.6 var(--f-ui)', color: 'var(--av-body,#0b5560)' }}>{t.howBody}</p>
        <Link href="/catalog" className="av-cta av-tap" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minHeight: 46, padding: '12px 22px', border: 'none', color: '#fff', background: 'linear-gradient(180deg,#FF8A5B,#FF6F61)', borderRadius: 12, font: '700 14px var(--f-ui)', textDecoration: 'none' }}>{t.browse}</Link>
      </div>
    </div>
  )
}
