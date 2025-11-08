import { useMemo } from "react";
import {
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

import { Wallet, ArrowUpRight, ArrowDownRight, RefreshCcw } from "lucide-react";
import { trpc } from "@/lib/trpc";
import type { WalletTxnType } from "@event-manager/shared";

export function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
}

type Transaction = {
  id?: any;
  userId?: any;
  type: WalletTxnType;
  amountMinor: number;
  currency: "EGP" | "USD";
  createdAt: string;
  reference: {
    eventId?: any;
    registrationId?: any;
    paymentId?: any;
    note?: string;
  };
};


export function WalletPage() {
  const { data: walletData, isLoading, refetch, isFetching } = trpc.payments.myWallet.useQuery({
    page: 1,
    limit: 50,
  });

  const rows = walletData?.transactions?.data ?? [];
  const balanceMinor = walletData?.balance?.balanceMinor ?? 0;
  const currency = walletData?.balance?.currency ?? "EGP";

  const columns = useMemo<ColumnDef<Transaction>[]>(() => [
  {
      accessorKey: "type",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Type" />,
      cell: ({ row }) => {
        const type = row.getValue("type") as string;
        const isCredit = type.startsWith("CREDIT");
        return (
          <div className="flex items-center gap-2">
            {isCredit ? (
              <ArrowUpRight className="h-4 w-4 text-emerald-600" />
            ) : (
              <ArrowDownRight className="h-4 w-4 text-rose-600" />
            )}
            <Badge variant={isCredit ? "default" : "secondary"} className="uppercase tracking-wide">
              {type.replace(/_/g, " ")}
            </Badge>
          </div>
        );
      },
    },
    {
      accessorKey: "amountMinor",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Amount" />,
      cell: ({ row }) => {
        const amountMinor = row.getValue("amountMinor") as number;
        const cur = (row.getValue("currency") as string) ?? currency;
        const isCredit = row.original.type.startsWith("CREDIT");
        return (
          <div className={`font-semibold ${isCredit ? "text-emerald-600" : "text-rose-600"}`}>
            {isCredit ? "+" : "-"}{formatCurrency(amountMinor / 100, cur)}
          </div>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Date" />,
      cell: ({ row }) => new Date(row.getValue("createdAt") as string).toLocaleString(),
    },
    {
      accessorKey: "reference",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Reference" />,
      cell: ({ row }) => {
        const ref = row.original.reference;
        const label =
          ref?.note ??
          ref?.paymentId ??
          ref?.eventId ??
          ref?.registrationId ??
          "—";
        return <div className="text-muted-foreground">{String(label)}</div>;
      },
    },
   ], [currency]);

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: { 
      pagination: { pageSize: 10 },
      sorting: [{ id: "createdAt", desc: true }], // Sort by date desc by default
    },
  });

  return (
    <div className="container py-6 space-y-6">
      {/* Balance Card - keep existing implementation */}
  <Card className="relative overflow-hidden border-primary/20">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent" />
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            <CardTitle>Wallet Balance</CardTitle>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            disabled={isFetching}
            title="Refresh"
          >
            <RefreshCcw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          </Button>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {isLoading ? (
            <Skeleton className="h-10 w-40" />
          ) : (
            <div className="text-4xl font-bold tracking-tight">
              {formatCurrency(balanceMinor / 100, currency)}
            </div>
          )}
          <div className="text-xs text-muted-foreground">
            Currency: <span className="font-medium">{currency}</span>
          </div>
        </CardContent>
      </Card>
    
      {/* Transactions Card - updated implementation */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Transaction History</CardTitle>
          </div>
        </CardHeader>
        <Separator />
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-1/3" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-14 text-center">
              <Wallet className="h-8 w-8 text-muted-foreground" />
              <div className="text-sm text-muted-foreground">
                No transactions yet. Your wallet activity will appear here.
              </div>
            </div>
          ) : (
            <DataTable 
              table={table}
              className="pt-4"
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
