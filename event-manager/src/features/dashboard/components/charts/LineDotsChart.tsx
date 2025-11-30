import { CartesianGrid, Line, LineChart, XAxis } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import {type ChartConfig} from '@/components/ui/chart';


interface LineDotsChartProps {
  title: string;
  description?: string;
  data: Record<string, string | number>[];
  config: ChartConfig;
  dataKeys: string[];
}

export function LineDotsChart({ title, description, data, config, dataKeys }: LineDotsChartProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">{title}</CardTitle>
        {description && <CardDescription className="text-xs">{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="h-[180px] w-full">
          <LineChart data={data} margin={{ left: 12, right: 12 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => value.slice(0, 3)} />
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
            {dataKeys.map((key) => (
              <Line key={key} dataKey={key} type="natural" stroke={`var(--color-${key})`} strokeWidth={2} dot={{ fill: `var(--color-${key})` }} activeDot={{ r: 4 }} />
            ))}
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
