/**
 * Event Search Bar Component
 * 
 * Advanced search and filter interface for events
 * Includes debounced search, type filter, location filter
 */


import { useState, useEffect } from 'react';
import { Search, Filter, X, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useEventsStore } from '@/store/eventsStore';

const filterVariants = {
  hidden: { opacity: 0, height: 0 },
  visible: {
    opacity: 1,
    height: 'auto',
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    },
  },
  exit: {
    opacity: 0,
    height: 0,
    transition: {
      duration: 0.2,
    },
  },
};

export function EventSearchBar() {
  const {
    filters,
    setSearch,
    setType,
    setLocation,
    setOnlyUpcoming,
    resetFilters,
  } = useEventsStore();

  const [showFilters, setShowFilters] = useState(false);
  const [searchInput, setSearchInput] = useState(filters.search);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput, setSearch]);

  const activeFiltersCount = [
    filters.type,
    filters.location,
    !filters.onlyUpcoming,
  ].filter(Boolean).length;

  const handleResetFilters = () => {
    setSearchInput('');
    resetFilters();
  };

  return (
    <div className="space-y-4">
      {/* Main Search Bar */}
      <div className="flex gap-2">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search events by title, description..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9 pr-9"
          />
          {searchInput && (
            <button
              onClick={() => setSearchInput('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filter Toggle Button */}
        <Button
          variant={showFilters ? 'default' : 'outline'}
          onClick={() => setShowFilters(!showFilters)}
          className="gap-2 relative"
        >
          <Filter className="h-4 w-4" />
          Filters
          {activeFiltersCount > 0 && (
            <Badge
              variant="secondary"
              className="ml-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {activeFiltersCount}
            </Badge>
          )}
        </Button>

        {/* Reset Filters Button */}
        {activeFiltersCount > 0 && (
          <Button variant="ghost" onClick={handleResetFilters} className="gap-2">
            <X className="h-4 w-4" />
            Clear
          </Button>
        )}
      </div>

      {/* Advanced Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            variants={filterVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="overflow-hidden"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4 border rounded-lg bg-muted/30">
              {/* Event Type Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Event Type</label>
                <Select
                  value={filters.type || 'all'}
                  onValueChange={(value) => setType(value === 'all' ? undefined : value as 'WORKSHOP' | 'TRIP' | 'BAZAAR' | 'CONFERENCE' | 'GYM_SESSION')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="WORKSHOP">Workshop</SelectItem>
                    <SelectItem value="TRIP">Trip</SelectItem>
                    <SelectItem value="BAZAAR">Bazaar</SelectItem>
                    <SelectItem value="CONFERENCE">Conference</SelectItem>
                    <SelectItem value="GYM_SESSION">Gym Session</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Location Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Location</label>
                <Select
                  value={filters.location || 'all'}
                  onValueChange={(value) => setLocation(value === 'all' ? undefined : value as 'ON_CAMPUS' | 'OFF_CAMPUS')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All locations" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Locations</SelectItem>
                    <SelectItem value="ON_CAMPUS">On Campus</SelectItem>
                    <SelectItem value="OFF_CAMPUS">Off Campus</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Show Only Upcoming */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Date Filter</label>
                <Select
                  value={filters.onlyUpcoming ? 'upcoming' : 'all'}
                  onValueChange={(value) => setOnlyUpcoming(value === 'upcoming')}
                >
                  <SelectTrigger>
                    <Calendar className="mr-2 h-4 w-4" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="upcoming">Upcoming Events</SelectItem>
                    <SelectItem value="all">All Events</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Filters Display */}
      {activeFiltersCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap gap-2"
        >
          <span className="text-sm text-muted-foreground">Active filters:</span>
          {filters.type && (
            <Badge variant="secondary" className="gap-1">
              Type: {filters.type.replace('_', ' ')}
              <button
                onClick={() => setType(undefined)}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.location && (
            <Badge variant="secondary" className="gap-1">
              Location: {filters.location === 'ON_CAMPUS' ? 'On Campus' : 'Off Campus'}
              <button
                onClick={() => setLocation(undefined)}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {!filters.onlyUpcoming && (
            <Badge variant="secondary" className="gap-1">
              Showing all events
              <button
                onClick={() => setOnlyUpcoming(true)}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </motion.div>
      )}
    </div>
  );
}
