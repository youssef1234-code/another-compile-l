import { PolarAngleAxis, PolarGrid, Radar, RadarChart as RechartsRadar } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import {type ChartConfig} from '@/components/ui/chart';

interface RadarChartProps {
  title: string;
  description?: string;
  data: any[];
  config: ChartConfig;
  dataKeys: string[];
  angleKey: string;
}

export function RadarChart({ title, description, data, config, dataKeys, angleKey }: RadarChartProps) {
  return (
    <Card>
      <CardHeader className="items-center pb-2">
        <CardTitle className="text-sm">{title}</CardTitle>
        {description && <CardDescription className="text-xs">{description}</CardDescription>}
      </CardHeader>
      <CardContent className="pb-2">
        <ChartContainer config={config} className="mx-auto aspect-square max-h-[180px]">
          <RechartsRadar data={data} margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
            <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
            <PolarAngleAxis dataKey={angleKey} />
            <PolarGrid />
            {dataKeys.map((key) => (
              <Radar key={key} dataKey={key} fill={`var(--color-${key})`} fillOpacity={0.6} />
            ))}
          </RechartsRadar>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
