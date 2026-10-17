/** Smoke: staff→manager (UP) feedback is visible only to Daniel (u-admin-1). */
import { readFileSync } from 'node:fs';
import { OWNER_USER_ID, isOwnerViewer, submittedUpReviewsForStore, visibleReviews } from '../utils/performanceReviews.ts';
import { UserRole } from '../types.ts';
import type { PerformanceReview, User } from '../types.ts';
function assert(c: unknown, m: string): asserts c { if (!c) throw new Error(m); }
const u = (id: string, role: UserRole): User => ({ id, name: id, email: `${id}@x`, role, storeId: 'store-elm' } as User);
const daniel = u('u-admin-1', UserRole.ADMIN), kate = u('u-admin-2', UserRole.ADMIN), heath = u('heath', UserRole.ADMIN);
const mgr = u('mgr', UserRole.MANAGER), staff = u('staff', UserRole.TRAINEE), other = u('other', UserRole.TRAINEE);
const r = (id: string, reviewerId: string, subjectId: string, direction: 'UP' | 'DOWN'): PerformanceReview => ({
  id, reviewerId, reviewerName: reviewerId, subjectId, subjectName: subjectId, storeId: 'store-elm',
  period: '2026-10', direction, status: 'SUBMITTED', overall: 4, createdAt: 'x', updatedAt: 'x', submittedAt: 'x',
});
const all = [r('up1', 'staff', 'mgr', 'UP'), r('up2', 'other', 'kate', 'UP'), r('down1', 'mgr', 'staff', 'DOWN')];
assert(OWNER_USER_ID === 'u-admin-1' && isOwnerViewer(daniel) && !isOwnerViewer(kate), 'owner by id');
assert(visibleReviews(all, daniel).length === 3, 'Daniel sees all');
for (const v of [kate, heath, mgr, other]) {
  assert(!visibleReviews(all, v).some(x => x.direction === 'UP' && x.reviewerId !== v.id), `${v.id} sees no UP by others`);
  assert(submittedUpReviewsForStore(all, v, 'store-elm').every(x => x.reviewerId === v.id), `${v.id} inbox has no others' UP`);
}
assert(!visibleReviews(all, mgr).some(x => x.id === 'up1'), 'reviewed manager cannot see UP about them');
assert(!visibleReviews(all, kate).some(x => x.id === 'up2'), 'Kate cannot see UP about her');
assert(visibleReviews(all, staff).some(x => x.id === 'up1'), 'author still sees own review');
assert(visibleReviews(all, staff).some(x => x.id === 'down1'), 'staff sees DOWN about them');
assert(visibleReviews(all, kate).some(x => x.id === 'down1'), 'other admins keep DOWN visibility');
assert(submittedUpReviewsForStore(all, daniel, 'store-elm').length === 2, 'Daniel inbox has both UP');
const pp = readFileSync(new URL('../components/PeoplePanel.tsx', import.meta.url), 'utf8');
assert(!pp.includes('currentUser.role === UserRole.ADMIN'), 'People UP inbox not gated by role');
assert(pp.includes('{isOwnerViewer(currentUser) && (\n        <section'), 'feedback section owner-only');
assert(pp.includes('.then(all => visibleReviews(all, currentUser))'), 'People keeps only visible reviews in memory');
console.log('verify-upward-feedback-privacy: OK');
