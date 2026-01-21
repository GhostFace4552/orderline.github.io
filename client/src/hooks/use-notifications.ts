import { useState, useEffect } from 'react';
import { NotificationPreferences, NotificationStatus, TaskSnapshot } from '@/types/notification';
import { 
  getDeviceId, 
  getDefaultNotificationPreferences,
  requestNotificationPermission,
  subscribeToPush,
  unsubscribeFromPush,
  sendTestNotification
} from '@/lib/notification-utils';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from './use-toast';

export function useNotifications() {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [status, setStatus] = useState<NotificationStatus>({
    permission: 'default' as NotificationPermission,
    subscription: false,
    deviceId: getDeviceId()
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Load preferences on mount
  useEffect(() => {
    loadPreferences();
    updateStatus();
  }, []);

  // Update permission status when visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        updateStatus();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      const deviceId = getDeviceId();
      
      // Try to load from localStorage first
      const localPrefs = localStorage.getItem('orderline-notification-preferences');
      if (localPrefs) {
        setPreferences(JSON.parse(localPrefs));
        return;
      }

      // Try to load from server
      try {
        const response = await fetch(`/api/notifications/preferences/${deviceId}`);
        if (response.ok) {
          const serverPrefs = await response.json();
          setPreferences(serverPrefs);
          // Cache locally
          localStorage.setItem('orderline-notification-preferences', JSON.stringify(serverPrefs));
          return;
        }
      } catch (error) {
        // Server might not have preferences yet
        console.log('No server preferences found, using defaults');
      }

      // Use defaults
      const defaultPrefs = getDefaultNotificationPreferences();
      setPreferences({ 
        ...defaultPrefs,
        id: '', // Will be set by server
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to load notification preferences:', error);
      toast({
        title: "Error",
        description: "Failed to load notification settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async () => {
    const newStatus: NotificationStatus = {
      permission: 'default' as NotificationPermission,
      subscription: false,
      deviceId: getDeviceId()
    };

    if ('Notification' in window) {
      newStatus.permission = Notification.permission;
    }

    if ('serviceWorker' in navigator && 'PushManager' in window) {
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        newStatus.subscription = !!subscription;
      } catch (error) {
        console.error('Error checking push subscription:', error);
      }
    }

    // Get last sent time from preferences
    if (preferences?.lastNotifiedAt) {
      newStatus.lastSentTime = preferences.lastNotifiedAt;
    }

    setStatus(newStatus);
  };

  const savePreferences = async (newPrefs: Partial<NotificationPreferences>) => {
    if (!preferences) return;

    try {
      setLoading(true);
      const updatedPrefs = {
        ...preferences,
        ...newPrefs,
        updatedAt: new Date().toISOString()
      };

      // Save locally immediately
      setPreferences(updatedPrefs);
      localStorage.setItem('orderline-notification-preferences', JSON.stringify(updatedPrefs));

      // Save to server
      await fetch('/api/notifications/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedPrefs)
      });

      toast({
        title: "Settings saved",
        description: "Notification preferences updated successfully",
      });
    } catch (error) {
      console.error('Failed to save preferences:', error);
      toast({
        title: "Error",
        description: "Failed to save notification settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const enableNotifications = async () => {
    try {
      setLoading(true);
      
      // Request permission
      const permission = await requestNotificationPermission();
      if (permission !== 'granted') {
        toast({
          title: "Permission denied",
          description: "Notifications won't work without permission. Check your browser settings.",
          variant: "destructive",
        });
        return false;
      }

      // Subscribe to push notifications
      let pushSubscription: PushSubscriptionJSON | undefined;
      try {
        const subscription = await subscribeToPush();
        pushSubscription = subscription?.toJSON();
      } catch (error) {
        console.error('Push subscription failed:', error);
        // Continue without push, using local notifications only
      }

      // Update preferences
      await savePreferences({
        enabled: true,
        pushSubscription: pushSubscription ? JSON.stringify(pushSubscription) : undefined
      });

      await updateStatus();
      return true;
    } catch (error) {
      console.error('Failed to enable notifications:', error);
      toast({
        title: "Error",
        description: "Failed to enable notifications",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const disableNotifications = async () => {
    try {
      setLoading(true);
      
      // Unsubscribe from push
      try {
        await unsubscribeFromPush();
      } catch (error) {
        console.error('Failed to unsubscribe from push:', error);
        // Continue anyway
      }

      // Update preferences
      await savePreferences({
        enabled: false,
        pushSubscription: undefined
      });

      await updateStatus();
    } catch (error) {
      console.error('Failed to disable notifications:', error);
      toast({
        title: "Error",
        description: "Failed to disable notifications",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateFrequency = async (frequencyMinutes: number) => {
    await savePreferences({ frequencyMinutes });
  };

  const updateBedtime = async (bedtimeStart: string, bedtimeEnd: string) => {
    await savePreferences({ bedtimeStart, bedtimeEnd });
  };

  const testNotification = () => {
    if (status.permission !== 'granted') {
      toast({
        title: "Permission required",
        description: "Please enable notifications first",
        variant: "destructive",
      });
      return;
    }

    sendTestNotification();
    toast({
      title: "Test sent",
      description: "Check your notifications!",
    });
  };

  // Update task snapshot on server
  const updateTaskSnapshot = async (activeCount: number, holdCount: number) => {
    try {
      const snapshot = {
        deviceId: getDeviceId(),
        activeCount,
        holdCount,
        lastChange: new Date().toISOString()
      };

      await fetch('/api/notifications/task-snapshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(snapshot)
      });
    } catch (error) {
      console.error('Failed to update task snapshot:', error);
      // Don't show error to user for background sync
    }
  };

  return {
    preferences,
    status,
    loading,
    enableNotifications,
    disableNotifications,
    updateFrequency,
    updateBedtime,
    testNotification,
    updateTaskSnapshot,
    refresh: () => {
      loadPreferences();
      updateStatus();
    }
  };
}