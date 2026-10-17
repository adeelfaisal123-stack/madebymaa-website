import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { fetchKitchenDetail } from '../api/optica2'
import { EmptyState } from '../components/EmptyState'
import { HomeFooter } from '../components/HomeFooter'
import { HomeNav } from '../components/HomeNav'
import { Reveal } from '../hooks/useInView'
import { useCartStore } from '../stores'
import type { Dish, KitchenDetail } from '../types'
import { formatPrice } from '../utils'
import { confirmAction, toastSuccess, toastWarning } from '../lib/swal'
import './homepage.css'
import './kitchen-detail.css'

export function KitchenDetailPage() {
  const { id } = useParams()
  const kitchenId = Number(id)
  const [kitchen, setKitchen] = useState<KitchenDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [dietFilter, setDietFilter] = useState<'all' | 'veg' | 'nonveg'>('all')
  const [menuQuery, setMenuQuery] = useState('')
  const addLine = useCartStore((s) => s.addLine)
  const clearCart = useCartStore((s) => s.clear)
  const lines = useCartStore((s) => s.lines)
  const itemCount = useCartStore((s) => s.itemCount())
  const kitchenCartCount = useMemo(
    () =>
      Object.values(lines).reduce(
        (sum, line) => (line.kitchenId === kitchenId ? sum + line.quantity : sum),
        0,
      ),
    [lines, kitchenId],
  )

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError('')
      try {
        const detail = await fetchKitchenDetail(kitchenId)
        if (!cancelled) setKitchen(detail)
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Could not load kitchen')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [kitchenId])

  const heroSrc = kitchen?.coverUrl || kitchen?.logoUrl
  const heroIsLogo = !kitchen?.coverUrl && !!kitchen?.logoUrl

  const filteredDishes = useMemo(() => {
    if (!kitchen) return []
    const q = menuQuery.trim().toLowerCase()
    return kitchen.dishes.filter((dish) => {
      if (dietFilter === 'veg' && !dish.isVeg) return false
      if (dietFilter === 'nonveg' && dish.isVeg) return false
      if (!q) return true
      return (
        dish.name.toLowerCase().includes(q) ||
        (dish.description?.toLowerCase().includes(q) ?? false)
      )
    })
  }, [kitchen, dietFilter, menuQuery])

  const addDish = (dish: Dish) => {
    void (async () => {
      const payload = {
        dishId: dish.id,
        dishName: dish.name,
        kitchenId: kitchen?.id ?? dish.restaurantId,
        kitchenName: kitchen?.name ?? dish.restaurantName,
        quantity: 1,
        unitPrice: dish.effectivePrice,
        isVeg: dish.isVeg,
        imageUrl: dish.imageUrl,
      }
      const ok = addLine(payload)
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
        addLine(payload)
        toastSuccess(`${dish.name} added to cart`)
        return
      }
      toastSuccess(`${dish.name} added to cart`)
    })()
  }

  if (loading) {
    return (
      <div className="homepage kd-page">
        <HomeNav active="kitchens" />
        <div className="kd-loading" role="status">
          <div className="kd-loading-orb" aria-hidden />
          <p>Opening kitchen…</p>
        </div>
      </div>
    )
  }

  if (error || !kitchen) {
    return (
      <div className="homepage kd-page">
        <HomeNav active="kitchens" />
        <div className="kd-empty-wrap">
          <EmptyState
            image="/images/empty_nearby_kitchens.png"
            title="Kitchen unavailable"
            description={error || 'This kitchen could not be loaded.'}
          />
          <Link to="/kitchens" className="hp-btn hp-btn--primary">
            Browse kitchens
          </Link>
        </div>
        <HomeFooter />
      </div>
    )
  }

  const ratingLabel = kitchen.rating.hasReviews
    ? kitchen.rating.average.toFixed(1)
    : 'New'
  const metaBits = [
    kitchen.chefName ? `Chef ${kitchen.chefName}` : null,
    kitchen.cuisine,
    kitchen.deliveryLabel,
  ].filter(Boolean)

  return (
    <div className="homepage kd-page">
      <HomeNav active="kitchens" />

      <section className="kd-hero" aria-label={kitchen.name}>
        <div className={`kd-hero-media${heroIsLogo ? ' kd-hero-media--logo' : ''}`}>
          {heroSrc ? (
            <img src={heroSrc} alt="" className="kd-hero-img" />
          ) : (
            <div className="kd-hero-fallback" aria-hidden>
              <i className="bi bi-house-heart-fill" />
            </div>
          )}
          <div className="kd-hero-veil" aria-hidden />
          <div className="kd-hero-grain" aria-hidden />
        </div>

        <div className="container-fluid kd-hero-inner">
          <Link to="/kitchens" className="kd-back">
            <i className="bi bi-arrow-left" aria-hidden />
            All kitchens
          </Link>

          <div className="kd-hero-copy">
            <p className="kd-brand-mark">Made by Maa</p>
            <h1 className="kd-hero-title">{kitchen.name}</h1>
            <p className="kd-hero-lead">
              {metaBits.length > 0
                ? metaBits.join(' · ')
                : 'Homestyle cooking from a kitchen near you.'}
            </p>

            <div className="kd-hero-actions">
              <a href="#menu" className="hp-btn hp-btn--primary kd-cta">
                <i className="bi bi-journal-richtext" aria-hidden />
                View menu
              </a>
              <Link to="/cart" className="hp-btn hp-btn--glass">
                <i className="bi bi-bag-heart-fill" aria-hidden />
                {kitchenCartCount > 0 ? `Cart · ${kitchenCartCount}` : 'Cart'}
              </Link>
            </div>
          </div>

          <div className="kd-hero-aside" aria-label="Kitchen status">
            {kitchen.logoUrl && !heroIsLogo && (
              <img src={kitchen.logoUrl} alt="" className="kd-hero-logo" />
            )}
            <div className="kd-status-row">
              <span className={`kd-pill ${kitchen.isOpen ? 'is-open' : 'is-closed'}`}>
                <span className="kd-pill-dot" aria-hidden />
                {kitchen.isOpen ? 'Open now' : 'Closed'}
              </span>
              {kitchen.isVerified && (
                <span className="kd-pill kd-pill--verified">
                  <i className="bi bi-patch-check-fill" aria-hidden />
                  Verified
                </span>
              )}
            </div>
            <div className="kd-metric">
              <strong>{ratingLabel}</strong>
              <span>
                {kitchen.rating.hasReviews
                  ? `${kitchen.rating.count} reviews`
                  : 'Awaiting first reviews'}
              </span>
            </div>
          </div>
        </div>

        <div className="kd-hero-wave" aria-hidden>
          <svg viewBox="0 0 1440 80" preserveAspectRatio="none">
            <path
              d="M0,40 C240,80 480,0 720,40 C960,80 1200,0 1440,40 L1440,80 L0,80 Z"
              fill="currentColor"
            />
          </svg>
        </div>
      </section>

      <section className="kd-menu" id="menu">
        <div className="container-fluid kd-menu-inner">
          <Reveal>
            <div className="kd-menu-head">
              <div>
                <p className="kd-eyebrow">Today’s kitchen</p>
                <h2>Menu</h2>
                <p className="kd-menu-sub">
                  {kitchen.dishes.length}{' '}
                  {kitchen.dishes.length === 1 ? 'dish' : 'dishes'} prepared with care
                </p>
              </div>
              <div className="kd-menu-tools">
                <label className="kd-search">
                  <i className="bi bi-search" aria-hidden />
                  <input
                    type="search"
                    value={menuQuery}
                    onChange={(e) => setMenuQuery(e.target.value)}
                    placeholder="Search dishes"
                    aria-label="Search dishes"
                  />
                </label>
                <div className="kd-diet" role="group" aria-label="Diet filter">
                  {(
                    [
                      ['all', 'All'],
                      ['veg', 'Veg'],
                      ['nonveg', 'Non-veg'],
                    ] as const
                  ).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      className={dietFilter === value ? 'is-active' : ''}
                      onClick={() => setDietFilter(value)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>

          {kitchen.description && (
            <Reveal delay={80}>
              <p className="kd-description">{kitchen.description}</p>
            </Reveal>
          )}

          {filteredDishes.length === 0 ? (
            <EmptyState
              image="/images/empty_dishes.png"
              title={kitchen.dishes.length === 0 ? 'No dishes yet' : 'No matching dishes'}
              description={
                kitchen.dishes.length === 0
                  ? "This kitchen hasn't listed dishes yet."
                  : 'Try another filter or clear your search.'
              }
            />
          ) : (
            <div className="kd-dish-grid">
              {filteredDishes.map((dish, index) => {
                return (
                  <Reveal key={dish.id} delay={Math.min(index * 45, 270)}>
                    <article className="kd-dish">
                      <Link to={`/dishes/${dish.id}`} className="kd-dish-media">
                        {dish.imageUrl ? (
                          <img src={dish.imageUrl} alt="" loading="lazy" />
                        ) : (
                          <div className="kd-dish-fallback" aria-hidden>
                            <i className="bi bi-egg-fried" />
                          </div>
                        )}
                        <span className={`kd-veg ${dish.isVeg ? 'is-veg' : 'is-nonveg'}`} />
                      </Link>
                      <div className="kd-dish-body">
                        <div className="kd-dish-top">
                          <h3>
                            <Link to={`/dishes/${dish.id}`}>{dish.name}</Link>
                          </h3>
                          <p className="kd-dish-price">{formatPrice(dish.effectivePrice)}</p>
                        </div>
                        <p className="kd-dish-desc">{dish.description?.trim() || '\u00a0'}</p>
                        <div className="kd-dish-actions">
                          <Link to={`/dishes/${dish.id}`} className="kd-dish-link">
                            Details
                          </Link>
                          <button
                            type="button"
                            className="kd-add"
                            onClick={() => addDish(dish)}
                          >
                            <i className="bi bi-bag-plus-fill" aria-hidden />
                            Add
                          </button>
                        </div>
                      </div>
                    </article>
                  </Reveal>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {kitchenCartCount > 0 && (
        <div className="kd-cart-bar">
          <div className="kd-cart-bar-inner">
            <div>
              <strong>{kitchenCartCount} in cart</strong>
              <span>from {kitchen.name}</span>
            </div>
            <Link to="/cart" className="hp-btn hp-btn--primary hp-btn--sm">
              View cart
              {itemCount > kitchenCartCount ? ` · ${itemCount} total` : ''}
            </Link>
          </div>
        </div>
      )}

      <HomeFooter />
    </div>
  )
}
