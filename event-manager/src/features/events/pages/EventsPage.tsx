/**
 * Production-Ready Events Page
 *
 * Student-facing page for browsing all available events
 * Features:
 * - Backend-driven filtering (type, location, date, price)
 * - Backend search by name, professor, description
 * - Backend sorting
 * - Beautiful card grid with images
 * - Responsive design
 * - Empty states and loading skeletons
 * - URL state management for all filters
 */

import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  Grid3x3,
  List,
  ArrowUpDown,
  Loader2,
  CheckSquare,
} from "lucide-react";
import {
  useQueryState,
  parseAsInteger,
  parseAsString,
  parseAsArrayOf,
  parseAsJson,
} from "nuqs";
import { trpc } from "@/lib/trpc";
import {
  EventFilters,
  type EventFiltersState,
} from "../components/EventFilters";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/design-system";
import {
  getEventTypeConfig,
  getEventStatus,
  EVENT_STATUS_COLORS,
} from "@/lib/event-colors";
import type { Event, Registration } from "@event-manager/shared";
import { useAuthStore } from "@/store/authStore";
import { usePageMeta } from "@/components/layout/page-meta-context";

// Type for populated registration from backend
type PopulatedRegistration = Registration & {
  event?: Event;
};

export function EventsPage() {
  const { setPageMeta } = usePageMeta();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  // URL state management - matching BackOfficeEventsPage pattern
  const [activeTab, setActiveTab] = useQueryState(
    "tab",
    parseAsString.withDefault("browse")
  );
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const [perPage] = useQueryState("perPage", parseAsInteger.withDefault(24));
  const [search, setSearch] = useQueryState(
    "search",
    parseAsString.withDefault("")
  );
  const [view, setView] = useQueryState(
    "view",
    parseAsString.withDefault("grid")
  );

  // Sort state - proper format for getAllEvents
  const [sortState, setSortState] = useQueryState(
    "sort",
    parseAsJson<Array<{ id: string; desc: boolean }>>((v) => {
      if (!v) return null;
      if (typeof v === "string") {
        try {
          return JSON.parse(v) as Array<{ id: string; desc: boolean }>;
        } catch {
          return null;
        }
      }
      return v as Array<{ id: string; desc: boolean }>;
    }).withDefault([{ id: "startDate", desc: false }])
  );

  // Simple filters from URL
  const [typeFilter, setTypeFilter] = useQueryState(
    "type",
    parseAsArrayOf(parseAsString, ",").withDefault([])
  );
  const [locationFilter, setLocationFilter] = useQueryState(
    "location",
    parseAsString.withDefault("")
  );
  const [statusFilter] = useQueryState(
    "status",
    parseAsArrayOf(parseAsString, ",").withDefault([])
  );

  // Advanced filters URL state
  const [dateRange, setDateRange] = useQueryState(
    "dateRange",
    parseAsString.withDefault("")
  );
  const [dateFrom, setDateFrom] = useQueryState(
    "dateFrom",
    parseAsString.withDefault("")
  );
  const [dateTo, setDateTo] = useQueryState(
    "dateTo",
    parseAsString.withDefault("")
  );
  const [maxPrice, setMaxPrice] = useQueryState(
    "maxPrice",
    parseAsString.withDefault("")
  );
  const [showFreeOnly, setShowFreeOnly] = useQueryState(
    "freeOnly",
    parseAsString.withDefault("")
  );

  // Local search input state for debouncing
  const [searchInput, setSearchInput] = useState(search);

  useEffect(() => {
    setPageMeta({
      title: "Events",
      description:
        "Browse workshops, trips, conferences, and more or manage your registrations",
    });
  }, [setPageMeta]);

  // Sync search input with URL state (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== search) {
        setSearch(searchInput);
        setPage(1);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput, search, setSearch, setPage]);

  const handleTabChange = (tab: "browse" | "registrations") => {
    setActiveTab(tab);
    setPage(1);
  };

  // Build simple filters for getAllEvents
  const filters = useMemo(() => {
    const result: Record<string, string[]> = {};

    // Always exclude gym sessions and booths from public events page
    const publicTypes = ["WORKSHOP", "TRIP", "CONFERENCE", "BAZAAR"];

    if (typeFilter.length > 0) {
      // User selected specific types - only include those
      result.type = typeFilter;
    } else {
      // No user selection - show all public event types
      result.type = publicTypes;
    }

    // Location filter - convert single value to array format
    if (locationFilter) {
      result.location = [locationFilter];
    }

    if (statusFilter.length > 0) {
      result.status = statusFilter;
    }

    return result;
  }, [typeFilter, locationFilter, statusFilter]);

  // Build extended filters for advanced options (date range, price)
  const extendedFilters = useMemo(() => {
    type ExtendedFilter = {
      id: string;
      value: string | string[];
      operator:
        | "iLike"
        | "notILike"
        | "eq"
        | "ne"
        | "isEmpty"
        | "isNotEmpty"
        | "lt"
        | "lte"
        | "gt"
        | "gte"
        | "isBetween"
        | "inArray"
        | "notInArray"
        | "isRelativeToToday";
      variant:
        | "text"
        | "number"
        | "range"
        | "date"
        | "dateRange"
        | "boolean"
        | "select"
        | "multiSelect";
      filterId: string;
    };

    const result: ExtendedFilter[] = [];

    // Date range filter
    if (dateRange) {
      const now = new Date();
      let startDate: Date | null = null;
      let endDate: Date | null = null;

      switch (dateRange) {
        case "this_week": {
          const today = new Date(now);
          const dayOfWeek = today.getDay();
          const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
          startDate = new Date(today);
          startDate.setDate(today.getDate() + diffToMonday);
          startDate.setHours(0, 0, 0, 0);

          endDate = new Date(startDate);
          endDate.setDate(startDate.getDate() + 6);
          endDate.setHours(23, 59, 59, 999);
          break;
        }
        case "this_month": {
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date(
            now.getFullYear(),
            now.getMonth() + 1,
            0,
            23,
            59,
            59,
            999
          );
          break;
        }
        case "custom": {
          if (dateFrom) startDate = new Date(dateFrom);
          if (dateTo) endDate = new Date(dateTo);
          break;
        }
      }

      if (startDate && endDate) {
        result.push({
          id: "startDate",
          value: [startDate.toISOString(), endDate.toISOString()],
          operator: "isBetween" as const,
          variant: "dateRange" as const,
          filterId: "date-range-filter",
        });
      }
    }

    // Price filter
    if (showFreeOnly === "true") {
      result.push({
        id: "price",
        value: "0",
        operator: "eq" as const,
        variant: "number" as const,
        filterId: "free-only-filter",
      });
    } else if (maxPrice) {
      result.push({
        id: "price",
        value: maxPrice,
        operator: "lte" as const,
        variant: "number" as const,
        filterId: "max-price-filter",
      });
    }

    return result.length > 0 ? result : undefined;
  }, [dateRange, dateFrom, dateTo, maxPrice, showFreeOnly]);

  // Parse sort state
  const parsedSort = useMemo(() => {
    try {
      if (Array.isArray(sortState)) {
        return sortState as Array<{ id: string; desc: boolean }>;
      }
      return [{ id: "startDate", desc: false }];
    } catch {
      return [{ id: "startDate", desc: false }];
    }
  }, [sortState]);

  // Fetch events for browse tab using getAllEvents with proper sorting
  const { data: browseData, isLoading: isBrowseLoading } =
    trpc.events.getAllEvents.useQuery(
      {
        page,
        perPage,
        search: search || undefined,
        sort: parsedSort,
        filters: Object.keys(filters).length > 0 ? filters : undefined,
        extendedFilters: extendedFilters,
        joinOperator: "and" as const,
      },
      {
        enabled: activeTab === "browse",
        placeholderData: (previousData) => previousData,
        staleTime: 5000,
      }
    );

  // Fetch user's registrations for "My Registrations" tab
  const { data: registrationsData, isLoading: isRegistrationsLoading } =
    trpc.events.getMyRegistrations.useQuery(
      {
        page: 1,
        limit: 100,
      },
      {
        enabled: activeTab === "registrations" && !!user,
        staleTime: 5000,
      }
    );

  // Fetch user's registrations to mark registered events in browse tab
  const { data: myRegistrationsData } = trpc.events.getMyRegistrations.useQuery(
    { page: 1, limit: 100 },
    { enabled: !!user && activeTab === "browse" }
  );

  // Create a Set of registered event IDs for quick lookup
  const registeredEventIds = useMemo(() => {
    const ids = new Set<string>();
    if (myRegistrationsData?.registrations) {
      (myRegistrationsData.registrations as Registration[]).forEach((reg) => {
        if (reg.status !== "CANCELLED" && reg.eventId) {
          ids.add(reg.eventId);
        }
      });
    }
    return ids;
  }, [myRegistrationsData]);

  // Display events based on active tab with whitelist filtering
  const displayedEvents = useMemo(() => {
    let events: Event[] = [];

    if (activeTab === "registrations") {
      const registrations = registrationsData?.registrations as
        | PopulatedRegistration[]
        | undefined;
      if (!registrations) return [];

      // Extract populated events from registrations
      events = registrations
        .map((reg) => reg.event)
        .filter((event): event is Event => !!event);
    } else {
      // Browse tab - get events from backend
      events = browseData?.events || [];
    }

    // Filter events based on whitelist status
    if (!user) return events;

    return events.filter((event) => {
      // Type assertion to access whitelist fields
      const eventWithWhitelist = event as Event & {
        whitelistedUsers?: string[];
        whitelistedRoles?: string[];
      };

      const whitelistedUsers = eventWithWhitelist.whitelistedUsers || [];
      const whitelistedRoles = eventWithWhitelist.whitelistedRoles || [];

      // If both arrays are empty, event is not whitelisted (show to everyone)
      if (whitelistedUsers.length === 0 && whitelistedRoles.length === 0) {
        return true;
      }

      // Event is whitelisted, check if user has access
      const isUserWhitelisted = whitelistedUsers.includes(user.id);
      const isRoleWhitelisted = whitelistedRoles.includes(user.role);

      return isUserWhitelisted || isRoleWhitelisted;
    });
  }, [browseData, registrationsData, activeTab, user]);

  const totalPages = activeTab === "browse" ? browseData?.totalPages || 1 : 1;
  const totalEvents =
    activeTab === "browse" ? browseData?.total || 0 : displayedEvents.length;

  const isLoading =
    activeTab === "browse" ? isBrowseLoading : isRegistrationsLoading;

  // Helper to update sort
  const updateSort = (field: string) => {
    setSortState((prev) => {
      const existing = prev.find((s) => s.id === field);
      if (existing) {
        // Toggle direction
        return [{ id: field, desc: !existing.desc }];
      }
      // New sort field
      return [{ id: field, desc: false }];
    });
  };

  const getCurrentSortDirection = (field: string): "asc" | "desc" => {
    const sort = parsedSort.find((s) => s.id === field);
    return sort?.desc ? "desc" : "asc";
  };

  // Sync filters state for EventFilters component
  const filtersState = useMemo(
    (): EventFiltersState => ({
      search: search,
      types: typeFilter,
      location: (locationFilter as "ON_CAMPUS" | "OFF_CAMPUS") || undefined,
      dateRange:
        (dateRange as "upcoming" | "this_week" | "this_month" | "custom") ||
        undefined,
      dateFrom: dateFrom ? new Date(dateFrom) : undefined,
      dateTo: dateTo ? new Date(dateTo) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      showFreeOnly: showFreeOnly === "true",
    }),
    [
      search,
      typeFilter,
      locationFilter,
      dateRange,
      dateFrom,
      dateTo,
      maxPrice,
      showFreeOnly,
    ]
  );

  const handleResetFilters = () => {
    setPage(1);
    setSearch("");
    setTypeFilter([]);
    setLocationFilter("");
    setDateRange("");
    setDateFrom("");
    setDateTo("");
    setMaxPrice("");
    setShowFreeOnly("");
    setSearchInput("");
  };

  const handleFiltersChange = (newFilters: EventFiltersState) => {
    setPage(1);
    setSearch(newFilters.search);
    setTypeFilter(newFilters.types);
    setLocationFilter(newFilters.location || "");
    setDateRange(newFilters.dateRange || "");
    setDateFrom(newFilters.dateFrom ? newFilters.dateFrom.toISOString() : "");
    setDateTo(newFilters.dateTo ? newFilters.dateTo.toISOString() : "");
    setMaxPrice(newFilters.maxPrice ? String(newFilters.maxPrice) : "");
    setShowFreeOnly(newFilters.showFreeOnly ? "true" : "");
    setSearchInput(newFilters.search);
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
    <div className="flex flex-col gap-6 p-6">
      {/* Filters */}
      <EventFilters
        filters={filtersState}
        onChange={handleFiltersChange}
        onReset={handleResetFilters}
        searchInput={searchInput}
        onSearchInputChange={setSearchInput}
        isSearching={searchInput !== search}
        hidePrice={activeTab === "registrations"}
      />

      {/* Toolbar - Gym page style */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground font-medium">
            {totalEvents} {totalEvents === 1 ? "event" : "events"}
          </span>

          {/* View Mode Toggle - Gym page style */}
          <div className="flex items-center gap-2 border rounded-lg p-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleTabChange("browse")}
              className={cn(
                "gap-2 transition-all",
                activeTab === "browse"
                  ? "bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary"
                  : "hover:bg-muted text-muted-foreground"
              )}
            >
              <Calendar className="h-4 w-4" />
              Browse Events
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleTabChange("registrations")}
              className={cn(
                "gap-2 transition-all",
                activeTab === "registrations"
                  ? "bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary"
                  : "hover:bg-muted text-muted-foreground"
              )}
            >
              <CheckSquare className="h-4 w-4" />
              My Registrations
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Sort Controls */}
          <Select
            value={parsedSort[0]?.id || "startDate"}
            onValueChange={(value: string) => updateSort(value)}
          >
            <SelectTrigger className="w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="startDate">Date</SelectItem>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="price">Price</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              const currentField = parsedSort[0]?.id || "startDate";
              updateSort(currentField);
            }}
            title={
              getCurrentSortDirection(parsedSort[0]?.id || "startDate") ===
              "asc"
                ? "Ascending"
                : "Descending"
            }
          >
            <ArrowUpDown className="h-4 w-4" />
          </Button>

          {/* View Toggle */}
          <div className="flex border rounded-lg">
            <Button
              variant={view === "grid" ? "default" : "ghost"}
              size="icon"
              onClick={() => setView("grid")}
              className="rounded-r-none"
            >
              <Grid3x3 className="h-4 w-4" />
            </Button>
            <Button
              variant={view === "list" ? "default" : "ghost"}
              size="icon"
              onClick={() => setView("list")}
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
            <Calendar className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No events found</h3>
            <p className="text-muted-foreground text-center mb-4">
              {activeTab === "registrations"
                ? "You haven't registered for any events yet"
                : "Try adjusting your filters or check back later for new events"}
            </p>
            {activeTab === "browse" && (
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
              view === "grid"
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                : "space-y-4"
            )}
          >
            {displayedEvents.map((event) => {
              // Check if the current user is a professor who owns this workshop
              const eventCreatorId =
                typeof event.createdBy === "object" && event.createdBy !== null
                  ? (event.createdBy as { id?: string }).id
                  : event.createdBy;

              const isProfessorOwned =
                user?.role === "PROFESSOR" &&
                event.type === "WORKSHOP" &&
                eventCreatorId === user.id;

              return (
                <EventCardProduction
                  key={event.id}
                  event={event}
                  view={view === "grid" || view === "list" ? view : "grid"}
                  onClick={() => navigate(`/events/${event.id}`)}
                  isRegistered={registeredEventIds.has(event.id)}
                  isProfessorOwned={isProfessorOwned}
                />
              );
            })}
          </div>

          {/* Pagination - only for browse tab */}
          {activeTab === "browse" && totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(Math.max(1, page - 1))}
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
                      variant={page === pageNum ? "default" : "outline"}
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
                      variant={page === totalPages ? "default" : "outline"}
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
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Production Event Card Component
interface EventCardProductionProps {
  event: Event;
  view: "grid" | "list";
  onClick: () => void;
  isRegistered?: boolean;
  isProfessorOwned?: boolean; // New prop to indicate if the professor owns this workshop
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

function EventCardProduction({
  event,
  view,
  onClick,
  isRegistered,
  isProfessorOwned,
}: EventCardProductionProps) {
  const typeConfig = getEventTypeConfig(event.type);
  const eventStatus = getEventStatus(event);
  const statusConfig =
    EVENT_STATUS_COLORS[eventStatus as keyof typeof EVENT_STATUS_COLORS] ||
    EVENT_STATUS_COLORS.UPCOMING;

  const capacityPercentage = event.capacity
    ? ((event.registeredCount || 0) / event.capacity) * 100
    : 0;
  const isFull = event.capacity
    ? (event.registeredCount || 0) >= event.capacity
    : false;
  const isFree = !event.price || event.price === 0;

  // Check if event is whitelisted
  const { data: isWhitelisted } = trpc.events.checkEventWhitelisted.useQuery(
    { eventId: event.id },
    { enabled: !!event.id }
  );

  if (view === "list") {
    return (
      <Card
        className="cursor-pointer hover:shadow-lg transition-all"
        onClick={onClick}
      >
        <CardContent className="p-4 flex gap-4">
          <div className="w-32 h-32 rounded-lg overflow-hidden bg-muted flex-shrink-0 relative group/img">
            {event.images && event.images.length > 0 ? (
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
                {event.type === "WORKSHOP" && "📚"}
                {event.type === "TRIP" && "✈️"}
                {event.type === "BAZAAR" && "🛍️"}
                {event.type === "CONFERENCE" && "🎤"}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4 mb-2">
              <h3 className="font-semibold text-lg truncate">{event.name}</h3>
              <div className="flex gap-2 flex-shrink-0 flex-wrap">
                <Badge className={cn("text-white border-none", typeConfig.bg)}>
                  {typeConfig.label}
                </Badge>
                <Badge
                  variant={
                    eventStatus === "ENDED"
                      ? "secondary"
                      : eventStatus === "FULL"
                      ? "destructive"
                      : "default"
                  }
                  className={cn(
                    eventStatus === "OPEN" && statusConfig.bg,
                    "text-white border-none"
                  )}
                >
                  {statusConfig.label}
                </Badge>
                {isProfessorOwned && (
                  <Badge className="bg-purple-600 text-white border-none">
                    Your Workshop
                  </Badge>
                )}
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
            <div className="flex items-center gap-4 text-sm flex-wrap">
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
              {isWhitelisted && (
                <Badge className="bg-amber-500 text-white border-none">
                  🔒 Whitelisted
                </Badge>
              )}
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
        {event.images && event.images.length > 0 ? (
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
            {event.type === "WORKSHOP" && "📚"}
            {event.type === "TRIP" && "✈️"}
            {event.type === "BAZAAR" && "🛍️"}
            {event.type === "CONFERENCE" && "🎤"}
          </div>
        )}
        <div className="absolute top-3 left-3 flex gap-2 flex-wrap">
          <Badge
            className={cn("text-white border-none shadow-lg", typeConfig.bg)}
          >
            {typeConfig.label}
          </Badge>
          <Badge
            variant={
              eventStatus === "ENDED"
                ? "secondary"
                : eventStatus === "FULL"
                ? "destructive"
                : "default"
            }
            className={cn(
              eventStatus === "OPEN" && statusConfig.bg,
              eventStatus === "ONGOING" && "bg-emerald-500",
              "text-white border-none shadow-lg"
            )}
          >
            {statusConfig.label}
          </Badge>
          {isProfessorOwned && (
            <Badge className="bg-purple-600 text-white border-none shadow-lg">
              Your Workshop
            </Badge>
          )}
          {isRegistered && (
            <Badge className="bg-blue-600 text-white border-none shadow-lg">
              <CheckSquare className="h-3 w-3 mr-1" />
              Registered
            </Badge>
          )}
        </div>
        <div className="absolute top-3 right-3 flex flex-col gap-2 items-end">
          {isFree && (
            <Badge className="bg-emerald-500 text-white border-none shadow-md">
              Free
            </Badge>
          )}
          {isWhitelisted && (
            <Badge className="bg-amber-500 text-white border-none shadow-md">
              🔒 Whitelisted
            </Badge>
          )}
        </div>
      </div>
      <div className="p-4 space-y-3">
        <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-primary transition-colors">
          {event.name}
        </h3>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {event.description}
        </p>
        {event.type === "WORKSHOP" && event.professorName && (
          <p className="text-sm font-medium text-primary">
            By Prof. {event.professorName}
          </p>
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
                  "h-full transition-all",
                  capacityPercentage >= 100
                    ? "bg-destructive"
                    : capacityPercentage >= 80
                    ? "bg-amber-500"
                    : "bg-primary"
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
