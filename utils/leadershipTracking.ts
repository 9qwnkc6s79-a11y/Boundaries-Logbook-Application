/**
 * Team Leader Performance & Accountability Utilities
 */

import { ToastTimeEntry, User, ShiftOwnership, ChecklistTemplate, ChecklistSubmission, TrackedGoogleReview, UserRole, AttributedOrder } from '../types';

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
      // FIX: Try GUID matching first (most reliable)
      let user = allUsers.find(u => u.toastEmployeeGuid === entry.employeeGuid);

      // Fallback: Fuzzy name matching
      if (!user) {
        user = allUsers.find(u => {
          const userName = u.name.toLowerCase().trim();
          const toastName = entry.employeeName.toLowerCase().trim();

          // Exact match
          if (userName === toastName) return true;

          // First name match (e.g., "John Smith" matches "John")
          const userFirst = userName.split(' ')[0];
          const toastFirst = toastName.split(' ')[0];
          if (userFirst === toastFirst && userFirst.length > 2) return true;

          // Short form match (e.g., "Kendall M" matches "Kendall Matthews")
          const toastParts = toastName.split(' ');
          const userParts = userName.split(' ');
          if (toastParts.length >= 2 && userParts.length >= 2) {
            if (toastParts[0] === userParts[0] && userParts[1].startsWith(toastParts[1])) return true;
            if (userParts[0] === toastParts[0] && toastParts[1].startsWith(userParts[1])) return true;
          }

          return false;
        });

        if (!user) {
          console.warn(`[LeaderDetect] No user found for Toast employee: "${entry.employeeName}" (${entry.employeeGuid})`);
        } else {
          console.log(`[LeaderDetect] Fuzzy match: "${entry.employeeName}" → ${user.name}`);
        }
      } else {
        console.log(`[LeaderDetect] GUID match: "${entry.employeeName}" → ${user.name} (${entry.employeeGuid})`);
      }

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
  turnTimeMinutes: number | undefined;    // Actual turn time value
  avgTicketDollars: number | undefined;   // Actual avg ticket value
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
  avgTurnTimeMinutes: number | undefined; // Actual turn time in minutes
  avgTicketDollars: number | undefined;   // Actual avg ticket in dollars
  compositePercent: number;
  onTimeRate: number;
  shifts: LeaderShiftScore[];
  reviewBonusPoints: number;
  fiveStarReviewCount: number;
  effectiveScore: number;
}

/**
 * Calculate the Team Leader Leaderboard.
 *
 * Shows ALL users with MANAGER or ADMIN roles, ranked by their performance
 * over the last 30 days based on:
 * - Timeliness: How on-time their shift checklists were submitted
 * - Turn Time: Average ticket turn time from attributed orders
 * - Avg Ticket: Average check amount from attributed orders
 * - Reviews: Bonus points from attributed 5-star Google reviews
 *
 * When attributedOrders are provided, turn time and avg ticket are calculated
 * from orders attributed to each leader (orders opened while they were on duty).
 * When not provided, falls back to Toast snapshot data from submissions.
 */
export function calculateLeaderboard(
  submissions: ChecklistSubmission[],
  templates: ChecklistTemplate[],
  allUsers: User[],
  lookbackDays: number = 30,
  trackedReviews: TrackedGoogleReview[] = [],
  attributedOrders: AttributedOrder[] = []
): LeaderLeaderboardEntry[] {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - lookbackDays);

  // Get all team leaders/managers (users with MANAGER or ADMIN role)
  const teamLeaders = allUsers.filter(u =>
    u.role === UserRole.MANAGER || u.role === UserRole.ADMIN
  );

  console.log(`[Leaderboard] Found ${teamLeaders.length} team leaders/managers:`, teamLeaders.map(u => u.name).join(', '));

  // Filter to recent submissions
  const recentSubmissions = submissions.filter(sub =>
    sub.submittedAt && new Date(sub.submittedAt) >= cutoff
  );

  console.log(`[Leaderboard] Found ${recentSubmissions.length} submissions in last ${lookbackDays} days`);

  // Filter attributed orders to lookback period
  const recentOrders = attributedOrders.filter(o =>
    new Date(o.openedAt) >= cutoff
  );

  console.log(`[Leaderboard] Using ${recentOrders.length} attributed orders for metrics`);

  // Build leaderboard entries for ALL team leaders
  const entries: LeaderLeaderboardEntry[] = teamLeaders.map(leader => {
    // Find submissions where this leader completed tasks
    const leaderSubmissions = recentSubmissions.filter(sub => {
      const taskResults = sub.taskResults || [];
      return taskResults.some(tr => tr.completed && tr.completedByUserId === leader.id);
    });

    // Get orders attributed to this leader
    const leaderOrders = recentOrders.filter(o => o.shiftLeaderId === leader.id);
    const hasOrderData = leaderOrders.length > 0;

    // Calculate turn time and avg ticket from attributed orders
    let orderTurnTime: number | undefined;
    let orderAvgTicket: number | undefined;

    if (hasOrderData) {
      const totalTurnTime = leaderOrders.reduce((sum, o) => sum + o.turnTimeMinutes, 0);
      const totalNetAmount = leaderOrders.reduce((sum, o) => sum + o.netAmount, 0);
      orderTurnTime = totalTurnTime / leaderOrders.length;
      orderAvgTicket = totalNetAmount / leaderOrders.length;
      console.log(`[Leaderboard] ${leader.name}: ${leaderOrders.length} orders, avgTurnTime=${orderTurnTime.toFixed(2)}min, avgTicket=$${orderAvgTicket.toFixed(2)}`);
    }

    // Calculate shift scores
    const shifts: LeaderShiftScore[] = [];

    leaderSubmissions.forEach(sub => {
      const template = templates.find(t => t.id === sub.templateId);
      if (!template || !sub.submittedAt) return;

      // Calculate timeliness based on when submission was made
      const deadline = new Date(sub.date);
      deadline.setHours(template.deadlineHour, 0, 0, 0);
      const submittedDate = new Date(sub.submittedAt);
      const delayMinutes = Math.floor((submittedDate.getTime() - deadline.getTime()) / 60000);
      const timelinessScore = calculateTimelinessScore(delayMinutes, true);

      // Use attributed order data if available, otherwise fall back to snapshot
      const hasToastData = hasOrderData || !!(sub.toastSnapshot?.averageTurnTime || sub.toastSnapshot?.averageCheck);
      const turnTimeMinutes = hasOrderData ? orderTurnTime : sub.toastSnapshot?.averageTurnTime;
      const avgTicketDollars = hasOrderData ? orderAvgTicket : sub.toastSnapshot?.averageCheck;
      const turnTimeScore = hasToastData ? calculateTurnTimeScore(turnTimeMinutes) : 0;
      const avgTicketScore = hasToastData ? calculateAvgTicketScore(avgTicketDollars) : 0;

      const maxPossible = hasToastData ? 105 : 40;
      const totalScore = timelinessScore + turnTimeScore + avgTicketScore;

      shifts.push({
        date: sub.date,
        templateName: template.name,
        timelinessScore,
        turnTimeScore,
        avgTicketScore,
        turnTimeMinutes,
        avgTicketDollars,
        hasToastData,
        maxPossible,
        totalScore,
      });
    });

    // Calculate aggregated metrics
    const totalShifts = shifts.length;
    const shiftsWithToastData = hasOrderData ? totalShifts : shifts.filter(s => s.hasToastData).length;

    // Average timeliness (default to 0 if no shifts)
    const avgTimeliness = totalShifts > 0
      ? shifts.reduce((sum, s) => sum + s.timelinessScore, 0) / totalShifts
      : 0;

    // Use attributed order data for turn time and avg ticket
    let avgTurnTimeScore = 0;
    let avgTicketScore = 0;
    let avgTurnTimeMinutes: number | undefined;
    let avgTicketDollars: number | undefined;

    if (hasOrderData) {
      // Calculate from attributed orders directly
      avgTurnTimeMinutes = orderTurnTime;
      avgTicketDollars = orderAvgTicket;
      avgTurnTimeScore = calculateTurnTimeScore(orderTurnTime);
      avgTicketScore = calculateAvgTicketScore(orderAvgTicket);
    } else {
      // Fall back to snapshot data from shifts
      const toastShifts = shifts.filter(s => s.hasToastData);
      avgTurnTimeScore = toastShifts.length > 0
        ? toastShifts.reduce((sum, s) => sum + s.turnTimeScore, 0) / toastShifts.length
        : 0;
      avgTicketScore = toastShifts.length > 0
        ? toastShifts.reduce((sum, s) => sum + s.avgTicketScore, 0) / toastShifts.length
        : 0;

      const shiftsWithTurnTime = toastShifts.filter(s => s.turnTimeMinutes !== undefined);
      avgTurnTimeMinutes = shiftsWithTurnTime.length > 0
        ? shiftsWithTurnTime.reduce((sum, s) => sum + s.turnTimeMinutes!, 0) / shiftsWithTurnTime.length
        : undefined;

      const shiftsWithAvgTicket = toastShifts.filter(s => s.avgTicketDollars !== undefined);
      avgTicketDollars = shiftsWithAvgTicket.length > 0
        ? shiftsWithAvgTicket.reduce((sum, s) => sum + s.avgTicketDollars!, 0) / shiftsWithAvgTicket.length
        : undefined;
    }

    // Composite score as percentage
    // New scoring: Timeliness (40) + Turn Time (40) + Avg Ticket (25) = 105 max
    const hasData = totalShifts > 0 || hasOrderData;
    const maxPossible = hasOrderData ? 105 : (totalShifts > 0 ? 40 : 0);
    const totalScore = avgTimeliness + avgTurnTimeScore + avgTicketScore;
    const compositePercent = maxPossible > 0 ? (totalScore / maxPossible) * 100 : 0;

    // On-time rate
    const onTimeShifts = shifts.filter(s => s.timelinessScore === 40).length;
    const onTimeRate = totalShifts > 0 ? (onTimeShifts / totalShifts) * 100 : 0;

    return {
      userId: leader.id,
      name: leader.name,
      totalShifts,
      shiftsWithToastData,
      avgTimelinessScore: avgTimeliness,
      avgTurnTimeScore,
      avgTicketScoreValue: avgTicketScore,
      avgTurnTimeMinutes,
      avgTicketDollars,
      compositePercent,
      onTimeRate,
      shifts,
      reviewBonusPoints: 0,
      fiveStarReviewCount: 0,
      effectiveScore: compositePercent,
    };
  });

  // Add review bonuses
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

  // Sort by effective score descending, then by name for ties
  // Leaders with no shifts go to the bottom but are still shown
  return entries.sort((a, b) => {
    // First sort by whether they have any shifts (leaders with shifts first)
    if (a.totalShifts > 0 && b.totalShifts === 0) return -1;
    if (a.totalShifts === 0 && b.totalShifts > 0) return 1;
    // Then by effective score
    if (b.effectiveScore !== a.effectiveScore) return b.effectiveScore - a.effectiveScore;
    // Then alphabetically by name
    return a.name.localeCompare(b.name);
  });
}
