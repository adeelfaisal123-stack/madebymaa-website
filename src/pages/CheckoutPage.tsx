import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  createOrder,
  fetchDeliveryQuote,
  fetchKitchenDetail,
  fetchPaymentConfig,
  fetchSuperCategories,
  type PaymentConfig,
  type PaymentMethodId,
} from '../api/optica2'
import { DeliverySlotSelector } from '../components/DeliverySlotSelector'
import { HomeFooter } from '../components/HomeFooter'
import { HomeNav } from '../components/HomeNav'
import {
  deliverySlotNow,
  deliverySlotToApiPayload,
  firstAvailableDeliveryDayKey,
  isScheduledComplete,
  scheduledDaySelection,
  type DeliverySlotSelection,
  type MealCategory,
} from '../lib/deliverySlots'
import { useCartStore, useLocationStore, useSessionHydrated, useSessionStore } from '../stores'
import { detectUserLocation, formatPrice } from '../utils'
import { confirmAction, toastError, toastSuccess, toastWarning } from '../lib/swal'
import './homepage.css'
import './cart-checkout.css'

const PAYMENT_OPTIONS: {
  id: PaymentMethodId
  title: string
  subtitle: string
  icon: string
  iconClass: string
  ready: (cfg: PaymentConfig) => boolean
}[] = [
  {
    id: 'cod',
    title: 'Cash on delivery',
    subtitle: 'Pay when your order arrives',
    icon: 'bi-cash-coin',
    iconClass: 'cx-pay-icon--cod',
    ready: (cfg) => cfg.codEnabled,
  },
  {
    id: 'razorpay',
    title: 'Pay with Razorpay',
    subtitle: 'UPI, cards & wallets via Razorpay',
    icon: 'bi-wallet2',
    iconClass: 'cx-pay-icon--razorpay',
    ready: (cfg) => cfg.razorpayReady,
  },
  {
    id: 'stripe',
    title: 'Pay with Stripe',
    subtitle: 'Cards and wallets via Stripe',
    icon: 'bi-credit-card-2-front',
    iconClass: 'cx-pay-icon--stripe',
    ready: (cfg) => cfg.stripeReady,
  },
  {
    id: 'cashfree',
    title: 'Pay with Cashfree',
    subtitle: 'UPI, cards & wallets via Cashfree',
    icon: 'bi-bank',
    iconClass: 'cx-pay-icon--cashfree',
    ready: (cfg) => cfg.cashfreeReady,
  },
]

function defaultMethod(cfg: PaymentConfig): PaymentMethodId {
  if (cfg.codEnabled) return 'cod'
  if (cfg.cashfreeReady) return 'cashfree'
  if (cfg.stripeReady) return 'stripe'
  if (cfg.razorpayReady) return 'razorpay'
  return 'cod'
}

function gstAmount(subtotal: number, cfg: PaymentConfig | null): number {
  if (!cfg?.gst.enabled || cfg.gst.value <= 0) return 0
  if (cfg.gst.type === 'fixed') return cfg.gst.value
  return (subtotal * cfg.gst.value) / 100
}

function gstLabel(cfg: PaymentConfig | null): string {
  if (!cfg?.gst.enabled || cfg.gst.value <= 0) return 'GST'
  if (cfg.gst.type === 'fixed') return cfg.gst.label ? `GST (${cfg.gst.label})` : 'GST'
  return cfg.gst.label ? `GST (${cfg.gst.label})` : 'GST'
}

export function CheckoutPage() {
  const navigate = useNavigate()
  const session = useSessionStore((s) => s.session)
  const sessionHydrated = useSessionHydrated()
  const lines = useCartStore((s) => s.lines)
  const kitchenName = useCartStore((s) => s.kitchenName)
  const kitchenId = useCartStore((s) => s.kitchenId)
  const subtotal = useCartStore((s) => s.subtotal)()
  const clear = useCartStore((s) => s.clear)
  const { label, lat, lng, setLocation } = useLocationStore()
  const [address, setAddress] = useState(() =>
    label === 'Set your location' || label === 'Current location' ? '' : label,
  )
  const [notes, setNotes] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodId>('cod')
  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig | null>(null)
  const [loadingPay, setLoadingPay] = useState(true)
  const [deliveryFee, setDeliveryFee] = useState(0)
  const [deliveryLabel, setDeliveryLabel] = useState('Delivery')
  const [loadingQuote, setLoadingQuote] = useState(false)
  const [quoteError, setQuoteError] = useState('')
  const [placing, setPlacing] = useState(false)
  const [allowDeliverNow, setAllowDeliverNow] = useState(true)
  const [slotCategories, setSlotCategories] = useState<MealCategory[]>([])
  const [loadingSlots, setLoadingSlots] = useState(true)
  const [deliverySlot, setDeliverySlot] = useState<DeliverySlotSelection>(() =>
    deliverySlotNow(),
  )

  const items = Object.values(lines)
  const tax = gstAmount(subtotal, paymentConfig)
  const total = subtotal + deliveryFee + tax
  const quoteItemsKey = useMemo(
    () =>
      items
        .map((line) => `${line.kitchenId}:${line.dishId}:${line.quantity}`)
        .sort()
        .join('|'),
    [items],
  )

  const paymentTiles = useMemo(() => {
    if (!paymentConfig) return []
    return PAYMENT_OPTIONS.map((opt) => ({
      ...opt,
      available: opt.ready(paymentConfig),
    }))
  }, [paymentConfig])

  const availablePayments = useMemo(
    () => paymentTiles.filter((opt) => opt.available),
    [paymentTiles],
  )

  useEffect(() => {
    if (items.length === 0) navigate('/cart', { replace: true })
  }, [items.length, navigate])

  useEffect(() => {
    if (!sessionHydrated) return
    if (!session) navigate('/login?next=/checkout', { replace: true })
  }, [session, sessionHydrated, navigate])

  useEffect(() => {
    setLoadingPay(true)
    fetchPaymentConfig()
      .then((cfg) => {
        setPaymentConfig(cfg)
        setPaymentMethod(defaultMethod(cfg))
      })
      .catch(() => {
        setPaymentConfig({
          codEnabled: true,
          razorpayReady: false,
          stripeReady: false,
          cashfreeReady: false,
          cashfreeEnvironment: 'sandbox',
          gst: { enabled: false, type: 'percent', value: 0, label: '' },
        })
        setPaymentMethod('cod')
      })
      .finally(() => setLoadingPay(false))
  }, [])

  useEffect(() => {
    if (label !== 'Set your location' && label !== 'Current location') {
      setAddress(label)
    }
  }, [label])

  useEffect(() => {
    const ids = [...new Set(items.map((line) => line.kitchenId).filter(Boolean))]
    if (ids.length === 0) {
      setAllowDeliverNow(false)
      setLoadingSlots(false)
      return
    }

    let cancelled = false
    setLoadingSlots(true)

    ;(async () => {
      try {
        const [details, supers] = await Promise.all([
          Promise.all(ids.map((id) => fetchKitchenDetail(id))),
          fetchSuperCategories(),
        ])
        if (cancelled) return

        const allOpen = details.every((k) => k.isOpen)
        const allInstant = details.every((k) => k.instantDeliveryEnabled)
        const canDeliverNow = allOpen && allInstant
        setAllowDeliverNow(canDeliverNow)

        const categories: MealCategory[] = supers.map((c) => ({
          id: c.id,
          name: c.name,
          timeRange: c.timeRange ?? '',
          startTime: c.startTime,
          endTime: c.endTime,
        }))
        setSlotCategories(categories)

        if (!canDeliverNow) {
          const dayKey = firstAvailableDeliveryDayKey(categories) ?? 'today'
          setDeliverySlot((prev) =>
            prev.isNow || !isScheduledComplete(prev)
              ? scheduledDaySelection(dayKey)
              : prev,
          )
        }
      } catch {
        if (!cancelled) {
          setAllowDeliverNow(false)
          setSlotCategories([])
        }
      } finally {
        if (!cancelled) setLoadingSlots(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [quoteItemsKey])

  useEffect(() => {
    if (!quoteItemsKey) return

    if (lat == null || lng == null) {
      setDeliveryFee(0)
      setDeliveryLabel('Delivery')
      setQuoteError('Set your location to calculate delivery.')
      setLoadingQuote(false)
      return
    }

    const cartItems = Object.values(useCartStore.getState().lines)
    const restaurantId = kitchenId ?? cartItems[0]?.kitchenId
    if (!restaurantId) {
      setDeliveryFee(0)
      setQuoteError('Could not determine kitchen for delivery.')
      return
    }

    let cancelled = false
    setLoadingQuote(true)
    setQuoteError('')

    fetchDeliveryQuote({
      delivery_latitude: lat,
      delivery_longitude: lng,
      items: cartItems.map((line) => ({
        dish_id: line.dishId,
        restaurant_id: line.kitchenId || restaurantId,
        quantity: line.quantity,
      })),
    })
      .then((quote) => {
        if (cancelled) return
        setDeliveryFee(quote.deliveryFee)
        setDeliveryLabel(
          quote.breakdownLabel ? `Delivery (${quote.breakdownLabel})` : 'Delivery',
        )
        setQuoteError('')
      })
      .catch((e) => {
        if (cancelled) return
        setDeliveryFee(0)
        setDeliveryLabel('Delivery')
        setQuoteError(e instanceof Error ? e.message : 'Could not calculate delivery fee.')
      })
      .finally(() => {
        if (!cancelled) setLoadingQuote(false)
      })

    return () => {
      cancelled = true
    }
  }, [lat, lng, quoteItemsKey, kitchenId])

  const detectLocation = () => {
    detectUserLocation(
      (locLabel, latitude, longitude) => {
        setLocation(locLabel, latitude, longitude)
        setAddress(locLabel)
      },
      { label: 'Ajman, UAE', lat: 25.4184, lng: 55.5019 },
    )
  }

  const placeOrder = async () => {
    if (!session || lat == null || lng == null) {
      toastWarning('Set your delivery location to continue.')
      return
    }
    if (!address.trim()) {
      toastWarning('Enter a delivery address.')
      return
    }
    if (availablePayments.length === 0) {
      toastError('No payment methods are available right now.')
      return
    }
    if (!allowDeliverNow || !deliverySlot.isNow) {
      if (!isScheduledComplete(deliverySlot)) {
        toastWarning('Choose a day and 30-minute time slot.')
        return
      }
    }
    if (paymentMethod !== 'cod') {
      toastWarning(
        paymentConfig?.codEnabled
          ? 'Online payment on the website is coming soon. Please choose Cash on delivery, or complete payment in the Made by Maa app.'
          : 'Online payment on the website is coming soon. Please complete Razorpay, Stripe, or Cashfree checkout in the Made by Maa app.',
      )
      return
    }

    const ok = await confirmAction({
      title: 'Place this order?',
      text: `Total ${formatPrice(total)} · ${orderPaymentLabel()}`,
      confirmText: 'Place order',
      cancelText: 'Review again',
      icon: 'question',
    })
    if (!ok) return

    setPlacing(true)
    try {
      await createOrder(session, {
        delivery_address: address.trim(),
        delivery_latitude: lat,
        delivery_longitude: lng,
        payment_method: paymentMethod,
        notes: notes.trim() || undefined,
        delivery_slot: deliverySlotToApiPayload(deliverySlot),
        items: items.map((line) => ({
          dish_id: line.dishId,
          restaurant_id: line.kitchenId,
          quantity: line.quantity,
        })),
      })
      clear()
      toastSuccess('Order placed successfully')
      navigate('/orders', { replace: true })
    } catch (e) {
      toastError(e instanceof Error ? e.message : 'Could not place order')
    } finally {
      setPlacing(false)
    }
  }

  function orderPaymentLabel() {
    if (paymentMethod === 'cod') return 'Cash on delivery'
    if (paymentMethod === 'razorpay') return 'Razorpay'
    if (paymentMethod === 'stripe') return 'Stripe'
    return 'Cashfree'
  }

  if (!sessionHydrated || !session || items.length === 0) return null

  const placeLabel =
    paymentMethod === 'cod'
      ? placing
        ? 'Placing order…'
        : 'Place order'
      : placing
        ? 'Processing…'
        : 'Pay & place order'

  return (
    <div className="homepage cx-page">
      <HomeNav />
      <main className="cx-main">
        <header className="cx-head">
          <p className="cx-kicker">Checkout</p>
          <h1>Complete your order</h1>
          <p>
            {kitchenName
              ? `Homemade from ${kitchenName}`
              : 'Review delivery details and choose how you’d like to pay.'}
          </p>
        </header>

        <div className="cx-grid">
          <div>
            <section className="cx-panel cx-panel-pad" style={{ marginBottom: 20 }}>
              <h2 className="cx-panel-title">Delivery</h2>
              <div className="cx-field">
                <label htmlFor="address">Delivery address</label>
                <input
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="House / flat, street, area"
                  autoComplete="street-address"
                />
                <button
                  type="button"
                  className="hp-btn hp-btn--ghost hp-btn--sm cx-loc-btn"
                  onClick={detectLocation}
                >
                  <i className="bi bi-geo-alt-fill" aria-hidden />
                  Use current location
                </button>
              </div>
              <div className="cx-field" style={{ marginBottom: 0 }}>
                <label htmlFor="notes">Notes for the kitchen (optional)</label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Gate code, spice level, allergies…"
                />
              </div>
            </section>

            <section className="cx-panel cx-panel-pad" style={{ marginBottom: 20 }}>
              <h2 className="cx-panel-title">Delivery time</h2>
              <DeliverySlotSelector
                categories={slotCategories}
                selected={deliverySlot}
                onSelected={setDeliverySlot}
                allowDeliverNow={allowDeliverNow}
                loading={loadingSlots}
                kitchenName={kitchenName}
              />
            </section>

            <section className="cx-panel cx-panel-pad">
              <h2 className="cx-panel-title">Payment</h2>
              {loadingPay ? (
                <p className="cx-pay-loading">Loading payment options…</p>
              ) : (
                <div className="cx-pay-list" role="radiogroup" aria-label="Payment method">
                  {paymentTiles.map((opt) => {
                    const selected = paymentMethod === opt.id
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        aria-disabled={!opt.available}
                        disabled={!opt.available}
                        className={`cx-pay${selected ? ' is-selected' : ''}${!opt.available ? ' is-disabled' : ''}`}
                        onClick={() => {
                          if (opt.available) setPaymentMethod(opt.id)
                        }}
                      >
                        <span className={`cx-pay-icon ${opt.iconClass}`} aria-hidden>
                          <i className={`bi ${opt.icon}`} />
                        </span>
                        <span className="cx-pay-copy">
                          <strong>{opt.title}</strong>
                          <small>
                            {opt.available ? opt.subtitle : 'Not available right now'}
                          </small>
                        </span>
                        <span className="cx-pay-check" aria-hidden>
                          <i className="bi bi-check-lg" />
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}
              {paymentMethod !== 'cod' && (
                <p className="cx-hint">
                  Online gateway checkout on web is rolling out — for now, complete{' '}
                  {paymentMethod === 'razorpay'
                    ? 'Razorpay'
                    : paymentMethod === 'stripe'
                      ? 'Stripe'
                      : 'Cashfree'}{' '}
                  payments in the Made by Maa app, or choose Cash on delivery.
                </p>
              )}
            </section>
          </div>

          <aside className="cx-panel cx-panel-pad cx-summary">
            <h2 className="cx-panel-title">Order summary</h2>
            {kitchenName && kitchenId != null && (
              <Link to={`/kitchens/${kitchenId}`} className="cx-kitchen-chip">
                <i className="bi bi-shop" aria-hidden />
                {kitchenName}
              </Link>
            )}
            <div className="cx-mini-lines">
              {items.map((line) => (
                <div key={line.key} className="cx-mini-line">
                  <span>
                    {line.quantity}× {line.dishName}
                  </span>
                  <strong>{formatPrice(line.unitPrice * line.quantity)}</strong>
                </div>
              ))}
            </div>
            <div className="cx-summary-rows">
              <div className="cx-row">
                <span>Delivery time</span>
                <strong>{deliverySlot.displayLabel}</strong>
              </div>
              <div className="cx-row">
                <span>Subtotal</span>
                <strong>{formatPrice(subtotal)}</strong>
              </div>
              <div className="cx-row">
                <span>{deliveryLabel}</span>
                <strong>
                  {loadingQuote
                    ? '…'
                    : lat == null || lng == null
                      ? 'Set location'
                      : formatPrice(deliveryFee)}
                </strong>
              </div>
              {quoteError && <p className="cx-hint cx-hint--warn">{quoteError}</p>}
              {tax > 0 && (
                <div className="cx-row">
                  <span>{gstLabel(paymentConfig)}</span>
                  <strong>{formatPrice(tax)}</strong>
                </div>
              )}
              <div className="cx-row cx-row--total">
                <span>Total</span>
                <strong>{formatPrice(total)}</strong>
              </div>
            </div>
            <div className="cx-actions">
              <button
                type="button"
                className="hp-btn hp-btn--primary"
                disabled={placing || loadingPay}
                onClick={() => void placeOrder()}
              >
                <i className="bi bi-bag-check-fill" aria-hidden />
                {placeLabel}
              </button>
              <Link to="/cart" className="hp-btn hp-btn--ghost">
                Back to cart
              </Link>
            </div>
          </aside>
        </div>
      </main>
      <HomeFooter />
    </div>
  )
}
