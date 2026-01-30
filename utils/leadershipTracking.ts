/**
 * Team Leader Performance & Accountability Utilities
 */

import { ToastTimeEntry, User, ShiftOwnership, ChecklistTemplate } from '../types';

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
 * On-time: 40 pts, Late <1hr: 25 pts, Late >1hr: 10 pts, Not submitted: 0 pts
 */
export function calculateTimelinessScore(delayMinutes: number, wasSubmitted: boolean): number {
  if (!wasSubmitted) return 0;
  if (delayMinutes <= 0) return 40; // On time or early
  if (delayMinutes <= 60) return 25; // Within 1 hour
  return 10; // Over 1 hour late
}

/**
 * Calculate turn time score
 * Under 3.5min: 40pts (Excellent), 3.5-5min: 35pts (Good), 5-6min: 25pts (Fair), 6+min: 15pts (Needs Improvement)
 */
export function calculateTurnTimeScore(turnTimeMinutes: number | undefined): number {
  if (turnTimeMinutes === undefined) return 0;
  if (turnTimeMinutes < 3.5) return 40;
  if (turnTimeMinutes < 5) return 35;
  if (turnTimeMinutes < 6) return 25;
  return 15;
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
 * Calculate average ticket score
 * $8+: 20pts (Excellent), $6-8: 15pts (Good), $4-6: 10pts (Fair), <$4: 5pts (Needs Improvement)
 */
export function calculateAvgTicketScore(avgTicket: number | undefined): number {
  if (avgTicket === undefined) return 0;
  if (avgTicket >= 8) return 20;
  if (avgTicket >= 6) return 15;
  if (avgTicket >= 4) return 10;
  return 5;
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
