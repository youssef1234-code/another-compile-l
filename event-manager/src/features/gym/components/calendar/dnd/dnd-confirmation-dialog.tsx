/**
 * DnD Confirmation Dialog
 * Confirms drag and drop session reschedule
 */

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { CalendarEvent } from '../types';

interface DnDConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: CalendarEvent | null;
  newDate: Date | null;
  onConfirm: () => void;
}

export function DnDConfirmationDialog({
  open,
  onOpenChange,
  event,
  newDate,
  onConfirm,
}: DnDConfirmationDialogProps) {
  if (!event || !newDate) return null;

  const oldDate = event.startDate ? new Date(event.startDate) : null;

  const formatDate = (date: Date | null) => {
    if (!date) return 'N/A';
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (date: Date | null) => {
    if (!date) return 'N/A';
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Reschedule Session?</AlertDialogTitle>
          <AlertDialogDescription className="space-y-4">
            <p>You are about to reschedule the following session:</p>
            
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <p className="font-semibold">{event.name}</p>
              
              <div className="text-sm space-y-1">
                <div>
                  <span className="text-muted-foreground">From: </span>
                  <span className="font-medium">{formatDate(oldDate)}</span>
                  <span className="text-muted-foreground"> at </span>
                  <span className="font-medium">{formatTime(oldDate)}</span>
                </div>
                
                <div>
                  <span className="text-muted-foreground">To: </span>
                  <span className="font-medium text-primary">{formatDate(newDate)}</span>
                  <span className="text-muted-foreground"> at </span>
                  <span className="font-medium text-primary">{formatTime(oldDate)}</span>
                </div>
              </div>
            </div>

            <p className="text-sm">
              This will update the session date. Registered participants will be notified of the change.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Confirm Reschedule</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
