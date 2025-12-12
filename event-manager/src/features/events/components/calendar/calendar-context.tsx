/**
 * Event Calendar Context
 * Manages calendar state for all events
 */

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { CalendarView, CalendarEvent, CalendarContextType } from './types';

const CalendarContext = createContext<CalendarContextType | undefined>(undefined);

export const useCalendar = () => {
  const context = useContext(CalendarContext);
  if (!context) {
    throw new Error('useCalendar must be used within a CalendarProvider');
  }
  return context;
};

interface CalendarProviderProps {
  children: React.ReactNode;
  events: CalendarEvent[];
  initialView?: CalendarView;
  initialDate?: Date;
  onDropEvent?: (date: Date) => void;
  readOnly?: boolean;
}

export function CalendarProvider({
  children,
  events,
  initialView = 'month',
  initialDate = new Date(),
  onDropEvent,
  readOnly = false,
}: CalendarProviderProps) {
  const [currentDate, setCurrentDate] = useState<Date>(initialDate);
  const [view, setView] = useState<CalendarView>(initialView);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  const goToToday = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  const goToPrevious = useCallback(() => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      switch (view) {
        case 'day':
          newDate.setDate(prev.getDate() - 1);
          break;
        case 'week':
          newDate.setDate(prev.getDate() - 7);
          break;
        case 'month':
          newDate.setMonth(prev.getMonth() - 1);
          break;
        default:
          newDate.setMonth(prev.getMonth() - 1);
      }
      return newDate;
    });
  }, [view]);

  const goToNext = useCallback(() => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      switch (view) {
        case 'day':
          newDate.setDate(prev.getDate() + 1);
          break;
        case 'week':
          newDate.setDate(prev.getDate() + 7);
          break;
        case 'month':
          newDate.setMonth(prev.getMonth() + 1);
          break;
        default:
          newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  }, [view]);

  const value = useMemo(
    () => ({
      currentDate,
      view,
      events,
      selectedEvent,
      setCurrentDate,
      setView,
      setSelectedEvent,
      goToToday,
      goToPrevious,
      goToNext,
      onDropEvent,
      readOnly,
    }),
    [currentDate, view, events, selectedEvent, goToToday, goToPrevious, goToNext, onDropEvent, readOnly]
  );

  return <CalendarContext.Provider value={value}>{children}</CalendarContext.Provider>;
}
