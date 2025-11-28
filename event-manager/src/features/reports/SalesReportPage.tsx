import { Card } from "@/components/ui/card";
import { useQueryState, parseAsString, parseAsArrayOf } from "nuqs";
import { useMemo, useState } from "react";
import { DollarSign, CreditCard, Wallet, TrendingUp, Calendar, LineChart } from "lucide-react";
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
    const [view, setView] = useState<"STATISTICS" | "TABLE">("STATISTICS");
    const [searchInput, setSearchInput] = useState(search);

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
        if (filtersState.dateFrom) result.createdFrom = [filtersState.dateFrom.toISOString()];
        if (filtersState.dateTo) result.createdTo = [filtersState.dateTo.toISOString()];
        result.purpose = ["EVENT_PAYMENT", "VENDOR_FEE"];
        return result;
    }, [methodFilter, filtersState]);

    const { data } = trpc.payments.getAllPayments.useQuery(
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

    console.log("Payments Data:", data?.payments);

    // Calculate metrics
    const totalPayments = data?.total || 0;
    const totalRevenue = useMemo(() => {
        return data?.payments
            .filter(p => p.status === 'SUCCEEDED')
            .reduce((sum, p) => sum + (p.amountMinor / 100), 0) || 0;
    }, [data]);

    const successfulPayments = useMemo(() => {
        return data?.payments.filter(p => p.status === 'SUCCEEDED').length || 0;
    }, [data]);

    const averageTransactionValue = useMemo(() => {
        return successfulPayments > 0 ? totalRevenue / successfulPayments : 0;
    }, [totalRevenue, successfulPayments]);

    // Calculate revenue by payment method
    const revenueByMethod = useMemo(() => {
        const methodStats: Record<string, number> = {};

        data?.payments
            .filter(p => p.status === 'SUCCEEDED')
            .forEach(payment => {
                const method = payment.method === 'STRIPE_CARD' ? 'Card' : 'Wallet';
                methodStats[method] = (methodStats[method] || 0) + (payment.amountMinor / 100);
            });

        const sortedEntries = Object.entries(methodStats).sort((a, b) => b[1] - a[1]);

        return sortedEntries.map(([method, revenue], index) => {
            const lightness = 70 - (index * 10);
            return {
                method,
                revenue: Math.round(revenue * 100) / 100,
                fill: `hsl(220, 80%, ${lightness}%)`,
            };
        });
    }, [data]);

    // Calculate revenue by event type
    const revenueByEventType = useMemo(() => {
        const typeStats: Record<string, { revenue: number; count: number }> = {};

        data?.payments
            .filter(p => p.status === 'SUCCEEDED' && p.event)
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
    }, [data]);

    const handleResetFilters = () => {
        setSearch('');
        setMethodFilter([]);
        setDateFrom('');
        setDateTo('');
        setSearchInput('');
    };

    const handleFiltersChange = (newFilters: ReportFiltersState) => {
        setSearch(newFilters.search);
        setTypeFilter(newFilters.types);
        setDateFrom(newFilters.dateFrom ? newFilters.dateFrom.toISOString() : '');
        setDateTo(newFilters.dateTo ? newFilters.dateTo.toISOString() : '');
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
                searchInput={search}
                onSearchInputChange={setSearch}
                isSearching={false}
                showSearchBar={false}
            />

            <div className="inline-flex items-center gap-1 rounded-lg p-1 bg-muted/30 border">
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
                    <Calendar className="h-4 w-4" /> Transactions
                </Button>
            </div>

            {view === "TABLE" ? (
                <div />
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
                </div>
            )}
        </div>
    );
}
