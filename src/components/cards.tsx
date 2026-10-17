import { Link } from 'react-router-dom'
import type { Dish, Kitchen } from '../types'
import { formatDistance, formatPrice } from '../utils'
import './cards.css'

export function RatingStars({ average, count }: { average: number; count: number }) {
  if (count <= 0) return <span className="rating-muted">New</span>
  return (
    <span className="rating-stars">
      ★ {average.toFixed(1)} <span className="rating-count">({count})</span>
    </span>
  )
}

export function KitchenCard({ kitchen }: { kitchen: Kitchen }) {
  const coverSrc = kitchen.coverUrl || kitchen.logoUrl
  const coverIsLogo = !kitchen.coverUrl && !!kitchen.logoUrl

  return (
    <Link to={`/kitchens/${kitchen.id}`} className="kitchen-card card">
      <div className="kitchen-card-cover">
        {coverSrc ? (
          <img
            src={coverSrc}
            alt=""
            loading="lazy"
            className={coverIsLogo ? 'kitchen-card-cover-logo' : undefined}
          />
        ) : (
          <div className="kitchen-card-placeholder" />
        )}
        <span className={`kitchen-badge ${kitchen.isOpen ? 'open' : 'closed'}`}>
          {kitchen.isOpen ? 'Open' : 'Closed'}
        </span>
      </div>
      <div className="kitchen-card-body">
        <div className="kitchen-card-top">
          {kitchen.logoUrl ? (
            <img className="kitchen-logo" src={kitchen.logoUrl} alt="" />
          ) : (
            <div className="kitchen-logo placeholder" />
          )}
          <div className="kitchen-card-meta">
            <h3>{kitchen.name}</h3>
            {kitchen.cuisine && <p className="muted">{kitchen.cuisine}</p>}
          </div>
        </div>
        <div className="kitchen-card-footer">
          <RatingStars average={kitchen.rating.average} count={kitchen.rating.count} />
          {kitchen.distanceKm != null && (
            <span className="distance">{formatDistance(kitchen.distanceKm)}</span>
          )}
        </div>
      </div>
    </Link>
  )
}

export function DishCard({ dish }: { dish: Dish }) {
  return (
    <Link to={`/dishes/${dish.id}`} className="dish-card card">
      <div className="dish-card-image">
        {dish.imageUrl ? (
          <img src={dish.imageUrl} alt="" loading="lazy" />
        ) : (
          <div className="dish-card-placeholder" />
        )}
        <span className={`veg-dot ${dish.isVeg ? 'veg' : 'nonveg'}`} aria-label={dish.isVeg ? 'Veg' : 'Non-veg'} />
      </div>
      <div className="dish-card-body">
        <h3>{dish.name}</h3>
        <p className="muted">{dish.restaurantName}</p>
        <div className="dish-card-footer">
          <strong>{formatPrice(dish.effectivePrice)}</strong>
          {dish.price > dish.effectivePrice && (
            <span className="strike">{formatPrice(dish.price)}</span>
          )}
        </div>
      </div>
    </Link>
  )
}
