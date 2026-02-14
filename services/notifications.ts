/**
 * Push Notification Service
 * Handles FCM initialization, permissions, and local notification display
 */

import { db } from './db';
import { STORE_MANAGERS, NOTIFICATION_CONFIG } from '../data/managerAssignments';

declare const firebase: any;

// Types
export interface NotificationToken {
  userId: string;
  userEmail: string;
  storeId: string;
  token: string;
  createdAt: string;
  userAgent: string;
}

export interface PendingNotification {
  id: string;
  type: 'LATE_SUBMISSION' | 'HIGH_TURN_TIME';
  storeId: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  createdAt: string;
}

// Track sent notifications to prevent duplicates (session-based)
const sentNotifications = new Set<string>();

// FCM messaging instance
let messaging: any = null;

/**
 * Initialize Firebase Cloud Messaging
 */
export async function initializeMessaging(): Promise<boolean> {
  if (typeof firebase === 'undefined' || !firebase.messaging) {
    console.warn('[Notifications] Firebase Messaging SDK not available');
    return false;
  }

  try {
    messaging = firebase.messaging();
    console.log('[Notifications] Firebase Messaging initialized');
    return true;
  } catch (error) {
    console.error('[Notifications] Failed to initialize messaging:', error);
    return false;
  }
}

/**
 * Check if browser supports notifications
 */
export function isNotificationSupported(): boolean {
  return 'Notification' in window && 'serviceWorker' in navigator;
}

/**
 * Get current notification permission state
 */
export function getPermissionState(): NotificationPermission {
  if (!isNotificationSupported()) return 'denied';
  return Notification.permission;
}

/**
 * Request notification permission from user
 */
export async function requestPermission(): Promise<boolean> {
  if (!isNotificationSupported()) {
    console.warn('[Notifications] Notifications not supported in this browser');
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    console.log('[Notifications] Permission result:', permission);
    return permission === 'granted';
  } catch (error) {
    console.error('[Notifications] Permission request failed:', error);
    return false;
  }
}

/**
 * Get FCM token for this device
 */
export async function getFCMToken(): Promise<string | null> {
  if (!messaging) {
    const initialized = await initializeMessaging();
    if (!initialized) return null;
  }

  try {
    // Register service worker first
    const registration = await navigator.serviceWorker.register('/sw.js');

    // Get FCM token
    const token = await messaging.getToken({
      vapidKey: undefined, // Using default Firebase VAPID key
      serviceWorkerRegistration: registration
    });

    console.log('[Notifications] FCM token obtained');
    return token;
  } catch (error) {
    console.error('[Notifications] Failed to get FCM token:', error);
    return null;
  }
}

/**
 * Register manager for notifications
 */
export async function registerForNotifications(
  userId: string,
  userEmail: string,
  storeId: string
): Promise<boolean> {
  // Request permission
  const granted = await requestPermission();
  if (!granted) {
    console.log('[Notifications] Permission not granted');
    return false;
  }

  // Get FCM token
  const token = await getFCMToken();
  if (!token) {
    console.log('[Notifications] Failed to get FCM token');
    return false;
  }

  // Save token to Firestore
  const tokenData: NotificationToken = {
    userId,
    userEmail: userEmail.toLowerCase(),
    storeId,
    token,
    createdAt: new Date().toISOString(),
    userAgent: navigator.userAgent
  };

  try {
    await db.saveFCMToken(tokenData);
    console.log('[Notifications] Token saved for', userEmail);
    return true;
  } catch (error) {
    console.error('[Notifications] Failed to save token:', error);
    return false;
  }
}

/**
 * Check if user is a manager for a store
 */
export function isStoreManager(userEmail: string, storeId: string): boolean {
  const managers = STORE_MANAGERS[storeId] || [];
  return managers.some(m => m.toLowerCase() === userEmail.toLowerCase());
}

/**
 * Check if user is any store manager
 */
export function isAnyStoreManager(userEmail: string): boolean {
  const email = userEmail.toLowerCase();
  return Object.values(STORE_MANAGERS).some(managers =>
    managers.some(m => m.toLowerCase() === email)
  );
}

/**
 * Show a local notification (when app is in foreground)
 */
export function showLocalNotification(notification: PendingNotification): void {
  // Check if already sent this session
  if (sentNotifications.has(notification.id)) {
    console.log('[Notifications] Already sent:', notification.id);
    return;
  }

  // Check permission
  if (Notification.permission !== 'granted') {
    console.log('[Notifications] Permission not granted');
    return;
  }

  // Show notification
  const n = new Notification(notification.title, {
    body: notification.body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: notification.id, // Prevents duplicate notifications
    data: notification.data,
    requireInteraction: true
  });

  n.onclick = () => {
    window.focus();
    n.close();
  };

  // Mark as sent
  sentNotifications.add(notification.id);
  console.log('[Notifications] Shown:', notification.title);
}

/**
 * Generate unique notification ID for de-duplication
 */
export function generateNotificationId(
  type: 'LATE_SUBMISSION' | 'HIGH_TURN_TIME',
  storeId: string,
  date: string,
  extra?: string
): string {
  return `${type}-${storeId}-${date}-${extra || ''}`;
}

/**
 * Check if notification was already sent this session
 */
export function wasNotificationSent(notificationId: string): boolean {
  return sentNotifications.has(notificationId);
}

/**
 * Clear sent notifications (for testing or new session)
 */
export function clearSentNotifications(): void {
  sentNotifications.clear();
}

/**
 * Get notification config
 */
export function getNotificationConfig() {
  return NOTIFICATION_CONFIG;
}
