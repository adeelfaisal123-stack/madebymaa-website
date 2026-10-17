import { Link, useNavigate } from 'react-router-dom'
import { signOutCustomer } from '../lib/authSession'
import { confirmAction, toastSuccess } from '../lib/swal'
import { useSessionStore } from '../stores'
import './AppHeader.css'

export function AppHeader() {
  const navigate = useNavigate()
  const session = useSessionStore((s) => s.session)

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
    <header className="app-header">
      <div className="app-header-inner">
        <Link to="/" className="app-header-logo" aria-label="Made by Maa home">
          <img src="/images/made_by_maa_logo.png" alt="Made by Maa" className="maa-logo-img" />
        </Link>

        <div className="app-header-auth">
          {session ? (
            <>
              <Link to="/profile" className="app-header-link">
                {session.name.split(' ')[0]}
              </Link>
              <button type="button" className="app-header-btn" onClick={signOut}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="app-header-link">
                Sign in
              </Link>
              <Link to="/register" className="app-header-btn app-header-btn--primary">
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
