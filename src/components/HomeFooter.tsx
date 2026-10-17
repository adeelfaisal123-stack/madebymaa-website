import { Link } from 'react-router-dom'

const PLAY_STORE_URL =
  import.meta.env.VITE_PLAY_STORE_URL?.trim() ||
  'https://play.google.com/store/apps/details?id=com.madebymaa.customer'

const APP_STORE_URL =
  import.meta.env.VITE_APP_STORE_URL?.trim() ||
  'https://apps.apple.com/app/made-by-maa'

export function HomeFooter() {
  return (
    <footer className="hp-footer">
      <div className="container">
        <div className="row g-4">
          <div className="col-lg-5">
            <img
              src="/images/made_by_maa_logo.png"
              alt=""
              style={{ height: 48, marginBottom: 16, filter: 'brightness(0) invert(1)' }}
            />
            <p>
              Homemade food, delivered with love. Connecting you with verified home chefs in your
              neighbourhood.
            </p>
            <div className="hp-footer-stores" aria-label="Download the app">
              <a
                href={PLAY_STORE_URL}
                className="hp-store-badge"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="hp-store-badge-icon" aria-hidden>
                  <i className="bi bi-google-play" />
                </span>
                <span className="hp-store-badge-copy">
                  <small>Get it on</small>
                  <strong>Google Play</strong>
                </span>
              </a>
              <a
                href={APP_STORE_URL}
                className="hp-store-badge"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="hp-store-badge-icon" aria-hidden>
                  <i className="bi bi-apple" />
                </span>
                <span className="hp-store-badge-copy">
                  <small>Download on the</small>
                  <strong>App Store</strong>
                </span>
              </a>
            </div>
          </div>
          <div className="col-6 col-lg-3">
            <h5>Pages</h5>
            <ul className="list-unstyled">
              <li className="mb-2">
                <Link to="/">Home</Link>
              </li>
              <li className="mb-2">
                <Link to="/about">About us</Link>
              </li>
              <li className="mb-2">
                <Link to="/kitchens">Kitchens</Link>
              </li>
              <li className="mb-2">
                <Link to="/how-it-works">How it works</Link>
              </li>
              <li className="mb-2">
                <Link to="/blog">Blog</Link>
              </li>
              <li className="mb-2">
                <Link to="/wishlist">Wishlist</Link>
              </li>
              <li className="mb-2">
                <Link to="/contact">Contact us</Link>
              </li>
            </ul>
          </div>
          <div className="col-6 col-lg-4">
            <h5>Get started</h5>
            <p>Explore home kitchens nearby and order homemade meals.</p>
            <div className="d-flex flex-wrap gap-2 hp-footer-actions">
              <Link to="/kitchens" className="hp-btn hp-btn--primary hp-btn--sm">
                Browse kitchens
              </Link>
              <Link to="/seller/signup" className="hp-btn hp-btn--sm hp-footer-seller-btn">
                Sign up as seller
              </Link>
            </div>
          </div>
        </div>
        <div className="hp-footer-bottom">
          © {new Date().getFullYear()} Made by Maa. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
