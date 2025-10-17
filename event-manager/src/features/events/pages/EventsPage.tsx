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

import { useState, useMemo, useTransition, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Calendar, Grid3x3, List, ArrowUpDown, Loader2, CheckSquare } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { EventFilters, type EventFiltersState } from '../components/EventFilters';
import { PageHeader } from '@/components/generic';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/design-system';
import { getEventTypeConfig, getEventStatus, hasOpenRegistration, EVENT_STATUS_COLORS } from '@/lib/event-colors';
import type { Event } from '@event-manager/shared';
import { useAuthStore } from '@/store/authStore';

export function EventsPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'browse';
  
  const [isPending, startTransition] = useTransition();
  const [page, setPage] = useState(1);
  const [showOpenOnly, setShowOpenOnly] = useState(true);
  const [searchInput, setSearchInput] = useState(''); // Local state for search input
  const [debouncedSearch, setDebouncedSearch] = useState(''); // Debounced search for API
  const [filters, setFilters] = useState<EventFiltersState>({
    search: '',
    types: [],
    location: undefined,
    dateRange: 'upcoming',
    maxPrice: undefined,
    showFreeOnly: false,
  });
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'price'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
    // Refetch data when tab changes
    if (value === 'registrations') {
      myRegistrationsRefetch();
    } else {
      eventsRefetch();
    }
  };

  // Fetch user's registrations to mark registered events
  const { data: myRegistrationsData, refetch: myRegistrationsRefetch } = trpc.events.getMyRegistrations.useQuery(
    { page: 1, limit: 100 }, // Backend max limit is 100
    { enabled: !!user }
  );

  // Create a Set of registered event IDs for quick lookup
  // Per requirements: Show ALL registrations regardless of payment status
  const registeredEventIds = useMemo(() => {
    const ids = new Set<string>();
    if (myRegistrationsData?.registrations) {
      myRegistrationsData.registrations.forEach((reg: any) => {
        // Show as registered if not cancelled
        if (reg.status !== 'CANCELLED' && reg.event) {
          ids.add(reg.event._id || reg.event.id);
        }
      });
    }
    return ids;
  }, [myRegistrationsData]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      startTransition(() => {
        setDebouncedSearch(searchInput);
        setFilters(prev => ({ ...prev, search: searchInput }));
      });
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [searchInput]);

  const toggleSortDirection = useCallback(() => {
    startTransition(() => {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    });
  }, []);

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
  const { data: eventsData, isLoading, refetch: eventsRefetch } = trpc.events.getEvents.useQuery(backendQuery);

  // Client-side sorting and type filtering (for multiple types)
  const displayedEvents = useMemo(() => {
    // If on "My Registrations" tab, use events from registrations data
    if (activeTab === 'registrations') {
      if (!myRegistrationsData?.registrations) return [];
      
      // Extract events from registrations and filter out cancelled ones
      let events = myRegistrationsData.registrations
        .filter((reg: any) => reg.status !== 'CANCELLED' && reg.event)
        .map((reg: any) => {
          const event = reg.event;
          // Ensure ID is consistent - use _id or id
          return {
            ...event,
            id: event.id || event._id
          };
        });

      // Apply filters
      if (filters.types.length > 0) {
        events = events.filter((event: any) => filters.types.includes(event.type));
      }

      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        events = events.filter((event: any) => 
          event.name.toLowerCase().includes(searchLower) ||
          event.description?.toLowerCase().includes(searchLower) ||
          event.professorName?.toLowerCase().includes(searchLower)
        );
      }

      // Apply sorting
      events.sort((a: any, b: any) => {
        let comparison = 0;
        
        switch (sortBy) {
          case 'name':
            comparison = a.name.localeCompare(b.name);
            break;
          case 'price':
            comparison = (a.price || 0) - (b.price || 0);
            break;
          case 'date':
          default:
            if (!a.startDate) return 1;
            if (!b.startDate) return -1;
            comparison = new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
            break;
        }
        
        return sortDirection === 'asc' ? comparison : -comparison;
      });

      return events;
    }

    // Browse tab - use regular events data
    if (!eventsData?.events) return [];

    let events = [...eventsData.events];

    // IMPORTANT: Only show WORKSHOP, TRIP, CONFERENCE in browse events
    // Exclude: GYM_SESSION (handled by gym pages), BAZAAR (vendor-specific)
    events = events.filter((event) => 
      event.type === 'WORKSHOP' || event.type === 'TRIP' || event.type === 'CONFERENCE'
    );

    // Filter by open registration status (only on browse tab)
    if (showOpenOnly) {
      events = events.filter((event) => hasOpenRegistration(event));
    }

    // Additional client-side filtering for multiple types (backend only supports single type)
    if (filters.types.length > 1) {
      events = events.filter((event) => filters.types.includes(event.type));
    }

    // Simple sorting with direction support
    events.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'price':
          comparison = (a.price || 0) - (b.price || 0);
          break;
        case 'date':
        default:
          if (!a.startDate) return 1;
          if (!b.startDate) return -1;
          comparison = new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
          break;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return events;
  }, [eventsData, myRegistrationsData, filters, sortBy, sortDirection, showOpenOnly, activeTab, registeredEventIds]);

  const totalPages = eventsData?.totalPages || 1;
  const totalEvents = activeTab === 'registrations' 
    ? displayedEvents.length 
    : (eventsData?.total || 0);

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
        <div className="mb-6">
          <PageHeader
            title="Events"
            description="Browse workshops, trips, conferences, and more or manage your registrations"
          />
        </div>

        {/* Single unified view - no tabs content, just conditional rendering */}
        <div className="space-y-6">
          {/* Filters */}
          <div className={cn("transition-opacity duration-200", isPending && "opacity-60")}>
            <EventFilters
              filters={filters}
              onChange={handleFiltersChange}
              onReset={handleResetFilters}
              searchInput={searchInput}
              onSearchInputChange={setSearchInput}
              isSearching={searchInput !== debouncedSearch}
              hidePrice={activeTab === 'registrations'}
            />
          </div>

          {/* Toolbar with Tabs */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground font-medium">
                {totalEvents} {totalEvents === 1 ? 'event' : 'events'}
              </span>
              {activeTab === 'browse' && (
                <Button
                  variant={showOpenOnly ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowOpenOnly(!showOpenOnly)}
                  className="gap-2"
                >
                  <Calendar className="h-4 w-4" />
                  Open Registration
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Tabs beside sort controls */}
              <Tabs value={activeTab} onValueChange={handleTabChange}>
                <TabsList>
                  <TabsTrigger value="browse" className="gap-2">
                    <Calendar className="h-4 w-4" />
                    Browse
                  </TabsTrigger>
                  <TabsTrigger value="registrations" className="gap-2">
                    <CheckSquare className="h-4 w-4" />
                    My Registrations
                  </TabsTrigger>
                </TabsList>
              </Tabs>

                {/* Sort Controls */}
                <Select 
                  value={sortBy} 
                  onValueChange={(value: any) => startTransition(() => setSortBy(value))}
                >
                  <SelectTrigger className="w-[130px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">Date</SelectItem>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="price">Price</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={toggleSortDirection}
                  title={sortDirection === 'asc' ? 'Ascending' : 'Descending'}
                >
                  <ArrowUpDown className="h-4 w-4" />
                </Button>
                
                {/* View Toggle */}
                <div className="flex border rounded-lg">
                  <Button
                    variant={view === 'grid' ? 'default' : 'ghost'}
                    size="icon"
                    onClick={() => setView('grid')}
                    className="rounded-r-none"
                  >
                    <Grid3x3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={view === 'list' ? 'default' : 'ghost'}
                    size="icon"
                    onClick={() => setView('list')}
                    className="rounded-l-none"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Events Grid/List */}
            {displayedEvents.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <Calendar className="h-4 w-16 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No events found</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    {activeTab === 'registrations' 
                      ? "You haven't registered for any events yet"
                      : "Try adjusting your filters or check back later for new events"}
                  </p>
                  {activeTab === 'browse' && (
                    <Button onClick={handleResetFilters} variant="outline">
                      Clear Filters
                    </Button>
                  )}
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
                      isRegistered={registeredEventIds.has(event.id)}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2">
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
    </div>
  );
}

// Production Event Card Component
interface EventCardProductionProps {
  event: Event;
  view: 'grid' | 'list';
  onClick: () => void;
  isRegistered?: boolean;
}

// Component to load and display event card image
function EventCardImage({ imageId, alt }: { imageId: string; alt: string }) {
  const { data: fileData, isLoading } = trpc.files.downloadPublicFile.useQuery(
    { fileId: imageId },
    { staleTime: 5 * 60 * 1000, retry: 1 }
  );

  const imageUrl = useMemo(() => {
    if (!fileData) return null;
    return `data:${fileData.mimeType};base64,${fileData.data}`;
  }, [fileData]);

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!imageUrl) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground">
        Failed to load
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={alt}
      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
    />
  );
}

function EventCardProduction({ event, view, onClick, isRegistered }: EventCardProductionProps) {
  const typeConfig = getEventTypeConfig(event.type);
  const eventStatus = getEventStatus(event);
  const statusConfig = EVENT_STATUS_COLORS[eventStatus as keyof typeof EVENT_STATUS_COLORS] || EVENT_STATUS_COLORS.UPCOMING;

  const capacityPercentage = event.capacity ? ((event.registeredCount || 0) / event.capacity) * 100 : 0;
  const isFull = event.capacity ? (event.registeredCount || 0) >= event.capacity : false;
  const isFree = !event.price || event.price === 0;

  if (view === 'list') {
    return (
      <Card
        className="cursor-pointer hover:shadow-lg transition-all"
        onClick={onClick}
      >
        <CardContent className="p-4 flex gap-4">
          <div className="w-32 h-32 rounded-lg overflow-hidden bg-muted flex-shrink-0 relative group/img">
            {(event.images && event.images.length > 0) ? (
              <>
                <EventCardImage imageId={event.images[0]} alt={event.name} />
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
              <div className="flex gap-2 flex-shrink-0 flex-wrap">
                <Badge className={cn('text-white border-none', typeConfig.bg)}>
                  {typeConfig.label}
                </Badge>
                <Badge variant={eventStatus === 'ENDED' ? 'secondary' : eventStatus === 'FULL' ? 'destructive' : 'default'} className={cn(eventStatus === 'OPEN' && statusConfig.bg, 'text-white border-none')}>
                  {statusConfig.label}
                </Badge>
                {isRegistered && (
                  <Badge className="bg-blue-600 text-white border-none">
                    <CheckSquare className="h-3 w-3 mr-1" />
                    Registered
                  </Badge>
                )}
              </div>
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
            <EventCardImage imageId={event.images[0]} alt={event.name} />
            {event.images.length > 1 && (
              <div className="absolute top-2 right-2 bg-background/90 backdrop-blur-md text-xs px-2 py-1 rounded-md font-medium shadow-lg">
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
        <div className="absolute top-3 left-3 flex gap-2 flex-wrap">
          <Badge className={cn('text-white border-none shadow-lg', typeConfig.bg)}>
            {typeConfig.label}
          </Badge>
          <Badge 
            variant={eventStatus === 'ENDED' ? 'secondary' : eventStatus === 'FULL' ? 'destructive' : 'default'} 
            className={cn(
              eventStatus === 'OPEN' && statusConfig.bg, 
              eventStatus === 'ONGOING' && 'bg-emerald-500',
              'text-white border-none shadow-lg'
            )}
          >
            {statusConfig.label}
          </Badge>
          {isRegistered && (
            <Badge className="bg-blue-600 text-white border-none shadow-lg">
              <CheckSquare className="h-3 w-3 mr-1" />
              Registered
            </Badge>
          )}
        </div>
        {(isFree) && (
          <div className="absolute top-3 right-3">
            <Badge className="bg-emerald-500 text-white border-none shadow-md">
              Free
            </Badge>
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
