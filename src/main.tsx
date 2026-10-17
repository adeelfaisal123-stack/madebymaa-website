import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-icons/font/bootstrap-icons.css'
import './components/cards.css'
import './theme.css'
import './lib/swal.css'

/**
 * Keep local dev on one origin so login (localStorage) and Firebase Phone Auth
 * stay in sync. `localhost` and `127.0.0.1` are different origins.
 */
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
  const url = new URL(window.location.href)
  url.hostname = '127.0.0.1'
  window.location.replace(url.toString())
} else {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}
