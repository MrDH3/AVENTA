'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'

export type Lang = 'ru' | 'en' | 'tr' | 'es' | 'de'

/**
 * Selectable UI languages, in display order. English leads (the preferred default).
 * Adding a language = extend the `Lang` union, add an entry here, add its SVG flag in
 * `components/Flag`, and its dictionary slices — the switcher, cookie and SSR all read
 * from this list. Any UI text that lacks a slice for the active language falls back to
 * English (see `useDict`), so a language is safe to enable before every string is
 * translated. Translations are authored by hand in each dictionary (no translation API).
 * `flag` is an emoji fallback; `components/Flag` draws a crisp SVG for known codes.
 */
export interface LangOption {
  code: Lang
  label: string
  flag: string
}

export const LANGUAGES: LangOption[] = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'ru', label: 'Русский', flag: '🇷🇺' },
  { code: 'tr', label: 'Türkçe', flag: '🇹🇷' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
]

const LANG_CODES = LANGUAGES.map((l) => l.code)

/** Coerce an arbitrary cookie/localStorage value to a valid Lang (English is the default). */
export function normalizeLang(v: string | null | undefined): Lang {
  return v && (LANG_CODES as string[]).includes(v) ? (v as Lang) : 'en'
}

/** A dictionary keyed by language. English is REQUIRED (the fallback); others are optional. */
export type Dict<T> = Partial<Record<Lang, T>> & Record<'en', T>

interface LangCtx {
  lang: Lang
  setLang: (l: Lang) => void
  toggle: () => void
}

const Ctx = createContext<LangCtx>({
  lang: 'en',
  setLang: () => {},
  toggle: () => {},
})

const STORAGE_KEY = 'aventa_lang'

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en')

  useEffect(() => {
    try {
      const next = normalizeLang(localStorage.getItem(STORAGE_KEY))
      setLangState(next)
      document.documentElement.lang = next
    } catch {
      /* ignore */
    }
  }, [])

  const setLang = (l: Lang) => {
    try {
      localStorage.setItem(STORAGE_KEY, l)
    } catch {
      /* ignore */
    }
    setLangState(l)
    if (typeof document !== 'undefined') {
      document.documentElement.lang = l
      // mirror to a cookie so server components can render the right locale
      document.cookie = `${STORAGE_KEY}=${l}; path=/; max-age=31536000; samesite=lax`
    }
  }

  // Cycle through the enabled languages (kept for the old pill toggle; the dropdown uses setLang).
  const toggle = () => {
    const i = LANG_CODES.indexOf(lang)
    setLang(LANG_CODES[(i + 1) % LANG_CODES.length])
  }

  return <Ctx.Provider value={{ lang, setLang, toggle }}>{children}</Ctx.Provider>
}

export function useLang() {
  return useContext(Ctx)
}

/**
 * Pick the active-language slice of a dictionary, falling back to English when the active
 * language has no slice yet. This lets a language be enabled in the switcher before every
 * hardcoded UI string is translated — untranslated labels render in English rather than blank.
 */
export function useDict<T>(dict: Dict<T>): T {
  const { lang } = useLang()
  return dict[lang] ?? dict.en
}
