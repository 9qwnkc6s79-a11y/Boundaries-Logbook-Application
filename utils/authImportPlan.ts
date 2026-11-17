/**
 * Plan a Firebase Auth import from the existing user records.
 *
 * Stored passwords look like `$sha256$<salt_hex>$<hash_hex>` where
 * hash = SHA-256(salt_bytes || utf8(password)) and the salt is 16 raw bytes.
 * Firebase Auth's SHA256 importer uses that same construction when rounds = 1
 * (salt is prepended once; extra rounds re-hash the digest only).
 * Plaintext leftovers cannot be imported; those accounts use the first-login
 * provision endpoint, which creates the Auth user from the password the
 * staff member just typed after the legacy check succeeds.
 */

import { UserRole } from '../types';
import { isHashed } from './passwordUtils';

export const AUTH_HASH_ALGORITHM = 'SHA256';
export const AUTH_HASH_ROUNDS = 1;
export const HASH_PREFIX = '$sha256$';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UID_RE = /^[A-Za-z0-9_-]{1,128}$/;

export interface AuthSourceUser {
  id?: string;
  name?: string;
  email?: string;
  password?: string;
  role?: string;
  storeId?: string;
  active?: boolean;
  orgId?: string;
}

export type AuthImportAction = 'import-sha256' | 'first-login' | 'skip';

export interface AuthImportRow {
  email: string;
  uid: string;
  userId: string;
  name: string;
  role: string;
  storeId: string;
  orgId: string;
  disabled: boolean;
  action: AuthImportAction;
  reason: string;
  /** Present only for import-sha256. Callers must not print this. */
  passwordHashHex?: string;
  passwordSaltHex?: string;
}

export interface AuthImportPlan {
  rows: AuthImportRow[];
  summary: {
    total: number;
    importSha256: number;
    firstLogin: number;
    skip: number;
    disabled: number;
    duplicateEmails: number;
    plaintext: number;
    missingPassword: number;
  };
}

export interface ParsedSha256Password {
  saltHex: string;
  hashHex: string;
}

export function parseSha256Password(stored: string): ParsedSha256Password | null {
  if (!stored || !stored.startsWith(HASH_PREFIX)) return null;
  const parts = stored.split('$');
  // ['', 'sha256', saltHex, hashHex]
  if (parts.length !== 4 || parts[1] !== 'sha256') return null;
  const saltHex = parts[2];
  const hashHex = parts[3];
  if (!/^[0-9a-f]+$/i.test(saltHex) || saltHex.length !== 32) return null;
  if (!/^[0-9a-f]+$/i.test(hashHex) || hashHex.length !== 64) return null;
  return { saltHex: saltHex.toLowerCase(), hashHex: hashHex.toLowerCase() };
}

export function claimsForUser(user: AuthSourceUser, orgId: string) {
  const role = Object.values(UserRole).includes(user.role as UserRole)
    ? (user.role as string)
    : UserRole.TRAINEE;
  return {
    role,
    storeId: (user.storeId || '').trim(),
    userId: (user.id || '').trim(),
    orgId: (user.orgId || orgId || 'org-boundaries').trim(),
  };
}

export function planAuthImport(users: AuthSourceUser[], orgId = 'org-boundaries'): AuthImportPlan {
  const seen = new Map<string, number>();
  const rows: AuthImportRow[] = [];
  let duplicateEmails = 0;
  let plaintext = 0;
  let missingPassword = 0;

  for (const user of users || []) {
    const email = (user.email || '').trim().toLowerCase();
    const uid = (user.id || '').trim();
    const base = {
      email,
      uid,
      userId: uid,
      name: (user.name || '').trim(),
      role: claimsForUser(user, orgId).role,
      storeId: (user.storeId || '').trim(),
      orgId: claimsForUser(user, orgId).orgId,
      disabled: user.active === false,
    };

    if (!email || !EMAIL_RE.test(email)) {
      rows.push({ ...base, action: 'skip', reason: 'missing or invalid email' });
      continue;
    }
    if (!uid || !UID_RE.test(uid)) {
      rows.push({ ...base, action: 'skip', reason: 'user id is not a valid Firebase uid' });
      continue;
    }
    const prior = seen.get(email) || 0;
    seen.set(email, prior + 1);
    if (prior > 0) {
      duplicateEmails++;
      rows.push({ ...base, action: 'skip', reason: 'duplicate email — not imported' });
      continue;
    }
    if (!user.password) {
      missingPassword++;
      rows.push({ ...base, action: 'first-login', reason: 'no stored password — first successful legacy login will create Auth' });
      continue;
    }
    if (!isHashed(user.password)) {
      plaintext++;
      rows.push({ ...base, action: 'first-login', reason: 'plaintext password cannot be imported; first login will create Auth' });
      continue;
    }
    const parsed = parseSha256Password(user.password);
    if (!parsed) {
      rows.push({ ...base, action: 'first-login', reason: 'hash format is not $sha256$salt$hash — first login will create Auth' });
      continue;
    }
    rows.push({
      ...base,
      action: 'import-sha256',
      reason: `import SHA256 rounds=${AUTH_HASH_ROUNDS} (salt prepended)`,
      passwordHashHex: parsed.hashHex,
      passwordSaltHex: parsed.saltHex,
    });
  }

  const summary = {
    total: rows.length,
    importSha256: rows.filter(r => r.action === 'import-sha256').length,
    firstLogin: rows.filter(r => r.action === 'first-login').length,
    skip: rows.filter(r => r.action === 'skip').length,
    disabled: rows.filter(r => r.disabled && r.action !== 'skip').length,
    duplicateEmails,
    plaintext,
    missingPassword,
  };
  return { rows, summary };
}

/** Public report: never includes hash or salt bytes. */
export function publicAuthImportReport(plan: AuthImportPlan) {
  return {
    algorithm: AUTH_HASH_ALGORITHM,
    rounds: AUTH_HASH_ROUNDS,
    construction: 'SHA-256(salt_bytes || utf8(password)), salt 16 bytes, one round',
    summary: plan.summary,
    rows: plan.rows.map(({ passwordHashHex: _h, passwordSaltHex: _s, ...rest }) => rest),
  };
}
