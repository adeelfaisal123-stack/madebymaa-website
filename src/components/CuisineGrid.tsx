import { Link } from 'react-router-dom'
import type { Cuisine } from '../types'

interface CuisineGridProps {
  cuisines: Cuisine[]
  linkTo?: 'dishes' | 'kitchens'
}

export function CuisineGrid({ cuisines, linkTo = 'dishes' }: CuisineGridProps) {
  return (
    <div className="hp-cuisine-grid">
      {cuisines.map((cuisine) => {
        const href =
          linkTo === 'kitchens'
            ? `/kitchens?cuisine=${encodeURIComponent(cuisine.name)}`
            : `/dishes?cuisine=${cuisine.id}`
        return (
          <Link key={cuisine.id} to={href} className="hp-cuisine-card">
            <div className="hp-cuisine-card-image">
              {cuisine.imageUrl ? (
                <img src={cuisine.imageUrl} alt={cuisine.name} loading="lazy" />
              ) : (
                <span className="hp-cuisine-fallback" aria-hidden>
                  🍽️
                </span>
              )}
            </div>
            <span className="hp-cuisine-card-name">{cuisine.name}</span>
          </Link>
        )
      })}
    </div>
  )
}
