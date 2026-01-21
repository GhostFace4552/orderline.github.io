import { 
  type User, 
  type InsertUser,
  type NotificationPreferences,
  type InsertNotificationPreferences,
  type TaskSnapshot,
  type InsertTaskSnapshot
} from "@shared/schema";
import { randomUUID } from "crypto";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Notification preferences
  getNotificationPreferences(deviceId: string): Promise<NotificationPreferences | undefined>;
  upsertNotificationPreferences(prefs: InsertNotificationPreferences): Promise<NotificationPreferences>;
  
  // Task snapshots
  getTaskSnapshot(deviceId: string): Promise<TaskSnapshot | undefined>;
  upsertTaskSnapshot(snapshot: InsertTaskSnapshot): Promise<TaskSnapshot>;
  
  // Get all active subscriptions for reminder job
  getActiveNotificationPreferences(): Promise<NotificationPreferences[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private notificationPreferences: Map<string, NotificationPreferences>;
  private taskSnapshots: Map<string, TaskSnapshot>;

  constructor() {
    this.users = new Map();
    this.notificationPreferences = new Map();
    this.taskSnapshots = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getNotificationPreferences(deviceId: string): Promise<NotificationPreferences | undefined> {
    return this.notificationPreferences.get(deviceId);
  }

  async upsertNotificationPreferences(prefs: InsertNotificationPreferences): Promise<NotificationPreferences> {
    const existing = this.notificationPreferences.get(prefs.deviceId);
    const now = new Date();
    
    const notificationPrefs: NotificationPreferences = {
      id: existing?.id || randomUUID(),
      ...prefs,
      createdAt: existing?.createdAt || now,
      updatedAt: now
    };
    
    this.notificationPreferences.set(prefs.deviceId, notificationPrefs);
    return notificationPrefs;
  }

  async getTaskSnapshot(deviceId: string): Promise<TaskSnapshot | undefined> {
    return this.taskSnapshots.get(deviceId);
  }

  async upsertTaskSnapshot(snapshot: InsertTaskSnapshot): Promise<TaskSnapshot> {
    const taskSnapshot: TaskSnapshot = {
      ...snapshot,
      updatedAt: new Date()
    };
    
    this.taskSnapshots.set(snapshot.deviceId, taskSnapshot);
    return taskSnapshot;
  }

  async getActiveNotificationPreferences(): Promise<NotificationPreferences[]> {
    return Array.from(this.notificationPreferences.values())
      .filter(prefs => prefs.enabled && prefs.pushSubscription);
  }
}

export const storage = new MemStorage();
