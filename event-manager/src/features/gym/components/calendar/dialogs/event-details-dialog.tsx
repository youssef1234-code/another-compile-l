/**
 * Event Details Dialog
 * Shows detailed information about a gym session
 */


import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { GYM_SESSION_TYPE_LABELS } from '@event-manager/shared';
import { Calendar, Clock, MapPin, Users, User, Trash2, Edit, CheckCircle, Loader2 } from 'lucide-react';
import type { CalendarEvent } from '../types';
import { DeleteConfirmationDialog } from './delete-confirmation-dialog';
import { trpc } from '@/lib/trpc';
import { toast } from 'react-hot-toast';

interface EventDetailsDialogProps {
  event: CalendarEvent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (event: CalendarEvent) => void;
  onDelete?: (eventId: string) => void;
  onRegister?: () => void;
  readOnly?: boolean;
}

export function EventDetailsDialog({ 
  event, 
  open, 
  onOpenChange, 
  onEdit, 
  onDelete,
  onRegister,
  readOnly = false 
}: EventDetailsDialogProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const utils = trpc.useUtils();

  // Check if user is registered for this session
  const { data: registrationData, isLoading: isCheckingRegistration } = trpc.events.isRegistered.useQuery(
    { eventId: event?.id || '' },
    { enabled: !!event?.id && open }
  );
  
  const isRegistered = registrationData?.isRegistered;
  const registrationId = registrationData?.registrationId;

  // Registration mutation
  const registerMutation = trpc.events.registerForEvent.useMutation({
    onSuccess: () => {
      toast.success('Successfully registered for this session!');
      utils.events.isRegistered.invalidate({ eventId: event?.id });
      utils.events.getAllEvents.invalidate();
      utils.events.getMyRegistrations.invalidate();
      onRegister?.();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to register');
    },
  });

  // Cancel registration mutation
  const cancelRegistrationMutation = trpc.events.cancelRegistration.useMutation({
    onSuccess: () => {
      toast.success('Registration cancelled successfully');
      utils.events.isRegistered.invalidate({ eventId: event?.id });
      utils.events.getAllEvents.invalidate();
      utils.events.getMyRegistrations.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to cancel registration');
    },
  });

  if (!event) return null;

  const sessionType = event.sessionType || 'OTHER';
  const duration = event.duration || 60;

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    if (onDelete) {
      onDelete(event.id);
      setShowDeleteConfirm(false);
      onOpenChange(false);
    }
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(event);
      onOpenChange(false);
    }
  };

  const startDate = event.startDate ? new Date(event.startDate) : null;
  const endDate = event.endDate ? new Date(event.endDate) : null;

  const formatDateTime = (date: Date | null) => {
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

  // Get color based on session type
  const getColorClass = (type: string) => {
    const colors: Record<string, string> = {
      YOGA: 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800',
      PILATES: 'bg-pink-100 text-pink-800 border-pink-300 dark:bg-pink-900/30 dark:text-pink-300 dark:border-pink-800',
      AEROBICS: 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800',
      ZUMBA: 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800',
      CROSS_CIRCUIT: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',
      KICK_BOXING: 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800',
      CROSSFIT: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800',
      CARDIO: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
      STRENGTH: 'bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-900/30 dark:text-slate-300 dark:border-slate-800',
      DANCE: 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-300 dark:bg-fuchsia-900/30 dark:text-fuchsia-300 dark:border-fuchsia-800',
      MARTIAL_ARTS: 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-900/30 dark:text-gray-300 dark:border-gray-800',
      OTHER: 'bg-neutral-100 text-neutral-800 border-neutral-300 dark:bg-neutral-900/30 dark:text-neutral-300 dark:border-neutral-800',
    };
    return colors[type] || colors.OTHER;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">{event.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Session Type Badge */}
          <div>
            <Badge className={getColorClass(sessionType)}>
              {GYM_SESSION_TYPE_LABELS[sessionType as keyof typeof GYM_SESSION_TYPE_LABELS] || sessionType}
            </Badge>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Date</p>
                <p className="text-sm text-muted-foreground">{formatDateTime(startDate)}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Time</p>
                <p className="text-sm text-muted-foreground">
                  {formatTime(startDate)} - {formatTime(endDate)} ({duration} min)
                </p>
              </div>
            </div>
          </div>

          {/* Capacity and Location */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {event.capacity && (
              <div className="flex items-start gap-3">
                <Users className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Capacity</p>
                  <p className="text-sm text-muted-foreground">
                    {event.registeredCount || 0} / {event.capacity} participants
                  </p>
                </div>
              </div>
            )}

            {event.location && (
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Location</p>
                  <p className="text-sm text-muted-foreground">{event.locationDetails || event.location}</p>
                </div>
              </div>
            )}
          </div>

          {/* Instructor */}
          {event.professorName && (
            <div className="flex items-start gap-3">
              <User className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Instructor</p>
                <p className="text-sm text-muted-foreground">{event.professorName}</p>
              </div>
            </div>
          )}

          {/* Description */}
          {event.description && (
            <div>
              <p className="text-sm font-medium mb-2">Description</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{event.description}</p>
            </div>
          )}

          {/* Status */}
          {event.status && (
            <div className="flex items-center gap-2 pt-4 border-t">
              <p className="text-sm font-medium">Status:</p>
              <Badge variant={event.status === 'PUBLISHED' ? 'default' : 'secondary'}>
                {event.status}
              </Badge>
              {isRegistered && (
                <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Registered
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <DialogFooter className="gap-2 flex-wrap">
          {/* Registration Button for regular users */}
          {!readOnly && event.status === 'PUBLISHED' && (
            <>
              {isCheckingRegistration ? (
                <Button variant="outline" disabled>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Checking...
                </Button>
              ) : isRegistered ? (
                <Button
                  variant="outline"
                  onClick={() => registrationId && cancelRegistrationMutation.mutate({ registrationId })}
                  disabled={cancelRegistrationMutation.isPending || !registrationId}
                  className="gap-2"
                >
                  {cancelRegistrationMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Cancel Registration
                </Button>
              ) : (
                <Button
                  variant="default"
                  onClick={() => registerMutation.mutate({ eventId: event.id })}
                  disabled={registerMutation.isPending || Boolean(event.capacity && (event.registeredCount || 0) >= event.capacity)}
                  className="gap-2 bg-green-600 hover:bg-green-700"
                >
                  {registerMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  <CheckCircle className="h-4 w-4" />
                  {event.capacity && (event.registeredCount || 0) >= event.capacity ? 'Session Full' : 'Register'}
                </Button>
              )}
            </>
          )}
          
          {/* Admin/Events Office Actions */}
          {!readOnly && (onEdit || onDelete) && (
            <>
              {onDelete && (
                <Button
                  variant="destructive"
                  onClick={handleDeleteClick}
                  className="gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Session
                </Button>
              )}
              {onEdit && (
                <Button
                  variant="default"
                  onClick={handleEdit}
                  className="gap-2"
                >
                  <Edit className="h-4 w-4" />
                  Edit Session
                </Button>
              )}
            </>
          )}
        </DialogFooter>
      </DialogContent>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        event={event}
        onConfirm={handleConfirmDelete}
      />
    </Dialog>
  );
}
