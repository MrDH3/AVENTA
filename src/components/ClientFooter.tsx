'use client'

import Link from 'next/link'
import { LogoMark } from './Logo'
import LangToggle from './LangToggle'
import PaymentLogos from './PaymentLogos'
import { useDict } from '../i18n/lang'
import { LEGAL_ROUTES } from '../lib/legal'
import { useIsMobile } from './useIsMobile'

const dict = {
  ru: {
    blurb: 'Премиум-аренда автомобилей в Анталии. Подача 24/7, прозрачные условия и поддержка на вашем языке.',
    colRent: 'Аренда',
    lFleet: 'Автомобили',
    lHow: 'Как это работает',
    lInsurance: 'Страхование и залог',
    lBook: 'Забронировать',
    colCompany: 'Компания',
    lAbout: 'О нас',
    lContact: 'Контакты',
    lAccount: 'Личный кабинет',
    lLogin: 'Войти',
    colLegal: 'Документы',
    lPrivacy: 'Политика конфиденциальности',
    lDistance: 'Договор оферты',
    lReturns: 'Доставка и возврат',
    colContact: 'Контакты',
    addr: 'Анталия, Турция · Аэропорт AYT и по адресу',
    hours: 'Поддержка 24/7',
    securePay: 'Безопасная оплата',
    rights: '© 2026 AVENTA · Премиум-аренда авто',
    madeIn: 'Сделано в Анталии',
  },
  en: {
    blurb: 'Premium car rental in Antalya. 24/7 delivery, transparent terms and support in your language.',
    colRent: 'Rental',
    lFleet: 'Cars',
    lHow: 'How it works',
    lInsurance: 'Insurance & deposit',
    lBook: 'Book now',
    colCompany: 'Company',
    lAbout: 'About us',
    lContact: 'Contact',
    lAccount: 'My account',
    lLogin: 'Sign in',
    colLegal: 'Legal',
    lPrivacy: 'Privacy Policy',
    lDistance: 'Distance Selling Contract',
    lReturns: 'Delivery & Returns',
    colContact: 'Contact',
    addr: 'Antalya, Türkiye · Airport AYT & to your address',
    hours: '24/7 support',
    securePay: 'Secure payment',
    rights: '© 2026 AVENTA · Premium car rental',
    madeIn: 'Made in Antalya',
  },
  tr: {
    blurb: 'Antalya\'da premium araç kiralama. 7/24 teslimat, şeffaf koşullar ve kendi dilinizde destek.',
    colRent: 'Kiralama',
    lFleet: 'Araçlar',
    lHow: 'Nasıl çalışır',
    lInsurance: 'Sigorta ve depozito',
    lBook: 'Rezervasyon yap',
    colCompany: 'Şirket',
    lAbout: 'Hakkımızda',
    lContact: 'İletişim',
    lAccount: 'Hesabım',
    lLogin: 'Giriş yap',
    colLegal: 'Yasal',
    lPrivacy: 'Gizlilik Politikası',
    lDistance: 'Mesafeli Satış Sözleşmesi',
    lReturns: 'Teslimat ve İade',
    colContact: 'İletişim',
    addr: 'Antalya, Türkiye · AYT Havalimanı ve adresinize',
    hours: '7/24 destek',
    securePay: 'Güvenli ödeme',
    rights: '© 2026 AVENTA · Premium araç kiralama',
    madeIn: 'Antalya\'da üretildi',
  },
  es: {
    blurb: 'Alquiler de coches premium en Antalya. Entrega 24/7, condiciones transparentes y atención en tu idioma.',
    colRent: 'Alquiler',
    lFleet: 'Coches',
    lHow: 'Cómo funciona',
    lInsurance: 'Seguro y depósito',
    lBook: 'Reservar ahora',
    colCompany: 'Empresa',
    lAbout: 'Sobre nosotros',
    lContact: 'Contacto',
    lAccount: 'Mi cuenta',
    lLogin: 'Iniciar sesión',
    colLegal: 'Legal',
    lPrivacy: 'Política de privacidad',
    lDistance: 'Contrato de venta a distancia',
    lReturns: 'Entrega y devoluciones',
    colContact: 'Contacto',
    addr: 'Antalya, Türkiye · Aeropuerto AYT y a tu dirección',
    hours: 'Atención 24/7',
    securePay: 'Pago seguro',
    rights: '© 2026 AVENTA · Alquiler de coches premium',
    madeIn: 'Hecho en Antalya',
  },
  de: {
    blurb: 'Premium-Autovermietung in Antalya. Lieferung rund um die Uhr, transparente Konditionen und Support in Ihrer Sprache.',
    colRent: 'Vermietung',
    lFleet: 'Fahrzeuge',
    lHow: 'So funktioniert es',
    lInsurance: 'Versicherung & Kaution',
    lBook: 'Jetzt buchen',
    colCompany: 'Unternehmen',
    lAbout: 'Über uns',
    lContact: 'Kontakt',
    lAccount: 'Mein Konto',
    lLogin: 'Anmelden',
    colLegal: 'Rechtliches',
    lPrivacy: 'Datenschutzerklärung',
    lDistance: 'Fernabsatzvertrag',
    lReturns: 'Lieferung & Rückgabe',
    colContact: 'Kontakt',
    addr: 'Antalya, Türkiye · Flughafen AYT & zu Ihrer Adresse',
    hours: '24/7 Support',
    securePay: 'Sichere Zahlung',
    rights: '© 2026 AVENTA · Premium-Autovermietung',
    madeIn: 'Aus Antalya',
  },
}

const colTitle = { font: '700 11px var(--f-mono)', letterSpacing: '.14em', color: '#7FB6BF', margin: '0 0 14px' } as const
const fLink = { display: 'block', marginBottom: 10, font: '500 14px var(--f-ui)', color: '#CDEAEF' } as const

function Social({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      aria-label={label}
      target="_blank"
      rel="noreferrer"
      style={{ width: 38, height: 38, borderRadius: 11, display: 'grid', placeItems: 'center', background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.12)', color: '#CDEAEF' }}
    >
      {children}
    </a>
  )
}

export default function ClientFooter() {
  const t = useDict(dict)
  const isMobile = useIsMobile()
  // On mobile, give link rows a comfortable tap height / spacing.
  const link = isMobile
    ? { ...fLink, marginBottom: 4, minHeight: 44, display: 'flex', alignItems: 'center' }
    : fLink
  return (
    <footer style={{ background: '#0C3B45', color: '#CDEAEF' }}>
      <div style={{ maxWidth: 'var(--container)', margin: '0 auto', padding: 'clamp(40px,5vw,64px) var(--pad-x) 28px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(auto-fit,minmax(180px,1fr))',
            gap: isMobile ? '24px 20px' : 'clamp(28px,4vw,44px)',
          }}
        >
          {/* Brand + social */}
          <div style={{ minWidth: 0, gridColumn: isMobile ? '1 / -1' : undefined }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
              <LogoMark size={34} variant="onTeal" />
              <div style={{ font: '800 20px var(--f-display)', color: '#fff', letterSpacing: '.04em' }}>AVENTA</div>
            </div>
            <p style={{ marginTop: 16, maxWidth: 300, font: '500 13.5px/1.65 var(--f-ui)', color: '#9FC9D0' }}>{t.blurb}</p>
            <div style={{ marginTop: 18, display: 'flex', gap: 10 }}>
              <Social href="https://wa.me/905000000000" label="WhatsApp">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.4 8.4 0 0 1-12.3 7.4L3 21l2.2-5.6A8.4 8.4 0 1 1 21 11.5z" /><path d="M8.5 9.2c.2 3 2.3 5.1 5.3 5.3.6 0 1.2-.5 1.3-1.1l-1.8-.9-.9.8a4 4 0 0 1-2-2l.8-.9-.9-1.8c-.6.1-1.1.7-1.1 1.3z" /></svg>
              </Social>
              <Social href="https://t.me/aventa" label="Telegram">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 4 3 11l5 2 2 6 3-4 5 4z" /><path d="M8 13l9-6" /></svg>
              </Social>
              <Social href="https://instagram.com/aventa" label="Instagram">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17" cy="7" r="1" /></svg>
              </Social>
            </div>
          </div>

          {/* Rental */}
          <nav aria-label={t.colRent}>
            <h3 style={colTitle}>{t.colRent.toUpperCase()}</h3>
            <Link href="/#fleet" style={link}>{t.lFleet}</Link>
            <Link href="/#how" style={link}>{t.lHow}</Link>
            <Link href="/#insurance" style={link}>{t.lInsurance}</Link>
            <Link href="/catalog" style={link}>{t.lBook}</Link>
          </nav>

          {/* Company */}
          <nav aria-label={t.colCompany}>
            <h3 style={colTitle}>{t.colCompany.toUpperCase()}</h3>
            <Link href="/about" style={link}>{t.lAbout}</Link>
            <Link href="/contact" style={link}>{t.lContact}</Link>
            <Link href="/account" style={link}>{t.lAccount}</Link>
            <Link href="/auth" style={link}>{t.lLogin}</Link>
          </nav>

          {/* Legal */}
          <nav aria-label={t.colLegal}>
            <h3 style={colTitle}>{t.colLegal.toUpperCase()}</h3>
            <Link href={LEGAL_ROUTES.privacy} style={link}>{t.lPrivacy}</Link>
            <Link href={LEGAL_ROUTES.distanceSelling} style={link}>{t.lDistance}</Link>
            <Link href={LEGAL_ROUTES.deliveryReturns} style={link}>{t.lReturns}</Link>
          </nav>

          {/* Contact */}
          <div style={{ minWidth: 0, gridColumn: isMobile ? '1 / -1' : undefined }}>
            <h3 style={colTitle}>{t.colContact.toUpperCase()}</h3>
            <div style={{ ...fLink, color: '#9FC9D0' }}>{t.addr}</div>
            <a href="tel:+905000000000" style={link}>+90 500 000 00 00</a>
            <a href="mailto:hello@aventa.rent" style={link}>hello@aventa.rent</a>
            <div style={{ marginTop: 4, display: 'inline-flex', alignItems: 'center', gap: 7, font: '700 12px var(--f-ui)', color: '#6FBF8F' }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#6FBF8F' }} />
              {t.hours}
            </div>
          </div>
        </div>

        {/* Payment methods (iyzico requirement) */}
        <div
          style={{
            marginTop: 'clamp(28px,4vw,40px)', paddingTop: 22, borderTop: '1px solid rgba(255,255,255,.1)',
            display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
            <span style={{ font: '700 11px var(--f-mono)', letterSpacing: '.12em', color: '#7FB6BF' }}>🔒 {t.securePay.toUpperCase()}</span>
            <PaymentLogos />
          </div>
          <span style={{ font: '600 11px var(--f-mono)', letterSpacing: '.1em', color: '#5C8F98' }}>☀ {t.madeIn}</span>
        </div>

        {/* Bottom bar */}
        <div
          style={{
            marginTop: 22, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap',
          }}
        >
          <div style={{ font: '500 12.5px var(--f-ui)', color: '#7FB6BF' }}>{t.rights}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 18, rowGap: isMobile ? 4 : 18, flexWrap: 'wrap', font: '500 12.5px var(--f-ui)' }}>
            <Link href={LEGAL_ROUTES.privacy} style={{ color: '#9FC9D0', display: 'inline-flex', alignItems: 'center', minHeight: isMobile ? 44 : undefined }}>{t.lPrivacy}</Link>
            <Link href={LEGAL_ROUTES.distanceSelling} style={{ color: '#9FC9D0', display: 'inline-flex', alignItems: 'center', minHeight: isMobile ? 44 : undefined }}>{t.lDistance}</Link>
            <Link href={LEGAL_ROUTES.deliveryReturns} style={{ color: '#9FC9D0', display: 'inline-flex', alignItems: 'center', minHeight: isMobile ? 44 : undefined }}>{t.lReturns}</Link>
            <LangToggle glass={false} />
          </div>
        </div>
      </div>
    </footer>
  )
}
