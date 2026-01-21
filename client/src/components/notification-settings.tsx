import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useNotifications } from '@/hooks/use-notifications';
import { formatTime, isValidTimeFormat } from '@/lib/notification-utils';
import { Bell, BellOff, Clock, Moon, TestTube, CheckCircle, XCircle, AlertCircle, Smartphone } from 'lucide-react';

interface NotificationSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationSettings({ isOpen, onClose }: NotificationSettingsProps) {
  const { 
    preferences, 
    status, 
    loading, 
    enableNotifications, 
    disableNotifications, 
    updateFrequency,
    updateBedtime,
    testNotification
  } = useNotifications();

  const [bedtimeStart, setBedtimeStart] = useState(preferences?.bedtimeStart || '22:00');
  const [bedtimeEnd, setBedtimeEnd] = useState(preferences?.bedtimeEnd || '07:00');

  const handleToggleNotifications = async () => {
    if (preferences?.enabled) {
      await disableNotifications();
    } else {
      await enableNotifications();
    }
  };

  const handleFrequencyChange = (value: string) => {
    const minutes = parseInt(value, 10);
    updateFrequency(minutes);
  };

  const handleBedtimeChange = () => {
    if (isValidTimeFormat(bedtimeStart) && isValidTimeFormat(bedtimeEnd)) {
      updateBedtime(bedtimeStart, bedtimeEnd);
    }
  };

  const getPermissionStatusIcon = () => {
    switch (status.permission) {
      case 'granted':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'denied':
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return <AlertCircle className="h-4 w-4 text-warning" />;
    }
  };

  const getPermissionStatusText = () => {
    switch (status.permission) {
      case 'granted':
        return 'Granted';
      case 'denied':
        return 'Denied';
      default:
        return 'Not requested';
    }
  };

  const isPWAInstalled = () => {
    return window.matchMedia('(display-mode: standalone)').matches ||
           window.navigator.standalone === true;
  };

  if (!preferences) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Bell className="mr-2 h-5 w-5 text-primary" />
            Notification Settings
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Enable/Disable Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-sm font-medium">Enable Notifications</Label>
              <p className="text-xs text-muted-foreground">
                Get reminders when you have outstanding tasks
              </p>
            </div>
            <Switch
              checked={preferences.enabled}
              onCheckedChange={handleToggleNotifications}
              disabled={loading || status.permission === 'denied'}
              aria-label="Enable notifications"
            />
          </div>

          {/* Permission denied warning */}
          {status.permission === 'denied' && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
              <div className="flex items-center space-x-2 text-destructive">
                <BellOff className="h-4 w-4" />
                <span className="text-sm font-medium">Notifications Blocked</span>
              </div>
              <p className="text-xs text-destructive/80 mt-1">
                Please enable notifications in your browser settings for this site.
              </p>
            </div>
          )}

          {/* PWA Install hint for iOS */}
          {!isPWAInstalled() && navigator.userAgent.includes('iPhone') && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center space-x-2 text-blue-700">
                <Smartphone className="h-4 w-4" />
                <span className="text-sm font-medium">Install Required</span>
              </div>
              <p className="text-xs text-blue-600 mt-1">
                Add this app to your home screen for push notifications to work.
              </p>
            </div>
          )}

          {/* Frequency Selector */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center">
              <Clock className="mr-2 h-4 w-4" />
              Reminder Frequency
            </Label>
            <Select
              value={preferences.frequencyMinutes.toString()}
              onValueChange={handleFrequencyChange}
              disabled={loading || !preferences.enabled}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">Every 30 minutes</SelectItem>
                <SelectItem value="60">Every hour</SelectItem>
                <SelectItem value="120">Every 2 hours</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Bedtime Settings */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center">
              <Moon className="mr-2 h-4 w-4" />
              Bedtime (Do Not Disturb)
            </Label>
            <div className="flex items-center space-x-2">
              <Input
                type="time"
                value={bedtimeStart}
                onChange={(e) => setBedtimeStart(e.target.value)}
                disabled={loading || !preferences.enabled}
                className="flex-1"
                aria-label="Bedtime start"
              />
              <span className="text-sm text-muted-foreground">to</span>
              <Input
                type="time"
                value={bedtimeEnd}
                onChange={(e) => setBedtimeEnd(e.target.value)}
                disabled={loading || !preferences.enabled}
                className="flex-1"
                aria-label="Bedtime end"
              />
            </div>
            {(bedtimeStart !== preferences.bedtimeStart || bedtimeEnd !== preferences.bedtimeEnd) && (
              <Button
                size="sm"
                onClick={handleBedtimeChange}
                disabled={loading || !isValidTimeFormat(bedtimeStart) || !isValidTimeFormat(bedtimeEnd)}
              >
                Update Bedtime
              </Button>
            )}
            <p className="text-xs text-muted-foreground">
              No reminders during: {formatTime(bedtimeStart)} - {formatTime(bedtimeEnd)}
              {bedtimeStart > bedtimeEnd && ' (crosses midnight)'}
            </p>
          </div>

          {/* Test Notification */}
          <div className="space-y-2">
            <Button
              onClick={testNotification}
              disabled={loading || !preferences.enabled || status.permission !== 'granted'}
              className="w-full"
              variant="outline"
            >
              <TestTube className="mr-2 h-4 w-4" />
              Send Test Notification
            </Button>
          </div>

          {/* Status Information */}
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium mb-2">Status</h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Permission:</span>
                <div className="flex items-center space-x-1">
                  {getPermissionStatusIcon()}
                  <span>{getPermissionStatusText()}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Push Subscription:</span>
                <Badge variant={status.subscription ? 'default' : 'secondary'}>
                  {status.subscription ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              {status.lastSentTime && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Last Reminder:</span>
                  <span>{new Date(status.lastSentTime).toLocaleString()}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Device ID:</span>
                <code className="text-xs bg-muted px-1 rounded">
                  {status.deviceId.slice(-8)}
                </code>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}