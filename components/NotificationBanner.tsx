/**
 * NotificationBanner Component
 * Prompts managers to enable push notifications
 */

import React, { useState, useEffect } from 'react';
import { Bell, BellOff, X, Check, Loader2 } from 'lucide-react';
import {
  isNotificationSupported,
  getPermissionState,
  registerForNotifications,
  isAnyStoreManager
} from '../services/notifications';
import { User } from '../types';

interface NotificationBannerProps {
  currentUser: User;
  storeId: string;
}

const NotificationBanner: React.FC<NotificationBannerProps> = ({
  currentUser,
  storeId
}) => {
  const [permissionState, setPermissionState] = useState<NotificationPermission>('default');
  const [isLoading, setIsLoading] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    // Check if notifications are supported and current permission
    if (isNotificationSupported()) {
      setPermissionState(getPermissionState());
    }

    // Check if banner was previously dismissed this session
    const dismissed = sessionStorage.getItem('notification_banner_dismissed');
    if (dismissed === 'true') {
      setIsDismissed(true);
    }
  }, []);

  // Don't show if not a manager
  if (!isAnyStoreManager(currentUser.email)) {
    return null;
  }

  // Don't show if notifications not supported
  if (!isNotificationSupported()) {
    return null;
  }

  // Don't show if already granted
  if (permissionState === 'granted') {
    return null;
  }

  // Don't show if denied (can't ask again)
  if (permissionState === 'denied') {
    return null;
  }

  // Don't show if dismissed this session
  if (isDismissed) {
    return null;
  }

  // Show success message briefly after enabling
  if (showSuccess) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4 flex items-center gap-3 animate-in fade-in duration-300">
        <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
          <Check size={20} className="text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-bold text-green-900">Notifications Enabled</h3>
          <p className="text-xs text-green-700">
            You'll receive alerts for late checklists and high turn times.
          </p>
        </div>
      </div>
    );
  }

  const handleEnable = async () => {
    setIsLoading(true);
    try {
      const success = await registerForNotifications(
        currentUser.id,
        currentUser.email,
        storeId
      );

      if (success) {
        setShowSuccess(true);
        setPermissionState('granted');
        setTimeout(() => {
          setShowSuccess(false);
        }, 3000);
      } else {
        // Permission denied or failed
        setPermissionState(getPermissionState());
      }
    } catch (error) {
      console.error('[NotificationBanner] Failed to enable:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem('notification_banner_dismissed', 'true');
  };

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4 flex items-center gap-3 animate-in fade-in duration-300">
      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
        <Bell size={20} className="text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-bold text-blue-900">Enable Notifications</h3>
        <p className="text-xs text-blue-700">
          Get alerts when checklists are late or turn times are high.
        </p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={handleEnable}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              <span>Enabling...</span>
            </>
          ) : (
            <span>Enable</span>
          )}
        </button>
        <button
          onClick={handleDismiss}
          className="p-2 text-blue-400 hover:text-blue-600 transition-colors"
          title="Dismiss"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

export default NotificationBanner;
