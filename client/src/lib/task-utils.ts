import { Task, RepeatType } from '@/types/task';
import { format, addDays, addWeeks, addMonths, isToday, startOfDay } from 'date-fns';

export function generateTaskId(): string {
  return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function createTask(
  title: string, 
  repeatType: RepeatType = 'none', 
  scheduledDate?: string
): Task {
  const now = new Date().toISOString();
  const today = format(new Date(), 'yyyy-MM-dd');
  
  // Determine status based on scheduled date
  let status: Task['status'] = 'active';
  if (scheduledDate && scheduledDate > today) {
    status = 'backlog';
  }
  
  // If no scheduled date provided, default to today
  const finalScheduledDate = scheduledDate || today;
  
  return {
    id: generateTaskId(),
    title: title.trim(),
    status,
    repeatType,
    scheduledDate: finalScheduledDate,
    createdAt: now,
    order: Date.now()
  };
}

export function getTasksCompletedToday(tasks: Task[]): Task[] {
  return tasks.filter(task => 
    task.status === 'completed' && 
    task.completedAt && 
    isToday(new Date(task.completedAt))
  );
}

export function getActiveTasks(tasks: Task[]): Task[] {
  return tasks
    .filter(task => task.status === 'active')
    .sort((a, b) => a.order - b.order)
    .slice(0, 3);
}

export function getHoldTasks(tasks: Task[]): Task[] {
  return tasks
    .filter(task => task.status === 'hold')
    .sort((a, b) => a.order - b.order)
    .slice(0, 3);
}

export function getBacklogCount(tasks: Task[]): number {
  const activeTasks = tasks.filter(task => task.status === 'active');
  return Math.max(0, activeTasks.length - 3);
}

export function canHoldTask(tasks: Task[]): boolean {
  const holdTasks = tasks.filter(task => task.status === 'hold');
  return holdTasks.length < 3;
}

export function completeTask(tasks: Task[], taskId: string): Task[] {
  return tasks.map(task => {
    if (task.id === taskId) {
      const updatedTask = {
        ...task,
        status: 'completed' as const,
        completedAt: new Date().toISOString()
      };

      // If it's a repeating task, create a new instance
      if (task.repeatType !== 'none') {
        const newTask = createRepeatingTask(task);
        return [updatedTask, newTask];
      }
      
      return updatedTask;
    }
    return task;
  }).flat();
}

export function createRepeatingTask(originalTask: Task): Task {
  const baseDate = originalTask.scheduledDate ? new Date(originalTask.scheduledDate) : new Date();
  let nextDate: Date;

  switch (originalTask.repeatType) {
    case 'daily':
      nextDate = addDays(baseDate, 1);
      break;
    case 'weekly':
      nextDate = addWeeks(baseDate, 1);
      break;
    case 'monthly':
      nextDate = addMonths(baseDate, 1);
      break;
    default:
      return originalTask;
  }

  return createTask(
    originalTask.title,
    originalTask.repeatType,
    format(nextDate, 'yyyy-MM-dd')
  );
}

export function holdTask(tasks: Task[], taskId: string): Task[] {
  if (!canHoldTask(tasks)) {
    throw new Error('Cannot hold more than 3 tasks. Complete one first!');
  }

  return tasks.map(task =>
    task.id === taskId
      ? { ...task, status: 'hold' as const, heldAt: new Date().toISOString() }
      : task
  );
}

export function resumeTask(tasks: Task[], taskId: string): Task[] {
  return tasks.map(task =>
    task.id === taskId
      ? { ...task, status: 'active' as const, heldAt: undefined, order: Date.now() }
      : task
  );
}

export function activateScheduledTasks(tasks: Task[]): Task[] {
  const today = format(startOfDay(new Date()), 'yyyy-MM-dd');
  
  return tasks.map(task => {
    if (task.status === 'backlog' && task.scheduledDate && task.scheduledDate <= today) {
      return { ...task, status: 'active' as const, order: Date.now() };
    }
    return task;
  });
}

export function canCompleteTask(tasks: Task[], taskId: string): boolean {
  const activeTasks = getActiveTasks(tasks);
  const holdTasks = getHoldTasks(tasks);
  
  return (activeTasks.length > 0 && activeTasks[0].id === taskId) ||
         (holdTasks.length > 0 && holdTasks[0].id === taskId);
}
