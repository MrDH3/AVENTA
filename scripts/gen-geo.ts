import { Country, State } from 'country-state-city'
import { writeFileSync } from 'fs'

// Countries: ISO2 code, English name, flag emoji.
const countries = Country.getAllCountries()
  .map((c) => ({ c: c.isoCode, n: c.name, f: c.flag }))
  .sort((a, b) => a.n.localeCompare(b.n))

// Subdivisions (ISO 3166-2) keyed by country ISO2. Only countries that HAVE subdivisions.
const regions: Record<string, { c: string; n: string }[]> = {}
for (const c of countries) {
  const states = State.getStatesOfCountry(c.c)
  if (states.length) {
    regions[c.c] = states
      .map((s) => ({ c: s.isoCode, n: s.name }))
      .sort((a, b) => a.n.localeCompare(b.n))
  }
}

const out = { countries, regions }
writeFileSync('src/data/geo.json', JSON.stringify(out))
const regionCount = Object.values(regions).reduce((n, r) => n + r.length, 0)
console.log(`WROTE src/data/geo.json — ${countries.length} countries, ${Object.keys(regions).length} with subdivisions, ${regionCount} subdivisions total`)
