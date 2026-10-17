import { useEffect, useId, useRef, useState } from 'react'
import type { Cuisine } from '../types'
import './KitchenFilters.css'

interface KitchenFiltersProps {
  showOpen: boolean
  onShowOpenChange: (showOpen: boolean) => void
  cuisines: Cuisine[]
  selectedCuisines: string[]
  onCuisinesChange: (cuisines: string[]) => void
  minRating: number | null
  onMinRatingChange: (rating: number | null) => void
  resultCount?: number
  onClearFilters?: () => void
  isFiltering?: boolean
}

const RATING_OPTIONS = [
  { value: null, label: 'All ratings' },
  { value: 3, label: '3+ stars' },
  { value: 4, label: '4+ stars' },
  { value: 4.5, label: '4.5+ stars' },
] as const

export function KitchenFilters({
  showOpen,
  onShowOpenChange,
  cuisines,
  selectedCuisines,
  onCuisinesChange,
  minRating,
  onMinRatingChange,
  resultCount,
  onClearFilters,
  isFiltering = false,
}: KitchenFiltersProps) {
  const [ratingOpen, setRatingOpen] = useState(false)
  const [cuisineOpen, setCuisineOpen] = useState(false)
  const ratingPanelId = useId()
  const cuisinePanelId = useId()
  const ratingRef = useRef<HTMLDivElement>(null)
  const cuisineRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as Node
      if (ratingRef.current && !ratingRef.current.contains(target)) {
        setRatingOpen(false)
      }
      if (cuisineRef.current && !cuisineRef.current.contains(target)) {
        setCuisineOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  const ratingLabel =
    RATING_OPTIONS.find((o) => o.value === minRating)?.label ?? 'Top rated'

  const cuisineLabel =
    selectedCuisines.length === 0
      ? 'All cuisines'
      : selectedCuisines.length === 1
        ? selectedCuisines[0]
        : `${selectedCuisines.length} cuisines`

  const toggleCuisine = (name: string) => {
    onCuisinesChange(
      selectedCuisines.includes(name)
        ? selectedCuisines.filter((c) => c !== name)
        : [...selectedCuisines, name],
    )
  }

  return (
    <div className="kb-filters">
      <div className="container-fluid px-3 px-lg-5">
        <div className="kb-filters-toolbar">
          <div className="kb-open-toggle" role="group" aria-label="Kitchen availability">
            <div
              className={`kb-open-toggle-pill ${showOpen ? 'is-open' : 'is-closed'}`}
              aria-hidden
            />
            <button
              type="button"
              className={`kb-open-toggle-btn ${showOpen ? 'active' : ''}`}
              onClick={() => onShowOpenChange(true)}
            >
              <span className="kb-open-toggle-icon open">
                <i className="bi bi-shop" />
              </span>
              Open
            </button>
            <button
              type="button"
              className={`kb-open-toggle-btn ${!showOpen ? 'active' : ''}`}
              onClick={() => onShowOpenChange(false)}
            >
              <span className="kb-open-toggle-icon closed">
                <i className="bi bi-moon-stars" />
              </span>
              Closed
            </button>
          </div>

          <div className="kb-filters-actions">
            <div className="kb-filter-dropdown" ref={cuisineRef}>
              <button
                type="button"
                className={`kb-filter-trigger ${selectedCuisines.length > 0 ? 'active' : ''}`}
                aria-expanded={cuisineOpen}
                aria-controls={cuisinePanelId}
                onClick={() => {
                  setCuisineOpen((v) => !v)
                  setRatingOpen(false)
                }}
              >
                <i className="bi bi-egg-fried" />
                <span>{cuisineLabel}</span>
                <i className={`bi bi-chevron-down kb-filter-chevron ${cuisineOpen ? 'open' : ''}`} />
              </button>

              {cuisineOpen && (
                <div
                  className="kb-filter-panel kb-filter-panel--cuisine"
                  id={cuisinePanelId}
                  role="dialog"
                  aria-label="Filter by cuisine"
                >
                  <div className="kb-filter-panel-head">
                    <strong>Cuisines</strong>
                    {selectedCuisines.length > 0 && (
                      <button
                        type="button"
                        className="kb-filter-panel-clear"
                        onClick={() => onCuisinesChange([])}
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  <div className="kb-filter-options" role="group" aria-label="Cuisine options">
                    <button
                      type="button"
                      className={`kb-filter-cuisine-opt ${selectedCuisines.length === 0 ? 'active' : ''}`}
                      onClick={() => onCuisinesChange([])}
                    >
                      <span className="kb-filter-cuisine-check" aria-hidden>
                        {selectedCuisines.length === 0 ? (
                          <i className="bi bi-check-lg" />
                        ) : null}
                      </span>
                      All cuisines
                    </button>
                    {cuisines.map((cuisine) => {
                      const active = selectedCuisines.includes(cuisine.name)
                      return (
                        <button
                          key={cuisine.name}
                          type="button"
                          className={`kb-filter-cuisine-opt ${active ? 'active' : ''}`}
                          onClick={() => toggleCuisine(cuisine.name)}
                        >
                          <span className="kb-filter-cuisine-check" aria-hidden>
                            {active ? <i className="bi bi-check-lg" /> : null}
                          </span>
                          {cuisine.imageUrl ? (
                            <img src={cuisine.imageUrl} alt="" className="kb-filter-cuisine-img" />
                          ) : (
                            <span className="kb-filter-cuisine-fallback" aria-hidden>
                              <i className="bi bi-cup-hot" />
                            </span>
                          )}
                          {cuisine.name}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="kb-filter-dropdown" ref={ratingRef}>
              <button
                type="button"
                className={`kb-filter-trigger ${minRating != null ? 'active' : ''}`}
                aria-expanded={ratingOpen}
                aria-controls={ratingPanelId}
                onClick={() => {
                  setRatingOpen((v) => !v)
                  setCuisineOpen(false)
                }}
              >
                <i className="bi bi-star-fill" />
                <span>{ratingLabel}</span>
                <i className={`bi bi-chevron-down kb-filter-chevron ${ratingOpen ? 'open' : ''}`} />
              </button>

              {ratingOpen && (
                <div
                  className="kb-filter-panel kb-filter-panel--compact kb-filter-panel--right"
                  id={ratingPanelId}
                  role="dialog"
                  aria-label="Filter by rating"
                >
                  <div className="kb-filter-panel-head">
                    <strong>Top rated</strong>
                  </div>
                  <div className="kb-filter-options">
                    {RATING_OPTIONS.map((opt) => (
                      <button
                        key={opt.label}
                        type="button"
                        className={`kb-filter-rating-opt ${minRating === opt.value ? 'active' : ''}`}
                        onClick={() => {
                          onMinRatingChange(opt.value)
                          setRatingOpen(false)
                        }}
                      >
                        {opt.value != null && <i className="bi bi-star-fill" />}
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {isFiltering && onClearFilters && (
              <button type="button" className="kb-filter-clear-all" onClick={onClearFilters}>
                <i className="bi bi-x-circle" />
                Clear
              </button>
            )}
          </div>
        </div>

        {resultCount != null && (
          <p className="kb-filter-count">
            Showing <strong>{resultCount}</strong> kitchen{resultCount === 1 ? '' : 's'}
          </p>
        )}
      </div>
    </div>
  )
}
