import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { fetchBrowseKitchens, fetchCuisines } from '../api/optica2'
import { KitchenSlideCard } from '../components/KitchenSlideCard'
import { EmptyState } from '../components/EmptyState'
import { HomeFooter } from '../components/HomeFooter'
import { HomeNav } from '../components/HomeNav'
import { KitchenBrowseHero } from '../components/KitchenBrowseHero'
import { KitchenFilters } from '../components/KitchenFilters'
import type { Cuisine, Kitchen } from '../types'
import { filterKitchens, mergeCuisines } from '../utils'
import './homepage.css'
import './all-kitchens.css'

const KITCHENS_PAGE_SIZE = 12

export function AllKitchensPage() {
  const [params] = useSearchParams()
  const cuisineParam = params.get('cuisine')
  const [kitchens, setKitchens] = useState<Kitchen[]>([])
  const [cuisines, setCuisines] = useState<Cuisine[]>([])
  const [search, setSearch] = useState('')
  const [showOpen, setShowOpen] = useState(true)
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>(
    cuisineParam ? [cuisineParam] : [],
  )
  const [minRating, setMinRating] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [visibleCount, setVisibleCount] = useState(KITCHENS_PAGE_SIZE)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError('')
      try {
        const [list, cuisineList] = await Promise.all([
          fetchBrowseKitchens(),
          fetchCuisines(),
        ])
        if (cancelled) return
        setKitchens(list)
        setCuisines(mergeCuisines(cuisineList))
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Could not load kitchens')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const filtered = useMemo(() => {
    const list = filterKitchens(kitchens, {
      search,
      openOnly: showOpen,
      cuisines: selectedCuisines,
      minRating: minRating ?? undefined,
    })

    if (minRating != null) {
      return [...list].sort((a, b) => {
        const byRating = b.rating.average - a.rating.average
        if (byRating !== 0) return byRating
        return a.name.localeCompare(b.name)
      })
    }

    return list
  }, [kitchens, search, showOpen, selectedCuisines, minRating])

  useEffect(() => {
    setVisibleCount(KITCHENS_PAGE_SIZE)
  }, [search, showOpen, selectedCuisines, minRating])

  const visibleKitchens = filtered.slice(0, visibleCount)
  const hasMore = visibleCount < filtered.length

  const isFiltering =
    search.trim().length > 0 ||
    selectedCuisines.length > 0 ||
    minRating != null ||
    !showOpen

  const clearFilters = () => {
    setSearch('')
    setSelectedCuisines([])
    setMinRating(null)
    setShowOpen(true)
    setVisibleCount(KITCHENS_PAGE_SIZE)
  }

  const loadMore = () => {
    setVisibleCount((count) => Math.min(count + KITCHENS_PAGE_SIZE, filtered.length))
  }

  return (
    <div className="homepage all-kitchens-page">
      <HomeNav active="kitchens" />

      <KitchenBrowseHero search={search} onSearchChange={setSearch} />

      <section className="all-kitchens-main" id="kitchen-results">
        {!loading && !error && kitchens.length > 0 && (
          <KitchenFilters
            showOpen={showOpen}
            onShowOpenChange={setShowOpen}
            cuisines={cuisines}
            selectedCuisines={selectedCuisines}
            onCuisinesChange={setSelectedCuisines}
            minRating={minRating}
            onMinRatingChange={setMinRating}
            resultCount={filtered.length}
            onClearFilters={clearFilters}
            isFiltering={isFiltering}
          />
        )}

        <div className="container-fluid px-3 px-lg-5 all-kitchens-body">
          {loading && (
            <div className="all-kitchens-loading">
              <div className="all-kitchens-spinner" aria-hidden />
              <p>Loading kitchens…</p>
            </div>
          )}

          {error && (
            <div className="all-kitchens-error">
              <p>{error}</p>
              <button type="button" className="hp-btn hp-btn--primary" onClick={() => window.location.reload()}>
                Try again
              </button>
            </div>
          )}

          {!loading && !error && kitchens.length === 0 && (
            <EmptyState
              image="/images/empty_nearby_kitchens.png"
              title="No kitchens yet"
              description="Check back soon for homemade kitchens on Made by Maa."
            />
          )}

          {!loading && !error && kitchens.length > 0 && filtered.length === 0 && (
            <EmptyState
              image="/images/empty_nearby_kitchens.png"
              title="No kitchens found"
              description="Try changing your search or filters to discover more home kitchens."
              action={
                isFiltering ? (
                  <button type="button" className="hp-btn hp-btn--primary all-kitchens-clear-btn" onClick={clearFilters}>
                    Clear filters
                  </button>
                ) : undefined
              }
            />
          )}

          {!loading && !error && filtered.length > 0 && (
            <>
              <div className="row g-3 g-lg-4 all-kitchens-grid">
                {visibleKitchens.map((kitchen) => (
                  <div key={kitchen.id} className="col-12 col-sm-6 col-lg-4 col-xl-3">
                    <KitchenSlideCard kitchen={kitchen} />
                  </div>
                ))}
              </div>

              <div className="all-kitchens-load-more">
                <p className="all-kitchens-shown">
                  Showing <strong>{visibleKitchens.length}</strong> of{' '}
                  <strong>{filtered.length}</strong> kitchens
                </p>
                {hasMore && (
                  <button type="button" className="hp-btn hp-btn--ghost" onClick={loadMore}>
                    Load more kitchens
                    <i className="bi bi-arrow-down hp-btn-arrow" />
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </section>

      <HomeFooter />
    </div>
  )
}
