import { User, UserRole } from '../types';

/**
 * One-time offboard of Heath Marcom (left Oct 3, 2026; approved by Daniel).
 * Heath is still active in Toast, so the roster sync alone kept him on.
 * Sets inactive, drops ADMIN, and marks offboarded so the roster sync never
 * reactivates him. History (submissions, reviews, progress) is untouched.
 */
export const HEATH_USER_ID = 'u-1785790050563-vha7b5';
export const HEATH_OFFBOARD_KEY = 'userOffboard-heath-marcom-v1';

export function offboardedUser(user: User, at: string): User {
  return { ...user, active: false, role: UserRole.TRAINEE, offboarded: true, offboardedAt: at };
}

export function needsOffboard(user: User | undefined): boolean {
  return !!user && (user.active !== false || user.role === UserRole.ADMIN || !user.offboarded);
}
