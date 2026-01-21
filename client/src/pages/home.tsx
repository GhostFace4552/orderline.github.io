import { useState, useEffect } from 'react';
import { useTasks } from '@/hooks/use-tasks';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { TaskCard } from '@/components/task-card';
import { AddTaskModal } from '@/components/add-task-modal';
import { FloatingActionButton } from '@/components/floating-action-button';
import { DataBackupManager } from '@/components/data-backup-manager';
import { WeeklyCalendar } from '@/components/weekly-calendar';
import { NotificationSettings } from '@/components/notification-settings';
import { Button } from '@/components/ui/button';
import { 
  getActiveTasks, 
  getHoldTasks, 
  getBacklogCount, 
  getTasksCompletedToday 
} from '@/lib/task-utils';
import { CheckCircle, PlayCircle, PauseCircle, List, Plus, Settings, Shield, Bell } from 'lucide-react';
import { TutorialModal } from '@/components/tutorial-modal';

export default function Home() {
  const { tasks, addTask, completeTask, holdTask, resumeTask, setTasks } = useTasks();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBackupManagerOpen, setIsBackupManagerOpen] = useState(false);
  const [isWeeklyCalendarOpen, setIsWeeklyCalendarOpen] = useState(false);
  const [isNotificationSettingsOpen, setIsNotificationSettingsOpen] = useState(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [hasSeenTutorial] = useLocalStorage('orderline-has-seen-tutorial', false);

  // Auto-show tutorial for first-time users
  useEffect(() => {
    if (!hasSeenTutorial && tasks.length === 0) {
      const timer = setTimeout(() => {
        setIsTutorialOpen(true);
      }, 2000); // Show after 2 seconds for first-time users with no tasks
      
      return () => clearTimeout(timer);
    }
  }, [hasSeenTutorial, tasks.length]);

  const activeTasks = getActiveTasks(tasks);
  const holdTasks = getHoldTasks(tasks);
  const backlogCount = getBacklogCount(tasks);
  const completedTodayTasks = getTasksCompletedToday(tasks);

  return (
    <div className="min-h-screen pb-20 bg-gray-50">
      {/* Header */}
      <header className="bg-surface shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsNotificationSettingsOpen(true)}
              className="text-gray-600 hover:text-gray-900"
              aria-label="Notification settings"
            >
              <Bell className="h-4 w-4" />
            </Button>
            <div className="flex-1 text-center">
              <h1 className="text-xl font-bold text-gray-900">Orderline Personal</h1>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsBackupManagerOpen(true)}
              className="text-gray-600 hover:text-gray-900"
              aria-label="Data protection settings"
            >
              <Shield className="h-4 w-4" />
            </Button>
          </div>
          <div className="bg-success/10 border border-success/20 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle className="text-success h-5 w-5" />
                <span className="text-success font-semibold">
                  Tasks Completed Today: {completedTodayTasks.length}
                </span>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsWeeklyCalendarOpen(true)}
                className="text-success hover:text-success/80 text-xs font-medium"
              >
                View all tasks
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Tutorial Button */}
        <div className="text-center">
          <button
            onClick={() => setIsTutorialOpen(true)}
            className="text-gray-500 text-sm hover:text-gray-700 hover:underline transition-colors"
          >
            How Orderline Works
          </button>
        </div>
        {/* Active Tasks Section */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <PlayCircle className="text-primary mr-2 h-5 w-5" />
              Active Tasks
            </h2>
            <span className="text-sm text-gray-500">{activeTasks.length}/3</span>
          </div>
          
          {activeTasks.length > 0 ? (
            activeTasks.map((task, index) => (
              <TaskCard
                key={task.id}
                task={task}
                isTopTask={index === 0}
                onComplete={completeTask}
                onHold={holdTask}
              />
            ))
          ) : (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center text-gray-500">
              <Plus className="mx-auto h-8 w-8 mb-2" />
              <p className="text-sm">No active tasks. Add one to get started!</p>
            </div>
          )}
        </section>

        {/* Hold Tasks Section */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <PauseCircle className="text-secondary mr-2 h-5 w-5" />
              Hold Tasks
            </h2>
            <span className="text-sm text-gray-500">{holdTasks.length}/3</span>
          </div>
          
          {holdTasks.length > 0 ? (
            holdTasks.map((task, index) => (
              <TaskCard
                key={task.id}
                task={task}
                isTopTask={index === 0}
                onComplete={completeTask}
                onResume={resumeTask}
              />
            ))
          ) : null}

          {/* Empty hold slots */}
          {Array.from({ length: 3 - holdTasks.length }, (_, index) => (
            <div 
              key={`empty-${index}`} 
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center text-gray-500"
            >
              <Plus className="mx-auto h-6 w-6 mb-2" />
              <p className="text-sm">Hold slot available</p>
            </div>
          ))}
        </section>

        {/* Backlog Section */}
        {backlogCount > 0 && (
          <section className="space-y-3">
            <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <List className="text-warning mr-2 h-5 w-5" />
                  <h3 className="font-medium text-gray-900">Backlog</h3>
                </div>
                <span className="text-warning font-semibold">+{backlogCount} tasks</span>
              </div>
              <p className="text-sm text-gray-600 mt-2">Tasks waiting to be activated</p>
            </div>
          </section>
        )}

        {/* Completed Today Section */}
        {completedTodayTasks.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <CheckCircle className="text-success mr-2 h-5 w-5" />
              Completed Today
            </h2>
            
            {completedTodayTasks.slice(0, 3).map(task => (
              <TaskCard
                key={task.id}
                task={task}
                isTopTask={false}
                onComplete={() => {}}
              />
            ))}

            {completedTodayTasks.length > 3 && (
              <div className="text-center">
                <span className="text-primary text-sm font-medium">
                  +{completedTodayTasks.length - 3} more completed tasks
                </span>
              </div>
            )}
          </section>
        )}
      </main>

      {/* Floating Action Button */}
      <FloatingActionButton onClick={() => setIsAddModalOpen(true)} />

      {/* Add Task Modal */}
      <AddTaskModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={addTask}
      />

      {/* Data Backup Manager */}
      <DataBackupManager
        isOpen={isBackupManagerOpen}
        onClose={() => setIsBackupManagerOpen(false)}
        onRestore={setTasks}
      />

      {/* Weekly Calendar */}
      <WeeklyCalendar
        isOpen={isWeeklyCalendarOpen}
        onClose={() => setIsWeeklyCalendarOpen(false)}
        tasks={tasks}
      />

      {/* Notification Settings */}
      <NotificationSettings
        isOpen={isNotificationSettingsOpen}
        onClose={() => setIsNotificationSettingsOpen(false)}
      />

      {/* Tutorial Modal */}
      <TutorialModal
        isOpen={isTutorialOpen}
        onClose={() => setIsTutorialOpen(false)}
      />
    </div>
  );
}
