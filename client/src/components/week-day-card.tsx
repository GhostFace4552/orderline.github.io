import { Task } from '@/types/task';
import { Badge } from '@/components/ui/badge';
import { format, isToday } from 'date-fns';
import { sortTasksForDisplay } from '@/lib/calendar-utils';
import { Calendar, Clock, Repeat } from 'lucide-react';

interface WeekDayCardProps {
  dayDate: Date;
  tasks: Task[];
}

export function WeekDayCard({ dayDate, tasks }: WeekDayCardProps) {
  const sortedTasks = sortTasksForDisplay(tasks);
  const isCurrentDay = isToday(dayDate);
  
  const getTaskStatusColor = (task: Task) => {
    switch (task.status) {
      case 'active':
        return 'bg-primary/10 text-primary border-primary/20';
      case 'hold':
        return 'bg-secondary/10 text-secondary border-secondary/20';
      case 'completed':
        return 'bg-success/10 text-success border-success/20';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const getRepeatIcon = (repeatType: string) => {
    if (repeatType === 'none') return null;
    return <Repeat className="h-3 w-3 ml-1" />;
  };

  return (
    <div 
      className={`bg-white rounded-lg border-2 p-3 min-h-[220px] max-h-[300px] flex flex-col ${
        isCurrentDay 
          ? 'border-primary/30 bg-primary/5 shadow-md' 
          : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      {/* Day Header */}
      <div className={`flex items-center justify-between mb-3 pb-2 border-b ${
        isCurrentDay ? 'border-primary/20' : 'border-gray-200'
      }`}>
        <div>
          <h3 className={`font-semibold text-sm ${
            isCurrentDay ? 'text-primary' : 'text-gray-900'
          }`}>
            {format(dayDate, 'EEEE')}
          </h3>
          <p className={`text-xs ${
            isCurrentDay ? 'text-primary/70' : 'text-gray-500'
          }`}>
            {format(dayDate, 'MMM d')}
          </p>
        </div>
        
        {isCurrentDay && (
          <Badge variant="secondary" className="bg-primary/20 text-primary text-xs">
            Today
          </Badge>
        )}
        
        {sortedTasks.length > 0 && (
          <div className="text-xs text-gray-500">
            {sortedTasks.filter(t => t.status === 'completed').length}/{sortedTasks.length}
          </div>
        )}
      </div>

      {/* Tasks List */}
      <div className="flex-1 overflow-y-auto space-y-2">
        {sortedTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <Calendar className="h-6 w-6 mb-1" />
            <p className="text-xs">No tasks</p>
          </div>
        ) : (
          sortedTasks.map((task, index) => (
            <div
              key={task.id}
              className={`p-2 rounded-md border text-xs transition-all ${
                getTaskStatusColor(task)
              } ${
                task.status === 'completed' 
                  ? 'opacity-60 line-through' 
                  : 'hover:shadow-sm'
              }`}
              aria-describedby={task.status === 'completed' ? 'completed' : undefined}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className={`font-medium truncate ${
                    task.status === 'completed' ? 'line-through' : ''
                  }`}>
                    {task.title}
                  </p>
                  
                  <div className="flex items-center mt-1 space-x-2 text-xs opacity-75">
                    {task.status === 'completed' && task.completedAt && (
                      <div className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        <span>{format(new Date(task.completedAt), 'h:mm a')}</span>
                      </div>
                    )}
                    
                    {task.repeatType !== 'none' && (
                      <div className="flex items-center">
                        <span>{task.repeatType}</span>
                        {getRepeatIcon(task.repeatType)}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Task Status Badge */}
                <Badge 
                  variant="outline" 
                  className={`ml-2 text-xs px-1 py-0 ${
                    task.status === 'active' ? 'border-primary/40' :
                    task.status === 'hold' ? 'border-secondary/40' :
                    task.status === 'completed' ? 'border-success/40' :
                    'border-gray-300'
                  }`}
                >
                  {task.status === 'active' ? 'Active' :
                   task.status === 'hold' ? 'Hold' :
                   task.status === 'completed' ? '✓' :
                   'Backlog'}
                </Badge>
              </div>
            </div>
          ))
        )}
      </div>
      
      {/* Scroll indicator for overflow */}
      {sortedTasks.length > 6 && (
        <div className="flex justify-center mt-1 pt-2 border-t border-gray-200">
          <div className="w-8 h-1 bg-gray-300 rounded-full"></div>
        </div>
      )}
    </div>
  );
}