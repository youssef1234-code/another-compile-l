/**
 * Calendar Header Component
 * Navigation, view switcher, filters, and export options
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
  FileDown,
  FileSpreadsheet,
  FileImage,
} from 'lucide-react';
import { useCalendar } from './calendar-context';
import { formatMonthYear } from './helpers';
import { cn } from '@/lib/utils';
import type { CalendarView } from './types';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EVENT_TYPE_LABELS, EVENT_TYPE_COLORS, EventType } from '../../../../shared';
import { Badge } from '@/components/ui/badge';

const VIEW_ICONS: Record<CalendarView, React.ReactNode> = {
  day: <Clock className="h-4 w-4" />,
  week: <Grid3x3 className="h-4 w-4" />,
  month: <CalendarIcon className="h-4 w-4" />,
  agenda: <List className="h-4 w-4" />,
};

const VIEW_LABELS: Record<CalendarView, string> = {
  day: 'Day',
  week: 'Week',
  month: 'Month',
  agenda: 'Agenda',
};

// Exclude GYM_SESSION from event calendar filters
const EVENT_TYPES = (Object.keys(EVENT_TYPE_LABELS) as EventType[]).filter(type => type !== 'GYM_SESSION');

interface CalendarHeaderProps {
  selectedTypes?: EventType[];
  onTypesChange?: (types: EventType[]) => void;
  onExportPDF?: () => void;
  onExportExcel?: () => void;
  onExportICS?: () => void;
}

export function CalendarHeader({ 
  selectedTypes = [], 
  onTypesChange, 
  onExportPDF,
  onExportExcel,
  onExportICS,
}: CalendarHeaderProps) {
  const { currentDate, view, setView, goToPrevious, goToNext, goToToday } = useCalendar();

  const toggleType = (type: EventType) => {
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

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        {/* Event Type Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2 relative">
              <Filter className="h-4 w-4" />
              Filter
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-1 px-1.5 py-0 h-5 text-xs">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Event Types</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {EVENT_TYPES.map((type) => {
              const colors = EVENT_TYPE_COLORS[type];
              const label = EVENT_TYPE_LABELS[type];
              return (
                <DropdownMenuCheckboxItem
                  key={type}
                  checked={selectedTypes.includes(type)}
                  onCheckedChange={() => toggleType(type)}
                >
                  <div className="flex items-center gap-2">
                    <div className={cn('w-3 h-3 rounded', colors.dot)} />
                    <span>{label}</span>
                  </div>
                </DropdownMenuCheckboxItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
        {/* Export Menu */}
        {(onExportPDF || onExportExcel || onExportICS) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <FileDown className="h-4 w-4" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Export Format</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {onExportPDF && (
                <DropdownMenuItem onClick={onExportPDF} className="gap-2 cursor-pointer">
                  <FileImage className="h-4 w-4" />
                  Export as PDF
                  <span className="text-xs text-muted-foreground ml-auto">Screenshot</span>
                </DropdownMenuItem>
              )}
              {onExportExcel && (
                <DropdownMenuItem onClick={onExportExcel} className="gap-2 cursor-pointer">
                  <FileSpreadsheet className="h-4 w-4" />
                  Export as Excel
                  <span className="text-xs text-muted-foreground ml-auto">Data</span>
                </DropdownMenuItem>
              )}
              {onExportICS && (
                <DropdownMenuItem onClick={onExportICS} className="gap-2 cursor-pointer">
                  <CalendarIcon className="h-4 w-4" />
                  Export as ICS
                  <span className="text-xs text-muted-foreground ml-auto">Calendar</span>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* View Switcher */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              {VIEW_ICONS[view]}
              <span>{VIEW_LABELS[view]}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Calendar View</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {Object.entries(VIEW_LABELS).map(([viewKey, viewLabel]) => (
              <DropdownMenuItem
                key={viewKey}
                onClick={() => setView(viewKey as CalendarView)}
                className={cn(view === viewKey && 'bg-accent')}
              >
                <div className="flex items-center gap-2 w-full">
                  {VIEW_ICONS[viewKey as CalendarView]}
                  <span>{viewLabel}</span>
                  {view === viewKey && (
                    <span className="ml-auto text-primary">✓</span>
                  )}
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
