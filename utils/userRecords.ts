/**
 * One Firestore document per user, with the legacy array kept as a fallback.
 *
 * Doc path: organizations/{orgId}/users/{userId}
 * Array path (read-only after the marker): organizations/{orgId}/data/users
 *
 * A user doc wins over the array row with the same email. If the doc has no
 * password yet, the array hash is kept so legacy login still works.
 * A newer doc (updatedAt) is never replaced by a stale array row.
 */

export const USERS_ARRAY_READ_ONLY_KEY = 'usersArrayReadOnly';

const DOC_ID_RE = /^[A-Za-z0-9_-]{1,200}$/;

export interface UserRecord {
  id?: string;
  name?: string;
  email?: string;
  password?: string;
  role?: string;
  storeId?: string;
  active?: boolean;
  toastEmployeeGuid?: string;
  orgId?: string;
  mustChangePassword?: boolean;
  trainerId?: string;
  toastHoldUntil?: string;
  offboarded?: boolean;
  offboardedAt?: string;
  updatedAt?: string;
}

export type UserDocAction = 'create' | 'update' | 'unchanged' | 'keep-doc' | 'conflict';

export interface UserDocPlanRow {
  action: UserDocAction;
  id: string;
  email: string;
  reason: string;
}

const COMPARE_FIELDS = [
  'name',
  'email',
  'password',
  'role',
  'storeId',
  'active',
  'toastEmployeeGuid',
  'orgId',
  'mustChangePassword',
  'trainerId',
  'toastHoldUntil',
  'offboarded',
  'offboardedAt',
] as const;

export function userDocId(id: string | undefined): string | null {
  if (!id || !DOC_ID_RE.test(id)) return null;
  return id;
}

export function normalizeEmail(email: string | undefined): string {
  return (email || '').trim().toLowerCase();
}

function fieldValue(user: UserRecord, key: (typeof COMPARE_FIELDS)[number]): unknown {
  const value = user[key];
  if (key === 'email') return normalizeEmail(typeof value === 'string' ? value : undefined);
  return value ?? null;
}

export function userFieldsMatch(a: UserRecord, b: UserRecord): boolean {
  return COMPARE_FIELDS.every(key => fieldValue(a, key) === fieldValue(b, key));
}

/**
 * Doc rows replace array rows with the same email.
 * Array-only rows stay so a partial migration cannot hide someone.
 */
export function mergeUserRecords<T extends UserRecord>(arrayUsers: T[], docUsers: T[]): T[] {
  const byEmail = new Map<string, T>();
  for (const user of arrayUsers || []) {
    const email = normalizeEmail(user?.email);
    if (!email) continue;
    byEmail.set(email, user);
  }
  for (const docUser of docUsers || []) {
    const email = normalizeEmail(docUser?.email);
    if (!email) continue;
    const prev = byEmail.get(email);
    if (prev?.password && !docUser.password) {
      byEmail.set(email, { ...docUser, password: prev.password });
    } else {
      byEmail.set(email, docUser);
    }
  }
  return Array.from(byEmail.values());
}

export function planUserDocMigration(source: UserRecord[], existing: UserRecord[]): {
  rows: UserDocPlanRow[];
  summary: Record<UserDocAction, number> & { total: number };
} {
  const existingById = new Map<string, UserRecord>();
  for (const doc of existing || []) {
    const id = userDocId(doc.id);
    if (id) existingById.set(id, doc);
  }
  const seenEmail = new Set<string>();
  const rows: UserDocPlanRow[] = [];

  for (const user of source || []) {
    const email = normalizeEmail(user.email);
    const id = user.id || '';
    if (!email || !userDocId(id)) {
      rows.push({ action: 'conflict', id, email, reason: 'missing email or unsafe id — not written' });
      continue;
    }
    if (seenEmail.has(email)) {
      rows.push({ action: 'conflict', id, email, reason: 'duplicate email in the array — not written' });
      continue;
    }
    seenEmail.add(email);
    const doc = existingById.get(id);
    if (!doc) {
      rows.push({ action: 'create', id, email, reason: 'no user doc yet' });
      continue;
    }
    if (normalizeEmail(doc.email) !== email) {
      rows.push({ action: 'conflict', id, email, reason: 'existing doc uses a different email — not overwritten' });
      continue;
    }
    if (doc.updatedAt && (!user.updatedAt || doc.updatedAt > user.updatedAt)) {
      rows.push({ action: 'keep-doc', id, email, reason: 'user doc is newer than the array row' });
      continue;
    }
    if (userFieldsMatch(doc, user)) {
      rows.push({ action: 'unchanged', id, email, reason: 'already matches' });
    } else {
      rows.push({ action: 'update', id, email, reason: 'array row differs from the doc' });
    }
  }

  const summary = {
    total: rows.length,
    create: rows.filter(r => r.action === 'create').length,
    update: rows.filter(r => r.action === 'update').length,
    unchanged: rows.filter(r => r.action === 'unchanged').length,
    'keep-doc': rows.filter(r => r.action === 'keep-doc').length,
    conflict: rows.filter(r => r.action === 'conflict').length,
  };
  return { rows, summary };
}

export function verifyUserDocMigration(source: UserRecord[], docs: UserRecord[]): {
  ok: boolean;
  sourceCount: number;
  docCount: number;
  missing: number;
  conflicts: number;
} {
  const plan = planUserDocMigration(source, docs);
  const missing = plan.summary.create + plan.summary.update;
  const conflicts = plan.summary.conflict;
  return {
    ok: missing === 0 && conflicts === 0,
    sourceCount: source.length,
    docCount: docs.length,
    missing,
    conflicts,
  };
}
