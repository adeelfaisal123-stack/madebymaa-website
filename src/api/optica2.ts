import {
  apiGet,
  apiPost,
  assetUrl,
  cuisineFromJson,
  dishCategoryFromJson,
  dishFromJson,
  kitchenFromJson,
} from './client'
import type {
  BlogPost,
  Cuisine,
  CustomerSession,
  DeliveryQuote,
  Dish,
  DishCategory,
  HomeSlider,
  Kitchen,
  KitchenDetail,
  Order,
  SuperCategory,
} from '../types'

function listFrom<T>(
  body: Record<string, unknown>,
  key: string,
  map: (item: Record<string, unknown>) => T,
): T[] {
  const raw = body[key]
  if (!Array.isArray(raw)) return []
  return raw.filter((x) => x && typeof x === 'object').map((x) => map(x as Record<string, unknown>))
}

export async function fetchHomeSliders() {
  const body = await apiGet<Record<string, unknown>>('/api/customer/home-sliders')
  const mapSlider = (json: Record<string, unknown>): HomeSlider => ({
    id: Number(json.id),
    imageUrl: assetUrl(String(json.image_url ?? '')),
    linkType: json.link_type as string | undefined,
    linkValue: json.link_value as string | undefined,
    title: json.title as string | undefined,
  })
  return {
    hero: listFrom(body, 'sliders', mapSlider).filter((s) => s.imageUrl),
    mid: listFrom(body, 'mid_sliders', mapSlider).filter((s) => s.imageUrl),
  }
}

export async function fetchCuisines(): Promise<Cuisine[]> {
  const body = await apiGet<Record<string, unknown>>('/api/customer/cuisines')
  return listFrom(body, 'cuisines', cuisineFromJson).filter((c) => c.name)
}

export async function fetchDishCategories(): Promise<DishCategory[]> {
  const body = await apiGet<Record<string, unknown>>('/api/customer/dish-categories')
  return listFrom(body, 'categories', dishCategoryFromJson).filter((c) => c.name)
}

export async function fetchSuperCategories(): Promise<SuperCategory[]> {
  const body = await apiGet<Record<string, unknown>>('/api/customer/super-categories')
  return listFrom(body, 'super_categories', (json) => ({
    id: Number(json.id),
    name: String(json.name ?? ''),
    imageUrl: json.image_url as string | undefined,
    slug: json.slug as string | undefined,
    timeRange: String(json.time_range ?? ''),
    startTime: json.start_time as string | undefined,
    endTime: json.end_time as string | undefined,
  })).filter((c) => c.name)
}

export async function fetchFeaturedKitchens(): Promise<Kitchen[]> {
  const body = await apiGet<Record<string, unknown>>('/api/customer/featured-kitchens')
  return listFrom(body, 'kitchens', kitchenFromJson)
}

export async function fetchBrowseKitchens(lat?: number, lng?: number): Promise<Kitchen[]> {
  const params: Record<string, string> = {}
  if (lat != null && lng != null) {
    params.lat = String(lat)
    params.lng = String(lng)
  }
  const body = await apiGet<Record<string, unknown>>('/api/customer/kitchens', params)
  return listFrom(body, 'kitchens', kitchenFromJson)
}

export async function fetchKitchenDetail(id: number): Promise<KitchenDetail> {
  const body = await apiGet<Record<string, unknown>>(`/api/customer/kitchens/${id}`)
  const kitchen = kitchenFromJson(body.kitchen as Record<string, unknown>)
  const dishes = listFrom(body, 'dishes', dishFromJson).map((dish) => ({
    ...dish,
    restaurantId: dish.restaurantId || kitchen.id,
    restaurantName: dish.restaurantName && dish.restaurantName !== 'Kitchen'
      ? dish.restaurantName
      : kitchen.name,
  }))
  return { ...kitchen, description: body.description as string | undefined, dishes }
}

export async function fetchBrowseDishes(params?: {
  superCategoryId?: number
  cuisineId?: number
  dishCategoryId?: number
}): Promise<Dish[]> {
  const query: Record<string, string> = {}
  if (params?.superCategoryId) query.super_category_id = String(params.superCategoryId)
  if (params?.cuisineId) query.cuisine_id = String(params.cuisineId)
  if (params?.dishCategoryId) query.dish_category_id = String(params.dishCategoryId)
  const body = await apiGet<Record<string, unknown>>('/api/customer/dishes', query)
  return listFrom(body, 'dishes', dishFromJson)
}

export async function fetchMapsConfig() {
  const body = await apiGet<Record<string, unknown>>('/api/seller/maps-config')
  return {
    nearbyRadiusKm: Number(body.nearby_radius_km ?? 20),
    defaultLat: Number(body.default_latitude ?? 25.4184),
    defaultLng: Number(body.default_longitude ?? 55.5019),
  }
}

export async function checkPhone(phone: string) {
  const body = await apiPost<Record<string, unknown>>('/api/customer/auth/check-phone', { phone })
  return {
    exists: Boolean(body.exists),
    canLogin: Boolean(body.can_login),
    isBlocked: Boolean(body.is_blocked),
    message: String(body.message ?? ''),
  }
}

function sessionFromCustomer(customer: Record<string, unknown>, fallbackPhone: string) {
  return {
    customerId: Number(customer.id),
    phone: String(customer.phone ?? fallbackPhone),
    name: String(customer.name ?? 'Customer'),
  } satisfies CustomerSession
}

/** After client-side Firebase Phone Auth — register or log in without MSG91 OTP. */
export async function completeSession(phone: string, name?: string) {
  const body = await apiPost<Record<string, unknown>>('/api/customer/auth/complete-session', {
    phone,
    ...(name ? { name } : {}),
  })
  const customer = body.customer as Record<string, unknown>
  return sessionFromCustomer(customer, phone)
}

/** MSG91-only path (admin must select MSG91). Prefer Firebase + completeSession. */
export async function verifyLogin(phone: string, otp: string, name?: string) {
  const body = await apiPost<Record<string, unknown>>('/api/customer/auth/verify-and-login', {
    phone,
    otp,
    ...(name ? { name } : {}),
  })
  const customer = body.customer as Record<string, unknown>
  return sessionFromCustomer(customer, phone)
}

export async function sendOtp(phone: string) {
  return apiPost<{ message: string }>('/api/otp/send', { phone })
}

export async function verifyOtp(phone: string, otp: string) {
  return apiPost<{ message: string }>('/api/otp/verify', { phone, otp })
}

export async function fetchOtpConfig() {
  const body = await apiGet<{ otp?: Record<string, unknown> }>('/api/otp/config')
  const otp = body.otp ?? {}
  const provider = String(otp.provider ?? 'firebase') === 'msg91' ? 'msg91' : 'firebase'
  return {
    provider: provider as 'firebase' | 'msg91',
    configured: Boolean(otp.configured ?? provider === 'firebase'),
  }
}

export function orderFromJson(json: Record<string, unknown>): Order {
  const itemsRaw = Array.isArray(json.items) ? json.items : []
  const items = itemsRaw
    .filter((x): x is Record<string, unknown> => !!x && typeof x === 'object')
    .map((i) => ({
      dishId: Number(i.dish_id ?? 0),
      name: String(i.dish_name ?? i.name ?? 'Item'),
      kitchenId: Number(i.kitchen_id ?? i.restaurant_id ?? 0),
      kitchenName: String(i.kitchen_name ?? 'Kitchen'),
      unitPrice: Number(i.unit_price ?? 0),
      quantity: Number(i.quantity ?? 1),
      lineTotal: Number(i.line_total ?? Number(i.unit_price ?? 0) * Number(i.quantity ?? 1)),
      isVeg: i.is_veg !== false,
      imageUrl: assetUrl(i.image_url as string | undefined) || undefined,
    }))

  const kitchenNames = [...new Set(items.map((i) => i.kitchenName).filter(Boolean))]
  const slotRaw = json.delivery_slot
  const slot =
    slotRaw && typeof slotRaw === 'object'
      ? (slotRaw as Record<string, unknown>)
      : null

  return {
    id: String(json.id ?? json.order_id ?? ''),
    orderNumber: json.order_number != null ? String(json.order_number) : undefined,
    status: String(json.status ?? 'pending'),
    totalAmount: Number(json.total ?? json.total_amount ?? 0),
    subtotal: Number(json.subtotal ?? 0),
    deliveryFee: Number(json.delivery_fee ?? 0),
    gstAmount: Number(json.gst_amount ?? 0),
    createdAt: (json.placed_at ?? json.created_at) as string | undefined,
    kitchenName:
      (json.kitchen_name as string | undefined) ||
      (kitchenNames.length === 1 ? kitchenNames[0] : kitchenNames.join(', ')) ||
      undefined,
    paymentMethod: String(json.payment_method ?? 'cod'),
    paymentStatus: json.payment_status != null ? String(json.payment_status) : undefined,
    paymentReference:
      json.payment_reference != null ? String(json.payment_reference) : undefined,
    deliveryAddress:
      json.delivery_address != null ? String(json.delivery_address) : undefined,
    deliverySlot: slot
      ? {
          type: String(slot.type ?? 'now'),
          label: slot.label != null ? String(slot.label) : undefined,
          date: slot.date != null ? String(slot.date) : undefined,
          timeLabel: slot.time_label != null ? String(slot.time_label) : undefined,
          timeStart: slot.time_start != null ? String(slot.time_start) : undefined,
          timeEnd: slot.time_end != null ? String(slot.time_end) : undefined,
        }
      : undefined,
    notes: json.notes != null ? String(json.notes) : undefined,
    canRequestRefund: Boolean(json.can_request_refund),
    items,
  }
}

export async function fetchOrders(session: CustomerSession): Promise<Order[]> {
  const body = await apiGet<Record<string, unknown>>('/api/customer/orders', {
    customer_id: String(session.customerId),
    customer_phone: session.phone,
  })
  return listFrom(body, 'orders', orderFromJson)
}

export async function fetchOrder(
  session: CustomerSession,
  orderId: string,
): Promise<Order> {
  const body = await apiGet<Record<string, unknown>>(`/api/customer/orders/${orderId}`, {
    customer_id: String(session.customerId),
    customer_phone: session.phone,
  })
  const order = body.order
  if (!order || typeof order !== 'object') {
    throw new Error('Order not found')
  }
  return orderFromJson(order as Record<string, unknown>)
}

export async function cancelOrder(
  session: CustomerSession,
  orderId: string,
): Promise<Order> {
  const body = await apiPost<Record<string, unknown>>(
    `/api/customer/orders/${orderId}/cancel?customer_id=${encodeURIComponent(String(session.customerId))}&customer_phone=${encodeURIComponent(session.phone)}`,
    {},
  )
  const order = body.order
  if (!order || typeof order !== 'object') {
    throw new Error('Could not cancel order')
  }
  return orderFromJson(order as Record<string, unknown>)
}

export async function fetchDeliveryQuote(payload: Record<string, unknown>): Promise<DeliveryQuote> {
  const body = await apiPost<Record<string, unknown>>('/api/customer/orders/delivery-quote', payload)
  const quote = (body.quote ?? body) as Record<string, unknown>
  const deliveryFee = Number(
    quote.delivery_fee ?? quote.deliveryFee ?? body.delivery_fee ?? 0,
  )
  const subtotal = Number(quote.subtotal ?? body.subtotal ?? 0)
  return {
    deliveryFee: Number.isFinite(deliveryFee) ? deliveryFee : 0,
    subtotal: Number.isFinite(subtotal) ? subtotal : 0,
    totalAmount: subtotal + (Number.isFinite(deliveryFee) ? deliveryFee : 0),
    distanceKm:
      quote.distance_km != null ? Number(quote.distance_km) : undefined,
    breakdownLabel:
      typeof quote.breakdown_label === 'string' ? quote.breakdown_label : undefined,
  }
}

export async function createOrder(
  session: CustomerSession,
  payload: Record<string, unknown>,
) {
  const body = await apiPost<Record<string, unknown>>('/api/customer/orders', {
    customer_id: session.customerId,
    customer_phone: session.phone,
    ...payload,
  })
  const order = body.order as Record<string, unknown> | undefined
  return order ?? body
}

export type PaymentMethodId = 'cod' | 'razorpay' | 'stripe' | 'cashfree'

export interface PaymentConfig {
  codEnabled: boolean
  razorpayReady: boolean
  stripeReady: boolean
  cashfreeReady: boolean
  razorpayKeyId?: string
  stripePublishableKey?: string
  cashfreeEnvironment: string
  gst: {
    enabled: boolean
    type: 'percent' | 'fixed'
    value: number
    label: string
  }
}

function readBool(value: unknown, fallback: boolean): boolean {
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value !== 0
  if (typeof value === 'string') {
    const n = value.trim().toLowerCase()
    if (n === '1' || n === 'true') return true
    if (n === '0' || n === 'false') return false
  }
  return fallback
}

function blogPostFromJson(json: Record<string, unknown>): BlogPost {
  return {
    id: Number(json.id ?? 0),
    title: String(json.title ?? ''),
    slug: String(json.slug ?? ''),
    excerpt: json.excerpt != null ? String(json.excerpt) : undefined,
    body: json.body != null ? String(json.body) : undefined,
    coverImageUrl: assetUrl(json.cover_image_url as string | undefined) || undefined,
    authorName: json.author_name != null ? String(json.author_name) : undefined,
    publishedAt: json.published_at != null ? String(json.published_at) : undefined,
  }
}

export async function fetchBlogPosts(): Promise<BlogPost[]> {
  const body = await apiGet<Record<string, unknown>>('/api/customer/blog-posts')
  return listFrom(body, 'posts', blogPostFromJson).filter((p) => p.title && p.slug)
}

export async function fetchBlogPost(slug: string): Promise<BlogPost> {
  const body = await apiGet<Record<string, unknown>>(
    `/api/customer/blog-posts/${encodeURIComponent(slug)}`,
  )
  const post = body.post as Record<string, unknown> | undefined
  if (!post) throw new Error('Blog post not found')
  return blogPostFromJson(post)
}

export async function fetchPaymentConfig(): Promise<PaymentConfig> {
  const body = await apiGet<Record<string, unknown>>('/api/customer/payment-config')
  const payment = (body.payment as Record<string, unknown> | undefined) ?? body
  const cod = payment.cod as Record<string, unknown> | undefined
  const razorpay = payment.razorpay as Record<string, unknown> | undefined
  const stripe = payment.stripe as Record<string, unknown> | undefined
  const cashfree = payment.cashfree as Record<string, unknown> | undefined
  const gst = payment.gst as Record<string, unknown> | undefined

  const razorpayEnabled = readBool(razorpay?.enabled, false)
  const razorpayConfigured = readBool(razorpay?.configured, false)
  const stripeEnabled = readBool(stripe?.enabled, false)
  const stripeConfigured = readBool(stripe?.configured, false)
  const cashfreeEnabled = readBool(cashfree?.enabled, false)
  const cashfreeConfigured = readBool(cashfree?.configured, false)

  return {
    codEnabled: readBool(cod?.enabled ?? payment.cod_enabled, true),
    razorpayReady: razorpayEnabled && razorpayConfigured,
    stripeReady: stripeEnabled && stripeConfigured,
    cashfreeReady: cashfreeEnabled && cashfreeConfigured,
    razorpayKeyId: (razorpay?.key_id as string | undefined) || undefined,
    stripePublishableKey:
      (stripe?.publishable_key as string | undefined) || undefined,
    cashfreeEnvironment: String(cashfree?.environment ?? 'sandbox'),
    gst: {
      enabled: readBool(gst?.enabled, false),
      type: gst?.type === 'fixed' ? 'fixed' : 'percent',
      value: Number(gst?.value ?? 0),
      label: String(gst?.label ?? ''),
    },
  }
}
