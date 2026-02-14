/**
 * Notification Trigger Logic
 * Detects conditions that should trigger manager notifications
 */

import { ChecklistTemplate, ChecklistSubmission, ToastSalesData } from '../types';
import { NOTIFICATION_CONFIG } from '../data/managerAssignments';
import {
  PendingNotification,
  generateNotificationId,
  wasNotificationSent
} from './notifications';

/**
 * Check for late checklist submissions
 * Returns notifications for checklists that are 30+ minutes past deadline
 */
export function checkLateSubmissions(
  templates: ChecklistTemplate[],
  submissions: ChecklistSubmission[],
  storeId: string,
  currentDate: string // YYYY-MM-DD format
): PendingNotification[] {
  const notifications: PendingNotification[] = [];
  const now = new Date();
  const threshold = NOTIFICATION_CONFIG.lateSubmissionThresholdMinutes;

  // Filter templates for this store
  const storeTemplates = templates.filter(t => t.storeId === storeId);

  storeTemplates.forEach(template => {
    // Calculate deadline for today
    const [year, month, day] = currentDate.split('-').map(Number);
    const deadline = new Date(year, month - 1, day, template.deadlineHour, 0, 0, 0);

    // Check if we're past deadline + threshold
    const alertTime = new Date(deadline.getTime() + threshold * 60 * 1000);
    if (now < alertTime) {
      return; // Not time to alert yet
    }

    // Check if submission exists for this template and date
    const submission = submissions.find(
      s => s.templateId === template.id && s.date === currentDate && s.submittedAt
    );

    if (submission) {
      return; // Already submitted
    }

    // Generate notification ID for de-duplication
    const notificationId = generateNotificationId(
      'LATE_SUBMISSION',
      storeId,
      currentDate,
      template.id
    );

    // Skip if already sent this session
    if (wasNotificationSent(notificationId)) {
      return;
    }

    // Calculate how late
    const minutesLate = Math.floor((now.getTime() - deadline.getTime()) / 60000);

    notifications.push({
      id: notificationId,
      type: 'LATE_SUBMISSION',
      storeId,
      title: `Late Checklist: ${template.name}`,
      body: `${template.name} is ${minutesLate} minutes overdue. Deadline was ${formatTime(deadline)}.`,
      data: {
        templateId: template.id,
        templateName: template.name,
        date: currentDate,
        minutesLate: String(minutesLate)
      },
      createdAt: now.toISOString()
    });
  });

  return notifications;
}

/**
 * Check for high turn time
 * Returns notification if average turn time exceeds threshold
 */
export function checkHighTurnTime(
  salesData: ToastSalesData | null,
  storeId: string
): PendingNotification | null {
  if (!salesData || salesData.averageTurnTime === undefined) {
    return null;
  }

  const threshold = NOTIFICATION_CONFIG.turnTimeThresholdMinutes;
  const avgTurnTime = salesData.averageTurnTime;

  if (avgTurnTime <= threshold) {
    return null;
  }

  // Generate notification ID (one per hour to avoid spam)
  const hourKey = new Date().toISOString().slice(0, 13); // YYYY-MM-DDTHH
  const notificationId = generateNotificationId(
    'HIGH_TURN_TIME',
    storeId,
    hourKey
  );

  // Skip if already sent this hour
  if (wasNotificationSent(notificationId)) {
    return null;
  }

  return {
    id: notificationId,
    type: 'HIGH_TURN_TIME',
    storeId,
    title: 'High Turn Time Alert',
    body: `Average turn time is ${avgTurnTime.toFixed(1)} minutes (threshold: ${threshold} min)`,
    data: {
      turnTime: String(avgTurnTime.toFixed(1)),
      threshold: String(threshold)
    },
    createdAt: new Date().toISOString()
  };
}

/**
 * Format time for display (e.g., "7:00 AM")
 */
function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

/**
 * Get today's date in YYYY-MM-DD format
 */
export function getTodayDate(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}
