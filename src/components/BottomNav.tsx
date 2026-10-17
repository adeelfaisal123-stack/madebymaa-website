import { NavLink } from 'react-router-dom'
import './BottomNav.css'

const tabs = [
  { to: '/explore', label: 'Explore', icon: '🏠' },
  { to: '/nearby', label: 'Nearby', icon: '📍' },
  { to: '/orders', label: 'Orders', icon: '📦', center: true },
  { to: '/cart', label: 'Cart', icon: '🛒' },
  { to: '/profile', label: 'Profile', icon: '👤' },
]

export function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="Main">
      {tabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.to === '/explore'}
          className={({ isActive }) =>
            ['bottom-nav-item', tab.center ? 'center' : '', isActive ? 'active' : '']
              .filter(Boolean)
              .join(' ')
          }
        >
          <span className="bottom-nav-icon" aria-hidden>
            {tab.icon}
          </span>
          <span className="bottom-nav-label">{tab.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
