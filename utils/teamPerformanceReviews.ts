import {
  SopDisciplinaryStatus,
  SopReviewType,
  SopSubjectRole,
  TeamPerformanceReview,
  User,
  UserRole,
} from '../types';
import { isActiveUser, userOnStore } from './performanceReviews';

export const SOP_TZ = 'America/Chicago';

export const SOP_RATING_SCALE = [
  { value: 1, label: 'Needs Immediate Improvement' },
  { value: 2, label: 'Developing' },
  { value: 3, label: 'Meets Expectations' },
  { value: 4, label: 'Exceeds Expectations' },
  { value: 5, label: 'Exceptional' },
] as const;

export const SOP_WEIGHTS: Record<SopSubjectRole, Record<string, number>> = {
  TEAM_MEMBER: {
    appearance: 0.20,
    culture: 0.25,
    reliability: 0.20,
    job: 0.25,
    leadership: 0,
  },
  TEAM_LEADER: {
    appearance: 0.15,
    culture: 0.20,
    reliability: 0.15,
    job: 0.20,
    leadership: 0.30,
  },
};

export const SOP_WEIGHT_PERCENTS = {
  appearance: { tm: 20, tl: 15 },
  culture: { tm: 25, tl: 20 },
  reliability: { tm: 20, tl: 15 },
  job: { tm: 25, tl: 20 },
  leadership: { tm: 0, tl: 30 },
} as const;

export interface SopItemDef {
  id: string;
  title: string;
  low: string;
  high: string;
}

export interface SopSectionDef {
  id: string;
  number: number;
  title: string;
  weightLabel: string;
  teamLeaderOnly?: boolean;
  items: SopItemDef[];
}

/** Verbatim SOP items and low → high anchors from Boundaries_Team_Performance_Review.docx */
export const SOP_SECTIONS: SopSectionDef[] = [
  {
    id: 'appearance',
    number: 1,
    title: 'Appearance & Professionalism',
    weightLabel: 'weight 20% Team Member / 15% Team Leader',
    items: [
      {
        id: 'attire',
        title: 'Attire & Personal Presentation',
        low: 'Frequently out of dress code / unkempt',
        high: 'Always clean, neat, in correct uniform',
      },
      {
        id: 'conductGuests',
        title: 'Conduct Toward Guests',
        low: 'Unprofessional or cold',
        high: 'Warm, confident, hospitable every time',
      },
      {
        id: 'conductTeam',
        title: 'Conduct Toward Team',
        low: 'Creates conflict, affects morale',
        high: 'Respectful, collaborative, uplifting',
      },
    ],
  },
  {
    id: 'culture',
    number: 2,
    title: 'Cultural Values',
    weightLabel: '25% TM / 20% TL',
    items: [
      {
        id: 'passion',
        title: 'Passion',
        low: 'Disengaged, doesn’t care about the craft',
        high: 'Loves the work, takes pride in every shift',
      },
      {
        id: 'hospitality',
        title: 'Hospitality',
        low: 'Transactional with guests',
        high: 'Makes every guest feel welcome and valued',
      },
      {
        id: 'selflessness',
        title: 'Selflessness',
        low: 'Puts self before team or guests',
        high: 'Consistently puts team and guests first',
      },
      {
        id: 'humility',
        title: 'Humility',
        low: 'Defensive, resists correction',
        high: 'Owns mistakes, accepts feedback, teachable',
      },
      {
        id: 'focus',
        title: 'Focus',
        low: 'Easily distracted, loses composure',
        high: 'Sharp and in control even during a rush',
      },
      {
        id: 'fun',
        title: 'Fun',
        low: 'Negative energy, disengaged',
        high: 'Brings energy, makes the shift better',
      },
    ],
  },
  {
    id: 'reliability',
    number: 3,
    title: 'Reliability & Timeliness',
    weightLabel: '20% TM / 15% TL',
    items: [
      {
        id: 'punctuality',
        title: 'Punctuality & Attendance',
        low: 'Late, no-shows, unreliable',
        high: 'Always on time, communicates proactively',
      },
      {
        id: 'preShift',
        title: 'Pre-Shift Readiness',
        low: 'Arrives unprepared',
        high: 'Arrives 15 min early, ready at clock-in',
      },
      {
        id: 'dependability',
        title: 'Dependability',
        low: 'Team can’t count on them',
        high: 'Team always knows they can count on this person',
      },
    ],
  },
  {
    id: 'job',
    number: 4,
    title: 'Job Performance',
    weightLabel: '25% TM / 20% TL',
    items: [
      {
        id: 'drinkQuality',
        title: 'Drink Quality & Accuracy',
        low: 'Frequent mistakes, wrong builds',
        high: 'Every drink correct, every time',
      },
      {
        id: 'speed',
        title: 'Speed & Efficiency',
        low: 'Slow, holds up the line',
        high: 'Fast, efficient, always stays ahead',
      },
      {
        id: 'cleanliness',
        title: 'Cleanliness & Station Upkeep',
        low: 'Leaves station messy',
        high: 'Station always clean, wipes as they go',
      },
      {
        id: 'logbook',
        title: 'Logbook & Checklist Compliance',
        low: 'Skips steps or doesn’t log',
        high: 'Always completes and logs without being reminded',
      },
      {
        id: 'flexibility',
        title: 'Multi-Station Flexibility',
        low: 'Only works one position',
        high: 'Steps in wherever needed without hesitation',
      },
    ],
  },
  {
    id: 'leadership',
    number: 5,
    title: 'Team Leader ONLY',
    weightLabel: 'N/A TM / 30% TL',
    teamLeaderOnly: true,
    items: [
      {
        id: 'floorLeadership',
        title: 'Floor Leadership & Turn Times',
        low: 'Doesn’t drive pace or call out tickets',
        high: 'Drives team to hit 3.5 min target every shift',
      },
      {
        id: 'qualityControl',
        title: 'Quality Control Oversight',
        low: 'Lets substandard drinks pass',
        high: 'Catches and corrects before drinks reach guest',
      },
      {
        id: 'guestRecovery',
        title: 'Guest Recovery',
        low: 'Misses long waits, skips free drink cards',
        high: 'Proactively catches long tickets, recovers correctly',
      },
      {
        id: 'openClose',
        title: 'Opening / Closing Leadership',
        low: 'Steps skipped or not logged',
        high: 'Owns open/close fully, every step logged',
      },
      {
        id: 'escalation',
        title: 'Escalation Judgment',
        low: 'Over- or under-escalates issues',
        high: 'Sound judgment on what to handle vs. escalate',
      },
    ],
  },
];

export const SOP_DISCIPLINARY_LABELS: Record<SopDisciplinaryStatus, string> = {
  NO_CONCERNS: 'No concerns at this time',
  ACTIVE_STRIKE: 'Active strike on record. Strike # + Date',
  PIP_REQUIRED: 'PIP required — to be prepared by Daniel. Date.',
};

export const SOP_FOOTER = 'BOUNDARIES COFFEE — CONFIDENTIAL INTERNAL USE ONLY';

export function chicagoYmd(now: Date = new Date()): string {
  return now.toLocaleDateString('en-CA', { timeZone: SOP_TZ });
}

export function addCalendarDays(ymd: string, days: number): string {
  const [year, month, day] = ymd.split('-').map(Number);
  const dt = new Date(Date.UTC(year, month - 1, day + days, 12, 0, 0));
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}-${String(dt.getUTCDate()).padStart(2, '0')}`;
}

export function chicagoQuarter(now: Date = new Date()): { id: string; year: number; quarter: number; end: string } {
  const ymd = chicagoYmd(now);
  const [year, month] = ymd.split('-').map(Number);
  const quarter = Math.ceil(month / 3);
  const endMonth = quarter * 3;
  const lastDay = new Date(Date.UTC(year, endMonth, 0)).getUTCDate();
  return {
    id: `${year}-Q${quarter}`,
    year,
    quarter,
    end: `${year}-${String(endMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`,
  };
}

export function periodForReviewType(reviewType: SopReviewType, reviewDate: string): string {
  const [year, month] = reviewDate.split('-').map(Number);
  if (reviewType === 'ANNUAL') return String(year);
  if (reviewType === 'PIP') return `PIP-${reviewDate}`;
  const quarter = Math.ceil(month / 3);
  return `${year}-Q${quarter}`;
}

export function formatSopPeriod(period: string): string {
  const q = period.match(/^(\d{4})-Q([1-4])$/);
  if (q) return `Q${q[2]} ${q[1]}`;
  if (/^\d{4}$/.test(period)) return period;
  if (period.startsWith('PIP-')) return `PIP · ${period.slice(4)}`;
  return period;
}

export function defaultSubjectRole(user: User): SopSubjectRole {
  return user.role === UserRole.TRAINER || user.role === UserRole.MANAGER
    ? 'TEAM_LEADER'
    : 'TEAM_MEMBER';
}

export function rosterRoleLabel(user: User): string {
  if (user.role === UserRole.TRAINER) return 'Team Leader';
  if (user.role === UserRole.MANAGER) return 'Manager';
  if (user.role === UserRole.ADMIN) return 'Admin';
  return 'Team Member';
}

export function visibleSopSections(role: SopSubjectRole): SopSectionDef[] {
  return SOP_SECTIONS.filter(section => !section.teamLeaderOnly || role === 'TEAM_LEADER');
}

export function sectionScore(section: SopSectionDef, ratings: Record<string, number>): number | null {
  const values = section.items
    .map(item => ratings[item.id])
    .filter((n): n is number => typeof n === 'number' && n >= 1 && n <= 5);
  if (values.length === 0) return null;
  return values.reduce((sum, n) => sum + n, 0) / values.length;
}

export interface SopAssessmentRow {
  sectionId: string;
  title: string;
  score: number | null;
  tmWeight: number;
  tlWeight: number;
  weightedScore: number | null;
}

export function assessmentRows(role: SopSubjectRole, ratings: Record<string, number>): SopAssessmentRow[] {
  return SOP_SECTIONS.map(section => {
    const skip = section.teamLeaderOnly && role === 'TEAM_MEMBER';
    const score = skip ? null : sectionScore(section, ratings);
    const tmWeight = SOP_WEIGHT_PERCENTS[section.id as keyof typeof SOP_WEIGHT_PERCENTS].tm;
    const tlWeight = SOP_WEIGHT_PERCENTS[section.id as keyof typeof SOP_WEIGHT_PERCENTS].tl;
    const weight = SOP_WEIGHTS[role][section.id];
    return {
      sectionId: section.id,
      title: section.title,
      score,
      tmWeight,
      tlWeight,
      weightedScore: score === null || !weight ? (score === null ? null : 0) : score * weight,
    };
  });
}

/** sum(sectionScore * weight for the chosen role). Blank sections omitted. */
export function weightedScore(role: SopSubjectRole, ratings: Record<string, number>): number | null {
  const rows = assessmentRows(role, ratings);
  const parts = rows.filter(row => row.weightedScore !== null && SOP_WEIGHTS[role][row.sectionId] > 0);
  if (parts.length === 0) return null;
  return parts.reduce((sum, row) => sum + (row.weightedScore || 0), 0);
}

export function roundedOverallDefault(score: number | null): number {
  if (score === null) return 0;
  return Math.min(5, Math.max(1, Math.round(score)));
}

export function sopReviewIdentity(subjectId: string, period: string, reviewType: SopReviewType): string {
  return `${subjectId}:${period}:${reviewType}`;
}

export function sopReviewIdentityOf(review: Pick<TeamPerformanceReview, 'subjectId' | 'period' | 'reviewType'>): string {
  return sopReviewIdentity(review.subjectId, review.period, review.reviewType);
}

export function makeSopReviewId(subjectId: string, period: string, reviewType: SopReviewType): string {
  return `tpr-${subjectId}-${period}-${reviewType}`;
}

export function canWriteSopReview(user: User): boolean {
  return user.role === UserRole.MANAGER || user.role === UserRole.ADMIN;
}

export function canSetPip(user: User): boolean {
  return user.role === UserRole.ADMIN;
}

export function isSopSubmittedLocked(review: TeamPerformanceReview, viewer: User): boolean {
  return review.status === 'SUBMITTED' && viewer.role !== UserRole.ADMIN;
}

export function canEditSopReview(review: TeamPerformanceReview, viewer: User): boolean {
  if (viewer.role === UserRole.ADMIN) return true;
  if (review.status === 'SUBMITTED') return false;
  return review.reviewerId === viewer.id;
}

export function storeRoster(users: User[], storeId: string): User[] {
  return users
    .filter(u => isActiveUser(u) && userOnStore(u, storeId))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function latestSubmittedSop(reviews: TeamPerformanceReview[], subjectId: string): TeamPerformanceReview | undefined {
  return reviews
    .filter(r => r.subjectId === subjectId && r.status === 'SUBMITTED')
    .sort((a, b) => (b.submittedAt || b.updatedAt).localeCompare(a.submittedAt || a.updatedAt))[0];
}

export function findSopReview(
  reviews: TeamPerformanceReview[],
  subjectId: string,
  period: string,
  reviewType: SopReviewType
): TeamPerformanceReview | undefined {
  const key = sopReviewIdentity(subjectId, period, reviewType);
  return reviews.find(r => sopReviewIdentityOf(r) === key);
}

/**
 * Read a hire/start date only if it already exists on the user object.
 * Does not add or invent a hireDate field.
 */
export function existingHireOrStartDate(user: User): string | undefined {
  const extra = user as User & { hireDate?: unknown; startDate?: unknown };
  for (const value of [extra.hireDate, extra.startDate]) {
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
      return value.slice(0, 10);
    }
  }
  return undefined;
}

export function nextSopDueDate(
  user: User,
  reviews: TeamPerformanceReview[],
  now: Date = new Date()
): string {
  const today = chicagoYmd(now);
  const hire = existingHireOrStartDate(user);
  if (hire) {
    const d30 = addCalendarDays(hire, 30);
    const d60 = addCalendarDays(hire, 60);
    const d90 = addCalendarDays(hire, 90);
    if (today <= d30) return d30;
    if (today <= d60) return d60;
    if (today <= d90) return d90;
  }

  const last = latestSubmittedSop(reviews, user.id);
  if (last) {
    const submittedYmd = (last.submittedAt || last.reviewDate || last.updatedAt).slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(submittedYmd)) {
      return addCalendarDays(submittedYmd, 90);
    }
  }

  return chicagoQuarter(now).end;
}

export function isSopOverdue(dueYmd: string, now: Date = new Date()): boolean {
  return chicagoYmd(now) > dueYmd;
}

function trimOptional(value?: string): string | undefined {
  const next = value?.trim();
  return next ? next : undefined;
}

function cleanRatings(ratings: Record<string, number> | undefined): Record<string, number> {
  const next: Record<string, number> = {};
  if (!ratings) return next;
  for (const [key, value] of Object.entries(ratings)) {
    const n = Number(value);
    if (Number.isInteger(n) && n >= 1 && n <= 5) next[key] = n;
  }
  return next;
}

export function normalizeSopReview(
  review: TeamPerformanceReview,
  nowIso: string = new Date().toISOString()
): TeamPerformanceReview {
  const ratings = cleanRatings(review.ratings);
  const score = weightedScore(review.subjectRole, ratings);
  const overall = Math.round(Number(review.overallRating)) || 0;
  return {
    ...review,
    id: makeSopReviewId(review.subjectId, review.period, review.reviewType),
    subjectName: review.subjectName.trim(),
    reviewerName: review.reviewerName.trim(),
    reviewedByName: review.reviewedByName.trim(),
    ratings,
    sectionComments: review.sectionComments || {},
    developmentPlan: review.developmentPlan || [],
    goals: review.goals || [],
    overallRating: overall,
    weightedScore: score === null ? undefined : Math.round(score * 100) / 100,
    keyThemes: trimOptional(review.keyThemes),
    strikeNumber: review.disciplinaryStatus === 'ACTIVE_STRIKE' ? review.strikeNumber : undefined,
    strikeDate: review.disciplinaryStatus === 'ACTIVE_STRIKE' ? trimOptional(review.strikeDate) : undefined,
    pipDate: review.disciplinaryStatus === 'PIP_REQUIRED' ? trimOptional(review.pipDate) : undefined,
    managerPrintName: trimOptional(review.managerPrintName),
    managerSignedDate: trimOptional(review.managerSignedDate),
    teamMemberPrintName: trimOptional(review.teamMemberPrintName),
    teamMemberSignedDate: trimOptional(review.teamMemberSignedDate),
    updatedAt: nowIso,
    submittedAt: review.status === 'SUBMITTED' ? (review.submittedAt || nowIso) : undefined,
  };
}

export function upsertTeamPerformanceReview(
  existing: TeamPerformanceReview[],
  incoming: TeamPerformanceReview,
  actor: User,
  nowIso: string = new Date().toISOString()
): TeamPerformanceReview[] | null {
  if (!incoming.subjectId || !incoming.period || !incoming.reviewType || !incoming.reviewerId) {
    return null;
  }
  if (incoming.reviewType !== 'QUARTERLY' && incoming.reviewType !== 'ANNUAL' && incoming.reviewType !== 'PIP') {
    return null;
  }
  if (incoming.subjectRole !== 'TEAM_MEMBER' && incoming.subjectRole !== 'TEAM_LEADER') {
    return null;
  }
  if (incoming.status !== 'DRAFT' && incoming.status !== 'SUBMITTED') {
    return null;
  }
  if (!canWriteSopReview(actor)) {
    return null;
  }
  if (incoming.disciplinaryStatus === 'PIP_REQUIRED' && !canSetPip(actor)) {
    return null;
  }
  if (incoming.status === 'SUBMITTED') {
    const overall = Math.round(Number(incoming.overallRating));
    if (!(overall >= 1 && overall <= 5)) {
      return null;
    }
  }

  const normalized = normalizeSopReview(incoming, nowIso);
  const key = sopReviewIdentityOf(normalized);
  const idx = existing.findIndex(r => sopReviewIdentityOf(r) === key);

  if (idx === -1) {
    return [normalized, ...existing];
  }

  const current = existing[idx];
  if (current.status === 'SUBMITTED' && actor.role !== UserRole.ADMIN) {
    return null;
  }
  if (current.status === 'DRAFT' && current.reviewerId !== actor.id && actor.role !== UserRole.ADMIN) {
    return null;
  }

  const next = [...existing];
  next[idx] = {
    ...normalized,
    createdAt: current.createdAt || normalized.createdAt,
    submittedAt: normalized.status === 'SUBMITTED'
      ? (current.status === 'SUBMITTED' ? (current.submittedAt || normalized.submittedAt) : normalized.submittedAt)
      : undefined,
  };
  return next;
}

export const SOP_RETENTION_MONTHS = 24;

export function pruneTeamPerformanceReviews(
  reviews: TeamPerformanceReview[],
  now: Date = new Date(),
  maxSizeBytes = 900000
): TeamPerformanceReview[] {
  if (JSON.stringify(reviews).length <= maxSizeBytes) {
    return reviews;
  }
  const cutoff = addCalendarDays(chicagoYmd(now), -Math.round((SOP_RETENTION_MONTHS * 365) / 12));
  const pruned = reviews.filter(r => {
    const stamp = (r.submittedAt || r.reviewDate || r.updatedAt).slice(0, 10);
    return stamp >= cutoff;
  });
  if (pruned.length < reviews.length) {
    console.log(`[DB] pruneTeamPerformanceReviews: Removed ${reviews.length - pruned.length} reviews older than ${SOP_RETENTION_MONTHS} months`);
  }
  return pruned;
}
