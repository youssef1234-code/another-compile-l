/**
 * Draggable Event Component using @dnd-kit
 * Production-ready draggable implementation
 */

import { type ReactNode } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import type { CalendarEvent } from '../types';

interface DraggableEventProps {
  event: CalendarEvent;
  children: ReactNode;
  disabled?: boolean;
}

export function DraggableEvent({ event, children, disabled = false }: DraggableEventProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: event.id,
    data: {
      event: {
        ...event,
        // Ensure dates are strings for serialization
        date: event.date instanceof Date ? event.date.toISOString() : event.date,
        startDate: event.startDate instanceof Date ? event.startDate.toISOString() : event.startDate,
        endDate: event.endDate instanceof Date ? event.endDate.toISOString() : event.endDate,
      },
      type: 'calendar-event',
    },
    disabled,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.3 : 1,
    cursor: disabled ? 'default' : isDragging ? 'grabbing' : 'grab',
    transition: isDragging ? 'none' : 'opacity 200ms ease',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`touch-none ${isDragging ? 'scale-95 ring-2 ring-primary/30' : ''}`}
    >
      {children}
    </div>
  );
}
