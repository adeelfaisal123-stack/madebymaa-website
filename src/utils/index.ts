import type { CountryDialCode } from '../data/countryDialCodes'
import { INDIA } from '../data/countryDialCodes'
import type { Kitchen } from '../types'
import {
  isValidNationalPhoneWithCountry,
  normalizePhoneWithCountry,
} from './location'

export function filterKitchens(
  kitchens: Kitchen[],
  opts: {
    search?: string
    openOnly?: boolean | null
    cuisines?: string[]
    minRating?: number
  },
): Kitchen[] {
  const q = opts.search?.trim().toLowerCase() ?? ''
  return kitchens.filter((k) => {
    if (opts.openOnly === true && !k.isOpen) return false
    if (opts.openOnly === false && k.isOpen) return false
    if (opts.minRating && (!k.rating.hasReviews || k.rating.average < opts.minRating)) return false
    if (opts.cuisines?.length) {
      const cuisine = k.cuisine?.trim().toLowerCase() ?? ''
      if (!cuisine) return false
      const matches = opts.cuisines.some((target) => {
        const t = target.trim().toLowerCase()
        return cuisine === t || cuisine.includes(t) || t.includes(cuisine)
      })
      if (!matches) return false
    }
    if (!q) return true
    const hay = [k.name, k.chefName, k.cuisine, k.address, ...k.tags].filter(Boolean).join(' ').toLowerCase()
    return hay.includes(q)
  })
}

export function formatPrice(amount: number) {
  return `₹${amount.toFixed(amount % 1 === 0 ? 0 : 2)}`
}

export function formatDistance(km?: number) {
  if (km == null) return ''
  if (km < 1) return `${Math.round(km * 1000)} m`
  return `${km.toFixed(1)} km`
}

/** Build E.164 from national number + selected country dial code. */
export function normalizePhone(input: string, country: CountryDialCode = INDIA) {
  return normalizePhoneWithCountry(input, country)
}

/** Validate national number for the selected country via libphonenumber-js. */
export function isValidNationalPhone(input: string, country: CountryDialCode) {
  return isValidNationalPhoneWithCountry(input, country)
}

export {
  detectCountryDialCode,
  detectUserLocation,
  displayLocationLabel,
  resolveStoredLocationLabel,
  reverseGeocode,
  reverseGeocodeCountryCode,
} from './location'
export { mergeCuisines } from './bundledCuisines'
