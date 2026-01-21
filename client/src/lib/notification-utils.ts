import { NotificationPreferences, TaskSnapshot } from '@/types/notification';

// Generate a unique device ID and store it in localStorage
export function getDeviceId(): string {
  let deviceId = localStorage.getItem('orderline-device-id');
  if (!deviceId) {
    deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('orderline-device-id', deviceId);
  }
  return deviceId;
}

// Get browser timezone
export function getBrowserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

// Check if current time is within bedtime window
export function isWithinBedtime(
  bedtimeStart: string, 
  bedtimeEnd: string, 
  timezone: string = getBrowserTimezone()
): boolean {
  try {
    const now = new Date();
    const [startHour, startMin] = bedtimeStart.split(':').map(Number);
    const [endHour, endMin] = bedtimeEnd.split(':').map(Number);
    
    const startTime = new Date();
    startTime.setHours(startHour, startMin, 0, 0);
    
    const endTime = new Date();
    endTime.setHours(endHour, endMin, 0, 0);
    
    // Handle bedtime crossing midnight
    if (startTime > endTime) {
      // Bedtime crosses midnight (e.g., 22:00 - 07:00)
      return now >= startTime || now <= endTime;
    } else {
      // Bedtime within same day (e.g., 01:00 - 05:00)
      return now >= startTime && now <= endTime;
    }
  } catch (error) {
    console.error('Error checking bedtime:', error);
    return false;
  }
}

// Check if enough time has passed since last notification
export function shouldSendReminder(
  lastNotifiedAt: string | undefined,
  frequencyMinutes: number
): boolean {
  if (!lastNotifiedAt) return true;
  
  const lastNotified = new Date(lastNotifiedAt);
  const now = new Date();
  const timeDiff = now.getTime() - lastNotified.getTime();
  const requiredInterval = frequencyMinutes * 60 * 1000; // Convert to milliseconds
  
  return timeDiff >= requiredInterval;
}

// Check if there are outstanding tasks that warrant a notification
export function hasOutstandingTasks(snapshot: TaskSnapshot): boolean {
  return snapshot.activeCount > 0 || snapshot.holdCount > 0;
}

// Request notification permission
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    throw new Error('Notifications not supported');
  }
  
  return await Notification.requestPermission();
}

// Subscribe to push notifications
export async function subscribeToPush(): Promise<PushSubscription | null> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    throw new Error('Push notifications not supported');
  }
  
  const registration = await navigator.serviceWorker.ready;
  
  // Check if already subscribed
  let subscription = await registration.pushManager.getSubscription();
  
  if (!subscription) {
    // Create new subscription
    const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
    if (!vapidPublicKey) {
      throw new Error('VAPID public key not configured');
    }
    
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
    });
  }
  
  return subscription;
}

// Unsubscribe from push notifications
export async function unsubscribeFromPush(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) return false;
  
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  
  if (subscription) {
    return await subscription.unsubscribe();
  }
  
  return true;
}

// Send test notification
export function sendTestNotification(): void {
  if (!('Notification' in window)) return;
  
  if (Notification.permission === 'granted') {
    new Notification('Test Notification', {
      body: "You've got tasks waiting—tap to pick the top one",
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      tag: 'orderline-test',
      requireInteraction: true
    });
  }
}

// Convert VAPID key for push subscription
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Default notification preferences
export function getDefaultNotificationPreferences(): Omit<NotificationPreferences, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    deviceId: getDeviceId(),
    enabled: false,
    frequencyMinutes: 60,
    bedtimeStart: '22:00',
    bedtimeEnd: '07:00',
    timezone: getBrowserTimezone(),
    lastNotifiedAt: undefined,
    pushSubscription: undefined
  };
}

// Format time for display
export function formatTime(time: string): string {
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
}

// Validate bedtime format
export function isValidTimeFormat(time: string): boolean {
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
}