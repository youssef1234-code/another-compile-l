/**
 * Events Store
 * 
 * Zustand store for managing events filtering and search state
 * 
 * @module store/eventsStore
 */

import { create } from 'zustand';

type EventType = 'WORKSHOP' | 'TRIP' | 'BAZAAR' | 'CONFERENCE' | 'GYM_SESSION' | 'OTHER';
type EventLocation = 'ON_CAMPUS' | 'OFF_CAMPUS';

interface EventFilters {
  search: string;
  type?: EventType;
  location?: EventLocation;
  startDate?: Date;
  endDate?: Date;
  minPrice?: number;
  maxPrice?: number;
  onlyUpcoming: boolean;
}

interface EventsState {
  filters: EventFilters;
  page: number;
  limit: number;
  
  // Actions
  setSearch: (search: string) => void;
  setType: (type?: EventType) => void;
  setLocation: (location?: EventLocation) => void;
  setDateRange: (startDate?: Date, endDate?: Date) => void;
  setPriceRange: (minPrice?: number, maxPrice?: number) => void;
  setOnlyUpcoming: (onlyUpcoming: boolean) => void;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  resetFilters: () => void;
}

const initialFilters: EventFilters = {
  search: '',
  onlyUpcoming: true,
};

export const useEventsStore = create<EventsState>((set) => ({
  filters: initialFilters,
  page: 1,
  limit: 12,

  setSearch: (search) =>
    set((state) => ({
      filters: { ...state.filters, search },
      page: 1, // Reset to first page on search
    })),

  setType: (type) =>
    set((state) => ({
      filters: { ...state.filters, type },
      page: 1,
    })),

  setLocation: (location) =>
    set((state) => ({
      filters: { ...state.filters, location },
      page: 1,
    })),

  setDateRange: (startDate, endDate) =>
    set((state) => ({
      filters: { ...state.filters, startDate, endDate },
      page: 1,
    })),

  setPriceRange: (minPrice, maxPrice) =>
    set((state) => ({
      filters: { ...state.filters, minPrice, maxPrice },
      page: 1,
    })),

  setOnlyUpcoming: (onlyUpcoming) =>
    set((state) => ({
      filters: { ...state.filters, onlyUpcoming },
      page: 1,
    })),

  setPage: (page) => set({ page }),

  setLimit: (limit) => set({ limit, page: 1 }),

  resetFilters: () =>
    set({
      filters: initialFilters,
      page: 1,
    }),
}));
