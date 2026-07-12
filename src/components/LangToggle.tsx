'use client'

import LanguageDropdown from './LanguageDropdown'

/**
 * Language switcher. Now renders the full flag DROPDOWN (all languages from the LANGUAGES
 * registry — EN/RU/TR/ES/DE), replacing the old RU/EN-only pill. Kept as a thin wrapper so
 * every existing call site (auth, account, cabinet, footer — they pass only `glass`) picks up
 * all languages with no change.
 */
export default function LangToggle({ glass = true }: { glass?: boolean }) {
  return <LanguageDropdown variant="bar" glass={glass} />
}
