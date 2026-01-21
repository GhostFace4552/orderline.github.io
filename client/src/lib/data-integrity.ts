import { Task } from '@/types/task';

// Data integrity validation
export function validateTaskIntegrity(tasks: Task[]): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!Array.isArray(tasks)) {
    errors.push('Tasks data is not an array');
    return { isValid: false, errors };
  }

  tasks.forEach((task, index) => {
    if (!task.id || typeof task.id !== 'string') {
      errors.push(`Task ${index}: Missing or invalid ID`);
    }
    
    if (!task.title || typeof task.title !== 'string') {
      errors.push(`Task ${index}: Missing or invalid title`);
    }
    
    if (!['active', 'hold', 'completed', 'backlog'].includes(task.status)) {
      errors.push(`Task ${index}: Invalid status "${task.status}"`);
    }
    
    if (!['none', 'daily', 'weekly', 'monthly'].includes(task.repeatType)) {
      errors.push(`Task ${index}: Invalid repeat type "${task.repeatType}"`);
    }
    
    if (task.scheduledDate && isNaN(Date.parse(task.scheduledDate))) {
      errors.push(`Task ${index}: Invalid scheduled date`);
    }
    
    if (task.createdAt && isNaN(Date.parse(task.createdAt))) {
      errors.push(`Task ${index}: Invalid created date`);
    }
  });

  return { isValid: errors.length === 0, errors };
}

// Data repair functions
export function repairTaskData(tasks: any[]): Task[] {
  return tasks
    .filter(task => task && typeof task === 'object')
    .map((task, index) => ({
      id: task.id || `repaired_task_${Date.now()}_${index}`,
      title: task.title || 'Untitled Task',
      status: ['active', 'hold', 'completed', 'backlog'].includes(task.status) ? task.status : 'active',
      repeatType: ['none', 'daily', 'weekly', 'monthly'].includes(task.repeatType) ? task.repeatType : 'none',
      scheduledDate: task.scheduledDate && !isNaN(Date.parse(task.scheduledDate)) ? task.scheduledDate : undefined,
      createdAt: task.createdAt && !isNaN(Date.parse(task.createdAt)) ? task.createdAt : new Date().toISOString(),
      completedAt: task.completedAt && !isNaN(Date.parse(task.completedAt)) ? task.completedAt : undefined,
      heldAt: task.heldAt && !isNaN(Date.parse(task.heldAt)) ? task.heldAt : undefined,
      order: typeof task.order === 'number' ? task.order : Date.now() + index,
    }))
    .filter(task => task.title.trim().length > 0); // Remove empty tasks
}

// Cross-tab synchronization
export function syncDataAcrossTabs() {
  // Listen for storage changes from other tabs
  window.addEventListener('storage', (event) => {
    if (event.key === 'orderline-tasks' && event.newValue) {
      // Trigger a custom event to notify the app about data changes
      window.dispatchEvent(new CustomEvent('orderline-data-sync', {
        detail: { newData: event.newValue }
      }));
    }
  });
}

// Data corruption detection
export function detectDataCorruption(): boolean {
  try {
    const data = localStorage.getItem('orderline-tasks');
    if (!data) return false;
    
    const parsed = JSON.parse(data);
    const tasks = Array.isArray(parsed) ? parsed : (parsed.tasks || []);
    
    const { isValid } = validateTaskIntegrity(tasks);
    return !isValid;
  } catch {
    return true; // JSON parse error indicates corruption
  }
}

// Emergency data recovery
export function emergencyDataRecovery(): Task[] {
  console.warn('Emergency data recovery initiated');
  
  try {
    // Try to recover from the most recent backup
    const backupKeys = Object.keys(localStorage)
      .filter(key => key.startsWith('orderline-backup-'))
      .sort()
      .reverse();
    
    for (const key of backupKeys) {
      try {
        const backup = localStorage.getItem(key);
        if (backup) {
          const data = JSON.parse(backup);
          const tasks = data.tasks || [];
          const { isValid } = validateTaskIntegrity(tasks);
          
          if (isValid) {
            console.log(`Data recovered from backup: ${key}`);
            return tasks;
          }
        }
      } catch {
        continue;
      }
    }
    
    // If no valid backup found, try to repair the current data
    const corruptData = localStorage.getItem('orderline-tasks');
    if (corruptData) {
      try {
        const parsed = JSON.parse(corruptData);
        const tasks = Array.isArray(parsed) ? parsed : (parsed.tasks || []);
        const repaired = repairTaskData(tasks);
        
        if (repaired.length > 0) {
          console.log('Data partially recovered through repair');
          return repaired;
        }
      } catch {
        // Continue to fallback
      }
    }
    
    console.warn('No recoverable data found');
    return [];
  } catch (error) {
    console.error('Emergency recovery failed:', error);
    return [];
  }
}

// Health check for data integrity
export function performDataHealthCheck(): { 
  healthy: boolean; 
  issues: string[]; 
  recommendations: string[] 
} {
  const issues: string[] = [];
  const recommendations: string[] = [];
  
  try {
    // Check if data exists
    const data = localStorage.getItem('orderline-tasks');
    if (!data) {
      issues.push('No task data found');
      recommendations.push('This is normal for new installations');
      return { healthy: true, issues, recommendations };
    }
    
    // Check data format
    let parsed;
    try {
      parsed = JSON.parse(data);
    } catch {
      issues.push('Data format corruption detected');
      recommendations.push('Emergency recovery will be attempted automatically');
      return { healthy: false, issues, recommendations };
    }
    
    // Check data structure
    const tasks = Array.isArray(parsed) ? parsed : (parsed.tasks || []);
    const { isValid, errors } = validateTaskIntegrity(tasks);
    
    if (!isValid) {
      issues.push(...errors);
      recommendations.push('Data repair may be needed');
    }
    
    // Check backup availability
    const backupCount = Object.keys(localStorage)
      .filter(key => key.startsWith('orderline-backup-'))
      .length;
    
    if (backupCount === 0) {
      issues.push('No automatic backups found');
      recommendations.push('Backups will be created automatically as you use the app');
    } else if (backupCount < 3) {
      recommendations.push(`${backupCount} backup${backupCount === 1 ? '' : 's'} available - more will be created over time`);
    }
    
    return { 
      healthy: isValid, 
      issues, 
      recommendations 
    };
  } catch (error) {
    issues.push('Health check failed');
    recommendations.push('Please contact support if issues persist');
    return { healthy: false, issues, recommendations };
  }
}