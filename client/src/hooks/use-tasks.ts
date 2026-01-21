import { useState, useEffect } from 'react';
import { useLocalStorage } from './use-local-storage';
import { useToast } from './use-toast';
import { Task, TaskFormData } from '@/types/task';
import { getActiveTasks, getHoldTasks } from '@/lib/task-utils';
import { 
  activateScheduledTasks,
  completeTask,
  holdTask,
  resumeTask,
  createTask,
  canCompleteTask,
  canHoldTask
} from '@/lib/task-utils';

// Sync task counts with notification system
function syncTaskCounts(tasks: Task[]) {
  const activeTasks = getActiveTasks(tasks);
  const holdTasks = getHoldTasks(tasks);
  
  // Send task snapshot to server for notification system (non-blocking)
  fetch('/api/notifications/task-snapshot', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      deviceId: localStorage.getItem('orderline-device-id') || `device_${Date.now()}`,
      activeCount: activeTasks.length,
      holdCount: holdTasks.length,
      lastChange: new Date().toISOString()
    })
  }).catch(error => {
    // Don't show errors to user for background sync
    console.error('Failed to sync task counts:', error);
  });
}

export function useTasks() {
  const [tasks, setTasks] = useLocalStorage<Task[]>('orderline-tasks', []);
  const { toast } = useToast();

  // Activate scheduled tasks on component mount and when tasks change
  useEffect(() => {
    setTasks(currentTasks => activateScheduledTasks(currentTasks));
  }, []);

  // Sync task counts when tasks change - disabled for now due to validation issues
  // useEffect(() => {
  //   if (tasks.length > 0) {
  //     syncTaskCounts(tasks);
  //   }
  // }, [tasks]);

  const addTask = (formData: TaskFormData) => {
    try {
      const newTask = createTask(
        formData.title,
        formData.repeatType,
        formData.scheduleDate
      );
      
      setTasks(currentTasks => [...currentTasks, newTask]);
      
      toast({
        title: "Task added successfully",
        description: formData.scheduleDate 
          ? `Task scheduled for ${formData.scheduleDate}`
          : "Task added to active list",
      });
    } catch (error) {
      toast({
        title: "Error adding task",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    }
  };

  const handleCompleteTask = (taskId: string) => {
    try {
      if (!canCompleteTask(tasks, taskId)) {
        toast({
          title: "Cannot complete task",
          description: "Only the top task in active or hold list can be completed",
          variant: "destructive"
        });
        return;
      }

      setTasks(currentTasks => completeTask(currentTasks, taskId));
      
      toast({
        title: "Task completed!",
        description: "Great job! Keep up the good work.",
      });
    } catch (error) {
      toast({
        title: "Error completing task",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    }
  };

  const handleHoldTask = (taskId: string) => {
    try {
      if (!canHoldTask(tasks)) {
        toast({
          title: "Hold limit reached",
          description: "Cannot hold more than 3 tasks. Complete one first!",
          variant: "destructive"
        });
        return;
      }

      setTasks(currentTasks => holdTask(currentTasks, taskId));
      
      toast({
        title: "Task put on hold",
        description: "Task moved to hold list",
      });
    } catch (error) {
      toast({
        title: "Error holding task",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    }
  };

  const handleResumeTask = (taskId: string) => {
    try {
      setTasks(currentTasks => resumeTask(currentTasks, taskId));
      
      toast({
        title: "Task resumed",
        description: "Task moved back to active list",
      });
    } catch (error) {
      toast({
        title: "Error resuming task",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    }
  };

  return {
    tasks,
    setTasks,
    addTask,
    completeTask: handleCompleteTask,
    holdTask: handleHoldTask,
    resumeTask: handleResumeTask
  };
}
