import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchOrders } from '../api/optica2'
import { HomeFooter } from '../components/HomeFooter'
import { HomeNav } from '../components/HomeNav'
import {
  formatOrderDate,
  orderItemCount,
  orderStatusLabel,
  orderStatusTone,
} from '../lib/orderDisplay'
import { useSessionHydrated, useSessionStore } from '../stores'
import type { Order } from '../types'
import { formatPrice } from '../utils'
import './homepage.css'
import './orders.css'

export function OrdersPage() {
  const session = useSessionStore((s) => s.session)
  const sessionHydrated = useSessionHydrated()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!sessionHydrated || !session) return
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError('')
      try {
        const list = await fetchOrders(session)
        if (!cancelled) setOrders(list)
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Could not load orders')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [session, sessionHydrated])

  const stats = useMemo(() => {
    const active = orders.filter(
      (o) => o.status !== 'delivered' && o.status !== 'cancelled',
    ).length
    const delivered = orders.filter((o) => o.status === 'delivered').length
    return { total: orders.length, active, delivered }
  }, [orders])

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
          <p className="od-kicker">Made by Maa</p>
          <h1>Your orders</h1>
          <p className="od-hero-lead">
            Track homemade meals from kitchen to door — past favourites and live deliveries in one
            place.
          </p>
          {!sessionHydrated ? null : !session ? (
            <div className="od-hero-actions">
              <Link to="/login?next=/orders" className="hp-btn hp-btn--primary">
                Sign in
              </Link>
              <Link to="/kitchens" className="hp-btn hp-btn--ghost">
                Browse kitchens
              </Link>
            </div>
          ) : (
            <div className="od-hero-actions">
              <Link to="/kitchens" className="hp-btn hp-btn--ghost">
                Order again
              </Link>
            </div>
          )}
        </div>
      </header>

      <main className="od-main">
        {!sessionHydrated ? (
          <div className="od-loading">
            <div className="od-loading-icon" aria-hidden>
              <i className="bi bi-bag-heart" />
            </div>
            <h2>Loading…</h2>
            <p>Checking your account.</p>
          </div>
        ) : !session ? (
          <div className="od-empty">
            <div className="od-empty-icon" aria-hidden>
              <i className="bi bi-person-lock" />
            </div>
            <h2>Sign in to view orders</h2>
            <p>Track your homemade food orders after you sign in.</p>
            <Link to="/login?next=/orders" className="hp-btn hp-btn--primary">
              Sign in
            </Link>
          </div>
        ) : (
          <>
            {!loading && orders.length > 0 && (
              <section className="od-stats" aria-label="Order overview">
                <div className="od-stat">
                  <strong>{stats.total}</strong>
                  <small>All orders</small>
                </div>
                <div className="od-stat">
                  <strong>{stats.active}</strong>
                  <small>In progress</small>
                </div>
                <div className="od-stat">
                  <strong>{stats.delivered}</strong>
                  <small>Delivered</small>
                </div>
              </section>
            )}

            {loading && (
              <div className="od-loading">
                <div className="od-loading-icon" aria-hidden>
                  <i className="bi bi-arrow-repeat" />
                </div>
                <h2>Fetching orders…</h2>
                <p>Pulling your latest homemade deliveries.</p>
              </div>
            )}

            {error && (
              <div className="od-error" role="alert">
                <p>{error}</p>
              </div>
            )}

            {!loading && !error && orders.length === 0 && (
              <div className="od-empty">
                <div className="od-empty-icon" aria-hidden>
                  <i className="bi bi-bag" />
                </div>
                <h2>No orders yet</h2>
                <p>When you place an order, it will show up here with live status tracking.</p>
                <Link to="/kitchens" className="hp-btn hp-btn--primary">
                  Explore kitchens
                </Link>
              </div>
            )}

            {!loading && orders.length > 0 && (
              <section className="od-list" aria-label="Order history">
                {orders.map((order, index) => {
                  const tone = orderStatusTone(order.status)
                  const count = orderItemCount(order.items)
                  const preview = order.items
                    .map((i) => `${i.quantity}× ${i.name}`)
                    .join(', ')
                  return (
                    <Link
                      key={order.id}
                      to={`/orders/${order.id}`}
                      className="od-card"
                      style={{ animationDelay: `${Math.min(index * 40, 280)}ms` }}
                    >
                      <span className={`od-card-accent od-card-accent--${tone}`} aria-hidden />
                      <div className="od-card-body">
                        <div className="od-card-top">
                          <h2>
                            {order.kitchenName ||
                              order.orderNumber ||
                              `Order #${order.id}`}
                          </h2>
                          <span className={`od-badge od-badge--${tone}`}>
                            {orderStatusLabel(order.status)}
                          </span>
                        </div>
                        <p className="od-card-meta">
                          {formatOrderDate(order.createdAt)}
                          {count > 0 ? ` · ${count} item${count === 1 ? '' : 's'}` : ''}
                          {order.orderNumber ? ` · ${order.orderNumber}` : ''}
                        </p>
                        {preview && <p className="od-card-items">{preview}</p>}
                        <div className="od-card-foot">
                          <p className="od-card-total">{formatPrice(order.totalAmount)}</p>
                          <span className="od-card-cta">
                            View details
                            <i className="bi bi-arrow-right" aria-hidden />
                          </span>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </section>
            )}
          </>
        )}
      </main>

      <HomeFooter />
    </div>
  )
}
