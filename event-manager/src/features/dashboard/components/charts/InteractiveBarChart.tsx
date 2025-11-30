import * as React from 'react';
import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import {type ChartConfig} from '@/components/ui/chart';
import NumberFlow from '@number-flow/react';

interface InteractiveBarChartProps {
  title: string;
  description?: string;
  data: Record<string, string | number>[];
  config: ChartConfig;
  categories: string[];
  totals: Record<string, number>;
}

export function InteractiveBarChart({ title, description, data, config, categories, totals }: InteractiveBarChartProps) {
  const [activeChart, setActiveChart] = React.useState(categories[0]);

  return (
    <Card>
      <CardHeader className="flex flex-col items-stretch border-b p-0 sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-4 py-3">
          <CardTitle className="text-sm">{title}</CardTitle>
          {description && <CardDescription className="text-xs">{description}</CardDescription>}
        </div>
        <div className="flex">
          {categories.map((key) => (
            <button
              key={key}
              data-active={activeChart === key}
              className="data-[active=true]:bg-muted/50 relative flex flex-1 flex-col justify-center gap-1 border-t px-4 py-3 text-left even:border-l sm:border-t-0 sm:border-l"
              onClick={() => setActiveChart(key)}
            >
              <span className="text-muted-foreground text-xs">{config[key]?.label}</span>
              <span className="text-xl font-bold tabular-nums">
                <NumberFlow value={totals[key]} format={{ notation: 'compact' }} />
              </span>
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="px-2 pt-4">
        <ChartContainer config={config} className="h-[180px] w-full">
          <BarChart data={data} margin={{ left: 12, right: 12 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} minTickGap={32} tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey={activeChart} fill={`var(--color-${activeChart})`} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
