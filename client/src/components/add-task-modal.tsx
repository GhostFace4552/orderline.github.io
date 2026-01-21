import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { TaskFormData, RepeatType } from '@/types/task';
import { Plus, X } from 'lucide-react';
import { format } from 'date-fns';

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TaskFormData) => void;
}

export function AddTaskModal({ isOpen, onClose, onSubmit }: AddTaskModalProps) {
  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    repeatType: 'none',
    scheduleDate: undefined
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      return;
    }

    onSubmit(formData);
    
    // Reset form and close modal
    setFormData({
      title: '',
      repeatType: 'none',
      scheduleDate: undefined
    });
    onClose();
  };

  const handleClose = () => {
    // Reset form when closing
    setFormData({
      title: '',
      repeatType: 'none',
      scheduleDate: undefined
    });
    onClose();
  };

  const today = format(new Date(), 'yyyy-MM-dd');

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-full max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-900 flex items-center justify-between">
            Add New Task
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-5 w-5" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Task Title Input */}
          <div>
            <Label htmlFor="taskTitle" className="block text-sm font-medium text-gray-700 mb-2">
              Task Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="taskTitle"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter task title..."
              className="w-full px-4 py-3 text-base"
              required
            />
          </div>

          {/* Repeating Options */}
          <div>
            <Label className="block text-sm font-medium text-gray-700 mb-3">Repeat Task</Label>
            <RadioGroup
              value={formData.repeatType}
              onValueChange={(value: RepeatType) => 
                setFormData(prev => ({ ...prev, repeatType: value }))
              }
              className="space-y-2"
            >
              <div className="flex items-center space-x-3">
                <RadioGroupItem value="none" id="none" />
                <Label htmlFor="none" className="text-gray-700">No repeat</Label>
              </div>
              <div className="flex items-center space-x-3">
                <RadioGroupItem value="daily" id="daily" />
                <Label htmlFor="daily" className="text-gray-700">Daily</Label>
              </div>
              <div className="flex items-center space-x-3">
                <RadioGroupItem value="weekly" id="weekly" />
                <Label htmlFor="weekly" className="text-gray-700">Weekly</Label>
              </div>
              <div className="flex items-center space-x-3">
                <RadioGroupItem value="monthly" id="monthly" />
                <Label htmlFor="monthly" className="text-gray-700">Monthly</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Schedule Date */}
          <div>
            <Label htmlFor="scheduleDate" className="block text-sm font-medium text-gray-700 mb-2">
              Schedule for Date (Optional)
            </Label>
            <Input
              id="scheduleDate"
              type="date"
              value={formData.scheduleDate || ''}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                scheduleDate: e.target.value || undefined 
              }))}
              min={today}
              className="w-full px-4 py-3 text-base"
            />
          </div>

          {/* Form Actions */}
          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1 py-3"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-primary hover:bg-primary-dark text-white py-3"
              disabled={!formData.title.trim()}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Task
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
