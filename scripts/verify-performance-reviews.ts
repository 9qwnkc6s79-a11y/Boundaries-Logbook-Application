/**
 * Smoke: monthly two-way performance reviews (period, who, visibility, lock, prune).
 * Run: npx --yes tsx scripts/verify-performance-reviews.ts
 */
import { PerformanceReview, User, UserRole } from '../types.ts';
import {
  canWriteDown,
  canWriteUp,
  currentReviewPeriod,
  dueDownSubjects,
  dueUpSubjects,
  employeesDueToReviewManager,
  findReview,
  makeReviewId,
  periodMonthsAgo,
  prunePerformanceReviews,
  REVIEW_RETENTION_MONTHS,
  upsertPerformanceReview,
  visibleReviews,
} from '../utils/performanceReviews.ts';

function assert(cond: unknown, message: string): asserts cond {
  if (!cond) throw new Error(message);
}

function user(partial: Partial<User> & Pick<User, 'id' | 'name' | 'role' | 'storeId'>): User {
  return {
    email: `${partial.id}@boundariescoffee.com`,
    ...partial,
  };
}

// Existing store IDs only — store-elm / store-prosper.
const elmGm = user({ id: 'u-gm-elm', name: 'Elm GM', role: UserRole.MANAGER, storeId: 'store-elm' });
const prosperGm = user({ id: 'u-gm-pro', name: 'Prosper GM', role: UserRole.MANAGER, storeId: 'store-prosper' });
const barista = user({ id: 'u-bar-1', name: 'Barista One', role: UserRole.TRAINEE, storeId: 'store-elm' });
const trainer = user({ id: 'u-tr-1', name: 'Trainer One', role: UserRole.TRAINER, storeId: 'store-elm' });
const inactive = user({ id: 'u-old', name: 'Inactive', role: UserRole.TRAINEE, storeId: 'store-elm', active: false });
const daniel = user({ id: 'u-admin-1', name: 'Daniel', role: UserRole.ADMIN, storeId: 'store-elm' });
const otherBarista = user({ id: 'u-bar-2', name: 'Barista Two', role: UserRole.TRAINEE, storeId: 'store-prosper' });

const users = [elmGm, prosperGm, barista, trainer, inactive, daniel, otherBarista];

// --- Period is America/Chicago calendar month, not UTC --------------------
// 2026-09-01 04:00 UTC = 2026-08-31 23:00 CDT
assert(currentReviewPeriod(new Date('2026-09-01T04:00:00Z')) === '2026-08', '04:00 UTC Sep 1 should still be August in Chicago');
assert(currentReviewPeriod(new Date('2026-09-01T06:00:00Z')) === '2026-09', '06:00 UTC Sep 1 should be September in Chicago');
assert(periodMonthsAgo('2026-08', 18) === '2025-02', '18-month cutoff from 2026-08 is 2025-02');

// --- Who can write / who is reviewable -----------------------------------
assert(canWriteDown(elmGm) && canWriteDown(daniel), 'MANAGER and ADMIN write DOWN');
assert(!canWriteDown(barista), 'employees do not write DOWN');
assert(canWriteUp(barista) && canWriteUp(elmGm), 'non-admin employees (including GM) may write UP');
assert(!canWriteUp(daniel), 'ADMIN does not write UP');

const floater = user({ id: 'u-float', name: 'No Store', role: UserRole.TRAINEE, storeId: '' });
const usersWithFloater = [...users, floater];

const down = dueDownSubjects(usersWithFloater, [], elmGm, 'store-elm', '2026-08');
assert(down.some(u => u.id === barista.id), 'DOWN includes active store employee');
assert(down.some(u => u.id === daniel.id), 'DOWN can include ADMIN at the store (reviewer excluded only)');
assert(!down.some(u => u.id === elmGm.id), 'DOWN excludes the reviewer');
assert(!down.some(u => u.id === inactive.id), 'DOWN excludes inactive');
assert(!down.some(u => u.id === otherBarista.id), 'DOWN stays on current store (store-elm), not store-prosper');
assert(!down.some(u => u.id === floater.id), 'DOWN excludes users with no storeId');

const up = dueUpSubjects(users, [], barista, 'store-elm', '2026-08');
assert(up.length === 1 && up[0].id === elmGm.id, 'UP targets the store MANAGER only');
assert(!up.some(u => u.id === daniel.id), 'UP must not require reviewing ADMIN (Daniel)');

const prosperUp = dueUpSubjects(users, [], otherBarista, 'store-prosper', '2026-08');
assert(prosperUp.length === 1 && prosperUp[0].id === prosperGm.id, 'Prosper staff review the Prosper MANAGER');

// --- Uniqueness + draft edit + submitted lock ----------------------------
const period = '2026-08';
const draft: PerformanceReview = {
  id: makeReviewId(elmGm.id, barista.id, period, 'DOWN'),
  reviewerId: elmGm.id,
  reviewerName: elmGm.name,
  subjectId: barista.id,
  subjectName: barista.name,
  storeId: 'store-elm',
  period,
  direction: 'DOWN',
  status: 'DRAFT',
  overall: 4,
  keepDoing: 'Latte art',
  createdAt: '2026-08-01T12:00:00Z',
  updatedAt: '2026-08-01T12:00:00Z',
};

const afterDraft = upsertPerformanceReview([], draft, '2026-08-02T12:00:00Z');
assert(afterDraft?.length === 1, 'insert draft');

const edited = upsertPerformanceReview(afterDraft!, { ...draft, overall: 5, notes: 'Great month' }, '2026-08-03T12:00:00Z');
assert(edited?.length === 1 && edited[0].overall === 5 && edited[0].notes === 'Great month', 'own draft is editable');

const submitted = upsertPerformanceReview(edited!, { ...draft, overall: 5, status: 'SUBMITTED', notes: 'Great month' }, '2026-08-04T12:00:00Z');
assert(submitted?.[0].status === 'SUBMITTED' && submitted[0].submittedAt, 'submit draft');

const locked = upsertPerformanceReview(submitted!, { ...draft, overall: 1, status: 'DRAFT', notes: 'try again' }, '2026-08-05T12:00:00Z');
assert(locked === null, 'submitted reviews are locked — even the author cannot edit');

const duplicate = upsertPerformanceReview(submitted!, {
  ...draft,
  id: 'pr-other-id',
  overall: 2,
  status: 'SUBMITTED',
}, '2026-08-06T12:00:00Z');
assert(duplicate === null, 'second SUBMITTED for the same (reviewer, subject, period, direction) is refused');

const found = findReview(submitted!, elmGm.id, barista.id, period, 'DOWN');
assert(found?.status === 'SUBMITTED', 'lookup by identity key');

// --- Due lists count only SUBMITTED --------------------------------------
assert(dueDownSubjects(users, edited!, elmGm, 'store-elm', period).some(u => u.id === barista.id), 'DRAFT does not clear due');
assert(!dueDownSubjects(users, submitted!, elmGm, 'store-elm', period).some(u => u.id === barista.id), 'SUBMITTED clears due');

const upDraft: PerformanceReview = {
  ...draft,
  id: makeReviewId(barista.id, elmGm.id, period, 'UP'),
  reviewerId: barista.id,
  reviewerName: barista.name,
  subjectId: elmGm.id,
  subjectName: elmGm.name,
  direction: 'UP',
  status: 'DRAFT',
  overall: 5,
};
assert(employeesDueToReviewManager(users, [upDraft], elmGm, 'store-elm', period).some(u => u.id === barista.id), 'UP draft does not clear incoming due');

const upDone = upsertPerformanceReview([], { ...upDraft, status: 'SUBMITTED' }, '2026-08-10T12:00:00Z')!;
assert(!employeesDueToReviewManager(users, upDone, elmGm, 'store-elm', period).some(u => u.id === barista.id), 'UP submit clears incoming due');

// --- Visibility: manager cannot read another employee's UP of a different manager
const prosperUpReview: PerformanceReview = {
  id: makeReviewId(otherBarista.id, prosperGm.id, period, 'UP'),
  reviewerId: otherBarista.id,
  reviewerName: otherBarista.name,
  subjectId: prosperGm.id,
  subjectName: prosperGm.name,
  storeId: 'store-prosper',
  period,
  direction: 'UP',
  status: 'SUBMITTED',
  overall: 3,
  notes: 'private to prosper GM',
  createdAt: '2026-08-08T12:00:00Z',
  updatedAt: '2026-08-08T12:00:00Z',
  submittedAt: '2026-08-08T12:00:00Z',
};

const elmSees = visibleReviews([prosperUpReview, ...upDone], elmGm);
assert(!elmSees.some(r => r.id === prosperUpReview.id), 'Elm GM must not see Prosper staff UP of the Prosper GM');
assert(elmSees.some(r => r.subjectId === elmGm.id), 'Elm GM sees UP about themselves');

const baristaSees = visibleReviews([prosperUpReview, submitted![0], upDone[0]], barista);
assert(baristaSees.some(r => r.id === submitted![0].id), 'subject sees SUBMITTED DOWN about them');
assert(baristaSees.some(r => r.reviewerId === barista.id), 'reviewer sees what they wrote');
assert(!baristaSees.some(r => r.id === prosperUpReview.id), 'employee does not see another store’s UP');

const adminSees = visibleReviews([prosperUpReview], daniel);
assert(adminSees.length === 1, 'ADMIN sees all stores');

const prosperGmSees = visibleReviews([prosperUpReview, upDone[0]], prosperGm);
assert(prosperGmSees.some(r => r.id === prosperUpReview.id), 'Prosper GM sees UP about themselves');
assert(!prosperGmSees.some(r => r.id === upDone[0].id), 'Prosper GM does not see Elm staff UP of Elm GM');

// --- Prune only when oversized; keep ≥ 18 months -------------------------
const old: PerformanceReview = { ...draft, period: periodMonthsAgo(period, 19), id: 'pr-old' };
const recent: PerformanceReview = { ...draft, period, id: draft.id };
const small = prunePerformanceReviews([old, recent], period, 900000);
assert(small.some(r => r.period === old.period), 'under size cap, keep reviews older than 18 months');

const bulky = { ...old, notes: 'x'.repeat(2000) };
const pruned = prunePerformanceReviews([bulky, recent], period, 500);
assert(!pruned.some(r => r.period === bulky.period), 'over size cap, drop older than 18 months');
assert(pruned.some(r => r.period === period), `keep the last ${REVIEW_RETENTION_MONTHS} months`);

console.log('verify-performance-reviews: ok');
