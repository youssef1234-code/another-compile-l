/**
 * Droppable Area Component using @dnd-kit
 * Production-ready droppable implementation
 */

import { type ReactNode } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface DroppableAreaProps {
  date: Date;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
}

export function DroppableArea({ date, children, className, disabled = false }: DroppableAreaProps) {
  // Create unique ID from date for droppable
  const droppableId = `droppable-${format(date, 'yyyy-MM-dd')}`;
  
  const { setNodeRef, isOver, active } = useDroppable({
    id: droppableId,
    disabled,
    data: {
      date,
      type: 'calendar-cell',
    },
  });

  // Check if something is being dragged
  const isDragging = active !== null;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        className,
        'transition-all duration-200 relative',
        isDragging && !disabled && 'ring-1 ring-muted/50',
        isOver && !disabled && 'bg-primary/10 ring-2 ring-primary ring-inset scale-[1.02]'
      )}
    >
      {children}
      
      {/* Animated drop indicator when hovering */}
      {isOver && !disabled && (
        <>
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent pointer-events-none rounded animate-pulse" />
          <div className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full animate-ping pointer-events-none" />
          <div className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full pointer-events-none" />
        </>
      )}
    </div>
  );
}
