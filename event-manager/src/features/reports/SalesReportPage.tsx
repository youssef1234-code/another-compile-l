import { Card } from "@/components/ui/card";
import { useQueryState, parseAsString, parseAsArrayOf } from "nuqs";
import { useMemo } from "react";
import { DollarSign, CreditCard, Wallet, TrendingUp, Calendar, LineChart } from "lucide-react";
import { trpc } from "@/lib/trpc";
import NumberFlow from "@number-flow/react";
import { Pie, PieChart, Cell, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function SalesReportPage() {
    const [search, setSearch] = useQueryState("search", parseAsString.withDefault(""));
    const [statusFilter, setStatusFilter] = useQueryState("status", parseAsArrayOf(parseAsString, ",").withDefault([]));
    const [methodFilter, setMethodFilter] = useQueryState("method", parseAsArrayOf(parseAsString, ",").withDefault([]));
    const [dateFrom, setDateFrom] = useQueryState("dateFrom", parseAsString.withDefault(""));
    const [dateTo, setDateTo] = useQueryState("dateTo", parseAsString.withDefault(""));

    // Build filters for API
    const filters = useMemo(() => {
        const result: Record<string, string[]> = {};
        if (statusFilter.length > 0) result.status = statusFilter;
        if (methodFilter.length > 0) result.method = methodFilter;
        if (dateFrom) result.createdFrom = [new Date(dateFrom).toISOString()];
        if (dateTo) result.createdTo = [new Date(dateTo).toISOString()];
        return result;
    }, [statusFilter, methodFilter, dateFrom, dateTo]);

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
        setStatusFilter([]);
        setMethodFilter([]);
        setDateFrom('');
        setDateTo('');
    };

    return (
        <div className='flex flex-col gap-6 p-6'>
            {/* Simple Filters */}
            <Card className='p-4'>
                <div className='grid gap-4 md:grid-cols-4'>
                    <div>
                        <label className='text-sm font-medium mb-2 block'>Date From</label>
                        <input
                            type='date'
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                            className='w-full px-3 py-2 border rounded-md'
                        />
                    </div>
                    <div>
                        <label className='text-sm font-medium mb-2 block'>Date To</label>
                        <input
                            type='date'
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                            className='w-full px-3 py-2 border rounded-md'
                        />
                    </div>
                    <div className='flex items-end'>
                        <button
                            onClick={handleResetFilters}
                            className='px-4 py-2 border rounded-md hover:bg-gray-100'
                        >
                            Reset Filters
                        </button>
                    </div>
                </div>
            </Card>

            <Tabs defaultValue="stats">
                <TabsList>
                    <TabsTrigger value="stats"><LineChart className="w-4 h-4 mr-2" />Statistics</TabsTrigger>
                    <TabsTrigger value="transactions"><Calendar className="w-4 h-4 mr-2" />Transactions</TabsTrigger>
                </TabsList>

                <TabsContent value="transactions">
                    <Card className='p-6'>
                        <h3 className='text-lg font-semibold mb-4'>Payment Transactions</h3>
                        <div className='overflow-x-auto'>
                            <table className='w-full text-sm'>
                                <thead>
                                    <tr className='border-b'>
                                        <th className='text-left p-2'>Date</th>
                                        <th className='text-left p-2'>User</th>
                                        <th className='text-left p-2'>Event</th>
                                        <th className='text-left p-2'>Method</th>
                                        <th className='text-left p-2'>Amount</th>
                                        <th className='text-left p-2'>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data?.payments.map((payment) => (
                                        <tr key={payment.id} className='border-b hover:bg-gray-50'>
                                            <td className='p-2'>
                                                {new Date(payment.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className='p-2'>
                                                {payment.user ? `${payment.user.firstName} ${payment.user.lastName}` : 'N/A'}
                                            </td>
                                            <td className='p-2'>{payment.event?.name || 'N/A'}</td>
                                            <td className='p-2'>{payment.method === 'STRIPE_CARD' ? 'Card' : 'Wallet'}</td>
                                            <td className='p-2'>
                                                {payment.currency} {(payment.amountMinor / 100).toFixed(2)}
                                            </td>
                                            <td className='p-2'>
                                                <span className={`px-2 py-1 rounded text-xs ${payment.status === 'SUCCEEDED' ? 'bg-green-100 text-green-800' :
                                                    payment.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-red-100 text-red-800'
                                                    }`}>
                                                    {payment.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </TabsContent>

                <TabsContent value="stats" className="flex flex-col gap-6">
                    {/* Stats Cards */}
                    <div className='grid gap-6 md:grid-cols-4'>
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
                            <div className='w-12 p-2 rounded-md text-[var(--stat-icon-success-fg)] bg-[var(--stat-icon-success-bg)] border-[var(--stat-icon-success-border)]'>
                                <Wallet className='h-7 w-7' />
                            </div>
                            <div className='flex-1 min-w-0'>
                                <p className='text-sm text-muted-foreground truncate'>Successful Payments</p>
                                <div className='flex items-baseline gap-2'>
                                    <p className='text-4xl font-bold tracking-tight'>
                                        <NumberFlow value={successfulPayments} />
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
                </TabsContent>
            </Tabs>
        </div>
    );
}
