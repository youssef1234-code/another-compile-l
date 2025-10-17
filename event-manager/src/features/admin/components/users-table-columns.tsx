import type { User } from "@event-manager/shared";
import type { ColumnDef } from "@tanstack/react-table";
import { Shield, Mail, MoreHorizontal, UserX, Trash2, UserCheck, Users, CheckCircle, XCircle } from "lucide-react";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { InlineEditCell, RoleBadge, UserStatusBadge } from "@/components/generic";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatDate } from "@/lib/design-system";

interface GetUsersTableColumnsProps {
  roleCounts: Record<string, number>;
  statusCounts: { active: number; blocked: number };
  onUpdateUser?: (userId: string, field: string, value: string) => Promise<void>;
  onVerifyRole?: (userId: string) => void;
  onApproveVendor?: (userId: string) => void;
  onRejectVendor?: (userId: string) => void;
  onBlockUser?: (userId: string) => void;
  onUnblockUser?: (userId: string) => void;
  onDeleteUser?: (userId: string) => void;
}

export function getUsersTableColumns({
  roleCounts,
  statusCounts,
  onUpdateUser,
  onVerifyRole,
  onApproveVendor,
  onRejectVendor,
  onBlockUser,
  onUnblockUser,
  onDeleteUser,
}: GetUsersTableColumnsProps): ColumnDef<User>[] {
  return [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
          className="translate-y-0.5"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          className="translate-y-0.5"
        />
      ),
      enableSorting: false,
      enableHiding: false,
      size: 40,
    },
    {
      id: "email",
      accessorKey: "email",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Email" />
      ),
      cell: ({ row }) => {
        const user = row.original;
        return onUpdateUser ? (
          <InlineEditCell
            value={user.email}
            onSave={(newValue) => onUpdateUser(user.id, 'email', newValue)}
            validate={(value) => {
              if (!value.includes('@')) return 'Invalid email';
              return null;
            }}
          />
        ) : (
          <div className="flex items-center gap-2">
            <Mail className="size-4 text-muted-foreground" />
            <span>{user.email}</span>
          </div>
        );
      },
      enableColumnFilter: true,
      meta: {
        label: "Email",
        placeholder: "Filter emails...",
        variant: "text" as const,
        operators: ["iLike", "eq", "ne", "isEmpty", "isNotEmpty"],
      },
    },
    {
      id: "firstName",
      accessorKey: "firstName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="First Name" />
      ),
      cell: ({ row }) => {
        const user = row.original;
        return onUpdateUser ? (
          <InlineEditCell
            value={user.firstName}
            onSave={(newValue) => onUpdateUser(user.id, 'firstName', newValue)}
            validate={(value) => {
              if (value.length < 2) return 'Name too short';
              return null;
            }}
          />
        ) : (
          <span>{user.firstName}</span>
        );
      },
      enableColumnFilter: true,
      meta: {
        label: "First Name",
        placeholder: "Filter first names...",
        variant: "text" as const,
        operators: ["iLike", "eq", "ne", "isEmpty", "isNotEmpty"],
      },
    },
    {
      id: "lastName",
      accessorKey: "lastName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Last Name" />
      ),
      cell: ({ row }) => {
        const user = row.original;
        return onUpdateUser ? (
          <InlineEditCell
            value={user.lastName}
            onSave={(newValue) => onUpdateUser(user.id, 'lastName', newValue)}
            validate={(value) => {
              if (value.length < 2) return 'Name too short';
              return null;
            }}
          />
        ) : (
          <span>{user.lastName}</span>
        );
      },
      enableColumnFilter: true,
      meta: {
        label: "Last Name",
        placeholder: "Filter last names...",
        variant: "text" as const,
        operators: ["iLike", "eq", "ne", "isEmpty", "isNotEmpty"],
      },
    },
    {
      id: "role",
      accessorKey: "role",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Role" />
      ),
      cell: ({ row }) => <RoleBadge role={row.getValue("role")} />,
      enableColumnFilter: true,
      filterFn: (row, id, value) => {
        return Array.isArray(value) && value.includes(row.getValue(id));
      },
      meta: {
        label: "Role",
        variant: "multiSelect" as const,
        options: [
          { label: "Admin", value: "ADMIN", count: roleCounts.ADMIN, icon: Shield },
          { label: "Event Office", value: "EVENT_OFFICE", count: roleCounts.EVENT_OFFICE, icon: Users },
          { label: "Professor", value: "PROFESSOR", count: roleCounts.PROFESSOR },
          { label: "TA", value: "TA", count: roleCounts.TA },
          { label: "Staff", value: "STAFF", count: roleCounts.STAFF },
          { label: "Student", value: "STUDENT", count: roleCounts.STUDENT },
          { label: "Vendor", value: "VENDOR", count: roleCounts.VENDOR },
        ],
      },
      size: 150,
    },
    {
      id: "status",
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => <UserStatusBadge status={row.getValue("status")} />,
      enableColumnFilter: true,
      filterFn: (row, id, value) => {
        return Array.isArray(value) && value.includes(row.getValue(id));
      },
      meta: {
        label: "Status",
        variant: "multiSelect" as const,
        options: [
          { label: "Active", value: "ACTIVE", count: statusCounts.active, icon: UserCheck },
          { label: "Blocked", value: "BLOCKED", count: statusCounts.blocked, icon: UserX },
        ],
      },
      size: 120,
    },
    {
      id: "isVerified",
      accessorKey: "isVerified",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Email Verified" />
      ),
      cell: ({ row }) => (
        <div className="text-center text-sm">
          {row.getValue("isVerified") ? (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              Verified
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-gray-50 text-gray-500 border-gray-200">
              Unverified
            </Badge>
          )}
        </div>
      ),
      enableColumnFilter: true,
      filterFn: (row, id, value) => {
        return Array.isArray(value) && value.includes(String(row.getValue(id)));
      },
      meta: {
        label: "Email Verified",
        variant: "multiSelect" as const,
        options: [
          { label: "Verified", value: "true" },
          { label: "Unverified", value: "false" },
        ],
      },
      size: 120,
    },
    {
      id: "roleVerifiedByAdmin",
      accessorKey: "roleVerifiedByAdmin",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Role Verified" />
      ),
      cell: ({ row }) => (
        <div className="text-center text-sm">
          {row.original.roleVerifiedByAdmin ? (
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              Verified
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-gray-50 text-gray-500 border-gray-200">
              Pending
            </Badge>
          )}
        </div>
      ),
      enableColumnFilter: true,
      filterFn: (row, id, value) => {
        return Array.isArray(value) && value.includes(String(row.getValue(id)));
      },
      meta: {
        label: "Role Verified",
        variant: "multiSelect" as const,
        options: [
          { label: "Verified", value: "true" },
          { label: "Pending", value: "false" },
        ],
      },
      size: 120,
    },
    {
      id: "vendorStatus",
      accessorFn: (row) => (row as any).vendorApprovalStatus,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Vendor Status" />
      ),
      cell: ({ row }) => {
        const user = row.original;
        const vendorStatus = (user as any).vendorApprovalStatus;
        const rejectionReason = (user as any).vendorRejectionReason;
        
        if (user.role !== 'VENDOR') {
          return <span className="text-xs text-muted-foreground">N/A</span>;
        }

        if (!vendorStatus || vendorStatus === 'PENDING') {
          return (
            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
              Pending
            </Badge>
          );
        }
        
        if (vendorStatus === 'APPROVED') {
          return (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              Approved
            </Badge>
          );
        }
        
        if (vendorStatus === 'REJECTED') {
          return (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge 
                    variant="outline" 
                    className="bg-red-50 text-red-700 border-red-200 cursor-help"
                  >
                    Rejected
                  </Badge>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="font-semibold mb-1">Rejection Reason:</p>
                  <p className="text-sm">{rejectionReason || 'No reason provided'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        }

        return null;
      },
      enableColumnFilter: true,
      filterFn: (row, id, value) => {
        return Array.isArray(value) && value.includes(String(row.getValue(id)));
      },
      meta: {
        label: "Vendor Status",
        variant: "multiSelect" as const,
        options: [
          { label: "Pending", value: "PENDING" },
          { label: "Approved", value: "APPROVED" },
          { label: "Rejected", value: "REJECTED" },
        ],
      },
      size: 140,
    },
    {
      id: "createdAt",
      accessorKey: "createdAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Created At" />
      ),
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {formatDate(row.getValue("createdAt"))}
        </span>
      ),
      enableColumnFilter: true,
      meta: {
        label: "Created At",
        variant: "date" as const,
        operators: ["isRelativeToToday", "lt", "lte", "gt", "gte"],
      },
      size: 150,
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const user = row.original;
        const isVendor = user.role === 'VENDOR';
        const vendorStatus = (user as any).vendorApprovalStatus;
        const isAcademicRole = ['PROFESSOR', 'TA', 'STAFF'].includes(user.role);
        const needsRoleVerification = isAcademicRole && !user.roleVerifiedByAdmin;
        const needsVendorApproval = isVendor && vendorStatus === 'PENDING';

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                aria-label="Open menu"
                variant="ghost"
                className="flex size-8 p-0 data-[state=open]:bg-muted"
              >
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {needsRoleVerification && (
                <>
                  <DropdownMenuItem onClick={() => onVerifyRole?.(user.id)}>
                    <UserCheck className="mr-2 size-4" />
                    Verify Role
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              {needsVendorApproval && (
                <>
                  <DropdownMenuItem 
                    className="text-green-600"
                    onClick={() => onApproveVendor?.(user.id)}
                  >
                    <CheckCircle className="mr-2 size-4" />
                    Approve Vendor
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="text-red-600"
                    onClick={() => onRejectVendor?.(user.id)}
                  >
                    <XCircle className="mr-2 size-4" />
                    Reject Vendor
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem 
                className="text-yellow-600"
                onClick={() => {
                  if (user.isBlocked) {
                    onUnblockUser?.(user.id);
                  } else {
                    onBlockUser?.(user.id);
                  }
                }}
              >
                <UserX className="mr-2 size-4" />
                {user.isBlocked ? "Unblock" : "Block"}
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="text-destructive"
                onClick={() => onDeleteUser?.(user.id)}
              >
                <Trash2 className="mr-2 size-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
      size: 40,
    },
  ];
}
