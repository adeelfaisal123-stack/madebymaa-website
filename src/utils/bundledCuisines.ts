import type { Cuisine } from '../types'

const BUNDLED_NAMES = [
  'North Indian',
  'Bengali',
  'South Indian',
  'Rajasthani',
  'Chinese',
  'Bihari',
  'Gujarati',
  'Mughlai',
  'Odisha',
  'Kerala',
  'Tamil',
  'Punjabi',
  'Maharashtrian',
] as const

/** Match Flutter BundledCuisines.displayList — bundled order + API extras. */
export function mergeCuisines(fromApi: Cuisine[]): Cuisine[] {
  if (fromApi.length === 0) {
    return BUNDLED_NAMES.map((name, id) => ({ id, name }))
  }

  const byName = new Map(fromApi.map((c) => [c.name.trim().toLowerCase(), c]))
  const bundledNames = new Set<string>()

  const merged: Cuisine[] = BUNDLED_NAMES.map((name, index) => {
    const key = name.toLowerCase()
    bundledNames.add(key)
    const api = byName.get(key)
    return api ?? { id: index, name }
  })

  const extras = fromApi.filter((c) => !bundledNames.has(c.name.trim().toLowerCase()))
  return [...merged, ...extras]
}
