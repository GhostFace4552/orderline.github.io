import { storage } from './storage';
import { isWithinBedtime, shouldSendReminder, hasOutstandingTasks } from '../client/src/lib/notification-utils';

// VAPID keys would typically be environment variables
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';

interface PushPayload {
  title: string;
  body: string;
  url?: string;
}

export class NotificationManager {
  private intervalId: NodeJS.Timeout | null = null;
  private readonly webpush: any;

  constructor() {
    try {
      // Dynamically import web-push if available
      this.webpush = require('web-push');
      if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
        this.webpush.setVapidDetails(
          'mailto:orderline@example.com',
          VAPID_PUBLIC_KEY,
          VAPID_PRIVATE_KEY
        );
      }
    } catch (error) {
      console.log('web-push not available, using local notifications only');
      this.webpush = null;
    }
  }

  start() {
    if (this.intervalId) return;
    
    console.log('Starting notification manager...');
    
    // Check for reminders every 5 minutes
    this.intervalId = setInterval(async () => {
      await this.checkAndSendReminders();
    }, 5 * 60 * 1000);
    
    // Initial check
    setTimeout(() => this.checkAndSendReminders(), 10000);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('Notification manager stopped');
    }
  }

  private async checkAndSendReminders() {
    try {
      const activePrefs = await storage.getActiveNotificationPreferences();
      
      for (const prefs of activePrefs) {
        await this.processReminder(prefs);
      }
    } catch (error) {
      console.error('Error checking reminders:', error);
    }
  }

  private async processReminder(prefs: any) {
    try {
      // Check if it's bedtime
      if (isWithinBedtime(prefs.bedtimeStart, prefs.bedtimeEnd, prefs.timezone)) {
        return; // Don't send during bedtime
      }

      // Check if enough time has passed since last reminder
      if (!shouldSendReminder(prefs.lastNotifiedAt, prefs.frequencyMinutes)) {
        return; // Too soon since last reminder
      }

      // Check if there are outstanding tasks
      const taskSnapshot = await storage.getTaskSnapshot(prefs.deviceId);
      if (!taskSnapshot || !hasOutstandingTasks(taskSnapshot)) {
        return; // No outstanding tasks
      }

      // Send the reminder
      await this.sendReminder(prefs, taskSnapshot);

      // Update last notified time
      await storage.upsertNotificationPreferences({
        ...prefs,
        lastNotifiedAt: new Date().toISOString()
      });

    } catch (error) {
      console.error(`Error processing reminder for device ${prefs.deviceId}:`, error);
      
      // If subscription is invalid, remove it
      if (error.statusCode === 410) {
        await storage.upsertNotificationPreferences({
          ...prefs,
          pushSubscription: null,
          enabled: false
        });
      }
    }
  }

  private async sendReminder(prefs: any, taskSnapshot: any) {
    const payload: PushPayload = {
      title: 'Task Reminder',
      body: this.getReminderMessage(taskSnapshot),
      url: '/'
    };

    // Try push notification first
    if (this.webpush && prefs.pushSubscription) {
      try {
        const subscription = JSON.parse(prefs.pushSubscription);
        await this.webpush.sendNotification(subscription, JSON.stringify(payload));
        console.log(`Push notification sent to device ${prefs.deviceId}`);
        return;
      } catch (error) {
        console.error('Push notification failed:', error);
        // Fall through to local notification
      }
    }

    console.log(`Reminder logged for device ${prefs.deviceId}: ${payload.body}`);
  }

  private getReminderMessage(taskSnapshot: any): string {
    const { activeCount, holdCount } = taskSnapshot;
    const totalTasks = activeCount + holdCount;
    
    if (totalTasks === 1) {
      return "You've got 1 task waiting—tap to pick it up";
    } else if (activeCount > 0 && holdCount === 0) {
      return `You've got ${activeCount} active tasks waiting`;
    } else if (activeCount === 0 && holdCount > 0) {
      return `You've got ${holdCount} tasks on hold—ready to resume?`;
    } else {
      return `You've got ${totalTasks} tasks waiting—tap to pick the top one`;
    }
  }
}

// Export singleton instance
export const notificationManager = new NotificationManager();