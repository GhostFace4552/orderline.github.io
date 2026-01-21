export type TaskStatus = 'active' | 'hold' | 'completed' | 'backlog';
export type RepeatType = 'none' | 'daily' | 'weekly' | 'monthly';

export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  repeatType: RepeatType;
  scheduledDate?: string;
  createdAt: string;
  completedAt?: string;
  heldAt?: string;
  order: number;
}

export interface TaskFormData {
  title: string;
  repeatType: RepeatType;
  scheduleDate?: string;
}
