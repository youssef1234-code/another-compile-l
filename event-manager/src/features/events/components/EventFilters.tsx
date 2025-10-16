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

import { useState } from 'react';
import { Search, SlidersHorizontal, X, Calendar, MapPin, DollarSign, Tag } from 'lucide-react';
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
}

const EVENT_TYPES = [
  { value: 'WORKSHOP', label: 'Workshops', color: 'blue' },
  { value: 'TRIP', label: 'Trips', color: 'green' },
  { value: 'BAZAAR', label: 'Bazaars', color: 'purple' },
  { value: 'CONFERENCE', label: 'Conferences', color: 'orange' },
];

export function EventFilters({ filters, onChange, onReset }: EventFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);

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
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          className="pl-10 pr-4 h-12 text-base"
        />
      </div>

      {/* Quick Filters + Advanced Filters Button */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Event Type Pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">Types:</span>
          {EVENT_TYPES.map((type) => (
            <Badge
              key={type.value}
              variant={filters.types.includes(type.value) ? 'default' : 'outline'}
              className={cn(
                'cursor-pointer hover:opacity-80 transition-opacity',
                filters.types.includes(type.value) && 'bg-primary'
              )}
              onClick={() => handleTypeToggle(type.value)}
            >
              <Tag className="h-3 w-3 mr-1" />
              {type.label}
            </Badge>
          ))}
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
                  value={filters.location || 'all'}
                  onValueChange={(value) =>
                    onChange({
                      ...filters,
                      location: value === 'all' ? undefined : (value as 'ON_CAMPUS' | 'OFF_CAMPUS'),
                    })
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
                  value={filters.dateRange || 'upcoming'}
                  onValueChange={(value) =>
                    onChange({
                      ...filters,
                      dateRange: value as EventFiltersState['dateRange'],
                      dateFrom: value !== 'custom' ? undefined : filters.dateFrom,
                      dateTo: value !== 'custom' ? undefined : filters.dateTo,
                    })
                  }
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
                {filters.dateRange === 'custom' && (
                  <div className="space-y-2 pt-2 border-t">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">From</Label>
                        <Input
                          type="date"
                          value={filters.dateFrom ? filters.dateFrom.toISOString().split('T')[0] : ''}
                          onChange={(e) =>
                            onChange({
                              ...filters,
                              dateFrom: e.target.value ? new Date(e.target.value) : undefined,
                            })
                          }
                          className="h-9"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">To</Label>
                        <Input
                          type="date"
                          value={filters.dateTo ? filters.dateTo.toISOString().split('T')[0] : ''}
                          onChange={(e) =>
                            onChange({
                              ...filters,
                              dateTo: e.target.value ? new Date(e.target.value) : undefined,
                            })
                          }
                          className="h-9"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Price Filter */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Maximum Price
                </Label>
                <Input
                  type="number"
                  placeholder="Any price"
                  value={filters.maxPrice || ''}
                  onChange={(e) =>
                    onChange({
                      ...filters,
                      maxPrice: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                  min={0}
                  step={10}
                />
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="free-only"
                    checked={filters.showFreeOnly}
                    onCheckedChange={(checked) =>
                      onChange({ ...filters, showFreeOnly: checked as boolean })
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

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onReset();
                    setIsOpen(false);
                  }}
                  className="flex-1"
                >
                  <X className="h-4 w-4 mr-1" />
                  Reset
                </Button>
                <Button
                  size="sm"
                  onClick={() => setIsOpen(false)}
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
