import { Card } from "@/components/ui/card";
import { useQueryState, parseAsString, parseAsArrayOf, parseAsJson } from "nuqs";
import { useMemo, useState } from "react";
import { DollarSign, CreditCard, TrendingUp, Calendar, LineChart } from "lucide-react";
import { trpc } from "@/lib/trpc";
import NumberFlow from "@number-flow/react";
import { ReportFilters, type ReportFiltersState } from "./components/report-filters";
import { Pie, PieChart, Cell, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { EventsReportsTable } from "./components/EventAttendeeTable";

export function SalesReportPage() {
    const [search, setSearch] = useQueryState("search", parseAsString.withDefault(""));
    const [methodFilter, setMethodFilter] = useQueryState("method", parseAsArrayOf(parseAsString, ",").withDefault([]));
    const [typeFilter, setTypeFilter] = useQueryState("type", parseAsArrayOf(parseAsString, ",").withDefault([]));
    const [dateFrom, setDateFrom] = useQueryState("dateFrom", parseAsString.withDefault(""));
    const [dateTo, setDateTo] = useQueryState("dateTo", parseAsString.withDefault(""));
    const [view, setView] = useState<"STATISTICS" | "TABLE" | "PAYMENTS">("STATISTICS");
    const [sortState] = useQueryState('sort', parseAsJson<Array<{ id: string; desc: boolean }>>((v) => {
        if (!v) return null;
        if (typeof v === 'string') {
            try {
                return JSON.parse(v) as Array<{ id: string; desc: boolean }>;
            } catch {
                return null;
            }
        }
        return v as Array<{ id: string; desc: boolean }>;
    }).withDefault([]));

    // Sync filters state for ReportFilters component
    const filtersState = useMemo((): ReportFiltersState => ({
        search: search,
        types: typeFilter,
        dateFrom: dateFrom ? new Date(dateFrom) : undefined,
        dateTo: dateTo ? new Date(dateTo) : undefined,
        maxPrice: undefined,
    }), [search, typeFilter, dateFrom, dateTo]);

    // Build filters for API
    const filters = useMemo(() => {
        const result: Record<string, string[]> = {};
        if (methodFilter.length > 0) result.method = methodFilter;
        if (filtersState.types.length > 0) result.type = filtersState.types;
        if (filtersState.dateFrom) result.startDateFrom = [filtersState.dateFrom.toISOString()];
        if (filtersState.dateTo) result.startDateTo = [filtersState.dateTo.toISOString()];
        else result.startDateTo = [new Date().toISOString()];
        result.status = ["SUCCEEDED"];
        result.purpose = ["EVENT_PAYMENT", "VENDOR_FEE"];
        return result;
    }, [methodFilter, filtersState]);

    const eventfilters = useMemo(() => {
        const result: Record<string, string[]> = {};
        if (filtersState.types.length > 0) result.type = filtersState.types;
        if (filtersState.dateFrom) result.startDateFrom = [filtersState.dateFrom.toISOString()];
        if (filtersState.dateTo) result.startDateTo = [filtersState.dateTo.toISOString()];
        else result.startDateTo = [new Date().toISOString()];
        if (filtersState.maxPrice !== undefined) result.maxPrice = [String(filtersState.maxPrice)];
        result.status = ["PUBLISHED"];

        return result;
    }, [filtersState]);



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

    const { data: paymentData } = trpc.payments.getAllPayments.useQuery(
        {
            perPage: 1000,
            search: search || undefined,
            filters: Object.keys(filters).length > 0 ? filters : undefined,

        },
        {
            placeholderData: (previousData) => previousData,
            staleTime: 5000,
        }
    );

    const { data: eventData } = trpc.events.getAllEvents.useQuery(
        {
            perPage: 1000,
            search: search || undefined,
            sort: parsedSort.length > 0 ? parsedSort : undefined,
            filters: Object.keys(eventfilters).length > 0 ? eventfilters : undefined,
            extendedFilters: [{ id: "price", value: "0", variant: "range", operator: "gt", filterId: "HDsVfoSh" }]
        },
        {
            placeholderData: (previousData) => previousData,
            staleTime: 5000,
        }
    );

    // Calculate metrics
    const totalPayments = paymentData?.total || 0;
    const totalRevenue = useMemo(() => {
        return paymentData?.payments
            .reduce((sum, p) => sum + (p.amountMinor / 100), 0) || 0;
    }, [paymentData]);


    const averageTransactionValue = useMemo(() => {
        return totalPayments > 0 ? totalRevenue / totalPayments : 0;
    }, [totalRevenue, totalPayments]);

    // Calculate revenue by payment method
    const revenueByMethod = useMemo(() => {
        const methodStats: Record<string, number> = {};

        paymentData?.payments
            .forEach(payment => {
                const method = payment.method === 'STRIPE_CARD' ? 'Card' : 'Wallet';
                methodStats[method] = (methodStats[method] || 0) + (payment.amountMinor / 100);
            });

        const sortedEntries = Object.entries(methodStats).sort((a, b) => b[1] - a[1]);

        return sortedEntries.map(([method, revenue]) => {
            const fill = method === 'Card' ? 'hsl(220, 80%, 60%)' : 'hsl(220, 80%, 40%)';
            return {
                method,
                revenue: Math.round(revenue * 100) / 100,
                fill,
            };
        });
    }, [paymentData]);

    // Calculate revenue by event type
    const revenueByEventType = useMemo(() => {
        const typeStats: Record<string, { revenue: number; count: number }> = {};

        paymentData?.payments
            .forEach(payment => {
                const type = payment.event!.type;
                if (!typeStats[type]) {
                    typeStats[type] = { revenue: 0, count: 0 };
                }
                typeStats[type].revenue += payment.amountMinor / 100;
                typeStats[type].count += 1;
            });

        const sortedEntries = Object.entries(typeStats)
            .map(([type, stats]) => ({
                type,
                revenue: Math.round(stats.revenue * 100) / 100,
                count: stats.count,
            }))
            .sort((a, b) => b.revenue - a.revenue);

        return sortedEntries.map((item, index) => {
            const lightness = 70 - (index * 10);
            return {
                ...item,
                fill: `hsl(220, 80%, ${lightness}%)`,
            };
        });
    }, [paymentData]);

    // Calculate weekly payment method distribution
    const weeklyPaymentDistribution = useMemo(() => {
        if (!paymentData?.payments || paymentData.payments.length === 0) return [];

        // Group payments by week
        const weeklyData: Record<string, { card: number; wallet: number; weekStart: Date }> = {};

        paymentData.payments.forEach(payment => {
            const date = new Date(payment.createdAt);
            // Get the start of the week (Monday)
            const weekStart = new Date(date);
            const day = weekStart.getDay();
            const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1);
            weekStart.setDate(diff);
            weekStart.setHours(0, 0, 0, 0);

            // Use year and week number as key for better grouping
            const year = weekStart.getFullYear();
            const startOfYear = new Date(year, 0, 1);
            const weekNumber = Math.ceil((((weekStart.getTime() - startOfYear.getTime()) / 86400000) + startOfYear.getDay() + 1) / 7);
            const weekKey = `${year}-W${weekNumber.toString().padStart(2, '0')}`;

            if (!weeklyData[weekKey]) {
                weeklyData[weekKey] = { card: 0, wallet: 0, weekStart: new Date(weekStart) };
            }

            const revenue = payment.amountMinor / 100;
            if (payment.method === 'STRIPE_CARD') {
                weeklyData[weekKey].card += revenue;
            } else if (payment.method === 'WALLET') {
                weeklyData[weekKey].wallet += revenue;
            }
        });

        // Convert to array and sort by week
        const sortedWeeks = Object.entries(weeklyData)
            .map(([weekKey, data]) => {
                const weekEnd = new Date(data.weekStart);
                weekEnd.setDate(weekEnd.getDate() + 6);

                return {
                    week: `${data.weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
                    weekKey: weekKey,
                    weekStartTimestamp: data.weekStart.getTime(),
                    Card: Math.round(data.card * 100) / 100,
                    Wallet: Math.round(data.wallet * 100) / 100,
                };
            })
            .sort((a, b) => a.weekStartTimestamp - b.weekStartTimestamp);

        return sortedWeeks;
    }, [paymentData]);

    const handleResetFilters = () => {
        setSearch('');
        setMethodFilter([]);
        setDateFrom('');
        setDateTo('');
    };

    const handleFiltersChange = (newFilters: ReportFiltersState) => {
        setSearch(newFilters.search);
        setTypeFilter(newFilters.types);
        setDateFrom(newFilters.dateFrom ? newFilters.dateFrom.toISOString() : '');
        setDateTo(newFilters.dateTo ? newFilters.dateTo.toISOString() : '');
    };

    const pageCount = useMemo(() => {
        return eventData?.totalPages || 0;
    }, [eventData?.totalPages]);

    return (
        <div className='flex flex-col gap-6 p-6'>
            {/* Filters */}
            <ReportFilters
                filters={filtersState}
                onChange={handleFiltersChange}
                onReset={handleResetFilters}
                searchInput={search}
                onSearchInputChange={setSearch}
                isSearching={false}
                showSearchBar={false}
            />
            <div className="flex items-center justify-between">
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
                        <Calendar className="h-4 w-4" /> Events
                    </Button>
                </div>
            </div>

            {view === "TABLE" ? (
                <EventsReportsTable
                    data={eventData ? eventData.events : []}
                    pageCount={pageCount}

                />
            ) : (
                <div className="flex flex-col gap-6">{/* Stats Cards */}
                    <div className='grid gap-6 md:grid-cols-3'>
                        <Card className='flex gap-3 p-4'>
                            <div className='w-12 p-2 rounded-md text-[var(--stat-icon-success-fg)] bg-[var(--stat-icon-success-bg)] border-[var(--stat-icon-success-border)]'>
                                <DollarSign className='h-7 w-7' />
                            </div>
                            <div className='flex-1 min-w-0'>
                                <p className='text-sm text-muted-foreground truncate'>Total Revenue</p>
                                <div className='flex items-baseline gap-2'>
                                    <p className='text-4xl font-bold tracking-tight'>
                                        <NumberFlow value={totalRevenue} locales="en-EG" format={{ style: 'currency', currency: 'EGP' }} />
                                    </p>
                                </div>
                            </div>
                        </Card>

                        <Card className='flex gap-3 p-4'>
                            <div className='w-12 p-2 rounded-md text-[var(--stat-icon-info-fg)] bg-[var(--stat-icon-info-bg)] border-[var(--stat-icon-info-border)]'>
                                <CreditCard className='h-7 w-7' />
                            </div>
                            <div className='flex-1 min-w-0'>
                                <p className='text-sm text-muted-foreground truncate'>Total Payments</p>
                                <div className='flex items-baseline gap-2'>
                                    <p className='text-4xl font-bold tracking-tight'>
                                        <NumberFlow value={totalPayments} />
                                    </p>
                                </div>
                            </div>
                        </Card>

                        <Card className='flex gap-3 p-4'>
                            <div className='w-12 p-2 rounded-md text-[var(--stat-icon-info-fg)] bg-[var(--stat-icon-info-bg)] border-[var(--stat-icon-info-border)]'>
                                <TrendingUp className='h-7 w-7' />
                            </div>
                            <div className='flex-1 min-w-0'>
                                <p className='text-sm text-muted-foreground truncate'>Avg. Transaction</p>
                                <div className='flex items-baseline gap-2'>
                                    <p className='text-4xl font-bold tracking-tight'>
                                        <NumberFlow value={averageTransactionValue} locales="en-EG" format={{ style: 'currency', currency: 'EGP' }} />
                                    </p>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Charts */}
                    <div className='grid gap-6 md:grid-cols-2'>
                        {/* Revenue by Event Type Bar Chart */}
                        <Card className='p-6'>
                            <h3 className='text-lg font-semibold mb-4'>Revenue by Event Type</h3>
                            {revenueByEventType.length > 0 ? (
                                <ChartContainer
                                    config={Object.fromEntries(
                                        revenueByEventType.map(item => [
                                            item.type,
                                            { label: item.type, color: item.fill }
                                        ])
                                    )}
                                    className="h-[350px]"
                                >
                                    <BarChart
                                        data={revenueByEventType}
                                        layout="vertical"
                                        margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis type="number" label={{ value: 'Revenue', position: 'insideBottom', offset: -5 }} />
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
                                                                    Revenue: {data.revenue.toFixed(2)}
                                                                </div>
                                                                <div className="text-sm text-muted-foreground">
                                                                    Payments: {data.count}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            }}
                                        />
                                        <Bar dataKey="revenue" radius={[0, 4, 4, 0]}>
                                            {revenueByEventType.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.fill} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ChartContainer>
                            ) : (
                                <div className="h-[350px] flex items-center justify-center text-muted-foreground">
                                    No revenue data available
                                </div>
                            )}
                        </Card>

                        {/* Revenue by Payment Method Pie Chart */}
                        <Card className='p-6'>
                            <h3 className='text-lg font-semibold mb-4'>Revenue by Payment Method</h3>
                            {revenueByMethod.length > 0 ? (
                                <ChartContainer
                                    config={Object.fromEntries(
                                        revenueByMethod.map(item => [
                                            item.method,
                                            { label: item.method, color: item.fill }
                                        ])
                                    )}
                                    className="h-[350px]"
                                >
                                    <PieChart>
                                        <ChartTooltip content={<ChartTooltipContent />} />
                                        <Legend verticalAlign="bottom" height={36} />
                                        <Pie
                                            data={revenueByMethod}
                                            dataKey="revenue"
                                            nameKey="method"
                                            cx="50%"
                                            cy="45%"
                                            outerRadius={100}
                                        >
                                            {revenueByMethod.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.fill} />
                                            ))}
                                        </Pie>
                                    </PieChart>
                                </ChartContainer>
                            ) : (
                                <div className="h-[350px] flex items-center justify-center text-muted-foreground">
                                    No payment data available
                                </div>
                            )}
                        </Card>
                    </div>

                    {/* Weekly Payment Method Distribution Chart */}
                    <Card className='p-6'>
                        <h3 className='text-lg font-semibold mb-4'>Weekly Revenue Distribution (Card vs Wallet)</h3>
                        {weeklyPaymentDistribution.length > 0 ? (
                            <ChartContainer
                                config={{
                                    Card: { label: 'Card', color: 'hsl(220, 80%, 60%)' },
                                    Wallet: { label: 'Wallet', color: 'hsl(220, 80%, 40%)' }
                                }}
                                className="h-[350px]"
                            >
                                <BarChart
                                    data={weeklyPaymentDistribution}
                                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="week" />
                                    <YAxis label={{ value: 'Revenue (EGP)', angle: -90, position: 'insideLeft' }} />
                                    <ChartTooltip
                                        content={({ active, payload }) => {
                                            if (active && payload && payload.length) {
                                                return (
                                                    <div className="rounded-lg border bg-background p-2 shadow-sm">
                                                        <div className="grid gap-2">
                                                            <div className="font-medium">Week of {payload[0].payload.week}</div>
                                                            <div className="text-sm text-muted-foreground">
                                                                Card: {payload[0].payload.Card.toFixed(2)} EGP
                                                            </div>
                                                            <div className="text-sm text-muted-foreground">
                                                                Wallet: {payload[0].payload.Wallet.toFixed(2)} EGP
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                    />
                                    <Legend />
                                    <Bar dataKey="Card" fill="hsl(220, 80%, 60%)" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="Wallet" fill="hsl(220, 80%, 40%)" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ChartContainer>
                        ) : (
                            <div className="h-[350px] flex items-center justify-center text-muted-foreground">
                                No payment distribution data available
                            </div>
                        )}
                    </Card>
                </div>
            )}
        </div>
    );
}
