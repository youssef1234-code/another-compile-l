import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import {type ChartConfig} from '@/components/ui/chart';

interface HorizontalBarChartProps {
  title: string;
  description?: string;
  data: any[];
  config: ChartConfig;
  dataKey: string;
  nameKey: string;
}

export function HorizontalBarChart({ title, description, data, config, dataKey, nameKey }: HorizontalBarChartProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">{title}</CardTitle>
        {description && <CardDescription className="text-xs">{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="h-[180px] w-full">
          <BarChart data={data} layout="vertical" margin={{ right: 16 }}>
            <CartesianGrid horizontal={false} />
            <YAxis dataKey={nameKey} type="category" tickLine={false} tickMargin={10} axisLine={false} hide />
            <XAxis dataKey={dataKey} type="number" hide />
            <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
            <Bar dataKey={dataKey} layout="vertical" fill={`var(--color-${dataKey})`} radius={4}>
              <LabelList dataKey={nameKey} position="insideLeft" offset={8} className="fill-[--color-label]" fontSize={11} />
              <LabelList dataKey={dataKey} position="right" offset={8} className="fill-foreground" fontSize={11} />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
