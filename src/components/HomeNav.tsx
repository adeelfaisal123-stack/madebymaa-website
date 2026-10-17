import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { signOutCustomer } from '../lib/authSession'
import { confirmAction, toastSuccess } from '../lib/swal'
import { useLocationStore, useSessionStore } from '../stores'
import { detectUserLocation, displayLocationLabel } from '../utils'

type NavKey = 'home' | 'about' | 'kitchens' | 'how-it-works' | 'blog' | 'contact'

interface HomeNavProps {
  active?: NavKey
}

const NAV_ITEMS: { key: NavKey; label: string; to: string }[] = [
  { key: 'home', label: 'Home', to: '/' },
  { key: 'about', label: 'About us', to: '/about' },
  { key: 'kitchens', label: 'Kitchens', to: '/kitchens' },
  { key: 'how-it-works', label: 'How it works', to: '/how-it-works' },
  { key: 'blog', label: 'Blog', to: '/blog' },
  { key: 'contact', label: 'Contact us', to: '/contact' },
]

function resolveActive(pathname: string): NavKey | undefined {
  if (pathname === '/') return 'home'
  if (pathname.startsWith('/about')) return 'about'
  if (pathname.startsWith('/kitchens')) return 'kitchens'
  if (pathname.startsWith('/how-it-works')) return 'how-it-works'
  if (pathname.startsWith('/blog')) return 'blog'
  if (pathname.startsWith('/contact')) return 'contact'
  return undefined
}

export function HomeNav({ active }: HomeNavProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { label, setLocation } = useLocationStore()
  const session = useSessionStore((s) => s.session)
  const [navScrolled, setNavScrolled] = useState(false)
  const current = active ?? resolveActive(location.pathname)

  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const signOut = () => {
    void (async () => {
      const ok = await confirmAction({
        title: 'Sign out?',
        text: 'You can sign back in anytime with your phone number.',
        confirmText: 'Sign out',
        cancelText: 'Stay signed in',
        icon: 'question',
      })
      if (!ok) return
      await signOutCustomer()
      toastSuccess('Signed out')
      navigate('/')
    })()
  }

  return (
    <nav className={`hp-nav navbar navbar-expand-lg fixed-top ${navScrolled ? 'scrolled' : ''}`}>
      <div className="container-fluid hp-nav-inner">
        <Link className="navbar-brand hp-nav-logo" to="/" aria-label="Made by Maa home">
          <img src="/images/made_by_maa_logo.png" alt="Made by Maa" className="maa-logo-img" />
        </Link>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#hpNav"
          aria-controls="hpNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon" />
        </button>
        <div className="collapse navbar-collapse" id="hpNav">
          <ul className="navbar-nav mx-auto gap-1">
            {NAV_ITEMS.map((item) => (
              <li key={item.key} className="nav-item">
                <Link
                  className={`nav-link${current === item.key ? ' active' : ''}`}
                  to={item.to}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="d-flex align-items-center flex-wrap gap-2 mt-3 mt-lg-0 hp-nav-actions">
            <button
              type="button"
              className="hp-btn hp-btn--glass hp-btn--sm"
              onClick={() => detectUserLocation(setLocation)}
            >
              <i className="bi bi-geo-alt-fill" />
              <span className="hp-btn-label">{displayLocationLabel(label)}</span>
            </button>

            {session ? (
              <>
                <Link to="/profile" className="hp-btn hp-btn--glass hp-btn--sm hp-nav-user">
                  <i className="bi bi-person-fill" />
                  <span className="hp-btn-label">{session.name.split(' ')[0]}</span>
                </Link>
                <button type="button" className="hp-btn hp-btn--ghost hp-btn--sm" onClick={signOut}>
                  <i className="bi bi-box-arrow-right" />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="hp-btn hp-btn--ghost hp-btn--sm">
                  Sign in
                </Link>
                <Link to="/register" className="hp-btn hp-btn--primary hp-btn--sm">
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
