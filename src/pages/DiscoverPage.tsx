import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  fetchBrowseDishes,
  fetchCuisines,
  fetchDishCategories,
  fetchFeaturedKitchens,
  fetchHomeSliders,
} from '../api/optica2'
import { DishCard, KitchenCard } from '../components/cards'
import { EmptyState } from '../components/EmptyState'
import { useLocationStore } from '../stores'
import type { Cuisine, DishCategory, HomeSlider, Kitchen } from '../types'
import { detectUserLocation, displayLocationLabel } from '../utils'

export function DiscoverPage() {
  const { label, setLocation } = useLocationStore()
  const [hero, setHero] = useState<HomeSlider[]>([])
  const [mid, setMid] = useState<HomeSlider[]>([])
  const [categories, setCategories] = useState<DishCategory[]>([])
  const [cuisines, setCuisines] = useState<Cuisine[]>([])
  const [kitchens, setKitchens] = useState<Kitchen[]>([])
  const [recentDishes, setRecentDishes] = useState<Awaited<ReturnType<typeof fetchBrowseDishes>>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [sliders, cats, cuis, featured, dishes] = await Promise.all([
          fetchHomeSliders(),
          fetchDishCategories(),
          fetchCuisines(),
          fetchFeaturedKitchens(),
          fetchBrowseDishes(),
        ])
        if (cancelled) return
        setHero(sliders.hero)
        setMid(sliders.mid)
        setCategories(cats)
        setCuisines(cuis)
        setKitchens(featured)
        setRecentDishes(dishes.slice(0, 6))
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const detectLocation = () =>
    detectUserLocation(setLocation, {
      label: 'Location unavailable',
      lat: 25.4184,
      lng: 55.5019,
    })

  if (loading) {
    return <div className="loading-center page">Loading…</div>
  }

  return (
    <div className="page">
      <div className="discover-hero">
        <div className="discover-hero-top">
          <button type="button" className="location-chip" onClick={detectLocation}>
            📍 <span>{displayLocationLabel(label)}</span>
          </button>
        </div>
        <h1>Homemade food, delivered with love</h1>
        <input className="search-field" placeholder="Search kitchens or dishes" readOnly onFocus={() => {}} />
      </div>

      <div className="page-content">
        {hero.length > 0 && (
          <>
            <div className="slider-row">
              {hero.map((slide) => (
                <div key={slide.id} className="slider-item">
                  <img src={slide.imageUrl} alt={slide.title ?? ''} />
                </div>
              ))}
            </div>
          </>
        )}

        {categories.length > 0 && (
          <>
            <div className="section-header">
              <h2>What are you craving?</h2>
              <Link to="/dishes" className="view-all-link">
                View all →
              </Link>
            </div>
            <div className="chip-row">
              {categories.map((cat) => (
                <Link key={cat.id} to={`/dishes?category=${cat.id}`} className="category-pill">
                  {cat.imageUrl ? (
                    <img src={cat.imageUrl} alt="" />
                  ) : (
                    <div className="pill-placeholder" />
                  )}
                  <span>{cat.name}</span>
                </Link>
              ))}
            </div>
          </>
        )}

        {recentDishes.length > 0 && (
          <>
            <div className="section-header">
              <h2>Popular dishes</h2>
              <Link to="/dishes" className="view-all-link">
                View all →
              </Link>
            </div>
            <div className="grid-2">
              {recentDishes.map((dish) => (
                <DishCard key={dish.id} dish={dish} />
              ))}
            </div>
          </>
        )}

        {cuisines.length > 0 && (
          <>
            <div className="section-header">
              <h2>Cuisines</h2>
            </div>
            <div className="chip-row">
              {cuisines.map((c) => (
                <Link key={c.id} to={`/dishes?cuisine=${c.id}`} className="chip hp-cuisine-chip">
                  {c.imageUrl ? (
                    <img src={c.imageUrl} alt="" className="hp-cuisine-chip-img" />
                  ) : null}
                  {c.name}
                </Link>
              ))}
            </div>
          </>
        )}

        {mid.length > 0 && (
          <div className="slider-row">
            {mid.map((slide) => (
              <div key={slide.id} className="slider-item">
                <img src={slide.imageUrl} alt={slide.title ?? ''} />
              </div>
            ))}
          </div>
        )}

        <div className="section-header">
          <h2>Featured kitchens</h2>
          <Link to="/kitchens" className="view-all-link">
            View all →
          </Link>
        </div>

        {kitchens.length === 0 ? (
          <EmptyState
            image="/images/empty_nearby_kitchens.png"
            title="No kitchens yet"
            description="Check back soon for homemade kitchens near you."
          />
        ) : (
          kitchens.map((kitchen) => <KitchenCard key={kitchen.id} kitchen={kitchen} />)
        )}
      </div>
    </div>
  )
}
