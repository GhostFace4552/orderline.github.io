import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertNotificationPreferencesSchema, 
  insertTaskSnapshotSchema 
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Notification preferences routes
  app.get("/api/notifications/preferences/:deviceId", async (req, res) => {
    try {
      const { deviceId } = req.params;
      const prefs = await storage.getNotificationPreferences(deviceId);
      
      if (!prefs) {
        return res.status(404).json({ error: "Preferences not found" });
      }
      
      res.json(prefs);
    } catch (error) {
      console.error("Error fetching notification preferences:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/notifications/preferences", async (req, res) => {
    try {
      const validatedData = insertNotificationPreferencesSchema.parse(req.body);
      const prefs = await storage.upsertNotificationPreferences(validatedData);
      res.json(prefs);
    } catch (error) {
      console.error("Error saving notification preferences:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Task snapshot routes
  app.get("/api/notifications/task-snapshot/:deviceId", async (req, res) => {
    try {
      const { deviceId } = req.params;
      const snapshot = await storage.getTaskSnapshot(deviceId);
      
      if (!snapshot) {
        return res.status(404).json({ error: "Snapshot not found" });
      }
      
      res.json(snapshot);
    } catch (error) {
      console.error("Error fetching task snapshot:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/notifications/task-snapshot", async (req, res) => {
    try {
      const validatedData = insertTaskSnapshotSchema.parse(req.body);
      const snapshot = await storage.upsertTaskSnapshot(validatedData);
      res.json(snapshot);
    } catch (error) {
      console.error("Error saving task snapshot:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
