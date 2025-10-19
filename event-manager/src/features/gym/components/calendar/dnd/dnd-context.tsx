/**
 * Drag and Drop Context using @dnd-kit
 * Production-ready drag and drop implementation
 */

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import type { CalendarEvent } from '../types';
import { GYM_SESSION_TYPE_LABELS } from '@event-manager/shared';
import { cn } from '@/lib/utils';

interface DragDropContextType {
  draggedEvent: CalendarEvent | null;
  isDragging: boolean;
  activeId: string | null;
}

const DragDropContext = createContext<DragDropContextType | null>(null);

interface DragDropProviderProps {
  children: ReactNode;
  onEventDrop?: (eventId: string, targetDate: Date) => void;
}

function DragDropProvider({ children, onEventDrop }: DragDropProviderProps) {
  const [draggedEvent, setDraggedEvent] = useState<CalendarEvent | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Configure sensors with activation constraints to prevent accidental drags
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement before drag starts
      },
    })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    console.log('🎯 Drag started:', active.id);
    setActiveId(active.id as string);
    
    // Get event data from the active draggable
    const eventData = active.data.current?.event as CalendarEvent;
    if (eventData) {
      setDraggedEvent(eventData);
    }
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    console.log('🏁 Drag ended:', { activeId: active.id, overId: over?.id });

    // Only trigger drop if there's a valid drop target
    if (over) {
      // Get the event being dragged from active data
      const eventData = active.data.current?.event as CalendarEvent;
      
      console.log('🔍 Event data:', {
        hasEventData: !!eventData,
        date: eventData?.date,
        startDate: eventData?.startDate,
        endDate: eventData?.endDate,
        name: eventData?.name
      });
      
      // Extract target date from droppable ID (format: "droppable-YYYY-MM-DD")
      const dateStr = String(over.id).replace('droppable-', '');
      const targetDate = new Date(dateStr);
      
      // Get the original event's date - try date, startDate, or endDate
      const eventDateValue = eventData?.date || eventData?.startDate || eventData?.endDate;
      const originalDate = eventDateValue ? new Date(eventDateValue) : null;
      
      // Compare dates (normalize to start of day for comparison)
      const targetDateStr = targetDate.toISOString().split('T')[0];
      const originalDateStr = originalDate?.toISOString().split('T')[0];
      
      console.log('📅 Date comparison:', { 
        originalDate: originalDateStr, 
        targetDate: targetDateStr,
        isDifferent: originalDateStr !== targetDateStr,
        eventData: eventData?.name 
      });

      // Only call onEventDrop if:
      // 1. We have a valid target date
      // 2. The target date is DIFFERENT from the original date
      // 3. We have the callback function
      if (!isNaN(targetDate.getTime()) && originalDateStr && originalDateStr !== targetDateStr && onEventDrop) {
        console.log('✅ Dropping event on NEW date:', targetDate);
        onEventDrop(String(active.id), targetDate);
      } else if (originalDateStr === targetDateStr) {
        console.log('🚫 Drop cancelled - same date, no change needed');
      } else {
        console.log('🚫 Drop cancelled - invalid target date or missing original date');
      }
    } else {
      console.log('🚫 Drop cancelled - no valid drop zone');
    }

    // Always reset drag state
    setActiveId(null);
    setDraggedEvent(null);
  }, [onEventDrop]);

  const handleDragCancel = useCallback(() => {
    console.log('❌ Drag cancelled');
    setActiveId(null);
    setDraggedEvent(null);
  }, []);

  const isDragging = activeId !== null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <DragDropContext.Provider
        value={{
          draggedEvent,
          isDragging,
          activeId,
        }}
      >
        {children}
        
        {/* Drag Overlay - exact replica of the event badge */}
        <DragOverlay dropAnimation={null}>
          {draggedEvent && <DraggedEventBadge event={draggedEvent} />}
        </DragOverlay>
      </DragDropContext.Provider>
    </DndContext>
  );
}

// Helper to get color classes based on session type
function getColorClass(type: string) {
  const colors: Record<string, string> = {
    YOGA: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 hover:bg-purple-200 dark:hover:bg-purple-800/40 border-purple-300 dark:border-purple-700',
    PILATES: 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400 hover:bg-pink-200 dark:hover:bg-pink-800/40 border-pink-300 dark:border-pink-700',
    AEROBICS: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 hover:bg-orange-200 dark:hover:bg-orange-800/40 border-orange-300 dark:border-orange-700',
    ZUMBA: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 hover:bg-yellow-200 dark:hover:bg-yellow-800/40 border-yellow-300 dark:border-yellow-700',
    CROSS_CIRCUIT: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-800/40 border-red-300 dark:border-red-700',
    KICK_BOXING: 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 hover:bg-rose-200 dark:hover:bg-rose-800/40 border-rose-300 dark:border-rose-700',
    CROSSFIT: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-800/40 border-amber-300 dark:border-amber-700',
    CARDIO: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-800/40 border-blue-300 dark:border-blue-700',
    STRENGTH: 'bg-slate-100 dark:bg-slate-900/30 text-slate-700 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800/40 border-slate-300 dark:border-slate-700',
    DANCE: 'bg-fuchsia-100 dark:bg-fuchsia-900/30 text-fuchsia-700 dark:text-fuchsia-400 hover:bg-fuchsia-200 dark:hover:bg-fuchsia-800/40 border-fuchsia-300 dark:border-fuchsia-700',
    MARTIAL_ARTS: 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800/40 border-gray-300 dark:border-gray-700',
    OTHER: 'bg-neutral-100 dark:bg-neutral-900/30 text-neutral-700 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800/40 border-neutral-300 dark:border-neutral-700',
  };
  return colors[type] || colors.OTHER;
}

// Component for the dragged event badge (exact replica of EventBadge in month-view)
function DraggedEventBadge({ event }: { event: CalendarEvent }) {
  const sessionType = event.sessionType || 'OTHER';
  const startTime = event.startDate ? new Date(event.startDate).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }) : '';

  return (
    <div
      className={cn(
        'px-2 py-1 rounded text-xs font-medium border cursor-grabbing shadow-xl',
        getColorClass(sessionType)
      )}
      title={`${event.name} - ${GYM_SESSION_TYPE_LABELS[sessionType as keyof typeof GYM_SESSION_TYPE_LABELS] || sessionType}`}
    >
      <span className="font-semibold">{startTime}</span> {event.name}
    </div>
  );
}

const useDragDrop = () => {
  const context = useContext(DragDropContext);
  if (!context) {
    throw new Error('useDragDrop must be used within DragDropProvider');
  }
  return context;
};

// @refresh reset
export { DragDropProvider, useDragDrop };
