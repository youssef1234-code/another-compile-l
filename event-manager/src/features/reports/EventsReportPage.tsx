import { Card } from "@/components/ui/card";
import { useQueryState, parseAsString, parseAsArrayOf } from "nuqs";
import { useMemo, useState } from "react";
import { Users, Calendar, GraduationCap, LineChart } from "lucide-react";
import { trpc } from "@/lib/trpc";
import NumberFlow from "@number-flow/react";
import { EventsTable } from '@/features/admin/components/events-table';
import { EventFilters, type EventFiltersState } from "@/features/events/components/EventFilters";
import { Pie, PieChart, Cell, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Tabs, TabsContent, TabsList, TabsTrigger, } from "@/components/ui/tabs"

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
        if (filtersState.dateFrom) result.startDateFrom = [filtersState.dateFrom.toISOString()];
        if (filtersState.dateTo) result.endDateTo = [filtersState.dateTo.toISOString()];
        if (filtersState.maxPrice !== undefined) result.maxPrice = [String(filtersState.maxPrice)];

        console.log("Search Input:", searchInput);
        return result;
    }, [filtersState]);

    console.log("Applied Filters:", filters);

    const { data } = trpc.events.getAllEvents.useQuery(
        {
            perPage: 1000,
            search: filtersState.search || undefined,
            filters: Object.keys(filters).length > 0 ? filters : undefined,
        },
        {
            placeholderData: (previousData) => previousData,
            staleTime: 5000,
        }
    );

    console.log("Events Report Data:", data?.events);

    const numberOfEvents = data?.total || 0;
    const numberOfAttendees = data?.events.reduce((total, event) => total + (event.registeredCount || 0), 0) || 0;

    // Calculate attendance rates per event type
    const attendanceData = useMemo(() => {
        const typeStats: Record<string, { totalCapacity: number; totalAttendees: number; eventCount: number }> = {};

        data?.events.forEach(event => {
            if (!typeStats[event.type]) {
                typeStats[event.type] = { totalCapacity: 0, totalAttendees: 0, eventCount: 0 };
            }
            typeStats[event.type].totalCapacity += event.capacity || 0;
            typeStats[event.type].totalAttendees += event.registeredCount || 0;
            typeStats[event.type].eventCount += 1;
        });

        const sortedEntries = Object.entries(typeStats)
            .map(([type, stats]) => {
                const attendanceRate = stats.totalCapacity > 0
                    ? Math.round((stats.totalAttendees / stats.totalCapacity) * 100)
                    : 0;
                return { type, attendanceRate, eventCount: stats.eventCount, totalAttendees: stats.totalAttendees };
            })
            .sort((a, b) => b.totalAttendees - a.totalAttendees);

        return sortedEntries.map((item, index) => {
            const lightness = 70 - (index * 10);
            return {
                ...item,
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

    const pageCount = useMemo(() => {
        return data?.totalPages || 0;
    }, [data?.totalPages]);

    return (
        <div className='flex flex-col gap-6 p-6'>
            {/* Filters */}
            <EventFilters
                filters={filtersState}
                onChange={handleFiltersChange}
                onReset={handleResetFilters}
                searchInput={search}
                onSearchInputChange={setSearch}
                isSearching={false}
                hidePrice={true}
            />

            <Tabs defaultValue="stats">
                <TabsList>
                    <TabsTrigger value="stats" ><LineChart />Statistics</TabsTrigger>
                    <TabsTrigger value="events"><Calendar />Events List</TabsTrigger>
                </TabsList>

                <TabsContent value="events">
                    <EventsTable
                        data={data ? data.events : []}
                        pageCount={pageCount}


                    />
                </TabsContent>
                <TabsContent value="stats" className="flex flex-col gap-6">
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
                        {/* Attendance Rate by Event Type Bar Chart */}
                        <Card className='p-6'>
                            <h3 className='text-lg font-semibold mb-4'>Attendance Rate by Event Type</h3>
                            {attendanceData.length > 0 ? (
                                <ChartContainer
                                    config={Object.fromEntries(
                                        attendanceData.map(item => [
                                            item.type,
                                            { label: item.type, color: item.fill }
                                        ])
                                    )}
                                    className="h-[350px]"
                                >
                                    <BarChart
                                        data={attendanceData}
                                        layout="vertical"
                                        margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis type="number" label={{ value: 'Number of Attendees', position: 'insideBottom', offset: -5 }} />
                                        <YAxis type="category" dataKey="type" width={70} />
                                        <ChartTooltip
                                            content={({ active, payload }) => {
                                                if (active && payload && payload.length) {
                                                    const data = payload[0].payload;
                                                    return (
                                                        <div className="rounded-lg border bg-background p-2 shadow-sm">
                                                            <div className="grid gap-2">
                                                                <div className="font-medium">{data.type}</div>
                                                                <div className="text-sm text-muted-foreground">
                                                                    Attendance Rate: {data.attendanceRate}%
                                                                </div>
                                                                <div className="text-sm text-muted-foreground">
                                                                    Events: {data.eventCount}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            }}
                                        />
                                        <Bar dataKey="totalAttendees" radius={[0, 4, 4, 0]}>
                                            {attendanceData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.fill} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ChartContainer>
                            ) : (
                                <div className="h-[350px] flex items-center justify-center text-muted-foreground">
                                    No event data available
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
                </TabsContent>
            </Tabs>
        </div>
    );
}