import { DataTable } from "@/components/data-table/data-table";
import { useDataTable } from "@/hooks/use-data-table";
import type { QueryKeys } from "@/types/data-table";
import type { Payment } from "@event-manager/shared";
import { getPaymentsTableColumns } from "./payment-table-columns";
import { useMemo } from "react";

interface PaymentsTableProps {
    data: Payment[];
    pageCount: number;
    typeCounts?: Record<string, number>;
    statusCounts?: Record<string, number>;
    userRole?: string;
    queryKeys?: Partial<QueryKeys>;
    isSearching?: boolean;

}
export function PaymentsTable({
    data,
    pageCount,
    queryKeys,
}: PaymentsTableProps) {

    const columns = useMemo(
        () =>
            getPaymentsTableColumns(),
        [],
    );

    const { table } = useDataTable({
        data,
        columns,
        pageCount,
        initialState: {
            sorting: [{ id: "createdAt", desc: true }], // Upcoming events first
            columnPinning: { right: ["actions"] },
        },
        queryKeys,
        getRowId: (originalRow) => originalRow.id,
        shallow: false,
        clearOnDefault: true,
    });

    return (
        <DataTable table={table} />

    );
}
