'use client'

import {
  useMemo,
  useRef,
  useState,
  useTransition,
  type CSSProperties,
  type ChangeEvent,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import { useRouter } from 'next/navigation'
import { LogoMark } from '../components/Logo'
import LangToggle from '../components/LangToggle'
import { useIsMobile } from '@/components/useIsMobile'
import { useDict, useLang, type Lang } from '../i18n/lang'
import { loginAction, type ActionResult } from '@/server/auth-actions'
import { requestAccountAction } from '@/server/draft-actions'
import { requestPasswordResetAction, resetPasswordAction } from '@/server/reset-actions'
import { requestOtpAction, verifyOtpAction } from '@/server/otp-actions'

/* --------------------------------------------------------------------------
   Props (supplied by src/app/auth/page.tsx — route is fixed)
   -------------------------------------------------------------------------- */
type Provider = 'google' | 'yandex'
type OtpChannel = 'sms' | 'whatsapp' | 'telegram' | 'max' | 'email'

interface AuthProps {
  providers: Provider[]
  telegramBot: string | null
  initialError: string | null
  resetToken: string | null
  resetDone: boolean
  initialMode: 'login' | 'register'
  next: string | null // internal return path (e.g. back to the in-progress booking)
}

type View = 'login' | 'register' | 'reset' | 'newpassword' | 'otp'

const initialState: ActionResult = { ok: false }

/* --------------------------------------------------------------------------
   Copy (RU / EN)
   -------------------------------------------------------------------------- */
const dict: Record<'ru' | 'en' | 'tr' | 'es' | 'de', Record<string, string>> = {
  ru: {
    or: 'ИЛИ',
    // login
    loginTitle: 'С возвращением',
    loginSub: 'Войдите в личный кабинет AVENTA',
    email: 'EMAIL',
    emailPh: 'ivan@mail.com',
    password: 'ПАРОЛЬ',
    passwordPh: '••••••••',
    forgot: 'Забыли пароль?',
    remember: 'Запомнить меня',
    signIn: 'Войти',
    noAccount: 'Нет аккаунта?',
    createAccount: 'Создать аккаунт',
    // social / alt
    continueWith: 'Продолжить с',
    withGoogle: 'Войти через Google',
    withYandex: 'Войти через Яндекс',
    oauthHint: 'Настройте OAuth-ключи, чтобы включить вход через соцсети',
    byCode: 'Войти по коду / телефону',
    telegramBtn: 'Войти через Telegram',
    // register
    registerTitle: 'Создать аккаунт',
    registerSub: 'Бронируйте за минуту при следующем визите',
    firstName: 'ИМЯ',
    firstNamePh: 'Иван',
    lastName: 'ФАМИЛИЯ',
    lastNamePh: 'Петров',
    phone: 'ТЕЛЕФОН',
    phonePh: '+90 555 123 45 67',
    passwordMin: 'Минимум 8 символов',
    consentData: 'Согласен на обработку персональных данных',
    consentOffer: 'Принимаю оферту и политику конфиденциальности',
    registerCta: 'Создать аккаунт',
    namePh: 'Ваше имя',
    signupSentTitle: 'Проверьте почту',
    signupSentBody: 'Мы отправили ссылку для установки пароля. Задайте пароль — и вы вернётесь к своему бронированию.',
    signupDev: 'DEV-ссылка (только для разработки):',
    haveAccount: 'Уже есть аккаунт?',
    signInLink: 'Войти',
    // reset request
    resetTitle: 'Сброс пароля',
    resetSub: 'Укажите email — пришлём ссылку для создания нового пароля',
    sendLink: 'Отправить ссылку',
    resetSent: 'Письмо отправлено — проверьте почту',
    emailNotRegistered: 'Этот email не зарегистрирован — сначала создайте аккаунт',
    devLink: 'Ссылка (dev):',
    backToLogin: '← Вернуться ко входу',
    // new password
    newPassTitle: 'Новый пароль',
    newPassSub: 'Придумайте новый пароль для входа',
    newPassword: 'НОВЫЙ ПАРОЛЬ',
    confirmPassword: 'ПОВТОРИТЕ ПАРОЛЬ',
    confirmPh: 'ещё раз',
    savePass: 'Сохранить пароль',
    passMismatch: 'Пароли не совпадают',
    // otp
    otpTitle: 'Вход по коду',
    otpSub: 'Выберите канал и получите одноразовый код',
    otpChannel: 'КАНАЛ',
    chSms: 'Телефон (SMS)',
    chWhatsapp: 'WhatsApp',
    chTelegram: 'Telegram',
    chMax: 'MAX',
    chEmail: 'Email',
    identPhone: 'НОМЕР ТЕЛЕФОНА',
    identEmail: 'EMAIL',
    identPhonePh: '+90 555 123 45 67',
    getCode: 'Получить код',
    codeSent: 'Код отправлен',
    codeLabel: 'КОД ПОДТВЕРЖДЕНИЯ',
    firstNameOpt: 'ИМЯ (для новых пользователей)',
    confirm: 'Подтвердить',
    changeChannel: '← Изменить канал',
    devCode: '(dev) код:',
    resend: 'Отправить код повторно',
  },
  en: {
    or: 'OR',
    loginTitle: 'Welcome back',
    loginSub: 'Sign in to your AVENTA account',
    email: 'EMAIL',
    emailPh: 'ivan@mail.com',
    password: 'PASSWORD',
    passwordPh: '••••••••',
    forgot: 'Forgot password?',
    remember: 'Remember me',
    signIn: 'Sign in',
    noAccount: 'No account?',
    createAccount: 'Create account',
    continueWith: 'Continue with',
    withGoogle: 'Sign in with Google',
    withYandex: 'Sign in with Yandex',
    oauthHint: 'Configure OAuth keys to enable social sign-in',
    byCode: 'Sign in by code / phone',
    telegramBtn: 'Sign in with Telegram',
    registerTitle: 'Create account',
    registerSub: 'Book in a minute on your next visit',
    firstName: 'FIRST NAME',
    firstNamePh: 'Ivan',
    lastName: 'LAST NAME',
    lastNamePh: 'Petrov',
    phone: 'PHONE',
    phonePh: '+90 555 123 45 67',
    passwordMin: 'At least 8 characters',
    consentData: 'I agree to personal-data processing',
    consentOffer: 'I accept the public offer and privacy policy',
    registerCta: 'Create account',
    namePh: 'Your name',
    signupSentTitle: 'Check your email',
    signupSentBody: 'We’ve emailed you a link to set your password. Set it and you’ll return to your booking.',
    signupDev: 'DEV link (development only):',
    haveAccount: 'Already have an account?',
    signInLink: 'Sign in',
    resetTitle: 'Reset password',
    resetSub: 'Enter your email — we will send a link to create a new password',
    sendLink: 'Send link',
    resetSent: 'Email sent — check your inbox',
    emailNotRegistered: 'This email is not registered — please sign up first',
    devLink: 'Link (dev):',
    backToLogin: '← Back to sign in',
    newPassTitle: 'New password',
    newPassSub: 'Choose a new password to sign in',
    newPassword: 'NEW PASSWORD',
    confirmPassword: 'CONFIRM PASSWORD',
    confirmPh: 'again',
    savePass: 'Save password',
    passMismatch: 'Passwords do not match',
    otpTitle: 'Sign in by code',
    otpSub: 'Pick a channel and get a one-time code',
    otpChannel: 'CHANNEL',
    chSms: 'Phone (SMS)',
    chWhatsapp: 'WhatsApp',
    chTelegram: 'Telegram',
    chMax: 'MAX',
    chEmail: 'Email',
    identPhone: 'PHONE NUMBER',
    identEmail: 'EMAIL',
    identPhonePh: '+90 555 123 45 67',
    getCode: 'Get code',
    codeSent: 'Code sent',
    codeLabel: 'VERIFICATION CODE',
    firstNameOpt: 'FIRST NAME (for new users)',
    confirm: 'Confirm',
    changeChannel: '← Change channel',
    devCode: '(dev) code:',
    resend: 'Resend code',
  },
  tr: {
    or: 'VEYA',
    loginTitle: 'Tekrar hoş geldiniz',
    loginSub: 'AVENTA hesabınıza giriş yapın',
    email: 'E-POSTA',
    emailPh: 'ivan@mail.com',
    password: 'PAROLA',
    passwordPh: '••••••••',
    forgot: 'Parolanızı mı unuttunuz?',
    remember: 'Beni hatırla',
    signIn: 'Giriş yap',
    noAccount: 'Hesabınız yok mu?',
    createAccount: 'Hesap oluştur',
    continueWith: 'Şununla devam et',
    withGoogle: 'Google ile giriş yap',
    withYandex: 'Yandex ile giriş yap',
    oauthHint: 'Sosyal girişi etkinleştirmek için OAuth anahtarlarını yapılandırın',
    byCode: 'Kod / telefon ile giriş yap',
    telegramBtn: 'Telegram ile giriş yap',
    registerTitle: 'Hesap oluştur',
    registerSub: 'Bir sonraki ziyaretinizde dakikalar içinde rezervasyon yapın',
    firstName: 'AD',
    firstNamePh: 'Ahmet',
    lastName: 'SOYAD',
    lastNamePh: 'Yılmaz',
    phone: 'TELEFON',
    phonePh: '+90 555 123 45 67',
    passwordMin: 'En az 8 karakter',
    consentData: 'Kişisel verilerimin işlenmesini kabul ediyorum',
    consentOffer: 'Kamuya açık teklifi ve gizlilik politikasını kabul ediyorum',
    registerCta: 'Hesap oluştur',
    namePh: 'Adınız',
    signupSentTitle: 'E-postanızı kontrol edin',
    signupSentBody: 'Parolanızı belirlemeniz için size bir bağlantı gönderdik. Belirledikten sonra rezervasyonunuza geri döneceksiniz.',
    signupDev: 'DEV bağlantısı (yalnızca geliştirme):',
    haveAccount: 'Zaten hesabınız var mı?',
    signInLink: 'Giriş yap',
    resetTitle: 'Parolayı sıfırla',
    resetSub: 'E-postanızı girin — yeni bir parola oluşturmanız için bağlantı göndereceğiz',
    sendLink: 'Bağlantı gönder',
    resetSent: 'E-posta gönderildi — gelen kutunuzu kontrol edin',
    emailNotRegistered: 'Bu e-posta kayıtlı değil — önce kayıt olun',
    devLink: 'Bağlantı (dev):',
    backToLogin: '← Girişe dön',
    newPassTitle: 'Yeni parola',
    newPassSub: 'Giriş yapmak için yeni bir parola belirleyin',
    newPassword: 'YENİ PAROLA',
    confirmPassword: 'PAROLAYI ONAYLA',
    confirmPh: 'tekrar',
    savePass: 'Parolayı kaydet',
    passMismatch: 'Parolalar eşleşmiyor',
    otpTitle: 'Kod ile giriş yap',
    otpSub: 'Bir kanal seçin ve tek kullanımlık kod alın',
    otpChannel: 'KANAL',
    chSms: 'Telefon (SMS)',
    chWhatsapp: 'WhatsApp',
    chTelegram: 'Telegram',
    chMax: 'MAX',
    chEmail: 'E-posta',
    identPhone: 'TELEFON NUMARASI',
    identEmail: 'E-POSTA',
    identPhonePh: '+90 555 123 45 67',
    getCode: 'Kod al',
    codeSent: 'Kod gönderildi',
    codeLabel: 'DOĞRULAMA KODU',
    firstNameOpt: 'AD (yeni kullanıcılar için)',
    confirm: 'Onayla',
    changeChannel: '← Kanalı değiştir',
    devCode: '(dev) kod:',
    resend: 'Kodu yeniden gönder',
  },
  es: {
    or: 'O',
    loginTitle: 'Bienvenido de nuevo',
    loginSub: 'Inicia sesión en tu cuenta de AVENTA',
    email: 'CORREO',
    emailPh: 'ivan@mail.com',
    password: 'CONTRASEÑA',
    passwordPh: '••••••••',
    forgot: '¿Olvidaste tu contraseña?',
    remember: 'Recuérdame',
    signIn: 'Iniciar sesión',
    noAccount: '¿No tienes cuenta?',
    createAccount: 'Crear cuenta',
    continueWith: 'Continuar con',
    withGoogle: 'Iniciar sesión con Google',
    withYandex: 'Iniciar sesión con Yandex',
    oauthHint: 'Configura las claves OAuth para habilitar el inicio de sesión social',
    byCode: 'Iniciar sesión con código / teléfono',
    telegramBtn: 'Iniciar sesión con Telegram',
    registerTitle: 'Crear cuenta',
    registerSub: 'Reserva en un minuto en tu próxima visita',
    firstName: 'NOMBRE',
    firstNamePh: 'Juan',
    lastName: 'APELLIDO',
    lastNamePh: 'García',
    phone: 'TELÉFONO',
    phonePh: '+90 555 123 45 67',
    passwordMin: 'Al menos 8 caracteres',
    consentData: 'Acepto el tratamiento de mis datos personales',
    consentOffer: 'Acepto la oferta pública y la política de privacidad',
    registerCta: 'Crear cuenta',
    namePh: 'Tu nombre',
    signupSentTitle: 'Revisa tu correo',
    signupSentBody: 'Te hemos enviado un enlace por correo para establecer tu contraseña. Configúrala y volverás a tu reserva.',
    signupDev: 'Enlace DEV (solo para desarrollo):',
    haveAccount: '¿Ya tienes una cuenta?',
    signInLink: 'Iniciar sesión',
    resetTitle: 'Restablecer contraseña',
    resetSub: 'Introduce tu correo — te enviaremos un enlace para crear una nueva contraseña',
    sendLink: 'Enviar enlace',
    resetSent: 'Correo enviado — revisa tu bandeja de entrada',
    emailNotRegistered: 'Este correo no está registrado — regístrate primero',
    devLink: 'Enlace (dev):',
    backToLogin: '← Volver al inicio de sesión',
    newPassTitle: 'Nueva contraseña',
    newPassSub: 'Elige una nueva contraseña para iniciar sesión',
    newPassword: 'NUEVA CONTRASEÑA',
    confirmPassword: 'CONFIRMAR CONTRASEÑA',
    confirmPh: 'de nuevo',
    savePass: 'Guardar contraseña',
    passMismatch: 'Las contraseñas no coinciden',
    otpTitle: 'Iniciar sesión con código',
    otpSub: 'Elige un canal y recibe un código de un solo uso',
    otpChannel: 'CANAL',
    chSms: 'Teléfono (SMS)',
    chWhatsapp: 'WhatsApp',
    chTelegram: 'Telegram',
    chMax: 'MAX',
    chEmail: 'Correo',
    identPhone: 'NÚMERO DE TELÉFONO',
    identEmail: 'CORREO',
    identPhonePh: '+90 555 123 45 67',
    getCode: 'Obtener código',
    codeSent: 'Código enviado',
    codeLabel: 'CÓDIGO DE VERIFICACIÓN',
    firstNameOpt: 'NOMBRE (para nuevos usuarios)',
    confirm: 'Confirmar',
    changeChannel: '← Cambiar canal',
    devCode: '(dev) código:',
    resend: 'Reenviar código',
  },
  de: {
    or: 'ODER',
    loginTitle: 'Willkommen zurück',
    loginSub: 'Melden Sie sich bei Ihrem AVENTA-Konto an',
    email: 'E-MAIL',
    emailPh: 'ivan@mail.com',
    password: 'PASSWORT',
    passwordPh: '••••••••',
    forgot: 'Passwort vergessen?',
    remember: 'Angemeldet bleiben',
    signIn: 'Anmelden',
    noAccount: 'Kein Konto?',
    createAccount: 'Konto erstellen',
    continueWith: 'Weiter mit',
    withGoogle: 'Mit Google anmelden',
    withYandex: 'Mit Yandex anmelden',
    oauthHint: 'Konfigurieren Sie OAuth-Schlüssel, um die Social-Anmeldung zu aktivieren',
    byCode: 'Mit Code / Telefon anmelden',
    telegramBtn: 'Mit Telegram anmelden',
    registerTitle: 'Konto erstellen',
    registerSub: 'Buchen Sie bei Ihrem nächsten Besuch in einer Minute',
    firstName: 'VORNAME',
    firstNamePh: 'Max',
    lastName: 'NACHNAME',
    lastNamePh: 'Mustermann',
    phone: 'TELEFON',
    phonePh: '+90 555 123 45 67',
    passwordMin: 'Mindestens 8 Zeichen',
    consentData: 'Ich stimme der Verarbeitung meiner personenbezogenen Daten zu',
    consentOffer: 'Ich akzeptiere das öffentliche Angebot und die Datenschutzrichtlinie',
    registerCta: 'Konto erstellen',
    namePh: 'Ihr Name',
    signupSentTitle: 'Prüfen Sie Ihre E-Mails',
    signupSentBody: 'Wir haben Ihnen einen Link zum Festlegen Ihres Passworts per E-Mail gesendet. Legen Sie es fest und Sie kehren zu Ihrer Buchung zurück.',
    signupDev: 'DEV-Link (nur für Entwicklung):',
    haveAccount: 'Haben Sie bereits ein Konto?',
    signInLink: 'Anmelden',
    resetTitle: 'Passwort zurücksetzen',
    resetSub: 'Geben Sie Ihre E-Mail ein — wir senden Ihnen einen Link, um ein neues Passwort zu erstellen',
    sendLink: 'Link senden',
    resetSent: 'E-Mail gesendet — überprüfen Sie Ihren Posteingang',
    emailNotRegistered: 'Diese E-Mail ist nicht registriert — bitte zuerst registrieren',
    devLink: 'Link (dev):',
    backToLogin: '← Zurück zur Anmeldung',
    newPassTitle: 'Neues Passwort',
    newPassSub: 'Wählen Sie ein neues Passwort für die Anmeldung',
    newPassword: 'NEUES PASSWORT',
    confirmPassword: 'PASSWORT BESTÄTIGEN',
    confirmPh: 'erneut',
    savePass: 'Passwort speichern',
    passMismatch: 'Passwörter stimmen nicht überein',
    otpTitle: 'Mit Code anmelden',
    otpSub: 'Wählen Sie einen Kanal und erhalten Sie einen Einmalcode',
    otpChannel: 'KANAL',
    chSms: 'Telefon (SMS)',
    chWhatsapp: 'WhatsApp',
    chTelegram: 'Telegram',
    chMax: 'MAX',
    chEmail: 'E-Mail',
    identPhone: 'TELEFONNUMMER',
    identEmail: 'E-MAIL',
    identPhonePh: '+90 555 123 45 67',
    getCode: 'Code anfordern',
    codeSent: 'Code gesendet',
    codeLabel: 'BESTÄTIGUNGSCODE',
    firstNameOpt: 'VORNAME (für neue Nutzer)',
    confirm: 'Bestätigen',
    changeChannel: '← Kanal ändern',
    devCode: '(dev) Code:',
    resend: 'Code erneut senden',
  },
}

type T = (typeof dict)['ru']

/* --------------------------------------------------------------------------
   Friendly banners for `initialError` codes (from OAuth / Telegram redirects)
   -------------------------------------------------------------------------- */
function mapInitialError(code: string | null, t: T, lang: Lang): string | null {
  if (!code) return null
  const pick = (m: Record<Lang, string>): string => m[lang] ?? m.en
  if (code === 'provider_unavailable') {
    return pick({ ru: 'Этот способ входа пока не настроен', en: 'This sign-in method is not configured yet', tr: 'Bu giriş yöntemi henüz yapılandırılmadı', es: 'Este método de inicio de sesión aún no está configurado', de: 'Diese Anmeldemethode ist noch nicht konfiguriert' })
  }
  if (code === 'unknown_provider') {
    return pick({ ru: 'Неизвестный способ входа', en: 'Unknown sign-in method', tr: 'Bilinmeyen giriş yöntemi', es: 'Método de inicio de sesión desconocido', de: 'Unbekannte Anmeldemethode' })
  }
  if (code.startsWith('oauth') || code.startsWith('telegram')) {
    return pick({ ru: 'Не удалось войти, попробуйте снова', en: 'Sign-in failed, please try again', tr: 'Giriş başarısız oldu, lütfen tekrar deneyin', es: 'Error al iniciar sesión, inténtalo de nuevo', de: 'Anmeldung fehlgeschlagen, bitte versuchen Sie es erneut' })
  }
  return pick({ ru: 'Произошла ошибка, попробуйте снова', en: 'Something went wrong, please try again', tr: 'Bir hata oluştu, lütfen tekrar deneyin', es: 'Algo salió mal, inténtalo de nuevo', de: 'Etwas ist schiefgelaufen, bitte versuchen Sie es erneut' })
}

/* --------------------------------------------------------------------------
   Shared style tokens (literal hex from the design)
   -------------------------------------------------------------------------- */
const C = {
  text: '#0a2225',
  muted: '#5b7678',
  label: '#5b7678',
  teal: '#0d9488',
  coral: '#fb6d4c',
  fieldBg: '#ffffff',
  fieldBorder: 'rgba(10,34,37,.10)',
  placeholder: '#8aa2a3',
  green: '#0f9d6f',
  danger: '#ef5c3a',
} as const

// dark hero gradient for the brand panel / mobile hero
const cardGrad = 'radial-gradient(135% 120% at 68% 12%,#0f7173 0%,#0a4247 44%,#05191d 100%)'
const coralGrad = '#fb6d4c'

const fLabel: CSSProperties = {
  font: '600 11px var(--f-mono)',
  letterSpacing: '.12em',
  textTransform: 'uppercase',
  color: C.muted,
  marginBottom: 8,
}
const fLabelSm: CSSProperties = {
  font: '600 10px var(--f-mono)',
  letterSpacing: '.1em',
  textTransform: 'uppercase',
  color: C.muted,
  marginBottom: 6,
}

const fieldBase: CSSProperties = {
  background: C.fieldBg,
  border: `1.5px solid ${C.fieldBorder}`,
  borderRadius: 13,
  padding: '14px 15px',
  font: '500 15px var(--f-ui)',
  color: C.text,
  width: '100%',
  outline: 'none',
}

const coralCta: CSSProperties = {
  marginTop: 18,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 9,
  padding: 15,
  background: coralGrad,
  color: '#fff',
  borderRadius: 13,
  font: "700 15.5px var(--f-display)",
  boxShadow: '0 12px 26px -12px #fb6d4c',
  border: 'none',
  width: '100%',
  cursor: 'pointer',
}

const outlineBtn: CSSProperties = {
  textAlign: 'center',
  padding: 13,
  minHeight: 44,
  boxSizing: 'border-box',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 9,
  border: `1.5px solid ${C.fieldBorder}`,
  borderRadius: 12,
  font: '600 14px var(--f-ui)',
  color: C.text,
  background: '#fff',
  width: '100%',
  cursor: 'pointer',
}

/* --------------------------------------------------------------------------
   Small presentational helpers
   -------------------------------------------------------------------------- */
function FieldError({ error }: { error?: string }) {
  if (!error) return null
  return <div style={{ marginTop: 5, font: '600 11px var(--f-ui)', color: C.danger }}>{error}</div>
}

function Field({
  label,
  placeholder,
  type = 'text',
  small = false,
  trailing,
  name,
  defaultValue,
  value,
  onChange,
  error,
  autoComplete,
  inputMode,
}: {
  label: string
  placeholder: string
  type?: string
  small?: boolean
  trailing?: ReactNode
  name?: string
  defaultValue?: string
  value?: string
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void
  error?: string
  autoComplete?: string
  inputMode?: 'text' | 'numeric' | 'tel' | 'email'
}) {
  return (
    <div style={{ flex: 1 }}>
      {trailing ? (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
          <span style={{ ...(small ? fLabelSm : fLabel), marginBottom: 0 }}>{label}</span>
          {trailing}
        </div>
      ) : (
        <div style={small ? fLabelSm : fLabel}>{label}</div>
      )}
      <input
        type={type}
        name={name}
        defaultValue={defaultValue}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        inputMode={inputMode}
        placeholder={placeholder}
        style={{
          ...fieldBase,
          ...(small ? { borderRadius: 10, padding: '12px 14px', font: '600 13px var(--f-ui)' } : {}),
          ...(error ? { border: `1px solid ${C.danger}` } : {}),
        }}
      />
      <FieldError error={error} />
    </div>
  )
}

function CheckBox({
  checked,
  onClick,
  align = 'center',
}: {
  checked: boolean
  onClick: () => void
  align?: 'center' | 'flex-start'
}) {
  return (
    <span
      onClick={onClick}
      role="checkbox"
      aria-checked={checked}
      style={{
        width: 21,
        height: 21,
        borderRadius: 7,
        background: checked ? C.teal : '#fff',
        border: `1.5px solid ${checked ? C.teal : C.fieldBorder}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        font: '700 11px var(--f-ui)',
        flexShrink: 0,
        marginTop: align === 'flex-start' ? 1 : 0,
        cursor: 'pointer',
      }}
    >
      {checked ? '✓' : ''}
    </span>
  )
}

/** Top-of-form error banner. */
function ErrorBanner({ message }: { message?: string }) {
  if (!message) return null
  return (
    <div
      style={{
        marginTop: 16,
        background: '#FDECEC',
        border: `1px solid ${C.danger}`,
        borderRadius: 12,
        padding: '11px 14px',
        font: '600 12px var(--f-ui)',
        color: C.danger,
      }}
    >
      {message}
    </div>
  )
}

/** Green success banner. */
function SuccessBanner({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        marginTop: 16,
        background: '#E9FBF2',
        border: '1px solid rgba(39,181,118,.3)',
        borderRadius: 12,
        padding: '12px 15px',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#1F9E6B"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ flexShrink: 0 }}
      >
        <path d="M20 6L9 17l-5-5" />
      </svg>
      <span style={{ font: '600 12px var(--f-ui)', color: '#1F8A5B' }}>{children}</span>
    </div>
  )
}

/** Coral submit button reflecting the enclosing form's pending state. */
function SubmitButton({ label, style }: { label: string; style?: CSSProperties }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      className="rda-cta"
      disabled={pending}
      style={{ ...coralCta, ...style, opacity: pending ? 0.7 : 1, cursor: pending ? 'progress' : 'pointer' }}
    >
      {label}
    </button>
  )
}

/** Coral button not tied to a form (drives an async handler with its own pending flag). */
function ActionButton({
  label,
  onClick,
  pending,
  style,
}: {
  label: string
  onClick: () => void
  pending: boolean
  style?: CSSProperties
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rda-cta"
      disabled={pending}
      style={{ ...coralCta, ...style, opacity: pending ? 0.7 : 1, cursor: pending ? 'progress' : 'pointer' }}
    >
      {label}
    </button>
  )
}

function Divider({ label }: { label: string }) {
  return (
    <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', gap: 14 }}>
      <span style={{ flex: 1, height: 1, background: C.fieldBorder }} />
      <span style={{ font: '600 11px var(--f-mono)', letterSpacing: '.14em', textTransform: 'uppercase', color: C.placeholder }}>{label}</span>
      <span style={{ flex: 1, height: 1, background: C.fieldBorder }} />
    </div>
  )
}

function SwitchLink({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <span onClick={onClick} style={{ color: C.coral, fontWeight: 700, cursor: 'pointer' }}>
      {children}
    </span>
  )
}

function BackLink({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="av-tap"
      style={{
        marginTop: 10,
        padding: '11px 8px',
        textAlign: 'center',
        font: '700 13px var(--f-ui)',
        color: C.teal,
        cursor: 'pointer',
      }}
    >
      {label}
    </div>
  )
}

/** The white card surface centred on the sky-blue panel. */
/** Transparent form column — the surrounding form panel (desktop) / sheet (mobile) is the surface. */
function AuthCard({ children }: { pad?: number; children: ReactNode }) {
  return <div style={{ width: '100%', maxWidth: 436 }}>{children}</div>
}

function CardHead({ title, sub, icon }: { title: string; sub: string; icon?: ReactNode }) {
  return (
    <div>
      {icon && <div style={{ marginBottom: 16 }}>{icon}</div>}
      <div style={{ font: '700 26px var(--f-display)', letterSpacing: '-.01em', color: C.text }}>{title}</div>
      <div style={{ marginTop: 7, font: '500 14px/1.5 var(--f-ui)', color: C.muted }}>{sub}</div>
    </div>
  )
}

function MarkBadge({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        width: 56,
        height: 56,
        borderRadius: 16,
        background: 'var(--rd-teal-soft)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {children}
    </div>
  )
}

/* --------------------------------------------------------------------------
   Brand social buttons
   -------------------------------------------------------------------------- */
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z"
      />
      <path
        fill="#34A853"
        d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z"
      />
      <path
        fill="#FBBC05"
        d="M11.69 28.18C11.25 26.86 11 25.45 11 24s.25-2.86.69-4.18v-5.7H4.34A21.99 21.99 0 002 24c0 3.55.85 6.91 2.34 9.88l7.35-5.7z"
      />
      <path
        fill="#EA4335"
        d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z"
      />
    </svg>
  )
}

function YandexIcon() {
  return (
    <span
      style={{
        width: 18,
        height: 18,
        borderRadius: '50%',
        background: '#FC3F1D',
        color: '#fff',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        font: '800 12px var(--f-display)',
        flexShrink: 0,
      }}
      aria-hidden="true"
    >
      Я
    </span>
  )
}

function TelegramIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="12" fill="#2AABEE" />
      <path
        fill="#fff"
        d="M5.5 11.8 16.2 7.6c.5-.18.94.12.78.88l-1.82 8.58c-.13.6-.5.75-1 .47l-2.77-2.04-1.34 1.29c-.15.15-.27.27-.55.27l.2-2.82 5.13-4.63c.22-.2-.05-.31-.34-.11l-6.34 3.99-2.73-.85c-.6-.19-.6-.6.13-.9z"
      />
    </svg>
  )
}

function SocialButton({ href, icon, label }: { href: string; icon: ReactNode; label: string }) {
  return (
    <a
      href={href}
      className="av-tap rda-social"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        padding: 13,
        minHeight: 46,
        boxSizing: 'border-box',
        background: '#fff',
        border: `1.5px solid ${C.fieldBorder}`,
        borderRadius: 12,
        font: '600 14px var(--f-ui)',
        color: C.text,
        width: '100%',
        textDecoration: 'none',
      }}
    >
      {icon}
      {label}
    </a>
  )
}

/* --------------------------------------------------------------------------
   Social + alt-login block rendered under the login/register form
   -------------------------------------------------------------------------- */
function SocialBlock({
  t,
  providers,
  telegramBot,
  onCode,
  onTelegram,
  next,
}: {
  t: T
  providers: Provider[]
  telegramBot: string | null
  onCode: () => void
  onTelegram: () => void
  next?: string | null
}) {
  // Social sign-in returns to the booking when we arrived from there, else the account page.
  const dest = encodeURIComponent(next || '/account')
  return (
    <>
      <Divider label={t.or} />

      <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {providers.includes('google') && (
          <SocialButton href={`/api/auth/oauth/google?next=${dest}`} icon={<GoogleIcon />} label={t.withGoogle} />
        )}
        {providers.includes('yandex') && (
          <SocialButton href={`/api/auth/oauth/yandex?next=${dest}`} icon={<YandexIcon />} label={t.withYandex} />
        )}

        {providers.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              font: '600 11px/1.5 var(--f-ui)',
              color: C.placeholder,
              padding: '4px 6px',
            }}
          >
            {t.oauthHint}
          </div>
        )}

        {telegramBot && (
          <button type="button" onClick={onTelegram} className="av-cta" style={{ ...outlineBtn, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            <TelegramIcon />
            {t.telegramBtn}
          </button>
        )}

        <button type="button" onClick={onCode} style={outlineBtn}>
          {t.byCode}
        </button>
      </div>
    </>
  )
}

/* --------------------------------------------------------------------------
   OTP six-digit input row (controlled, focus-advance)
   -------------------------------------------------------------------------- */
function OtpRow({ code, setCode }: { code: string; setCode: (v: string) => void }) {
  const isMobile = useIsMobile()
  const refs = useRef<Array<HTMLInputElement | null>>([])
  const digits = useMemo(() => {
    const arr = code.split('')
    return Array.from({ length: 6 }, (_, i) => arr[i] ?? '')
  }, [code])

  const setAt = (i: number, v: string) => {
    const next = [...digits]
    next[i] = v
    setCode(next.join(''))
  }

  const onChange = (i: number) => (e: ChangeEvent<HTMLInputElement>) => {
    const digit = e.target.value.replace(/\D/g, '').slice(-1)
    setAt(i, digit)
    if (digit && i < 5) refs.current[i + 1]?.focus()
  }

  const onKeyDown = (i: number) => (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) refs.current[i - 1]?.focus()
  }

  return (
    <div style={{ marginTop: 20, display: 'flex', justifyContent: 'center', gap: isMobile ? 6 : 9 }}>
      {digits.map((v, i) => {
        const active = v !== ''
        return (
          <input
            key={i}
            ref={(el) => {
              refs.current[i] = el
            }}
            value={v}
            onChange={onChange(i)}
            onKeyDown={onKeyDown(i)}
            inputMode="numeric"
            maxLength={1}
            aria-label={`OTP digit ${i + 1}`}
            style={{
              width: isMobile ? 0 : 48,
              flex: isMobile ? '1 1 0' : undefined,
              minWidth: 0,
              maxWidth: 52,
              height: 54,
              borderRadius: 12,
              textAlign: 'center',
              background: '#fff',
              border: `1.5px solid ${active ? C.teal : C.fieldBorder}`,
              boxShadow: active ? '0 0 0 4px var(--rd-teal-soft)' : 'none',
              font: '700 22px var(--f-display)',
              color: C.text,
              outline: 'none',
              caretColor: C.teal,
            }}
          />
        )
      })}
    </div>
  )
}

/* ==========================================================================
   Redesign shell — split-screen (desktop) / dark-hero + white-sheet (mobile),
   scoped under `.rda`. All logic (views, actions, 5 languages) is unchanged.
   ========================================================================== */

const AUTH_FONTS =
  'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Manrope:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap'

const AUTH_CSS = `
.rda input:focus,.rda select:focus,.rda textarea:focus{border-color:#0d9488 !important;box-shadow:0 0 0 4px rgba(13,148,136,.10) !important}
.rda .rda-social:hover{border-color:#0d9488 !important;transform:translateY(-2px);box-shadow:0 12px 24px -14px rgba(6,33,38,.5)}
.rda .rda-cta{transition:transform .18s,background .2s,box-shadow .2s}
.rda .rda-cta:hover{transform:translateY(-2px);background:#ef5c3a;box-shadow:0 18px 34px -12px #ef5c3a}
.rda .rda-cta:active{transform:translateY(0)}
.rda .rda-orb{position:absolute;border-radius:50%;pointer-events:none}
.rda .rda-orb1{animation:rda-floatSlow 15s ease-in-out infinite}
.rda .rda-orb2{animation:rda-float 12s ease-in-out infinite}
@keyframes rda-float{0%,100%{transform:translate(0,0)}50%{transform:translate(18px,-26px)}}
@keyframes rda-floatSlow{0%,100%{transform:translate(0,0)}50%{transform:translate(-24px,28px)}}
.rda-scroll::-webkit-scrollbar{width:8px}
.rda-scroll::-webkit-scrollbar-thumb{background:rgba(10,34,37,.16);border-radius:9px}
@media(prefers-reduced-motion:reduce){.rda .rda-orb1,.rda .rda-orb2{animation:none}}
`

type BrandCopy = { eyebrow: string; h1: string; sub: string; rating: string; from: string; perDay: string; quote: string; by: string; years: string; guests: string; rated: string; back: string }
const BRAND: Record<Lang, BrandCopy> = {
  ru: { eyebrow: 'ПРЕМИУМ-ПРОКАТ · АНТАЛИЯ', h1: 'Ваши ключи уже ждут в Анталии.', sub: 'Премиум-авто с доставкой к двери — полная страховка, без кредитной карты и поддержка на вашем языке.', rating: '4.9 · 2000+ поездок', from: 'от €32', perDay: '/сут', quote: 'Машину подали прямо в аэропорт — идеально чистая и точно по договору. Вернёмся снова!', by: 'Елена К. · Анталия, июль 2026', years: '8 ЛЕТ В АНТАЛИИ', guests: '2 000+ ГОСТЕЙ', rated: 'ОЦЕНКА 4.9★', back: 'На главную' },
  en: { eyebrow: 'PREMIUM CAR RENTAL · ANTALYA', h1: 'Your keys are waiting in Antalya.', sub: 'Premium cars delivered to your door — fully insured, no credit card required, and support in your language.', rating: '4.9 · 2,000+ trips', from: 'from €32', perDay: '/day', quote: 'Car met us right at the airport — spotless and exactly per contract. We’ll be back.', by: 'Elena K. · Antalya, Jul 2026', years: '8 YEARS IN ANTALYA', guests: '2,000+ HAPPY GUESTS', rated: '4.9★ RATED', back: 'Back to home' },
  tr: { eyebrow: 'PREMIUM ARAÇ KİRALAMA · ANTALYA', h1: 'Anahtarlarınız Antalya’da sizi bekliyor.', sub: 'Premium araçlar kapınıza teslim — tam sigortalı, kredi kartı gerekmez, kendi dilinizde destek.', rating: '4.9 · 2000+ yolculuk', from: '€32’den', perDay: '/gün', quote: 'Aracı doğrudan havalimanında teslim ettiler — tertemiz ve sözleşmeye tam uygun. Yine geleceğiz.', by: 'Elena K. · Antalya, Tem 2026', years: 'ANTALYA’DA 8 YIL', guests: '2000+ MUTLU MİSAFİR', rated: '4.9★ PUAN', back: 'Ana sayfaya dön' },
  es: { eyebrow: 'ALQUILER PREMIUM · ANTALYA', h1: 'Tus llaves te esperan en Antalya.', sub: 'Coches premium entregados en tu puerta — con seguro completo, sin tarjeta de crédito y atención en tu idioma.', rating: '4.9 · 2000+ viajes', from: 'desde €32', perDay: '/día', quote: 'Nos entregaron el coche en el aeropuerto — impecable y exactamente según el contrato. Volveremos.', by: 'Elena K. · Antalya, jul 2026', years: '8 AÑOS EN ANTALYA', guests: '2000+ CLIENTES FELICES', rated: '4.9★ VALORADO', back: 'Volver al inicio' },
  de: { eyebrow: 'PREMIUM-AUTOVERMIETUNG · ANTALYA', h1: 'Ihre Schlüssel warten in Antalya.', sub: 'Premium-Autos bis vor Ihre Tür — vollversichert, ohne Kreditkarte und Support in Ihrer Sprache.', rating: '4.9 · 2000+ Fahrten', from: 'ab €32', perDay: '/Tag', quote: 'Das Auto wurde direkt am Flughafen übergeben — makellos und genau nach Vertrag. Wir kommen wieder.', by: 'Elena K. · Antalya, Jul 2026', years: '8 JAHRE IN ANTALYA', guests: '2000+ ZUFRIEDENE GÄSTE', rated: '4.9★ BEWERTET', back: 'Zur Startseite' },
}

function Dot() {
  return <span style={{ width: 5, height: 5, borderRadius: '50%', background: C.coral, alignSelf: 'center' }} />
}

/** Dark brand panel (desktop left column): hero gradient, orbs, photo card, testimonial, trust row. */
function BrandPanel({ b }: { b: BrandCopy }) {
  return (
    <div style={{ position: 'relative', overflow: 'hidden', background: cardGrad, color: '#fff', padding: 44, display: 'flex', flexDirection: 'column' }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(135deg,rgba(255,255,255,.045) 0 1.5px,transparent 1.5px 22px)', opacity: 0.5, pointerEvents: 'none' }} />
      <div className="rda-orb rda-orb1" style={{ top: '-8%', right: '-6%', width: 460, height: 460, background: 'radial-gradient(circle,rgba(45,212,191,.5),transparent 62%)', filter: 'blur(36px)' }} />
      <div className="rda-orb rda-orb2" style={{ bottom: '-14%', left: '-10%', width: 420, height: 420, background: 'radial-gradient(circle,rgba(251,109,76,.34),transparent 64%)', filter: 'blur(40px)' }} />
      <a href="/" style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 11, width: 'max-content' }}>
        <span style={{ width: 38, height: 38, borderRadius: 11, background: C.coral, display: 'grid', placeItems: 'center', color: '#fff', font: '700 20px var(--f-display)', boxShadow: `0 8px 18px -6px ${C.coral}` }}>A</span>
        <span style={{ font: '700 22px var(--f-display)', letterSpacing: '.16em', color: '#fff' }}>AVENTA</span>
      </a>
      <div style={{ position: 'relative', margin: 'auto 0', maxWidth: 520 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 9, font: '600 12px var(--f-mono)', letterSpacing: '.2em', textTransform: 'uppercase', color: '#67e3d3' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: C.coral, boxShadow: `0 0 12px ${C.coral}` }} />{b.eyebrow}
        </span>
        <h1 style={{ font: '700 clamp(34px,3.6vw,52px)/1.04 var(--f-display)', letterSpacing: '-.02em', color: '#fff', margin: '18px 0 0' }}>{b.h1}</h1>
        <p style={{ font: '500 clamp(15px,1.2vw,17.5px)/1.6 var(--f-ui)', color: 'rgba(255,255,255,.82)', margin: '18px 0 0' }}>{b.sub}</p>
        <div style={{ position: 'relative', marginTop: 30 }}>
          <div style={{ position: 'relative', height: 230, borderRadius: 22, overflow: 'hidden', border: '1px solid rgba(255,255,255,.16)', boxShadow: '0 40px 80px -34px rgba(0,0,0,.7)' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/hero-composite.webp" alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,transparent 40%,rgba(4,20,23,.55))' }} />
            <span style={{ position: 'absolute', left: 14, top: 14, display: 'inline-flex', alignItems: 'center', gap: 7, padding: '7px 12px', borderRadius: 999, background: 'rgba(4,20,23,.55)', backdropFilter: 'blur(6px)', color: '#fff', font: '600 11px var(--f-mono)', letterSpacing: '.06em' }}><span style={{ color: '#f5b400' }}>★</span>{b.rating}</span>
            <span style={{ position: 'absolute', right: 14, bottom: 14, padding: '8px 13px', borderRadius: 12, background: 'rgba(255,255,255,.94)', color: C.text, font: '700 15px var(--f-display)', boxShadow: '0 12px 26px -12px rgba(0,0,0,.5)' }}>{b.from}<span style={{ font: '600 11px var(--f-ui)', color: C.muted }}>{b.perDay}</span></span>
          </div>
          <div style={{ position: 'relative', margin: '-34px 0 0 auto', width: '88%', background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.18)', borderRadius: 18, padding: '18px 20px', backdropFilter: 'blur(14px)', boxShadow: '0 24px 50px -26px rgba(0,0,0,.6)' }}>
            <div style={{ color: '#f5b400', fontSize: 13, letterSpacing: 2 }}>★★★★★</div>
            <p style={{ font: '500 14.5px/1.55 var(--f-ui)', color: '#fff', margin: '8px 0 0' }}>{b.quote}</p>
            <div style={{ font: '11px var(--f-mono)', color: 'rgba(255,255,255,.66)', marginTop: 9 }}>{b.by}</div>
          </div>
        </div>
      </div>
      <div style={{ position: 'relative', display: 'flex', flexWrap: 'wrap', gap: '10px 22px', font: '11.5px var(--f-mono)', letterSpacing: '.08em', color: 'rgba(255,255,255,.72)' }}>
        <span>{b.years}</span><Dot /><span>{b.guests}</span><Dot /><span>{b.rated}</span>
      </div>
    </div>
  )
}

/** Sign in / Create account animated pill toggle. */
function TabToggle({ view, go, t }: { view: View; go: (v: View) => void; t: T }) {
  const isCreate = view === 'register'
  const tab: CSSProperties = { position: 'relative', zIndex: 1, border: 'none', background: 'transparent', padding: '11px 0', cursor: 'pointer', font: '600 14.5px var(--f-display)', color: C.text }
  return (
    <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: '1fr 1fr', background: '#e7f1ef', border: `1px solid ${C.fieldBorder}`, borderRadius: 14, padding: 5, marginBottom: 24, userSelect: 'none' }}>
      <div style={{ position: 'absolute', top: 5, bottom: 5, left: 5, width: 'calc(50% - 5px)', background: '#fff', borderRadius: 10, boxShadow: '0 4px 12px -6px rgba(6,33,38,.4)', transition: 'transform .38s cubic-bezier(.16,.84,.34,1)', transform: `translateX(${isCreate ? '100%' : '0'})` }} />
      <button type="button" onClick={() => go('login')} style={tab}>{t.signIn}</button>
      <button type="button" onClick={() => go('register')} style={tab}>{t.createAccount}</button>
    </div>
  )
}

export default function Auth({
  providers,
  telegramBot,
  initialError,
  resetToken,
  resetDone,
  initialMode,
  next,
}: AuthProps) {
  const t = useDict(dict)
  const isMobile = useIsMobile()
  const { lang } = useLang()
  const b = BRAND[lang] ?? BRAND.en
  const [view, setView] = useState<View>(resetToken ? 'newpassword' : initialMode)
  const [otpChannel, setOtpChannel] = useState<OtpChannel>('sms')

  const bannerError = useMemo(() => mapInitialError(initialError, t, lang), [initialError, t, lang])

  const goCode = (ch: OtpChannel) => {
    setOtpChannel(ch)
    setView('otp')
  }

  const tabbed = view === 'login' || view === 'register'
  const viewNode = (
    <>
      {view === 'login' && (
        <LoginView t={t} go={setView} goCode={goCode} providers={providers} telegramBot={telegramBot} bannerError={bannerError} resetDone={resetDone} next={next} />
      )}
      {view === 'register' && (
        <RegisterView t={t} go={setView} goCode={goCode} providers={providers} telegramBot={telegramBot} bannerError={bannerError} next={next} />
      )}
      {view === 'reset' && <ResetView t={t} go={setView} />}
      {view === 'newpassword' && resetToken && <NewPasswordView t={t} token={resetToken} go={setView} next={next} />}
      {view === 'otp' && <OtpView t={t} go={setView} initialChannel={otpChannel} />}
    </>
  )

  const rootStyle = {
    '--f-display': "'Space Grotesk',system-ui,sans-serif",
    '--f-ui': "'Manrope',system-ui,sans-serif",
    '--f-mono': "'JetBrains Mono',ui-monospace,monospace",
    '--rd-teal-soft': 'rgba(13,148,136,.10)',
    minHeight: '100vh',
    fontFamily: 'var(--f-ui)',
    color: C.text,
  } as CSSProperties

  return (
    <div className="rda" style={rootStyle}>
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link rel="stylesheet" href={AUTH_FONTS} />
      <style dangerouslySetInnerHTML={{ __html: AUTH_CSS }} />

      {isMobile ? (
        /* ---------- MOBILE: dark hero + white sheet + dark trust footer ---------- */
        <div className="rda-scroll" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#0b4f52' }}>
          <div style={{ position: 'relative', overflow: 'hidden', flexShrink: 0, padding: '40px 20px 44px', background: 'radial-gradient(130% 120% at 74% 6%,#0f7173 0%,#0a4247 46%,#05191d 100%)', color: '#fff' }}>
            <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(135deg,rgba(255,255,255,.04) 0 1.5px,transparent 1.5px 22px)', opacity: 0.5 }} />
            <div className="rda-orb rda-orb1" style={{ top: '-16%', right: '-14%', width: 260, height: 260, background: 'radial-gradient(circle,rgba(45,212,191,.5),transparent 62%)', filter: 'blur(28px)' }} />
            <div className="rda-orb rda-orb2" style={{ bottom: '-26%', left: '-18%', width: 240, height: 240, background: 'radial-gradient(circle,rgba(251,109,76,.34),transparent 64%)', filter: 'blur(30px)' }} />
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <a href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 9 }}>
                <span style={{ width: 34, height: 34, borderRadius: 10, background: C.coral, display: 'grid', placeItems: 'center', color: '#fff', font: '700 18px var(--f-display)' }}>A</span>
                <span style={{ font: '700 19px var(--f-display)', letterSpacing: '.15em', color: '#fff' }}>AVENTA</span>
              </a>
              <LangToggle glass />
            </div>
            <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 26, font: '600 10.5px var(--f-mono)', letterSpacing: '.2em', textTransform: 'uppercase', color: '#67e3d3' }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: C.coral }} />{b.eyebrow}
            </span>
            <h1 style={{ position: 'relative', font: '700 28px/1.08 var(--f-display)', letterSpacing: '-.02em', color: '#fff', margin: '12px 0 0' }}>{b.h1}</h1>
            <p style={{ position: 'relative', font: '500 13.5px/1.55 var(--f-ui)', color: 'rgba(255,255,255,.8)', margin: '11px 0 0' }}>{b.sub}</p>
          </div>

          <div style={{ position: 'relative', zIndex: 2, flex: 1, marginTop: -24, background: '#eef6f5', borderRadius: '26px 26px 0 0', padding: '12px 20px 30px', boxShadow: '0 -18px 40px -24px rgba(0,0,0,.5)' }}>
            <div style={{ width: 42, height: 5, borderRadius: 99, background: C.fieldBorder, margin: '0 auto 18px' }} />
            {tabbed && <TabToggle view={view} go={setView} t={t} />}
            {viewNode}
          </div>

          <div style={{ flexShrink: 0, background: '#0b4f52', padding: '20px 20px 30px', textAlign: 'center' }}>
            <div style={{ display: 'inline-flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px 14px', font: '10px var(--f-mono)', letterSpacing: '.08em', color: 'rgba(255,255,255,.62)' }}>
              <span>{b.years}</span><Dot /><span>{b.guests}</span><Dot /><span>{b.rated}</span>
            </div>
          </div>
        </div>
      ) : (
        /* ---------- DESKTOP: split-screen ---------- */
        <div style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '1.02fr 1fr' }}>
          <BrandPanel b={b} />
          <div className="rda-scroll" style={{ position: 'relative', display: 'flex', flexDirection: 'column', overflowY: 'auto', maxHeight: '100vh', background: '#eef6f5' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '22px 40px 0' }}>
              <a href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, color: C.muted, font: '600 13.5px var(--f-ui)' }}>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                {b.back}
              </a>
              <LangToggle glass={false} />
            </div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '26px 40px 48px' }}>
              <div style={{ width: '100%', maxWidth: 436 }}>
                {tabbed && <TabToggle view={view} go={setView} t={t} />}
                {viewNode}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* =========================== individual views ============================== */

function LoginView({
  t,
  go,
  goCode,
  providers,
  telegramBot,
  bannerError,
  resetDone,
  next,
}: {
  t: T
  go: (v: View) => void
  goCode: (ch: OtpChannel) => void
  providers: Provider[]
  telegramBot: string | null
  bannerError: string | null
  resetDone: boolean
  next: string | null
}) {
  const [remember, setRemember] = useState(true)
  const [state, action] = useFormState(loginAction, initialState)
  const fe = state.fieldErrors ?? {}

  return (
    <AuthCard>
      <CardHead title={t.loginTitle} sub={t.loginSub} />

      {resetDone && (
        <SuccessBanner>{t === dict.ru ? 'Пароль обновлён, войдите' : 'Password updated, please sign in'}</SuccessBanner>
      )}

      <form action={action}>
        <ErrorBanner message={state.error ?? bannerError ?? undefined} />
        {next && <input type="hidden" name="next" value={next} />}

        <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 13 }}>
          <Field
            label={t.email}
            placeholder={t.emailPh}
            type="email"
            name="email"
            autoComplete="email"
            error={fe.email}
          />
          <Field
            label={t.password}
            placeholder={t.passwordPh}
            type="password"
            name="password"
            autoComplete="current-password"
            error={fe.password}
            trailing={
              <span
                onClick={() => go('reset')}
                style={{ font: '700 11px var(--f-ui)', color: C.coral, cursor: 'pointer' }}
              >
                {t.forgot}
              </span>
            }
          />
        </div>

        <label
          style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 9, minHeight: 44, cursor: 'pointer' }}
        >
          <CheckBox checked={remember} onClick={() => setRemember(!remember)} />
          <span style={{ font: '600 12px var(--f-ui)', color: C.muted }}>{t.remember}</span>
        </label>

        <SubmitButton label={t.signIn} />
      </form>

      <SocialBlock
        t={t}
        providers={providers}
        telegramBot={telegramBot}
        onCode={() => goCode('sms')}
        onTelegram={() => goCode('telegram')}
        next={next}
      />

      <div style={{ marginTop: 18, textAlign: 'center', font: '500 13px var(--f-ui)', color: C.muted }}>
        {t.noAccount} <SwitchLink onClick={() => go('register')}>{t.createAccount}</SwitchLink>
      </div>
    </AuthCard>
  )
}

/**
 * Simplified create-account: social options on top, then a minimal Email + Name form (no field
 * labels — placeholders only) plus the required data-processing consent (KVKK). Submitting emails
 * a set-password link that returns the user to their in-progress booking. No password is collected.
 */
function RegisterView({
  t,
  go,
  goCode,
  providers,
  telegramBot,
  bannerError,
  next,
}: {
  t: T
  go: (v: View) => void
  goCode: (ch: OtpChannel) => void
  providers: Provider[]
  telegramBot: string | null
  bannerError: string | null
  next: string | null
}) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [consent, setConsent] = useState(false)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | undefined>(bannerError ?? undefined)
  const [fe, setFe] = useState<Record<string, string>>({})

  const dest = encodeURIComponent(next || '/account')
  const inputStyle = { ...fieldBase, borderRadius: 10, padding: '13px 15px', font: '600 13px var(--f-ui)' } as CSSProperties

  const submit = () => {
    setError(undefined)
    setFe({})
    startTransition(async () => {
      const res = await requestAccountAction({ email, name, password, consentPersonalData: consent, next: next ?? undefined })
      if (res.ok) {
        // Signed in immediately; the "confirm your email" banner shows on the destination.
        router.push(res.redirectTo ?? '/account')
      } else {
        setError(res.error)
        setFe(res.fieldErrors ?? {})
      }
    })
  }

  return (
    <AuthCard pad={30}>
      <CardHead title={t.registerTitle} sub={t.registerSub} icon={<LogoMark size={42} variant="onTeal" />} />

      {/* social sign-in on top */}
      <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {providers.includes('google') && <SocialButton href={`/api/auth/oauth/google?next=${dest}`} icon={<GoogleIcon />} label={t.withGoogle} />}
        {providers.includes('yandex') && <SocialButton href={`/api/auth/oauth/yandex?next=${dest}`} icon={<YandexIcon />} label={t.withYandex} />}
        {telegramBot && (
          <button type="button" onClick={() => goCode('telegram')} className="av-cta" style={{ ...outlineBtn, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            <TelegramIcon />
            {t.telegramBtn}
          </button>
        )}
        <button type="button" onClick={() => goCode('sms')} style={outlineBtn}>{t.byCode}</button>
      </div>

      <Divider label={t.or} />

      {/* email + password sign-up — placeholders only, no labels */}
      <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 11 }}>
        <ErrorBanner message={error} />
        <input type="email" autoComplete="email" placeholder={t.emailPh} value={email} onChange={(e) => setEmail(e.target.value)} style={{ ...inputStyle, ...(fe.email ? { border: `1px solid ${C.danger}` } : {}) }} />
        <FieldError error={fe.email} />
        <input type="text" autoComplete="name" placeholder={t.namePh} value={name} onChange={(e) => setName(e.target.value)} style={{ ...inputStyle, ...(fe.name ? { border: `1px solid ${C.danger}` } : {}) }} />
        <FieldError error={fe.name} />
        <input type="password" autoComplete="new-password" placeholder={t.passwordPh} value={password} onChange={(e) => setPassword(e.target.value)} style={{ ...inputStyle, ...(fe.password ? { border: `1px solid ${C.danger}` } : {}) }} />
        <FieldError error={fe.password || (password.length > 0 && password.length < 8 ? t.passwordMin : undefined)} />

        {/* required KVKK data-processing consent (kept) */}
        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 9, cursor: 'pointer', marginTop: 2 }}>
          <CheckBox checked={consent} onClick={() => setConsent((v) => !v)} align="flex-start" />
          <span style={{ font: '500 11px/1.5 var(--f-ui)', color: C.muted }}>{t.consentData}</span>
        </label>
        <FieldError error={fe.consentPersonalData} />

        <ActionButton label={t.registerCta} onClick={submit} pending={pending} />
      </div>

      <div style={{ marginTop: 14, textAlign: 'center', font: '500 13px var(--f-ui)', color: C.muted }}>
        {t.haveAccount} <SwitchLink onClick={() => go('login')}>{t.signInLink}</SwitchLink>
      </div>
    </AuthCard>
  )
}

function LockIcon() {
  return (
    <MarkBadge>
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke={C.teal}
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="5" y="11" width="14" height="9" rx="2" />
        <path d="M8 11V8a4 4 0 018 0v3" />
      </svg>
    </MarkBadge>
  )
}

function ResetView({ t, go }: { t: T; go: (v: View) => void }) {
  const [email, setEmail] = useState('')
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | undefined>()
  const [sent, setSent] = useState(false)
  const [devLink, setDevLink] = useState<string | undefined>()

  const submit = () => {
    setError(undefined)
    startTransition(async () => {
      const res = await requestPasswordResetAction(email)
      if (res.ok) {
        setSent(true)
        setDevLink(res.devLink)
      } else {
        setError(res.notRegistered ? t.emailNotRegistered : res.error)
      }
    })
  }

  return (
    <AuthCard>
      <CardHead title={t.resetTitle} sub={t.resetSub} icon={<LockIcon />} />

      <div style={{ marginTop: 22 }}>
        <Field
          label={t.email}
          placeholder={t.emailPh}
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={error}
        />
      </div>

      {!sent && <ActionButton label={t.sendLink} onClick={submit} pending={pending} />}

      {sent && (
        <SuccessBanner>
          {t.resetSent}
          {devLink && (
            <>
              <br />
              <a href={devLink} style={{ color: C.teal, fontWeight: 700, wordBreak: 'break-all' }}>
                {t.devLink} {devLink}
              </a>
            </>
          )}
        </SuccessBanner>
      )}

      <BackLink label={t.backToLogin} onClick={() => go('login')} />
    </AuthCard>
  )
}

function NewPasswordView({ t, token, go, next }: { t: T; token: string; go: (v: View) => void; next: string | null }) {
  const router = useRouter()
  const [pw, setPw] = useState('')
  const [confirm, setConfirm] = useState('')
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | undefined>()

  const submit = () => {
    setError(undefined)
    if (pw !== confirm) {
      setError(t.passMismatch)
      return
    }
    startTransition(async () => {
      // With `next` present (sign-up→set-password→return-to-booking), the action logs the user
      // in and redirects them back to their booking; otherwise it's a normal reset.
      const res = await resetPasswordAction(token, pw, next ?? undefined)
      if (res.ok) {
        router.push(res.redirectTo ?? '/auth?reset=done')
      } else {
        setError(res.error)
      }
    })
  }

  return (
    <AuthCard>
      <CardHead title={t.newPassTitle} sub={t.newPassSub} icon={<LockIcon />} />

      <div style={{ marginTop: 22, display: 'flex', flexDirection: 'column', gap: 13 }}>
        <Field
          label={t.newPassword}
          placeholder={t.passwordPh}
          type="password"
          autoComplete="new-password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
        />
        <Field
          label={t.confirmPassword}
          placeholder={t.confirmPh}
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          error={error}
        />
      </div>

      <ActionButton label={t.savePass} onClick={submit} pending={pending} />

      <BackLink label={t.backToLogin} onClick={() => go('login')} />
    </AuthCard>
  )
}

const OTP_CHANNELS: OtpChannel[] = ['sms', 'whatsapp', 'telegram', 'max', 'email']

function OtpView({ t, go, initialChannel }: { t: T; go: (v: View) => void; initialChannel: OtpChannel }) {
  const router = useRouter()
  const isMobile = useIsMobile()
  const [channel, setChannel] = useState<OtpChannel>(initialChannel)
  const [identifier, setIdentifier] = useState('')
  const [firstName, setFirstName] = useState('')
  const [code, setCode] = useState('')
  const [step, setStep] = useState<'request' | 'verify'>('request')
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | undefined>()
  const [devCode, setDevCode] = useState<string | undefined>()

  const channelLabels: Record<OtpChannel, string> = {
    sms: t.chSms,
    whatsapp: t.chWhatsapp,
    telegram: t.chTelegram,
    max: t.chMax,
    email: t.chEmail,
  }
  const isEmailCh = channel === 'email'

  const requestCode = () => {
    setError(undefined)
    startTransition(async () => {
      const res = await requestOtpAction(channel, identifier)
      if (res.ok) {
        setStep('verify')
        setDevCode(res.devCode)
      } else {
        setError(res.error)
      }
    })
  }

  const verify = () => {
    setError(undefined)
    startTransition(async () => {
      const res = await verifyOtpAction(channel, identifier, code, firstName || undefined)
      if (res.ok) {
        router.push(res.redirectTo ?? '/account')
      } else {
        setError(res.error)
      }
    })
  }

  const changeChannel = () => {
    setStep('request')
    setCode('')
    setDevCode(undefined)
    setError(undefined)
  }

  return (
    <AuthCard>
      <CardHead
        title={t.otpTitle}
        sub={t.otpSub}
        icon={
          <MarkBadge>
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke={C.teal}
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="4" y="5" width="16" height="14" rx="2" />
              <path d="M4 8l8 5 8-5" />
            </svg>
          </MarkBadge>
        }
      />

      {step === 'request' ? (
        <>
          <div style={{ marginTop: 20 }}>
            <div style={fLabel}>{t.otpChannel}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {OTP_CHANNELS.map((ch) => {
                const on = channel === ch
                return (
                  <button
                    key={ch}
                    type="button"
                    onClick={() => setChannel(ch)}
                    style={{
                      padding: isMobile ? '11px 16px' : '8px 14px',
                      minHeight: isMobile ? 44 : undefined,
                      borderRadius: 999,
                      border: on ? 'none' : `1.5px solid ${C.fieldBorder}`,
                      background: on ? C.teal : '#fff',
                      color: on ? '#fff' : C.teal,
                      font: '700 12px var(--f-ui)',
                      cursor: 'pointer',
                    }}
                  >
                    {channelLabels[ch]}
                  </button>
                )
              })}
            </div>
          </div>

          <div style={{ marginTop: 16 }}>
            <Field
              label={isEmailCh ? t.identEmail : t.identPhone}
              placeholder={isEmailCh ? t.emailPh : t.identPhonePh}
              type={isEmailCh ? 'email' : 'tel'}
              inputMode={isEmailCh ? 'email' : 'tel'}
              autoComplete={isEmailCh ? 'email' : 'tel'}
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              error={error}
            />
          </div>

          <div style={{ marginTop: 13 }}>
            <Field
              label={t.firstNameOpt}
              placeholder={t.firstNamePh}
              autoComplete="given-name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </div>

          <ActionButton label={t.getCode} onClick={requestCode} pending={pending} />
        </>
      ) : (
        <>
          <div style={{ marginTop: 18, textAlign: 'center', font: '500 12px var(--f-ui)', color: C.muted }}>
            {t.codeSent}: <span style={{ color: C.text, fontWeight: 700 }}>{identifier}</span>
          </div>

          <div style={{ marginTop: 14, ...fLabel, textAlign: 'center' }}>{t.codeLabel}</div>
          <OtpRow code={code} setCode={setCode} />

          {devCode && (
            <div style={{ marginTop: 12, textAlign: 'center', font: '600 12px var(--f-mono)', color: C.coral }}>
              {t.devCode} {devCode}
            </div>
          )}

          {error && (
            <div style={{ marginTop: 12, textAlign: 'center', font: '600 12px var(--f-ui)', color: C.danger }}>
              {error}
            </div>
          )}

          <ActionButton label={t.confirm} onClick={verify} pending={pending} />

          <div
            onClick={changeChannel}
            className="av-tap"
            style={{ marginTop: 8, padding: '11px 8px', textAlign: 'center', font: '700 12px var(--f-ui)', color: C.teal, cursor: 'pointer' }}
          >
            {t.changeChannel}
          </div>
        </>
      )}

      <BackLink label={t.backToLogin} onClick={() => go('login')} />
    </AuthCard>
  )
}
