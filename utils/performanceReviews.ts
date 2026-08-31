import { PerformanceReview, ReviewDirection, Store, User, UserRole } from '../types';

export const REVIEW_TZ = 'America/Chicago';
export const REVIEW_RETENTION_MONTHS = 18;

export function currentReviewPeriod(now: Date = new Date()): string {
  // en-CA yields YYYY-MM-DD in the given zone — same pattern as toast.ts / Food86Panel.
  return now.toLocaleDateString('en-CA', { timeZone: REVIEW_TZ }).slice(0, 7);
}

export function formatReviewPeriod(period: string): string {
  const [year, month] = period.split('-').map(Number);
  if (!year || !month) return period;
  return new Date(year, month - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export function periodMonthsAgo(period: string, months: number): string {
  const [year, month] = period.split('-').map(Number);
  const d = new Date(year, month - 1 - months, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function reviewIdentity(reviewerId: string, subjectId: string, period: string, direction: ReviewDirection): string {
  return `${reviewerId}:${subjectId}:${period}:${direction}`;
}

export function reviewIdentityOf(review: Pick<PerformanceReview, 'reviewerId' | 'subjectId' | 'period' | 'direction'>): string {
  return reviewIdentity(review.reviewerId, review.subjectId, review.period, review.direction);
}

export function makeReviewId(reviewerId: string, subjectId: string, period: string, direction: ReviewDirection): string {
  return `pr-${reviewerId}-${subjectId}-${period}-${direction}`;
}

export function isActiveUser(user: User): boolean {
  return user.active !== false;
}

/** Assigned to this store. Unassigned accounts do not appear on every roster. */
export function userOnStore(user: User, storeId: string): boolean {
  return !!user.storeId && user.storeId === storeId;
}

export function usersOnStore(users: User[], storeId: string): User[] {
  return users.filter(u => userOnStore(u, storeId));
}

/** Hub / Team / Training / People roster: this store, and not deactivated. */
export function storeRosterUsers(users: User[], storeId: string): User[] {
  return users.filter(u => isActiveUser(u) && userOnStore(u, storeId));
}

export function canWriteDown(user: User): boolean {
  return user.role === UserRole.MANAGER || user.role === UserRole.ADMIN;
}

export function canWriteUp(user: User): boolean {
  return isActiveUser(user) && user.role !== UserRole.ADMIN;
}

export function downSubjects(users: User[], reviewer: User, storeId: string): User[] {
  return usersOnStore(users, storeId)
    .filter(u => isActiveUser(u) && u.id !== reviewer.id)
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** Active MANAGER users on the reviewer's store. ADMIN (e.g. Daniel) is not a target. */
export function upSubjects(users: User[], reviewer: User, storeId: string): User[] {
  return usersOnStore(users, storeId)
    .filter(u => isActiveUser(u) && u.role === UserRole.MANAGER && u.id !== reviewer.id)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function findReview(
  reviews: PerformanceReview[],
  reviewerId: string,
  subjectId: string,
  period: string,
  direction: ReviewDirection
): PerformanceReview | undefined {
  const key = reviewIdentity(reviewerId, subjectId, period, direction);
  return reviews.find(r => reviewIdentityOf(r) === key);
}

export function isSubmittedLocked(review: PerformanceReview): boolean {
  return review.status === 'SUBMITTED';
}

export function canEditReview(review: PerformanceReview, viewer: User): boolean {
  return review.reviewerId === viewer.id && review.status === 'DRAFT';
}

/**
 * Reviewer sees what they wrote. Subject sees SUBMITTED about them.
 * ADMIN sees everything. A manager does not see another employee's UP of a different manager.
 */
export function visibleReviews(reviews: PerformanceReview[], viewer: User): PerformanceReview[] {
  if (viewer.role === UserRole.ADMIN) return [...reviews];
  return reviews.filter(r => {
    if (r.reviewerId === viewer.id) return true;
    if (r.status === 'SUBMITTED' && r.subjectId === viewer.id) return true;
    return false;
  });
}

export function dueDownSubjects(
  users: User[],
  reviews: PerformanceReview[],
  reviewer: User,
  storeId: string,
  period: string
): User[] {
  return downSubjects(users, reviewer, storeId).filter(subject =>
    !reviews.some(r =>
      r.reviewerId === reviewer.id &&
      r.subjectId === subject.id &&
      r.period === period &&
      r.direction === 'DOWN' &&
      r.status === 'SUBMITTED'
    )
  );
}

export function dueUpSubjects(
  users: User[],
  reviews: PerformanceReview[],
  reviewer: User,
  storeId: string,
  period: string
): User[] {
  return upSubjects(users, reviewer, storeId).filter(subject =>
    !reviews.some(r =>
      r.reviewerId === reviewer.id &&
      r.subjectId === subject.id &&
      r.period === period &&
      r.direction === 'UP' &&
      r.status === 'SUBMITTED'
    )
  );
}

/** Employees at the store who still owe this manager an UP review. Names only — not review content. */
export function employeesDueToReviewManager(
  users: User[],
  reviews: PerformanceReview[],
  manager: User,
  storeId: string,
  period: string
): User[] {
  return usersOnStore(users, storeId)
    .filter(u => isActiveUser(u) && canWriteUp(u) && u.id !== manager.id)
    .filter(emp =>
      !reviews.some(r =>
        r.reviewerId === emp.id &&
        r.subjectId === manager.id &&
        r.period === period &&
        r.direction === 'UP' &&
        r.status === 'SUBMITTED'
      )
    )
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function incomingSubmittedReviews(reviews: PerformanceReview[], subjectId: string): PerformanceReview[] {
  return reviews
    .filter(r => r.subjectId === subjectId && r.status === 'SUBMITTED')
    .sort((a, b) => (b.submittedAt || b.updatedAt).localeCompare(a.submittedAt || a.updatedAt));
}

/** SUBMITTED staff→manager reviews the viewer is allowed to see for this store (newest first). */
export function submittedUpReviewsForStore(
  reviews: PerformanceReview[],
  viewer: User,
  storeId: string
): PerformanceReview[] {
  return visibleReviews(reviews, viewer)
    .filter(r => r.direction === 'UP' && r.status === 'SUBMITTED' && r.storeId === storeId)
    .sort((a, b) => (b.submittedAt || b.updatedAt).localeCompare(a.submittedAt || a.updatedAt));
}

/** ADMIN sees every submitted UP. Managers only see UP about themselves (via visibleReviews). */
export function adminCanSeeSubmittedUp(viewer: User, review: PerformanceReview): boolean {
  if (review.direction !== 'UP' || review.status !== 'SUBMITTED') return false;
  return visibleReviews([review], viewer).some(r => r.id === review.id);
}

export interface OwnerReviewNotifyPayload {
  storeName: string;
  managerName: string;
  reviewerName: string;
  period: string;
  overall: number;
  keepDoing?: string;
  startDoing?: string;
  notes?: string;
}

export function ownerReviewNotifyPayload(
  review: Pick<PerformanceReview, 'subjectName' | 'reviewerName' | 'period' | 'overall' | 'keepDoing' | 'startDoing' | 'notes'>,
  storeName: string
): OwnerReviewNotifyPayload {
  return {
    storeName,
    managerName: review.subjectName,
    reviewerName: review.reviewerName,
    period: review.period,
    overall: review.overall,
    keepDoing: review.keepDoing,
    startDoing: review.startDoing,
    notes: review.notes,
  };
}

const UP_INBOX_SEEN_KEY = 'peopleUpInboxSeenAt';

export function readUpInboxSeenAt(): string | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    return localStorage.getItem(UP_INBOX_SEEN_KEY);
  } catch {
    return null;
  }
}

export function writeUpInboxSeenAt(iso: string = new Date().toISOString()): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(UP_INBOX_SEEN_KEY, iso);
  } catch {
    // quota / private mode
  }
}

export function unreadSubmittedUp(
  reviews: PerformanceReview[],
  lastSeenAt: string | null
): PerformanceReview[] {
  return reviews.filter(r => {
    const stamp = r.submittedAt || r.updatedAt;
    return !lastSeenAt || stamp > lastSeenAt;
  });
}

/** Fire-and-forget. Never throws; review save must not wait on email. */
export function notifyOwnerOfSubmittedUp(payload: OwnerReviewNotifyPayload): void {
  try {
    void fetch('/api/notify-owner-review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch(() => undefined);
  } catch {
    // ignore
  }
}

export function writtenReviews(reviews: PerformanceReview[], reviewerId: string): PerformanceReview[] {
  return reviews
    .filter(r => r.reviewerId === reviewerId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function storeLabel(stores: Store[] | undefined, storeId: string): string {
  return stores?.find(s => s.id === storeId)?.name || storeId;
}

function trimOptional(value?: string): string | undefined {
  const next = value?.trim();
  return next ? next : undefined;
}

export function normalizeReview(review: PerformanceReview, nowIso: string = new Date().toISOString()): PerformanceReview {
  const overall = Math.round(Number(review.overall));
  return {
    ...review,
    id: makeReviewId(review.reviewerId, review.subjectId, review.period, review.direction),
    reviewerName: review.reviewerName.trim(),
    subjectName: review.subjectName.trim(),
    overall,
    keepDoing: trimOptional(review.keepDoing),
    startDoing: trimOptional(review.startDoing),
    notes: trimOptional(review.notes),
    updatedAt: nowIso,
    submittedAt: review.status === 'SUBMITTED' ? (review.submittedAt || nowIso) : undefined,
  };
}

export function isValidOverall(overall: number): boolean {
  return Number.isInteger(overall) && overall >= 1 && overall <= 5;
}

/**
 * Insert or update one review. One record per (reviewer, subject, period, direction).
 * SUBMITTED rows are locked. Returns null when the write must be refused.
 */
export function upsertPerformanceReview(
  existing: PerformanceReview[],
  incoming: PerformanceReview,
  nowIso: string = new Date().toISOString()
): PerformanceReview[] | null {
  if (!incoming.reviewerId || !incoming.subjectId || !incoming.period || !incoming.direction) {
    return null;
  }
  if (incoming.reviewerId === incoming.subjectId) {
    return null;
  }
  if (incoming.direction !== 'DOWN' && incoming.direction !== 'UP') {
    return null;
  }
  if (incoming.status !== 'DRAFT' && incoming.status !== 'SUBMITTED') {
    return null;
  }

  const normalized = normalizeReview(incoming, nowIso);
  if (!isValidOverall(normalized.overall)) {
    return null;
  }

  const key = reviewIdentityOf(normalized);
  const idx = existing.findIndex(r => reviewIdentityOf(r) === key);

  if (idx === -1) {
    return [normalized, ...existing];
  }

  const current = existing[idx];
  if (isSubmittedLocked(current)) {
    return null;
  }

  const next = [...existing];
  next[idx] = {
    ...normalized,
    createdAt: current.createdAt || normalized.createdAt,
  };
  return next;
}

/**
 * Drop reviews older than 18 months only when the document is near the 1MB cap.
 * Never prune a window newer than 18 months.
 */
export function prunePerformanceReviews(
  reviews: PerformanceReview[],
  currentPeriod: string,
  maxSizeBytes = 900000
): PerformanceReview[] {
  if (JSON.stringify(reviews).length <= maxSizeBytes) {
    return reviews;
  }
  const cutoff = periodMonthsAgo(currentPeriod, REVIEW_RETENTION_MONTHS);
  const pruned = reviews.filter(r => r.period >= cutoff);
  if (pruned.length < reviews.length) {
    console.log(`[DB] prunePerformanceReviews: Removed ${reviews.length - pruned.length} reviews older than ${REVIEW_RETENTION_MONTHS} months`);
  }
  return pruned;
}
