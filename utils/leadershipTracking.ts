/**
 * Team Leader Performance & Accountability Utilities
 */

import { ToastTimeEntry, User, ShiftOwnership, ChecklistTemplate } from '../types';

// Leadership hierarchy - lower number = higher priority
// Includes common Toast POS job title variants (case-insensitive matching)
const LEADERSHIP_HIERARCHY: Record<string, number> = {
  'gm (on bar)': 1,
  'gm': 1,
  'general manager': 1,
  'store manager': 1,
  'team leader': 2,
  'team lead': 2,
  'shift lead': 2,
  'shift leader': 2,
};

// Canonical display names for each role
const LEADERSHIP_DISPLAY_NAMES: Record<string, string> = {
  'gm (on bar)': 'GM (on bar)',
  'gm': 'GM',
  'general manager': 'General Manager',
  'store manager': 'Store Manager',
  'team leader': 'Team Leader',
  'team lead': 'Team Lead',
  'shift lead': 'Shift Lead',
  'shift leader': 'Shift Leader',
};

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
 * Job title matching is case-insensitive
 */
export function detectLeaders(clockedIn: ToastTimeEntry[], allUsers: User[]): LeaderInfo[] {
  const leaders: LeaderInfo[] = [];

  clockedIn.forEach(entry => {
    const jobTitleNormalized = entry.jobName.toLowerCase().trim();
    const priority = LEADERSHIP_HIERARCHY[jobTitleNormalized];

    if (priority !== undefined) {
      // This is a leader (GM or Team Leader)
      // Try to match to a user in the system
      const user = allUsers.find(u =>
        u.name.toLowerCase() === entry.employeeName.toLowerCase()
      );

      leaders.push({
        userId: user?.id || `unknown-${entry.employeeGuid}`,
        name: entry.employeeName,
        jobTitle: LEADERSHIP_DISPLAY_NAMES[jobTitleNormalized] || entry.jobName,
        priority: priority,
        employeeGuid: entry.employeeGuid
      });
    }
  });

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
