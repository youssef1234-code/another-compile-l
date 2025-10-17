/**
 * Color Legend Component
 * Displays color coding for different gym session types
 */

import { GYM_SESSION_TYPE_LABELS, GYM_SESSION_TYPE_COLORS, GymSessionType } from '@event-manager/shared';
import { Info } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function ColorLegend() {
  const sessionTypes = Object.keys(GYM_SESSION_TYPE_LABELS) as GymSessionType[];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Info className="h-4 w-4" />
          Color Guide
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-3">
          <div>
            <h4 className="font-semibold text-sm mb-2">Session Type Colors</h4>
            <p className="text-xs text-muted-foreground mb-3">
              Each gym session type has a unique color for easy identification
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {sessionTypes.map((type) => {
              const colors = GYM_SESSION_TYPE_COLORS[type];
              const label = GYM_SESSION_TYPE_LABELS[type];
              return (
                <div
                  key={type}
                  className={cn(
                    'px-2 py-1.5 rounded text-xs font-medium border flex items-center gap-2',
                    colors.bg,
                    colors.text,
                    colors.border
                  )}
                >
                  <div className={cn('w-2 h-2 rounded-full', colors.bg.replace('100', '500'))} />
                  <span>{label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
