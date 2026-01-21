import { Task } from '@/types/task';
import { format, startOfWeek, endOfWeek, addDays, isToday, isSameDay, parseISO, startOfDay } from 'date-fns';

export interface WeekRange {
  start: Date;
  end: Date;
  days: Date[];
}

// Get week range with configurable start day
export function getWeekRange(date: Date, weekStartsMonday: boolean = true): WeekRange {
  const weekStart = startOfWeek(date, { weekStartsOn: weekStartsMonday ? 1 : 0 });
  const weekEnd = endOfWeek(date, { weekStartsOn: weekStartsMonday ? 1 : 0 });
  
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    days.push(addDays(weekStart, i));
  }
  
  return {
    start: weekStart,
    end: weekEnd,
    days
  };
}

// Get tasks for a specific date
export function tasksForDate(tasks: Task[], date: Date): Task[] {
  const dateString = format(date, 'yyyy-MM-dd');
  
  return tasks.filter(task => {
    // Check if task is scheduled for this date
    if (task.scheduledDate === dateString) {
      return true;
    }
    
    // If no scheduled date but created today and it's active/hold, show it for today
    if (!task.scheduledDate && isToday(date) && ['active', 'hold'].includes(task.status)) {
      return true;
    }
    
    // If completed today, show on today's date
    if (task.completedAt && isSameDay(parseISO(task.completedAt), date)) {
      return true;
    }
    
    return false;
  });
}

// Sort tasks for display (active first, then by creation order)
export function sortTasksForDisplay(tasks: Task[]): Task[] {
  return tasks.sort((a, b) => {
    // Completed tasks go to the end
    if (a.status === 'completed' && b.status !== 'completed') return 1;
    if (b.status === 'completed' && a.status !== 'completed') return -1;
    
    // Active tasks before hold tasks
    if (a.status === 'active' && b.status === 'hold') return -1;
    if (b.status === 'active' && a.status === 'hold') return 1;
    
    // Sort by order (creation time)
    return a.order - b.order;
  });
}

// Get current week display string
export function getWeekDisplayString(weekStart: Date, weekEnd: Date): string {
  const startMonth = format(weekStart, 'MMM');
  const endMonth = format(weekEnd, 'MMM');
  const startDay = format(weekStart, 'd');
  const endDay = format(weekEnd, 'd');
  const year = format(weekStart, 'yyyy');
  
  if (startMonth === endMonth) {
    return `${startMonth} ${startDay}-${endDay}, ${year}`;
  } else {
    return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${year}`;
  }
}

// Check if date is in current week
export function isCurrentWeek(date: Date): boolean {
  const now = new Date();
  const currentWeek = getWeekRange(now);
  return date >= currentWeek.start && date <= currentWeek.end;
}

// Migrate legacy tasks to add scheduledDate if missing
export function migrateLegacyTasksForCalendar(tasks: Task[]): Task[] {
  const today = format(new Date(), 'yyyy-MM-dd');
  
  return tasks.map(task => {
    // If task has no scheduled date, backfill it
    if (!task.scheduledDate) {
      if (task.status === 'completed' && task.completedAt) {
        // Use completion date as scheduled date for completed tasks
        const completedDate = format(parseISO(task.completedAt), 'yyyy-MM-dd');
        return { ...task, scheduledDate: completedDate };
      } else if (['active', 'hold'].includes(task.status)) {
        // Active/hold tasks without scheduled date are assumed to be for today
        return { ...task, scheduledDate: today };
      }
    }
    
    return task;
  });
}

// Get tasks summary for a week
export function getWeekTasksSummary(tasks: Task[], weekStart: Date): {
  totalTasks: number;
  completedTasks: number;
  activeTasks: number;
  holdTasks: number;
} {
  const weekRange = getWeekRange(weekStart);
  const weekTasks = tasks.filter(task => {
    if (!task.scheduledDate) return false;
    const taskDate = parseISO(task.scheduledDate);
    return taskDate >= weekRange.start && taskDate <= weekRange.end;
  });
  
  return {
    totalTasks: weekTasks.length,
    completedTasks: weekTasks.filter(t => t.status === 'completed').length,
    activeTasks: weekTasks.filter(t => t.status === 'active').length,
    holdTasks: weekTasks.filter(t => t.status === 'hold').length,
  };
}