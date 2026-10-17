import { signOutFirebase } from './firebasePhoneAuth'
import { useCartStore, useSessionStore } from '../stores'

/**
 * Only call this from an explicit Sign out / Logout control.
 * Customer session is persisted in localStorage and must survive refresh
 * and navigation until the user chooses to leave.
 */
export async function signOutCustomer(opts?: { clearCart?: boolean }) {
  useSessionStore.getState().setSession(null)
  if (opts?.clearCart) {
    useCartStore.getState().clear()
  }
  await signOutFirebase()
}
