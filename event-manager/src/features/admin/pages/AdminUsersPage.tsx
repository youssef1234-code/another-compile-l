/**
 * Admin Users Page
 * 
 * Manage all users in the system
 * Features:
 * - View list of all users with details and status
 * - Block/unblock users
 * - Verify academic roles
 * - Delete admin/event office accounts
 * - Filter and search users
 * 
 * Improvements:
 * - Proper TanStack Query v5 usage with placeholderData
 * - Type-safe tRPC mutations
 * - Pagination state management
 * - Computed stats with useMemo
 */

import { useState, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import type { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, UserCheck, UserX, Trash2, Shield } from 'lucide-react';
import type { User } from '@event-manager/shared';

import { trpc } from '@/lib/trpc';
import { GenericDataTable } from '@/components/generic';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function AdminUsersPage() {
  const utils = trpc.useUtils();
  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  // Fetch users with proper pagination (TanStack Query v5)
  const { data, isLoading, isFetching } = trpc.auth.getAllUsers.useQuery(
    { page, limit },
    {
      placeholderData: (previousData) => previousData, // Keep showing old data while fetching new page (v5)
      staleTime: 30000, // Consider data fresh for 30 seconds
      refetchOnWindowFocus: false, // Don't refetch on every window focus
    }
  );

  const users = data?.users || [];
  const total = data?.total || 0;

  // Compute stats from current users data
  const stats = useMemo(() => {
    return {
      total,
      active: users.filter((u) => u.status === 'ACTIVE').length,
      pending: users.filter((u) => u.status === 'PENDING_VERIFICATION').length,
      blocked: users.filter((u) => u.status === 'BLOCKED').length,
    };
  }, [users, total]);

  // Mutations with type assertions (needed until tRPC types regenerate)
  const blockUserMutation = (trpc.auth as any).blockUser.useMutation({
    onSuccess: () => {
      toast.success('User blocked successfully');
      utils.auth.getAllUsers.invalidate();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to block user');
    },
  });

  const unblockUserMutation = (trpc.auth as any).unblockUser.useMutation({
    onSuccess: () => {
      toast.success('User unblocked successfully');
      utils.auth.getAllUsers.invalidate();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to unblock user');
    },
  });

  const verifyRoleMutation = (trpc.auth as any).verifyRole.useMutation({
    onSuccess: () => {
      toast.success('Role verified successfully');
      utils.auth.getAllUsers.invalidate();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to verify role');
    },
  });

  const deleteUserMutation = (trpc.auth as any).deleteAdminAccount.useMutation({
    onSuccess: () => {
      toast.success('User deleted successfully');
      utils.auth.getAllUsers.invalidate();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete user');
    },
  });

  // Table columns
  const columns: ColumnDef<User>[] = [
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ row }) => <div className="font-medium">{row.getValue('email')}</div>,
    },
    {
      accessorKey: 'firstName',
      header: 'Name',
      cell: ({ row }) => (
        <div>
          {row.original.firstName} {row.original.lastName}
        </div>
      ),
    },
    {
      accessorKey: 'role',
      header: 'Role',
      cell: ({ row }) => {
        const role = row.getValue('role') as string;
        const variantMap: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
          ADMIN: 'destructive',
          EVENT_OFFICE: 'default',
          PROFESSOR: 'secondary',
          TA: 'secondary',
          STAFF: 'secondary',
          STUDENT: 'outline',
          VENDOR: 'outline',
        };
        return (
          <Badge variant={variantMap[role] || 'default'}>
            {role}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.getValue('status') as string;
        const variantMap: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
          ACTIVE: 'default',
          PENDING_VERIFICATION: 'secondary',
          BLOCKED: 'destructive',
        };
        return (
          <Badge variant={variantMap[status] || 'default'}>
            {status}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'isVerified',
      header: 'Verified',
      cell: ({ row }) => (
        <div className="text-center">
          {row.getValue('isVerified') ? '✅' : '❌'}
        </div>
      ),
    },
    {
      accessorKey: 'roleVerifiedByAdmin',
      header: 'Role Verified',
      cell: ({ row }) => (
        <div className="text-center">
          {row.original.roleVerifiedByAdmin ? '✅' : '❌'}
        </div>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const user = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              {/* Verify Role */}
              {!user.roleVerifiedByAdmin && ['STAFF', 'TA', 'PROFESSOR'].includes(user.role) && (
                <DropdownMenuItem
                  onClick={() => verifyRoleMutation.mutate({ userId: user.id })}
                >
                  <Shield className="mr-2 h-4 w-4" />
                  Verify Role
                </DropdownMenuItem>
              )}
              
              {/* Block/Unblock */}
              {user.status !== 'BLOCKED' ? (
                <DropdownMenuItem
                  onClick={() => blockUserMutation.mutate({ userId: user.id })}
                  className="text-destructive"
                >
                  <UserX className="mr-2 h-4 w-4" />
                  Block User
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  onClick={() => unblockUserMutation.mutate({ userId: user.id })}
                >
                  <UserCheck className="mr-2 h-4 w-4" />
                  Unblock User
                </DropdownMenuItem>
              )}
              
              {/* Delete Admin/Event Office */}
              {(user.role === 'ADMIN' || user.role === 'EVENT_OFFICE') && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      if (confirm(`Delete ${user.email}?`)) {
                        deleteUserMutation.mutate({ userId: user.id });
                      }
                    }}
                    className="text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Account
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">User Management</h1>
        <p className="text-muted-foreground">
          View and manage all registered users
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.active}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {stats.pending}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Blocked</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats.blocked}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>
            Manage user accounts, verify roles, and control access
            {isFetching && !isLoading && ' (Refreshing...)'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <GenericDataTable
            columns={columns}
            data={users}
            isLoading={isLoading}
            searchKey="email"
            searchPlaceholder="Search by email..."
          />
          
          {/* Pagination */}
          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Page {page} of {data.totalPages} ({total} total users)
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1 || isFetching}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page === data.totalPages || isFetching}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

