import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { cancelOrder, fetchOrder } from '../api/optica2'
import { HomeFooter } from '../components/HomeFooter'
import { HomeNav } from '../components/HomeNav'
import {
  ORDER_STATUS_FLOW,
  canCancelOrder,
  deliverySlotDisplay,
  formatOrderDate,
  orderPaymentLabel,
  orderStatusLabel,
  orderStatusTone,
  orderTrackingMessage,
  orderTrackingTitle,
} from '../lib/orderDisplay'
import { confirmAction, toastError, toastSuccess } from '../lib/swal'
import { useSessionHydrated, useSessionStore } from '../stores'
import type { Order } from '../types'
import { formatPrice } from '../utils'
import './homepage.css'
import './orders.css'

export function OrderDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const session = useSessionStore((s) => s.session)
  const sessionHydrated = useSessionHydrated()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => {
    if (!sessionHydrated) return
    if (!session) {
      navigate(`/login?next=/orders/${id ?? ''}`, { replace: true })
      return
    }
    if (!id) {
      setError('Order not found')
      setLoading(false)
      return
    }

    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError('')
      try {
        const next = await fetchOrder(session, id)
        if (!cancelled) setOrder(next)
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Could not load order')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [session, sessionHydrated, id, navigate])

  const onCancel = async () => {
    if (!session || !order) return
    const ok = await confirmAction({
      title: 'Cancel this order?',
      text: 'You will not be charged for cancelled COD orders.',
      confirmText: 'Yes, cancel',
      cancelText: 'Keep order',
      icon: 'warning',
      danger: true,
    })
    if (!ok) return
    setCancelling(true)
    try {
      const updated = await cancelOrder(session, order.id)
      setOrder(updated)
      toastSuccess('Order cancelled')
    } catch (e) {
      toastError(e instanceof Error ? e.message : 'Could not cancel order')
    } finally {
      setCancelling(false)
    }
  }

  const tone = order ? orderStatusTone(order.status) : 'pending'
  const normalizedStatus =
    order?.status === 'placed' ? 'pending' : (order?.status ?? 'pending')
  const flowIndex = ORDER_STATUS_FLOW.indexOf(
    normalizedStatus as (typeof ORDER_STATUS_FLOW)[number],
  )
  const kitchenLink = order?.items.find((i) => i.kitchenId > 0)?.kitchenId

  return (
    <div className="homepage od-page">
      <HomeNav />

      <header className="od-hero">
        <div className="od-hero-atmosphere" aria-hidden>
          <div className="od-hero-wash" />
          <div className="od-hero-glow od-hero-glow--a" />
          <div className="od-hero-glow od-hero-glow--b" />
        </div>
        <div className="od-hero-inner">
          <Link to="/orders" className="od-back">
            <i className="bi bi-arrow-left" aria-hidden />
            All orders
          </Link>
          <p className="od-kicker">Order details</p>
          <h1>
            {order?.kitchenName ||
              order?.orderNumber ||
              (loading ? 'Loading…' : `Order #${id ?? ''}`)}
          </h1>
          <p className="od-hero-lead">
            {order
              ? `${formatOrderDate(order.createdAt)}${
                  order.orderNumber ? ` · ${order.orderNumber}` : ''
                }`
              : 'Homemade food, tracked with care.'}
          </p>
          {order && (
            <div className="od-hero-actions">
              <span className={`od-badge od-badge--${tone}`}>{orderStatusLabel(order.status)}</span>
            </div>
          )}
        </div>
      </header>

      <main className="od-main">
        {loading && (
          <div className="od-loading">
            <div className="od-loading-icon" aria-hidden>
              <i className="bi bi-hourglass-split" />
            </div>
            <h2>Opening order…</h2>
            <p>Fetching the latest status and items.</p>
          </div>
        )}

        {error && !loading && (
          <div className="od-empty">
            <div className="od-empty-icon" aria-hidden>
              <i className="bi bi-exclamation-circle" />
            </div>
            <h2>Couldn’t load this order</h2>
            <p>{error}</p>
            <Link to="/orders" className="hp-btn hp-btn--primary">
              Back to orders
            </Link>
          </div>
        )}

        {!loading && order && (
          <div className="od-detail-grid">
            <section className="od-panel">
              <div className="od-track-head">
                <h2>{orderTrackingTitle(order.status)}</h2>
                <span className={`od-badge od-badge--${tone}`}>
                  {orderStatusLabel(order.status)}
                </span>
              </div>
              <p className="od-track-msg">{orderTrackingMessage(order.status)}</p>

              {order.status === 'cancelled' ? (
                <ul className="od-timeline">
                  <li className="od-timeline-step is-cancelled">
                    <span className="od-timeline-dot" aria-hidden>
                      <i className="bi bi-x" />
                    </span>
                    <div className="od-timeline-copy">
                      <strong>Cancelled</strong>
                      <small>This order is no longer active</small>
                    </div>
                  </li>
                </ul>
              ) : (
                <ul className="od-timeline">
                  {ORDER_STATUS_FLOW.map((step, index) => {
                    const isDelivered = normalizedStatus === 'delivered'
                    const done = isDelivered || (flowIndex >= 0 && index < flowIndex)
                    const current = !isDelivered && flowIndex === index
                    return (
                      <li
                        key={step}
                        className={`od-timeline-step${done ? ' is-done' : ''}${
                          current ? ' is-current' : ''
                        }`}
                      >
                        <span className="od-timeline-dot" aria-hidden>
                          {done ? <i className="bi bi-check" /> : index + 1}
                        </span>
                        <div className="od-timeline-copy">
                          <strong>{orderStatusLabel(step)}</strong>
                          <small>
                            {current ? 'Current step' : done ? 'Completed' : 'Upcoming'}
                          </small>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </section>

            <section className="od-panel">
              <h3 className="od-panel-title">Items</h3>
              {order.items.length === 0 ? (
                <p className="od-track-msg">No item details available.</p>
              ) : (
                order.items.map((item, idx) => (
                  <div key={`${item.dishId}-${idx}`} className="od-item">
                    <div className="od-item-media">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt="" loading="lazy" />
                      ) : (
                        <div className="od-item-fallback" aria-hidden>
                          <i className="bi bi-egg-fried" />
                        </div>
                      )}
                    </div>
                    <div className="od-item-copy">
                      <strong>{item.name}</strong>
                      <small>
                        {item.quantity} × {formatPrice(item.unitPrice)}
                        {item.kitchenName ? ` · ${item.kitchenName}` : ''}
                      </small>
                    </div>
                    <span className="od-item-price">{formatPrice(item.lineTotal)}</span>
                  </div>
                ))
              )}
            </section>

            <section className="od-panel">
              <h3 className="od-panel-title">Delivery & payment</h3>
              <div className="od-meta-row">
                <span className="od-meta-icon" aria-hidden>
                  <i className="bi bi-geo-alt-fill" />
                </span>
                <div className="od-meta-copy">
                  <strong>Address</strong>
                  <p>{order.deliveryAddress || '—'}</p>
                </div>
              </div>
              <div className="od-meta-row">
                <span className="od-meta-icon od-meta-icon--warm" aria-hidden>
                  <i className="bi bi-clock" />
                </span>
                <div className="od-meta-copy">
                  <strong>Slot</strong>
                  <p>{deliverySlotDisplay(order.deliverySlot)}</p>
                </div>
              </div>
              <div className="od-meta-row">
                <span className="od-meta-icon" aria-hidden>
                  <i className="bi bi-wallet2" />
                </span>
                <div className="od-meta-copy">
                  <strong>Payment</strong>
                  <p>
                    {orderPaymentLabel(order.paymentMethod)}
                    {order.paymentStatus ? ` · ${order.paymentStatus}` : ''}
                  </p>
                </div>
              </div>
              {order.notes && (
                <div className="od-meta-row">
                  <span className="od-meta-icon od-meta-icon--warm" aria-hidden>
                    <i className="bi bi-chat-left-text" />
                  </span>
                  <div className="od-meta-copy">
                    <strong>Notes</strong>
                    <p>{order.notes}</p>
                  </div>
                </div>
              )}
            </section>

            <section className="od-panel">
              <h3 className="od-panel-title">Summary</h3>
              <div className="od-summary-row">
                <span>Subtotal</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              <div className="od-summary-row">
                <span>Delivery</span>
                <span>{formatPrice(order.deliveryFee)}</span>
              </div>
              {order.gstAmount > 0 && (
                <div className="od-summary-row">
                  <span>GST</span>
                  <span>{formatPrice(order.gstAmount)}</span>
                </div>
              )}
              <div className="od-summary-row is-total">
                <span>Total</span>
                <span>{formatPrice(order.totalAmount)}</span>
              </div>
            </section>

            <div className="od-actions">
              {kitchenLink != null && (
                <Link to={`/kitchens/${kitchenLink}`} className="hp-btn hp-btn--ghost">
                  <i className="bi bi-shop" aria-hidden />
                  View kitchen
                </Link>
              )}
              <Link to="/kitchens" className="hp-btn hp-btn--primary">
                Order again
              </Link>
              {canCancelOrder(order.status) && (
                <button
                  type="button"
                  className="hp-btn hp-btn--ghost"
                  disabled={cancelling}
                  onClick={() => void onCancel()}
                >
                  {cancelling ? 'Cancelling…' : 'Cancel order'}
                </button>
              )}
            </div>
          </div>
        )}
      </main>

      <HomeFooter />
    </div>
  )
}
