const API_BASE =
  import.meta.env.VITE_API_URL?.replace(/\/$/, '') ||
  (import.meta.env.DEV ? '' : 'https://madebymaa.online')

export const ASSET_BASE =
  import.meta.env.VITE_API_URL?.replace(/\/$/, '') || 'https://madebymaa.online'

export class ApiError extends Error {
  statusCode?: number
  constructor(message: string, statusCode?: number) {
    super(message)
    this.statusCode = statusCode
  }
}

function headers(): HeadersInit {
  return { Accept: 'application/json' }
}

async function parseJson<T>(response: Response): Promise<T | null> {
  try {
    return (await response.json()) as T
  } catch {
    return null
  }
}

export async function apiGet<T>(path: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(`${API_BASE}${path}`)
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  }
  const response = await fetch(url.toString(), { headers: headers() })
  const body = await parseJson<{ message?: string } & T>(response)
  if (!response.ok) {
    throw new ApiError(body?.message ?? 'Request failed', response.status)
  }
  if (!body) throw new ApiError('Invalid response')
  return body
}

export async function apiPost<T>(
  path: string,
  data: Record<string, unknown>,
): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { ...headers(), 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  const body = await parseJson<{ message?: string } & T>(response)
  if (!response.ok) {
    throw new ApiError(body?.message ?? 'Request failed', response.status)
  }
  if (!body) throw new ApiError('Invalid response')
  return body
}

function normalizeAssetPath(path: string): string {
  let normalized = path.startsWith('/') ? path : `/${path}`
  while (normalized.startsWith('/public/public/')) {
    normalized = normalized.slice('/public'.length)
  }
  const onProduction = ASSET_BASE.includes('madebymaa.online')
  if (onProduction) {
    if (normalized.startsWith('/uploads/') || normalized.startsWith('/storage/')) {
      return `/public${normalized}`
    }
    return normalized
  }
  if (normalized.startsWith('/public/uploads/') || normalized.startsWith('/public/storage/')) {
    return normalized.slice('/public'.length)
  }
  return normalized
}

export function assetUrl(path?: string | null): string {
  if (!path?.trim()) return ''
  if (path.startsWith('http')) {
    try {
      const parsed = new URL(path)
      const normalized = normalizeAssetPath(parsed.pathname)
      if (normalized !== parsed.pathname) {
        return `${ASSET_BASE}${normalized}${parsed.search}`
      }
    } catch {
      return path
    }
    return path
  }
  return `${ASSET_BASE}${normalizeAssetPath(path)}`
}

export function cuisineFromJson(json: Record<string, unknown>): import('../types').Cuisine {
  return {
    id: Number(json.id),
    name: String(json.name ?? '').trim(),
    imageUrl: assetUrl(json.image_url as string | undefined) || undefined,
  }
}

export function dishCategoryFromJson(json: Record<string, unknown>): import('../types').DishCategory {
  return {
    id: Number(json.id),
    name: String(json.name ?? '').trim(),
    imageUrl: assetUrl(json.image_url as string | undefined) || undefined,
  }
}

export function ratingFromJson(raw: unknown): import('../types').RatingSummary {
  if (!raw || typeof raw !== 'object') {
    return { average: 0, count: 0, hasReviews: false }
  }
  const r = raw as Record<string, unknown>
  const count = Number(r.count ?? r.review_count ?? 0)
  const average = Number(r.average ?? r.avg ?? 0)
  return { average, count, hasReviews: count > 0 }
}

export function kitchenFromJson(json: Record<string, unknown>): import('../types').Kitchen {
  return {
    id: Number(json.id),
    name: String(json.name ?? 'Kitchen'),
    chefName: json.chef_name as string | undefined,
    address: json.address as string | undefined,
    latitude: json.latitude != null ? Number(json.latitude) : undefined,
    longitude: json.longitude != null ? Number(json.longitude) : undefined,
    cuisine: json.cuisine as string | undefined,
    logoUrl: assetUrl(json.logo_url as string | undefined) || undefined,
    coverUrl: assetUrl(json.cover_url as string | undefined) || undefined,
    deliveryLabel: json.delivery_label as string | undefined,
    tags: Array.isArray(json.tags) ? json.tags.map(String) : [],
    isOpen: json.is_open !== false,
    instantDeliveryEnabled: json.instant_delivery_enabled !== false,
    isLive: Boolean(json.is_live),
    isVerified: Boolean(json.is_verified),
    rating: ratingFromJson(json.rating),
    distanceKm: json.distance_km != null ? Number(json.distance_km) : undefined,
  }
}

export function dishFromJson(json: Record<string, unknown>): import('../types').Dish {
  return {
    id: Number(json.id),
    name: String(json.name ?? 'Dish'),
    restaurantId: Number(json.restaurant_id ?? json.kitchen_id ?? 0),
    restaurantName: String(json.restaurant_name ?? json.kitchen_name ?? 'Kitchen'),
    description: json.description as string | undefined,
    price: Number(json.price ?? 0),
    effectivePrice: Number(json.effective_price ?? json.price ?? 0),
    isVeg: json.is_veg !== false,
    imageUrl: assetUrl(json.image_url as string | undefined),
    restaurantLogoUrl: assetUrl(json.restaurant_logo_url as string | undefined),
    restaurantCuisine: json.restaurant_cuisine as string | undefined,
    chefName: json.chef_name as string | undefined,
    tags: Array.isArray(json.tags) ? json.tags.map(String) : [],
    superCategoryIds: Array.isArray(json.super_category_ids)
      ? json.super_category_ids.map((v) => Number(v))
      : [],
    dishCategoryId: json.dish_category_id != null ? Number(json.dish_category_id) : undefined,
    dishSubcategoryId:
      json.dish_subcategory_id != null ? Number(json.dish_subcategory_id) : undefined,
  }
}
