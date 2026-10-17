import { initializeApp, getApps, type FirebaseApp } from 'firebase/app'
import { getAnalytics, isSupported, type Analytics } from 'firebase/analytics'
import {
  browserLocalPersistence,
  getAuth,
  setPersistence,
  type Auth,
} from 'firebase/auth'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string | undefined,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string | undefined,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string | undefined,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string | undefined,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID as string | undefined,
}

export function isFirebaseConfigured() {
  return Boolean(
    firebaseConfig.apiKey &&
      firebaseConfig.authDomain &&
      firebaseConfig.projectId &&
      firebaseConfig.appId &&
      !String(firebaseConfig.appId).includes('REPLACE'),
  )
}

let app: FirebaseApp | null = null
let auth: Auth | null = null
let analytics: Analytics | null = null
let analyticsStarted = false

export function getFirebaseApp(): FirebaseApp {
  if (!isFirebaseConfigured()) {
    throw new Error(
      'Firebase Web is not configured. Add VITE_FIREBASE_* keys to website/.env.',
    )
  }
  if (!app) {
    app = getApps().length ? getApps()[0]! : initializeApp(firebaseConfig)
    void startAnalytics(app)
  }
  return app
}

async function startAnalytics(firebaseApp: FirebaseApp) {
  if (analyticsStarted || !firebaseConfig.measurementId) return
  analyticsStarted = true
  try {
    if (await isSupported()) {
      analytics = getAnalytics(firebaseApp)
    }
  } catch {
    /* Analytics is optional */
  }
}

export function getFirebaseAuth(): Auth {
  if (!auth) {
    auth = getAuth(getFirebaseApp())
    // Keep Firebase signed in across refreshes until explicit sign-out.
    void setPersistence(auth, browserLocalPersistence).catch(() => {
      /* ignore — default is already local in most browsers */
    })
  }
  return auth
}

export function getFirebaseAnalytics(): Analytics | null {
  getFirebaseApp()
  return analytics
}
