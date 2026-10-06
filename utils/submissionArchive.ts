/**
 * Retention split + monthly archive packing for checklist submissions.
 *
 * The live `submissions` doc is still pruned to 90, then 60, then 30 days
 * so a checklist save stays under Firestore's 1 MB document limit. Rows that
 * the prune would drop are packed into per-month archive docs first.
 * The logbook UI keeps reading only the live doc.
 */

export const ARCHIVE_DOC_PREFIX = 'submissionsArchive-';
/** Stay well under Firestore's 1 MB document limit, including field overhead. */
export const ARCHIVE_MAX_BYTES = 700_000;
/** A corrupt shardCount must not fan out into unbounded reads. */
export const ARCHIVE_MAX_SHARDS = 24;

export interface ArchiveRow {
  id: string;
  date: string;
  submittedAt?: string;
}

export function retentionCutoff(now: Date, days: number): string {
  const cutoff = new Date(now.getTime());
  cutoff.setDate(cutoff.getDate() - days);
  return cutoff.toISOString().split('T')[0];
}

export function monthKeyFromBusinessDate(date: string | undefined | null): string | null {
  const match = /^(\d{4}-\d{2})-\d{2}/.exec(date || '');
  return match ? match[1] : null;
}

export function archiveDocId(month: string, shard: number): string {
  if (shard <= 1) return `${ARCHIVE_DOC_PREFIX}${month}`;
  return `${ARCHIVE_DOC_PREFIX}${month}-p${shard}`;
}

/**
 * Same retention rules the live doc used before archiving existed:
 * drop older than 90 days, then 60, then 30, while the kept JSON exceeds
 * maxSizeBytes. Rows inside the 30-day window are never dropped for size.
 * `kept` stays newest-first, matching the previous live-doc order.
 */
export function partitionSubmissionsForRetention<T extends ArchiveRow>(
  submissions: T[],
  maxSizeBytes = 900_000,
  now: Date = new Date()
): { kept: T[]; removed: T[] } {
  const sorted = [...submissions].sort((a, b) => {
    const dateCompare = (b.date || '').localeCompare(a.date || '');
    if (dateCompare !== 0) return dateCompare;
    return (b.submittedAt || '').localeCompare(a.submittedAt || '');
  });

  let kept = sorted.filter(s => (s.date || '') >= retentionCutoff(now, 90));
  if (JSON.stringify(kept).length > maxSizeBytes) {
    const cutoff60 = retentionCutoff(now, 60);
    kept = kept.filter(s => (s.date || '') >= cutoff60);
  }
  if (JSON.stringify(kept).length > maxSizeBytes) {
    const cutoff30 = retentionCutoff(now, 30);
    kept = kept.filter(s => (s.date || '') >= cutoff30);
  }

  const keptSet = new Set(kept);
  const removed = sorted.filter(s => !keptSet.has(s));
  return { kept, removed };
}

export function groupRemovedByMonth<T extends { date: string }>(rows: T[]): {
  byMonth: Map<string, T[]>;
  undated: T[];
} {
  const byMonth = new Map<string, T[]>();
  const undated: T[] = [];
  for (const row of rows) {
    const month = monthKeyFromBusinessDate(row.date);
    if (!month) {
      undated.push(row);
      continue;
    }
    const list = byMonth.get(month);
    if (list) list.push(row);
    else byMonth.set(month, [row]);
  }
  return { byMonth, undated };
}

/** Incoming wins when submittedAt ties, so a retry can refresh the archived copy. */
export function mergeSubmissionsById<T extends ArchiveRow>(existing: T[], incoming: T[]): T[] {
  const map = new Map<string, T>();
  for (const row of existing) {
    if (row?.id) map.set(row.id, row);
  }
  for (const row of incoming) {
    if (!row?.id) continue;
    const prev = map.get(row.id);
    if (!prev || (row.submittedAt || '') >= (prev.submittedAt || '')) {
      map.set(row.id, row);
    }
  }
  return Array.from(map.values());
}

/**
 * Pack rows into shards whose JSON stays under maxBytes.
 * A single row larger than maxBytes is left in its own shard so the caller
 * can refuse the write instead of splitting a submission.
 */
export function shardSubmissionRows<T>(rows: T[], maxBytes = ARCHIVE_MAX_BYTES): T[][] {
  const shards: T[][] = [];
  let current: T[] = [];
  for (const row of rows) {
    if (current.length === 0) {
      current = [row];
      continue;
    }
    const candidate = current.concat(row);
    if (JSON.stringify(candidate).length > maxBytes) {
      shards.push(current);
      current = [row];
    } else {
      current = candidate;
    }
  }
  if (current.length > 0) shards.push(current);
  return shards;
}

export interface ParsedArchive {
  rows: unknown[];
  shardCount: number;
  recognized: boolean;
}

/** Accept the wrapper written by the app, or a bare array from an older writer. */
export function parseArchivePayload(data: unknown): ParsedArchive {
  if (data == null) return { rows: [], shardCount: 1, recognized: true };
  if (Array.isArray(data)) return { rows: data, shardCount: 1, recognized: true };
  if (typeof data === 'object' && Array.isArray((data as { rows?: unknown }).rows)) {
    const raw = Number((data as { shardCount?: unknown }).shardCount);
    const shardCount = Number.isFinite(raw) && raw >= 1
      ? Math.min(ARCHIVE_MAX_SHARDS, Math.floor(raw))
      : 1;
    return { rows: (data as { rows: unknown[] }).rows, shardCount, recognized: true };
  }
  return { rows: [], shardCount: 1, recognized: false };
}
