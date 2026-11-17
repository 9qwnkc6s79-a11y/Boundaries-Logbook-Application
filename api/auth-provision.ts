/**
 * First-login / password-repair bridge. Legacy login stays the source of
 * truth until Firebase Auth import is verified.
 *
 * POST /api/auth-provision   { email, password }
 *
 * The server re-checks the password against the stored hash (or plaintext
 * leftover) with the Admin SDK. It never trusts the client. On success it
 * creates or updates the Firebase Auth user and sets role/store claims.
 *
 * 503 when no service account is configured — the client keeps the legacy
 * session. This route does not read or write production unless the caller
 * invokes it; shipping the file does not migrate anyone.
 */

import { createHash, timingSafeEqual } from 'node:crypto';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyPassword } from '../utils/passwordUtils';
import { claimsForUser } from '../utils/authImportPlan';
import { loadServiceAccountFromEnv } from '../utils/firebaseAdminApp';

export const config = { maxDuration: 30 };

const ORG_ID = process.env.AUTH_ORG_ID || process.env.LOGBOOK_EXPORT_ORG_ID || 'org-boundaries';

type UserRow = {
  id?: string;
  email?: string;
  password?: string;
  role?: string;
  storeId?: string;
  active?: boolean;
  orgId?: string;
  name?: string;
};

function headerValue(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] || '';
  return value || '';
}

export function sameSecret(presented: string, expected: string | undefined): boolean {
  if (!expected) return true;
  const a = createHash('sha256').update(presented).digest();
  const b = createHash('sha256').update(expected).digest();
  return timingSafeEqual(a, b);
}

export async function pickUser(email: string, docUsers: UserRow[], arrayUsers: UserRow[]): Promise<UserRow | null> {
  const needle = email.trim().toLowerCase();
  const fromDoc = docUsers.find(u => (u.email || '').toLowerCase() === needle);
  const fromArray = arrayUsers.find(u => (u.email || '').toLowerCase() === needle);
  if (fromDoc && fromArray) {
    return {
      ...fromArray,
      ...fromDoc,
      password: fromDoc.password || fromArray.password,
    };
  }
  return fromDoc || fromArray || null;
}

async function adminApp() {
  const account = loadServiceAccountFromEnv();
  if (!account) return null;
  const admin = await import('firebase-admin');
  const existing = admin.apps.find(app => app?.name === 'auth-provision');
  if (existing) return existing;
  return admin.initializeApp({
    credential: admin.credential.cert(account as any),
    projectId: account.project_id || 'boundaries-logbook-app',
  }, 'auth-provision');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const provisionSecret = process.env.AUTH_PROVISION_SECRET;
  if (provisionSecret) {
    const presented = headerValue(req.headers['x-auth-provision-secret']);
    if (!sameSecret(presented, provisionSecret)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const app = await adminApp();
  if (!app) {
    return res.status(503).json({
      error: 'Firebase Admin is not configured. Legacy login is unchanged.',
      code: 'admin-not-configured',
    });
  }

  const admin = await import('firebase-admin');
  const db = admin.firestore(app);
  const [docSnap, arraySnap] = await Promise.all([
    db.collection(`organizations/${ORG_ID}/users`).get(),
    db.doc(`organizations/${ORG_ID}/data/users`).get(),
  ]);
  const docUsers = docSnap.docs.map(d => d.data() as UserRow);
  const arrayUsers = Array.isArray(arraySnap.data()?.data) ? arraySnap.data()!.data as UserRow[] : [];
  const user = await pickUser(email, docUsers, arrayUsers);
  if (!user || !user.password) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const match = await verifyPassword(password, user.password);
  if (!match) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  if (user.active === false) {
    return res.status(403).json({ error: 'Account deactivated' });
  }
  if (!user.id) {
    return res.status(409).json({ error: 'User record has no id' });
  }

  const claims = claimsForUser(user, ORG_ID);
  const auth = admin.auth(app);
  let action: 'created' | 'updated' = 'updated';
  try {
    await auth.getUser(user.id);
    await auth.updateUser(user.id, {
      email,
      password,
      emailVerified: true,
      disabled: false,
      displayName: user.name || undefined,
    });
  } catch (error: any) {
    if (error?.code !== 'auth/user-not-found') {
      console.error('[auth-provision] lookup failed', error?.code || 'unknown');
      return res.status(500).json({ error: 'Could not update Auth user' });
    }
    await auth.createUser({
      uid: user.id,
      email,
      password,
      emailVerified: true,
      disabled: false,
      displayName: user.name || undefined,
    });
    action = 'created';
  }
  await auth.setCustomUserClaims(user.id, claims);
  return res.status(200).json({ ok: true, action, uid: user.id });
}
