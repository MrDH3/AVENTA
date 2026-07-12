'use client'

import Link from 'next/link'
import SavedPlaces, { type OfficePoint } from '../components/SavedPlaces'
import { useDict } from '../i18n/lang'
import type { SavedPlaceView } from '@/server/map-actions'

const DICT = {
  en: {
    heading: 'Saved addresses',
    intro: 'Save the places you travel to — pick a spot on the map, give it a name, and get directions any time. Only destinations are stored; there’s no location tracking.',
    back: 'Back to profile',
  },
  ru: {
    heading: 'Сохранённые адреса',
    intro: 'Сохраняйте места, куда вы ездите — выберите точку на карте, назовите её и получайте маршрут в любой момент. Хранятся только пункты назначения; отслеживания местоположения нет.',
    back: 'Назад в профиль',
  },
  tr: {
    heading: 'Kayıtlı adresler',
    intro: 'Gittiğiniz yerleri kaydedin — haritada bir nokta seçin, ona bir isim verin ve istediğiniz zaman yol tarifi alın. Yalnızca varış noktaları saklanır; konum takibi yapılmaz.',
    back: 'Profile dön',
  },
  es: {
    heading: 'Direcciones guardadas',
    intro: 'Guarde los lugares a los que viaja — elija un punto en el mapa, póngale un nombre y obtenga indicaciones cuando quiera. Solo se guardan los destinos; no hay seguimiento de ubicación.',
    back: 'Volver al perfil',
  },
  de: {
    heading: 'Gespeicherte Adressen',
    intro: 'Speichern Sie die Orte, zu denen Sie reisen — wählen Sie einen Punkt auf der Karte, geben Sie ihm einen Namen und rufen Sie jederzeit die Route ab. Es werden nur Ziele gespeichert; es findet keine Standortverfolgung statt.',
    back: 'Zurück zum Profil',
  },
}

export default function Addresses({
  provider,
  apiKey,
  offices,
  places,
}: {
  provider: 'osm' | 'google' | 'yandex'
  apiKey: string | null
  offices: OfficePoint[]
  places: SavedPlaceView[]
}) {
  const t = useDict(DICT)
  const card: React.CSSProperties = { background: '#fff', borderRadius: 18, padding: 20, boxShadow: '0 18px 40px -30px rgba(11,85,96,.4)', border: '1px solid rgba(20,153,174,.1)' }

  return (
    <div style={{ maxWidth: 620, margin: '0 auto', padding: '22px 16px 40px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <Link href="/account" style={{ font: '700 12px var(--f-ui)', color: 'var(--av-teal)', textDecoration: 'none' }}>‹ {t.back}</Link>
        <h1 style={{ margin: '8px 0 0', font: '800 26px var(--f-display)', color: 'var(--av-text)' }}>{t.heading}</h1>
        <p style={{ margin: '8px 0 0', font: '500 13px/1.6 var(--f-ui)', color: 'var(--av-muted)' }}>{t.intro}</p>
      </div>
      <div style={card}>
        <SavedPlaces provider={provider} apiKey={apiKey} offices={offices} places={places} />
      </div>
    </div>
  )
}
