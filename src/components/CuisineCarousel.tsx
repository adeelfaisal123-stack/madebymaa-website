import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Cuisine } from '../types'
import './CuisineCarousel.css'

interface CuisineCarouselProps {
  cuisines: Cuisine[]
  linkTo?: 'dishes' | 'kitchens'
}

const ITEMS_PER_VIEW = 5

export function CuisineCarousel({ cuisines, linkTo = 'dishes' }: CuisineCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [activePage, setActivePage] = useState(0)
  const [itemsPerView, setItemsPerView] = useState(ITEMS_PER_VIEW)

  const pageCount = Math.max(1, Math.ceil(cuisines.length / itemsPerView))

  const scrollToPage = useCallback((page: number) => {
    const track = trackRef.current
    if (!track) return
    track.scrollTo({ left: page * track.clientWidth, behavior: 'smooth' })
    setActivePage(page)
  }, [])

  const next = useCallback(() => {
    scrollToPage((activePage + 1) % pageCount)
  }, [activePage, pageCount, scrollToPage])

  const prev = useCallback(() => {
    scrollToPage((activePage - 1 + pageCount) % pageCount)
  }, [activePage, pageCount, scrollToPage])

  useEffect(() => {
    const update = () => {
      const w = window.innerWidth
      if (w < 480) setItemsPerView(3)
      else if (w < 768) setItemsPerView(4)
      else setItemsPerView(ITEMS_PER_VIEW)
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  useEffect(() => {
    setActivePage(0)
    trackRef.current?.scrollTo({ left: 0 })
  }, [itemsPerView, cuisines.length])

  useEffect(() => {
    const track = trackRef.current
    if (!track) return

    const onScroll = () => {
      const pageWidth = track.clientWidth || 1
      const page = Math.round(track.scrollLeft / pageWidth)
      setActivePage(Math.min(page, pageCount - 1))
    }

    track.addEventListener('scroll', onScroll, { passive: true })
    return () => track.removeEventListener('scroll', onScroll)
  }, [pageCount])

  if (cuisines.length === 0) return null

  return (
    <div className="hp-cuisine-carousel-wrap">
      {cuisines.length > itemsPerView && (
        <>
          <button type="button" className="hp-cuisine-nav hp-cuisine-nav-prev" onClick={prev} aria-label="Previous cuisines">
            <i className="bi bi-chevron-left" />
          </button>
          <button type="button" className="hp-cuisine-nav hp-cuisine-nav-next" onClick={next} aria-label="Next cuisines">
            <i className="bi bi-chevron-right" />
          </button>
        </>
      )}

      <div ref={trackRef} className="hp-cuisine-track">
        {cuisines.map((cuisine) => {
          const href =
            linkTo === 'kitchens'
              ? `/kitchens?cuisine=${encodeURIComponent(cuisine.name)}`
              : `/dishes?cuisine=${cuisine.id}`

          return (
            <div
              key={cuisine.id}
              className="hp-cuisine-track-item"
              style={{ flex: `0 0 calc(${100 / itemsPerView}% - 12px)` }}
            >
              <Link to={href} className="hp-cuisine-image-link" aria-label={cuisine.name}>
                {cuisine.imageUrl ? (
                  <img src={cuisine.imageUrl} alt={cuisine.name} loading="lazy" />
                ) : (
                  <span className="hp-cuisine-image-fallback" aria-hidden>
                    🍽️
                  </span>
                )}
              </Link>
            </div>
          )
        })}
      </div>

      {pageCount > 1 && (
        <div className="hp-cuisine-dots">
          {Array.from({ length: pageCount }).map((_, i) => (
            <button
              key={i}
              type="button"
              className={`hp-cuisine-dot ${i === activePage ? 'active' : ''}`}
              onClick={() => scrollToPage(i)}
              aria-label={`Go to cuisine slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
