import { ApiError } from './client'

const API_BASE =
  import.meta.env.VITE_API_URL?.replace(/\/$/, '') ||
  (import.meta.env.DEV ? '' : 'https://madebymaa.online')

function sellerHeaders(json = true): HeadersInit {
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (json) headers['Content-Type'] = 'application/json'
  const key = import.meta.env.VITE_SELLER_API_KEY?.trim()
  if (key) headers['X-Seller-Api-Key'] = key
  return headers
}

async function parseJson<T>(response: Response): Promise<T | null> {
  try {
    return (await response.json()) as T
  } catch {
    return null
  }
}

function messageFromBody(body: Record<string, unknown> | null, fallback: string): string {
  if (!body) return fallback
  if (typeof body.message === 'string' && body.message.trim()) return body.message
  const errors = body.errors
  if (errors && typeof errors === 'object') {
    const first = Object.values(errors as Record<string, unknown>).flat()[0]
    if (typeof first === 'string') return first
    if (Array.isArray(first) && typeof first[0] === 'string') return first[0]
  }
  return fallback
}

async function sellerPost<T>(
  path: string,
  data: Record<string, unknown>,
): Promise<{ ok: boolean; status: number; body: (T & { message?: string }) | null }> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: sellerHeaders(true),
    body: JSON.stringify(data),
  })
  const body = await parseJson<T & { message?: string; errors?: Record<string, string[]> }>(
    response,
  )
  return { ok: response.ok, status: response.status, body }
}

export interface SellerPhoneCheck {
  exists: boolean
  canLogin: boolean
  kycAwaitingApproval: boolean
  kitchenSetupPending: boolean
  registrationStatus?: string
  message: string
  sellerId?: number
  sellerName?: string
}

export async function checkSellerPhone(phone: string): Promise<SellerPhoneCheck> {
  const { ok, status, body } = await sellerPost<Record<string, unknown>>(
    '/api/seller/auth/check-phone',
    { phone },
  )

  if (!body) {
    throw new ApiError('Could not check phone number', status)
  }

  const seller = body.seller as Record<string, unknown> | undefined

  // 404 = not registered yet (ready to sign up)
  if (status === 404 || body.exists === false) {
    return {
      exists: false,
      canLogin: false,
      kycAwaitingApproval: false,
      kitchenSetupPending: false,
      message: String(body.message ?? 'Phone is available for seller signup.'),
    }
  }

  return {
    exists: Boolean(body.exists ?? true),
    canLogin: Boolean(body.can_login),
    kycAwaitingApproval: Boolean(body.kyc_awaiting_approval),
    kitchenSetupPending: Boolean(body.kitchen_setup_pending),
    registrationStatus:
      body.registration_status != null ? String(body.registration_status) : undefined,
    message: String(body.message ?? (ok ? 'OK' : 'This number cannot sign up.')),
    sellerId: seller?.id != null ? Number(seller.id) : undefined,
    sellerName: seller?.name != null ? String(seller.name) : undefined,
  }
}

export interface SellerRegisterPayload {
  phone: string
  name: string
  email: string
  address: string
  city: string
  state: string
  country: string
}

export interface SellerRegisterResult {
  message: string
  sellerId: number
  sellerName: string
  phone: string
}

export async function registerSeller(
  payload: SellerRegisterPayload,
): Promise<SellerRegisterResult> {
  const { ok, status, body } = await sellerPost<Record<string, unknown>>(
    '/api/seller/auth/register',
    {
      phone: payload.phone,
      name: payload.name,
      email: payload.email,
      address: payload.address,
      city: payload.city,
      state: payload.state,
      country: payload.country.toUpperCase(),
    },
  )

  if (!ok || !body) {
    throw new ApiError(messageFromBody(body, 'Could not complete seller signup'), status)
  }

  const seller = body.seller as Record<string, unknown> | undefined

  return {
    message: String(body.message ?? 'Signup completed. Please wait for admin approval.'),
    sellerId: Number(seller?.id ?? 0),
    sellerName: String(seller?.name ?? payload.name),
    phone: String(seller?.phone ?? payload.phone),
  }
}
