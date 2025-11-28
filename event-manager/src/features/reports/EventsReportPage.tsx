import { Card } from "@/components/ui/card";
import { useQueryState, parseAsString, parseAsArrayOf, parseAsInteger } from "nuqs";
import { useEffect, useMemo, useState } from "react";
import { Users, Calendar, GraduationCap, LineChart, ListIcon, CalendarIcon } from "lucide-react";
import { trpc } from "@/lib/trpc";
import NumberFlow from "@number-flow/react";
import { ReportFilters, type ReportFiltersState } from "./components/report-filters";
import { Pie, PieChart, Cell, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { EventsReportsTable } from "./components/EventAttendeeTable";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function EventsReportPage() {
    const [search, setSearch] = useQueryState("search", parseAsString.withDefault(""));
    const [typeFilter, setTypeFilter] = useQueryState("type", parseAsArrayOf(parseAsString, ",").withDefault([]));
    const [dateFrom, setDateFrom] = useQueryState("dateFrom", parseAsString.withDefault(""));
    const [dateTo, setDateTo] = useQueryState("dateTo", parseAsString.withDefault(""));
    const [maxPrice, setMaxPrice] = useQueryState("maxPrice", parseAsString.withDefault(""));
    const [view, setView] = useState<"STATISTICS" | "TABLE">("STATISTICS");
    const [searchInput, setSearchInput] = useState(search);
    const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
    const [perPage] = useQueryState("perPage", parseAsInteger.withDefault(24));

    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchInput !== search) {
                setSearch(searchInput);
                setPage(1);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [searchInput, search, setSearch, setPage]);

    // Sync filters state for ReportFilters component
    const filtersState = useMemo((): ReportFiltersState => ({
        search: search,
        types: typeFilter,
        dateFrom: dateFrom ? new Date(dateFrom) : undefined,
        dateTo: dateTo ? new Date(dateTo) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
    }), [search, typeFilter, dateFrom, dateTo, maxPrice]);

    const maxDate = new Date();

    // Build filters for API from filtersState
    const filters = useMemo(() => {
        const result: Record<string, string[]> = {};
        if (filtersState.types.length > 0) result.type = filtersState.types;
        if (filtersState.dateFrom) result.startDateFrom = [filtersState.dateFrom.toISOString()];
        if (filtersState.dateTo) result.startDateTo = [filtersState.dateTo.toISOString()];
        else result.startDateTo = [maxDate.toISOString()];
        if (filtersState.maxPrice !== undefined) result.maxPrice = [String(filtersState.maxPrice)];
        result.status = ["PUBLISHED"];

        return result;
    }, [filtersState]);


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

    console.log("Sales Data:", data?.events);

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
        setDateFrom('');
        setDateTo('');
        setMaxPrice('');
        setSearchInput('');
    };

    const handleFiltersChange = (newFilters: ReportFiltersState) => {
        setSearch(newFilters.search);
        setTypeFilter(newFilters.types);
        setDateFrom(newFilters.dateFrom ? newFilters.dateFrom.toISOString() : '');
        setDateTo(newFilters.dateTo ? newFilters.dateTo.toISOString() : '');
        setMaxPrice(newFilters.maxPrice ? String(newFilters.maxPrice) : '');
        setSearchInput(newFilters.search);
    };

    const pageCount = useMemo(() => {
        return data?.totalPages || 0;
    }, [data?.totalPages]);

    return (
        <div className='flex flex-col gap-6 p-6'>
            {/* Filters */}
            <ReportFilters
                filters={filtersState}
                onChange={handleFiltersChange}
                onReset={handleResetFilters}
                searchInput={searchInput}
                onSearchInputChange={setSearchInput}
                isSearching={searchInput !== search}
            />
            <div className="flex items-center gap-1 rounded-lg p-1 bg-muted/30 border">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setView("STATISTICS")}
                    className={cn(
                        'gap-2 transition-all',
                        view === "STATISTICS"
                            ? 'bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary'
                            : 'hover:bg-muted text-muted-foreground'
                    )}
                >
                    <LineChart className="h-4 w-4" /> Statistics
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setView("TABLE")}
                    className={cn(
                        'gap-2 transition-all',
                        view === "TABLE"
                            ? 'bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary'
                            : 'hover:bg-muted text-muted-foreground'
                    )}
                >
                    <Calendar className="h-4 w-4" /> Events List
                </Button>
            </div>

            {view === "TABLE" ? (
                <EventsReportsTable
                    data={data ? data.events : []}
                    pageCount={pageCount}

                />
            ) : (
                <div className="flex flex-col gap-6">
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
                </div>
            )}
        </div >
    );
}