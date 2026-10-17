import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  fetchBrowseDishes,
  fetchBrowseKitchens,
  fetchCuisines,
  fetchDishCategories,
  fetchFeaturedKitchens,
  fetchOrders,
} from '../api/optica2'
import { Reveal } from '../hooks/useInView'
import { SectionBanner } from '../components/SectionBanner'
import { CuisineCarousel } from '../components/CuisineCarousel'
import { HeroSearch } from '../components/HeroSearch'
import { KitchenCarousel } from '../components/KitchenCarousel'
import { HomeFooter } from '../components/HomeFooter'
import { HomeNav } from '../components/HomeNav'
import { Preloader } from '../components/Preloader'
import {
  ORDER_STATUS_FLOW,
  formatOrderDate,
  isActiveOrder,
  orderItemCount,
  orderStatusIconClass,
  orderStatusLabel,
  orderTrackingMessage,
  orderTrackingTitle,
} from '../lib/orderDisplay'
import {
  useLocationStore,
  useRecentlyViewedStore,
  useSessionHydrated,
  useSessionStore,
} from '../stores'
import type { Cuisine, Dish, DishCategory, Kitchen, Order } from '../types'
import { formatPrice } from '../utils'
import './homepage.css'

const TRUST = [
  { icon: 'bi-shield-check', label: 'Verified home chefs' },
  { icon: 'bi-house-heart', label: 'Cooked to order' },
  { icon: 'bi-geo-alt', label: 'Neighbourhood delivery' },
  { icon: 'bi-heart', label: 'Made with care' },
]

const STEPS = [
  {
    num: '01',
    title: 'Discover',
    text: 'Browse nearby home kitchens and dishes prepared by real home chefs.',
    image: '/images/cartoons/cartoon-step-discover.png',
  },
  {
    num: '02',
    title: 'Order',
    text: 'Choose your favourites, pick a delivery time, and pay securely.',
    image: '/images/cartoons/cartoon-step-order.png',
  },
  {
    num: '03',
    title: 'Enjoy',
    text: 'Receive warm, homemade food at your door — fresh from a local kitchen.',
    image: '/images/cartoons/cartoon-step-enjoy.png',
  },
]

const SECTION_ART = {
  categories: '/images/cartoons/cartoon-categories.png',
  kitchens: '/images/cartoons/cartoon-kitchens.png',
  dishes: '/images/cartoons/cartoon-dishes.png',
  cuisines: '/images/cartoons/cartoon-cuisines.png',
  cta: '/images/cartoons/cartoon-cta.png',
} as const

export function HomePage() {
  const navigate = useNavigate()
  const { lat, lng } = useLocationStore()
  const session = useSessionStore((s) => s.session)
  const sessionHydrated = useSessionHydrated()
  const [search, setSearch] = useState('')
  const [categories, setCategories] = useState<DishCategory[]>([])
  const [cuisines, setCuisines] = useState<Cuisine[]>([])
  const [kitchens, setKitchens] = useState<Kitchen[]>([])
  const [searchKitchens, setSearchKitchens] = useState<Kitchen[]>([])
  const [searchDishes, setSearchDishes] = useState<Dish[]>([])
  const recentlyViewed = useRecentlyViewedStore((s) => s.entries)
  const [loading, setLoading] = useState(true)
  const [activeOrder, setActiveOrder] = useState<Order | null>(null)

  useEffect(() => {
    let cancelled = false
    const timeout = window.setTimeout(() => {
      if (!cancelled) setLoading(false)
    }, 12000)

    ;(async () => {
      try {
        const [featured, browse, cats, cuis, allDishes] = await Promise.all([
          fetchFeaturedKitchens(),
          fetchBrowseKitchens(lat ?? undefined, lng ?? undefined),
          fetchDishCategories(),
          fetchCuisines(),
          fetchBrowseDishes(),
        ])
        if (cancelled) return
        const seen = new Set<number>()
        const merged: Kitchen[] = []
        for (const kitchen of [...featured, ...browse]) {
          if (seen.has(kitchen.id)) continue
          seen.add(kitchen.id)
          merged.push(kitchen)
        }
        setCategories(cats)
        setCuisines(cuis)
        setSearchKitchens(merged)
        setKitchens(merged.slice(0, 16))
        setSearchDishes(allDishes)
      } catch {
        // Still show homepage even if some API calls fail.
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
      window.clearTimeout(timeout)
    }
  }, [lat, lng])

  useEffect(() => {
    if (!sessionHydrated) return
    if (!session) {
      setActiveOrder(null)
      return
    }
    if (loading) return

    let cancelled = false

    ;(async () => {
      try {
        const orders = await fetchOrders(session)
        if (cancelled) return
        setActiveOrder(orders.find((order) => isActiveOrder(order.status)) ?? null)
      } catch (err) {
        console.warn('[Made by Maa] active order fetch skipped', err)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [session, sessionHydrated, loading])

  const handleSearch = (query: string) => {
    const q = query.trim()
    navigate(q ? `/dishes?search=${encodeURIComponent(q)}` : '/dishes')
  }

  return (
    <>
      <Preloader show={loading} />
      {!loading && (
        <div className="homepage">
          <HomeNav />

          <section className="hp-hero">
            <div className="hp-hero-atmosphere" aria-hidden>
              <div className="hp-hero-wash" />
              <div className="hp-hero-glow hp-hero-glow--a" />
              <div className="hp-hero-glow hp-hero-glow--b" />
            </div>

            <div className="container position-relative">
              <div className="row align-items-center g-5">
                <div className="col-lg-6 hp-hero-content">
                  <p className="hp-brand">Made by Maa</p>
                  <h1>
                    Homemade food,
                    <em> delivered with care</em>
                  </h1>
                  <p className="hp-hero-lead">
                    Discover verified home chefs in your neighbourhood — fresh meals cooked to
                    order, not mass-produced.
                  </p>

                  <HeroSearch
                    kitchens={searchKitchens}
                    cuisines={cuisines}
                    dishes={searchDishes}
                    value={search}
                    onChange={setSearch}
                    onSubmit={handleSearch}
                  />

                  <div className="hp-hero-actions">
                    <Link to="/kitchens" className="hp-btn hp-btn--primary">
                      Explore kitchens
                    </Link>
                    <Link to="/how-it-works" className="hp-btn hp-btn--ghost">
                      How it works
                    </Link>
                  </div>
                </div>

                <div className="col-lg-6 hp-hero-visual">
                  <div className="hp-hero-portrait">
                    <span className="hp-hero-portrait-ring" aria-hidden />
                    <span className="hp-hero-portrait-halo" aria-hidden />
                    <div className="hp-hero-portrait-frame">
                      <img
                        src="/images/cartoons/cartoon-hero.png?v=2"
                        alt="Homemade food from Made by Maa"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <div className="hp-trust">
            <div className="container">
              <ul className="hp-trust-list">
                {TRUST.map((item) => (
                  <li key={item.label}>
                    <i className={`bi ${item.icon}`} aria-hidden />
                    <span>{item.label}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {categories.length > 0 && (
            <section className="hp-section" id="categories">
              <div className="container">
                <SectionBanner
                  eyebrow="Cravings"
                  title="What are you in the mood for?"
                  description="From everyday comfort to festive favourites — categories for every craving."
                  image={SECTION_ART.categories}
                />
                <div className="row g-4">
                  {categories.slice(0, 8).map((cat, i) => (
                    <div key={cat.id} className="col-6 col-md-4 col-lg-3">
                      <Reveal delay={i * 80}>
                        <Link to={`/dishes?category=${cat.id}`} className="hp-cat-card">
                          {cat.imageUrl ? (
                            <img src={cat.imageUrl} alt={cat.name} />
                          ) : (
                            <div className="cat-placeholder" />
                          )}
                          <span>{cat.name}</span>
                        </Link>
                      </Reveal>
                    </div>
                  ))}
                </div>
                <Reveal className="text-center mt-5">
                  <Link to="/dishes" className="hp-btn hp-btn--ghost">
                    View all dishes
                    <i className="bi bi-arrow-right hp-btn-arrow" />
                  </Link>
                </Reveal>
              </div>
            </section>
          )}

          <section className="hp-section hp-section-alt" id="kitchens">
            <div className="container">
              <SectionBanner
                eyebrow="Kitchens"
                title="Featured home kitchens"
                description="Meet talented home chefs bringing authentic flavours to your neighbourhood."
                image={SECTION_ART.kitchens}
                reverse
              />
              <KitchenCarousel kitchens={kitchens} />
              <Reveal className="text-center mt-5">
                <Link to="/kitchens" className="hp-btn hp-btn--primary">
                  Browse all kitchens
                  <i className="bi bi-arrow-right hp-btn-arrow" />
                </Link>
              </Reveal>
            </div>
          </section>

          {recentlyViewed.length > 0 && (
            <section className="hp-section" id="dishes">
              <div className="container">
                <SectionBanner
                  eyebrow="Continue"
                  title="Recently viewed"
                  description="Pick up where you left off — dishes you’ve looked at lately."
                  image={SECTION_ART.dishes}
                />
                <div className="row g-4">
                  {recentlyViewed.map((dish, i) => (
                    <div key={dish.key} className="col-6 col-md-4 col-lg-3">
                      <Reveal delay={i * 60}>
                        <Link to={`/dishes/${dish.dishId}`} className="hp-dish-card">
                          <div className="img-wrap">
                            {dish.imageUrl ? (
                              <img src={dish.imageUrl} alt="" loading="lazy" />
                            ) : null}
                          </div>
                          <div className="body">
                            <h3>{dish.dishName}</h3>
                            <p className="hp-dish-kitchen">{dish.kitchenName}</p>
                            <span className="price">{formatPrice(dish.unitPrice)}</span>
                          </div>
                        </Link>
                      </Reveal>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {cuisines.length > 0 && (
            <section className="hp-section hp-section-alt" id="cuisines">
              <div className="container">
                <SectionBanner
                  eyebrow="Flavours"
                  title="Explore cuisines"
                  description="Regional tastes from across the map — discover something new nearby."
                  image={SECTION_ART.cuisines}
                  reverse
                />
                <Reveal className="mt-2">
                  <CuisineCarousel cuisines={cuisines} linkTo="dishes" />
                </Reveal>
              </div>
            </section>
          )}

          <section className="hp-section hp-how" id="how-it-works">
            <div className="container">
              <Reveal className="hp-section-header">
                <span className="eyebrow">How it works</span>
                <h2>Homemade in three simple steps</h2>
                <p>From discovering a kitchen nearby to enjoying a warm meal at home.</p>
              </Reveal>
              <div className="hp-steps">
                {STEPS.map((step, i) => (
                  <Reveal key={step.num} delay={i * 100}>
                    <article className="hp-step">
                      <div className="hp-step-portrait">
                        <img src={step.image} alt="" loading="lazy" />
                      </div>
                      <span className="hp-step-num">{step.num}</span>
                      <h3>{step.title}</h3>
                      <p>{step.text}</p>
                    </article>
                  </Reveal>
                ))}
              </div>
              <Reveal className="text-center mt-5">
                <Link to="/how-it-works" className="hp-inline-link">
                  Learn more
                  <i className="bi bi-arrow-right" aria-hidden />
                </Link>
              </Reveal>
            </div>
          </section>

          <Reveal>
            <section className="hp-cta">
              <div className="hp-cta-inner">
                <div className="hp-cta-copy">
                  <p className="hp-cta-kicker">Ready when you are</p>
                  <h2>Taste homemade, without leaving home</h2>
                  <p>
                    Browse kitchens nearby, support local home chefs, and enjoy meals made with
                    real care.
                  </p>
                  <div className="hp-cta-actions">
                    <Link to="/kitchens" className="hp-btn hp-btn--light">
                      Start ordering
                      <i className="bi bi-arrow-right hp-btn-arrow" />
                    </Link>
                    <Link to="/seller/signup" className="hp-btn hp-btn--ghost hp-cta-ghost">
                      Sign up as seller
                    </Link>
                  </div>
                </div>
                <div className="hp-cta-portrait" aria-hidden>
                  <div className="hp-cta-portrait-frame">
                    <img src={SECTION_ART.cta} alt="" loading="lazy" />
                  </div>
                </div>
              </div>
            </section>
          </Reveal>

          <HomeFooter />

          {activeOrder && (
            <div className="hp-live-dock" role="status" aria-live="polite">
              <Link to={`/orders/${activeOrder.id}`} className="hp-live-card">
                <span className="hp-live-card-glow" aria-hidden />

                <ol className="hp-live-timeline" aria-label="Order progress">
                  {ORDER_STATUS_FLOW.map((step, index) => {
                    const normalized =
                      activeOrder.status === 'placed' ? 'pending' : activeOrder.status
                    const flowIndex = ORDER_STATUS_FLOW.indexOf(
                      normalized as (typeof ORDER_STATUS_FLOW)[number],
                    )
                    const isDelivered = normalized === 'delivered'
                    const done = isDelivered || (flowIndex >= 0 && index < flowIndex)
                    const current = !isDelivered && flowIndex === index
                    const shortLabel =
                      step === 'ready_to_pick_up'
                        ? 'Ready'
                        : step === 'picked_up'
                          ? 'Picked'
                          : step === 'on_way'
                            ? 'On way'
                            : step === 'delivered'
                              ? 'Done'
                              : 'Pending'
                    return (
                      <li
                        key={step}
                        className={`hp-live-timeline-step${done ? ' is-done' : ''}${
                          current ? ' is-current' : ''
                        }`}
                      >
                        <span className="hp-live-timeline-dot" aria-hidden>
                          {done ? <i className="bi bi-check" /> : index + 1}
                        </span>
                        <span className="hp-live-timeline-label">{shortLabel}</span>
                      </li>
                    )
                  })}
                </ol>

                <div className="hp-live-card-top">
                  <span className="hp-live-card-icon" aria-hidden>
                    <i className={`bi ${orderStatusIconClass(activeOrder.status)}`} />
                  </span>
                  <div className="hp-live-card-head">
                    <p className="hp-live-card-kicker">Live order</p>
                    <strong>{orderTrackingTitle(activeOrder.status)}</strong>
                  </div>
                  <span className="hp-live-card-badge">{orderStatusLabel(activeOrder.status)}</span>
                </div>
                <p className="hp-live-card-msg">{orderTrackingMessage(activeOrder.status)}</p>
                <div className="hp-live-card-meta">
                  <span>
                    {activeOrder.kitchenName ||
                      activeOrder.orderNumber ||
                      `Order #${activeOrder.id}`}
                  </span>
                  <span>
                    {orderItemCount(activeOrder.items)} item
                    {orderItemCount(activeOrder.items) === 1 ? '' : 's'}
                  </span>
                  <span>{formatPrice(activeOrder.totalAmount)}</span>
                </div>
                {activeOrder.items.length > 0 && (
                  <p className="hp-live-card-items">
                    {activeOrder.items
                      .slice(0, 2)
                      .map((i) => `${i.quantity}× ${i.name}`)
                      .join(' · ')}
                    {activeOrder.items.length > 2 ? '…' : ''}
                  </p>
                )}
                <div className="hp-live-card-foot">
                  <span className="hp-live-card-cta">
                    Track order
                    <i className="bi bi-arrow-right" aria-hidden />
                  </span>
                  {activeOrder.createdAt && (
                    <span className="hp-live-card-time">{formatOrderDate(activeOrder.createdAt)}</span>
                  )}
                </div>
              </Link>
            </div>
          )}
        </div>
      )}
    </>
  )
}
