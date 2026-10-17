import { useCallback, useEffect, useRef, useState } from 'react'
import type { Kitchen } from '../types'
import { KitchenSlideCard } from './KitchenSlideCard'
import './KitchenCarousel.css'

interface KitchenCarouselProps {
  kitchens: Kitchen[]
}

function itemsForWidth(width: number) {
  if (width >= 1200) return 3
  if (width >= 768) return 2
  return 1
}

export function KitchenCarousel({ kitchens }: KitchenCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [activePage, setActivePage] = useState(0)
  const [itemsPerView, setItemsPerView] = useState(3)
  const [paused, setPaused] = useState(false)

  const pageCount = Math.max(1, Math.ceil(kitchens.length / itemsPerView))

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
    const update = () => setItemsPerView(itemsForWidth(window.innerWidth))
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  useEffect(() => {
    setActivePage(0)
    trackRef.current?.scrollTo({ left: 0 })
  }, [itemsPerView, kitchens.length])

  useEffect(() => {
    if (paused || kitchens.length <= itemsPerView) return
    const timer = window.setInterval(next, 5000)
    return () => window.clearInterval(timer)
  }, [paused, next, kitchens.length, itemsPerView])

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

  if (kitchens.length === 0) return null

  return (
    <div
      className="kitchen-carousel-wrap"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {kitchens.length > itemsPerView && (
        <>
          <button
            type="button"
            className="kitchen-carousel-nav kitchen-carousel-nav-prev"
            onClick={prev}
            aria-label="Previous kitchens"
          >
            <i className="bi bi-chevron-left" />
          </button>
          <button
            type="button"
            className="kitchen-carousel-nav kitchen-carousel-nav-next"
            onClick={next}
            aria-label="Next kitchens"
          >
            <i className="bi bi-chevron-right" />
          </button>
        </>
      )}

      <div ref={trackRef} className="kitchen-carousel-track">
        {kitchens.map((kitchen, index) => (
          <div
            key={kitchen.id}
            className="kitchen-carousel-item"
            style={{
              flex: `0 0 calc(${100 / itemsPerView}% - 16px)`,
              animationDelay: `${(index % itemsPerView) * 80}ms`,
            }}
          >
            <KitchenSlideCard kitchen={kitchen} />
          </div>
        ))}
      </div>

      {pageCount > 1 && (
        <div className="kitchen-carousel-dots">
          {Array.from({ length: pageCount }).map((_, i) => (
            <button
              key={i}
              type="button"
              className={`kitchen-carousel-dot ${i === activePage ? 'active' : ''}`}
              onClick={() => scrollToPage(i)}
              aria-label={`Go to kitchen slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
