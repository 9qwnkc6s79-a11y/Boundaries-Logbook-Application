/**
 * Restore a JSON backup downloaded from the backup bucket.
 * Dry-run by default. Does not contact Firestore unless --apply is set
 * AND FIRESTORE_RESTORE_APPLY=yes AND a service account is configured.
 *
 *   npx tsx scripts/restore-firestore-backup.ts --dir ./backup-2026-11-17
 *
 * The directory is one night's folder: manifest.json plus data.json,
 * users.json, logbookSubmissions.json, toastSnapshots.json, config.json.
 * Each file is { "docs": { "<id>": { ...fields } } }.
 */

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { assertMigrationApplyAllowed, loadServiceAccountFromEnv } from '../utils/firebaseAdminApp.ts';

function arg(name: string): string | undefined {
  const idx = process.argv.indexOf(name);
  if (idx === -1) return undefined;
  return process.argv[idx + 1];
}

function hasFlag(name: string): boolean {
  return process.argv.includes(name);
}

function loadDocs(dir: string, file: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(readFileSync(join(dir, file), 'utf8'));
    if (!parsed || typeof parsed.docs !== 'object' || Array.isArray(parsed.docs)) return null;
    return parsed.docs as Record<string, unknown>;
  } catch {
    return null;
  }
}

async function main() {
  const dir = arg('--dir');
  if (!dir) {
    console.error('Usage: npx tsx scripts/restore-firestore-backup.ts --dir <backup-folder> [--apply]');
    process.exit(1);
  }
  const names = readdirSync(dir).filter(name => name.endsWith('.json') && name !== 'manifest.json');
  const plan = names.map(name => {
    const docs = loadDocs(dir, name);
    return { file: name, collection: name.replace(/\.json$/, ''), count: docs ? Object.keys(docs).length : 0, ok: !!docs };
  });
  console.log(JSON.stringify(plan, null, 2));
  if (plan.some(row => !row.ok)) throw new Error('A backup file is missing a docs object. Nothing was written.');
  if (!hasFlag('--apply')) {
    console.log('DRY RUN. No documents were written. Read docs/phase0/F-firestore-backup-restore.md before applying.');
    return;
  }
  assertMigrationApplyAllowed('FIRESTORE_RESTORE_APPLY');
  const account = loadServiceAccountFromEnv();
  if (!account) throw new Error('No service account.');
  const admin = await import('firebase-admin');
  const app = admin.initializeApp({
    credential: admin.credential.cert(account as any),
    projectId: account.project_id || 'boundaries-logbook-app',
  }, 'firestore-restore');
  const db = admin.firestore(app);
  const orgId = process.env.AUTH_ORG_ID || 'org-boundaries';
  let written = 0;
  for (const row of plan) {
    const docs = loadDocs(dir, row.file)!;
    for (const [id, data] of Object.entries(docs)) {
      await db.doc(`organizations/${orgId}/${row.collection}/${id}`).set(data as Record<string, unknown>);
      written++;
    }
  }
  console.log(JSON.stringify({ written }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
