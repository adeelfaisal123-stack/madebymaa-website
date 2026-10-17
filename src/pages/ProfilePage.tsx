import { Link, useNavigate } from 'react-router-dom'
import { HomeFooter } from '../components/HomeFooter'
import { HomeNav } from '../components/HomeNav'
import { signOutCustomer } from '../lib/authSession'
import { confirmAction, toastSuccess } from '../lib/swal'
import { useCartStore, useLocationStore, useSessionHydrated, useSessionStore, useWishlistStore } from '../stores'
import { detectUserLocation, displayLocationLabel } from '../utils'
import './homepage.css'
import './profile.css'

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'M'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
}

export function ProfilePage() {
  const navigate = useNavigate()
  const session = useSessionStore((s) => s.session)
  const sessionHydrated = useSessionHydrated()
  const { label, setLocation } = useLocationStore()
  const itemCount = useCartStore((s) => s.itemCount)()
  const wishlistCount = useWishlistStore((s) => s.count)()

  const detectLocation = () => detectUserLocation(setLocation)

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

  const firstName = session?.name.split(' ')[0] ?? 'Guest'

  return (
    <div className="homepage pf-page">
      <HomeNav />

      <header className="pf-hero">
        <div className="pf-hero-atmosphere" aria-hidden>
          <div className="pf-hero-wash" />
          <div className="pf-hero-glow pf-hero-glow--a" />
          <div className="pf-hero-glow pf-hero-glow--b" />
        </div>

        <div className="pf-hero-inner">
          <p className="pf-brand">Made by Maa</p>
          {!sessionHydrated ? (
            <p className="pf-hero-lead">Loading your account…</p>
          ) : session ? (
            <>
              <div className="pf-avatar" aria-hidden>
                <span>{initialsFromName(session.name)}</span>
              </div>
              <h1>{session.name}</h1>
              <p className="pf-hero-lead">{session.phone}</p>
            </>
          ) : (
            <>
              <div className="pf-avatar pf-avatar--guest" aria-hidden>
                <i className="bi bi-person" />
              </div>
              <h1>Welcome, guest</h1>
              <p className="pf-hero-lead">
                Sign in to track orders, save favourites, and checkout faster.
              </p>
              <div className="pf-hero-actions">
                <Link to="/login?next=/profile" className="hp-btn hp-btn--primary">
                  Sign in
                </Link>
                <Link to="/register?next=/profile" className="hp-btn hp-btn--ghost">
                  Register
                </Link>
              </div>
            </>
          )}
        </div>
      </header>

      <main className="pf-main">
        <section className="pf-stats" aria-label="Quick overview">
          <Link to="/cart" className="pf-stat">
            <span className="pf-stat-icon pf-stat-icon--cart" aria-hidden>
              <i className="bi bi-bag-heart-fill" />
            </span>
            <span>
              <strong>{itemCount}</strong>
              <small>In cart</small>
            </span>
          </Link>
          <Link to="/orders" className="pf-stat">
            <span className="pf-stat-icon pf-stat-icon--orders" aria-hidden>
              <i className="bi bi-receipt" />
            </span>
            <span>
              <strong>{sessionHydrated && session ? 'Orders' : '—'}</strong>
              <small>
                {sessionHydrated && session ? 'Your history' : 'Sign in to view'}
              </small>
            </span>
          </Link>
          <Link to="/wishlist" className="pf-stat">
            <span className="pf-stat-icon pf-stat-icon--heart" aria-hidden>
              <i className="bi bi-heart-fill" />
            </span>
            <span>
              <strong>{wishlistCount}</strong>
              <small>Saved dishes</small>
            </span>
          </Link>
        </section>

        <section className="pf-panel">
          <h2 className="pf-panel-title">Account</h2>
          <div className="pf-list">
            <button type="button" className="pf-row" onClick={detectLocation}>
              <span className="pf-row-icon" aria-hidden>
                <i className="bi bi-geo-alt-fill" />
              </span>
              <span className="pf-row-copy">
                <strong>Delivery location</strong>
                <small>{displayLocationLabel(label)}</small>
              </span>
              <i className="bi bi-chevron-right pf-row-chevron" aria-hidden />
            </button>

            <Link to="/cart" className="pf-row">
              <span className="pf-row-icon" aria-hidden>
                <i className="bi bi-bag-check-fill" />
              </span>
              <span className="pf-row-copy">
                <strong>Your cart</strong>
                <small>
                  {itemCount === 0
                    ? 'Empty — start browsing kitchens'
                    : `${itemCount} item${itemCount === 1 ? '' : 's'} ready`}
                </small>
              </span>
              <i className="bi bi-chevron-right pf-row-chevron" aria-hidden />
            </Link>

            <Link to="/wishlist" className="pf-row">
              <span className="pf-row-icon" aria-hidden>
                <i className="bi bi-heart-fill" />
              </span>
              <span className="pf-row-copy">
                <strong>Wishlist</strong>
                <small>
                  {wishlistCount === 0
                    ? 'Save dishes you love'
                    : `${wishlistCount} saved dish${wishlistCount === 1 ? '' : 'es'}`}
                </small>
              </span>
              <i className="bi bi-chevron-right pf-row-chevron" aria-hidden />
            </Link>

            <Link to="/orders" className="pf-row">
              <span className="pf-row-icon" aria-hidden>
                <i className="bi bi-clock-history" />
              </span>
              <span className="pf-row-copy">
                <strong>Order history</strong>
                <small>
                  {sessionHydrated && session
                    ? 'Track past and active orders'
                    : 'Sign in to see orders'}
                </small>
              </span>
              <i className="bi bi-chevron-right pf-row-chevron" aria-hidden />
            </Link>
          </div>
        </section>

        <section className="pf-panel">
          <h2 className="pf-panel-title">Explore</h2>
          <div className="pf-list">
            <Link to="/kitchens" className="pf-row">
              <span className="pf-row-icon pf-row-icon--warm" aria-hidden>
                <i className="bi bi-shop" />
              </span>
              <span className="pf-row-copy">
                <strong>All kitchens</strong>
                <small>Discover home chefs nearby</small>
              </span>
              <i className="bi bi-chevron-right pf-row-chevron" aria-hidden />
            </Link>

            <Link to="/how-it-works" className="pf-row">
              <span className="pf-row-icon pf-row-icon--warm" aria-hidden>
                <i className="bi bi-stars" />
              </span>
              <span className="pf-row-copy">
                <strong>How it works</strong>
                <small>From kitchen to your door</small>
              </span>
              <i className="bi bi-chevron-right pf-row-chevron" aria-hidden />
            </Link>

            <Link to="/about" className="pf-row">
              <span className="pf-row-icon pf-row-icon--warm" aria-hidden>
                <i className="bi bi-heart" />
              </span>
              <span className="pf-row-copy">
                <strong>About Made by Maa</strong>
                <small>Our story and promise</small>
              </span>
              <i className="bi bi-chevron-right pf-row-chevron" aria-hidden />
            </Link>

            <Link to="/contact" className="pf-row">
              <span className="pf-row-icon pf-row-icon--warm" aria-hidden>
                <i className="bi bi-chat-heart" />
              </span>
              <span className="pf-row-copy">
                <strong>Contact us</strong>
                <small>We’re here to help</small>
              </span>
              <i className="bi bi-chevron-right pf-row-chevron" aria-hidden />
            </Link>
          </div>
        </section>

        {sessionHydrated && session && (
          <section className="pf-signout">
            <p className="pf-signout-copy">
              Signed in as <strong>{firstName}</strong>
            </p>
            <button type="button" className="hp-btn hp-btn--ghost" onClick={signOut}>
              <i className="bi bi-box-arrow-right" aria-hidden />
              Sign out
            </button>
          </section>
        )}
      </main>

      <HomeFooter />
    </div>
  )
}
