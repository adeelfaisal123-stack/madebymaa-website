import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signOut,
  type ConfirmationResult,
} from 'firebase/auth'
import { getFirebaseAuth, isFirebaseConfigured } from './firebase'

export const FIREBASE_SEND_OTP_BUTTON_ID = 'firebase-send-otp-btn'
export const FIREBASE_RECAPTCHA_CONTAINER_ID = 'firebase-recaptcha'

let verifier: RecaptchaVerifier | null = null
let confirmation: ConfirmationResult | null = null

/** Firebase Phone Auth rejects `localhost` (INVALID_APP_CREDENTIAL). Use 127.0.0.1 instead. */
export function isLocalhostHost() {
  if (typeof window === 'undefined') return false
  return window.location.hostname === 'localhost'
}

export function assertPhoneAuthHostAllowed() {
  if (!isLocalhostHost()) return
  throw new Error(
    'Firebase Phone Auth does not work on localhost. Open http://127.0.0.1:5173/login instead, and add 127.0.0.1 under Firebase Console → Authentication → Settings → Authorized domains.',
  )
}

export function clearPhoneRecaptcha() {
  try {
    verifier?.clear()
  } catch {
    /* already cleared */
  }
  verifier = null
  const el = document.getElementById(FIREBASE_RECAPTCHA_CONTAINER_ID)
  if (el) el.replaceChildren()
}

function createInvisibleVerifier() {
  const auth = getFirebaseAuth()
  const button = document.getElementById(FIREBASE_SEND_OTP_BUTTON_ID)
  // Prefer binding invisible reCAPTCHA to the send button (Firebase docs).
  const container = button ?? FIREBASE_RECAPTCHA_CONTAINER_ID

  verifier = new RecaptchaVerifier(auth, container, {
    size: 'invisible',
    callback: () => {
      /* solved */
    },
    'expired-callback': () => {
      clearPhoneRecaptcha()
    },
  })
  return verifier
}

export async function sendFirebasePhoneOtp(phoneE164: string) {
  if (!isFirebaseConfigured()) {
    throw new Error(
      'Firebase Web is not configured. Add VITE_FIREBASE_* keys to website/.env.',
    )
  }

  assertPhoneAuthHostAllowed()

  clearPhoneRecaptcha()
  confirmation = null

  const auth = getFirebaseAuth()
  auth.useDeviceLanguage()

  const appVerifier = createInvisibleVerifier()
  await appVerifier.render()

  try {
    confirmation = await signInWithPhoneNumber(auth, phoneE164, appVerifier)
  } catch (error) {
    clearPhoneRecaptcha()
    throw mapFirebaseAuthError(error)
  }
}

export async function confirmFirebasePhoneOtp(code: string) {
  if (!confirmation) {
    throw new Error('No verification in progress. Send the OTP again.')
  }

  try {
    const result = await confirmation.confirm(code.trim())
    confirmation = null
    clearPhoneRecaptcha()
    return {
      phone: result.user.phoneNumber ?? '',
      uid: result.user.uid,
    }
  } catch (error) {
    throw mapFirebaseAuthError(error)
  }
}

export async function signOutFirebase() {
  if (!isFirebaseConfigured()) return
  try {
    await signOut(getFirebaseAuth())
  } catch {
    /* ignore */
  }
  confirmation = null
  clearPhoneRecaptcha()
}

export function mapFirebaseAuthError(error: unknown): Error {
  const code =
    error && typeof error === 'object' && 'code' in error
      ? String((error as { code: unknown }).code)
      : ''
  const message =
    error && typeof error === 'object' && 'message' in error
      ? String((error as { message: unknown }).message)
      : ''

  const raw = `${code} ${message}`.toUpperCase()
  if (
    code === 'auth/invalid-app-credential' ||
    raw.includes('INVALID_APP_CREDENTIAL')
  ) {
    if (isLocalhostHost()) {
      return new Error(
        'Firebase rejected this request on localhost. Use http://127.0.0.1:5173 and add 127.0.0.1 to Authorized domains in Firebase Console.',
      )
    }
    return new Error(
      'Firebase app credential is invalid. Confirm Phone sign-in is enabled, this domain is authorized, and SMS region policy allows your country (Authentication → Settings).',
    )
  }

  switch (code) {
    case 'auth/invalid-phone-number':
      return new Error('Enter a valid phone number.')
    case 'auth/too-many-requests':
      return new Error('Too many attempts. Please try again later.')
    case 'auth/code-expired':
      return new Error('This code has expired. Request a new OTP.')
    case 'auth/invalid-verification-code':
      return new Error('Invalid OTP code. Please check and try again.')
    case 'auth/missing-verification-code':
      return new Error('Enter the OTP code from SMS.')
    case 'auth/captcha-check-failed':
      return new Error('Security check failed. Refresh the page and try again.')
    case 'auth/quota-exceeded':
      return new Error('SMS quota exceeded. Please try again later.')
    case 'auth/operation-not-allowed':
      return new Error('Phone sign-in is disabled in Firebase Console.')
    case 'auth/unauthorized-domain':
      return new Error(
        'This domain is not authorized for Firebase Auth. Add it in Firebase Console → Authentication → Settings → Authorized domains.',
      )
    default:
      if (message)
        return new Error(
          message.replace(/^Firebase:\s*/i, '').split('(')[0]?.trim() || message,
        )
      return new Error('Could not verify phone number.')
  }
}
