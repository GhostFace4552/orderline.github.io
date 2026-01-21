import { useState, useEffect } from 'react';
import { 
  migrateData, 
  wrapDataWithVersion, 
  createDataBackup,
  CURRENT_DATA_VERSION,
  DATA_VERSION_KEY
} from '@/lib/data-migration';
import { Task } from '@/types/task';

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      
      // Special handling for task data with migration and versioning
      if (key === 'orderline-tasks' && item) {
        const parsed = JSON.parse(item);
        const migratedTasks = migrateData(parsed);
        
        // Update version in localStorage
        localStorage.setItem(DATA_VERSION_KEY, CURRENT_DATA_VERSION);
        
        return migratedTasks as T;
      }
      
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      // Special handling for task data with backup and versioning
      if (key === 'orderline-tasks' && Array.isArray(valueToStore)) {
        // Create backup before saving new data
        createDataBackup(valueToStore as Task[]);
        
        // Wrap data with version information
        const versionedData = wrapDataWithVersion(valueToStore as Task[]);
        
        setStoredValue(valueToStore);
        window.localStorage.setItem(key, JSON.stringify(versionedData));
        window.localStorage.setItem(DATA_VERSION_KEY, CURRENT_DATA_VERSION);
      } else {
        setStoredValue(valueToStore);
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue] as const;
}
