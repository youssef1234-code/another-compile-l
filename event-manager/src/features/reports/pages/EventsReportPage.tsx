import { Card } from "@/components/ui/card";
import { useQueryState, parseAsString, parseAsArrayOf } from "nuqs";
import { useMemo, useState } from "react";
import { Users, Calendar, GraduationCap } from "lucide-react";
import { trpc } from "@/lib/trpc";
import NumberFlow from "@number-flow/react";
import { EventFilters, type EventFiltersState } from "@/features/events/components/EventFilters";
import { Pie, PieChart, Cell, Legend } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

export function EventsReportPage() {
  const [search, setSearch] = useQueryState("search", parseAsString.withDefault(""));
  const [typeFilter, setTypeFilter] = useQueryState("type", parseAsArrayOf(parseAsString, ",").withDefault([]));
  const [locationFilter, setLocationFilter] = useQueryState("location", parseAsString.withDefault(""));
  const [dateRange, setDateRange] = useQueryState("dateRange", parseAsString.withDefault(""));
  const [dateFrom, setDateFrom] = useQueryState("dateFrom", parseAsString.withDefault(""));
  const [dateTo, setDateTo] = useQueryState("dateTo", parseAsString.withDefault(""));
  const [maxPrice, setMaxPrice] = useQueryState("maxPrice", parseAsString.withDefault(""));
  const [showFreeOnly, setShowFreeOnly] = useQueryState("showFreeOnly", parseAsString.withDefault(""));
  const [searchInput, setSearchInput] = useState(search);

  // Sync filters state for EventFilters component
  const filtersState = useMemo((): EventFiltersState => ({
    search: search,
    types: typeFilter,
    location: (locationFilter as 'ON_CAMPUS' | 'OFF_CAMPUS') || undefined,
    dateRange: (dateRange as 'upcoming' | 'this_week' | 'this_month' | 'custom') || undefined,
    dateFrom: dateFrom ? new Date(dateFrom) : undefined,
    dateTo: dateTo ? new Date(dateTo) : undefined,
    maxPrice: maxPrice ? Number(maxPrice) : undefined,
    showFreeOnly: showFreeOnly === 'true',
  }), [search, typeFilter, locationFilter, dateRange, dateFrom, dateTo, maxPrice, showFreeOnly]);

  // Build filters for API from filtersState
  const filters = useMemo(() => {
    const result: Record<string, string[]> = {};
    if (filtersState.types.length > 0) result.type = filtersState.types;
    if (filtersState.location) result.location = [filtersState.location];
    if (filtersState.dateRange) result.dateRange = [filtersState.dateRange];
    if (filtersState.dateFrom) result.dateFrom = [filtersState.dateFrom.toISOString()];
    if (filtersState.dateTo) result.dateTo = [filtersState.dateTo.toISOString()];
    if (filtersState.maxPrice !== undefined) result.maxPrice = [String(filtersState.maxPrice)];
    return result;
  }, [filtersState]);

  console.log("Applied Filters:", filters);

  const { data } = trpc.events.getAllEvents.useQuery(
    {
      perPage: 1000,
      //search: filtersState.search || undefined,
      //filters: Object.keys(filters).length > 0 ? filters : undefined,
    },
    /* {
      placeholderData: (previousData) => previousData,
      staleTime: 5000,
    } */
  );

  console.log("Events Report Data:", data?.events);

  const numberOfEvents = data?.total || 0;
  const numberOfAttendees = data?.events.reduce((total, event) => total + (event.registeredCount || 0), 0) || 0;

  // Calculate faculty distribution from events
  const facultyData = useMemo(() => {
    const counts: Record<string, number> = {};

    data?.events.forEach(event => {
      if (event.faculty && event.registeredCount) {
        counts[event.faculty] = (counts[event.faculty] || 0) + event.registeredCount;
      }
    });

    const sortedEntries = Object.entries(counts).sort((a, b) => b[1] - a[1]);

    return sortedEntries.map(([faculty, count], index) => {
      // Generate blue gradient from light to dark
      const lightness = 70 - (index * 10); // 70%, 60%, 50%, 40%, etc.
      return {
        faculty,
        attendees: count,
        fill: `hsl(220, 80%, ${lightness}%)`,
      };
    });
  }, [data]);

  // Calculate event type distribution
  const eventTypeData = useMemo(() => {
    const counts: Record<string, number> = {};

    data?.events.forEach(event => {
      counts[event.type] = (counts[event.type] || 0) + 1;
    });

    const sortedEntries = Object.entries(counts).sort((a, b) => b[1] - a[1]);

    return sortedEntries.map(([type, count], index) => {
      // Generate blue gradient from light to dark
      const lightness = 70 - (index * 10); // 70%, 60%, 50%, 40%, etc.
      return {
        type,
        events: count,
        fill: `hsl(220, 80%, ${lightness}%)`,
      };
    });
  }, [data]);


  const handleResetFilters = () => {
    setSearch('');
    setTypeFilter([]);
    setLocationFilter('');
    setDateRange('');
    setDateFrom('');
    setDateTo('');
    setMaxPrice('');
    setShowFreeOnly('');
    setSearchInput('');
  };

  const handleFiltersChange = (newFilters: EventFiltersState) => {
    setSearch(newFilters.search);
    setTypeFilter(newFilters.types);
    setLocationFilter(newFilters.location || '');
    setDateRange(newFilters.dateRange || '');
    setDateFrom(newFilters.dateFrom ? newFilters.dateFrom.toISOString() : '');
    setDateTo(newFilters.dateTo ? newFilters.dateTo.toISOString() : '');
    setMaxPrice(newFilters.maxPrice ? String(newFilters.maxPrice) : '');
    setShowFreeOnly(newFilters.showFreeOnly ? 'true' : '');
    setSearchInput(newFilters.search);
  };

  return (
    <div className='flex flex-col gap-6 p-6'>
      {/* Filters */}
      <EventFilters
        filters={filtersState}
        onChange={handleFiltersChange}
        onReset={handleResetFilters}
        searchInput={searchInput}
        onSearchInputChange={setSearchInput}
        isSearching={searchInput !== search}
        hidePrice={true}
      />

      {/* Stats Cards */}
      <div className='grid gap-6 md:grid-cols-3'>

        <Card className='flex gap-3 p-4'>
          <div className='w-12 p-2 rounded-md text-[var(--stat-icon-info-fg)] bg-[var(--stat-icon-info-bg)] border-[var(--stat-icon-info-border)]'>
            <Calendar className='h-7 w-7' />
          </div>
          <div className='flex-1 min-w-0'>
            <p className='text-sm text-muted-foreground truncate'>Total Events</p>
            <div className='flex items-baseline gap-2'>
              <p className='text-4xl font-bold tracking-tight'>
                <NumberFlow value={numberOfEvents} />
              </p>
            </div>
          </div>
        </Card>
        <Card className='flex gap-3 p-4'>
          <div className='w-12 p-2 rounded-md text-[var(--stat-icon-info-fg)] bg-[var(--stat-icon-info-bg)] border-[var(--stat-icon-info-border)]'>
            <Users className='h-7 w-7' />
          </div>
          <div className='flex-1 min-w-0'>
            <p className='text-sm text-muted-foreground truncate'>Total Attendees</p>
            <div className='flex items-baseline gap-2'>
              <p className='text-4xl font-bold tracking-tight'>
                <NumberFlow value={numberOfAttendees} />
              </p>
            </div>
          </div>
        </Card>
        <Card className='flex gap-3 p-4'>
          <div className='w-12 p-2 rounded-md text-[var(--stat-icon-success-fg)] bg-[var(--stat-icon-success-bg)] border-[var(--stat-icon-success-border)]'>
            <GraduationCap className='h-7 w-7' />
          </div>
          <div className='flex-1 min-w-0'>
            <p className='text-sm text-muted-foreground truncate'>Avg. Attendance</p>
            <div className='flex items-baseline gap-2'>
              <p className='text-4xl font-bold tracking-tight'>
                <NumberFlow value={numberOfEvents > 0 ? Math.round(numberOfAttendees / numberOfEvents) : 0} />
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className='grid gap-6 md:grid-cols-2'>
        {/* Faculty Distribution Pie Chart */}
        <Card className='p-6'>
          <h3 className='text-lg font-semibold mb-4'>Attendees by Faculty</h3>
          {facultyData.length > 0 ? (
            <ChartContainer
              config={Object.fromEntries(
                facultyData.map(item => [
                  item.faculty,
                  { label: item.faculty, color: item.fill }
                ])
              )}
              className="h-[350px]"
            >
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend verticalAlign="bottom" height={36} />
                <Pie
                  data={facultyData}
                  dataKey="attendees"
                  nameKey="faculty"
                  cx="50%"
                  cy="45%"
                  outerRadius={100}
                  label
                >
                  {facultyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
          ) : (
            <div className="h-[350px] flex items-center justify-center text-muted-foreground">
              No faculty data available
            </div>
          )}
        </Card>

        {/* Event Type Distribution Pie Chart */}
        <Card className='p-6'>
          <h3 className='text-lg font-semibold mb-4'>Events by Type</h3>
          {eventTypeData.length > 0 ? (
            <ChartContainer
              config={Object.fromEntries(
                eventTypeData.map(item => [
                  item.type,
                  { label: item.type, color: item.fill }
                ])
              )}
              className="h-[350px]"
            >
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend verticalAlign="bottom" height={36} />
                <Pie
                  data={eventTypeData}
                  dataKey="events"
                  nameKey="type"
                  cx="50%"
                  cy="45%"
                  outerRadius={100}

                >
                  {eventTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
          ) : (
            <div className="h-[350px] flex items-center justify-center text-muted-foreground">
              No event data available
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
