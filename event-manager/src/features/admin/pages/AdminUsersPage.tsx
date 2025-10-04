/**
 * Admin Users Page
 * 
 * Manage all users with GenericDataTable
 * Sprint 1 Requirement #20: View list of all users with details and status
 */

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

  // Fetch users - using type assertion until backend types regenerate
  const { data, isLoading } = (trpc.auth as any).getAllUsers.useQuery({
    page: 1,
    limit: 20,
  });

  // Cast users to proper type
  const users = (data?.users || []) as User[];

  // Mutations
  const blockUserMutation = (trpc.auth as any).blockUser.useMutation({
    onSuccess: () => {
      toast.success('User blocked successfully');
      (utils.auth as any).getAllUsers.invalidate();
    },
    onError: (error: any) => toast.error(error.message),
  });

  const unblockUserMutation = (trpc.auth as any).unblockUser.useMutation({
    onSuccess: () => {
      toast.success('User unblocked successfully');
      (utils.auth as any).getAllUsers.invalidate();
    },
    onError: (error: any) => toast.error(error.message),
  });

  const verifyRoleMutation = (trpc.auth as any).verifyRole.useMutation({
    onSuccess: () => {
      toast.success('Role verified successfully');
      (utils.auth as any).getAllUsers.invalidate();
    },
    onError: (error: any) => toast.error(error.message),
  });

  const deleteUserMutation = (trpc.auth as any).deleteAdminAccount.useMutation({
    onSuccess: () => {
      toast.success('User deleted successfully');
      (utils.auth as any).getAllUsers.invalidate();
    },
    onError: (error: any) => toast.error(error.message),
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
        const variants: Record<string, string> = {
          ADMIN: 'destructive',
          EVENT_OFFICE: 'default',
          PROFESSOR: 'secondary',
          TA: 'secondary',
          STAFF: 'secondary',
          STUDENT: 'outline',
          VENDOR: 'outline',
        };
        return (
          <Badge variant={variants[role] as any}>
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
        const variants: Record<string, string> = {
          ACTIVE: 'default',
          PENDING_VERIFICATION: 'secondary',
          BLOCKED: 'destructive',
        };
        return (
          <Badge variant={variants[status] as any}>
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
          View and manage all registered users (Sprint 1 - Req #20)
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.total || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {users.filter((u: User) => u.status === 'ACTIVE').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {users.filter((u: User) => u.status === 'PENDING_VERIFICATION').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Blocked</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {users.filter((u: User) => u.status === 'BLOCKED').length}
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
        </CardContent>
      </Card>
    </div>
  );
}

