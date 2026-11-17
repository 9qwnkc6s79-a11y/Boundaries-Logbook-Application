/**
 * Copy the users array into organizations/{orgId}/users/{userId}.
 * Dry-run by default. Does not modify the array. Does not contact Firestore
 * unless --apply is set AND USERS_MIGRATION_APPLY=yes AND a fresh backup
 * file is passed.
 *
 *   npx tsx scripts/migrate-users-to-docs.ts --input users.json
 *   npx tsx scripts/migrate-users-to-docs.ts --input users.json --existing docs.json
 *
 * Apply (owner only, after the backup):
 *   USERS_MIGRATION_APPLY=yes npx tsx scripts/migrate-users-to-docs.ts \
 *     --input users.json --backup-file users-backup.json --apply
 *
 * Optional, only after the verification counts match:
 *   ... --apply --mark-array-read-only
 *
 * Input shape: { "users": [ ... ] } or a bare array.
 * --existing is the same shape for docs already written (idempotent re-runs).
 */

import { readFileSync, statSync, writeFileSync } from 'node:fs';
import {
  planUserDocMigration,
  userDocId,
  verifyUserDocMigration,
  USERS_ARRAY_READ_ONLY_KEY,
  type UserRecord,
} from '../utils/userRecords.ts';
import { assertMigrationApplyAllowed, loadServiceAccountFromEnv } from '../utils/firebaseAdminApp.ts';

function arg(name: string): string | undefined {
  const idx = process.argv.indexOf(name);
  if (idx === -1) return undefined;
  return process.argv[idx + 1];
}

function hasFlag(name: string): boolean {
  return process.argv.includes(name);
}

function loadUsers(path: string): UserRecord[] {
  const parsed = JSON.parse(readFileSync(path, 'utf8'));
  if (Array.isArray(parsed)) return parsed;
  if (Array.isArray(parsed.users)) return parsed.users;
  if (Array.isArray(parsed.data)) return parsed.data;
  throw new Error('Input must be a user array or { users: [] }');
}

function assertBackup(path: string, expected: number) {
  const stat = statSync(path);
  if (Date.now() - stat.mtimeMs > 24 * 60 * 60 * 1000) {
    throw new Error('Backup file is older than 24 hours. Take a fresh backup first.');
  }
  const users = loadUsers(path);
  if (users.length !== expected) {
    throw new Error(`Backup has ${users.length} users; input has ${expected}. Refusing to apply.`);
  }
}

async function apply(source: UserRecord[], existing: UserRecord[], markReadOnly: boolean) {
  assertMigrationApplyAllowed('USERS_MIGRATION_APPLY');
  const account = loadServiceAccountFromEnv();
  if (!account) throw new Error('No service account. Set FIREBASE_SERVICE_ACCOUNT_JSON or GOOGLE_APPLICATION_CREDENTIALS.');
  const admin = await import('firebase-admin');
  const app = admin.initializeApp({
    credential: admin.credential.cert(account as any),
    projectId: account.project_id || 'boundaries-logbook-app',
  }, 'user-doc-migration');
  const db = admin.firestore(app);
  const orgId = process.env.AUTH_ORG_ID || process.env.LOGBOOK_EXPORT_ORG_ID || 'org-boundaries';
  const plan = planUserDocMigration(source, existing);
  const byId = new Map(source.filter(u => u.id).map(u => [u.id as string, u]));
  let written = 0;
  for (const row of plan.rows) {
    if (row.action !== 'create' && row.action !== 'update') continue;
    const user = byId.get(row.id);
    const id = userDocId(user?.id);
    if (!user || !id) continue;
    await db.doc(`organizations/${orgId}/users/${id}`).set({
      ...user,
      id,
      email: row.email,
      updatedAt: new Date().toISOString(),
    }, { merge: false });
    written++;
  }
  if (markReadOnly) {
    if (plan.summary.conflict > 0) {
      throw new Error('Refusing to mark the array read-only while conflicts remain.');
    }
    await db.doc(`organizations/${orgId}/data/${USERS_ARRAY_READ_ONLY_KEY}`).set({
      data: { readOnly: true, at: new Date().toISOString() },
    });
  }
  const afterSnap = await db.collection(`organizations/${orgId}/users`).get();
  const after = afterSnap.docs.map(d => d.data() as UserRecord);
  const verification = verifyUserDocMigration(source, after);
  return { written, markReadOnly, verification };
}

async function main() {
  const input = arg('--input');
  if (!input) {
    console.error('Usage: npx tsx scripts/migrate-users-to-docs.ts --input users.json [--existing docs.json] [--out plan.json] [--apply --backup-file backup.json] [--mark-array-read-only]');
    process.exit(1);
  }
  const source = loadUsers(input);
  const existing = arg('--existing') ? loadUsers(arg('--existing') as string) : [];
  const plan = planUserDocMigration(source, existing);
  const out = arg('--out');
  if (out) writeFileSync(out, JSON.stringify(plan, null, 2));
  console.log(JSON.stringify(plan.summary, null, 2));
  for (const row of plan.rows) {
    console.log(`${row.action}\t${row.email || '(no email)'}\t${row.id || '(no id)'}\t${row.reason}`);
  }
  if (!hasFlag('--apply')) {
    console.log('DRY RUN. No user docs were written. The users array was not modified.');
    return;
  }
  const backup = arg('--backup-file');
  if (!backup) throw new Error('--apply requires --backup-file');
  assertBackup(backup, source.length);
  const result = await apply(source, existing, hasFlag('--mark-array-read-only'));
  console.log(JSON.stringify(result, null, 2));
  if (!result.verification.ok) {
    throw new Error('Verification failed. The array was not marked read-only unless --mark-array-read-only was set and conflicts were zero. Inspect the counts before retrying.');
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
