/**
 * Manager Hub 7-day grid: checklists land on their stored business date
 * (s.date), not the UTC date of submittedAt. On-time compares submittedAt
 * to the deadline in America/Chicago.
 * Run: npx --yes tsx scripts/verify-compliance-business-date.ts
 */
import {
  chicagoWallTime,
  complianceDeadline,
  complianceStatus,
  findDaySubmission,
  lastBusinessDays,
} from '../utils/complianceMatrix.ts';

function assert(cond: unknown, message: string): asserts cond {
  if (!cond) throw new Error(message);
}

// Real live closes (ids/submittedAt from organizations/org-boundaries/data/submissions, Oct 2026).
const PR_CLOSE = 'ct-closing-store-prosper';
const LE_CLOSE = 'ct-closing-store-elm';
const subs = [
  { id: 'sub-1792103488342', templateId: PR_CLOSE, date: '2026-10-15', status: 'PENDING', submittedAt: '2026-10-16T00:25:35.287Z' }, // 7:25 PM CT
  { id: 'sub-1792196652292', templateId: PR_CLOSE, date: '2026-10-16', status: 'PENDING', submittedAt: '2026-10-17T00:25:27.592Z' }, // 7:25 PM CT
  { id: 'sub-1792368272853', templateId: PR_CLOSE, date: '2026-10-18', status: 'PENDING', submittedAt: '2026-10-19T00:06:34.157Z' }, // 7:06 PM CT
  { id: 'sub-1792109898622', templateId: LE_CLOSE, date: '2026-10-15', status: 'PENDING', submittedAt: '2026-10-16T00:21:42.708Z' }, // 7:21 PM CT
  { id: 'sub-1792195131495', templateId: LE_CLOSE, date: '2026-10-16', status: 'PENDING', submittedAt: '2026-10-17T00:01:03.147Z' }, // 7:01 PM CT
  { id: 'sub-1792280868492', templateId: LE_CLOSE, date: '2026-10-17', status: 'PENDING', submittedAt: '2026-10-17T23:52:50.496Z' }, // 6:52 PM CT
  { id: 'sub-1792369036896', templateId: LE_CLOSE, date: '2026-10-18', status: 'PENDING', submittedAt: '2026-10-19T00:20:20.485Z' }, // 7:20 PM CT
  { id: 'draft', templateId: PR_CLOSE, date: '2026-10-17', status: 'DRAFT' }, // drafts never count
];

const now = new Date('2026-10-19T16:39:00Z'); // Mon Oct 19, 11:39 AM CT
const days = lastBusinessDays(7, now);
assert(days.join(',') === '2026-10-13,2026-10-14,2026-10-15,2026-10-16,2026-10-17,2026-10-18,2026-10-19', `last 7 days wrong: ${days}`);

const grid = (tpl: string) => days.map(d => {
  const sub = findDaySubmission(subs, tpl, d);
  return { d, id: sub?.id || '-', status: complianceStatus({ submission: sub, type: 'CLOSING', ymd: d, now }) };
});

const pr = grid(PR_CLOSE);
const le = grid(LE_CLOSE);
const print = (label: string, rows: ReturnType<typeof grid>) => {
  console.log(label);
  rows.forEach(r => console.log(`  ${r.d}  ${r.status.padEnd(9)} ${r.id}`));
};
print('Prosper Closing (Hub grid, Oct 19 11:39 AM CT):', pr);
print('Little Elm Closing (Hub grid, Oct 19 11:39 AM CT):', le);

const at = (rows: ReturnType<typeof grid>, d: string) => rows.find(r => r.d === d)!;

// Prosper Oct 15 + Oct 18 land on their own nights (were shifted to Oct 16 / Oct 19).
assert(at(pr, '2026-10-15').id === 'sub-1792103488342' && at(pr, '2026-10-15').status === 'COMPLETED', 'Prosper Oct 15 close must be on Oct 15');
assert(at(pr, '2026-10-16').id === 'sub-1792196652292', 'Prosper Oct 16 close must be on Oct 16');
assert(at(pr, '2026-10-18').id === 'sub-1792368272853' && at(pr, '2026-10-18').status === 'COMPLETED', 'Prosper Oct 18 close must be on Oct 18');
assert(at(pr, '2026-10-17').status === 'MISSING', 'Prosper Oct 17 has no close (draft does not count)');
assert(at(pr, '2026-10-19').status === 'FUTURE', 'Oct 19 close is not due yet at 11:39 AM');

// LE Oct 16 + Oct 17 both count (before, both hit UTC Oct 17 and one was dropped).
assert(at(le, '2026-10-16').id === 'sub-1792195131495' && at(le, '2026-10-16').status === 'COMPLETED', 'LE Oct 16 close must be on Oct 16');
assert(at(le, '2026-10-17').id === 'sub-1792280868492' && at(le, '2026-10-17').status === 'COMPLETED', 'LE Oct 17 close must be on Oct 17');
assert(at(le, '2026-10-15').status === 'COMPLETED' && at(le, '2026-10-18').status === 'COMPLETED', 'LE Oct 15 / Oct 18 on their own nights');

// Completion Rate input comes straight from these grid statuses.
const applicable = pr.filter(r => r.status !== 'FUTURE' && r.status !== 'N/A');
const done = applicable.filter(r => r.status === 'COMPLETED' || r.status === 'LATE').length;
console.log(`Prosper closing completion (grid): ${done}/${applicable.length}`);
assert(done === 3 && applicable.length === 6, 'Prosper closing grid: Oct 15, 16, 18 done; Oct 13, 14, 17 missing');

// Deadlines are Chicago wall time regardless of the machine's zone.
assert(chicagoWallTime('2026-10-18', 23, 59, 59, 999).toISOString() === '2026-10-19T04:59:59.999Z', 'CDT end of day');
assert(chicagoWallTime('2026-11-02', 12).toISOString() === '2026-11-02T18:00:00.000Z', 'CST noon after DST ends');
assert(complianceDeadline('OPENING', '2026-10-18').toISOString() === '2026-10-18T17:00:00.000Z', 'Opening deadline noon CT');

// LATE: a close submitted after midnight CT on its business date is late, still on its own day.
const late = { templateId: PR_CLOSE, date: '2026-10-10', status: 'PENDING', submittedAt: '2026-10-11T05:30:00Z' }; // 12:30 AM CT Oct 11
assert(findDaySubmission([late], PR_CLOSE, '2026-10-10') === late, 'after-midnight close stays on its business date');
assert(complianceStatus({ submission: late, type: 'CLOSING', ymd: '2026-10-10', now }) === 'LATE', 'after-midnight close is LATE');

// Legacy row with no stored date falls back to the Chicago date of submittedAt (not UTC).
const legacy = { templateId: PR_CLOSE, status: 'PENDING', submittedAt: '2026-10-08T00:10:00Z' }; // 7:10 PM CT Oct 7
assert(findDaySubmission([legacy], PR_CLOSE, '2026-10-07') === legacy, 'legacy row uses Chicago date');

console.log('compliance business-date: ok');
