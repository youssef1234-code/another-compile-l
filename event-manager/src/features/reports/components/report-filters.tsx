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

import { Search, X, Tag, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DatePicker } from '@/components/ui/date-picker';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getEventTypeConfig } from '@/lib/event-colors';

export interface ReportFiltersState {
    search: string;
    types: string[];
    dateFrom?: Date;
    dateTo?: Date;
    maxPrice?: number;
}

interface ReportFiltersProps {
    filters: ReportFiltersState;
    onChange: (filters: ReportFiltersState) => void;
    onReset: () => void;
    searchInput?: string;
    onSearchInputChange?: (value: string) => void;
    isSearching?: boolean;
    showDatePickers?: boolean;
    showSearchBar?: boolean;
    rightSlot?: React.ReactNode;
}

// Show WORKSHOP, TRIP, CONFERENCE, BAZAAR in browse events (no GYM_SESSION)
const EVENT_TYPES = [
    { value: 'WORKSHOP', label: 'Workshops' },
    { value: 'TRIP', label: 'Trips' },
    { value: 'CONFERENCE', label: 'Conferences' },
    { value: 'BAZAAR', label: 'Bazaars' },
];

export function ReportFilters({
    filters,
    onChange,
    onReset,
    searchInput,
    onSearchInputChange,
    isSearching,
    showDatePickers = true,
    showSearchBar = true,
    rightSlot,
}: ReportFiltersProps) {
    const maxDate = new Date();

    const handleTypeToggle = (type: string) => {
        const newTypes = filters.types.includes(type)
            ? filters.types.filter((t) => t !== type)
            : [...filters.types, type];
        onChange({ ...filters, types: newTypes });
    };

    const activeFiltersCount =
        filters.types.length +
        (filters.dateFrom && filters.dateTo ? 1 : 0) +
        (filters.maxPrice ? 1 : 0);



    return (
        <div className="space-y-4">
            {/* Search Bar + Event Type Pills on same row */}
            <div className="flex flex-wrap items-center gap-3">
                {/* Search Bar - narrower width (about 2 cards) */}
                {showSearchBar && (
                    <div className="relative flex-shrink-0" style={{ width: '400px', maxWidth: '100%' }}>
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search events..."
                            value={searchInput !== undefined ? searchInput : filters.search}
                            onChange={(e) => {
                                if (onSearchInputChange) {
                                    onSearchInputChange(e.target.value);
                                } else {
                                    onChange({ ...filters, search: e.target.value });
                                }
                            }}
                            className="pl-10 pr-4 h-10 text-sm"
                        />
                        {isSearching && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                            </div>
                        )}
                    </div>
                )}

                {/* Event Type Pills - on the same row */}
                <div className="flex items-center gap-2 flex-wrap flex-1">
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

                {/* Date Pickers - on the same row */}
                {showDatePickers && (
                    <div className="grid grid-cols-2 gap-2">
                        <DatePicker
                            value={filters.dateFrom || null}
                            onChange={(date) => onChange({
                                ...filters,
                                dateFrom: date || undefined,

                            })}
                            placeholder="From "
                            className="h-10 "
                            maxDate={maxDate}
                        />
                        <DatePicker
                            value={filters.dateTo || maxDate}
                            onChange={(date) => onChange({
                                ...filters,
                                dateTo: date || undefined,

                            })}
                            placeholder="To "
                            className="h-10 "
                            minDate={filters.dateFrom}
                            maxDate={maxDate}
                        />
                    </div>
                )}

                {/* Right slot for toggle buttons */}
                {rightSlot}

                {/* Clear All Button */}
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
