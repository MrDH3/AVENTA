import type { Metadata, Viewport } from 'next'
import { cookies } from 'next/headers'
import { LangProvider } from '@/i18n/lang'
import { AuthProvider, type SessionUser } from '@/components/AuthProvider'
import BottomNav from '@/components/BottomNav'
import { getCurrentUser } from '@/lib/auth'
import '@/styles/global.css'

export const metadata: Metadata = {
  title: {
    default: 'AVENTA · Premium Car Rental · Antalya',
    template: '%s · AVENTA',
  },
  description:
    'Premium car rental in Antalya, Turkey. 24/7 delivery to the airport or your hotel, transparent pricing, full insurance and support in your language.',
  applicationName: 'AVENTA',
  icons: { icon: '/favicon.svg' },
}

export const viewport: Viewport = {
  themeColor: '#EAF7F8',
  width: 'device-width',
  initialScale: 1,
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieLang = cookies().get('aventa_lang')?.value
  const lang = cookieLang && ['ru', 'en', 'tr', 'es', 'de'].includes(cookieLang) ? cookieLang : 'en'
  const u = await getCurrentUser()
  const sessionUser: SessionUser | null = u
    ? { id: u.id, firstName: u.firstName, lastName: u.lastName, email: u.email, image: u.image, role: u.role }
    : null
  return (
    <html lang={lang}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,600;12..96,700;12..96,800&family=Caveat:wght@500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Space+Mono:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <LangProvider>
          <AuthProvider user={sessionUser}>
            {children}
            <BottomNav />
          </AuthProvider>
        </LangProvider>
      </body>
    </html>
  )
}
