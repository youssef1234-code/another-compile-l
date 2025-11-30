import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import {type ChartConfig} from '@/components/ui/chart';

interface AreaGradientChartProps {
  title: string;
  description?: string;
  data: Record<string, string | number>[];
  config: ChartConfig;
  dataKeys: string[];
}

export function AreaGradientChart({ title, description, data, config, dataKeys }: AreaGradientChartProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">{title}</CardTitle>
        {description && <CardDescription className="text-xs">{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="h-[180px] w-full">
          <AreaChart data={data} margin={{ left: 12, right: 12 }}>
            <defs>
              {dataKeys.map((key) => (
                <linearGradient key={key} id={`fill${key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={`var(--color-${key})`} stopOpacity={0.8} />
                  <stop offset="95%" stopColor={`var(--color-${key})`} stopOpacity={0.1} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => value.slice(0, 3)} />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            {dataKeys.map((key) => (
              <Area key={key} dataKey={key} type="natural" fill={`url(#fill${key})`} fillOpacity={0.4} stroke={`var(--color-${key})`} stackId="a" />
            ))}
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
