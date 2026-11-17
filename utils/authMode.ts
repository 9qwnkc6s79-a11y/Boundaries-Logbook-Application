/**
 * Dual-path switch for Firebase Auth.
 *
 * Default is OFF. With the flag unset, login stays on the existing
 * email + hashed-password check and this module never touches Firebase Auth.
 * Turn it on only after the dry-run import has been reviewed:
 *   VITE_FIREBASE_AUTH_ENABLED=true
 *
 * Firestore/Storage enforcement is a SEPARATE switch
 * (organizations/{orgId}/config/security.enforceAuth). Leaving this flag
 * on while enforcement is off keeps legacy login working. Turning
 * enforcement on before this flag is verified will lock staff out.
 */

export function isFirebaseAuthEnabled(): boolean {
  try {
    const viteEnv = typeof import.meta !== 'undefined'
      ? (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env
      : undefined;
    const fromVite = viteEnv?.VITE_FIREBASE_AUTH_ENABLED;
    const fromProcess =
      typeof process !== 'undefined' && process.env
        ? process.env.VITE_FIREBASE_AUTH_ENABLED
        : undefined;
    const raw = (fromVite ?? fromProcess ?? '').toString().trim().toLowerCase();
    return raw === 'true' || raw === '1' || raw === 'yes';
  } catch {
    return false;
  }
}
