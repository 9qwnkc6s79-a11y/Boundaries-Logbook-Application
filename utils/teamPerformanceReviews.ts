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
  TARDY_NO_SHOW: 'Tardy / no-show',
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

export function chicagoMonth(now: Date = new Date()): { id: string; year: number; month: number; end: string } {
  const ymd = chicagoYmd(now);
  const [year, month] = ymd.split('-').map(Number);
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return {
    id: `${year}-${String(month).padStart(2, '0')}`,
    year,
    month,
    end: `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`,
  };
}

export function chicagoYear(now: Date = new Date()): { id: string; end: string } {
  const year = Number(chicagoYmd(now).slice(0, 4));
  return { id: String(year), end: `${year}-12-31` };
}

/** Cadence starts when People SOP shipped. Do not invent earlier monthly / checkpoint dues. */
export const MONTHLY_CADENCE_START = '2026-08';
export const QUARTERLY_CADENCE_START = '2026-Q3';
export const ANNUAL_CADENCE_START = '2026';

export function previousMonthPeriod(id: string): { id: string; end: string } {
  const [year, month] = id.split('-').map(Number);
  const prev = month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 };
  const lastDay = new Date(Date.UTC(prev.year, prev.month, 0)).getUTCDate();
  const nextId = `${prev.year}-${String(prev.month).padStart(2, '0')}`;
  return { id: nextId, end: `${nextId}-${String(lastDay).padStart(2, '0')}` };
}

export function previousQuarterPeriod(id: string): { id: string; end: string } {
  const match = id.match(/^(\d{4})-Q([1-4])$/);
  if (!match) return { id, end: '' };
  let year = Number(match[1]);
  let quarter = Number(match[2]) - 1;
  if (quarter < 1) {
    quarter = 4;
    year -= 1;
  }
  const endMonth = quarter * 3;
  const lastDay = new Date(Date.UTC(year, endMonth, 0)).getUTCDate();
  return {
    id: `${year}-Q${quarter}`,
    end: `${year}-${String(endMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`,
  };
}

export function previousYearPeriod(id: string): { id: string; end: string } {
  const year = Number(id) - 1;
  return { id: String(year), end: `${year}-12-31` };
}

export function periodForReviewType(reviewType: SopReviewType, reviewDate: string): string {
  const [year, month] = reviewDate.split('-').map(Number);
  if (reviewType === 'MONTHLY') return `${year}-${String(month).padStart(2, '0')}`;
  if (reviewType === 'ANNUAL') return String(year);
  if (reviewType === 'PIP') return `PIP-${reviewDate}`;
  const quarter = Math.ceil(month / 3);
  return `${year}-Q${quarter}`;
}

export function formatSopPeriod(period: string): string {
  const month = period.match(/^(\d{4})-(\d{2})$/);
  if (month) {
    return new Date(Number(month[1]), Number(month[2]) - 1, 1).toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric',
    });
  }
  const q = period.match(/^(\d{4})-Q([1-4])$/);
  if (q) return `Q${q[2]} ${q[1]}`;
  if (/^\d{4}$/.test(period)) return period;
  if (period.startsWith('PIP-')) return `PIP · ${period.slice(4)}`;
  return period;
}

export function formatSopReviewType(reviewType: SopReviewType): string {
  if (reviewType === 'MONTHLY') return 'Monthly';
  if (reviewType === 'QUARTERLY') return 'Quarterly checkpoint';
  if (reviewType === 'ANNUAL') return 'Annual checkpoint';
  return 'PIP';
}

export function isSopCheckpointSubmitted(
  reviews: TeamPerformanceReview[],
  subjectId: string,
  period: string,
  reviewType: SopReviewType
): boolean {
  return findSopReview(reviews, subjectId, period, reviewType)?.status === 'SUBMITTED';
}

export interface SopCheckpoint {
  cadence: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL';
  reviewType: SopReviewType;
  period: string;
  label: string;
  dueYmd: string;
  submitted: boolean;
  overdue: boolean;
  dueToday: boolean;
}

function checkpointFromDef(
  subjectId: string,
  reviews: TeamPerformanceReview[],
  today: string,
  def: Pick<SopCheckpoint, 'cadence' | 'reviewType' | 'period' | 'label' | 'dueYmd'>
): SopCheckpoint {
  const submitted = isSopCheckpointSubmitted(reviews, subjectId, def.period, def.reviewType);
  return {
    ...def,
    submitted,
    overdue: !submitted && today > def.dueYmd,
    dueToday: !submitted && today === def.dueYmd,
  };
}

export function sopCheckpoints(
  subjectId: string,
  reviews: TeamPerformanceReview[],
  now: Date = new Date()
): SopCheckpoint[] {
  const today = chicagoYmd(now);
  const month = chicagoMonth(now);
  const quarter = chicagoQuarter(now);
  const year = chicagoYear(now);
  const current: Array<Pick<SopCheckpoint, 'cadence' | 'reviewType' | 'period' | 'label' | 'dueYmd'>> = [
    {
      cadence: 'MONTHLY',
      reviewType: 'MONTHLY',
      period: month.id,
      label: `Monthly · ${formatSopPeriod(month.id)}`,
      dueYmd: month.end,
    },
    {
      cadence: 'QUARTERLY',
      reviewType: 'QUARTERLY',
      period: quarter.id,
      label: `Quarterly checkpoint · ${formatSopPeriod(quarter.id)}`,
      dueYmd: quarter.end,
    },
    {
      cadence: 'ANNUAL',
      reviewType: 'ANNUAL',
      period: year.id,
      label: `Annual checkpoint · ${year.id}`,
      dueYmd: year.end,
    },
  ];

  const extras: Array<Pick<SopCheckpoint, 'cadence' | 'reviewType' | 'period' | 'label' | 'dueYmd'>> = [];
  const prevMonth = previousMonthPeriod(month.id);
  if (prevMonth.id >= MONTHLY_CADENCE_START && today > prevMonth.end) {
    extras.push({
      cadence: 'MONTHLY',
      reviewType: 'MONTHLY',
      period: prevMonth.id,
      label: `Monthly · ${formatSopPeriod(prevMonth.id)}`,
      dueYmd: prevMonth.end,
    });
  }
  const prevQuarter = previousQuarterPeriod(quarter.id);
  if (prevQuarter.end && prevQuarter.id >= QUARTERLY_CADENCE_START && today > prevQuarter.end) {
    extras.push({
      cadence: 'QUARTERLY',
      reviewType: 'QUARTERLY',
      period: prevQuarter.id,
      label: `Quarterly checkpoint · ${formatSopPeriod(prevQuarter.id)}`,
      dueYmd: prevQuarter.end,
    });
  }
  const prevYear = previousYearPeriod(year.id);
  if (prevYear.id >= ANNUAL_CADENCE_START && today > prevYear.end) {
    extras.push({
      cadence: 'ANNUAL',
      reviewType: 'ANNUAL',
      period: prevYear.id,
      label: `Annual checkpoint · ${prevYear.id}`,
      dueYmd: prevYear.end,
    });
  }

  const seen = new Set<string>();
  return [...extras, ...current]
    .map(def => checkpointFromDef(subjectId, reviews, today, def))
    .filter(point => {
      const key = `${point.reviewType}:${point.period}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .filter(point => point.cadence === 'MONTHLY' || point.cadence === 'ANNUAL' || point.cadence === 'QUARTERLY')
    .filter(point => {
      if (point.period === month.id || point.period === quarter.id || point.period === year.id) return true;
      return !point.submitted;
    });
}

export function nextMonthEnd(now: Date = new Date()): { id: string; end: string } {
  const month = chicagoMonth(now);
  const nextMonth = month.month === 12 ? { year: month.year + 1, month: 1 } : { year: month.year, month: month.month + 1 };
  const lastDay = new Date(Date.UTC(nextMonth.year, nextMonth.month, 0)).getUTCDate();
  const id = `${nextMonth.year}-${String(nextMonth.month).padStart(2, '0')}`;
  return { id, end: `${id}-${String(lastDay).padStart(2, '0')}` };
}

export function primarySopDue(
  user: User,
  reviews: TeamPerformanceReview[],
  now: Date = new Date()
): { dueYmd: string; overdue: boolean; label: string } {
  const today = chicagoYmd(now);
  const hire = existingHireOrStartDate(user);
  if (hire && !latestSubmittedSop(reviews, user.id)) {
    const windows = [30, 60, 90].map(days => addCalendarDays(hire, days));
    const upcoming = windows.find(ymd => today <= ymd);
    if (upcoming) {
      return { dueYmd: upcoming, overdue: false, label: 'New-hire check-in' };
    }
  }

  const checkpoints = sopCheckpoints(user.id, reviews, now);
  const open = checkpoints.filter(c => !c.submitted);
  if (open.length === 0) {
    const next = nextMonthEnd(now);
    return { dueYmd: next.end, overdue: false, label: `Monthly · ${formatSopPeriod(next.id)}` };
  }
  const overdue = open.filter(c => c.overdue).sort((a, b) => a.dueYmd.localeCompare(b.dueYmd));
  if (overdue[0]) return { dueYmd: overdue[0].dueYmd, overdue: true, label: overdue[0].label };
  const soonest = [...open].sort((a, b) => a.dueYmd.localeCompare(b.dueYmd))[0];
  return { dueYmd: soonest.dueYmd, overdue: false, label: soonest.label };
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

/**
 * MONTHLY: one rating per SOP section (item id = section.id). TEAM_MEMBER skips leadership.
 * QUARTERLY / ANNUAL / PIP: full SOP_SECTIONS items (unchanged titles and 1–5 scale).
 */
export function sopSectionsForReviewType(reviewType: SopReviewType, role: SopSubjectRole): SopSectionDef[] {
  const sections = visibleSopSections(role);
  if (reviewType !== 'MONTHLY') return sections;
  return sections.map(section => {
    const first = section.items[0];
    const last = section.items[section.items.length - 1];
    return {
      ...section,
      items: [
        {
          id: section.id,
          title: section.title,
          low: first?.low || section.title,
          high: last?.high || section.title,
        },
      ],
    };
  });
}

export function isSlimMonthlyReview(reviewType: SopReviewType): boolean {
  return reviewType === 'MONTHLY';
}

export function sectionScore(section: SopSectionDef, ratings: Record<string, number>): number | null {
  const values = section.items
    .map(item => ratings[item.id])
    .filter((n): n is number => typeof n === 'number' && n >= 1 && n <= 5);
  if (values.length > 0) {
    return values.reduce((sum, n) => sum + n, 0) / values.length;
  }
  // MONTHLY writes section ids (appearance, culture, …). Item-level keys still win when present.
  const sectionLevel = ratings[section.id];
  if (typeof sectionLevel === 'number' && sectionLevel >= 1 && sectionLevel <= 5) {
    return sectionLevel;
  }
  return null;
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
  return primarySopDue(user, reviews, now).dueYmd;
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
    tardyDate: review.disciplinaryStatus === 'TARDY_NO_SHOW' ? trimOptional(review.tardyDate) : undefined,
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
  if (
    incoming.reviewType !== 'MONTHLY'
    && incoming.reviewType !== 'QUARTERLY'
    && incoming.reviewType !== 'ANNUAL'
    && incoming.reviewType !== 'PIP'
  ) {
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

  const key = sopReviewIdentity(incoming.subjectId, incoming.period, incoming.reviewType);
  const idx = existing.findIndex(r => sopReviewIdentityOf(r) === key);
  const current = idx === -1 ? undefined : existing[idx];
  const reviewerStamp = current
    ? {
        reviewerId: current.reviewerId,
        reviewerName: current.reviewerName,
        reviewedByName: current.reviewedByName || current.reviewerName,
      }
    : {
        reviewerId: actor.id,
        reviewerName: actor.name,
        reviewedByName: actor.name,
      };
  const normalized = normalizeSopReview({
    ...incoming,
    ...reviewerStamp,
  }, nowIso);

  if (idx === -1 || !current) {
    return [normalized, ...existing];
  }

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
