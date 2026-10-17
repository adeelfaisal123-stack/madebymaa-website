import { Link, useNavigate } from 'react-router-dom'
import { EmptyState } from '../components/EmptyState'
import { HomeFooter } from '../components/HomeFooter'
import { HomeNav } from '../components/HomeNav'
import { QuantityStepper } from '../components/shared'
import { confirmAction, toastSuccess } from '../lib/swal'
import { useCartStore } from '../stores'
import { formatPrice } from '../utils'
import './homepage.css'
import './cart-checkout.css'

export function CartPage() {
  const navigate = useNavigate()
  const lines = useCartStore((s) => s.lines)
  const kitchenId = useCartStore((s) => s.kitchenId)
  const kitchenName = useCartStore((s) => s.kitchenName)
  const setQuantity = useCartStore((s) => s.setQuantity)
  const removeLine = useCartStore((s) => s.removeLine)
  const clear = useCartStore((s) => s.clear)
  const subtotal = useCartStore((s) => s.subtotal)()
  const itemCount = useCartStore((s) => s.itemCount)()
  const items = Object.values(lines)

  const clearCart = () => {
    void (async () => {
      const ok = await confirmAction({
        title: 'Clear cart?',
        text: 'All items will be removed from your bag.',
        confirmText: 'Clear cart',
        cancelText: 'Keep items',
        icon: 'warning',
        danger: true,
      })
      if (!ok) return
      clear()
      toastSuccess('Cart cleared')
    })()
  }

  if (items.length === 0) {
    return (
      <div className="homepage cx-page">
        <HomeNav />
        <main className="cx-main">
          <div className="cx-empty">
            <div className="cx-head">
              <p className="cx-kicker">Cart</p>
              <h1>Your cart is empty</h1>
            </div>
            <EmptyState
              image="/images/empty_cart.png"
              title="Nothing here yet"
              description="Browse kitchens and add homemade dishes to get started."
              action={
                <Link to="/kitchens" className="hp-btn hp-btn--primary" style={{ marginTop: 16 }}>
                  Browse kitchens
                </Link>
              }
            />
          </div>
        </main>
        <HomeFooter />
      </div>
    )
  }

  return (
    <div className="homepage cx-page">
      <HomeNav />
      <main className="cx-main">
        <header className="cx-head">
          <p className="cx-kicker">Cart</p>
          <h1>Your cart</h1>
          <p>
            {itemCount} item{itemCount === 1 ? '' : 's'}
            {kitchenName ? ` from ${kitchenName}` : ''}
          </p>
        </header>

        <div className="cx-grid">
          <section className="cx-panel cx-panel-pad">
            {kitchenName && kitchenId != null && (
              <Link to={`/kitchens/${kitchenId}`} className="cx-kitchen-chip">
                <i className="bi bi-shop" aria-hidden />
                {kitchenName}
              </Link>
            )}

            <div className="cx-lines">
              {items.map((line) => (
                <article key={line.key} className="cx-line">
                  <div className="cx-line-media">
                    {line.imageUrl ? (
                      <img src={line.imageUrl} alt="" />
                    ) : (
                      <div className="cx-line-fallback" aria-hidden>
                        <i className="bi bi-egg-fried" />
                      </div>
                    )}
                  </div>
                  <div className="cx-line-body">
                    <div className="cx-line-top">
                      <div>
                        <h3>{line.dishName}</h3>
                        <p className="cx-line-meta">{formatPrice(line.unitPrice)} each</p>
                      </div>
                      <button
                        type="button"
                        className="cx-remove"
                        aria-label={`Remove ${line.dishName}`}
                        onClick={() => removeLine(line.key)}
                      >
                        <i className="bi bi-trash3" />
                      </button>
                    </div>
                    <div className="cx-line-bottom">
                      <span className="cx-line-price">
                        {formatPrice(line.unitPrice * line.quantity)}
                      </span>
                      <QuantityStepper
                        quantity={line.quantity}
                        onChange={(n) => setQuantity(line.key, n)}
                      />
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <aside className="cx-panel cx-panel-pad cx-summary">
            <h2 className="cx-panel-title">Order summary</h2>
            <div className="cx-summary-rows">
              <div className="cx-row">
                <span>Subtotal</span>
                <strong>{formatPrice(subtotal)}</strong>
              </div>
              <div className="cx-row">
                <span>Delivery</span>
                <strong>Calculated at checkout</strong>
              </div>
              <div className="cx-row cx-row--total">
                <span>Total</span>
                <strong>{formatPrice(subtotal)}</strong>
              </div>
            </div>
            <div className="cx-actions">
              <button
                type="button"
                className="hp-btn hp-btn--primary"
                onClick={() => navigate('/checkout')}
              >
                <i className="bi bi-bag-check-fill" aria-hidden />
                Proceed to checkout
              </button>
              <button type="button" className="hp-btn hp-btn--ghost" onClick={clearCart}>
                Clear cart
              </button>
              <Link to="/kitchens" className="hp-btn hp-btn--ghost">
                Keep shopping
              </Link>
            </div>
          </aside>
        </div>
      </main>
      <HomeFooter />
    </div>
  )
}
