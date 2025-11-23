import  NumberFlow from "@number-flow/react";
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { type Format } from "@number-flow/react";

interface MetricCardProps {
  title: string;
  value: number;
  growth?: number;
  format?: 'number' | 'currency' | 'percentage';
  prefix?: string;
  suffix?: string;
}

export function MetricCard({ title, value, growth, format = 'number', prefix = '', suffix = '' }: MetricCardProps) {
const formatOptions: Format =
  format === "currency"
    ? { style: "currency", currency: "EGP", maximumFractionDigits: 0 }
    : format === "percentage"
    ? { style: "percent", maximumFractionDigits: 1 }
    : { notation: "compact", maximumFractionDigits: 1 };

  const showGrowth = growth !== undefined && growth !== null;
  const isPositive = (growth || 0) >= 0;
  const TrendIcon = isPositive ? TrendingUp : TrendingDown;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          <div className="text-3xl font-bold tabular-nums">
            {prefix}
            <NumberFlow value={value} format={formatOptions} />
            {suffix}
          </div>
          {showGrowth && (
            <div className={`flex items-center gap-1 text-xs ${isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              <TrendIcon className="h-3 w-3" />
              <NumberFlow value={Math.abs(growth!)} format={{ maximumFractionDigits: 1 }} />
              % vs last period
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
