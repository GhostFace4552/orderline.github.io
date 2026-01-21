import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { WeekDayCard } from './week-day-card';
import { Task } from '@/types/task';
import { 
  getWeekRange, 
  tasksForDate, 
  getWeekDisplayString, 
  isCurrentWeek,
  getWeekTasksSummary 
} from '@/lib/calendar-utils';
import { ChevronLeft, ChevronRight, X, Calendar, BarChart3 } from 'lucide-react';
import { addWeeks, subWeeks } from 'date-fns';

interface WeeklyCalendarProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
}

export function WeeklyCalendar({ isOpen, onClose, tasks }: WeeklyCalendarProps) {
  const [currentWeek, setCurrentWeek] = useState(() => new Date());

  // Get current week range and days
  const weekRange = useMemo(() => getWeekRange(currentWeek, true), [currentWeek]);
  const weekDisplayString = useMemo(() => 
    getWeekDisplayString(weekRange.start, weekRange.end), 
    [weekRange]
  );
  
  // Get week summary stats
  const weekSummary = useMemo(() => 
    getWeekTasksSummary(tasks, weekRange.start), 
    [tasks, weekRange.start]
  );

  // Get tasks for each day of the week
  const dailyTasks = useMemo(() => {
    return weekRange.days.map(day => ({
      date: day,
      tasks: tasksForDate(tasks, day)
    }));
  }, [weekRange.days, tasks]);

  // Navigation functions
  const goToPreviousWeek = () => {
    setCurrentWeek(prev => subWeeks(prev, 1));
  };

  const goToNextWeek = () => {
    setCurrentWeek(prev => addWeeks(prev, 1));
  };

  const goToCurrentWeek = () => {
    setCurrentWeek(new Date());
  };

  // Listen for storage events to refresh when data changes in other tabs
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'orderline-tasks') {
        // Force re-render by updating current week slightly
        setCurrentWeek(prev => new Date(prev.getTime()));
      }
    };

    const handleCustomSync = (event: CustomEvent) => {
      // Handle cross-tab sync from our data integrity system
      setCurrentWeek(prev => new Date(prev.getTime()));
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('orderline-data-sync', handleCustomSync as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('orderline-data-sync', handleCustomSync as EventListener);
    };
  }, []);

  // Reset to current week when opening
  useEffect(() => {
    if (isOpen) {
      setCurrentWeek(new Date());
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-6xl mx-auto max-h-[95vh] overflow-hidden flex flex-col p-0">
        {/* Header */}
        <DialogHeader className="border-b border-gray-200 p-4 pb-3">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold text-gray-900 flex items-center">
              <Calendar className="mr-2 h-5 w-5 text-primary" />
              Weekly Calendar
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
              aria-label="Close calendar"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation and Stats */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-3 gap-3">
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={goToPreviousWeek}
                aria-label="Previous week"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <div className="flex flex-col items-center min-w-[200px]">
                <h2 className="font-semibold text-gray-900">{weekDisplayString}</h2>
                {!isCurrentWeek(currentWeek) && (
                  <Button
                    variant="link"
                    size="sm"
                    onClick={goToCurrentWeek}
                    className="text-xs text-primary p-0 h-auto"
                  >
                    Go to current week
                  </Button>
                )}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={goToNextWeek}
                aria-label="Next week"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Week Summary */}
            {weekSummary.totalTasks > 0 && (
              <div className="flex items-center space-x-4 text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-1">
                <div className="flex items-center">
                  <BarChart3 className="h-3 w-3 mr-1" />
                  <span>Total: {weekSummary.totalTasks}</span>
                </div>
                <div className="text-success">✓ {weekSummary.completedTasks}</div>
                <div className="text-primary">Active: {weekSummary.activeTasks}</div>
                {weekSummary.holdTasks > 0 && (
                  <div className="text-secondary">Hold: {weekSummary.holdTasks}</div>
                )}
              </div>
            )}
          </div>
        </DialogHeader>

        {/* Calendar Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
            {dailyTasks.map(({ date, tasks }) => (
              <WeekDayCard
                key={date.toISOString()}
                dayDate={date}
                tasks={tasks}
              />
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-3 bg-gray-50">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-primary rounded-full mr-1"></div>
                <span>Active</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-secondary rounded-full mr-1"></div>
                <span>Hold</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-success rounded-full mr-1"></div>
                <span>Completed</span>
              </div>
            </div>
            <div>
              Week starts on Monday • Times in local timezone
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}