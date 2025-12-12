/**
 * AI Analytics Dashboard Component
 * 
 * Displays AI-generated insights for Admin/Event Office dashboards.
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Brain, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  Lightbulb,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  BarChart3,
  MessageSquare,
  Star
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { aiService } from '@/lib/ai-service';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface AIAnalyticsDashboardProps {
  eventId?: string;
  eventData?: any;
  registrations?: any[];
  feedback?: any[];
  // Or for dashboard-wide insights
  events?: any[];
  mode?: 'event' | 'dashboard';
  className?: string;
}

export function AIAnalyticsDashboard({
  eventId,
  eventData,
  registrations = [],
  feedback = [],
  events = [],
  mode = 'event',
  className,
}: AIAnalyticsDashboardProps) {
  const [insights, setInsights] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);

  const fetchInsights = async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (mode === 'event' && eventId && eventData) {
        const response = await aiService.getEventInsights({
          event_id: eventId,
          event_data: eventData,
          registrations,
          feedback,
          include_recommendations: true,
        });
        setInsights(response);
      } else if (mode === 'dashboard' && events.length > 0) {
        const response = await aiService.getDashboardInsights(events, 'month');
        setInsights(response);
      }
    } catch (err) {
      console.error('Failed to get insights:', err);
      setError('Could not generate insights');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if ((mode === 'event' && eventId && eventData) || (mode === 'dashboard' && events.length > 0)) {
      fetchInsights();
    } else {
      setIsLoading(false);
    }
  }, [eventId, events.length, mode]);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary animate-pulse" />
            <CardTitle className="text-lg">AI Insights</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <AlertTriangle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">{error}</p>
            <Button variant="link" onClick={fetchInsights}>
              Try again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!insights) {
    return null;
  }

  return (
    <Card className={cn('overflow-hidden', className)}>
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              AI Insights
              <Badge variant="secondary" className="ml-2">Beta</Badge>
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchInsights}
                disabled={isLoading}
              >
                <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
              </Button>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm">
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
            </div>
          </div>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="space-y-4">
            {/* Summary */}
            {insights.summary && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm">{insights.summary}</p>
              </div>
            )}

            {/* Key Metrics */}
            {insights.key_metrics && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {insights.key_metrics.fill_rate !== undefined && (
                  <MetricCard
                    label="Fill Rate"
                    value={`${insights.key_metrics.fill_rate}%`}
                    icon={<BarChart3 className="h-4 w-4" />}
                    trend={insights.key_metrics.fill_rate > 70 ? 'up' : 'down'}
                  />
                )}
                {insights.key_metrics.average_rating && (
                  <MetricCard
                    label="Avg Rating"
                    value={insights.key_metrics.average_rating.toFixed(1)}
                    icon={<Star className="h-4 w-4" />}
                    trend={insights.key_metrics.average_rating >= 4 ? 'up' : 'neutral'}
                  />
                )}
                {insights.key_metrics.total_comments !== undefined && (
                  <MetricCard
                    label="Comments"
                    value={insights.key_metrics.total_comments}
                    icon={<MessageSquare className="h-4 w-4" />}
                  />
                )}
                {insights.key_metrics.cancellation_rate !== undefined && (
                  <MetricCard
                    label="Cancellations"
                    value={`${insights.key_metrics.cancellation_rate}%`}
                    icon={<AlertTriangle className="h-4 w-4" />}
                    trend={insights.key_metrics.cancellation_rate < 10 ? 'up' : 'down'}
                  />
                )}
              </div>
            )}

            {/* Highlights */}
            {insights.highlights?.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  Highlights
                </h4>
                <ul className="space-y-1">
                  {insights.highlights.map((highlight: string, i: number) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-green-500 mt-1">•</span>
                      {highlight}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Concerns */}
            {insights.concerns?.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                  <TrendingDown className="h-4 w-4 text-red-500" />
                  Areas of Concern
                </h4>
                <ul className="space-y-1">
                  {insights.concerns.map((concern: string, i: number) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-red-500 mt-1">•</span>
                      {concern}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recommendations */}
            {insights.recommendations?.length > 0 && (
              <div className="pt-2 border-t">
                <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                  <Lightbulb className="h-4 w-4 text-yellow-500" />
                  AI Recommendations
                </h4>
                <ul className="space-y-1">
                  {insights.recommendations.map((rec: string, i: number) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-primary mt-1">{i + 1}.</span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Sentiment Analysis */}
            {insights.sentiment_analysis && (
              <div className="pt-2 border-t">
                <h4 className="text-sm font-medium mb-2">Feedback Sentiment</h4>
                <div className="flex gap-2">
                  <Badge
                    variant={
                      insights.sentiment_analysis.overall === 'positive'
                        ? 'default'
                        : insights.sentiment_analysis.overall === 'negative'
                        ? 'destructive'
                        : 'secondary'
                    }
                  >
                    {insights.sentiment_analysis.overall}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {(insights.sentiment_analysis.positive_ratio * 100).toFixed(0)}% positive
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

// Helper component for metrics
function MetricCard({
  label,
  value,
  icon,
  trend,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
}) {
  return (
    <div className="p-3 bg-muted/30 rounded-lg">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className={cn(
          'opacity-70',
          trend === 'up' && 'text-green-500',
          trend === 'down' && 'text-red-500'
        )}>
          {icon}
        </span>
      </div>
      <div className="text-xl font-semibold">{value}</div>
    </div>
  );
}

export default AIAnalyticsDashboard;
