import { ToastSyncEmployee, User, UserRole } from '../types';

/** Owner account — never deactivate, even if Toast omits him. */
export const DANIEL_USER_ID = 'u-admin-1';
export const DANIEL_EMAIL = 'daniel@boundariescoffee.com';

/** Longest pre-start hold an admin can set (days from today). */
export const MAX_TOAST_HOLD_DAYS = 45;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Local calendar date as YYYY-MM-DD (store time, not UTC). */
export function localISODate(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function maxToastHoldDate(today: Date = new Date()): string {
  const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() + MAX_TOAST_HOLD_DAYS);
  return localISODate(d);
}

/** Validate an admin-entered hold date. Empty is valid (no hold). */
export function validateToastHoldUntil(value: string | undefined, today: Date = new Date()): string | null {
  const v = (value || '').trim();
  if (!v) return null;
  if (!ISO_DATE.test(v)) return 'Hold date must be YYYY-MM-DD.';
  if (v < localISODate(today)) return 'Hold date cannot be in the past.';
  if (v > maxToastHoldDate(today)) return `Hold can be at most ${MAX_TOAST_HOLD_DAYS} days out. Add them in Toast instead.`;
  return null;
}

/**
 * Pre-start hire not in Toast yet: keep active through toastHoldUntil (inclusive).
 * Malformed or past dates are no hold, so the normal Toast filter applies.
 */
export function hasActiveToastHold(user: Pick<User, 'toastHoldUntil'>, today: string = localISODate()): boolean {
  const until = (user.toastHoldUntil || '').trim();
  if (!ISO_DATE.test(until)) return false;
  return until >= today;
}

const JUNK_TOAST_NAMES = new Set(['default', 'tds', 'test', 'training']);

export function isProtectedOwner(user: Pick<User, 'id' | 'email'>): boolean {
  if (user.id === DANIEL_USER_ID) return true;
  return (user.email || '').toLowerCase() === DANIEL_EMAIL;
}

export function isJunkToastEmployee(emp: ToastSyncEmployee): boolean {
  if (emp.deleted) return true;
  if (!emp.guid) return true;
  const empName = (emp.name || '').trim().toLowerCase();
  if (!empName || JUNK_TOAST_NAMES.has(empName)) return true;
  if (emp.email && emp.email.toLowerCase().endsWith('@toasttab.com')) return true;
  return false;
}

/** Same fallback handleSyncToastEmployees already used when Toast has no email. */
export function resolvedToastEmail(emp: ToastSyncEmployee): string {
  const raw = (emp.email || '').trim();
  if (raw) return raw.toLowerCase();
  const first = (emp.firstName || '').trim().toLowerCase();
  const last = (emp.lastName || '').trim().toLowerCase();
  return `${first}.${last}@boundariescoffee.com`;
}

export function findExistingUserForToastEmployee(users: User[], emp: ToastSyncEmployee): User | undefined {
  const byGuid = users.find(u => u.toastEmployeeGuid && u.toastEmployeeGuid === emp.guid);
  if (byGuid) return byGuid;
  const email = resolvedToastEmail(emp);
  return users.find(u => (u.email || '').toLowerCase() === email);
}

export type ToastRosterLink = {
  user: User;
  guid: string;
};

export type ToastRosterCreate = {
  emp: ToastSyncEmployee;
  email: string;
};

export type ToastRosterDecision =
  | { kind: 'skip-empty' }
  | {
      kind: 'apply';
      create: ToastRosterCreate[];
      link: ToastRosterLink[];
      deactivate: User[];
      reactivate: User[];
    };

/**
 * Toast is the source of truth for who is active (except Daniel).
 * Empty / junk-only lists are a no-op so a 429/500/partial miss cannot empty the roster.
 * Only deactivate people whose store actually appeared in this successful pull.
 * Accounts with an unexpired toastHoldUntil (pre-start hires) are left alone.
 */
export function decideToastRosterSync(
  users: User[],
  toastEmployees: ToastSyncEmployee[] | null | undefined,
  today: string = localISODate(),
): ToastRosterDecision {
  if (!Array.isArray(toastEmployees) || toastEmployees.length === 0) {
    return { kind: 'skip-empty' };
  }

  const valid = toastEmployees.filter(emp => !isJunkToastEmployee(emp));
  if (valid.length === 0) {
    return { kind: 'skip-empty' };
  }

  const create: ToastRosterCreate[] = [];
  const link: ToastRosterLink[] = [];
  const reactivate: User[] = [];
  const matchedIds = new Set<string>();

  for (const emp of valid) {
    const existing = findExistingUserForToastEmployee(users, emp);
    if (!existing) {
      create.push({ emp, email: resolvedToastEmail(emp) });
      continue;
    }
    matchedIds.add(existing.id);
    if (!existing.toastEmployeeGuid) {
      link.push({ user: existing, guid: emp.guid });
    }
    if (existing.active === false && !isProtectedOwner(existing)) {
      reactivate.push(existing);
    }
  }

  const representedStores = new Set(valid.map(emp => emp.storeId).filter(Boolean));

  const deactivate = users.filter(user => {
    if (isProtectedOwner(user)) return false;
    if (matchedIds.has(user.id)) return false;
    if (user.active === false) return false;
    // Pre-start hire with an unexpired hold stays on until Toast catches up.
    if (hasActiveToastHold(user, today)) return false;
    if (user.storeId && representedStores.has(user.storeId)) return true;
    // Unassigned accounts only come off when this looks like a full org pull.
    if (!user.storeId && representedStores.size >= 2) return true;
    return false;
  });

  return { kind: 'apply', create, link, deactivate, reactivate };
}

export function buildToastSyncedUser(
  emp: ToastSyncEmployee,
  email: string,
  hashedPassword: string,
  orgId?: string,
): User {
  return {
    id: `toast-${emp.guid}`,
    name: emp.name,
    email,
    password: hashedPassword,
    role: UserRole.TRAINEE,
    storeId: emp.storeId,
    toastEmployeeGuid: emp.guid,
    active: true,
    orgId,
  };
}
