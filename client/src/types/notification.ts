export interface NotificationPreferences {
  id: string;
  deviceId: string;
  enabled: boolean;
  frequencyMinutes: number; // 30, 60, 120
  bedtimeStart: string; // "HH:mm" format
  bedtimeEnd: string; // "HH:mm" format
  timezone: string; // IANA timezone string
  lastNotifiedAt?: string; // ISO string
  pushSubscription?: PushSubscriptionJSON;
  createdAt: string;
  updatedAt: string;
}

export interface TaskSnapshot {
  activeCount: number;
  holdCount: number;
  lastChange: string; // ISO string
}

export type NotificationPermissionState = 'default' | 'granted' | 'denied';

export interface NotificationStatus {
  permission: NotificationPermissionState;
  subscription: boolean;
  lastSentTime?: string;
  deviceId: string;
}