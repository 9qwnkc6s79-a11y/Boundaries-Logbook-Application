/**
 * Manager Hub 7-day compliance grid + Completion Rate.
 *
 * A checklist counts on its stored business date (`submission.date`), not on
 * the UTC date of `submittedAt`. Closers routinely submit after 7 PM CT
 * (after 6 PM CT in CST), which is already the next day in UTC; matching on
 * `submittedAt.split('T')[0]` showed the real night as MISSING and credited
 * the following day instead.
 *
 * On-time still compares `submittedAt` against the deadline on that business
 * date, computed in America/Chicago (not the viewer's device zone).
 */

export const COMPLIANCE_TZ = 'America/Chicago';

export type ComplianceStatus = 'MISSING' | 'COMPLETED' | 'LATE' | 'FUTURE' | 'N/A';

export interface ComplianceSubmissionLike {
  templateId: string;
  date?: string;
  status?: string;
  submittedAt?: string;
}

/** YYYY-MM-DD for an instant, in America/Chicago. */
export function chicagoYmdOf(d: Date): string {
  return d.toLocaleDateString('en-CA', { timeZone: COMPLIANCE_TZ });
}

/** Calendar-day arithmetic on a YYYY-MM-DD string (DST-safe). */
export function shiftYmd(ymd: string, days: number): string {
  const [y, m, d] = ymd.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days, 12, 0, 0));
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}-${String(dt.getUTCDate()).padStart(2, '0')}`;
}

/** Offset (ms) of America/Chicago from UTC at a given instant. */
function chicagoOffsetMs(at: Date): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: COMPLIANCE_TZ,
    hourCycle: 'h23',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).formatToParts(at);
  const get = (t: string) => Number(parts.find(p => p.type === t)?.value);
  const asUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'));
  return asUtc - (at.getTime() - at.getMilliseconds());
}

/** The instant of a Chicago wall-clock time on a business date. */
export function chicagoWallTime(ymd: string, h: number, m = 0, s = 0, ms = 0): Date {
  const [y, mo, d] = ymd.split('-').map(Number);
  const guess = Date.UTC(y, mo - 1, d, h, m, s, ms);
  let t = guess - chicagoOffsetMs(new Date(guess));
  // Second pass settles the DST-transition edge.
  t = guess - chicagoOffsetMs(new Date(t));
  return new Date(t);
}

/**
 * Hub grid deadline for a template type on a business date (Chicago).
 * Same rules the grid used before: Opening/other = noon, Closing/Weekly = end of day.
 */
export function complianceDeadline(type: string, ymd: string): Date {
  if (type === 'CLOSING' || type === 'WEEKLY') return chicagoWallTime(ymd, 23, 59, 59, 999);
  return chicagoWallTime(ymd, 12, 0, 0, 0);
}

/** Business date a submission counts on. Stored date wins; legacy rows fall back to Chicago date of submittedAt. */
export function submissionBusinessDate(s: ComplianceSubmissionLike): string | null {
  if (s.date && /^\d{4}-\d{2}-\d{2}$/.test(s.date)) return s.date;
  if (s.submittedAt) return chicagoYmdOf(new Date(s.submittedAt));
  return null;
}

/** Finalized submission for a template on a business date (latest submittedAt if several). */
export function findDaySubmission<T extends ComplianceSubmissionLike>(
  submissions: T[],
  templateId: string,
  ymd: string,
): T | undefined {
  const matches = submissions.filter(s =>
    s.templateId === templateId && s.status !== 'DRAFT' && submissionBusinessDate(s) === ymd
  );
  if (matches.length <= 1) return matches[0];
  return [...matches].sort((a, b) => (b.submittedAt || '').localeCompare(a.submittedAt || ''))[0];
}

/** Status for one template on one business date. */
export function complianceStatus(args: {
  submission?: ComplianceSubmissionLike;
  type: string;
  ymd: string;
  now: Date;
}): ComplianceStatus {
  const { submission, type, ymd, now } = args;
  const todayStr = chicagoYmdOf(now);
  if (ymd > todayStr) return 'FUTURE';
  const deadline = complianceDeadline(type, ymd);
  if (submission) {
    if (!submission.submittedAt) return 'COMPLETED';
    return new Date(submission.submittedAt) <= deadline ? 'COMPLETED' : 'LATE';
  }
  if (ymd === todayStr && now <= deadline) return 'FUTURE';
  return 'MISSING';
}

/** Last N business dates ending today (Chicago), oldest first. */
export function lastBusinessDays(n: number, now: Date = new Date()): string[] {
  const today = chicagoYmdOf(now);
  return Array.from({ length: n }, (_, i) => shiftYmd(today, -(n - 1 - i)));
}
