/**
 * Empty State Component
 *
 * Provides consistent empty states across the app with
 * helpful guidance for users on what to do next
 */

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { type LucideIcon, Info } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  tips?: string[];
  className?: string;
}

export function EmptyState({
  icon: Icon = Info,
  title,
  description,
  action,
  secondaryAction,
  tips,
  className,
}: EmptyStateProps) {
  return (
    <Card className={cn("border-dashed", className)}>
      <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
        {/* Icon */}
        <div className="relative mb-4">
          <div className="absolute inset-0 animate-pulse rounded-full bg-primary/10 blur-xl" />
          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
            <Icon className="h-8 w-8 text-primary" />
          </div>
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold mb-2">{title}</h3>

        {/* Description */}
        <p className="text-sm text-muted-foreground max-w-md mb-6">
          {description}
        </p>

        {/* Tips */}
        {tips && tips.length > 0 && (
          <div className="w-full max-w-sm mb-6">
            <div className="rounded-lg bg-muted/50 p-4 text-left">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                💡 How it works
              </p>
              <ul className="space-y-2">
                {tips.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                      {i + 1}
                    </span>
                    <span className="text-muted-foreground">{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Actions */}
        {(action || secondaryAction) && (
          <div className="flex items-center gap-3">
            {action && (
              <Button onClick={action.onClick}>{action.label}</Button>
            )}
            {secondaryAction && (
              <Button variant="outline" onClick={secondaryAction.onClick}>
                {secondaryAction.label}
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
