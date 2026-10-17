import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { checkPhone, completeSession } from '../api/optica2'
import { CountryDialSelect } from '../components/CountryDialSelect'
import { HomeNav } from '../components/HomeNav'
import { INDIA, type CountryDialCode } from '../data/countryDialCodes'
import { isFirebaseConfigured } from '../lib/firebase'
import {
  clearPhoneRecaptcha,
  confirmFirebasePhoneOtp,
  FIREBASE_SEND_OTP_BUTTON_ID,
  isLocalhostHost,
  sendFirebasePhoneOtp,
} from '../lib/firebasePhoneAuth'
import { toastError, toastSuccess, toastWarning } from '../lib/swal'
import { useLocationStore, useSessionHydrated, useSessionStore } from '../stores'
import { detectCountryDialCode, isValidNationalPhone, normalizePhone } from '../utils'
import './homepage.css'
import './auth.css'

type Step = 'phone' | 'otp' | 'name'

export function LoginPage({ mode = 'login' }: { mode?: 'login' | 'register' }) {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const setSession = useSessionStore((s) => s.setSession)
  const session = useSessionStore((s) => s.session)
  const sessionHydrated = useSessionHydrated()
  const savedLat = useLocationStore((s) => s.lat)
  const savedLng = useLocationStore((s) => s.lng)
  const paramMode = params.get('mode')
  const isRegister = mode === 'register' || paramMode === 'register'

  const [step, setStep] = useState<Step>('phone')
  const [country, setCountry] = useState<CountryDialCode>(INDIA)
  const [detectingCountry, setDetectingCountry] = useState(true)
  const [nationalPhone, setNationalPhone] = useState('')
  const [e164Phone, setE164Phone] = useState('')
  const [otp, setOtp] = useState('')
  const [name, setName] = useState('')
  const [isNew, setIsNew] = useState(isRegister)
  const [loading, setLoading] = useState(false)
  const [resendSeconds, setResendSeconds] = useState(0)
  const [error, setError] = useState('')
  const [firebaseReady] = useState(() => isFirebaseConfigured())
  const countryTouched = useRef(false)
  const phoneVerified = useRef(false)

  const nextPath = params.get('next') || '/profile'

  useEffect(() => {
    if (!sessionHydrated) return
    if (session) navigate(nextPath, { replace: true })
  }, [session, sessionHydrated, navigate, nextPath])

  useEffect(() => {
    setStep('phone')
    setOtp('')
    setName('')
    setError('')
    setIsNew(isRegister)
    phoneVerified.current = false
    clearPhoneRecaptcha()
  }, [isRegister])

  useEffect(() => {
    return () => clearPhoneRecaptcha()
  }, [])

  useEffect(() => {
    if (resendSeconds <= 0) return
    const t = window.setTimeout(() => setResendSeconds((s) => s - 1), 1000)
    return () => window.clearTimeout(t)
  }, [resendSeconds])

  useEffect(() => {
    let cancelled = false
    setDetectingCountry(true)
    void (async () => {
      try {
        const detected = await detectCountryDialCode({ lat: savedLat, lng: savedLng })
        if (!cancelled && !countryTouched.current) {
          setCountry(detected)
        }
      } finally {
        if (!cancelled) setDetectingCountry(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [savedLat, savedLng])

  const onCountryChange = (next: CountryDialCode) => {
    countryTouched.current = true
    setCountry(next)
  }

  const startResendCooldown = () => setResendSeconds(45)

  const continuePhone = async () => {
    if (!firebaseReady) {
      setError(
        'Firebase Web is not configured. Add VITE_FIREBASE_* keys (including a Web app ID) to website/.env.',
      )
      return
    }
    if (!isValidNationalPhone(nationalPhone, country)) {
      setError(`Enter a valid ${country.name} phone number`)
      return
    }
    const e164 = normalizePhone(nationalPhone, country)
    setLoading(true)
    setError('')
    phoneVerified.current = false
    try {
      const check = await checkPhone(e164)
      if (check.isBlocked || !check.canLogin) {
        setError(check.message || 'This number cannot sign in.')
        return
      }

      if (isRegister && check.exists) {
        setError('An account already exists with this number. Sign in instead.')
        setIsNew(false)
        return
      }

      setIsNew(!check.exists)

      await sendFirebasePhoneOtp(e164)
      setE164Phone(e164)
      setOtp('')
      setStep('otp')
      startResendCooldown()
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Could not send OTP'
      setError(message)
      toastError(message)
    } finally {
      setLoading(false)
    }
  }

  const resendOtp = async () => {
    if (resendSeconds > 0 || !e164Phone) return
    setLoading(true)
    setError('')
    try {
      await sendFirebasePhoneOtp(e164Phone)
      setOtp('')
      startResendCooldown()
      toastSuccess('OTP resent')
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Could not resend OTP'
      setError(message)
      toastError(message)
    } finally {
      setLoading(false)
    }
  }

  const continueOtp = async () => {
    if (otp.trim().length < 6) {
      setError('Enter the 6-digit OTP code')
      toastWarning('Enter the 6-digit OTP code')
      return
    }
    setLoading(true)
    setError('')
    try {
      const verified = await confirmFirebasePhoneOtp(otp)
      const phone = verified.phone || e164Phone
      setE164Phone(phone)
      phoneVerified.current = true

      if (isNew || isRegister) {
        setStep('name')
        return
      }
      await finishSession(phone)
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Invalid OTP'
      setError(message)
      toastError(message)
    } finally {
      setLoading(false)
    }
  }

  const finishSession = async (phone = e164Phone, displayName?: string) => {
    const result = await completeSession(phone, displayName)
    setSession(result)
    toastSuccess(displayName ? 'Welcome to Made by Maa' : 'Signed in successfully')
    navigate(nextPath, { replace: true })
  }

  const finishRegistration = async () => {
    if (!name.trim()) {
      setError('Please enter your name')
      toastWarning('Please enter your name')
      return
    }
    if (!phoneVerified.current) {
      setError('Verify your phone number first.')
      toastWarning('Verify your phone number first.')
      setStep('otp')
      return
    }
    setLoading(true)
    setError('')
    try {
      await finishSession(e164Phone, name.trim())
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Could not create account'
      setError(message)
      toastError(message)
    } finally {
      setLoading(false)
    }
  }

  const resetToPhone = () => {
    clearPhoneRecaptcha()
    phoneVerified.current = false
    setStep('phone')
    setOtp('')
    setError('')
    setResendSeconds(0)
  }

  const nextQuery = params.get('next')
  const switchHref = isRegister
    ? `/login${nextQuery ? `?next=${encodeURIComponent(nextQuery)}` : ''}`
    : `/register${nextQuery ? `?next=${encodeURIComponent(nextQuery)}` : ''}`

  const phonePlaceholder = 'X'.repeat(country.nationalLength)
  const heroImage = isRegister
    ? '/images/cartoons/cartoon-cta.png'
    : '/images/cartoons/cartoon-hero.png'
  const heroAlt = isRegister
    ? 'Maa chef celebrating homemade food'
    : 'Maa chef with homemade food delivery'

  return (
    <div className={`homepage auth-page${isRegister ? ' is-register' : ' is-login'}`}>
      <div className="auth-bg" aria-hidden>
        <img key={heroImage} src={heroImage} alt="" />
        <div className="auth-bg-shade" />
      </div>

      <HomeNav />
      <div id="firebase-recaptcha" />

      <div className="auth-shell">
        <div className="auth-card">
          <div className="auth-tabs" role="tablist">
            <Link
              to={nextQuery ? `/login?next=${encodeURIComponent(nextQuery)}` : '/login'}
              className={`auth-tab${!isRegister ? ' is-active' : ''}`}
              role="tab"
              aria-selected={!isRegister}
            >
              Sign in
            </Link>
            <Link
              to={nextQuery ? `/register?next=${encodeURIComponent(nextQuery)}` : '/register'}
              className={`auth-tab${isRegister ? ' is-active' : ''}`}
              role="tab"
              aria-selected={isRegister}
            >
              Register
            </Link>
          </div>

          <header className="auth-header">
            <h1>{isRegister ? 'Create your account' : 'Welcome back'}</h1>
            <p className="auth-lead">
              {isRegister ? 'Sign up with your phone number' : 'Sign in with your phone number'}
            </p>
          </header>

          {!firebaseReady && (
            <div className="error-banner" role="alert">
              Firebase Web config is missing. Set <code>VITE_FIREBASE_*</code> in{' '}
              <code>website/.env</code>.
            </div>
          )}

          {firebaseReady && isLocalhostHost() && (
            <div className="error-banner" role="alert">
              Use <a href="http://127.0.0.1:5173/login">127.0.0.1</a> instead of localhost for
              Firebase OTP, and authorize that domain in Firebase Console.
            </div>
          )}

          {error && (
            <div className="error-banner" role="alert">
              {error}
              {error.includes('already exists') && (
                <>
                  {' '}
                  <Link to={switchHref}>Go to sign in</Link>
                </>
              )}
            </div>
          )}

          <div className="auth-body">
            {step === 'phone' && (
              <>
                <div className="auth-field">
                  <label className="field-label" htmlFor="phone">
                    Phone number
                  </label>
                  <div className="auth-phone-row">
                    <CountryDialSelect
                      value={country}
                      onChange={onCountryChange}
                      disabled={loading}
                      detecting={detectingCountry}
                    />
                    <input
                      id="phone"
                      className="text-field auth-phone-input"
                      value={nationalPhone}
                      onChange={(e) => setNationalPhone(e.target.value.replace(/[^\d\s-]/g, ''))}
                      placeholder={phonePlaceholder}
                      inputMode="tel"
                      autoComplete="tel-national"
                      maxLength={country.nationalLength + 4}
                    />
                  </div>
                </div>
                <button
                  type="button"
                  id={FIREBASE_SEND_OTP_BUTTON_ID}
                  className="hp-btn hp-btn--primary auth-submit"
                  disabled={loading || !firebaseReady || isLocalhostHost()}
                  onClick={continuePhone}
                >
                  {loading ? 'Sending OTP…' : 'Send OTP'}
                </button>
              </>
            )}

            {step === 'otp' && (
              <>
                <div className="auth-field">
                  <label className="field-label" htmlFor="otp">
                    OTP sent to {e164Phone}
                  </label>
                  <input
                    id="otp"
                    className="text-field"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="6-digit code"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                  />
                </div>
                <button
                  type="button"
                  className="hp-btn hp-btn--primary auth-submit"
                  disabled={loading || otp.length < 6}
                  onClick={continueOtp}
                >
                  {loading ? 'Verifying…' : 'Verify OTP'}
                </button>
                <div className="auth-actions-extra">
                  <button
                    type="button"
                    className="auth-back"
                    disabled={loading || resendSeconds > 0}
                    onClick={resendOtp}
                  >
                    {resendSeconds > 0 ? `Resend OTP in ${resendSeconds}s` : 'Resend OTP'}
                  </button>
                  <button type="button" className="auth-back" onClick={resetToPhone}>
                    Use a different number
                  </button>
                </div>
              </>
            )}

            {step === 'name' && (
              <>
                <div className="auth-field">
                  <label className="field-label" htmlFor="name">
                    Your name
                  </label>
                  <input
                    id="name"
                    className="text-field"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="How should we call you?"
                    autoComplete="name"
                  />
                </div>
                <button
                  type="button"
                  className="hp-btn hp-btn--primary auth-submit"
                  disabled={loading || !name.trim()}
                  onClick={finishRegistration}
                >
                  {loading ? 'Creating account…' : 'Complete registration'}
                </button>
              </>
            )}
          </div>

          <div className="auth-footer-links">
            <p className="auth-switch">
              {isRegister ? (
                <>
                  Have an account? <Link to={switchHref}>Sign in</Link>
                </>
              ) : (
                <>
                  New here? <Link to={switchHref}>Register</Link>
                </>
              )}
            </p>
            <p className="auth-switch">
              Want to cook with us? <Link to="/seller/signup">Sign up as a seller</Link>
            </p>
            <p className="auth-browse">
              <Link to="/">Browse kitchens</Link>
            </p>
          </div>
        </div>
      </div>

      <span className="visually-hidden">{heroAlt}</span>
    </div>
  )
}
