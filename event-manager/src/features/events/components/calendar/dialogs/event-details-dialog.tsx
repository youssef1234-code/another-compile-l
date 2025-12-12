/**
 * Event Details Dialog
 * Displays full event information with actions
 */

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { CalendarEvent } from '../types';
import { EVENT_TYPE_LABELS, EVENT_TYPE_COLORS } from '@event-manager/shared';
import { 
  Calendar,
  MapPin, 
  Users, 
  DollarSign,
  Edit,
  Trash,
  FileDown,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { exportEventToICS } from '@/lib/ics-export';
import { toast } from 'react-hot-toast';
import MDEditor from '@uiw/react-md-editor';
import { useTheme } from '@/hooks/useTheme';

interface EventDetailsDialogProps {
  event: CalendarEvent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (event: CalendarEvent) => void;
  onDelete?: (eventId: string) => void;
  readOnly?: boolean;
}

export function EventDetailsDialog({
  event,
  open,
  onOpenChange,
  onEdit,
  onDelete,
  readOnly = false,
}: EventDetailsDialogProps) {
  if (!event) return null;

  const { resolvedTheme } = useTheme();
  const colorMode = resolvedTheme === 'dark' ? 'dark' : 'light';

  const colors = EVENT_TYPE_COLORS[event.type];
  const label = EVENT_TYPE_LABELS[event.type];
  const startDate = new Date(event.startDate || event.date);
  const endDate = event.endDate ? new Date(event.endDate) : null;
  const isFree = event.price === 0;

  const handleExportICS = () => {
    try {
      exportEventToICS(event);
      toast.success('Event exported to calendar');
    } catch (error) {
      toast.error('Failed to export event');
    }
  };

  const handleViewDetails = () => {
    window.open(`/events/${event.id}`, '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <div className={cn('w-3 h-3 rounded-full', colors.dot)} />
                <DialogTitle className="text-2xl">{event.name}</DialogTitle>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="secondary">{label}</Badge>
                {isFree && <Badge variant="outline">Free Event</Badge>}
                {event.status && (
                  <Badge variant={event.status === 'PUBLISHED' ? 'default' : 'secondary'}>
                    {event.status}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Key Information */}
          <div className="grid gap-4">
            {/* Date & Time */}
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-sm text-muted-foreground">Date & Time</p>
                <p className="text-sm">
                  {startDate.toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
                <p className="text-sm text-muted-foreground">
                  {startDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                  {endDate && ` - ${endDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`}
                </p>
              </div>
            </div>

            {/* Location */}
            {event.location && (
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-sm text-muted-foreground">Location</p>
                  <p className="text-sm">{event.location}</p>
                </div>
              </div>
            )}

            {/* Capacity */}
            {event.capacity && (
              <div className="flex items-start gap-3">
                <Users className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-sm text-muted-foreground">Capacity</p>
                  <p className="text-sm">{event.capacity} participants</p>
                </div>
              </div>
            )}

            {/* Price */}
            <div className="flex items-start gap-3">
              <DollarSign className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-sm text-muted-foreground">Price</p>
                <p className="text-sm">
                  {isFree ? 'Free Event' : `${event.price} EGP`}
                </p>
              </div>
            </div>
          </div>

          {/* Description */}
          {event.description && (
            <>
              <Separator />
              <div>
                <h4 className="font-semibold mb-2">Description</h4>
                <div data-color-mode={colorMode} className="wmde-markdown-var" style={{ overflow: 'visible' }}>
                  <MDEditor.Markdown 
                    source={event.description} 
                    style={{ 
                      padding: 0,
                      backgroundColor: 'transparent',
                      overflow: 'visible',
                    }}
                  />
                </div>
              </div>
            </>
          )}

          {/* Registration Deadline */}
          {event.registrationDeadline && (
            <>
              <Separator />
              <div>
                <h4 className="font-semibold mb-2">Registration Deadline</h4>
                <p className="text-sm text-muted-foreground">
                  {new Date(event.registrationDeadline).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </>
          )}

          {/* Actions */}
          <Separator />
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={handleExportICS}>
              <FileDown className="w-4 h-4 mr-2" />
              Add to Calendar
            </Button>
            <Button variant="outline" size="sm" onClick={handleViewDetails}>
              <ExternalLink className="w-4 h-4 mr-2" />
              View Full Details
            </Button>
            {!readOnly && onEdit && (
              <Button variant="outline" size="sm" onClick={() => onEdit(event)}>
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
            )}
            {!readOnly && onDelete && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  if (confirm('Are you sure you want to delete this event?')) {
                    onDelete(event.id);
                  }
                }}
              >
                <Trash className="w-4 h-4 mr-2" />
                Delete
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
