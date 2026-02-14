/**
 * Store-to-Manager mapping for notifications
 * When alerts are triggered for a store, these managers receive notifications
 */

export const STORE_MANAGERS: Record<string, string[]> = {
  'store-elm': ['kate@boundariescoffee.com'],
  'store-prosper': ['daniel@boundariescoffee.com'],
};

// Notification thresholds
export const NOTIFICATION_CONFIG = {
  lateSubmissionThresholdMinutes: 30,  // Alert 30 min after deadline
  turnTimeThresholdMinutes: 6,          // Alert when avg turn time > 6 min
  pollIntervalMinutes: 5,               // Check every 5 minutes
};
