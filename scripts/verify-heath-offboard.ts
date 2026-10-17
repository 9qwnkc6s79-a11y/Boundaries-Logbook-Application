/** Smoke: Heath offboard sets inactive/non-admin; roster sync never reactivates offboarded users. */
import { readFileSync } from 'node:fs';
import { HEATH_OFFBOARD_KEY, HEATH_USER_ID, needsOffboard, offboardedUser } from '../utils/userOffboard.ts';
import { decideToastRosterSync } from '../utils/toastRosterSync.ts';
import { UserRole } from '../types.ts';
import type { User } from '../types.ts';
function assert(c: unknown, m: string): asserts c { if (!c) throw new Error(m); }
assert(HEATH_OFFBOARD_KEY === 'userOffboard-heath-marcom-v1' && HEATH_USER_ID === 'u-1785790050563-vha7b5', 'ids');
const heath = { id: HEATH_USER_ID, name: 'Heath Marcom', email: 'heath.marcom@yahoo.com', role: UserRole.ADMIN, storeId: 'store-prosper', active: true, toastEmployeeGuid: 'd8ea20c8-8aa2-447f-bb2f-18b76033e60f' } as User;
const off = offboardedUser(heath, '2026-10-17T00:00:00Z');
assert(off.active === false && off.role === UserRole.TRAINEE && off.offboarded === true, 'offboarded fields');
assert(off.id === heath.id && off.email === heath.email && off.toastEmployeeGuid === heath.toastEmployeeGuid, 'identity kept');
assert(needsOffboard(heath) && !needsOffboard(off), 'needsOffboard');
const other = { id: 'u-x', name: 'X', email: 'x@x', role: UserRole.TRAINEE, storeId: 'store-prosper', active: false, toastEmployeeGuid: 'g2' } as User;
const toast = [
  { guid: heath.toastEmployeeGuid!, name: 'Heath Marcom', firstName: 'Heath', lastName: 'Marcom', email: heath.email, storeId: 'store-prosper', deleted: false },
  { guid: 'g2', name: 'X', firstName: 'X', lastName: 'Y', email: 'x@x', storeId: 'store-prosper', deleted: false },
] as any;
const d = decideToastRosterSync([off, other], toast);
assert(d.kind === 'apply', 'apply');
assert(!d.reactivate.some(u => u.id === HEATH_USER_ID), 'roster sync must not reactivate offboarded Heath');
assert(d.reactivate.some(u => u.id === 'u-x'), 'normal inactive Toast user still reactivates');
assert(!d.create.some(c => c.email === heath.email), 'no duplicate account created for Heath');
const db = readFileSync(new URL('../services/db.ts', import.meta.url), 'utf8');
const fn = db.slice(db.indexOf('async ensureHeathOffboarded'), db.indexOf('async fetchAuditFeedback'));
assert(fn.includes('this.syncUser(offboardedUser('), 'uses syncUser path');
assert(fn.indexOf('this.syncUser(') < fn.indexOf('remoteSet(HEATH_OFFBOARD_KEY'), 'marker after save');
assert(!fn.includes('DOC_KEYS.SUBMISSIONS') && !fn.includes('PERFORMANCE'), 'history untouched');
console.log('verify-heath-offboard: OK');
