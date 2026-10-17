/** Port of Flutter delivery_slot + dish_main_category for checkout scheduling. */

export type DeliveryDayKey = 'today' | 'tomorrow' | 'day_after'

export interface MealCategory {
  id: number
  name: string
  timeRange: string
  startTime?: string
  endTime?: string
}

export interface DeliveryHalfHourSlot {
  superCategoryId: number
  categoryName: string
  timeStart: string
  timeEnd: string
  label: string
}

export interface DeliverySlotSelection {
  isNow: boolean
  dayKey?: DeliveryDayKey
  superCategoryId?: number
  timeStart?: string
  timeEnd?: string
  displayLabel: string
}

export const DELIVERY_DAY_DEFS: { key: DeliveryDayKey; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'tomorrow', label: 'Tomorrow' },
  { key: 'day_after', label: 'Day after' },
]

export function deliverySlotNow(): DeliverySlotSelection {
  return { isNow: true, displayLabel: 'Deliver now' }
}

export function isScheduledComplete(slot: DeliverySlotSelection): boolean {
  return (
    !slot.isNow &&
    !!slot.dayKey &&
    slot.superCategoryId != null &&
    !!slot.timeStart &&
    !!slot.timeEnd
  )
}

export function dateForDeliveryDayKey(dayKey: DeliveryDayKey, now = new Date()): Date {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  if (dayKey === 'tomorrow') {
    today.setDate(today.getDate() + 1)
  } else if (dayKey === 'day_after') {
    today.setDate(today.getDate() + 2)
  }
  return today
}

export function formatDeliveryDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function deliveryDayLabel(dayKey: DeliveryDayKey): string {
  if (dayKey === 'tomorrow') return 'Tomorrow'
  if (dayKey === 'day_after') return 'Day after tomorrow'
  return 'Today'
}

export function deliveryDayShortDate(dayKey: DeliveryDayKey, now = new Date()): string {
  const date = dateForDeliveryDayKey(dayKey, now)
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  return `${weekdays[date.getDay()]} ${date.getDate()}`
}

function parseTimeMinutes(raw?: string | null): number | null {
  if (!raw?.trim()) return null
  const parts = raw.trim().split(':')
  if (parts.length < 2) return null
  const hour = Number(parts[0])
  const minute = Number(parts[1])
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null
  return hour * 60 + minute
}

function parseDisplayTime(value: string): number | null {
  const trimmed = value.trim()
  const match = /^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i.exec(trimmed)
  if (!match) return null
  let hour = Number(match[1])
  const minute = Number(match[2])
  const period = match[3]?.toUpperCase()
  if (period === 'PM' && hour < 12) hour += 12
  if (period === 'AM' && hour === 12) hour = 0
  return hour * 60 + minute
}

function parseTimeRangeLabel(label: string): [number, number] | null {
  if (!label.trim()) return null
  let parts = label.split('–').map((p) => p.trim())
  if (parts.length < 2) parts = label.split('-').map((p) => p.trim())
  if (parts.length < 2) return null
  const start = parseDisplayTime(parts[0])
  const end = parseDisplayTime(parts[1])
  if (start == null || end == null || end <= start) return null
  return [start, end]
}

export function timeWindowMinutes(category: MealCategory): [number, number] | null {
  const start = parseTimeMinutes(category.startTime)
  const end = parseTimeMinutes(category.endTime)
  if (start != null && end != null && end > start) return [start, end]
  return parseTimeRangeLabel(category.timeRange)
}

function ceilToHalfHour(minutes: number): number {
  const remainder = minutes % 30
  return remainder === 0 ? minutes : minutes + (30 - remainder)
}

function minutesToApiTime(minutes: number): string {
  const hour = Math.floor(minutes / 60)
  const minute = minutes % 60
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

function minutesToDisplay(minutes: number): string {
  const hour24 = Math.floor(minutes / 60)
  const minute = minutes % 60
  const period = hour24 >= 12 ? 'PM' : 'AM'
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12
  return `${hour12}:${String(minute).padStart(2, '0')} ${period}`
}

export function isDeliveryHalfHourSlotAvailable(
  dayKey: DeliveryDayKey,
  slotStartMinutes: number,
  slotEndMinutes: number,
  now = new Date(),
): boolean {
  if (dayKey !== 'today') return true
  const nowMinutes = now.getHours() * 60 + now.getMinutes()
  if (slotEndMinutes <= nowMinutes) return false
  if (slotStartMinutes < nowMinutes + 30) return false
  return true
}

export function buildHalfHourDeliverySlots(
  categories: MealCategory[],
  dayKey: DeliveryDayKey,
  now = new Date(),
): DeliveryHalfHourSlot[] {
  const slots: DeliveryHalfHourSlot[] = []
  const seen = new Set<string>()

  for (const category of categories) {
    if (!category.id || !category.name) continue
    const window = timeWindowMinutes(category)
    if (!window) continue

    let cursor = ceilToHalfHour(window[0])
    while (cursor + 30 <= window[1]) {
      if (
        !isDeliveryHalfHourSlotAvailable(dayKey, cursor, cursor + 30, now)
      ) {
        cursor += 30
        continue
      }
      const start = minutesToApiTime(cursor)
      const end = minutesToApiTime(cursor + 30)
      const key = `${start}-${end}-${category.id}`
      if (!seen.has(key)) {
        seen.add(key)
        slots.push({
          superCategoryId: category.id,
          categoryName: category.name,
          timeStart: start,
          timeEnd: end,
          label: `${minutesToDisplay(cursor)} – ${minutesToDisplay(cursor + 30)}`,
        })
      }
      cursor += 30
    }
  }

  slots.sort((a, b) => {
    const byStart = a.timeStart.localeCompare(b.timeStart)
    if (byStart !== 0) return byStart
    return a.categoryName.localeCompare(b.categoryName)
  })
  return slots
}

export function availableDeliveryDayDefs(
  categories: MealCategory[],
  now = new Date(),
): { key: DeliveryDayKey; label: string }[] {
  return DELIVERY_DAY_DEFS.filter(
    (def) => buildHalfHourDeliverySlots(categories, def.key, now).length > 0,
  )
}

export function firstAvailableDeliveryDayKey(
  categories: MealCategory[],
  now = new Date(),
): DeliveryDayKey | null {
  const days = availableDeliveryDayDefs(categories, now)
  return days[0]?.key ?? null
}

export function selectionForHalfHourSlot(
  dayKey: DeliveryDayKey,
  slot: DeliveryHalfHourSlot,
): DeliverySlotSelection {
  return {
    isNow: false,
    dayKey,
    superCategoryId: slot.superCategoryId,
    timeStart: slot.timeStart,
    timeEnd: slot.timeEnd,
    displayLabel: `${deliveryDayLabel(dayKey)} · ${slot.label}`,
  }
}

export function deliverySlotToApiPayload(slot: DeliverySlotSelection): Record<string, unknown> {
  if (slot.isNow) return { type: 'now' }
  const day = slot.dayKey ?? 'today'
  return {
    type: 'scheduled',
    day,
    date: formatDeliveryDate(dateForDeliveryDayKey(day)),
    client_now: new Date().toISOString(),
    super_category_id: slot.superCategoryId,
    time_start: slot.timeStart,
    time_end: slot.timeEnd,
  }
}

export function scheduledDaySelection(dayKey: DeliveryDayKey): DeliverySlotSelection {
  return {
    isNow: false,
    dayKey,
    displayLabel: deliveryDayLabel(dayKey),
  }
}
