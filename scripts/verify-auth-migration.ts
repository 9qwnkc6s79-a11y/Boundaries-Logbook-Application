/**
 * Auth import plan + flag default. Does not contact Firebase.
 * Run: npx tsx scripts/verify-auth-migration.ts
 */
import { hashPassword } from '../utils/passwordUtils.ts';
import { isFirebaseAuthEnabled } from '../utils/authMode.ts';
import {
  AUTH_HASH_ROUNDS,
  parseSha256Password,
  planAuthImport,
  publicAuthImportReport,
} from '../utils/authImportPlan.ts';
import { createHash } from 'node:crypto';

function assert(cond: unknown, message: string): asserts cond {
  if (!cond) throw new Error(message);
}

const previous = process.env.VITE_FIREBASE_AUTH_ENABLED;
delete process.env.VITE_FIREBASE_AUTH_ENABLED;
assert(isFirebaseAuthEnabled() === false, 'flag defaults off');
process.env.VITE_FIREBASE_AUTH_ENABLED = 'true';
assert(isFirebaseAuthEnabled() === true, 'flag true enables auth path');
process.env.VITE_FIREBASE_AUTH_ENABLED = 'no';
assert(isFirebaseAuthEnabled() === false, 'other values stay off');
if (previous === undefined) delete process.env.VITE_FIREBASE_AUTH_ENABLED;
else process.env.VITE_FIREBASE_AUTH_ENABLED = previous;

const password = 'staff-password-example';
const stored = await hashPassword(password);
const parsed = parseSha256Password(stored);
assert(parsed, 'hashed password parses');
const salt = Buffer.from(parsed!.saltHex, 'hex');
const expected = createHash('sha256').update(Buffer.concat([salt, Buffer.from(password)])).digest('hex');
assert(parsed!.hashHex === expected, 'stored hash is SHA-256(salt || password)');
assert(AUTH_HASH_ROUNDS === 1, 'import uses a single round');

const plan = planAuthImport([
  { id: 'u-1', email: 'A@BoundariesCoffee.com', password: stored, role: 'MANAGER', storeId: 'store-elm', active: true },
  { id: 'u-2', email: 'new@boundariescoffee.com', password: 'still-plaintext', role: 'TRAINEE', storeId: 'store-prosper' },
  { id: 'u-3', email: 'gone@boundariescoffee.com', password: stored, role: 'TRAINER', storeId: 'store-elm', active: false },
  { id: 'bad id', email: 'bad@boundariescoffee.com', password: stored, role: 'TRAINEE', storeId: 'store-elm' },
  { id: 'u-4', email: 'a@boundariescoffee.com', password: stored, role: 'TRAINEE', storeId: 'store-elm' },
  { id: 'u-5', email: 'nopass@boundariescoffee.com', role: 'TRAINEE', storeId: 'store-elm' },
]);

assert(plan.summary.importSha256 === 2, `expected 2 imports, got ${plan.summary.importSha256}`);
assert(plan.summary.firstLogin === 2, `expected 2 first-login, got ${plan.summary.firstLogin}`);
assert(plan.summary.skip === 2, `expected 2 skips (bad uid + duplicate), got ${plan.summary.skip}`);
assert(plan.summary.duplicateEmails === 1, 'duplicate counted');
assert(plan.summary.plaintext === 1, 'plaintext counted');
assert(plan.summary.disabled === 1, 'disabled counted');
assert(plan.rows[0].email === 'a@boundariescoffee.com', 'email normalized');
assert(plan.rows[0].role === 'MANAGER' && plan.rows[0].storeId === 'store-elm', 'claims preserved');

const pub = JSON.stringify(publicAuthImportReport(plan));
assert(!pub.includes(parsed!.hashHex), 'public report omits hash bytes');
assert(!pub.includes(parsed!.saltHex), 'public report omits salt');
assert(publicAuthImportReport(plan).algorithm === 'SHA256', 'algorithm recorded');

const { pickUser } = await import('../api/auth-provision.ts');
const merged = await pickUser(
  'a@boundariescoffee.com',
  [{ id: 'u-1', email: 'a@boundariescoffee.com', role: 'MANAGER', storeId: 'store-elm' }],
  [{ id: 'u-1', email: 'a@boundariescoffee.com', password: stored, role: 'TRAINEE', storeId: 'store-elm' }],
);
assert(merged?.password === stored, 'doc record keeps the array password when the doc has none');
assert(merged?.role === 'MANAGER', 'doc fields win');
const unknown = await pickUser('missing@example.com', [], []);
assert(unknown === null, 'unknown email is a null user, not a guess');

console.log('verify-auth-migration: OK');
