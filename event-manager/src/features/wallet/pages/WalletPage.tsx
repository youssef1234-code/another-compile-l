import { usePageMeta } from "@/components/layout/page-meta-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/design-system";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import type { WalletTxnType } from "../../../shared";
import {
  ArrowDownRight,
  ArrowUpRight,
  CreditCard,
  Download,
  Filter,
  History,
  Plus,
  Wallet,
} from "lucide-react";
import { useMemo } from "react";

// Helper to format currency
export function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
}

// Helper to get transaction icon and color
const getTransactionConfig = (type: WalletTxnType) => {
  const isCredit = type.startsWith("CREDIT");
  return {
    icon: isCredit ? ArrowUpRight : ArrowDownRight,
    color: isCredit ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20" : "text-rose-600 bg-rose-50 dark:bg-rose-900/20",
    label: type.replace(/_/g, " "),
    isCredit
  };
};

export function WalletPage() {
  const { setPageMeta } = usePageMeta();
  
  // Set page meta
  useMemo(() => {
    setPageMeta({
      title: "My Wallet",
      description: "View your balance and track your financial activity.",
    });
  }, [setPageMeta]);

  const { data: walletData, isLoading } = trpc.payments.myWallet.useQuery({
    page: 1,
    limit: 50,
  });

  const transactions = walletData?.transactions?.data ?? [];
  const balanceMinor = walletData?.balance?.balanceMinor ?? 0;
  const currency = walletData?.balance?.currency ?? "EGP";

  if (isLoading) {
    return <WalletPageSkeleton />;
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Top Section: Balance & Actions */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Balance Card */}
        <Card className="md:col-span-2 relative overflow-hidden border-none shadow-md bg-gradient-to-br from-primary/90 to-primary text-primary-foreground">
          <div className="absolute top-0 right-0 p-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl" />
          <div className="absolute bottom-0 left-0 p-24 bg-black/10 rounded-full -ml-12 -mb-12 blur-2xl" />
          
          <CardHeader className="relative pb-2">
            <CardTitle className="text-sm font-medium text-primary-foreground/80 flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Available Balance
            </CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-4xl font-bold tracking-tight">
              {formatCurrency(balanceMinor / 100, currency)}
            </div>
            <p className="text-sm text-primary-foreground/70 mt-1">
              Total available funds
            </p>
          </CardContent>
        </Card>

        {/* Quick Actions Card */}
        <Card className="flex flex-col justify-between shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            <Button className="w-full justify-start gap-2" variant="outline" disabled>
              <Plus className="h-4 w-4" />
              Top Up Balance
            </Button>
            <Button className="w-full justify-start gap-2" variant="outline" disabled>
              <CreditCard className="h-4 w-4" />
              Manage Cards
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Transactions Section */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Transaction History
            </CardTitle>
            <CardDescription>
              Recent transactions made with your wallet
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-2" disabled>
              <Filter className="h-4 w-4" />
              Filter
            </Button>
            <Button variant="outline" size="sm" className="gap-2" disabled>
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center border-dashed border rounded-lg bg-muted/50">
              <div className="p-3 rounded-full bg-background shadow-sm mb-4">
                <History className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium">No transactions yet</h3>
              <p className="text-muted-foreground max-w-sm mt-1">
                Your transaction history will appear here once you make payments or receive refunds.
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((txn) => {
                    const config = getTransactionConfig(txn.type);
                    const Icon = config.icon;
                    const amount = txn.amountMinor / 100;
                    const cur = txn.currency ?? currency;
                    
                    return (
                      <TableRow key={txn.id} className="group">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className={cn("p-2 rounded-full shrink-0", config.color)}>
                              <Icon className="h-4 w-4" />
                            </div>
                            <div className="flex flex-col">
                              <span className="font-medium text-sm">{config.label}</span>
                              <span className="text-xs text-muted-foreground uppercase">{txn.type.split('_')[0]}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col max-w-[200px] sm:max-w-[300px]">
                            <span className="truncate font-medium text-sm">
                              {txn.reference?.note || "—"}
                            </span>
                            {txn.reference?.eventId && (
                              <span className="text-xs text-muted-foreground truncate">
                                Event ID: {txn.reference.eventId}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col text-sm">
                            <span>{formatDate(new Date(txn.createdAt))}</span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(txn.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={cn(
                            "font-bold tabular-nums",
                            config.isCredit ? "text-emerald-600" : "text-rose-600"
                          )}>
                            {config.isCredit ? "+" : "-"}{formatCurrency(amount, cur)}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function WalletPageSkeleton() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="grid gap-6 md:grid-cols-3">
        <Skeleton className="h-40 md:col-span-2" />
        <Skeleton className="h-40" />
      </div>
      <Skeleton className="h-[400px] w-full" />
    </div>
  );
}
