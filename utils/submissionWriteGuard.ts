/**
 * Guard for the read-modify-write on the single `submissions` doc.
 *
 * pushSubmission / deleteSubmission / restore read the whole list, change one
 * row, and write the whole list back. If the read "succeeds" with [] when the
 * doc really has rows, the write wipes every store's logbook.
 *
 * The old guard used remoteGet for both the list and the `submissionsPopulated`
 * marker. remoteGet swallows errors and returns the default, so when a tablet
 * was offline or flaky BOTH reads came back as defaults ([] and populated:false),
 * the guard read that as "brand-new org", and the Firestore SDK queued
 * set([thisSubmission]) until the connection came back — replacing the doc.
 * That is the Nov 10 2026 wipe (and the same shape as Oct 16).
 *
 * Rule here: a failed read is never "empty". Only a successful server read
 * that is empty AND a successful marker read that is not populated may start
 * from []. The actual write is a transaction that aborts unless the server
 * doc is still that same list, so a drop after this read cannot queue a
 * stale full-list set.
 */
export type StrictRead<T> =
  | { ok: true; missing: true; data: null }
  | { ok: true; missing: false; data: T | null }
  | { ok: false };

export type WriteBase<R> = { ok: true; rows: R[] } | { ok: false; reason: string };

export function decideSubmissionsWriteBase<R>(
  list: StrictRead<unknown>,
  marker: StrictRead<unknown>,
): WriteBase<R> {
  if (!list.ok) return { ok: false, reason: 'submissions read failed' };
  const data = list.missing ? null : list.data;
  if (data !== null && data !== undefined && !Array.isArray(data)) {
    return { ok: false, reason: 'submissions doc has unexpected shape' };
  }
  const rows = (Array.isArray(data) ? data : []) as R[];
  if (rows.length > 0) return { ok: true, rows };

  // List is genuinely empty on the server. Only allow [] for a never-populated org.
  if (!marker.ok) return { ok: false, reason: 'populated-marker read failed with empty submissions' };
  const m = marker.missing ? null : (marker.data as { populated?: boolean } | null);
  if (m && m.populated) return { ok: false, reason: 'submissions empty but marker says populated' };
  return { ok: true, rows: [] };
}

/** Key order and row order do not matter; a changed or missing row does. */
export function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value) ?? 'undefined';
  }
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  const obj = value as Record<string, unknown>;
  return `{${Object.keys(obj).sort().map(key => `${JSON.stringify(key)}:${stableStringify(obj[key])}`).join(',')}}`;
}

export function submissionsRevision(rows: unknown[]): string {
  return rows.map(stableStringify).sort().join('\n');
}

/** True when a transaction re-read is still the list the caller merged. */
export function submissionsMatch(expected: unknown[], fresh: unknown[]): boolean {
  if (expected.length !== fresh.length) return false;
  return submissionsRevision(expected) === submissionsRevision(fresh);
}
