import { Task } from '@/types/task';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, Check, Clock, Calendar } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

interface TaskCardProps {
  task: Task;
  isTopTask: boolean;
  onComplete: (taskId: string) => void;
  onHold?: (taskId: string) => void;
  onResume?: (taskId: string) => void;
}

export function TaskCard({ task, isTopTask, onComplete, onHold, onResume }: TaskCardProps) {
  const isActive = task.status === 'active';
  const isHold = task.status === 'hold';
  
  const formatTaskDate = () => {
    if (task.completedAt) {
      return format(new Date(task.completedAt), 'h:mm a');
    }
    if (task.heldAt) {
      return `On hold for ${formatDistanceToNow(new Date(task.heldAt))}`;
    }
    if (task.scheduledDate) {
      const scheduledDate = new Date(task.scheduledDate);
      const today = new Date();
      if (scheduledDate.toDateString() === today.toDateString()) {
        return 'Due today';
      }
      const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
      if (scheduledDate.toDateString() === tomorrow.toDateString()) {
        return 'Due tomorrow';
      }
      return `Due ${format(scheduledDate, 'MMM d')}`;
    }
    return `Added ${formatDistanceToNow(new Date(task.createdAt), { addSuffix: true })}`;
  };

  const getRepeatBadgeColor = () => {
    switch (task.repeatType) {
      case 'daily': return 'bg-blue-100 text-blue-800';
      case 'weekly': return 'bg-blue-100 text-blue-800';
      case 'monthly': return 'bg-purple-100 text-purple-800';
      default: return '';
    }
  };

  if (task.status === 'completed') {
    return (
      <div className="completed-task bg-success/5 border border-success/20 rounded-lg p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Check className="text-success mr-3 h-4 w-4" />
            <span className="text-gray-700 line-through">{task.title}</span>
          </div>
          <span className="text-xs text-gray-500">{formatTaskDate()}</span>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`task-card bg-surface border-l-4 rounded-lg shadow-sm p-4 space-y-3 ${
        isActive 
          ? 'border-l-primary' 
          : 'border-l-secondary'
      } ${!isTopTask ? 'opacity-60' : ''}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-medium text-gray-900">{task.title}</h3>
          <div className="flex items-center mt-2 text-sm text-gray-500">
            {task.heldAt ? (
              <Pause className="mr-1 h-3 w-3" />
            ) : task.scheduledDate ? (
              <Calendar className="mr-1 h-3 w-3" />
            ) : (
              <Clock className="mr-1 h-3 w-3" />
            )}
            <span>{formatTaskDate()}</span>
            {task.repeatType !== 'none' && (
              <Badge 
                variant="secondary" 
                className={`ml-2 text-xs ${getRepeatBadgeColor()}`}
              >
                {task.repeatType.charAt(0).toUpperCase() + task.repeatType.slice(1)}
              </Badge>
            )}
          </div>
        </div>
        <div className="flex flex-col space-y-2 ml-3">
          <Button
            size="sm"
            variant={isTopTask ? "default" : "secondary"}
            disabled={!isTopTask}
            onClick={() => onComplete(task.id)}
            className={isTopTask 
              ? "bg-success hover:bg-success/90 text-white" 
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }
          >
            <Check className="mr-1 h-3 w-3" />
            Complete
          </Button>
          {isActive && onHold && (
            <Button
              size="sm"
              variant={isTopTask ? "secondary" : "outline"}
              disabled={!isTopTask}
              onClick={() => onHold(task.id)}
              className={isTopTask 
                ? "bg-secondary hover:bg-secondary-dark text-white" 
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }
            >
              <Pause className="mr-1 h-3 w-3" />
              Hold
            </Button>
          )}
          
        </div>
      </div>
    </div>
  );
}
