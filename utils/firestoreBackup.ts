/**
 * Nightly JSON backup layout and the 30-day retention rule.
 * The cron writes these objects. This module does not talk to Google.
 */

export const BACKUP_PREFIX = 'firestore-backups';
export const BACKUP_RETENTION_DAYS = 30;

export const BACKUP_COLLECTIONS = [
  'data',
  'users',
  'logbookSubmissions',
  'toastSnapshots',
  'config',
] as const;

export interface BackupManifest {
  takenAt: string;
  orgId: string;
  bucket: string;
  retentionDays: number;
  collections: Record<string, number>;
}

export function backupFolder(day: string): string {
  return `${BACKUP_PREFIX}/${day}`;
}

export function collectionObjectName(day: string, collection: string): string {
  return `${backupFolder(day)}/${collection}.json`;
}

export function manifestObjectName(day: string): string {
  return `${backupFolder(day)}/manifest.json`;
}

export function buildManifest(input: {
  takenAt: string;
  orgId: string;
  bucket: string;
  counts: Record<string, number>;
}): BackupManifest {
  return {
    takenAt: input.takenAt,
    orgId: input.orgId,
    bucket: input.bucket,
    retentionDays: BACKUP_RETENTION_DAYS,
    collections: input.counts,
  };
}

/** True only for our dated folders older than the retention window. */
export function backupObjectExpired(name: string, now: Date, keepDays = BACKUP_RETENTION_DAYS): boolean {
  const match = /^firestore-backups\/(\d{4}-\d{2}-\d{2})\//.exec(name);
  if (!match) return false;
  const cutoff = new Date(now.getTime() - keepDays * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  return match[1] < cutoff;
}

export function utcDay(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}
