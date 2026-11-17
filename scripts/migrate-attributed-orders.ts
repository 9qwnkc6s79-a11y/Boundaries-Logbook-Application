/**
 * Copy data/attributedOrders into organizations/{org}/attributedOrders/{id}.
 * Dry-run by default. Does not read production unless --apply is set, and
 * even then it writes only from the local --input file.
 *
 *   npx tsx scripts/migrate-attributed-orders.ts --input attributed-orders.json
 *
 * Input: a bare array, { orders: [] }, or { data: [] } from the backup doc.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { planOrderDocMigration, type AttributedOrderLike } from '../utils/attributedOrderRecords.ts';
import { assertMigrationApplyAllowed, loadServiceAccountFromEnv } from '../utils/firebaseAdminApp.ts';
import { orderDocId } from '../utils/attributedOrderRecords.ts';

function arg(name: string): string | undefined {
  const idx = process.argv.indexOf(name);
  if (idx === -1) return undefined;
  return process.argv[idx + 1];
}

function hasFlag(name: string): boolean {
  return process.argv.includes(name);
}

function loadOrders(path: string): AttributedOrderLike[] {
  const parsed = JSON.parse(readFileSync(path, 'utf8'));
  if (Array.isArray(parsed)) return parsed;
  if (Array.isArray(parsed.orders)) return parsed.orders;
  if (Array.isArray(parsed.data)) return parsed.data;
  throw new Error('Input must be an array or { orders: [] } or { data: [] }');
}

async function main() {
  const input = arg('--input');
  if (!input) {
    console.error('Usage: npx tsx scripts/migrate-attributed-orders.ts --input attributed-orders.json [--existing docs.json] [--out plan.json] [--apply]');
    process.exit(1);
  }
  const source = loadOrders(input);
  const existing = arg('--existing') ? loadOrders(arg('--existing') as string) : [];
  const plan = planOrderDocMigration(source, existing);
  const out = arg('--out');
  if (out) writeFileSync(out, JSON.stringify({ summary: plan.summary }, null, 2));
  console.log(JSON.stringify(plan.summary, null, 2));
  if (!hasFlag('--apply')) {
    console.log('DRY RUN. No order docs were written. The attributedOrders array was not modified.');
    return;
  }
  assertMigrationApplyAllowed('ORDERS_MIGRATION_APPLY');
  const account = loadServiceAccountFromEnv();
  if (!account) throw new Error('No service account.');
  const admin = await import('firebase-admin');
  const app = admin.initializeApp({
    credential: admin.credential.cert(account as any),
    projectId: account.project_id || 'boundaries-logbook-app',
  }, 'order-doc-migration');
  const db = admin.firestore(app);
  const orgId = process.env.AUTH_ORG_ID || 'org-boundaries';
  const byId = new Map(source.map(order => [orderDocId(order), order]));
  let written = 0;
  for (const row of plan.rows) {
    if (row.action !== 'create' && row.action !== 'update') continue;
    const order = byId.get(row.id);
    if (!order) continue;
    await db.doc(`organizations/${orgId}/attributedOrders/${row.id}`).set({ ...order, updatedAt: new Date().toISOString() });
    written++;
  }
  console.log(JSON.stringify({ written }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
