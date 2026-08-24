/**
 * Smoke: SOP Team Member Performance Review (People tab).
 * Run: npx --yes tsx scripts/verify-team-performance-reviews.ts
 */
import { TeamPerformanceReview, User, UserRole } from '../types.ts';
import {
  SOP_DISCIPLINARY_LABELS,
  SOP_FOOTER,
  SOP_RATING_SCALE,
  SOP_SECTIONS,
  SOP_WEIGHTS,
  assessmentRows,
  canEditSopReview,
  canSetPip,
  canWriteSopReview,
  chicagoQuarter,
  chicagoYmd,
  existingHireOrStartDate,
  isSopOverdue,
  latestSubmittedSop,
  makeSopReviewId,
  nextSopDueDate,
  periodForReviewType,
  roundedOverallDefault,
  sectionScore,
  upsertTeamPerformanceReview,
  visibleSopSections,
  weightedScore,
} from '../utils/teamPerformanceReviews.ts';

function assert(cond: unknown, message: string): asserts cond {
  if (!cond) throw new Error(message);
}

function user(partial: Partial<User> & Pick<User, 'id' | 'name' | 'role' | 'storeId'>): User {
  return {
    email: `${partial.id}@boundariescoffee.com`,
    ...partial,
  };
}

const heath = user({ id: 'u-heath', name: 'Heath', role: UserRole.MANAGER, storeId: 'store-elm' });
const rafael = user({ id: 'u-rafael', name: 'Rafael', role: UserRole.MANAGER, storeId: 'store-prosper' });
const daniel = user({ id: 'u-admin-1', name: 'Daniel', role: UserRole.ADMIN, storeId: 'store-elm' });
const barista = user({ id: 'u-bar-1', name: 'Barista One', role: UserRole.TRAINEE, storeId: 'store-prosper' });
const leader = user({ id: 'u-tl-1', name: 'Leader One', role: UserRole.TRAINER, storeId: 'store-prosper' });
const staff = user({ id: 'u-bar-2', name: 'Staff Two', role: UserRole.TRAINEE, storeId: 'store-elm' });

// --- Verbatim SOP copy ----------------------------------------------------
assert(SOP_RATING_SCALE[0].label === 'Needs Immediate Improvement', 'scale 1');
assert(SOP_RATING_SCALE[1].label === 'Developing', 'scale 2');
assert(SOP_RATING_SCALE[2].label === 'Meets Expectations', 'scale 3');
assert(SOP_RATING_SCALE[3].label === 'Exceeds Expectations', 'scale 4');
assert(SOP_RATING_SCALE[4].label === 'Exceptional', 'scale 5');

assert(SOP_SECTIONS.map(s => s.title).join('|') === [
  'Appearance & Professionalism',
  'Cultural Values',
  'Reliability & Timeliness',
  'Job Performance',
  'Team Leader ONLY',
].join('|'), 'section titles');
assert(SOP_SECTIONS[0].weightLabel === 'weight 20% Team Member / 15% Team Leader', 'appearance weights');
assert(SOP_SECTIONS[4].weightLabel === 'N/A TM / 30% TL', 'leadership weights');

const itemTitles = SOP_SECTIONS.flatMap(s => s.items.map(i => i.title));
assert(itemTitles.length === 22, '22 SOP items, no extras');
assert(itemTitles[0] === 'Attire & Personal Presentation', 'first item');
assert(itemTitles[itemTitles.length - 1] === 'Escalation Judgment', 'last item');
assert(SOP_SECTIONS[1].items[0].low === 'Disengaged, doesn’t care about the craft', 'passion low anchor');
assert(SOP_SECTIONS[4].items[0].high === 'Drives team to hit 3.5 min target every shift', 'floor leadership high');
assert(SOP_DISCIPLINARY_LABELS.NO_CONCERNS === 'No concerns at this time', 'disc 1');
assert(SOP_DISCIPLINARY_LABELS.ACTIVE_STRIKE === 'Active strike on record. Strike # + Date', 'disc 2');
assert(SOP_DISCIPLINARY_LABELS.PIP_REQUIRED === 'PIP required — to be prepared by Daniel. Date.', 'disc 3');
assert(SOP_FOOTER === 'BOUNDARIES COFFEE — CONFIDENTIAL INTERNAL USE ONLY', 'footer');

// --- Weights + scoring ----------------------------------------------------
assert(SOP_WEIGHTS.TEAM_MEMBER.appearance === 0.20, 'TM appearance 20%');
assert(SOP_WEIGHTS.TEAM_MEMBER.culture === 0.25, 'TM culture 25%');
assert(SOP_WEIGHTS.TEAM_MEMBER.reliability === 0.20, 'TM reliability 20%');
assert(SOP_WEIGHTS.TEAM_MEMBER.job === 0.25, 'TM job 25%');
assert(SOP_WEIGHTS.TEAM_MEMBER.leadership === 0, 'TM leadership N/A');
assert(SOP_WEIGHTS.TEAM_LEADER.appearance === 0.15, 'TL appearance 15%');
assert(SOP_WEIGHTS.TEAM_LEADER.culture === 0.20, 'TL culture 20%');
assert(SOP_WEIGHTS.TEAM_LEADER.reliability === 0.15, 'TL reliability 15%');
assert(SOP_WEIGHTS.TEAM_LEADER.job === 0.20, 'TL job 20%');
assert(SOP_WEIGHTS.TEAM_LEADER.leadership === 0.30, 'TL leadership 30%');

const appearance = SOP_SECTIONS[0];
assert(sectionScore(appearance, { attire: 4, conductTeam: 2 }) === 3, 'section avg ignores blank');
assert(sectionScore(appearance, {}) === null, 'empty section is blank');
assert(visibleSopSections('TEAM_MEMBER').every(s => !s.teamLeaderOnly), 'hide TL section for TM');
assert(visibleSopSections('TEAM_LEADER').some(s => s.id === 'leadership'), 'show TL section for TL');

const fullRatings: Record<string, number> = {
  attire: 4, conductGuests: 4, conductTeam: 4,
  passion: 5, hospitality: 5, selflessness: 5, humility: 5, focus: 5, fun: 5,
  punctuality: 3, preShift: 3, dependability: 3,
  drinkQuality: 4, speed: 4, cleanliness: 4, logbook: 4, flexibility: 4,
  floorLeadership: 5, qualityControl: 5, guestRecovery: 5, openClose: 5, escalation: 5,
};
const tmScore = weightedScore('TEAM_MEMBER', fullRatings);
const tlScore = weightedScore('TEAM_LEADER', fullRatings);
assert(tmScore !== null && Math.abs(tmScore - 3.65) < 0.001, `TM weighted ${tmScore}`);
assert(tlScore !== null && Math.abs(tlScore - 4.35) < 0.001, `TL weighted ${tlScore}`);
assert(roundedOverallDefault(3.65) === 4, 'default overall rounds weighted');

const rows = assessmentRows('TEAM_MEMBER', fullRatings);
assert(rows.find(r => r.sectionId === 'leadership')?.score === null, 'TM leadership score N/A');
assert(rows.find(r => r.sectionId === 'appearance')?.tmWeight === 20, 'table TM weight');
assert(rows.find(r => r.sectionId === 'appearance')?.tlWeight === 15, 'table TL weight');

// --- Chicago quarter / due dates ----------------------------------------
assert(chicagoYmd(new Date('2026-09-01T04:00:00Z')) === '2026-08-31', '04:00 UTC Sep 1 is still Aug 31 Chicago');
assert(chicagoQuarter(new Date('2026-08-24T18:00:00Z')).id === '2026-Q3', 'Aug is Q3');
assert(chicagoQuarter(new Date('2026-08-24T18:00:00Z')).end === '2026-09-30', 'Q3 ends Sep 30');
assert(chicagoQuarter(new Date('2026-10-01T04:00:00Z')).id === '2026-Q3', '04:00 UTC Oct 1 still Q3 Chicago');
assert(chicagoQuarter(new Date('2026-10-01T06:00:00Z')).id === '2026-Q4', '06:00 UTC Oct 1 is Q4 Chicago');
assert(periodForReviewType('QUARTERLY', '2026-08-24') === '2026-Q3', 'quarter period');
assert(periodForReviewType('ANNUAL', '2026-08-24') === '2026', 'annual period');
assert(periodForReviewType('PIP', '2026-08-24') === 'PIP-2026-08-24', 'pip period');

const now = new Date('2026-08-24T18:00:00Z');
assert(nextSopDueDate(barista, [], now) === '2026-09-30', 'no hire + no review → end of current quarter');
assert(!existingHireOrStartDate(barista), 'do not invent hireDate');

const withHire = { ...barista, hireDate: '2026-08-01' } as User;
assert(existingHireOrStartDate(withHire) === '2026-08-01', 'use hireDate only if already present');
assert(nextSopDueDate(withHire, [], now) === '2026-08-31', '30-day due when hire date exists');

const withStart = { ...barista, startDate: '2026-06-01' } as User;
assert(nextSopDueDate(withStart, [], now) === '2026-08-30', '90-day due when startDate exists and 30/60 passed');

const submitted: TeamPerformanceReview = {
  id: makeSopReviewId(barista.id, '2026-Q2', 'QUARTERLY'),
  subjectId: barista.id,
  subjectName: barista.name,
  subjectRole: 'TEAM_MEMBER',
  storeId: 'store-prosper',
  reviewerId: rafael.id,
  reviewerName: rafael.name,
  reviewedByName: rafael.name,
  reviewDate: '2026-06-15',
  period: '2026-Q2',
  reviewType: 'QUARTERLY',
  strikesOnFile: 0,
  ratings: { attire: 4 },
  sectionComments: {},
  overallRating: 4,
  developmentPlan: [],
  goals: [],
  disciplinaryStatus: 'NO_CONCERNS',
  status: 'SUBMITTED',
  createdAt: '2026-06-15T12:00:00Z',
  updatedAt: '2026-06-15T12:00:00Z',
  submittedAt: '2026-06-15T12:00:00Z',
};
assert(nextSopDueDate(barista, [submitted], now) === '2026-09-13', '90 days after last SUBMITTED SOP');
assert(isSopOverdue('2026-08-23', now), 'yesterday is overdue');
assert(!isSopOverdue('2026-08-24', now), 'due today is not overdue');
assert(latestSubmittedSop([submitted], barista.id)?.period === '2026-Q2', 'latest submitted lookup');

// --- Who can write / PIP / lock ------------------------------------------
assert(canWriteSopReview(heath) && canWriteSopReview(rafael) && canWriteSopReview(daniel), 'GM + ADMIN write SOP');
assert(!canWriteSopReview(barista) && !canWriteSopReview(leader), 'staff do not write SOP');
assert(canSetPip(daniel) && !canSetPip(rafael) && !canSetPip(heath), 'PIP is ADMIN only');

const draft: TeamPerformanceReview = {
  ...submitted,
  id: makeSopReviewId(barista.id, '2026-Q3', 'QUARTERLY'),
  period: '2026-Q3',
  reviewDate: '2026-08-24',
  status: 'DRAFT',
  submittedAt: undefined,
  overallRating: 0,
  createdAt: '2026-08-24T12:00:00Z',
  updatedAt: '2026-08-24T12:00:00Z',
};

const afterDraft = upsertTeamPerformanceReview([], draft, rafael, '2026-08-24T13:00:00Z');
assert(afterDraft?.length === 1 && afterDraft[0].status === 'DRAFT', 'insert draft');

const edited = upsertTeamPerformanceReview(afterDraft!, { ...draft, ratings: { attire: 5 }, keyThemes: 'Speed' }, rafael, '2026-08-24T14:00:00Z');
assert(edited?.[0].ratings.attire === 5 && edited[0].keyThemes === 'Speed', 'author can edit draft');

const staffWrite = upsertTeamPerformanceReview([], draft, barista, '2026-08-24T14:00:00Z');
assert(staffWrite === null, 'staff cannot persist SOP');

const otherGm = upsertTeamPerformanceReview(edited!, { ...draft, ratings: { attire: 1 } }, heath, '2026-08-24T15:00:00Z');
assert(otherGm === null, 'other GM cannot edit someone else\'s draft');

const adminDraft = upsertTeamPerformanceReview(edited!, { ...draft, ratings: { attire: 3 }, overallRating: 3 }, daniel, '2026-08-24T16:00:00Z');
assert(adminDraft?.[0].ratings.attire === 3, 'ADMIN can edit any draft');

const gmPip = upsertTeamPerformanceReview(adminDraft!, { ...draft, disciplinaryStatus: 'PIP_REQUIRED', pipDate: '2026-08-24', overallRating: 2, status: 'SUBMITTED' }, rafael, '2026-08-24T17:00:00Z');
assert(gmPip === null, 'MANAGER cannot set PIP required');

const gmStrike = upsertTeamPerformanceReview(adminDraft!, {
  ...draft,
  disciplinaryStatus: 'ACTIVE_STRIKE',
  strikeNumber: 1,
  strikeDate: '2026-08-20',
  overallRating: 2,
  status: 'SUBMITTED',
}, rafael, '2026-08-24T17:00:00Z');
assert(gmStrike?.[0].status === 'SUBMITTED' && gmStrike[0].disciplinaryStatus === 'ACTIVE_STRIKE', 'GM can set active strike');

const locked = upsertTeamPerformanceReview(gmStrike!, { ...draft, overallRating: 5, status: 'DRAFT' }, rafael, '2026-08-24T18:00:00Z');
assert(locked === null, 'submitted locked for GM');
assert(!canEditSopReview(gmStrike![0], rafael), 'GM cannot edit submitted');
assert(canEditSopReview(gmStrike![0], daniel), 'ADMIN can edit submitted');

const adminUnlock = upsertTeamPerformanceReview(gmStrike!, {
  ...draft,
  overallRating: 2,
  status: 'SUBMITTED',
  disciplinaryStatus: 'PIP_REQUIRED',
  pipDate: '2026-08-24',
}, daniel, '2026-08-24T19:00:00Z');
assert(adminUnlock?.[0].disciplinaryStatus === 'PIP_REQUIRED', 'ADMIN can set PIP on submitted');

const duplicate = upsertTeamPerformanceReview(adminUnlock!, {
  ...draft,
  id: 'tpr-other',
  reviewerId: heath.id,
  overallRating: 1,
  status: 'SUBMITTED',
  disciplinaryStatus: 'NO_CONCERNS',
}, heath, '2026-08-24T20:00:00Z');
assert(duplicate === null, 'second SUBMITTED for same subject/period/type refused');

assert(staff.id && leader.id, 'roster fixtures exist');

console.log('verify-team-performance-reviews: ok');
