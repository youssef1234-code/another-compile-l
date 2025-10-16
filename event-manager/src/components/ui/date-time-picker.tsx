/**
 * DateTimePicker Component
 * 
 * A reusable date and time picker component with enhanced UI.
 * Combines a date picker (calendar) with time input for selecting both date and time.
 * 
 * Features:
 * - Date selection via calendar popup
 * - Time input with validation
 * - Clear functionality
 * - Minimum date constraint support
 * - Responsive design
 */

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Clock, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export interface DateTimePickerProps {
  value: Date | null;
  onChange: (date: Date | null) => void;
  placeholder?: string;
  minDate?: Date;
  maxDate?: Date;
  disabled?: boolean;
  className?: string;
}

export function DateTimePicker({
  value,
  onChange,
  placeholder = 'Select date & time',
  minDate,
  maxDate,
  disabled = false,
  className,
}: DateTimePickerProps) {
  const [open, setOpen] = useState(false);
  const [timeValue, setTimeValue] = useState<string>(() => {
    return value ? format(value, 'HH:mm') : '09:00';
  });

  // Sync time input with external value changes
  useEffect(() => {
    if (value) {
      setTimeValue(format(value, 'HH:mm'));
    }
  }, [value]);

  const handleDateSelect = (selected: Date | undefined) => {
    if (!selected) return;

    // Parse current time value
    const [hours, minutes] = timeValue.split(':').map(Number);

    // Combine selected date with time
    const combined = new Date(selected);
    combined.setHours(hours || 0, minutes || 0, 0, 0);

    // Apply minDate constraint if exists
    if (minDate && combined < minDate) {
      onChange(minDate);
    } else if (maxDate && combined > maxDate) {
      onChange(maxDate);
    } else {
      onChange(combined);
    }
  };

  const handleTimeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = event.target.value;
    setTimeValue(newTime);

    if (!value) return;

    const [hours, minutes] = newTime.split(':').map(Number);
    const updated = new Date(value);
    updated.setHours(hours || 0, minutes || 0, 0, 0);

    // Apply minDate constraint
    if (minDate && updated < minDate) {
      onChange(minDate);
    } else if (maxDate && updated > maxDate) {
      onChange(maxDate);
    } else {
      onChange(updated);
    }
  };

  const handleClear = () => {
    onChange(null);
    setTimeValue('09:00');
  };

  const handleDone = () => {
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          type="button"
          disabled={disabled}
          className={cn(
            'w-full justify-start text-left font-normal',
            !value && 'text-muted-foreground',
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? (
            <span className="flex items-center gap-2">
              {format(value, 'PPP')}
              <span className="flex items-center gap-1 text-muted-foreground">
                <Clock className="h-3 w-3" />
                {format(value, 'p')}
              </span>
            </span>
          ) : (
            placeholder
          )}
          {value && !disabled && (
            <X
              className="ml-auto h-4 w-4 opacity-50 hover:opacity-100"
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
            />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex flex-col">
          <Calendar
            mode="single"
            selected={value ?? undefined}
            onSelect={handleDateSelect}
            disabled={(date) => {
              const normalized = new Date(date);
              normalized.setHours(0, 0, 0, 0);
              
              if (minDate) {
                const minNormalized = new Date(minDate);
                minNormalized.setHours(0, 0, 0, 0);
                if (normalized < minNormalized) return true;
              }
              
              if (maxDate) {
                const maxNormalized = new Date(maxDate);
                maxNormalized.setHours(0, 0, 0, 0);
                if (normalized > maxNormalized) return true;
              }
              
              return false;
            }}
            initialFocus
          />
          <div className="border-t p-3 space-y-2">
            <Label htmlFor="time-input" className="text-xs font-medium text-muted-foreground">
              Time
            </Label>
            <Input
              id="time-input"
              type="time"
              value={timeValue}
              onChange={handleTimeChange}
              disabled={!value || disabled}
              className="w-full"
            />
          </div>
          <div className="flex items-center justify-between border-t p-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClear}
              disabled={!value || disabled}
            >
              Clear
            </Button>
            <Button type="button" size="sm" onClick={handleDone}>
              Done
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
