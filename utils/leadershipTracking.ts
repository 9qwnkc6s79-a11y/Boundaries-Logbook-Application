/**
 * Team Leader Performance & Accountability Utilities
 */

import { ToastTimeEntry, User, ShiftOwnership, ChecklistTemplate, ChecklistSubmission, TrackedGoogleReview } from '../types';

// Leadership hierarchy - lower number = higher priority
// Exact match dictionary (case-insensitive) for known Toast POS job titles
const LEADERSHIP_HIERARCHY: Record<string, number> = {
  'gm (on bar)': 1,
  'gm': 1,
  'general manager': 1,
  'store manager': 1,
  'manager': 1,
  'team leader': 2,
  'team lead': 2,
  'shift lead': 2,
  'shift leader': 2,
  'shift manager': 2,
};

// Canonical display names for exact-matched roles
const LEADERSHIP_DISPLAY_NAMES: Record<string, string> = {
  'gm (on bar)': 'GM (on bar)',
  'gm': 'GM',
  'general manager': 'General Manager',
  'store manager': 'Store Manager',
  'manager': 'Manager',
  'team leader': 'Team Leader',
  'team lead': 'Team Lead',
  'shift lead': 'Shift Lead',
  'shift leader': 'Shift Leader',
  'shift manager': 'Shift Manager',
};

// Regex fallback patterns for catching Toast job titles that don't exactly match
// e.g. "Team Leader - Bar", "Shift Lead (Morning)", "GM on Bar", "Assistant Manager"
const LEADERSHIP_PATTERNS: { pattern: RegExp; priority: number; displayName: string }[] = [
  { pattern: /\bgm\b/i, priority: 1, displayName: 'GM' },
  { pattern: /\bgeneral\s*manager\b/i, priority: 1, displayName: 'General Manager' },
  { pattern: /\bstore\s*manager\b/i, priority: 1, displayName: 'Store Manager' },
  { pattern: /\bmanager\b/i, priority: 1, displayName: 'Manager' },
  { pattern: /\b(team|shift)\s*(leader|lead)\b/i, priority: 2, displayName: 'Team Leader' },
  { pattern: /\bshift\s*manager\b/i, priority: 2, displayName: 'Shift Manager' },
  { pattern: /\bsupervisor\b/i, priority: 2, displayName: 'Supervisor' },
];

interface LeaderInfo {
  userId: string;
  name: string;
  jobTitle: string;
  priority: number;
  employeeGuid: string;
}

/**
 * Detect leaders from currently clocked-in employees
 * Returns all leaders found, sorted by priority (GM first, then Team Leaders)
 * Uses exact match first, then regex fallback for non-standard Toast job titles
 */
export function detectLeaders(clockedIn: ToastTimeEntry[], allUsers: User[]): LeaderInfo[] {
  const leaders: LeaderInfo[] = [];

  // Debug: log all job names being checked
  if (clockedIn.length > 0) {
    console.log('[LeaderDetect] Checking clocked-in staff:', clockedIn.map(e => `${e.employeeName} → "${e.jobName}"`).join(', '));
  }

  clockedIn.forEach(entry => {
    const jobTitleNormalized = entry.jobName.toLowerCase().trim();

    // 1) Try exact match first
    let priority = LEADERSHIP_HIERARCHY[jobTitleNormalized];
    let displayName = LEADERSHIP_DISPLAY_NAMES[jobTitleNormalized] || entry.jobName;

    // 2) Fallback: regex pattern matching for non-standard titles
    if (priority === undefined) {
      for (const rule of LEADERSHIP_PATTERNS) {
        if (rule.pattern.test(entry.jobName)) {
          priority = rule.priority;
          displayName = rule.displayName;
          console.log(`[LeaderDetect] Regex match: "${entry.jobName}" → ${rule.displayName} (priority ${rule.priority})`);
          break;
        }
      }
    }

    if (priority !== undefined) {
      const user = allUsers.find(u =>
        u.name.toLowerCase() === entry.employeeName.toLowerCase()
      );

      leaders.push({
        userId: user?.id || `unknown-${entry.employeeGuid}`,
        name: entry.employeeName,
        jobTitle: displayName,
        priority: priority,
        employeeGuid: entry.employeeGuid
      });
    }
  });

  if (leaders.length === 0 && clockedIn.length > 0) {
    console.warn('[LeaderDetect] No leaders found! Job titles present:', clockedIn.map(e => `"${e.jobName}"`).join(', '));
  }

  // Sort by priority (GM first, then Team Leaders)
  return leaders.sort((a, b) => a.priority - b.priority);
}

/**
 * Calculate timeliness score based on submission delay
 * On-time: 40 pts, Late <1hr: -10 pts, Late >1hr: -20 pts, Not submitted: 0 pts
 */
export function calculateTimelinessScore(delayMinutes: number, wasSubmitted: boolean): number {
  if (!wasSubmitted) return 0;
  if (delayMinutes <= 0) return 40; // On time or early
  if (delayMinutes <= 60) return -10; // Late within 1 hour
  return -20; // Over 1 hour late
}

/**
 * Calculate turn time score
 * Under 3.5min: 40pts, 3.5-4.5min: 35pts, 4.5-5min: -10pts, 5+min: -20pts
 */
export function calculateTurnTimeScore(turnTimeMinutes: number | undefined): number {
  if (turnTimeMinutes === undefined) return 0;
  if (turnTimeMinutes < 3.5) return 40;
  if (turnTimeMinutes < 4.5) return 35;
  if (turnTimeMinutes < 5) return -10;
  return -20;
}

/**
 * Calculate sales score based on target
 * Above target: 20pts, Within 10%: 15pts, Below: 10pts
 */
export function calculateSalesScore(actualSales: number | undefined, target: number): number {
  if (actualSales === undefined) return 0;
  if (actualSales >= target) return 20;
  if (actualSales >= target * 0.9) return 15;
  return 10;
}

/**
 * Calculate average ticket score — no negatives, generous rewards for high tickets
 * $10+: 25pts (Exceptional), $8-10: 20pts, $6-8: 15pts, $4-6: 5pts, <$4: 0pts
 */
export function calculateAvgTicketScore(avgTicket: number | undefined): number {
  if (avgTicket === undefined) return 0;
  if (avgTicket >= 10) return 25;
  if (avgTicket >= 8) return 20;
  if (avgTicket >= 6) return 15;
  if (avgTicket >= 4) return 5;
  return 0;
}

/**
 * Determine who owns a shift based on clocked-in staff
 */
export function determineShiftOwnership(
  clockedIn: ToastTimeEntry[],
  allUsers: User[],
  shiftType: 'OPENING' | 'SHIFT_CHANGE' | 'CLOSING',
  template: ChecklistTemplate
): {
  leaders: LeaderInfo[];
  multipleLeadersOnDuty: boolean;
  noLeaderOnDuty: boolean;
  teamMembers: { userId: string; name: string; jobTitle: string }[];
} {
  const leaders = detectLeaders(clockedIn, allUsers);

  // Check for multiple leaders at the SAME priority level
  const priorityGroups = new Map<number, LeaderInfo[]>();
  leaders.forEach(leader => {
    const group = priorityGroups.get(leader.priority) || [];
    group.push(leader);
    priorityGroups.set(leader.priority, group);
  });

  // Multiple leaders = 2+ at the HIGHEST priority level present
  const highestPriority = Math.min(...leaders.map(l => l.priority));
  const highestPriorityLeaders = priorityGroups.get(highestPriority) || [];
  const multipleLeadersOnDuty = highestPriorityLeaders.length > 1;

  // Get non-leader team members
  const leaderGuids = new Set(leaders.map(l => l.employeeGuid));
  const teamMembers = clockedIn
    .filter(entry => !leaderGuids.has(entry.employeeGuid))
    .map(entry => {
      const user = allUsers.find(u =>
        u.name.toLowerCase() === entry.employeeName.toLowerCase()
      );
      return {
        userId: user?.id || `unknown-${entry.employeeGuid}`,
        name: entry.employeeName,
        jobTitle: entry.jobName
      };
    });

  return {
    leaders,
    multipleLeadersOnDuty,
    noLeaderOnDuty: leaders.length === 0,
    teamMembers
  };
}

/**
 * Calculate shift deadline based on template and date
 */
export function calculateShiftDeadline(date: string, template: ChecklistTemplate): Date {
  const dateObj = new Date(date);
  dateObj.setHours(template.deadlineHour, 0, 0, 0);
  return dateObj;
}

/**
 * Calculate delay in minutes
 */
export function calculateSubmissionDelay(submittedAt: string, deadline: Date): number {
  const submittedDate = new Date(submittedAt);
  const delayMs = submittedDate.getTime() - deadline.getTime();
  return Math.floor(delayMs / 60000); // Convert to minutes
}

/**
 * Per-shift score breakdown
 */
export interface LeaderShiftScore {
  date: string;
  templateName: string;
  timelinessScore: number;
  turnTimeScore: number;
  avgTicketScore: number;
  hasToastData: boolean;
  maxPossible: number;
  totalScore: number;
}

/**
 * Aggregated leaderboard entry for a leader
 */
export interface LeaderLeaderboardEntry {
  userId: string;
  name: string;
  totalShifts: number;
  shiftsWithToastData: number;
  avgTimelinessScore: number;
  avgTurnTimeScore: number;
  avgTicketScoreValue: number;
  compositePercent: number;
  onTimeRate: number;
  shifts: LeaderShiftScore[];
  reviewBonusPoints: number;
  fiveStarReviewCount: number;
  effectiveScore: number;
}

/**
 * Calculate the leader leaderboard using per-shift averaged scoring.
 * Each shift earns: Timeliness (0-40) + Turn Time (0-40) + Avg Ticket (0-20) = 100 max.
 * Shifts without Toast data are scored on timeliness only (out of 40).
 * Final composite = (sum of all shift scores) / (sum of all max possible) * 100.
 * This ensures leaders with more shifts don't automatically outscore others.
 */
export function calculateLeaderboard(
  submissions: ChecklistSubmission[],
  templates: ChecklistTemplate[],
  allUsers: User[],
  lookbackDays: number = 7,
  trackedReviews: TrackedGoogleReview[] = []
): LeaderLeaderboardEntry[] {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - lookbackDays);

  const recentSubmissions = submissions.filter(sub =>
    sub.submittedAt && new Date(sub.submittedAt) >= cutoff
  );

  // Group shifts by leader (submitter)
  const leaderShifts = new Map<string, { name: string; shifts: LeaderShiftScore[] }>();

  recentSubmissions.forEach(sub => {
    const template = templates.find(t => t.id === sub.templateId);
    if (!template || !sub.submittedAt) return;

    const user = allUsers.find(u => u.id === sub.userId);
    if (!user) return;

    // Calculate timeliness
    const deadline = new Date(sub.date);
    deadline.setHours(template.deadlineHour, 0, 0, 0);
    const submittedDate = new Date(sub.submittedAt);
    const delayMinutes = Math.floor((submittedDate.getTime() - deadline.getTime()) / 60000);
    const timelinessScore = calculateTimelinessScore(delayMinutes, true);

    // Calculate Toast-based scores (if snapshot available)
    const hasToastData = !!(sub.toastSnapshot?.averageTurnTime || sub.toastSnapshot?.averageCheck);
    const turnTimeScore = hasToastData ? calculateTurnTimeScore(sub.toastSnapshot?.averageTurnTime) : 0;
    const avgTicketScore = hasToastData ? calculateAvgTicketScore(sub.toastSnapshot?.averageCheck) : 0;

    const maxPossible = hasToastData ? 105 : 40;
    const totalScore = timelinessScore + turnTimeScore + avgTicketScore;

    const shiftScore: LeaderShiftScore = {
      date: sub.date,
      templateName: template.name,
      timelinessScore,
      turnTimeScore,
      avgTicketScore,
      hasToastData,
      maxPossible,
      totalScore,
    };

    const existing = leaderShifts.get(sub.userId);
    if (existing) {
      existing.shifts.push(shiftScore);
    } else {
      leaderShifts.set(sub.userId, { name: user.name, shifts: [shiftScore] });
    }
  });

  // Build leaderboard entries
  const entries: LeaderLeaderboardEntry[] = [];

  leaderShifts.forEach((data, userId) => {
    const { name, shifts } = data;
    const totalShifts = shifts.length;
    const shiftsWithToastData = shifts.filter(s => s.hasToastData).length;

    // Average scores
    const avgTimeliness = shifts.reduce((sum, s) => sum + s.timelinessScore, 0) / totalShifts;
    const toastShifts = shifts.filter(s => s.hasToastData);
    const avgTurnTime = toastShifts.length > 0
      ? toastShifts.reduce((sum, s) => sum + s.turnTimeScore, 0) / toastShifts.length
      : 0;
    const avgTicket = toastShifts.length > 0
      ? toastShifts.reduce((sum, s) => sum + s.avgTicketScore, 0) / toastShifts.length
      : 0;

    // Composite: normalized percentage across all shifts
    const totalScoreSum = shifts.reduce((sum, s) => sum + s.totalScore, 0);
    const totalMaxSum = shifts.reduce((sum, s) => sum + s.maxPossible, 0);
    const compositePercent = totalMaxSum > 0 ? (totalScoreSum / totalMaxSum) * 100 : 0;

    // On-time rate
    const onTimeShifts = shifts.filter(s => s.timelinessScore === 40).length;
    const onTimeRate = (onTimeShifts / totalShifts) * 100;

    entries.push({
      userId,
      name,
      totalShifts,
      shiftsWithToastData,
      avgTimelinessScore: avgTimeliness,
      avgTurnTimeScore: avgTurnTime,
      avgTicketScoreValue: avgTicket,
      compositePercent,
      onTimeRate,
      shifts,
      reviewBonusPoints: 0,
      fiveStarReviewCount: 0,
      effectiveScore: compositePercent,
    });
  });

  // Calculate review bonuses (additive, not averaged per-shift)
  const cutoffISO = cutoff.toISOString();
  const recentReviews = trackedReviews.filter(r =>
    r.detectedAt >= cutoffISO && r.bonusAwarded && r.attributedToUserId
  );

  recentReviews.forEach(review => {
    const entry = entries.find(e => e.userId === review.attributedToUserId);
    if (entry) {
      entry.reviewBonusPoints += review.bonusPoints;
      if (review.rating === 5) entry.fiveStarReviewCount += 1;
      entry.effectiveScore = entry.compositePercent + entry.reviewBonusPoints;
    }
  });

  // Sort by effective score (composite + review bonus) descending
  return entries.sort((a, b) => b.effectiveScore - a.effectiveScore);
}
