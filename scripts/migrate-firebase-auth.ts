/**
 * Dry-run by default. Does not contact Firebase unless --apply is set AND
 * AUTH_MIGRATION_APPLY=yes AND a service account is configured AND a fresh
 * backup file is passed.
 *
 *   npx tsx scripts/migrate-firebase-auth.ts --input users.json
 *   npx tsx scripts/migrate-firebase-auth.ts --input users.json --out plan.json
 *
 * Apply (owner only, after the runbook backup):
 *   AUTH_MIGRATION_APPLY=yes npx tsx scripts/migrate-firebase-auth.ts \
 *     --input users.json --backup-file backup.json --apply
 *
 * users.json shape: { "users": [ User, ... ] } or a bare array.
 * This agent must not run --apply against production.
 */

import { readFileSync, statSync, writeFileSync } from 'node:fs';
import {
  AUTH_HASH_ALGORITHM,
  AUTH_HASH_ROUNDS,
  attachUserPasswords,
  planAuthImport,
  publicAuthImportReport,
  type AuthImportRow,
  type AuthSourceUser,
} from '../utils/authImportPlan.ts';
import { assertMigrationApplyAllowed, loadServiceAccountFromEnv } from '../utils/firebaseAdminApp.ts';

function arg(name: string): string | undefined {
  const idx = process.argv.indexOf(name);
  if (idx === -1) return undefined;
  return process.argv[idx + 1];
}

function hasFlag(name: string): boolean {
  return process.argv.includes(name);
}

function loadUsers(path: string): AuthSourceUser[] {
  const parsed = JSON.parse(readFileSync(path, 'utf8'));
  if (Array.isArray(parsed)) return parsed;
  if (Array.isArray(parsed.users)) return parsed.users;
  if (Array.isArray(parsed.data)) return parsed.data;
  throw new Error('Input must be a user array or { users: [] }');
}

function assertBackup(path: string, expected: number) {
  const stat = statSync(path);
  const ageMs = Date.now() - stat.mtimeMs;
  if (ageMs > 24 * 60 * 60 * 1000) {
    throw new Error('Backup file is older than 24 hours. Take a fresh backup first.');
  }
  const users = loadUsers(path);
  if (users.length !== expected) {
    throw new Error(`Backup has ${users.length} users; input has ${expected}. Refusing to apply.`);
  }
}

async function applyRows(rows: AuthImportRow[]) {
  assertMigrationApplyAllowed('AUTH_MIGRATION_APPLY');
  const account = loadServiceAccountFromEnv();
  if (!account) throw new Error('No service account. Set FIREBASE_SERVICE_ACCOUNT_JSON or GOOGLE_APPLICATION_CREDENTIALS.');
  const admin = await import('firebase-admin');
  const app = admin.initializeApp({
    credential: admin.credential.cert(account as any),
    projectId: account.project_id || 'boundaries-logbook-app',
  }, 'auth-migration');
  const auth = admin.auth(app);
  const imports = rows.filter(r => r.action === 'import-sha256');
  const chunkSize = 1000;
  let imported = 0;
  for (let i = 0; i < imports.length; i += chunkSize) {
    const chunk = imports.slice(i, i + chunkSize);
    const result = await auth.importUsers(chunk.map(row => ({
      uid: row.uid,
      email: row.email,
      displayName: row.name || undefined,
      emailVerified: true,
      disabled: row.disabled,
      passwordHash: Buffer.from(row.passwordHashHex || '', 'hex'),
      passwordSalt: Buffer.from(row.passwordSaltHex || '', 'hex'),
    })), {
      hash: {
        algorithm: AUTH_HASH_ALGORITHM,
        rounds: AUTH_HASH_ROUNDS,
      },
    });
    imported += chunk.length - result.failureCount;
    if (result.failureCount) {
      for (const failure of result.errors) {
        console.error(`import error index ${failure.index}: ${failure.error.message}`);
      }
    }
  }
  for (const row of imports) {
    await auth.setCustomUserClaims(row.uid, {
      role: row.role,
      storeId: row.storeId,
      userId: row.userId,
      orgId: row.orgId,
    });
  }
  return { imported, claimsSet: imports.length, leftForFirstLogin: rows.filter(r => r.action === 'first-login').length };
}

async function main() {
  const input = arg('--input');
  if (!input) {
    console.error('Usage: npx tsx scripts/migrate-firebase-auth.ts --input users.json [--out plan.json] [--apply --backup-file backup.json]');
    process.exit(1);
  }
  const passwordsPath = arg('--passwords');
  const users = passwordsPath
    ? attachUserPasswords(loadUsers(input), JSON.parse(readFileSync(passwordsPath, 'utf8')))
    : loadUsers(input);
  const plan = planAuthImport(users);
  const report = publicAuthImportReport(plan);
  const out = arg('--out');
  if (out) writeFileSync(out, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report.summary, null, 2));
  console.log(`algorithm=${report.algorithm} rounds=${report.rounds}`);
  console.log(report.construction);
  for (const row of report.rows) {
    console.log(`${row.action}\t${row.email || '(no email)'}\t${row.reason}`);
  }
  if (!hasFlag('--apply')) {
    console.log('DRY RUN. No Auth users were created. Pass --apply only after the runbook backup.');
    return;
  }
  const backup = arg('--backup-file');
  if (!backup) throw new Error('--apply requires --backup-file');
  assertBackup(backup, users.length);
  const result = await applyRows(plan.rows);
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
