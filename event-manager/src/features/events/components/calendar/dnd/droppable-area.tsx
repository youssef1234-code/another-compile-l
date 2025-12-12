/**
 * Droppable Area Component
 */

import { useDroppable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';

interface DroppableAreaProps {
  id: string;
  date: Date;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

export function DroppableArea({ id, date, children, className, disabled = false }: DroppableAreaProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
    data: { date },
    disabled,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'transition-colors',
        isOver && 'bg-primary/10 ring-2 ring-primary/20',
        className
      )}
    >
      {children}
    </div>
  );
}
