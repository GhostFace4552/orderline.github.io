import { Task } from '@/types/task';

// Data schema version - increment when making breaking changes
export const CURRENT_DATA_VERSION = '1.0.0';
export const DATA_VERSION_KEY = 'orderline-data-version';
export const BACKUP_KEY_PREFIX = 'orderline-backup-';

// Data wrapper with versioning
export interface VersionedData {
  version: string;
  createdAt: string;
  lastModified: string;
  tasks: Task[];
  metadata?: {
    totalTasksCreated?: number;
    totalTasksCompleted?: number;
    userPreferences?: Record<string, any>;
  };
}

// Create automatic backup before any data changes
export function createDataBackup(tasks: Task[]): void {
  try {
    const timestamp = new Date().toISOString();
    const backupKey = `${BACKUP_KEY_PREFIX}${timestamp}`;
    
    const backupData: VersionedData = {
      version: CURRENT_DATA_VERSION,
      createdAt: timestamp,
      lastModified: timestamp,
      tasks: JSON.parse(JSON.stringify(tasks)), // Deep clone
    };
    
    localStorage.setItem(backupKey, JSON.stringify(backupData));
    
    // Keep only last 10 backups to avoid storage bloat
    cleanupOldBackups();
  } catch (error) {
    console.error('Failed to create data backup:', error);
  }
}

// Clean up old backups, keeping only the most recent ones
function cleanupOldBackups(): void {
  try {
    const allKeys = Object.keys(localStorage);
    const backupKeys = allKeys
      .filter(key => key.startsWith(BACKUP_KEY_PREFIX))
      .sort()
      .reverse(); // Most recent first
    
    // Remove backups beyond the 10 most recent
    backupKeys.slice(10).forEach(key => {
      localStorage.removeItem(key);
    });
  } catch (error) {
    console.error('Failed to cleanup old backups:', error);
  }
}

// Migrate data from older versions
export function migrateData(rawData: any): Task[] {
  // If it's already a VersionedData object
  if (rawData && typeof rawData === 'object' && rawData.version && rawData.tasks) {
    return migrateTasksFromVersion(rawData.tasks, rawData.version);
  }
  
  // If it's a plain array (legacy format)
  if (Array.isArray(rawData)) {
    return migrateTasksFromVersion(rawData, '0.0.0');
  }
  
  // Return empty array for invalid data
  return [];
}

// Migrate tasks based on their schema version
function migrateTasksFromVersion(tasks: any[], version: string): Task[] {
  try {
    let migratedTasks = tasks;
    
    // Migration from pre-versioned data (0.0.0)
    if (version === '0.0.0') {
      migratedTasks = tasks.map(task => ({
        ...task,
        // Ensure all required fields exist with defaults
        id: task.id || `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: task.title || 'Untitled Task',
        status: task.status || 'active',
        repeatType: task.repeatType || 'none',
        createdAt: task.createdAt || new Date().toISOString(),
        order: task.order || Date.now(),
      }));
    }
    
    // Migration to add scheduledDate for calendar view (all versions)
    migratedTasks = migratedTasks.map(task => {
      if (!task.scheduledDate) {
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
        
        if (task.status === 'completed' && task.completedAt) {
          // Use completion date as scheduled date for completed tasks
          const completedDate = new Date(task.completedAt).toISOString().split('T')[0];
          return { ...task, scheduledDate: completedDate };
        } else if (['active', 'hold'].includes(task.status)) {
          // Active/hold tasks without scheduled date are assumed to be for today
          return { ...task, scheduledDate: today };
        } else {
          // Backlog tasks get today's date as well
          return { ...task, scheduledDate: today };
        }
      }
      return task;
    });
    
    // Future migrations would go here
    // if (version === '1.0.0') { ... }
    // if (version === '1.1.0') { ... }
    
    return migratedTasks.filter(isValidTask);
  } catch (error) {
    console.error('Data migration failed:', error);
    return [];
  }
}

// Validate task structure
function isValidTask(task: any): task is Task {
  return (
    task &&
    typeof task === 'object' &&
    typeof task.id === 'string' &&
    typeof task.title === 'string' &&
    typeof task.status === 'string' &&
    ['active', 'hold', 'completed', 'backlog'].includes(task.status) &&
    typeof task.repeatType === 'string' &&
    ['none', 'daily', 'weekly', 'monthly'].includes(task.repeatType)
  );
}

// Safe data wrapper with versioning
export function wrapDataWithVersion(tasks: Task[]): VersionedData {
  const currentVersion = localStorage.getItem(DATA_VERSION_KEY) || '0.0.0';
  const now = new Date().toISOString();
  
  return {
    version: CURRENT_DATA_VERSION,
    createdAt: currentVersion === '0.0.0' ? now : (getStoredData()?.createdAt || now),
    lastModified: now,
    tasks,
    metadata: {
      totalTasksCreated: getStoredData()?.metadata?.totalTasksCreated || tasks.length,
      totalTasksCompleted: getStoredData()?.metadata?.totalTasksCompleted || 0,
    },
  };
}

// Get stored data with version info
function getStoredData(): VersionedData | null {
  try {
    const stored = localStorage.getItem('orderline-tasks');
    if (!stored) return null;
    
    const parsed = JSON.parse(stored);
    if (parsed && parsed.version) {
      return parsed as VersionedData;
    }
    return null;
  } catch {
    return null;
  }
}

// Recovery function to restore from backup
export function restoreFromBackup(backupTimestamp?: string): Task[] {
  try {
    if (backupTimestamp) {
      const backupKey = `${BACKUP_KEY_PREFIX}${backupTimestamp}`;
      const backup = localStorage.getItem(backupKey);
      if (backup) {
        const data = JSON.parse(backup) as VersionedData;
        return data.tasks;
      }
    }
    
    // Find most recent backup
    const allKeys = Object.keys(localStorage);
    const backupKeys = allKeys
      .filter(key => key.startsWith(BACKUP_KEY_PREFIX))
      .sort()
      .reverse();
    
    if (backupKeys.length > 0) {
      const mostRecent = localStorage.getItem(backupKeys[0]);
      if (mostRecent) {
        const data = JSON.parse(mostRecent) as VersionedData;
        return data.tasks;
      }
    }
    
    return [];
  } catch (error) {
    console.error('Failed to restore from backup:', error);
    return [];
  }
}

// Get list of available backups
export function getAvailableBackups(): Array<{ timestamp: string; date: Date; taskCount: number }> {
  try {
    const allKeys = Object.keys(localStorage);
    const backupKeys = allKeys
      .filter(key => key.startsWith(BACKUP_KEY_PREFIX))
      .sort()
      .reverse();
    
    return backupKeys.map(key => {
      const timestamp = key.replace(BACKUP_KEY_PREFIX, '');
      const backup = localStorage.getItem(key);
      let taskCount = 0;
      
      if (backup) {
        try {
          const data = JSON.parse(backup) as VersionedData;
          taskCount = data.tasks.length;
        } catch {
          // Ignore parsing errors
        }
      }
      
      return {
        timestamp,
        date: new Date(timestamp),
        taskCount,
      };
    });
  } catch (error) {
    console.error('Failed to get available backups:', error);
    return [];
  }
}