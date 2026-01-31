/**
 * Drag and Drop Confirmation Dialog
 * Allows rescheduling with date and time editing
 */

import { useState, useEffect } from 'react';
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
import { TimePicker } from '@/components/ui/time-picker';
import { Label } from '@/components/ui/label';
import type { CalendarEvent } from '../types';
import { EVENT_TYPE_LABELS } from '../../../../../shared';

interface DnDConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: CalendarEvent | null;
  newDate: Date;
  onConfirm: (adjustedDate: Date) => void;
}

export function DnDConfirmationDialog({
  open,
  onOpenChange,
  event,
  newDate,
  onConfirm,
}: DnDConfirmationDialogProps) {
  const [time, setTime] = useState('');

  useEffect(() => {
    if (event && open) {
      const eventDate = event.startDate ? new Date(event.startDate) : event.date ? new Date(event.date) : new Date();
      const hours = eventDate.getHours().toString().padStart(2, '0');
      const minutes = eventDate.getMinutes().toString().padStart(2, '0');
      setTime(`${hours}:${minutes}`);
    }
  }, [event, open]);

  if (!event) return null;

  const oldDate = event.startDate ? new Date(event.startDate) : event.date ? new Date(event.date) : null;

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

  const handleConfirm = () => {
    const [hours, minutes] = time.split(':').map(Number);
    const adjustedDate = new Date(newDate);
    adjustedDate.setHours(hours, minutes, 0, 0);
    onConfirm(adjustedDate);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Reschedule Event?</AlertDialogTitle>
          <AlertDialogDescription className="space-y-4">
            <p>You are about to reschedule the following event:</p>
            
            <div className="bg-muted p-4 rounded-lg space-y-3">
              <p className="font-semibold">{event.name}</p>
              <p className="text-xs text-muted-foreground">{EVENT_TYPE_LABELS[event.type]}</p>
              
              <div className="text-sm space-y-2">
                <div>
                  <span className="text-muted-foreground">From: </span>
                  <span className="font-medium">{formatDate(oldDate)}</span>
                  <span className="text-muted-foreground"> at </span>
                  <span className="font-medium">{formatTime(oldDate)}</span>
                </div>
                
                <div>
                  <span className="text-muted-foreground">To: </span>
                  <span className="font-medium text-primary">{formatDate(newDate)}</span>
                </div>

                <div className="pt-2">
                  <Label htmlFor="time" className="text-xs">Time:</Label>
                  <TimePicker
                    value={time}
                    onChange={setTime}
                    placeholder="Select time"
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            <p className="text-sm">
              This will update the event date and time. Registered participants will be notified.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm}>Confirm Reschedule</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
