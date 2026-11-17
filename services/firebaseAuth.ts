/**
 * Firebase Auth client helpers. Every function no-ops unless
 * VITE_FIREBASE_AUTH_ENABLED is on, so a build with the flag off
 * behaves like today's custom login.
 */

import { isFirebaseAuthEnabled } from '../utils/authMode';

declare const firebase: any;

export function firebaseAuthReady(): boolean {
  return isFirebaseAuthEnabled() && typeof firebase !== 'undefined' && typeof firebase.auth === 'function';
}

export function whenFirebaseReady(): Promise<void> {
  if (!firebaseAuthReady()) return Promise.resolve();
  return new Promise((resolve) => {
    const unsub = firebase.auth().onAuthStateChanged(() => {
      unsub();
      resolve();
    });
  });
}

export function hasFirebaseSession(): boolean {
  if (!firebaseAuthReady()) return false;
  return !!firebase.auth().currentUser;
}

export async function signOutFirebase(): Promise<void> {
  if (!firebaseAuthReady()) return;
  try {
    await firebase.auth().signOut();
  } catch (error) {
    console.warn('[Auth] Firebase sign-out failed', error);
  }
}

export type FirebaseSignInResult = 'signed-in' | 'fallback' | 'unavailable';

/**
 * Try Firebase Auth. Any failure returns 'fallback' so the caller can
 * keep the legacy password check. A bad import must not lock staff out.
 */
export async function signInWithFirebaseEmail(email: string, password: string): Promise<FirebaseSignInResult> {
  if (!firebaseAuthReady()) return 'unavailable';
  try {
    await firebase.auth().signInWithEmailAndPassword(email.trim(), password);
    return 'signed-in';
  } catch (error: any) {
    const code = error?.code || 'unknown';
    console.warn(`[Auth] Firebase sign-in did not succeed (${code}). Legacy login remains available.`);
    if (code === 'auth/network-request-failed') return 'unavailable';
    return 'fallback';
  }
}

export interface ProvisionResult {
  ok: boolean;
  status: number;
  fatal: boolean;
  message: string;
}

/**
 * Ask the server to create or refresh the Auth user from a password the
 * legacy check already accepted. 503 (no service account yet) is not fatal:
 * the staff member stays logged in on the legacy path.
 */
export async function provisionFirebaseAuth(email: string, password: string): Promise<ProvisionResult> {
  if (!isFirebaseAuthEnabled()) {
    return { ok: false, status: 0, fatal: false, message: 'flag off' };
  }
  try {
    const response = await fetch('/api/auth-provision', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const body = await response.json().catch(() => ({}));
    const message = typeof body?.error === 'string' ? body.error : response.statusText;
    if (response.ok) {
      return { ok: true, status: response.status, fatal: false, message: body?.action || 'ok' };
    }
    const fatal = response.status === 401 || response.status === 400;
    return { ok: false, status: response.status, fatal, message };
  } catch (error: any) {
    return { ok: false, status: 0, fatal: false, message: error?.message || 'network' };
  }
}
