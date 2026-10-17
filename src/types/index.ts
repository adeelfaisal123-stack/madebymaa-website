export interface RatingSummary {
  average: number
  count: number
  hasReviews: boolean
}

export interface Kitchen {
  id: number
  name: string
  chefName?: string
  address?: string
  latitude?: number
  longitude?: number
  cuisine?: string
  logoUrl?: string
  coverUrl?: string
  deliveryLabel?: string
  tags: string[]
  isOpen: boolean
  instantDeliveryEnabled: boolean
  isLive: boolean
  isVerified: boolean
  rating: RatingSummary
  distanceKm?: number
}

export interface Dish {
  id: number
  name: string
  restaurantId: number
  restaurantName: string
  description?: string
  effectivePrice: number
  price: number
  isVeg: boolean
  imageUrl?: string
  restaurantLogoUrl?: string
  restaurantCuisine?: string
  chefName?: string
  tags: string[]
  superCategoryIds: number[]
  dishCategoryId?: number
  dishSubcategoryId?: number
}

export interface KitchenDetail extends Kitchen {
  description?: string
  dishes: Dish[]
}

export interface Cuisine {
  id: number
  name: string
  imageUrl?: string
}

export interface DishCategory {
  id: number
  name: string
  imageUrl?: string
}

export interface SuperCategory {
  id: number
  name: string
  imageUrl?: string
  slug?: string
  timeRange?: string
  startTime?: string
  endTime?: string
}

export interface HomeSlider {
  id: number
  imageUrl: string
  linkType?: string
  linkValue?: string
  title?: string
}

export interface CartLine {
  key: string
  dishId: number
  dishName: string
  kitchenId: number
  kitchenName: string
  quantity: number
  unitPrice: number
  isVeg: boolean
  imageUrl?: string
}

export interface CustomerSession {
  customerId: number
  phone: string
  name: string
  token?: string
}

export interface OrderItem {
  dishId: number
  name: string
  kitchenId: number
  kitchenName: string
  unitPrice: number
  quantity: number
  lineTotal: number
  isVeg: boolean
  imageUrl?: string
}

export interface OrderDeliverySlot {
  type: string
  label?: string
  date?: string
  timeLabel?: string
  timeStart?: string
  timeEnd?: string
}

export interface Order {
  id: string
  orderNumber?: string
  status: string
  totalAmount: number
  subtotal: number
  deliveryFee: number
  gstAmount: number
  createdAt?: string
  kitchenName?: string
  paymentMethod: string
  paymentStatus?: string
  paymentReference?: string
  deliveryAddress?: string
  deliverySlot?: OrderDeliverySlot
  notes?: string
  canRequestRefund?: boolean
  items: OrderItem[]
}

export interface DeliveryQuote {
  deliveryFee: number
  totalAmount: number
  subtotal: number
  distanceKm?: number
  breakdownLabel?: string
}

export interface BlogPost {
  id: number
  title: string
  slug: string
  excerpt?: string
  body?: string
  coverImageUrl?: string
  authorName?: string
  publishedAt?: string
}
