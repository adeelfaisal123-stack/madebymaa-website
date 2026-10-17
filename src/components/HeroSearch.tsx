import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Cuisine, Dish, Kitchen } from '../types'
import { formatPrice } from '../utils'

type SuggestKind = 'kitchen' | 'cuisine' | 'dish'

export interface SearchSuggestItem {
  key: string
  kind: SuggestKind
  title: string
  subtitle: string
  to: string
  imageUrl?: string
  meta?: string
}

interface HeroSearchProps {
  kitchens: Kitchen[]
  cuisines: Cuisine[]
  dishes: Dish[]
  value: string
  onChange: (value: string) => void
  onSubmit: (query: string) => void
}

function matchesQuery(haystack: string, query: string): boolean {
  return haystack.toLowerCase().includes(query)
}

function buildSuggestions(
  query: string,
  kitchens: Kitchen[],
  cuisines: Cuisine[],
  dishes: Dish[],
): SearchSuggestItem[] {
  const q = query.trim().toLowerCase()
  if (q.length < 1) return []

  const kitchenHits = kitchens
    .filter(
      (k) =>
        matchesQuery(k.name, q) ||
        (k.cuisine ? matchesQuery(k.cuisine, q) : false) ||
        (k.chefName ? matchesQuery(k.chefName, q) : false) ||
        k.tags.some((t) => matchesQuery(t, q)),
    )
    .slice(0, 3)
    .map(
      (k): SearchSuggestItem => ({
        key: `kitchen-${k.id}`,
        kind: 'kitchen',
        title: k.name,
        subtitle: [k.cuisine, k.chefName ? `Chef ${k.chefName}` : null]
          .filter(Boolean)
          .join(' · ') || 'Home kitchen',
        to: `/kitchens/${k.id}`,
        imageUrl: k.logoUrl || k.coverUrl,
        meta: k.isOpen ? 'Open' : 'Closed',
      }),
    )

  const cuisineHits = cuisines
    .filter((c) => matchesQuery(c.name, q))
    .slice(0, 3)
    .map(
      (c): SearchSuggestItem => ({
        key: `cuisine-${c.id}`,
        kind: 'cuisine',
        title: c.name,
        subtitle: 'Cuisine',
        to: `/dishes?cuisine=${c.id}`,
        imageUrl: c.imageUrl,
      }),
    )

  const dishHits = dishes
    .filter(
      (d) =>
        matchesQuery(d.name, q) ||
        matchesQuery(d.restaurantName, q) ||
        (d.restaurantCuisine ? matchesQuery(d.restaurantCuisine, q) : false) ||
        d.tags.some((t) => matchesQuery(t, q)),
    )
    .slice(0, 4)
    .map(
      (d): SearchSuggestItem => ({
        key: `dish-${d.id}`,
        kind: 'dish',
        title: d.name,
        subtitle: d.restaurantName,
        to: `/dishes/${d.id}`,
        imageUrl: d.imageUrl,
        meta: formatPrice(d.effectivePrice),
      }),
    )

  return [...kitchenHits, ...cuisineHits, ...dishHits]
}

const KIND_META: Record<
  SuggestKind,
  { label: string; icon: string; section: string }
> = {
  kitchen: { label: 'Kitchen', icon: 'bi-shop', section: 'Kitchens' },
  cuisine: { label: 'Cuisine', icon: 'bi-globe2', section: 'Cuisines' },
  dish: { label: 'Dish', icon: 'bi-egg-fried', section: 'Dishes' },
}

export function HeroSearch({
  kitchens,
  cuisines,
  dishes,
  value,
  onChange,
  onSubmit,
}: HeroSearchProps) {
  const navigate = useNavigate()
  const listId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)

  const suggestions = useMemo(
    () => buildSuggestions(value, kitchens, cuisines, dishes),
    [value, kitchens, cuisines, dishes],
  )

  const showPanel = open && value.trim().length >= 1

  useEffect(() => {
    setActiveIndex(0)
  }, [value])

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const goTo = (item: SearchSuggestItem) => {
    setOpen(false)
    onChange(item.title)
    navigate(item.to)
  }

  const submit = () => {
    setOpen(false)
    onSubmit(value.trim())
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showPanel) {
      if (e.key === 'Escape') setOpen(false)
      return
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, Math.max(suggestions.length - 1, 0)))
      return
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
      return
    }
    if (e.key === 'Escape') {
      e.preventDefault()
      setOpen(false)
      return
    }
    if (e.key === 'Enter' && suggestions[activeIndex]) {
      e.preventDefault()
      goTo(suggestions[activeIndex])
    }
  }

  const grouped = useMemo(() => {
    const order: SuggestKind[] = ['kitchen', 'cuisine', 'dish']
    return order
      .map((kind) => ({
        kind,
        items: suggestions.filter((s) => s.kind === kind),
      }))
      .filter((g) => g.items.length > 0)
  }, [suggestions])

  let flatIndex = -1

  return (
    <div className={`hp-hero-search${showPanel ? ' is-open' : ''}`} ref={rootRef}>
      <form
        className="hp-search-field"
        role="search"
        onSubmit={(e) => {
          e.preventDefault()
          if (showPanel && suggestions[activeIndex]) {
            goTo(suggestions[activeIndex])
            return
          }
          submit()
        }}
      >
        <i className="bi bi-search hp-search-leading" aria-hidden />
        <input
          type="search"
          placeholder="Search dishes, kitchens, cuisines…"
          value={value}
          autoComplete="off"
          aria-autocomplete="list"
          aria-controls={listId}
          aria-expanded={showPanel}
          aria-activedescendant={
            showPanel && suggestions[activeIndex]
              ? `${listId}-opt-${activeIndex}`
              : undefined
          }
          role="combobox"
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            onChange(e.target.value)
            setOpen(true)
          }}
          onKeyDown={onKeyDown}
        />
        {value ? (
          <button
            type="button"
            className="hp-search-clear"
            aria-label="Clear search"
            onClick={() => {
              onChange('')
              setOpen(false)
            }}
          >
            <i className="bi bi-x-lg" />
          </button>
        ) : null}
        <button type="submit" className="hp-search-submit" aria-label="Search">
          <i className="bi bi-arrow-right" />
        </button>
      </form>

      {showPanel ? (
        <div className="hp-suggest" id={listId} role="listbox" aria-label="Search suggestions">
          <div className="hp-suggest-glow" aria-hidden />

          {suggestions.length === 0 ? (
            <div className="hp-suggest-empty">
              <span className="hp-suggest-empty-icon" aria-hidden>
                <i className="bi bi-search-heart" />
              </span>
              <p>
                No matches for <strong>{value.trim()}</strong>
              </p>
              <button type="button" className="hp-suggest-empty-cta" onClick={submit}>
                Search all dishes instead
              </button>
            </div>
          ) : (
            <>
              {grouped.map((group) => (
                <div key={group.kind} className="hp-suggest-group">
                  <p className="hp-suggest-heading">
                    <i className={`bi ${KIND_META[group.kind].icon}`} aria-hidden />
                    {KIND_META[group.kind].section}
                  </p>
                  <ul className="hp-suggest-list">
                    {group.items.map((item) => {
                      flatIndex += 1
                      const index = flatIndex
                      const active = index === activeIndex
                      return (
                        <li key={item.key} role="presentation">
                          <button
                            type="button"
                            id={`${listId}-opt-${index}`}
                            role="option"
                            aria-selected={active}
                            className={`hp-suggest-item hp-suggest-item--${item.kind}${
                              active ? ' is-active' : ''
                            }`}
                            onMouseEnter={() => setActiveIndex(index)}
                            onClick={() => goTo(item)}
                          >
                            <span className="hp-suggest-thumb" aria-hidden>
                              {item.imageUrl ? (
                                <img src={item.imageUrl} alt="" loading="lazy" />
                              ) : (
                                <i className={`bi ${KIND_META[item.kind].icon}`} />
                              )}
                            </span>
                            <span className="hp-suggest-copy">
                              <span className="hp-suggest-title-row">
                                <span className="hp-suggest-title">{item.title}</span>
                                <span className={`hp-suggest-pill hp-suggest-pill--${item.kind}`}>
                                  {KIND_META[item.kind].label}
                                </span>
                              </span>
                              <span className="hp-suggest-sub">
                                {item.subtitle}
                                {item.meta ? (
                                  <>
                                    <span className="hp-suggest-dot" aria-hidden />
                                    {item.meta}
                                  </>
                                ) : null}
                              </span>
                            </span>
                            <i className="bi bi-arrow-up-right hp-suggest-go" aria-hidden />
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              ))}

              <button type="button" className="hp-suggest-footer" onClick={submit}>
                <span>
                  See all results for <strong>{value.trim()}</strong>
                </span>
                <i className="bi bi-arrow-right" aria-hidden />
              </button>
            </>
          )}
        </div>
      ) : null}
    </div>
  )
}
