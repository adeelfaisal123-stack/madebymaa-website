import { Link } from 'react-router-dom'
import { EmptyState } from '../components/EmptyState'
import { HomeFooter } from '../components/HomeFooter'
import { HomeNav } from '../components/HomeNav'
import { confirmAction, toastSuccess, toastWarning } from '../lib/swal'
import { useCartStore, useWishlistStore, type WishlistEntry } from '../stores'
import { formatPrice } from '../utils'
import './homepage.css'
import './cart-checkout.css'
import './wishlist.css'

export function WishlistPage() {
  const entriesMap = useWishlistStore((s) => s.entries)
  const remove = useWishlistStore((s) => s.remove)
  const clear = useWishlistStore((s) => s.clear)
  const addLine = useCartStore((s) => s.addLine)
  const clearCart = useCartStore((s) => s.clear)

  const entries = Object.values(entriesMap)

  const clearWishlist = () => {
    void (async () => {
      const ok = await confirmAction({
        title: 'Clear wishlist?',
        text: 'All saved dishes will be removed.',
        confirmText: 'Clear wishlist',
        cancelText: 'Keep dishes',
        icon: 'warning',
        danger: true,
      })
      if (!ok) return
      clear()
      toastSuccess('Wishlist cleared')
    })()
  }

  const removeDish = (entry: WishlistEntry) => {
    void (async () => {
      const ok = await confirmAction({
        title: 'Remove from wishlist?',
        text: `Remove ${entry.dishName} from your saved dishes?`,
        confirmText: 'Remove',
        cancelText: 'Keep',
        icon: 'question',
        danger: true,
      })
      if (!ok) return
      remove(entry.kitchenId, entry.dishId)
      toastSuccess('Removed from wishlist')
    })()
  }

  const addToCart = (entry: WishlistEntry) => {
    void (async () => {
      const payload = {
        dishId: entry.dishId,
        dishName: entry.dishName,
        kitchenId: entry.kitchenId,
        kitchenName: entry.kitchenName,
        quantity: 1,
        unitPrice: entry.unitPrice,
        isVeg: entry.isVeg,
        imageUrl: entry.imageUrl,
      }
      const ok = addLine(payload, 1)
      if (!ok) {
        toastWarning('Your cart has items from another kitchen.')
        const clearOk = await confirmAction({
          title: 'Clear cart and add this dish?',
          text: 'Your bag currently has items from another kitchen.',
          confirmText: 'Clear & add',
          cancelText: 'Keep cart',
          icon: 'warning',
          danger: true,
        })
        if (!clearOk) return
        clearCart()
        addLine(payload, 1)
      }
      toastSuccess(`${entry.dishName} added to cart`)
    })()
  }

  if (entries.length === 0) {
    return (
      <div className="homepage wl-page">
        <HomeNav />
        <main className="cx-main">
          <div className="cx-empty">
            <div className="cx-head">
              <p className="cx-kicker">Wishlist</p>
              <h1>Your wishlist is empty</h1>
            </div>
            <EmptyState
              image="/images/empty_wishlist.png"
              title="No saved dishes yet"
              description="Tap the heart on a dish you love — it will show up here."
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
    <div className="homepage wl-page">
      <HomeNav />
      <main className="cx-main">
        <header className="cx-head wl-head">
          <div>
            <p className="cx-kicker">Wishlist</p>
            <h1>Saved dishes</h1>
            <p>
              {entries.length} dish{entries.length === 1 ? '' : 'es'} you loved
            </p>
          </div>
          <button type="button" className="hp-btn hp-btn--ghost hp-btn--sm" onClick={clearWishlist}>
            Clear all
          </button>
        </header>

        <div className="wl-grid">
          {entries.map((entry) => (
            <article key={entry.key} className="wl-card">
              <Link to={`/dishes/${entry.dishId}`} className="wl-card-media">
                {entry.imageUrl ? (
                  <img src={entry.imageUrl} alt="" loading="lazy" />
                ) : (
                  <div className="wl-card-fallback" aria-hidden>
                    <i className="bi bi-egg-fried" />
                  </div>
                )}
                <span
                  className={`veg-dot ${entry.isVeg ? 'veg' : 'nonveg'}`}
                  aria-label={entry.isVeg ? 'Veg' : 'Non-veg'}
                />
              </Link>

              <div className="wl-card-body">
                <div className="wl-card-top">
                  <div>
                    <Link to={`/dishes/${entry.dishId}`} className="wl-card-title">
                      {entry.dishName}
                    </Link>
                    <Link to={`/kitchens/${entry.kitchenId}`} className="wl-card-kitchen">
                      {entry.kitchenName}
                    </Link>
                  </div>
                  <button
                    type="button"
                    className="wl-heart"
                    aria-label={`Remove ${entry.dishName} from wishlist`}
                    onClick={() => removeDish(entry)}
                  >
                    <i className="bi bi-heart-fill" aria-hidden />
                  </button>
                </div>

                {entry.description ? (
                  <p className="wl-card-desc">{entry.description}</p>
                ) : null}

                <div className="wl-card-foot">
                  <strong className="wl-card-price">{formatPrice(entry.unitPrice)}</strong>
                  <div className="wl-card-actions">
                    <Link to={`/dishes/${entry.dishId}`} className="hp-btn hp-btn--ghost hp-btn--sm">
                      View
                    </Link>
                    <button
                      type="button"
                      className="hp-btn hp-btn--primary hp-btn--sm"
                      onClick={() => addToCart(entry)}
                    >
                      Add to cart
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </main>
      <HomeFooter />
    </div>
  )
}
