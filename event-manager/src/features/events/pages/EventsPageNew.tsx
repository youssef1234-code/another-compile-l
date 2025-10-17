/**
 * Production-Ready Events Page
 * 
 * Student-facing page for browsing all available events
 * Features:
 * - Advanced filtering (type, location, date, price)
 * - Search by name, professor, description
 * - Beautiful card grid with images
 * - Sorting options
 * - Responsive design
 * - Empty states and loading skeletons
 */

import { useState, useMemo, useTransition } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Grid3x3, List, SortAsc } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { EventFilters, type EventFiltersState } from '../components/EventFilters';
import { PageHeader } from '@/components/generic';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/design-system';
import type { Event } from '@event-manager/shared';

export function EventsPage() {
  const navigate = useNavigate();
  const [isPending, startTransition] = useTransition();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<EventFiltersState>({
    search: '',
    types: [],
    location: undefined,
    dateRange: 'upcoming',
    maxPrice: undefined,
    showFreeOnly: false,
  });
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'price' | 'capacity'>('date');

  // Build backend query from filters
  const backendQuery = useMemo(() => {
    const query: any = {
      page,
      limit: 24, // More items per page for grid view
      search: filters.search || undefined,
      type: filters.types.length === 1 ? filters.types[0] : undefined,
      location: filters.location,
      onlyUpcoming: filters.dateRange === 'upcoming',
    };

    // Custom date range
    if (filters.dateRange === 'custom') {
      if (filters.dateFrom) query.startDate = filters.dateFrom;
      if (filters.dateTo) query.endDate = filters.dateTo;
    }

    // Price filters
    if (filters.showFreeOnly) {
      query.maxPrice = 0;
    } else if (filters.maxPrice) {
      query.maxPrice = filters.maxPrice;
    }

    return query;
  }, [page, filters]);

  // Fetch events with backend pagination and filtering
  const { data: eventsData, isLoading } = trpc.events.getEvents.useQuery(backendQuery);

  // Client-side sorting and type filtering (for multiple types)
  const displayedEvents = useMemo(() => {
    if (!eventsData?.events) return [];

    let events = [...eventsData.events];

    // Additional client-side filtering for multiple types (backend only supports single type)
    if (filters.types.length > 1) {
      events = events.filter((event) => filters.types.includes(event.type));
    }

    // Client-side sorting (TODO: Move to backend)
    events.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'price':
          return (a.price || 0) - (b.price || 0);
        case 'capacity':
          return (b.capacity || 0) - (a.capacity || 0); // Largest first
        case 'date':
        default:
          if (!a.startDate) return 1;
          if (!b.startDate) return -1;
          return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
      }
    });

    return events;
  }, [eventsData, filters.types, sortBy]);

  const totalPages = eventsData?.totalPages || 1;
  const totalEvents = eventsData?.total || 0;

  const handleResetFilters = () => {
    setPage(1);
    setFilters({
      search: '',
      types: [],
      location: undefined,
      dateRange: 'upcoming',
      maxPrice: undefined,
      showFreeOnly: false,
    });
  };

  const handleFiltersChange = (newFilters: EventFiltersState) => {
    startTransition(() => {
      setPage(1); // Reset to first page when filters change
      setFilters(newFilters);
    });
  };

  if (isLoading) {
    return (
      <div className="container max-w-7xl px-4 py-8">
        <Skeleton className="h-12 w-64 mb-4" />
        <Skeleton className="h-10 w-full mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-96" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="w-full px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <PageHeader
            title="Discover Events"
            description="Browse workshops, trips, conferences, and more happening at GUC"
          />

          {/* Stats */}
          <div className="flex items-center gap-4 mt-4">
            <Badge variant="secondary" className="text-sm py-1 px-3">
              {totalEvents} {totalEvents === 1 ? 'event' : 'events'} total
            </Badge>
            <Badge variant="outline" className="text-sm py-1 px-3">
              Page {page} of {totalPages}
            </Badge>
            {filters.dateRange === 'upcoming' && (
              <Badge variant="outline" className="text-sm py-1 px-3">
                Showing upcoming events
              </Badge>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="mb-8">
          <EventFilters
            filters={filters}
            onChange={handleFiltersChange}
            onReset={handleResetFilters}
          />
        </div>

        {/* View Toggle and Sort */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <SortAsc className="h-4 w-4 text-muted-foreground" />
            <Select 
              value={sortBy} 
              onValueChange={(value: any) => startTransition(() => setSortBy(value))}
            >
              <SelectTrigger className="w-[180px] h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Sort by Date</SelectItem>
                <SelectItem value="name">Sort by Name</SelectItem>
                <SelectItem value="price">Sort by Price</SelectItem>
                <SelectItem value="capacity">Sort by Capacity</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={view === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setView('grid')}
            >
              <Grid3x3 className="h-4 w-4" />
            </Button>
            <Button
              variant={view === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setView('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Events Grid/List */}
        {displayedEvents.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Calendar className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No events found</h3>
              <p className="text-muted-foreground text-center mb-4">
                Try adjusting your filters or check back later for new events
              </p>
              <Button onClick={handleResetFilters} variant="outline">
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div
              className={cn(
                'transition-opacity duration-200',
                isPending && 'opacity-60',
                view === 'grid'
                  ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
                  : 'space-y-4'
              )}
            >
              {displayedEvents.map((event) => (
                <EventCardProduction
                  key={event.id}
                  event={event}
                  view={view}
                  onClick={() => navigate(`/events/${event.id}`)}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <div className="flex items-center gap-2">
                  {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                    const pageNum = i + 1;
                    return (
                      <Button
                        key={pageNum}
                        variant={page === pageNum ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setPage(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                  {totalPages > 5 && (
                    <>
                      <span className="text-muted-foreground">...</span>
                      <Button
                        variant={page === totalPages ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setPage(totalPages)}
                      >
                        {totalPages}
                      </Button>
                    </>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// Production Event Card Component
interface EventCardProductionProps {
  event: Event;
  view: 'grid' | 'list';
  onClick: () => void;
}

function EventCardProduction({ event, view, onClick }: EventCardProductionProps) {
  const typeConfigMap: Record<string, { label: string; color: string }> = {
    WORKSHOP: { label: 'Workshop', color: 'bg-blue-500' },
    TRIP: { label: 'Trip', color: 'bg-green-500' },
    BAZAAR: { label: 'Bazaar', color: 'bg-purple-500' },
    CONFERENCE: { label: 'Conference', color: 'bg-orange-500' },
    GYM_SESSION: { label: 'Gym', color: 'bg-red-500' },
  };
  const typeConfig = typeConfigMap[event.type] || { label: event.type, color: 'bg-gray-500' };

  const capacityPercentage = 0; // TODO: Add currentRegistrations to Event type
  const isFull = false; // TODO: Calculate when currentRegistrations is available
  const isFree = !event.price || event.price === 0;

  if (view === 'list') {
    return (
      <Card
        className="cursor-pointer hover:shadow-lg transition-all"
        onClick={onClick}
      >
        <CardContent className="p-4 flex gap-4">
          <div className="w-32 h-32 rounded-lg overflow-hidden bg-muted flex-shrink-0 relative">
            {(event.images && event.images.length > 0) ? (
              <>
                <img
                  src={`/api/files/${event.images[0]}`}
                  alt={event.name}
                  className="w-full h-full object-cover"
                />
                {event.images.length > 1 && (
                  <div className="absolute top-1 right-1 bg-background/80 backdrop-blur-sm text-xs px-1.5 py-0.5 rounded">
                    +{event.images.length - 1}
                  </div>
                )}
              </>
            ) : event.imageUrl ? (
              <img
                src={event.imageUrl}
                alt={event.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-4xl">
                {event.type === 'WORKSHOP' && '📚'}
                {event.type === 'TRIP' && '✈️'}
                {event.type === 'BAZAAR' && '🛍️'}
                {event.type === 'CONFERENCE' && '🎤'}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4 mb-2">
              <h3 className="font-semibold text-lg truncate">{event.name}</h3>
              <Badge className={cn('text-white border-none', typeConfig.color)}>
                {typeConfig.label}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
              {event.description}
            </p>
            <div className="flex items-center gap-4 text-sm">
              {event.startDate && (
                <span className="text-muted-foreground">
                  📅 {formatDate(new Date(event.startDate))}
                </span>
              )}
              {event.capacity && (
                <span className="text-muted-foreground">
                  👥 {event.capacity} spots
                </span>
              )}
              <span className="font-semibold">
                {isFree ? (
                  <span className="text-emerald-600">Free</span>
                ) : (
                  <span>{event.price} EGP</span>
                )}
              </span>
              {isFull && <Badge variant="destructive">Full</Badge>}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className="group cursor-pointer overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 p-0"
      onClick={onClick}
    >
      <div className="relative h-48 overflow-hidden bg-gradient-to-br from-muted to-muted/50">
        {(event.images && event.images.length > 0) ? (
          <>
            <img
              src={`/api/files/${event.images[0]}`}
              alt={event.name}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            />
            {event.images.length > 1 && (
              <div className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm text-xs px-2 py-1 rounded-md font-medium">
                +{event.images.length - 1} images
              </div>
            )}
          </>
        ) : event.imageUrl ? (
          <img
            src={event.imageUrl}
            alt={event.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-6xl">
            {event.type === 'WORKSHOP' && '📚'}
            {event.type === 'TRIP' && '✈️'}
            {event.type === 'BAZAAR' && '🛍️'}
            {event.type === 'CONFERENCE' && '🎤'}
          </div>
        )}
        <div className="absolute top-3 left-3 flex gap-2">
          <Badge className={cn('text-white border-none shadow-md', typeConfig.color)}>
            {typeConfig.label}
          </Badge>
        </div>
        {(isFull || isFree) && (
          <div className="absolute top-3 right-3">
            {isFull ? (
              <Badge variant="destructive" className="shadow-md">
                Full
              </Badge>
            ) : isFree ? (
              <Badge className="bg-emerald-500 text-white border-none shadow-md">
                Free
              </Badge>
            ) : null}
          </div>
        )}
      </div>
      <div className="p-4 space-y-3">
        <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-primary transition-colors">
          {event.name}
        </h3>
        <p className="text-sm text-muted-foreground line-clamp-2">{event.description}</p>
        {event.type === 'WORKSHOP' && event.professorName && (
          <p className="text-sm font-medium text-primary">By Prof. {event.professorName}</p>
        )}
        <div className="space-y-2 text-sm">
          {event.startDate && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>{formatDate(new Date(event.startDate))}</span>
            </div>
          )}
        </div>
        {event.capacity && (
          <div className="pt-2 border-t">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-muted-foreground">Capacity</span>
              <span className="font-medium">
                {event.capacity} spots available
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full transition-all',
                  capacityPercentage >= 100
                    ? 'bg-destructive'
                    : capacityPercentage >= 80
                    ? 'bg-amber-500'
                    : 'bg-primary'
                )}
                style={{ width: `${Math.min(capacityPercentage, 100)}%` }}
              />
            </div>
          </div>
        )}
        <div className="flex items-center justify-between pt-2 border-t">
          <span className="text-sm text-muted-foreground">Price</span>
          <span className="font-semibold text-lg">
            {isFree ? (
              <span className="text-emerald-600">Free</span>
            ) : (
              <span>{event.price} EGP</span>
            )}
          </span>
        </div>
      </div>
    </Card>
  );
}
