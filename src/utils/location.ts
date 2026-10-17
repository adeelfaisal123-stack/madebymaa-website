import type { CountryCode } from 'libphonenumber-js'
import { parsePhoneNumberFromString } from 'libphonenumber-js'
import { countryByIso, type CountryDialCode } from '../data/countryDialCodes'

export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const data = await fetchReverseGeocode(lat, lng)
    const parts = [data.locality, data.city, data.principalSubdivision, data.countryName].filter(
      (part, index, arr): part is string =>
        Boolean(part) && arr.indexOf(part) === index,
    )

    if (parts.length > 0) return parts.slice(0, 3).join(', ')
    return formatCoords(lat, lng)
  } catch {
    return formatCoords(lat, lng)
  }
}

export async function reverseGeocodeCountryCode(
  lat: number,
  lng: number,
): Promise<string | null> {
  try {
    const data = await fetchReverseGeocode(lat, lng)
    const code = data.countryCode?.trim().toUpperCase()
    return code && code.length === 2 ? code : null
  } catch {
    return null
  }
}

async function fetchReverseGeocode(lat: number, lng: number) {
  const url = new URL('https://api.bigdatacloud.net/data/reverse-geocode-client')
  url.searchParams.set('latitude', String(lat))
  url.searchParams.set('longitude', String(lng))
  url.searchParams.set('localityLanguage', 'en')

  const response = await fetch(url.toString())
  if (!response.ok) throw new Error('reverse geocode failed')

  return (await response.json()) as {
    locality?: string
    city?: string
    principalSubdivision?: string
    countryName?: string
    countryCode?: string
  }
}

export function formatCoords(lat: number, lng: number) {
  return `${lat.toFixed(4)}, ${lng.toFixed(4)}`
}

export function isResolvableLocationLabel(label: string) {
  return label === 'Current location' || label === 'Set your location'
}

export function displayLocationLabel(label: string) {
  if (!label || label === 'Set your location') return 'Set your location'
  return label
}

type SetLocation = (label: string, lat: number, lng: number) => void

export function detectUserLocation(
  setLocation: SetLocation,
  fallback: { label: string; lat: number; lng: number } = {
    label: 'Ajman, UAE',
    lat: 25.4184,
    lng: 55.5019,
  },
) {
  if (!navigator.geolocation) {
    setLocation(fallback.label, fallback.lat, fallback.lng)
    return
  }

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      void (async () => {
        const label = await reverseGeocode(pos.coords.latitude, pos.coords.longitude)
        setLocation(label, pos.coords.latitude, pos.coords.longitude)
      })()
    },
    () => setLocation(fallback.label, fallback.lat, fallback.lng),
  )
}

export async function resolveStoredLocationLabel(
  label: string,
  lat: number | null,
  lng: number | null,
): Promise<string | null> {
  if (lat == null || lng == null || !isResolvableLocationLabel(label)) return null
  return reverseGeocode(lat, lng)
}

function countryFromBrowserLocale(): CountryDialCode {
  const iso =
    typeof navigator !== 'undefined'
      ? navigator.language.split('-')[1] || navigator.language.split('-')[0]
      : undefined
  if (iso && iso.length === 2) return countryByIso(iso)
  return countryByIso('IN')
}

function readGeoPosition(): Promise<GeolocationPosition | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null)
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve(pos),
      () => resolve(null),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300_000 },
    )
  })
}

/**
 * Detect dial-code country from saved coords → device GPS → browser locale.
 */
export async function detectCountryDialCode(opts?: {
  lat?: number | null
  lng?: number | null
}): Promise<CountryDialCode> {
  if (opts?.lat != null && opts?.lng != null) {
    const iso = await reverseGeocodeCountryCode(opts.lat, opts.lng)
    if (iso) return countryByIso(iso)
  }

  const pos = await readGeoPosition()
  if (pos) {
    const iso = await reverseGeocodeCountryCode(pos.coords.latitude, pos.coords.longitude)
    if (iso) return countryByIso(iso)
  }

  return countryFromBrowserLocale()
}

/** Build E.164 from national number + selected country. */
export function normalizePhoneWithCountry(input: string, country: CountryDialCode) {
  const parsed = parsePhoneNumberFromString(input, country.isoCode as CountryCode)
  if (parsed?.isValid()) return parsed.format('E.164')

  let digits = input.replace(/\D/g, '')
  const dialDigits = country.dialCode.replace(/\D/g, '')
  if (digits.startsWith(dialDigits)) digits = digits.slice(dialDigits.length)
  if (digits.startsWith('0')) digits = digits.slice(1)

  const rebuilt = parsePhoneNumberFromString(`${country.dialCode}${digits}`)
  if (rebuilt?.number) return rebuilt.format('E.164')
  return digits ? `${country.dialCode}${digits}` : ''
}

export function isValidNationalPhoneWithCountry(input: string, country: CountryDialCode) {
  const parsed = parsePhoneNumberFromString(input, country.isoCode as CountryCode)
  if (parsed?.isValid()) return true

  const e164 = normalizePhoneWithCountry(input, country)
  const again = parsePhoneNumberFromString(e164)
  return Boolean(again?.isValid())
}
