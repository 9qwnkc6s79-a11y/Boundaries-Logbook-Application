/**
 * Backup retention and restore dry-run. No Cloud Storage calls.
 * Run: npx tsx scripts/verify-firestore-backup.ts
 */
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import {
  backupObjectExpired,
  buildManifest,
  collectionObjectName,
  manifestObjectName,
  SOURCE_STORAGE_BUCKET,
  storageCopyName,
} from '../utils/firestoreBackup.ts';

function assert(cond: unknown, message: string): asserts cond {
  if (!cond) throw new Error(message);
}

const now = new Date('2026-11-17T08:00:00.000Z');
assert(backupObjectExpired('firestore-backups/2026-10-17/data.json', now), '31-day-old object expires');
assert(!backupObjectExpired('firestore-backups/2026-10-18/data.json', now), 'the 30-day object is kept');
assert(!backupObjectExpired('firestore-backups/2026-11-17/manifest.json', now), 'today is kept');
assert(!backupObjectExpired('other-prefix/2020-01-01/data.json', now), 'unrelated objects are not deleted');
assert(collectionObjectName('2026-11-17', 'users') === 'firestore-backups/2026-11-17/users.json', 'object name');
assert(manifestObjectName('2026-11-17').endsWith('manifest.json'), 'manifest name');
assert(
  storageCopyName('2026-11-17', 'photos/store-elm/a.jpg') === 'firestore-backups/2026-11-17/storage/photos/store-elm/a.jpg',
  'storage copies sit in the dated folder',
);
assert(SOURCE_STORAGE_BUCKET === 'boundaries-logbook-app.firebasestorage.app', 'source bucket');
assert(backupObjectExpired(storageCopyName('2026-10-17', 'photos/a.jpg'), now), 'old storage copies expire with the folder');

const manifest = buildManifest({
  takenAt: now.toISOString(),
  orgId: 'org-boundaries',
  bucket: 'boundaries-logbook-backups',
  counts: { users: 2, data: 1 },
});
assert(manifest.retentionDays === 30, 'retention is 30 days');
assert(manifest.collections.users === 2, 'counts recorded');

const dir = mkdtempSync(join(tmpdir(), 'backup-'));
writeFileSync(join(dir, 'users.json'), JSON.stringify({ docs: { 'u-1': { email: 'a@example.com' }, 'u-2': { email: 'b@example.com' } } }));
writeFileSync(join(dir, 'data.json'), JSON.stringify({ docs: { submissions: { data: [] } } }));
const run = spawnSync('npx', ['tsx', 'scripts/restore-firestore-backup.ts', '--dir', dir], { encoding: 'utf8' });
assert(run.status === 0, `dry-run failed: ${run.stderr}`);
assert(run.stdout.includes('DRY RUN'), 'restore defaults to dry-run');
assert(run.stdout.includes('"count": 2'), 'user count is reported');
const apply = spawnSync('npx', ['tsx', 'scripts/restore-firestore-backup.ts', '--dir', dir, '--apply'], { encoding: 'utf8' });
assert(apply.status === 1, 'apply without the env guard must fail');
assert(apply.stderr.includes('FIRESTORE_RESTORE_APPLY'), 'apply names the guard');
rmSync(dir, { recursive: true, force: true });

console.log('verify-firestore-backup: OK');
