import {
  getCountries,
  getCountryCallingCode,
  getExampleNumber,
  type CountryCode,
} from 'libphonenumber-js'
import examples from 'libphonenumber-js/mobile/examples'
import countries from 'i18n-iso-countries'
import enLocale from 'i18n-iso-countries/langs/en.json'

countries.registerLocale(enLocale)

export interface CountryDialCode {
  name: string
  isoCode: string
  dialCode: string
  nationalLength: number
}

export function flagEmoji(isoCode: string) {
  const code = isoCode.toUpperCase()
  if (code.length !== 2) return '🌍'
  return String.fromCodePoint(
    ...[...code].map((c) => 0x1f1e6 - 65 + c.charCodeAt(0)),
  )
}

export function formatE164(country: CountryDialCode, nationalDigits: string) {
  return `${country.dialCode}${nationalDigits.replace(/\D/g, '')}`
}

function nationalLengthFor(iso: CountryCode): number {
  try {
    const example = getExampleNumber(iso, examples)
    if (example) {
      return example.nationalNumber.length
    }
  } catch {
    /* ignore */
  }
  return 10
}

function buildAllCountries(): CountryDialCode[] {
  const list: CountryDialCode[] = []
  for (const iso of getCountries()) {
    try {
      const dial = getCountryCallingCode(iso)
      const name = countries.getName(iso, 'en') || iso
      list.push({
        name,
        isoCode: iso,
        dialCode: `+${dial}`,
        nationalLength: nationalLengthFor(iso),
      })
    } catch {
      /* skip unsupported metadata entries */
    }
  }
  return list.sort((a, b) => a.name.localeCompare(b.name))
}

/** Full dial-code list from libphonenumber-js + English names. */
export const COUNTRY_DIAL_CODES: CountryDialCode[] = buildAllCountries()

export const INDIA: CountryDialCode =
  COUNTRY_DIAL_CODES.find((c) => c.isoCode === 'IN') ?? {
    name: 'India',
    isoCode: 'IN',
    dialCode: '+91',
    nationalLength: 10,
  }

const byIso = new Map(COUNTRY_DIAL_CODES.map((c) => [c.isoCode, c]))

export function countryByIso(iso: string | null | undefined): CountryDialCode {
  if (!iso) return INDIA
  return byIso.get(iso.toUpperCase()) ?? INDIA
}

export function isSupportedCountryIso(iso: string): iso is CountryCode {
  return byIso.has(iso.toUpperCase())
}
