import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { fetchBrowseDishes } from '../api/optica2'
import { DishCard } from '../components/cards'
import { EmptyState } from '../components/EmptyState'
import { HeroLight } from '../components/shared'
import type { Dish } from '../types'

export function DishesPage() {
  const [params] = useSearchParams()
  const categoryId = params.get('category')
  const cuisineId = params.get('cuisine')
  const searchParam = params.get('search')
  const [dishes, setDishes] = useState<Dish[]>([])
  const [search, setSearch] = useState(searchParam ?? '')
  const [vegOnly, setVegOnly] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError('')
      try {
        const list = await fetchBrowseDishes({
          dishCategoryId: categoryId ? Number(categoryId) : undefined,
          cuisineId: cuisineId ? Number(cuisineId) : undefined,
        })
        if (!cancelled) setDishes(list)
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Could not load dishes')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [categoryId, cuisineId])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return dishes.filter((d) => {
      if (vegOnly === true && !d.isVeg) return false
      if (vegOnly === false && d.isVeg) return false
      if (!q) return true
      const hay = [d.name, d.restaurantName, d.description, ...d.tags]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return hay.includes(q)
    })
  }, [dishes, search, vegOnly])

  return (
    <div className="page">
      <HeroLight
        title="All dishes"
        search={search}
        onSearchChange={setSearch}
        placeholder="Search dishes"
        trailing={
          <button
            type="button"
            className="chip"
            onClick={() => setVegOnly(vegOnly === true ? null : true)}
            style={{ marginLeft: 'auto' }}
          >
            {vegOnly === true ? 'Veg ✓' : 'Veg'}
          </button>
        }
      />
      <div className="page-content">
        <div className="chip-row">
          <button
            type="button"
            className={`chip ${vegOnly === null ? 'active' : ''}`}
            onClick={() => setVegOnly(null)}
          >
            All
          </button>
          <button
            type="button"
            className={`chip ${vegOnly === true ? 'active' : ''}`}
            onClick={() => setVegOnly(true)}
          >
            Veg
          </button>
          <button
            type="button"
            className={`chip ${vegOnly === false ? 'active' : ''}`}
            onClick={() => setVegOnly(false)}
          >
            Non-veg
          </button>
        </div>

        {loading && <div className="loading-center">Loading dishes…</div>}
        {error && <div className="error-banner">{error}</div>}

        {!loading && !error && filtered.length === 0 && (
          <EmptyState
            image="/images/empty_dishes_search.png"
            title="No dishes found"
            description="Try another search or filter to find something delicious."
          />
        )}

        <div className="grid-2">
          {filtered.map((dish) => (
            <DishCard key={dish.id} dish={dish} />
          ))}
        </div>
      </div>
    </div>
  )
}
