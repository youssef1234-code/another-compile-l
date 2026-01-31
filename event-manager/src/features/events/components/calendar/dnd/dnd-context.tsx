/**
 * Drag and Drop Context for Event Calendar
 */

import React, { createContext, useContext, useState } from 'react';
import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
} from '@dnd-kit/core';
import type { CalendarEvent } from '../types';
import { EVENT_TYPE_COLORS, EVENT_TYPE_LABELS } from '../../../../../shared';
import { cn } from '@/lib/utils';

interface DragDropContextType {
  activeEvent: CalendarEvent | null;
}

const DragDropContext = createContext<DragDropContextType | undefined>(undefined);

export const useDragDrop = () => {
  const context = useContext(DragDropContext);
  if (!context) {
    throw new Error('useDragDrop must be used within DragDropProvider');
  }
  return context;
};

interface DragDropProviderProps {
  children: React.ReactNode;
  onEventDrop?: (eventId: string, targetDate: Date) => void;
}

export function DragDropProvider({ children, onEventDrop }: DragDropProviderProps) {
  const [activeEvent, setActiveEvent] = useState<CalendarEvent | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const eventData = event.active.data.current?.event as CalendarEvent;
    setActiveEvent(eventData);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id && onEventDrop) {
      const targetDate = over.data.current?.date as Date;
      if (targetDate) {
        onEventDrop(active.id as string, targetDate);
      }
    }

    setActiveEvent(null);
  };

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <DragDropContext.Provider value={{ activeEvent }}>
        {children}
        <DragOverlay dropAnimation={null}>
          {activeEvent ? <DraggedEventBadge event={activeEvent} /> : null}
        </DragOverlay>
      </DragDropContext.Provider>
    </DndContext>
  );
}

// Component for the dragged event badge - preserves original colors
function DraggedEventBadge({ event }: { event: CalendarEvent }) {
  const colors = EVENT_TYPE_COLORS[event.type];
  const startTime = event.startDate ? new Date(event.startDate).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }) : event.date ? new Date(event.date).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }) : '';

  return (
    <div
      className={cn(
        'px-2 py-1 rounded text-xs font-medium border cursor-grabbing shadow-xl',
        colors.bg,
        colors.text,
        colors.border
      )}
      title={`${event.name} - ${EVENT_TYPE_LABELS[event.type]}`}
    >
      {startTime && <span className="font-semibold">{startTime}</span>} {event.name}
    </div>
  );
}
