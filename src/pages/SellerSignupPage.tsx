import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { checkSellerPhone, registerSeller } from '../api/seller'
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
import { useLocationStore } from '../stores'
import { detectCountryDialCode, isValidNationalPhone, normalizePhone } from '../utils'
import './homepage.css'
import './auth.css'
import './seller-signup.css'

type Step = 'phone' | 'otp' | 'details' | 'done'

export function SellerSignupPage() {
  const savedLat = useLocationStore((s) => s.lat)
  const savedLng = useLocationStore((s) => s.lng)

  const [step, setStep] = useState<Step>('phone')
  const [country, setCountry] = useState<CountryDialCode>(INDIA)
  const [detectingCountry, setDetectingCountry] = useState(true)
  const [nationalPhone, setNationalPhone] = useState('')
  const [e164Phone, setE164Phone] = useState('')
  const [otp, setOtp] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [loading, setLoading] = useState(false)
  const [resendSeconds, setResendSeconds] = useState(0)
  const [error, setError] = useState('')
  const [doneMessage, setDoneMessage] = useState('')
  const [firebaseReady] = useState(() => isFirebaseConfigured())
  const countryTouched = useRef(false)
  const phoneVerified = useRef(false)

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
        if (!cancelled && !countryTouched.current) setCountry(detected)
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
      const check = await checkSellerPhone(e164)
      if (check.exists) {
        if (check.kycAwaitingApproval || check.registrationStatus === 'pending') {
          setError(
            check.message ||
              'This number is already registered and waiting for admin approval. Open the seller app after approval.',
          )
          return
        }
        if (check.canLogin || check.kitchenSetupPending) {
          setError(
            check.message ||
              'This number is already a seller. Continue in the Made by Maa Seller app.',
          )
          return
        }
        setError(check.message || 'This number cannot be used for a new seller signup.')
        return
      }

      await sendFirebasePhoneOtp(e164)
      setE164Phone(e164)
      setStep('otp')
      startResendCooldown()
      toastSuccess('OTP sent')
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Could not send OTP'
      setError(message)
      toastError(message)
    } finally {
      setLoading(false)
    }
  }

  const continueOtp = async () => {
    if (otp.length < 6) {
      setError('Enter the 6-digit OTP code')
      toastWarning('Enter the 6-digit OTP code')
      return
    }
    setLoading(true)
    setError('')
    try {
      await confirmFirebasePhoneOtp(otp)
      phoneVerified.current = true
      setStep('details')
      toastSuccess('Phone verified')
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Invalid OTP'
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

  const submitDetails = async () => {
    if (!phoneVerified.current || !e164Phone) {
      setError('Verify your phone number first.')
      toastWarning('Verify your phone number first.')
      setStep('otp')
      return
    }
    if (!name.trim()) {
      setError('Enter your full name')
      return
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Enter a valid email address')
      return
    }
    if (!address.trim() || !city.trim() || !state.trim()) {
      setError('Fill in your address, city, and state')
      return
    }

    setLoading(true)
    setError('')
    try {
      const result = await registerSeller({
        phone: e164Phone,
        name: name.trim(),
        email: email.trim(),
        address: address.trim(),
        city: city.trim(),
        state: state.trim(),
        country: country.isoCode,
      })
      setDoneMessage(result.message)
      setStep('done')
      toastSuccess('Seller signup submitted')
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Could not complete signup'
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

  const phonePlaceholder = 'X'.repeat(country.nationalLength)

  return (
    <div className="homepage auth-page is-register seller-signup-page">
      <div className="auth-bg" aria-hidden>
        <img src="/images/cartoons/cartoon-kitchens.png" alt="" />
        <div className="auth-bg-shade" />
      </div>

      <HomeNav />
      <div id="firebase-recaptcha" />

      <div className="auth-shell">
        <div className="auth-card seller-signup-card">
          <p className="seller-signup-kicker">Home chefs</p>
          <header className="auth-header">
            <h1>{step === 'done' ? 'You are almost in' : 'Sign up as a seller'}</h1>
            <p className="auth-lead">
              {step === 'done'
                ? 'Our team will review your application soon.'
                : 'Share your kitchen with neighbours — start with a quick signup.'}
            </p>
          </header>

          {step !== 'done' && (
            <ol className="seller-signup-steps" aria-label="Signup progress">
              <li className={step === 'phone' || step === 'otp' ? 'is-current' : 'is-done'}>
                Phone
              </li>
              <li className={step === 'details' ? 'is-current' : ''}>Details</li>
              <li>Review</li>
            </ol>
          )}

          {!firebaseReady && (
            <div className="error-banner" role="alert">
              Firebase Web config is missing. Set <code>VITE_FIREBASE_*</code> in{' '}
              <code>website/.env</code>.
            </div>
          )}

          {firebaseReady && isLocalhostHost() && (
            <div className="error-banner" role="alert">
              Use <a href="http://127.0.0.1:5173/seller/signup">127.0.0.1</a> instead of localhost
              for Firebase OTP.
            </div>
          )}

          {error && (
            <div className="error-banner" role="alert">
              {error}
            </div>
          )}

          <div className="auth-body">
            {step === 'phone' && (
              <>
                <div className="auth-field">
                  <label className="field-label" htmlFor="seller-phone">
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
                      id="seller-phone"
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
                  onClick={() => void continuePhone()}
                >
                  {loading ? 'Sending OTP…' : 'Send OTP'}
                </button>
              </>
            )}

            {step === 'otp' && (
              <>
                <div className="auth-field">
                  <label className="field-label" htmlFor="seller-otp">
                    OTP sent to {e164Phone}
                  </label>
                  <input
                    id="seller-otp"
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
                  onClick={() => void continueOtp()}
                >
                  {loading ? 'Verifying…' : 'Verify OTP'}
                </button>
                <div className="auth-actions-extra">
                  <button
                    type="button"
                    className="auth-back"
                    disabled={loading || resendSeconds > 0}
                    onClick={() => void resendOtp()}
                  >
                    {resendSeconds > 0 ? `Resend OTP in ${resendSeconds}s` : 'Resend OTP'}
                  </button>
                  <button type="button" className="auth-back" onClick={resetToPhone}>
                    Use a different number
                  </button>
                </div>
              </>
            )}

            {step === 'details' && (
              <>
                <div className="seller-signup-grid">
                  <div className="auth-field">
                    <label className="field-label" htmlFor="seller-name">
                      Full name
                    </label>
                    <input
                      id="seller-name"
                      className="text-field"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      autoComplete="name"
                    />
                  </div>
                  <div className="auth-field">
                    <label className="field-label" htmlFor="seller-email">
                      Email
                    </label>
                    <input
                      id="seller-email"
                      className="text-field"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      autoComplete="email"
                    />
                  </div>
                  <div className="auth-field seller-signup-span">
                    <label className="field-label" htmlFor="seller-address">
                      Address
                    </label>
                    <input
                      id="seller-address"
                      className="text-field"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Street / landmark"
                      autoComplete="street-address"
                    />
                  </div>
                  <div className="auth-field">
                    <label className="field-label" htmlFor="seller-city">
                      City
                    </label>
                    <input
                      id="seller-city"
                      className="text-field"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="City"
                      autoComplete="address-level2"
                    />
                  </div>
                  <div className="auth-field">
                    <label className="field-label" htmlFor="seller-state">
                      State
                    </label>
                    <input
                      id="seller-state"
                      className="text-field"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      placeholder="State"
                      autoComplete="address-level1"
                    />
                  </div>
                </div>
                <p className="seller-signup-note">
                  Country set from your phone: <strong>{country.name}</strong> ({country.isoCode})
                </p>
                <button
                  type="button"
                  className="hp-btn hp-btn--primary auth-submit"
                  disabled={loading}
                  onClick={() => void submitDetails()}
                >
                  {loading ? 'Submitting…' : 'Submit seller application'}
                </button>
              </>
            )}

            {step === 'done' && (
              <div className="seller-signup-done">
                <div className="seller-signup-done-icon" aria-hidden>
                  <i className="bi bi-check2-circle" />
                </div>
                <p>{doneMessage || 'Signup completed. Please wait for admin approval.'}</p>
                <ul>
                  <li>We review every home kitchen before it goes live.</li>
                  <li>After approval, finish kitchen setup in the Seller app.</li>
                  <li>You’ll use the same phone number to sign in.</li>
                </ul>
                <div className="seller-signup-done-actions">
                  <Link to="/" className="hp-btn hp-btn--primary">
                    Back to home
                  </Link>
                  <Link to="/contact" className="hp-btn hp-btn--ghost">
                    Contact support
                  </Link>
                </div>
              </div>
            )}
          </div>

          {step !== 'done' && (
            <div className="auth-footer-links">
              <p className="auth-switch">
                Ordering food? <Link to="/register">Sign up as a customer</Link>
              </p>
              <p className="auth-browse">
                <Link to="/">Browse kitchens</Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
