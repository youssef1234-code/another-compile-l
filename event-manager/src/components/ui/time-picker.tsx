/**
 * TimePicker Component
 * 
 * Theme-aware time picker with hour and minute selection
 */

import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export interface TimePickerProps {
  value: string; // HH:mm format
  onChange: (time: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function TimePicker({
  value,
  onChange,
  placeholder = 'Select time',
  disabled = false,
  className,
}: TimePickerProps) {
  const [open, setOpen] = useState(false);
  const [hours, setHours] = useState('09');
  const [minutes, setMinutes] = useState('00');

  useEffect(() => {
    if (value) {
      const [h, m] = value.split(':');
      setHours(h || '09');
      setMinutes(m || '00');
    }
  }, [value]);

  const handleApply = () => {
    const normalizedHours = hours.padStart(2, '0');
    const normalizedMinutes = minutes.padStart(2, '0');
    onChange(`${normalizedHours}:${normalizedMinutes}`);
    setOpen(false);
  };

  const handleHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '');
    const num = parseInt(val || '0', 10);
    if (num >= 0 && num <= 23) {
      setHours(val);
    }
  };

  const handleMinutesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '');
    const num = parseInt(val || '0', 10);
    if (num >= 0 && num <= 59) {
      setMinutes(val);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'w-full justify-start text-left font-normal',
            !value && 'text-muted-foreground',
            className
          )}
          disabled={disabled}
        >
          <Clock className="mr-2 h-4 w-4" />
          {value || placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-4" align="start">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="flex-1 space-y-2">
              <Label htmlFor="hours" className="text-xs">Hours</Label>
              <Input
                id="hours"
                type="number"
                min="0"
                max="23"
                value={hours}
                onChange={handleHoursChange}
                className="text-center"
                placeholder="HH"
              />
            </div>
            <span className="text-2xl font-bold mt-6">:</span>
            <div className="flex-1 space-y-2">
              <Label htmlFor="minutes" className="text-xs">Minutes</Label>
              <Input
                id="minutes"
                type="number"
                min="0"
                max="59"
                value={minutes}
                onChange={handleMinutesChange}
                className="text-center"
                placeholder="MM"
              />
            </div>
          </div>
          <Button onClick={handleApply} className="w-full" size="sm">
            Apply
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
