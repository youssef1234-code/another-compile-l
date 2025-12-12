/**
 * AI Recommendations Component
 * 
 * Displays personalized event recommendations for users.
 * Features:
 * - Beautiful card-based display matching browse events
 * - Emojis for event types
 * - Personalized recommendation reasons
 * - Match percentage display
 */

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { 
  Sparkles, 
  RefreshCw, 
  ArrowRight,
  Star,
  Calendar,
  TrendingUp,
  Heart,
  Zap,
  Target,
  Award,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { aiService, type RecommendationRequest } from '@/lib/ai-service';
import { useNavigate } from 'react-router-dom';
import { trpc } from '@/lib/trpc';
import { EventCardImage } from '@/components/ui/event-card-image';
import { useAuthStore } from '@/store/authStore';
import { getEventTypeConfig } from '@/lib/event-colors';
import { format } from 'date-fns';

// Event type emoji mapping - matching browse events
const EVENT_TYPE_EMOJIS: Record<string, string> = {
  'WORKSHOP': '📚',
  'TRIP': '✈️',
  'CONFERENCE': '🎤',
  'GYM_SESSION': '💪',
  'BAZAAR': '🛍️',
  'OTHER': '📅',
};

// Friendly reason icons
const REASON_ICONS: Record<string, typeof Star> = {
  'interest': Heart,
  'history': Clock,
  'trending': TrendingUp,
  'popular': Zap,
  'faculty': Target,
  'rating': Star,
  'default': Award,
};

interface AIRecommendationsProps {
  userId: string;
  userRole?: string;
  userFaculty?: string;
  userInterests?: string[];
  registrationHistory?: {
    eventIds: string[];
    eventTypes: string[];
    ratedEvents?: Record<string, number>;
  };
  favoriteEventIds?: string[];
  limit?: number;
  className?: string;
  title?: string;
}

// Helper to generate user-friendly recommendation reasons
function getFormattedReason(rawReason: string, eventType: string): { text: string; icon: typeof Star } {
  const reason = rawReason.toLowerCase();
  
  if (reason.includes('interest') || reason.includes('interests')) {
    return {
      text: 'Matches your interests',
      icon: REASON_ICONS.interest,
    };
  }
  if (reason.includes('attend') || reason.includes('history') || reason.includes('previous')) {
    return {
      text: `You've enjoyed similar ${eventType.toLowerCase().replace('_', ' ')}s`,
      icon: REASON_ICONS.history,
    };
  }
  if (reason.includes('trending') || reason.includes('popular')) {
    return {
      text: 'Trending among students',
      icon: REASON_ICONS.trending,
    };
  }
  if (reason.includes('rating') || reason.includes('highly rated')) {
    return {
      text: 'Highly rated by attendees',
      icon: REASON_ICONS.rating,
    };
  }
  if (reason.includes('faculty') || reason.includes('department')) {
    return {
      text: 'Relevant to your faculty',
      icon: REASON_ICONS.faculty,
    };
  }
  
  // Default with cleaned up text
  return {
    text: rawReason.length > 50 ? rawReason.substring(0, 47) + '...' : rawReason,
    icon: REASON_ICONS.default,
  };
}

export function AIRecommendations({
  userId,
  userRole = 'STUDENT',
  userFaculty,
  userInterests: propsInterests,
  registrationHistory,
  favoriteEventIds,
  limit = 10,
  className,
  title = 'Recommended for You',
}: AIRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [factors, setFactors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  // Combine user's stated interests with attended event types
  const userInterests = useMemo(() => {
    const statedInterests = propsInterests || user?.interests || [];
    const attendedTypes = registrationHistory?.eventTypes || [];
    
    // Convert event types to interest keywords
    const typeToInterest: Record<string, string> = {
      'WORKSHOP': 'workshops',
      'TRIP': 'trips',
      'CONFERENCE': 'conferences',
      'GYM_SESSION': 'fitness',
      'BAZAAR': 'shopping'
    };
    
    const derivedInterests = attendedTypes
      .map(type => typeToInterest[type])
      .filter(Boolean);
    
    // Combine and deduplicate
    return Array.from(new Set([...statedInterests, ...derivedInterests]));
  }, [propsInterests, user?.interests, registrationHistory?.eventTypes]);

  // Fetch ALL upcoming events by requesting a very high limit
  // Backend filters out ended events by default (endDate >= now)
  const { data: eventsData } = trpc.events.getUpcoming.useQuery({
    page: 1,
    limit: 500, // High limit to fetch ALL upcoming events
  });

  const availableEvents = eventsData?.events || [];
  
  console.log(`[AIRecommendations] Fetched ${availableEvents.length} upcoming events for recommendations`);

  const fetchRecommendations = async () => {
    if (!availableEvents.length) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const request: RecommendationRequest = {
        user_profile: {
          user_id: userId,
          role: userRole,
          faculty: userFaculty,
          interests: userInterests,
        },
        registration_history: registrationHistory
          ? {
              event_ids: registrationHistory.eventIds,
              event_types: registrationHistory.eventTypes,
              rated_events: registrationHistory.ratedEvents,
            }
          : undefined,
        favorite_event_ids: favoriteEventIds,
        available_events: availableEvents.map((e: any) => ({
          id: e.id || e._id,
          name: e.name,
          type: e.type,
          description: e.description,
          faculty: e.faculty,
          startDate: e.startDate,
          averageRating: e.averageRating,
          registrationCount: e.registrationCount,
        })),
        limit,
        exclude_registered: true,
      };

      const response = await aiService.getRecommendations(request);
      console.log('[AIRecommendations] Response:', response);
      setRecommendations(response.recommendations);
      setFactors(response.personalization_factors);
    } catch (err) {
      console.error('Failed to get recommendations:', err);
      setError('Could not load recommendations');
      // Don't fallback - show the error
      setRecommendations([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, [userId, availableEvents.length]);

  if (!availableEvents.length) {
    return null;
  }

  // Generate friendly summary based on factors
  const getSummary = () => {
    if (!factors.length) return null;
    const factorMap: Record<string, string> = {
      'role': 'your student profile',
      'faculty': 'your faculty interests',
      'interests': 'what you love',
      'history': 'your past events',
      'ratings': 'events you enjoyed',
    };
    const friendlyFactors = factors.slice(0, 3).map(f => {
      const lower = f.toLowerCase();
      for (const [key, friendly] of Object.entries(factorMap)) {
        if (lower.includes(key)) return friendly;
      }
      return f;
    });
    return `Based on ${friendlyFactors.join(', ')}`;
  };

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{title}</CardTitle>
              {getSummary() && (
                <CardDescription className="text-xs mt-0.5">{getSummary()}</CardDescription>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchRecommendations}
            disabled={isLoading}
            className="h-8 w-8 p-0"
          >
            <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-3">
        {isLoading ? (
          <>
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex gap-3 p-2">
                <Skeleton className="h-16 w-16 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              </div>
            ))}
          </>
        ) : error ? (
          <div className="text-center py-6 text-muted-foreground">
            <p className="mb-2">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchRecommendations}>
              <RefreshCw className="h-3 w-3 mr-2" />
              Try again
            </Button>
          </div>
        ) : recommendations.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No recommendations available</p>
          </div>
        ) : (
          recommendations.map((event, index) => {
            const typeConfig = getEventTypeConfig(event.type);
            const emoji = EVENT_TYPE_EMOJIS[event.type] || '📅';
            const matchScore = event.recommendation_score || 0;
            const rawReason = event.recommendation_reasons?.[0] || 'Perfect for you';
            const { text: reasonText, icon: ReasonIcon } = getFormattedReason(rawReason, event.type);
            
            return (
              <div
                key={event.id || event._id}
                className={cn(
                  "group relative flex gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200",
                  "hover:bg-muted/70 hover:shadow-md hover:-translate-y-0.5",
                  "border border-transparent hover:border-primary/20"
                )}
                onClick={() => navigate(`/events/${event.id || event._id}`)}
              >
                {/* Rank indicator for top 3 */}
                {index < 3 && (
                  <div className={cn(
                    "absolute -top-1 -left-1 h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold",
                    index === 0 && "bg-yellow-400 text-yellow-900",
                    index === 1 && "bg-gray-300 text-gray-700",
                    index === 2 && "bg-amber-600 text-amber-100"
                  )}>
                    {index + 1}
                  </div>
                )}

                {/* Event Image or Emoji */}
                <div className={cn(
                  "h-16 w-16 rounded-xl overflow-hidden flex-shrink-0 ring-2 ring-background shadow-sm",
                  !event.images?.length && typeConfig.light
                )}>
                  {event.images && event.images.length > 0 ? (
                    <EventCardImage imageId={event.images[0]} alt={event.name} />
                  ) : (
                    <div className={cn(
                      "h-full w-full flex items-center justify-center text-3xl",
                      typeConfig.light
                    )}>
                      {emoji}
                    </div>
                  )}
                </div>

                {/* Event Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                      {event.name}
                    </h4>
                    {matchScore > 0 && (
                      <Badge 
                        variant="secondary" 
                        className={cn(
                          "text-xs font-bold shrink-0",
                          matchScore >= 90 && "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
                          matchScore >= 75 && matchScore < 90 && "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
                          matchScore < 75 && "bg-muted text-muted-foreground"
                        )}
                      >
                        {matchScore}% match
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                    <Badge variant="outline" className={cn("text-[10px] h-5 border-none", typeConfig.light, typeConfig.text)}>
                      {emoji} {typeConfig.label}
                    </Badge>
                    {event.startDate && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(event.startDate), 'MMM d')}
                      </span>
                    )}
                    {event.averageRating && (
                      <span className="flex items-center gap-0.5">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        {event.averageRating.toFixed(1)}
                      </span>
                    )}
                  </div>

                  {/* Recommendation Reason */}
                  <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
                    <ReasonIcon className="h-3 w-3" />
                    <span className="font-medium">{reasonText}</span>
                  </div>
                </div>

                <ArrowRight className="h-4 w-4 text-muted-foreground self-center opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}

export default AIRecommendations;
