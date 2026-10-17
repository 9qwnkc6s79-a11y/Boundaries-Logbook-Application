/**
 * One-time restore of Oct 6–12, 2026 logbook submissions (approved by Daniel)
 * after the Oct 15 reset-log wipe. Rows ship as a static file; the merge
 * only ADDS rows whose id is not already live. Never overwrites or drops.
 */
export const SUBMISSIONS_RESTORE_KEY = 'submissionsRestore-oct6-12-v1';
export const SUBMISSIONS_RESTORE_URL = '/restore/submissions-oct6-12-v1.json';
export const SUBMISSIONS_RESTORE_COUNT = 43;
export const SUBMISSIONS_MAX_BYTES = 900_000;

export function mergeRestoredSubmissions<T extends { id: string }>(
  live: T[],
  restored: T[],
): { next: T[]; added: number } {
  const ids = new Set(live.map(s => s.id));
  const add = restored.filter(s => s && s.id && !ids.has(s.id));
  return { next: [...live, ...add], added: add.length };
}
