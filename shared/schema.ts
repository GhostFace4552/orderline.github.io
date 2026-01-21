import { sql } from "drizzle-orm";
import { pgTable, text, varchar, boolean, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const notificationPreferences = pgTable("notification_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  deviceId: varchar("device_id").notNull().unique(),
  enabled: boolean("enabled").notNull().default(false),
  frequencyMinutes: integer("frequency_minutes").notNull().default(60), // 30, 60, 120
  bedtimeStart: varchar("bedtime_start").notNull().default("22:00"), // "HH:mm" format
  bedtimeEnd: varchar("bedtime_end").notNull().default("07:00"), // "HH:mm" format
  timezone: text("timezone").notNull().default("UTC"), // IANA timezone string
  lastNotifiedAt: timestamp("last_notified_at"),
  pushSubscription: text("push_subscription"), // JSON string of PushSubscription
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const taskSnapshots = pgTable("task_snapshots", {
  deviceId: varchar("device_id").primaryKey(),
  activeCount: integer("active_count").notNull().default(0),
  holdCount: integer("hold_count").notNull().default(0),
  lastChange: timestamp("last_change").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const insertNotificationPreferencesSchema = createInsertSchema(notificationPreferences).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTaskSnapshotSchema = createInsertSchema(taskSnapshots).omit({
  updatedAt: true,
}).extend({
  lastChange: z.string().transform(str => new Date(str))
});

export type InsertNotificationPreferences = z.infer<typeof insertNotificationPreferencesSchema>;
export type NotificationPreferences = typeof notificationPreferences.$inferSelect;
export type InsertTaskSnapshot = z.infer<typeof insertTaskSnapshotSchema>;
export type TaskSnapshot = typeof taskSnapshots.$inferSelect;
