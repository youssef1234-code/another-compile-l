/**
 * Admin Users Page - Complete tablecn Implementation
 * 
 * Professional admin interface using full tablecn pattern
 * Features:
 * - Global search with URL state
 * - Multi-field sorting with URL state
 * - Faceted filters with URL state (role, status)
 * - Server-side pagination
 * - Inline editing for user details
 * - Column visibility toggle
 * - Shareable URLs (all state in URL params)
 */

import type { User } from '@event-manager/shared';
import { Download, UserPlus, Users, UserCheck, UserX } from 'lucide-react';
import { useMemo, useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { useQueryState, parseAsInteger, parseAsString, parseAsArrayOf, parseAsJson } from 'nuqs';

import { PageHeader, FormSheet, FormSheetContent, FormSheetField, FormSheetFooter, ConfirmDialog } from '@/components/generic';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { exportToCSV, formatDate } from '@/lib/design-system';
import { trpc } from '@/lib/trpc';
import { UsersTable } from '../components/users-table';

export function AdminUsersPage() {
  const utils = trpc.useUtils();
  
  // Confirmation dialog state
  const [blockDialog, setBlockDialog] = useState<{ open: boolean; userId: string; isBlocked: boolean }>({
    open: false,
    userId: '',
    isBlocked: false,
  });
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; userId: string }>({
    open: false,
    userId: '',
  });
  
  // Form state for creating users
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    email: '',
    firstName: '',
    lastName: '',
    role: '',
    password: '',
  });

  // Read URL state for pagination, sorting, filters, and search
  const [page] = useQueryState('page', parseAsInteger.withDefault(1));
  const [perPage] = useQueryState('perPage', parseAsInteger.withDefault(20));
  const [search] = useQueryState('search', parseAsString.withDefault(''));
  const [sortState] = useQueryState('sort', parseAsJson<Array<{id: string; desc: boolean}>>([] as any).withDefault([]));
  
  // Read simple filters from URL - these are managed by DataTableFacetedFilter (advanced mode)
  const [roleFilter] = useQueryState('role', parseAsArrayOf(parseAsString, ',').withDefault([]));
  const [statusFilter] = useQueryState('status', parseAsArrayOf(parseAsString, ',').withDefault([]));

  // Read extended filters from URL - these are managed by DataTableFilterMenu (command mode)
  const [extendedFiltersState] = useQueryState('filters', parseAsJson<Array<any>>([] as any).withDefault([]));
  
  // Read join operator for extended filters (and/or)
  const [joinOperator] = useQueryState('joinOperator', parseAsString.withDefault('and'));

  // Build simple filters object for backend (advanced mode)
  const filters = useMemo(() => {
    const result: Record<string, string[]> = {};
    if (roleFilter.length > 0) result.role = roleFilter;
    if (statusFilter.length > 0) result.status = statusFilter;
    return result;
  }, [roleFilter, statusFilter]);

  // Parse extended filters (command mode)
  const extendedFilters = useMemo(() => {
    try {
      if (Array.isArray(extendedFiltersState) && extendedFiltersState.length > 0) {
        return extendedFiltersState;
      }
      return undefined;
    } catch {
      return undefined;
    }
  }, [extendedFiltersState]);

  // Parse sort state
  const parsedSort = useMemo(() => {
    try {
      if (Array.isArray(sortState)) {
        return sortState as Array<{id: string; desc: boolean}>;
      }
      return [];
    } catch {
      return [];
    }
  }, [sortState]);

  // Fetch user stats for header
  const { data: statsData } = trpc.auth.getUserStats.useQuery(undefined, {
    staleTime: 60000,
  });

  // Fetch users with ALL URL parameters - supports both advanced and command modes!
  const { data, isLoading } = trpc.auth.getAllUsers.useQuery(
    {
      page,
      perPage,
      search: search || undefined,
      sort: parsedSort.length > 0 ? parsedSort : undefined,
      filters: Object.keys(filters).length > 0 ? filters : undefined,
      extendedFilters: extendedFilters,
      joinOperator: (joinOperator === 'or' ? 'or' : 'and') as 'and' | 'or',
    },
    {
      placeholderData: (previousData) => previousData,
      staleTime: 5000, // Reduced for better responsiveness
    }
  );

  // Transform users to add status field
  const users = useMemo(() => {
    const rawUsers = data?.users || [];
    return rawUsers.map(user => ({
      ...user,
      status: user.isBlocked ? 'BLOCKED' as const : 'ACTIVE' as const,
    }));
  }, [data?.users]);

  const pageCount = useMemo(() => {
    return data?.totalPages || 0;
  }, [data?.totalPages]);

  // Calculate role counts from CURRENT PAGE data (for display)
  // Note: For true counts across all data, we'd need a separate stats endpoint
  const roleCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    users.forEach(user => {
      counts[user.role] = (counts[user.role] || 0) + 1;
    });
    return counts;
  }, [users]);

  // Stats for page header
  const stats = useMemo(() => {
    if (!statsData) {
      return [
        { label: 'Total Users', value: data?.total || 0, icon: Users, colorRole: 'info' as const },
      ];
    }

    return [
      { label: 'Total Users', value: statsData.total, icon: Users, colorRole: 'info' as const },
      { label: 'Active', value: statsData.active, icon: UserCheck, colorRole: 'success' as const },
      { label: 'Blocked', value: statsData.blocked, icon: UserX, colorRole: 'critical' as const },
    ];
  }, [statsData, data?.total]);

  // Mutations
  const createUserMutation = (trpc.auth as any).createAdminAccount.useMutation({
    onSuccess: () => {
      toast.success('User created successfully');
      utils.auth.getAllUsers.invalidate();
      utils.auth.getUserStats.invalidate();
      setIsCreateOpen(false);
      setCreateForm({ email: '', firstName: '', lastName: '', role: '', password: '' });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create user');
    },
  });

  const updateUserMutation = (trpc.auth as any).updateUser.useMutation({
    onSuccess: () => {
      toast.success('User updated successfully');
      utils.auth.getAllUsers.invalidate();
    },
    // Don't show toast here - let handleUpdateUser handle errors for better messages
  });

  const verifyRoleMutation = trpc.auth.verifyRole.useMutation({
    onSuccess: () => {
      toast.success('Role verified successfully');
      utils.auth.getAllUsers.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to verify role');
    },
  });

  const blockUserMutation = trpc.auth.blockUser.useMutation({
    onSuccess: () => {
      toast.success('User blocked successfully');
      utils.auth.getAllUsers.invalidate();
      utils.auth.getUserStats.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to block user');
    },
  });

  const unblockUserMutation = trpc.auth.unblockUser.useMutation({
    onSuccess: () => {
      toast.success('User unblocked successfully');
      utils.auth.getAllUsers.invalidate();
      utils.auth.getUserStats.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to unblock user');
    },
  });

  const deleteUserMutation = (trpc.auth as any).deleteAdminAccount.useMutation({
    onSuccess: () => {
      toast.success('User deleted successfully');
      utils.auth.getAllUsers.invalidate();
      utils.auth.getUserStats.invalidate();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete user');
    },
  });

  // Handlers - wrapped in useCallback for performance
  const handleUpdateUser = useCallback(async (userId: string, field: string, value: string) => {
    const updates: any = {};
    updates[field] = value;
    
    try {
      await updateUserMutation.mutateAsync({ 
        userId, 
        ...updates 
      });
    } catch (error: any) {
      // Extract user-friendly error message from tRPC/Zod errors
      let errorMessage = 'Failed to update user';
      
      // Handle tRPC validation errors (standard tRPC format)
      if (error?.data?.zodError?.fieldErrors) {
        const fieldErrors = error.data.zodError.fieldErrors;
        const firstFieldErrors = Object.values(fieldErrors)[0];
        if (Array.isArray(firstFieldErrors) && firstFieldErrors.length > 0) {
          errorMessage = firstFieldErrors[0];
        }
      } 
      // Handle error.message that contains stringified JSON array
      else if (error?.message && typeof error.message === 'string' && error.message.trim().startsWith('[')) {
        try {
          const parsed = JSON.parse(error.message);
          if (Array.isArray(parsed) && parsed.length > 0 && parsed[0]?.message) {
            errorMessage = parsed[0].message;
          }
        } catch {
          // If parsing fails, use the raw message
          errorMessage = error.message;
        }
      }
      // Handle direct array of errors
      else if (Array.isArray(error) && error.length > 0 && error[0]?.message) {
        errorMessage = error[0].message;
      }
      // Handle simple error message string
      else if (error?.message) {
        errorMessage = error.message;
      }
      
      // Show toast with clean error message
      toast.error(errorMessage);
      
      // Re-throw with clean message for InlineEditCell to catch
      throw new Error(errorMessage);
    }
  }, [updateUserMutation]);

  const handleVerifyRole = useCallback((userId: string) => {
    verifyRoleMutation.mutate({ userId });
  }, [verifyRoleMutation]);

  const handleBlockUser = useCallback((userId: string) => {
    // Find user to check if blocked
    const user = data?.users.find((u: User) => u.id === userId);
    setBlockDialog({
      open: true,
      userId,
      isBlocked: user?.isBlocked ?? false,
    });
  }, [data?.users]);

  const handleUnblockUser = useCallback((userId: string) => {
    // Same handler, just pass isBlocked state
    handleBlockUser(userId);
  }, [handleBlockUser]);

  const confirmBlockUnblock = useCallback(() => {
    if (blockDialog.isBlocked) {
      unblockUserMutation.mutate({ userId: blockDialog.userId });
    } else {
      blockUserMutation.mutate({ userId: blockDialog.userId });
    }
    setBlockDialog({ open: false, userId: '', isBlocked: false });
  }, [blockDialog, blockUserMutation, unblockUserMutation]);

  const handleDeleteUser = useCallback((userId: string) => {
    setDeleteDialog({ open: true, userId });
  }, []);

  const confirmDelete = useCallback(() => {
    deleteUserMutation.mutate({ userId: deleteDialog.userId });
    setDeleteDialog({ open: false, userId: '' });
  }, [deleteDialog.userId, deleteUserMutation]);

  const handleCreateUser = useCallback(() => {
    if (!createForm.email || !createForm.firstName || !createForm.lastName || !createForm.role || !createForm.password) {
      toast.error('Please fill in all fields');
      return;
    }

    if (createForm.role !== 'ADMIN' && createForm.role !== 'EVENT_OFFICE') {
      toast.error('Currently only ADMIN and EVENT_OFFICE users can be created from this interface');
      return;
    }

    createUserMutation.mutate({
      name: `${createForm.firstName} ${createForm.lastName}`,
      email: createForm.email,
      password: createForm.password,
      role: createForm.role as 'ADMIN' | 'EVENT_OFFICE',
    });
  }, [createForm, createUserMutation]);

  const handleExport = useCallback(async () => {
    try {
      // Export with current filters, sort, and search applied
      const allUsersResponse = await utils.auth.getAllUsers.fetch({
        page: 1,
        perPage: 999999,
        search: search || undefined,
        filters: Object.keys(filters).length > 0 ? filters : undefined,
        extendedFilters: extendedFilters,
        joinOperator: (joinOperator === 'or' ? 'or' : 'and') as 'and' | 'or',
        sort: parsedSort.length > 0 ? parsedSort : undefined,
      });

      const allUsers = allUsersResponse.users.map((user: any) => ({
        ...user,
        status: user.isBlocked ? 'BLOCKED' : 'ACTIVE',
      }));

      const exportData = allUsers.map((user: User) => ({
        Email: user.email,
        'First Name': user.firstName,
        'Last Name': user.lastName,
        Role: user.role,
        Status: user.status,
        Verified: user.isVerified ? 'Yes' : 'No',
        'Role Verified': user.roleVerifiedByAdmin ? 'Yes' : 'No',
        'Created At': formatDate(user.createdAt),
      }));
      
      exportToCSV(exportData, `users-export-${Date.now()}`);
      toast.success(`Exported ${allUsers.length} users successfully`);
    } catch (error) {
      toast.error('Failed to export users');
      console.error('Export error:', error);
    }
  }, [utils, search, filters, extendedFilters, joinOperator, parsedSort]);

  return (
    <>
      {/* Page Header */}
      <PageHeader
        title="Users"
        description="Manage all users in the system with advanced filters and sorting"
        stats={stats}
        actions={
          <>
            <Button variant="outline" onClick={handleExport} className="gap-2" disabled={isLoading}>
              <Download className="h-4 w-4" />
              Export {search || Object.keys(filters).length > 0 ? 'Filtered' : 'All'}
            </Button>
            <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
              <UserPlus className="h-4 w-4" />
              Create User
            </Button>
          </>
        }
      />

      {/* Users Table with full tablecn integration */}
      <div className="mt-6">
        <UsersTable
          data={users}
          pageCount={pageCount}
          roleCounts={roleCounts}
          statusCounts={{
            active: statsData?.active || 0,
            blocked: statsData?.blocked || 0,
          }}
          isSearching={isLoading}
          onUpdateUser={handleUpdateUser}
          onVerifyRole={handleVerifyRole}
          onBlockUser={handleBlockUser}
          onUnblockUser={handleUnblockUser}
          onDeleteUser={handleDeleteUser}
        />
      </div>

      {/* Create User Sheet */}
      <FormSheet
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        title="Create New User"
        description="Add a new admin or event office user to the system"
        isLoading={createUserMutation.isPending}
      >
        <FormSheetContent>
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleCreateUser(); }}>
            <FormSheetField label="Email" required>
              <Input
                type="email"
                value={createForm.email}
                onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                placeholder="user@example.com"
              />
            </FormSheetField>

            <FormSheetField label="First Name" required>
              <Input
                value={createForm.firstName}
                onChange={(e) => setCreateForm({ ...createForm, firstName: e.target.value })}
                placeholder="John"
              />
            </FormSheetField>

            <FormSheetField label="Last Name" required>
              <Input
                value={createForm.lastName}
                onChange={(e) => setCreateForm({ ...createForm, lastName: e.target.value })}
                placeholder="Doe"
              />
            </FormSheetField>

            <FormSheetField label="Role" required>
              <Select
                value={createForm.role}
                onValueChange={(value) => setCreateForm({ ...createForm, role: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="EVENT_OFFICE">Event Office</SelectItem>
                </SelectContent>
              </Select>
            </FormSheetField>

            <FormSheetField label="Password" required>
              <Input
                type="password"
                value={createForm.password}
                onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                placeholder="Enter password"
              />
            </FormSheetField>
          </form>
        </FormSheetContent>
        
        <FormSheetFooter>
          <Button
            variant="outline"
            onClick={() => setIsCreateOpen(false)}
            disabled={createUserMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreateUser}
            disabled={createUserMutation.isPending}
          >
            {createUserMutation.isPending ? 'Creating...' : 'Create User'}
          </Button>
        </FormSheetFooter>
      </FormSheet>

      {/* Block/Unblock Confirmation Dialog */}
      <ConfirmDialog
        open={blockDialog.open}
        onOpenChange={(open) => setBlockDialog({ ...blockDialog, open })}
        title={blockDialog.isBlocked ? 'Unblock User' : 'Block User'}
        description={
          blockDialog.isBlocked
            ? 'Are you sure you want to unblock this user? They will be able to access the system again.'
            : 'Are you sure you want to block this user? They will not be able to access the system until unblocked.'
        }
        confirmLabel={blockDialog.isBlocked ? 'Unblock' : 'Block'}
        onConfirm={confirmBlockUnblock}
        variant={blockDialog.isBlocked ? 'default' : 'destructive'}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}
        title="Delete User"
        description="This action cannot be undone. Are you sure you want to permanently delete this user account? All associated data will be removed."
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        variant="destructive"
      />
    </>
  );
}
