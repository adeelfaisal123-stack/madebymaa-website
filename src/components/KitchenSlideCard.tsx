import { Link } from 'react-router-dom'
import type { Kitchen } from '../types'
import { formatDistance } from '../utils'
import './KitchenCarousel.css'

export function KitchenSlideCard({ kitchen }: { kitchen: Kitchen }) {
  const coverSrc = kitchen.coverUrl || kitchen.logoUrl
  const coverIsLogo = !kitchen.coverUrl && !!kitchen.logoUrl

  return (
    <Link to={`/kitchens/${kitchen.id}`} className="kitchen-slide-card">
      <div className="kitchen-slide-cover">
        <div
          className={`kitchen-slide-cover-media${coverIsLogo ? ' kitchen-slide-cover-media--logo' : ''}`}
        >
          {coverSrc ? (
            <img src={coverSrc} alt="" loading="lazy" />
          ) : (
            <div className="kitchen-slide-cover-fallback" aria-hidden>
              <i className="bi bi-house-heart-fill" />
            </div>
          )}
        </div>
        <div className="kitchen-slide-overlay" aria-hidden />
        <span className={`kitchen-slide-status ${kitchen.isOpen ? 'open' : 'closed'}`}>
          <span className="kitchen-slide-status-dot" aria-hidden />
          {kitchen.isOpen ? 'Open now' : 'Closed'}
        </span>
        {kitchen.isVerified && (
          <span className="kitchen-slide-verified">
            <i className="bi bi-patch-check-fill" />
            Verified
          </span>
        )}
        <span className="kitchen-slide-shine" aria-hidden />
        <div className="kitchen-slide-wave" aria-hidden>
          <svg viewBox="0 0 1200 40" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M0,20 C150,4 300,36 450,20 C600,4 750,36 900,20 C1050,4 1200,36 1200,20 L1200,40 L0,40 Z"
              fill="#faf7ff"
            />
          </svg>
        </div>
      </div>

      <div className="kitchen-slide-body">
        <div className="kitchen-slide-head">
          {kitchen.logoUrl ? (
            <img className="kitchen-slide-logo" src={kitchen.logoUrl} alt="" loading="lazy" />
          ) : (
            <div className="kitchen-slide-logo kitchen-slide-logo-fallback" aria-hidden>
              <i className="bi bi-emoji-smile-fill" />
            </div>
          )}
          <div className="kitchen-slide-info">
            <h3>{kitchen.name}</h3>
            {kitchen.chefName && <p className="kitchen-slide-chef">Chef {kitchen.chefName}</p>}
          </div>
        </div>

        {kitchen.cuisine && <span className="kitchen-slide-cuisine">{kitchen.cuisine}</span>}

        <div className="kitchen-slide-meta">
          <span className="kitchen-slide-rating">
            <i className="bi bi-star-fill" />
            {kitchen.rating.hasReviews ? kitchen.rating.average.toFixed(1) : 'New'}
            {kitchen.rating.hasReviews && <small>({kitchen.rating.count})</small>}
          </span>
          {kitchen.deliveryLabel && (
            <span className="kitchen-slide-delivery">
              <i className="bi bi-clock" />
              {kitchen.deliveryLabel}
            </span>
          )}
          {kitchen.distanceKm != null && (
            <span className="kitchen-slide-distance">
              <i className="bi bi-geo-alt" />
              {formatDistance(kitchen.distanceKm)}
            </span>
          )}
        </div>

        <span className="kitchen-slide-cta">
          View kitchen <i className="bi bi-arrow-right" />
        </span>
      </div>
    </Link>
  )
}
