import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getAvailableBackups, restoreFromBackup, CURRENT_DATA_VERSION } from '@/lib/data-migration';
import { Task } from '@/types/task';
import { Download, Upload, Shield, Clock, FileText } from 'lucide-react';
import { format } from 'date-fns';

interface DataBackupManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onRestore: (tasks: Task[]) => void;
}

export function DataBackupManager({ isOpen, onClose, onRestore }: DataBackupManagerProps) {
  const [backups] = useState(() => getAvailableBackups());
  const [isRestoring, setIsRestoring] = useState(false);

  const handleRestore = async (timestamp: string) => {
    setIsRestoring(true);
    try {
      const restoredTasks = restoreFromBackup(timestamp);
      onRestore(restoredTasks);
      onClose();
    } catch (error) {
      console.error('Failed to restore backup:', error);
    } finally {
      setIsRestoring(false);
    }
  };

  const exportData = () => {
    try {
      const data = localStorage.getItem('orderline-tasks');
      if (!data) return;
      
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `orderline-backup-${format(new Date(), 'yyyy-MM-dd-HH-mm')}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export data:', error);
    }
  };

  const importData = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          // The migration system will handle any version differences
          const tasks = Array.isArray(data) ? data : (data.tasks || []);
          onRestore(tasks);
          onClose();
        } catch (error) {
          console.error('Failed to import data:', error);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-lg mx-auto max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-900 flex items-center">
            <Shield className="mr-2 h-5 w-5 text-primary" />
            Data Backup & Recovery
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Current Version Info */}
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">Current Version</h3>
                <p className="text-sm text-gray-600">Your data is protected with version {CURRENT_DATA_VERSION}</p>
              </div>
              <Badge variant="secondary" className="bg-primary/20 text-primary">
                v{CURRENT_DATA_VERSION}
              </Badge>
            </div>
          </div>

          {/* Export/Import Section */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900">Manual Backup</h3>
            <div className="flex space-x-3">
              <Button
                onClick={exportData}
                variant="outline"
                className="flex-1"
              >
                <Download className="mr-2 h-4 w-4" />
                Export Data
              </Button>
              <Button
                onClick={importData}
                variant="outline"
                className="flex-1"
              >
                <Upload className="mr-2 h-4 w-4" />
                Import Data
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              Export your data as a backup file or import data from another device
            </p>
          </div>

          {/* Automatic Backups Section */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900">Automatic Backups</h3>
            {backups.length > 0 ? (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {backups.map((backup) => (
                  <div
                    key={backup.timestamp}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center space-x-3">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="font-medium text-sm">
                          {format(backup.date, 'MMM d, yyyy h:mm a')}
                        </p>
                        <p className="text-xs text-gray-500">
                          {backup.taskCount} tasks
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRestore(backup.timestamp)}
                      disabled={isRestoring}
                    >
                      Restore
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                <FileText className="mx-auto h-8 w-8 mb-2" />
                <p className="text-sm">No automatic backups found</p>
                <p className="text-xs">Backups are created automatically when you make changes</p>
              </div>
            )}
          </div>

          {/* Data Protection Info */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-medium text-green-900 mb-2">Data Protection Active</h4>
            <ul className="text-sm text-green-800 space-y-1">
              <li>• Automatic backups before every change</li>
              <li>• Version migration protects against updates</li>
              <li>• Local storage keeps your data private</li>
              <li>• Export/import for device transfers</li>
            </ul>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}