/**
 * Smoke: a failed/offline read must never become the base for a full
 * submissions-doc write (Nov 10 2026 wipe: live doc went from ~30 days of
 * rows to only that day's saves).
 * Run: npx --yes tsx scripts/verify-submissions-write-guard.ts
 */
import { readFileSync } from 'node:fs';
import {
  decideSubmissionsWriteBase,
  submissionsMatch,
} from '../utils/submissionWriteGuard.ts';

function assert(cond: unknown, message: string): asserts cond {
  if (!cond) throw new Error(message);
}
const FAIL = { ok: false } as const;
const MISSING = { ok: true, missing: true, data: null } as const;
const rows = (n: number) => ({ ok: true, missing: false, data: Array.from({ length: n }, (_, i) => ({ id: `s${i}` })) } as const);
const marker = (populated: boolean) => ({ ok: true, missing: false, data: { populated } } as const);

// The Nov 10 failure mode: both reads fail (offline) -> must refuse.
assert(!decideSubmissionsWriteBase(FAIL, FAIL).ok, 'both reads failed must refuse');
assert(!decideSubmissionsWriteBase(FAIL, marker(false)).ok, 'list read failed must refuse');
assert(!decideSubmissionsWriteBase(FAIL, marker(true)).ok, 'list read failed must refuse (populated)');
// Empty list, marker unreadable -> refuse.
assert(!decideSubmissionsWriteBase(rows(0), FAIL).ok, 'empty list + failed marker must refuse');
assert(!decideSubmissionsWriteBase(MISSING, FAIL).ok, 'missing list + failed marker must refuse');
// Empty list but marker populated -> refuse.
assert(!decideSubmissionsWriteBase(rows(0), marker(true)).ok, 'empty + populated must refuse');
// Wrong shape -> refuse.
assert(!decideSubmissionsWriteBase({ ok: true, missing: false, data: { rows: [] } }, marker(true)).ok, 'non-array must refuse');
// Healthy cases.
const h = decideSubmissionsWriteBase(rows(3), FAIL);
assert(h.ok && h.rows.length === 3, 'non-empty list is a valid base even if marker read failed');
const fresh = decideSubmissionsWriteBase(MISSING, MISSING);
assert(fresh.ok && fresh.rows.length === 0, 'brand-new org may start from []');
const fresh2 = decideSubmissionsWriteBase(rows(0), marker(false));
assert(fresh2.ok && fresh2.rows.length === 0, 'never-populated org may start from []');

// Connection drop after a good read: the commit must see the same rows.
const base = [{ id: 'a', status: 'PENDING' }, { id: 'b', n: 1 }];
assert(submissionsMatch(base, [{ n: 1, id: 'b' }, { status: 'PENDING', id: 'a' }]), 'key and row order do not matter');
assert(submissionsMatch([], []), 'two empty reads match');
assert(!submissionsMatch([], [{ id: 'only' }]), 'empty base must not match a live list');
assert(!submissionsMatch([{ id: 'a' }, { id: 'b' }], [{ id: 'a' }]), 'a dropped row is a conflict');
assert(!submissionsMatch([{ id: 'a', n: 1 }], [{ id: 'a', n: 2 }]), 'an edited row is a conflict');

// Wiring: the write path uses strict server reads, not remoteGet defaults,
// and the replace itself is a transaction so it cannot be queued offline.
const db = readFileSync(new URL('../services/db.ts', import.meta.url), 'utf8');
const fn = db.slice(db.indexOf('private async fetchSubmissionsForWrite'), db.indexOf('async pushSubmission('));
assert(fn.includes('remoteGetStrict') && fn.includes('server: true'), 'write base must use strict server reads');
assert(!fn.includes('this.fetchSubmissions()'), 'write base must not use the error-swallowing fetchSubmissions');
assert(!fn.includes('this.remoteGet<'), 'write base must not use remoteGet defaults for the marker');
assert(db.includes('runTransaction('), 'full-list write must be a transaction');

const push = db.slice(db.indexOf('async pushSubmission('), db.indexOf('async restoreOct6to12Submissions'));
assert(push.includes('commitSubmissionsIfUnchanged'), 'pushSubmission commits only if the base is unchanged');
assert(!push.includes('this.remoteSet(DOC_KEYS.SUBMISSIONS'), 'pushSubmission must not blind-set the submissions doc');
assert(push.includes('success=false (read refused)'), 'a refused read returns failure to the form');

const del = db.slice(db.indexOf('async deleteSubmission('), db.indexOf('async uploadPhoto('));
assert(del.includes('commitSubmissionsIfUnchanged'), 'deleteSubmission uses the same commit');
assert(!del.includes('this.remoteSet(DOC_KEYS.SUBMISSIONS'), 'delete must not blind-set the submissions doc');

const app = readFileSync(new URL('../App.tsx', import.meta.url), 'utf8');
assert(
  app.includes('Failed to save logbook entry. Please check your connection and try again.'),
  'the existing save error stays',
);
const ops = readFileSync(new URL('../components/OpsView.tsx', import.meta.url), 'utf8');
assert(
  ops.includes('Failed to save logbook entry. Your work is still here — check your connection and try again.'),
  'the form keeps the draft and shows the connection error',
);

console.log('verify-submissions-write-guard: OK');
