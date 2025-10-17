/**
 * Event Filters Component
 * 
 * Production-ready filtering system for public event browsing
 * Features:
 * - Event type multi-select
 * - Location filter
 * - Date range picker
 * - Price range
 * - Search by name/professor
 * - Reset and Apply actions
 */

import { useState, useEffect } from 'react';
import { Search, SlidersHorizontal, X, Calendar, MapPin, DollarSign, Tag, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getEventTypeConfig } from '@/lib/event-colors';

export interface EventFiltersState {
  search: string;
  types: string[];
  location?: 'ON_CAMPUS' | 'OFF_CAMPUS';
  dateRange?: 'upcoming' | 'this_week' | 'this_month' | 'custom';
  dateFrom?: Date;
  dateTo?: Date;
  maxPrice?: number;
  showFreeOnly: boolean;
}

interface EventFiltersProps {
  filters: EventFiltersState;
  onChange: (filters: EventFiltersState) => void;
  onReset: () => void;
  searchInput?: string;
  onSearchInputChange?: (value: string) => void;
  isSearching?: boolean;
  hidePrice?: boolean; // Hide price-related filters (for My Registrations)
}

const EVENT_TYPES = [
  { value: 'WORKSHOP', label: 'Workshops' },
  { value: 'TRIP', label: 'Trips' },
  { value: 'CONFERENCE', label: 'Conferences' },
  { value: 'BAZAAR', label: 'Bazaars' },
];

export function EventFilters({ 
  filters, 
  onChange, 
  onReset, 
  searchInput, 
  onSearchInputChange, 
  isSearching,
  hidePrice = false
}: EventFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Local state for advanced filters (only applied when user clicks "Apply")
  const [localLocation, setLocalLocation] = useState<'ON_CAMPUS' | 'OFF_CAMPUS' | undefined>(filters.location);
  const [localDateRange, setLocalDateRange] = useState<EventFiltersState['dateRange']>(filters.dateRange);
  const [localDateFrom, setLocalDateFrom] = useState<Date | undefined>(filters.dateFrom);
  const [localDateTo, setLocalDateTo] = useState<Date | undefined>(filters.dateTo);
  const [localMaxPrice, setLocalMaxPrice] = useState<number | undefined>(filters.maxPrice);
  const [localShowFreeOnly, setLocalShowFreeOnly] = useState(filters.showFreeOnly);

  // Sync local state when filters are reset externally
  useEffect(() => {
    setLocalLocation(filters.location);
    setLocalDateRange(filters.dateRange);
    setLocalDateFrom(filters.dateFrom);
    setLocalDateTo(filters.dateTo);
    setLocalMaxPrice(filters.maxPrice);
    setLocalShowFreeOnly(filters.showFreeOnly);
  }, [filters.location, filters.dateRange, filters.dateFrom, filters.dateTo, filters.maxPrice, filters.showFreeOnly]);

  const handleApply = () => {
    onChange({
      ...filters,
      location: localLocation,
      dateRange: localDateRange,
      dateFrom: localDateFrom,
      dateTo: localDateTo,
      maxPrice: localMaxPrice,
      showFreeOnly: localShowFreeOnly,
    });
    setIsOpen(false);
  };

  const handleReset = () => {
    setLocalLocation(undefined);
    setLocalDateRange('upcoming');
    setLocalDateFrom(undefined);
    setLocalDateTo(undefined);
    setLocalMaxPrice(undefined);
    setLocalShowFreeOnly(false);
    onReset();
    setIsOpen(false);
  };

  const handleTypeToggle = (type: string) => {
    const newTypes = filters.types.includes(type)
      ? filters.types.filter((t) => t !== type)
      : [...filters.types, type];
    onChange({ ...filters, types: newTypes });
  };

  const activeFiltersCount = 
    filters.types.length +
    (filters.location ? 1 : 0) +
    (filters.dateRange && filters.dateRange !== 'upcoming' ? 1 : 0) +
    (filters.showFreeOnly ? 1 : 0) +
    (filters.maxPrice ? 1 : 0);

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search events by name, professor, or description..."
          value={searchInput !== undefined ? searchInput : filters.search}
          onChange={(e) => {
            if (onSearchInputChange) {
              onSearchInputChange(e.target.value);
            } else {
              onChange({ ...filters, search: e.target.value });
            }
          }}
          className="pl-10 pr-4 h-12 text-base"
        />
        {isSearching && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Quick Filters + Advanced Filters Button */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Event Type Pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">Types:</span>
          {EVENT_TYPES.map((type) => {
            const typeConfig = getEventTypeConfig(type.value);
            const isSelected = filters.types.includes(type.value);
            return (
              <Badge
                key={type.value}
                variant={isSelected ? 'default' : 'outline'}
                className={cn(
                  'cursor-pointer hover:opacity-80 transition-opacity text-white',
                  isSelected ? typeConfig.bg : `border-2 ${typeConfig.border} ${typeConfig.text}`
                )}
                onClick={() => handleTypeToggle(type.value)}
              >
                <Tag className="h-3 w-3 mr-1" />
                {type.label}
              </Badge>
            );
          })}
        </div>

        {/* Advanced Filters Popover */}
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="ml-auto">
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              Filters
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-2 px-1.5 py-0">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-3">Advanced Filters</h4>
              </div>

              {/* Location Filter */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Location
                </Label>
                <Select
                  value={localLocation || 'all'}
                  onValueChange={(value) =>
                    setLocalLocation(value === 'all' ? undefined : (value as 'ON_CAMPUS' | 'OFF_CAMPUS'))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Locations</SelectItem>
                    <SelectItem value="ON_CAMPUS">On Campus</SelectItem>
                    <SelectItem value="OFF_CAMPUS">Off Campus</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Date Range Filter */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Date Range
                </Label>
                <Select
                  value={localDateRange || 'upcoming'}
                  onValueChange={(value) => {
                    setLocalDateRange(value as EventFiltersState['dateRange']);
                    if (value !== 'custom') {
                      setLocalDateFrom(undefined);
                      setLocalDateTo(undefined);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="upcoming">Upcoming Events</SelectItem>
                    <SelectItem value="this_week">This Week</SelectItem>
                    <SelectItem value="this_month">This Month</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                  </SelectContent>
                </Select>
                
                {/* Custom Date Range Inputs */}
                {localDateRange === 'custom' && (
                  <div className="space-y-2 pt-2 border-t">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">From</Label>
                        <Input
                          type="date"
                          value={localDateFrom ? localDateFrom.toISOString().split('T')[0] : ''}
                          onChange={(e) =>
                            setLocalDateFrom(e.target.value ? new Date(e.target.value) : undefined)
                          }
                          className="h-9"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">To</Label>
                        <Input
                          type="date"
                          value={localDateTo ? localDateTo.toISOString().split('T')[0] : ''}
                          onChange={(e) =>
                            setLocalDateTo(e.target.value ? new Date(e.target.value) : undefined)
                          }
                          className="h-9"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Price Filter */}
              {!hidePrice && (
                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Maximum Price
                  </Label>
                  <Input
                    type="number"
                    placeholder="Any price"
                    value={localMaxPrice || ''}
                    onChange={(e) =>
                      setLocalMaxPrice(e.target.value ? Number(e.target.value) : undefined)
                    }
                    min={0}
                    step={10}
                  />
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="free-only"
                      checked={localShowFreeOnly}
                      onCheckedChange={(checked) =>
                        setLocalShowFreeOnly(checked as boolean)
                      }
                    />
                    <Label
                      htmlFor="free-only"
                      className="text-sm font-normal cursor-pointer"
                    >
                      Show free events only
                    </Label>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                  className="flex-1"
                >
                  <X className="h-4 w-4 mr-1" />
                  Reset
                </Button>
                <Button
                  size="sm"
                  onClick={handleApply}
                  className="flex-1"
                >
                  Apply
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Active Filters Count */}
        {activeFiltersCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4 mr-1" />
            Clear all
          </Button>
        )}
      </div>
    </div>
  );
}
