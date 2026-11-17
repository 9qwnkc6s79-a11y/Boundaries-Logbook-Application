/**
 * One doc per attributed order. No Firestore.
 * Run: npx tsx scripts/verify-attributed-orders.ts
 */
import { readFileSync } from 'node:fs';
import {
  arrayWriteFits,
  ORDER_ARRAY_MAX_BYTES,
  mergeAttributedOrders,
  orderDocId,
  planOrderDocMigration,
} from '../utils/attributedOrderRecords.ts';
import { attachUserPasswords } from '../utils/authImportPlan.ts';

function assert(cond: unknown, message: string): asserts cond {
  if (!cond) throw new Error(message);
}

const order = { id: 'abc-123', checkGuid: 'chk-1', storeId: 'store-prosper', openedAt: '2026-11-01T15:00:00.000Z', shiftLeaderId: 'u-1', netAmount: 12 };
assert(orderDocId(order) === 'abc-123_chk-1', 'doc id keeps both ids');
assert(orderDocId({ id: 'bad/id' }) === 'bad_id', 'slash is sanitized');

const merged = mergeAttributedOrders(
  [order, { id: 'only-array', storeId: 'store-elm', openedAt: '2026-10-01T00:00:00.000Z', shiftLeaderId: 'u-2', netAmount: 4 }],
  [{ ...order, shiftLeaderId: 'u-9', netAmount: 20 }],
);
assert(merged.length === 2, 'array-only order is kept');
assert(merged.find(o => o.id === 'abc-123')?.shiftLeaderId === 'u-9', 'doc wins');
assert(!arrayWriteFits([{ blob: 'x'.repeat(ORDER_ARRAY_MAX_BYTES) }]), 'an oversized array does not fit');
assert(arrayWriteFits([order]), 'one order fits');

const first = planOrderDocMigration([order], []);
assert(first.summary.create === 1, 'first plan creates');
const second = planOrderDocMigration([order], [order]);
assert(second.summary.unchanged === 1, 'second plan is unchanged');

const joined = attachUserPasswords(
  [{ id: 'u-1', email: 'a@example.com', role: 'TRAINEE', storeId: 'store-elm' }],
  { data: [{ email: 'a@example.com', password: '$sha256$00112233445566778899aabbccddeeff$aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' }] },
);
assert(joined[0].password?.startsWith('$sha256$'), 'userPasswords doc supplies a missing hash');
const preferDoc = attachUserPasswords(
  [{ id: 'u-1', email: 'a@example.com', password: 'stale', role: 'TRAINEE', storeId: 'store-elm' }],
  { 'a@example.com': '$sha256$00112233445566778899aabbccddeeff$bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb' },
);
assert(preferDoc[0].password?.includes('bbbb'), 'userPasswords wins over a stale array hash');

const db = readFileSync(new URL('../services/db.ts', import.meta.url), 'utf8');
assert(db.includes('writeAttributedOrderDocs'), 'new orders are written as their own docs');
assert(db.includes('array unreadable'), 'an unreadable array is not replaced');
assert(db.includes('order docs kept'), 'clear does not delete order docs');
const rules = readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8');
assert(rules.includes('attributedOrders/{orderId}'), 'rules cover per-order docs');
assert(rules.includes('allow delete: if false'), 'clients cannot delete order docs');

console.log('verify-attributed-orders: OK');
