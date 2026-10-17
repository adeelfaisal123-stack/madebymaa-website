import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CartLine, CustomerSession, Dish } from '../types'
import { resolveStoredLocationLabel } from '../utils/location'

interface CartState {
  lines: Record<string, CartLine>
  kitchenId: number | null
  kitchenName: string | null
  addLine: (line: Omit<CartLine, 'key'>, quantity?: number) => boolean
  setQuantity: (key: string, quantity: number) => void
  removeLine: (key: string) => void
  clear: () => void
  subtotal: () => number
  itemCount: () => number
}

export const useCartStore = create<CartState>()((set, get) => ({
  lines: {},
  kitchenId: null,
  kitchenName: null,
  addLine: (line, quantity = 1) => {
    const state = get()
    const key = `${line.kitchenId}:${line.dishId}`
    if (state.kitchenId != null && state.kitchenId !== line.kitchenId && !state.lines[key]) {
      return false
    }
    const existing = state.lines[key]
    const nextQty = (existing?.quantity ?? 0) + quantity
    set({
      kitchenId: line.kitchenId,
      kitchenName: line.kitchenName,
      lines: {
        ...state.lines,
        [key]: {
          ...line,
          key,
          quantity: nextQty,
        },
      },
    })
    return true
  },
  setQuantity: (key, quantity) => {
    if (quantity <= 0) {
      get().removeLine(key)
      return
    }
    const line = get().lines[key]
    if (!line) return
    set({ lines: { ...get().lines, [key]: { ...line, quantity } } })
  },
  removeLine: (key) => {
    const next = { ...get().lines }
    delete next[key]
    const ids = Object.keys(next)
    set({
      lines: next,
      kitchenId: ids.length ? get().kitchenId : null,
      kitchenName: ids.length ? get().kitchenName : null,
    })
  },
  clear: () => set({ lines: {}, kitchenId: null, kitchenName: null }),
  subtotal: () =>
    Object.values(get().lines).reduce((sum, l) => sum + l.unitPrice * l.quantity, 0),
  itemCount: () => Object.values(get().lines).reduce((sum, l) => sum + l.quantity, 0),
}))

export interface WishlistEntry {
  key: string
  dishId: number
  dishName: string
  kitchenId: number
  kitchenName: string
  unitPrice: number
  isVeg: boolean
  imageUrl?: string
  description?: string
}

interface WishlistState {
  entries: Record<string, WishlistEntry>
  isSaved: (kitchenId: number, dishId: number) => boolean
  toggle: (dish: Dish) => boolean
  remove: (kitchenId: number, dishId: number) => void
  clear: () => void
  count: () => number
}

function wishlistKey(kitchenId: number, dishId: number) {
  return `${kitchenId}:${dishId}`
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      entries: {},
      isSaved: (kitchenId, dishId) => Boolean(get().entries[wishlistKey(kitchenId, dishId)]),
      toggle: (dish) => {
        const key = wishlistKey(dish.restaurantId, dish.id)
        const existing = get().entries[key]
        if (existing) {
          const next = { ...get().entries }
          delete next[key]
          set({ entries: next })
          return false
        }
        set({
          entries: {
            ...get().entries,
            [key]: {
              key,
              dishId: dish.id,
              dishName: dish.name,
              kitchenId: dish.restaurantId,
              kitchenName: dish.restaurantName,
              unitPrice: dish.effectivePrice,
              isVeg: dish.isVeg,
              imageUrl: dish.imageUrl,
              description: dish.description,
            },
          },
        })
        return true
      },
      remove: (kitchenId, dishId) => {
        const next = { ...get().entries }
        delete next[wishlistKey(kitchenId, dishId)]
        set({ entries: next })
      },
      clear: () => set({ entries: {} }),
      count: () => Object.keys(get().entries).length,
    }),
    { name: 'maa-customer-wishlist' },
  ),
)

export interface RecentlyViewedDish {
  key: string
  dishId: number
  dishName: string
  kitchenId: number
  kitchenName: string
  unitPrice: number
  price: number
  isVeg: boolean
  imageUrl?: string
  viewedAt: string
}

interface RecentlyViewedState {
  entries: RecentlyViewedDish[]
  recordView: (dish: Dish) => void
  clear: () => void
}

const RECENTLY_VIEWED_MAX = 8

function recentlyViewedKey(kitchenId: number, dishId: number) {
  return `${kitchenId}:${dishId}`
}

export const useRecentlyViewedStore = create<RecentlyViewedState>()(
  persist(
    (set, get) => ({
      entries: [],
      recordView: (dish) => {
        const key = recentlyViewedKey(dish.restaurantId, dish.id)
        const next: RecentlyViewedDish = {
          key,
          dishId: dish.id,
          dishName: dish.name,
          kitchenId: dish.restaurantId,
          kitchenName: dish.restaurantName,
          unitPrice: dish.effectivePrice,
          price: dish.price,
          isVeg: dish.isVeg,
          imageUrl: dish.imageUrl,
          viewedAt: new Date().toISOString(),
        }
        const rest = get().entries.filter((e) => e.key !== key)
        set({ entries: [next, ...rest].slice(0, RECENTLY_VIEWED_MAX) })
      },
      clear: () => set({ entries: [] }),
    }),
    { name: 'maa-customer-recently-viewed' },
  ),
)

interface SessionState {
  session: CustomerSession | null
  /** False until localStorage rehydration finishes — avoid treating as logged out too early. */
  hasHydrated: boolean
  setSession: (session: CustomerSession | null) => void
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      session: null,
      hasHydrated: false,
      setSession: (session) => set({ session }),
    }),
    {
      name: 'maa-customer-session',
      partialize: (state) => ({ session: state.session }),
      onRehydrateStorage: () => () => {
        useSessionStore.setState({ hasHydrated: true })
      },
    },
  ),
)

useSessionStore.persist.onFinishHydration(() => {
  useSessionStore.setState({ hasHydrated: true })
})
if (useSessionStore.persist.hasHydrated()) {
  useSessionStore.setState({ hasHydrated: true })
}

// Safety net: never leave auth UI blocked if storage callbacks fail.
if (typeof window !== 'undefined') {
  window.setTimeout(() => {
    if (!useSessionStore.getState().hasHydrated) {
      useSessionStore.setState({ hasHydrated: true })
    }
  }, 100)
}

/** True once the persisted customer session has been read from storage. */
export function useSessionHydrated() {
  return useSessionStore((s) => s.hasHydrated)
}

interface LocationState {
  label: string
  lat: number | null
  lng: number | null
  setLocation: (label: string, lat: number, lng: number) => void
  resolveLabel: () => Promise<void>
}

export const useLocationStore = create<LocationState>()(
  persist(
    (set, get) => ({
      label: 'Set your location',
      lat: null,
      lng: null,
      setLocation: (label, lat, lng) => set({ label, lat, lng }),
      resolveLabel: async () => {
        const { label, lat, lng } = get()
        const resolved = await resolveStoredLocationLabel(label, lat, lng)
        if (resolved) set({ label: resolved })
      },
    }),
    { name: 'maa-customer-location' },
  ),
)
