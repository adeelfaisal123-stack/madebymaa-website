/** Shared order display helpers (mirrors Flutter CustomerOrder labels). */

export const ORDER_STATUS_FLOW = [
  'pending',
  'ready_to_pick_up',
  'picked_up',
  'on_way',
  'delivered',
] as const

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  ready_to_pick_up: 'Ready to pick up',
  picked_up: 'Picked up',
  on_way: 'On the way',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  placed: 'Pending',
}

const PAYMENT_LABELS: Record<string, string> = {
  cod: 'Cash on delivery',
  razorpay: 'Paid online (Razorpay)',
  stripe: 'Paid online (Stripe)',
  cashfree: 'Paid online (Cashfree)',
}

export function orderStatusLabel(status: string): string {
  return (
    STATUS_LABELS[status] ??
    status
      .split('_')
      .map((part) => (part ? part[0]!.toUpperCase() + part.slice(1) : part))
      .join(' ')
  )
}

export function orderPaymentLabel(method: string): string {
  return PAYMENT_LABELS[method] ?? method
}

export function orderTrackingTitle(status: string): string {
  if (status === 'cancelled') return 'Order cancelled'
  if (status === 'delivered') return 'Delivered'
  switch (status) {
    case 'pending':
      return 'Order pending'
    case 'ready_to_pick_up':
      return 'Ready to pick up'
    case 'picked_up':
      return 'Order picked up'
    case 'on_way':
      return 'On the way'
    default:
      return `Order ${orderStatusLabel(status).toLowerCase()}`
  }
}

export function orderTrackingMessage(status: string): string {
  switch (status) {
    case 'cancelled':
      return 'This order was cancelled. You will not be charged for cancelled COD orders.'
    case 'pending':
      return 'We received your order and the kitchen will confirm it shortly.'
    case 'ready_to_pick_up':
      return 'Your order is ready. A delivery partner will pick it up soon.'
    case 'picked_up':
      return 'Your order has been picked up and is heading out soon.'
    case 'on_way':
      return 'Your order is on the way. It should reach you shortly.'
    case 'delivered':
      return 'Your order has been delivered. Enjoy your meal!'
    default:
      return 'Track your order progress below.'
  }
}

export function orderStatusTone(
  status: string,
): 'pending' | 'progress' | 'done' | 'cancelled' {
  if (status === 'cancelled') return 'cancelled'
  if (status === 'delivered') return 'done'
  if (status === 'pending') return 'pending'
  return 'progress'
}

export function formatOrderDate(iso?: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function deliverySlotDisplay(slot?: {
  type: string
  label?: string
  date?: string
  timeLabel?: string
}): string {
  if (!slot) return 'Deliver now'
  const label = slot.label?.trim()
  if (label) return label
  if (slot.type === 'scheduled') {
    const parts = [slot.date, slot.timeLabel].filter(Boolean)
    return parts.length ? parts.join(' · ') : 'Scheduled delivery'
  }
  return 'Deliver now'
}

export function orderItemCount(items: { quantity: number }[]): number {
  return items.reduce((sum, i) => sum + i.quantity, 0)
}

export function canCancelOrder(status: string): boolean {
  return status === 'pending' || status === 'placed'
}

/** Active / in-progress order (not delivered or cancelled). */
export function isActiveOrder(status: string): boolean {
  const s = status === 'placed' ? 'pending' : status
  return s !== 'delivered' && s !== 'cancelled'
}

export function orderStatusIconClass(status: string): string {
  switch (status === 'placed' ? 'pending' : status) {
    case 'pending':
      return 'bi-hourglass-split'
    case 'ready_to_pick_up':
      return 'bi-box-seam'
    case 'picked_up':
      return 'bi-bag-check'
    case 'on_way':
      return 'bi-bicycle'
    default:
      return 'bi-truck'
  }
}
