import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { fetchBrowseDishes } from '../api/optica2'
import { EmptyState } from '../components/EmptyState'
import { HomeFooter } from '../components/HomeFooter'
import { HomeNav } from '../components/HomeNav'
import { Reveal } from '../hooks/useInView'
import { useCartStore, useRecentlyViewedStore, useWishlistStore } from '../stores'
import type { Dish } from '../types'
import { formatPrice } from '../utils'
import { confirmAction, toastSuccess, toastWarning } from '../lib/swal'
import './homepage.css'
import './dish-detail.css'

export function DishDetailPage() {
  const { id } = useParams()
  const dishId = Number(id)
  const navigate = useNavigate()
  const [dish, setDish] = useState<Dish | null>(null)
  const [catalog, setCatalog] = useState<Dish[]>([])
  const [loading, setLoading] = useState(true)
  const [pickQty, setPickQty] = useState(1)
  const addLine = useCartStore((s) => s.addLine)
  const clearCart = useCartStore((s) => s.clear)
  const lines = useCartStore((s) => s.lines)
  const itemCount = useCartStore((s) => s.itemCount())
  const isSaved = useWishlistStore((s) =>
    dish ? s.isSaved(dish.restaurantId, dish.id) : false,
  )
  const toggleWishlist = useWishlistStore((s) => s.toggle)
  const recordView = useRecentlyViewedStore((s) => s.recordView)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setPickQty(1)
      try {
        const dishes = await fetchBrowseDishes()
        if (cancelled) return
        setCatalog(dishes)
        setDish(dishes.find((d) => d.id === dishId) ?? null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [dishId])

  useEffect(() => {
    if (dish) recordView(dish)
  }, [dish, recordView])

  const related = useMemo(() => {
    if (!dish) return []
    const sameKitchen = catalog.filter(
      (d) => d.id !== dish.id && d.restaurantId === dish.restaurantId,
    )
    if (sameKitchen.length >= 4) return sameKitchen.slice(0, 8)

    const cuisine = dish.restaurantCuisine?.toLowerCase()
    const sameCuisine = catalog.filter(
      (d) =>
        d.id !== dish.id &&
        d.restaurantId !== dish.restaurantId &&
        cuisine &&
        d.restaurantCuisine?.toLowerCase() === cuisine,
    )
    const merged = [...sameKitchen]
    for (const d of sameCuisine) {
      if (merged.length >= 8) break
      if (!merged.some((x) => x.id === d.id)) merged.push(d)
    }
    if (merged.length >= 4) return merged.slice(0, 8)

    for (const d of catalog) {
      if (merged.length >= 8) break
      if (d.id === dish.id) continue
      if (!merged.some((x) => x.id === d.id)) merged.push(d)
    }
    return merged.slice(0, 8)
  }, [catalog, dish])

  if (loading) {
    return (
      <div className="homepage dd-page">
        <HomeNav />
        <div className="dd-loading" role="status">
          <div className="dd-loading-orb" aria-hidden />
          <p>Plating your dish…</p>
        </div>
      </div>
    )
  }

  if (!dish) {
    return (
      <div className="homepage dd-page">
        <HomeNav />
        <div className="dd-empty-wrap">
          <EmptyState
            image="/images/empty_dishes.png"
            title="Dish not found"
            description="This dish may have been removed or is no longer available."
          />
          <button type="button" className="hp-btn hp-btn--primary" onClick={() => navigate(-1)}>
            Go back
          </button>
        </div>
        <HomeFooter />
      </div>
    )
  }

  const key = `${dish.restaurantId}:${dish.id}`
  const cartQty = lines[key]?.quantity ?? 0
  const hasDiscount = dish.price > dish.effectivePrice

  const addToCart = () => {
    if (!dish) return
    void (async () => {
      const payload = {
        dishId: dish.id,
        dishName: dish.name,
        kitchenId: dish.restaurantId,
        kitchenName: dish.restaurantName,
        quantity: 1,
        unitPrice: dish.effectivePrice,
        isVeg: dish.isVeg,
        imageUrl: dish.imageUrl,
      }
      const ok = addLine(payload, pickQty)
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
        addLine(payload, pickQty)
        toastSuccess(`Added ${pickQty} to cart`)
        setPickQty(1)
        return
      }
      toastSuccess(`Added ${pickQty} to cart`)
      setPickQty(1)
    })()
  }

  const onWishlist = () => {
    if (!dish) return
    const saved = toggleWishlist(dish)
    toastSuccess(saved ? 'Saved to wishlist' : 'Removed from wishlist')
  }

  return (
    <div className="homepage dd-page">
      <HomeNav />

      <div className="container-fluid dd-shell">
        <button type="button" className="dd-back" onClick={() => navigate(-1)}>
          <i className="bi bi-arrow-left" aria-hidden />
          Back
        </button>

        <section className="dd-main" aria-label={dish.name}>
          <div className="dd-gallery">
            <div className="dd-gallery-stage">
              {dish.imageUrl ? (
                <img src={dish.imageUrl} alt={dish.name} className="dd-gallery-img" />
              ) : (
                <div className="dd-gallery-fallback" aria-hidden>
                  <i className="bi bi-egg-fried" />
                </div>
              )}
              <span className={`dd-veg ${dish.isVeg ? 'is-veg' : 'is-nonveg'}`} title={dish.isVeg ? 'Veg' : 'Non-veg'} />
              <div className="dd-gallery-glow" aria-hidden />
            </div>
            {dish.restaurantLogoUrl && (
              <Link to={`/kitchens/${dish.restaurantId}`} className="dd-kitchen-chip">
                <img src={dish.restaurantLogoUrl} alt="" />
                <span>
                  <strong>{dish.restaurantName}</strong>
                  <small>{dish.restaurantCuisine || 'Homestyle kitchen'}</small>
                </span>
              </Link>
            )}
          </div>

          <div className="dd-info">
            <p className="dd-brand">Made by Maa</p>
            <div className="dd-title-row">
              <h1>{dish.name}</h1>
              <button
                type="button"
                className={`dd-wish ${isSaved ? 'is-saved' : ''}`}
                onClick={onWishlist}
                aria-pressed={isSaved}
                aria-label={isSaved ? 'Remove from wishlist' : 'Add to wishlist'}
              >
                <i className={`bi ${isSaved ? 'bi-heart-fill' : 'bi-heart'}`} aria-hidden />
              </button>
            </div>

            <Link to={`/kitchens/${dish.restaurantId}`} className="dd-kitchen-link">
              {dish.restaurantName}
              {dish.chefName ? ` · Chef ${dish.chefName}` : ''}
              <i className="bi bi-arrow-up-right" aria-hidden />
            </Link>

            <p className="dd-desc">{dish.description || 'Homemade with care by a mom chef near you.'}</p>

            {dish.tags.length > 0 && (
              <div className="dd-tags">
                {dish.tags.slice(0, 6).map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
            )}

            <div className="dd-price-row">
              <strong>{formatPrice(dish.effectivePrice)}</strong>
              {hasDiscount && <span className="dd-strike">{formatPrice(dish.price)}</span>}
              <span className={`dd-diet ${dish.isVeg ? 'is-veg' : 'is-nonveg'}`}>
                {dish.isVeg ? 'Vegetarian' : 'Non-vegetarian'}
              </span>
            </div>

            <div className="dd-actions">
              <div className="dd-qty" aria-label="Quantity">
                <button
                  type="button"
                  onClick={() => setPickQty((q) => Math.max(1, q - 1))}
                  aria-label="Decrease quantity"
                >
                  −
                </button>
                <span>{pickQty}</span>
                <button
                  type="button"
                  onClick={() => setPickQty((q) => Math.min(99, q + 1))}
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>

              <button type="button" className="dd-add-cart" onClick={addToCart}>
                <i className="bi bi-bag-plus-fill" aria-hidden />
                Add to cart
                {cartQty > 0 ? ` · ${cartQty} in bag` : ''}
              </button>

              <button
                type="button"
                className={`dd-wish-wide ${isSaved ? 'is-saved' : ''}`}
                onClick={onWishlist}
              >
                <i className={`bi ${isSaved ? 'bi-heart-fill' : 'bi-heart'}`} aria-hidden />
                {isSaved ? 'Wishlisted' : 'Wishlist'}
              </button>
            </div>

            <div className="dd-assurance">
              <div>
                <i className="bi bi-shield-check" aria-hidden />
                Verified kitchens
              </div>
              <div>
                <i className="bi bi-lightning-charge-fill" aria-hidden />
                Freshly prepared
              </div>
              <div>
                <i className="bi bi-heart" aria-hidden />
                Made with care
              </div>
            </div>
          </div>
        </section>

        {related.length > 0 && (
          <section className="dd-related" aria-labelledby="dd-related-title">
            <Reveal>
              <div className="dd-related-head">
                <div>
                  <p className="dd-eyebrow">You may also like</p>
                  <h2 id="dd-related-title">Related dishes</h2>
                </div>
                <Link to={`/kitchens/${dish.restaurantId}`} className="dd-related-all">
                  More from this kitchen
                  <i className="bi bi-arrow-right" aria-hidden />
                </Link>
              </div>
            </Reveal>

            <div className="dd-related-grid">
              {related.map((item, index) => (
                <Reveal key={item.id} delay={Math.min(index * 50, 300)}>
                  <Link to={`/dishes/${item.id}`} className="dd-related-card">
                    <div className="dd-related-media">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt="" loading="lazy" />
                      ) : (
                        <div className="dd-related-fallback" aria-hidden>
                          <i className="bi bi-egg-fried" />
                        </div>
                      )}
                      <span className={`dd-veg ${item.isVeg ? 'is-veg' : 'is-nonveg'}`} />
                    </div>
                    <div className="dd-related-body">
                      <h3>{item.name}</h3>
                      <p>{item.restaurantName}</p>
                      <strong>{formatPrice(item.effectivePrice)}</strong>
                    </div>
                  </Link>
                </Reveal>
              ))}
            </div>
          </section>
        )}
      </div>

      {itemCount > 0 && (
        <div className="dd-cart-bar">
          <div className="dd-cart-bar-inner">
            <div>
              <strong>{itemCount} in cart</strong>
              <span>Ready when you are</span>
            </div>
            <Link to="/cart" className="hp-btn hp-btn--primary hp-btn--sm">
              View cart
            </Link>
          </div>
        </div>
      )}

      <HomeFooter />
    </div>
  )
}
