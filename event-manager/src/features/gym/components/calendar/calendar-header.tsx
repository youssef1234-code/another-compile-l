/**
 * Calendar Header Component
 * Navigation, view switcher, date display, and filters
 */

import { Button } from '@/components/ui/button';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  List,
  Grid3x3,
  Clock,
  Filter,
  FileDown
} from 'lucide-react';
import { useCalendar } from './calendar-context';
import { formatMonthYear } from './helpers';
import { cn } from '@/lib/utils';
import type { CalendarView } from './types';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { GYM_SESSION_TYPE_LABELS, GYM_SESSION_TYPE_COLORS } from '@event-manager/shared';
import { ColorLegend } from './color-legend';

const VIEW_ICONS: Record<CalendarView, React.ReactNode> = {
  day: <Clock className="h-4 w-4" />,
  week: <Grid3x3 className="h-4 w-4" />,
  month: <CalendarIcon className="h-4 w-4" />,
  year: <CalendarIcon className="h-4 w-4" />,
  agenda: <List className="h-4 w-4" />,
};

const VIEW_LABELS: Record<CalendarView, string> = {
  day: 'Day',
  week: 'Week',
  month: 'Month',
  year: 'Year',
  agenda: 'Agenda',
};

const GYM_TYPES = [
  'YOGA', 'PILATES', 'AEROBICS', 'ZUMBA', 'CROSS_CIRCUIT', 'KICK_BOXING',
  'CROSSFIT', 'CARDIO', 'STRENGTH', 'DANCE', 'MARTIAL_ARTS', 'OTHER'
] as const;

interface CalendarHeaderProps {
  selectedTypes?: string[];
  onTypesChange?: (types: string[]) => void;
  onExportPDF?: () => void;
}

export function CalendarHeader({ selectedTypes = [], onTypesChange, onExportPDF }: CalendarHeaderProps) {
  const { currentDate, view, setView, goToPrevious, goToNext, goToToday } = useCalendar();

  const toggleType = (type: string) => {
    if (!onTypesChange) return;
    if (selectedTypes.includes(type)) {
      onTypesChange(selectedTypes.filter(t => t !== type));
    } else {
      onTypesChange([...selectedTypes, type]);
    }
  };

  const activeFilterCount = selectedTypes.length;

  return (
    <div className="flex items-center justify-between px-6 py-4 border-b bg-card">
      {/* Left: Navigation */}
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={goToToday}>
          Today
        </Button>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={goToPrevious}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={goToNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <h2 className="text-lg font-semibold ml-4">
          {formatMonthYear(currentDate)}
        </h2>
      </div>

      {/* Center/Right: Actions */}
      <div className="flex items-center gap-3">
        {/* Color Legend */}
        <ColorLegend />

        {/* Filter by Type */}
        {onTypesChange && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="h-4 w-4" />
                Filter
                {activeFilterCount > 0 && (
                  <span className="ml-1 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                    {activeFilterCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel>Filter by Session Type</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="max-h-[400px] overflow-y-auto">
                {GYM_TYPES.map((type) => {
                  const colors = GYM_SESSION_TYPE_COLORS[type];
                  return (
                    <DropdownMenuCheckboxItem
                      key={type}
                      checked={selectedTypes.includes(type)}
                      onCheckedChange={() => toggleType(type)}
                      className="gap-2"
                    >
                      <div className={cn('w-3 h-3 rounded-full flex-shrink-0', colors.bg.replace('100', '500'))} />
                      <span>{GYM_SESSION_TYPE_LABELS[type] || type.replace(/_/g, ' ')}</span>
                    </DropdownMenuCheckboxItem>
                  );
                })}
              </div>
              {selectedTypes.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={() => onTypesChange([])}
                  >
                    Clear Filters
                  </Button>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Export PDF */}
        {onExportPDF && (
          <Button variant="outline" size="sm" onClick={onExportPDF} className="gap-2">
            <FileDown className="h-4 w-4" />
            Export PDF
          </Button>
        )}

        {/* View Switcher */}
        <div className="flex items-center gap-1 rounded-lg p-1 bg-muted/30 border">
          {(['month', 'week', 'day', 'agenda'] as CalendarView[]).map((v) => (
            <Button
              key={v}
              variant="ghost"
              size="sm"
              onClick={() => setView(v)}
              className={cn(
                'gap-2 transition-all',
                view === v 
                  ? 'bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary' 
                  : 'hover:bg-muted text-muted-foreground'
              )}
            >
              {VIEW_ICONS[v]}
              {VIEW_LABELS[v]}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
