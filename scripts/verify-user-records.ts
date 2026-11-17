/**
 * Per-user doc merge and migration plan. Does not contact Firestore.
 * Run: npx tsx scripts/verify-user-records.ts
 */
import { readFileSync } from 'node:fs';
import {
  mergeUserRecords,
  planUserDocMigration,
  userDocId,
  verifyUserDocMigration,
} from '../utils/userRecords.ts';

function assert(cond: unknown, message: string): asserts cond {
  if (!cond) throw new Error(message);
}

assert(userDocId('u-admin-1') === 'u-admin-1', 'normal id');
assert(userDocId('toast-abc-def') === 'toast-abc-def', 'toast id');
assert(userDocId('bad/id') === null, 'slash rejected');
assert(userDocId('') === null, 'empty rejected');

const array = [
  { id: 'u-1', email: 'A@example.com', name: 'Array', password: 'hash-a', role: 'TRAINEE', storeId: 'store-elm' },
  { id: 'u-2', email: 'b@example.com', name: 'Only Array', password: 'hash-b', role: 'MANAGER', storeId: 'store-prosper' },
];
const docs = [
  { id: 'u-1', email: 'a@example.com', name: 'Doc', role: 'TRAINER', storeId: 'store-elm', updatedAt: '2026-11-01T00:00:00.000Z' },
];
const merged = mergeUserRecords(array, docs);
assert(merged.length === 2, 'array-only user is kept');
const a = merged.find(u => u.id === 'u-1');
assert(a?.name === 'Doc' && a.role === 'TRAINER', 'doc wins');
assert(a?.password === 'hash-a', 'array password kept when the doc has none');
assert(merged.some(u => u.id === 'u-2'), 'array-only user remains');

const first = planUserDocMigration(array, []);
assert(first.summary.create === 2 && first.summary.conflict === 0, 'first run creates both');
const second = planUserDocMigration(array, [
  { ...array[0], email: 'a@example.com' },
  { ...array[1], email: 'b@example.com' },
]);
assert(second.summary.unchanged === 2, 'second run with matching docs is unchanged');
assert(verifyUserDocMigration(array, [
  { ...array[0], email: 'a@example.com' },
  { ...array[1], email: 'b@example.com' },
]).ok, 'verification passes when every source row is present');

const newer = planUserDocMigration(
  [{ id: 'u-1', email: 'a@example.com', name: 'Stale', role: 'TRAINEE', storeId: 'store-elm' }],
  [{ id: 'u-1', email: 'a@example.com', name: 'Fresh', role: 'MANAGER', storeId: 'store-elm', updatedAt: '2026-11-17T00:00:00.000Z' }],
);
assert(newer.summary['keep-doc'] === 1, 'newer doc is not overwritten');

const clash = planUserDocMigration(
  [
    { id: 'u-1', email: 'a@example.com', role: 'TRAINEE', storeId: 'store-elm' },
    { id: 'u-9', email: 'a@example.com', role: 'TRAINEE', storeId: 'store-elm' },
  ],
  [],
);
assert(clash.summary.conflict === 1 && clash.summary.create === 1, 'duplicate email conflicts');

const db = readFileSync(new URL('../services/db.ts', import.meta.url), 'utf8');
assert(db.includes('mergeUserRecords('), 'fetch path merges user docs');
assert(db.includes('writeUserDoc('), 'syncUser writes a user doc');
assert(db.includes('USERS_ARRAY_READ_ONLY_KEY'), 'array can be made read-only');
assert(db.includes("organizations/${this.currentOrgId}/users"), 'user docs use the per-user collection');
const team = readFileSync(new URL('../components/TeamManagement.tsx', import.meta.url), 'utf8');
assert(team.includes('db.syncUser('), 'Team settings still saves through syncUser');
const app = readFileSync(new URL('../App.tsx', import.meta.url), 'utf8');
assert(app.includes('decideToastRosterSync'), 'Toast roster sync still decides from the loaded users');
assert(app.includes('db.syncUser('), 'Toast roster sync still writes through syncUser');

console.log('verify-user-records: OK');
