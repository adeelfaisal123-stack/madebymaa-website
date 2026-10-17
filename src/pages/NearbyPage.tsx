import { useEffect, useMemo, useState } from 'react'
import { fetchBrowseKitchens, fetchCuisines } from '../api/optica2'
import { KitchenCard } from '../components/cards'
import { EmptyState } from '../components/EmptyState'
import { HeroLight, OpenClosedToggle } from '../components/shared'
import { useLocationStore } from '../stores'
import type { Kitchen } from '../types'
import { detectUserLocation, displayLocationLabel, filterKitchens } from '../utils'

export function NearbyPage() {
  const { lat, lng, setLocation, label } = useLocationStore()
  const [kitchens, setKitchens] = useState<Kitchen[]>([])
  const [cuisines, setCuisines] = useState<string[]>([])
  const [search, setSearch] = useState('')
  const [openFilter, setOpenFilter] = useState<boolean | null>(null)
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([])
  const [minRating, setMinRating] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (lat == null || lng == null) {
      detectUserLocation(setLocation)
    }
  }, [lat, lng, setLocation])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (lat == null || lng == null) return
      setLoading(true)
      setError('')
      try {
        const [list, cuisineList] = await Promise.all([
          fetchBrowseKitchens(lat, lng),
          fetchCuisines(),
        ])
        if (cancelled) return
        setKitchens(list)
        setCuisines(cuisineList.map((c) => c.name))
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Could not load kitchens')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [lat, lng])

  const filtered = useMemo(
    () =>
      filterKitchens(kitchens, {
        search,
        openOnly: openFilter,
        cuisines: selectedCuisines,
        minRating: minRating || undefined,
      }),
    [kitchens, search, openFilter, selectedCuisines, minRating],
  )

  const toggleCuisine = (name: string) => {
    setSelectedCuisines((prev) =>
      prev.includes(name) ? prev.filter((c) => c !== name) : [...prev, name],
    )
  }

  return (
    <div className="page">
      <HeroLight
        title="Nearby kitchens"
        search={search}
        onSearchChange={setSearch}
        placeholder="Search nearby kitchens"
      />
      <div className="page-content">
        <p className="muted">Delivering near {displayLocationLabel(label)}</p>
        <OpenClosedToggle value={openFilter} onChange={setOpenFilter} />

        {cuisines.length > 0 && (
          <div className="chip-row">
            {cuisines.map((name) => (
              <button
                key={name}
                type="button"
                className={`chip ${selectedCuisines.includes(name) ? 'active' : ''}`}
                onClick={() => toggleCuisine(name)}
              >
                {name}
              </button>
            ))}
          </div>
        )}

        <div className="chip-row">
          {[0, 3, 4, 4.5].map((rating) => (
            <button
              key={rating}
              type="button"
              className={`chip ${minRating === rating ? 'active' : ''}`}
              onClick={() => setMinRating(minRating === rating ? 0 : rating)}
            >
              {rating === 0 ? 'Any rating' : `${rating}+ ★`}
            </button>
          ))}
        </div>

        {loading && <div className="loading-center">Loading kitchens…</div>}
        {error && <div className="error-banner">{error}</div>}

        {!loading && !error && filtered.length === 0 && (
          <EmptyState
            image="/images/empty_nearby_kitchens.png"
            title="No kitchens found"
            description="Try changing filters or search to find homemade kitchens near you."
          />
        )}

        {!loading &&
          filtered.map((kitchen) => (
            <div key={kitchen.id} style={{ marginBottom: 14 }}>
              <KitchenCard kitchen={kitchen} />
            </div>
          ))}
      </div>
    </div>
  )
}
