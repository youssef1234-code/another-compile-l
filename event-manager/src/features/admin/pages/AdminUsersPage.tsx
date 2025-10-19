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
import { Users, UserCheck, UserX } from 'lucide-react';

type ExtendedFilter = {
  id: string;
  value: string | string[];
  operator: "isEmpty" | "isNotEmpty" | "iLike" | "notILike" | "eq" | "ne" | "inArray" | "notInArray" | "lt" | "lte" | "gt" | "gte" | "isBetween" | "isRelativeToToday";
  variant: "number" | "date" | "text" | "select" | "multiSelect" | "boolean" | "range" | "dateRange";
  filterId: string;
};
import { useMemo, useState, useCallback, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useQueryState, parseAsInteger, parseAsString, parseAsArrayOf, parseAsJson, parseAsBoolean } from 'nuqs';
import { formatValidationErrors } from '@/lib/format-errors';

import { FormSheet, FormSheetContent, FormSheetField, FormSheetFooter, ConfirmDialog } from '@/components/generic';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { exportToCSV, formatDate } from '@/lib/design-system';
import { trpc } from '@/lib/trpc';
import { UsersTable } from '../components/users-table';
import { usePageMeta } from '@/components/layout/page-meta-context';

export function AdminUsersPage() {
  const utils = trpc.useUtils();
  const { setPageMeta } = usePageMeta();
  
  // Set page title and description in the top bar
  useEffect(() => {
    setPageMeta({
      title: 'Users',
      description: 'Manage all users in the system with advanced filters and sorting',
    });
  }, [setPageMeta]);
  
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
  const [rejectVendorDialog, setRejectVendorDialog] = useState<{ open: boolean; userId: string; reason: string }>({
    open: false,
    userId: '',
    reason: '',
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
  const [perPage] = useQueryState('perPage', parseAsInteger.withDefault(10));
  const [search] = useQueryState('search', parseAsString.withDefault(''));
  const [sortState] = useQueryState('sort', parseAsJson<Array<{id: string; desc: boolean}>>((v) => {
    if (!v) return null;
    if (typeof v === 'string') {
      try {
        return JSON.parse(v) as Array<{id: string; desc: boolean}>;
      } catch {
        return null;
      }
    }
    return v as Array<{id: string; desc: boolean}>;
  }).withDefault([]));
  
  // Read simple filters from URL - these are managed by DataTableFacetedFilter (advanced mode)
  const [roleFilter] = useQueryState('role', parseAsArrayOf(parseAsString, ',').withDefault([]));
  const [statusFilter] = useQueryState('status', parseAsArrayOf(parseAsString, ',').withDefault([]));
  const [isVerifiedFilter] = useQueryState('isVerified', parseAsArrayOf(parseAsString, ',').withDefault([]));
  const [roleVerifiedFilter] = useQueryState('roleVerifiedByAdmin', parseAsArrayOf(parseAsString, ',').withDefault([]));
  const [vendorStatusFilter] = useQueryState('vendorStatus', parseAsArrayOf(parseAsString, ',').withDefault([]));
  const [showPendingApprovals, setShowPendingApprovals] = useQueryState('pendingApprovals', parseAsBoolean.withDefault(false));

  // Read extended filters from URL - these are managed by DataTableFilterMenu (command mode)
  const [extendedFiltersState] = useQueryState('filters', parseAsJson<ExtendedFilter[]>((v) => {
    if (!v) return null;
    if (typeof v === 'string') {
      try {
        return JSON.parse(v) as ExtendedFilter[];
      } catch {
        return null;
      }
    }
    return v as ExtendedFilter[];
  }).withDefault([]));
  
  // Read join operator for extended filters (and/or)
  const [joinOperator] = useQueryState('joinOperator', parseAsString.withDefault('and'));

  // Build simple filters object for backend (advanced mode)
  const filters = useMemo(() => {
    const result: Record<string, string[]> = {};
    if (roleFilter.length > 0) result.role = roleFilter;
    if (statusFilter.length > 0) result.status = statusFilter;
    if (isVerifiedFilter.length > 0) result.isVerified = isVerifiedFilter;
    if (roleVerifiedFilter.length > 0) result.roleVerifiedByAdmin = roleVerifiedFilter;
    if (vendorStatusFilter.length > 0) result.vendorStatus = vendorStatusFilter;
    return result;
  }, [roleFilter, statusFilter, isVerifiedFilter, roleVerifiedFilter, vendorStatusFilter]);

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
      pendingApprovalsOnly: showPendingApprovals || undefined,
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
  const createUserMutation = (trpc.auth as typeof trpc.auth & { createAdminAccount: typeof trpc.auth.getAllUsers }).createAdminAccount.useMutation({
    onSuccess: () => {
      toast.success('User created successfully');
      utils.auth.getAllUsers.invalidate();
      utils.auth.getUserStats.invalidate();
      setIsCreateOpen(false);
      setCreateForm({ email: '', firstName: '', lastName: '', role: '', password: '' });
    },
    onError: (error) => {
      const errorMessage = formatValidationErrors(error);
      toast.error(errorMessage, { style: { whiteSpace: 'pre-line' } });
    },
  });

  const updateUserMutation = (trpc.auth as typeof trpc.auth & { updateUser: typeof trpc.auth.getAllUsers }).updateUser.useMutation({
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
      const errorMessage = formatValidationErrors(error);
      toast.error(errorMessage, { style: { whiteSpace: 'pre-line' } });
    },
  });

  const approveVendorMutation = trpc.auth.processVendorApproval.useMutation({
    onSuccess: () => {
      toast.success('Vendor approved successfully');
      utils.auth.getAllUsers.invalidate();
      utils.auth.getUserStats.invalidate();
    },
    onError: (error) => {
      const errorMessage = formatValidationErrors(error);
      toast.error(errorMessage, { style: { whiteSpace: 'pre-line' } });
    },
  });

  const rejectVendorMutation = trpc.auth.processVendorApproval.useMutation({
    onSuccess: () => {
      toast.success('Vendor rejected');
      utils.auth.getAllUsers.invalidate();
      utils.auth.getUserStats.invalidate();
    },
    onError: (error) => {
      const errorMessage = formatValidationErrors(error);
      toast.error(errorMessage, { style: { whiteSpace: 'pre-line' } });
    },
  });

  const blockUserMutation = trpc.auth.blockUser.useMutation({
    onSuccess: () => {
      toast.success('User blocked successfully');
      utils.auth.getAllUsers.invalidate();
      utils.auth.getUserStats.invalidate();
    },
    onError: (error) => {
      const errorMessage = formatValidationErrors(error);
      toast.error(errorMessage, { style: { whiteSpace: 'pre-line' } });
    },
  });

  const unblockUserMutation = trpc.auth.unblockUser.useMutation({
    onSuccess: () => {
      toast.success('User unblocked successfully');
      utils.auth.getAllUsers.invalidate();
      utils.auth.getUserStats.invalidate();
    },
    onError: (error) => {
      const errorMessage = formatValidationErrors(error);
      toast.error(errorMessage, { style: { whiteSpace: 'pre-line' } });
    },
  });

  const deleteUserMutation = (trpc.auth as typeof trpc.auth & { deleteAdminAccount: typeof trpc.auth.getAllUsers }).deleteAdminAccount.useMutation({
    onSuccess: () => {
      toast.success('User deleted successfully');
      utils.auth.getAllUsers.invalidate();
      utils.auth.getUserStats.invalidate();
    },
    onError: (error) => {
      const errorMessage = formatValidationErrors(error);
      toast.error(errorMessage, { style: { whiteSpace: 'pre-line' } });
    },
  });

  // Handlers - wrapped in useCallback for performance
  const handleUpdateUser = useCallback(async (userId: string, field: string, value: string) => {
    const updates: Record<string, string> = {};
    updates[field] = value;
    
    try {
      await updateUserMutation.mutateAsync({ 
        userId, 
        ...updates 
      });
    } catch (error: unknown) {
      // Use universal error formatter
      const errorMessage = formatValidationErrors(error);
      
      // Show toast with clean error message
      toast.error(errorMessage, { style: { whiteSpace: 'pre-line' } });
      
      // Re-throw with clean message for InlineEditCell to catch
      throw new Error(errorMessage);
    }
  }, [updateUserMutation]);

  const handleVerifyRole = useCallback((userId: string) => {
    verifyRoleMutation.mutate({ userId });
  }, [verifyRoleMutation]);

  const handleApproveVendor = useCallback((userId: string) => {
    approveVendorMutation.mutate({ userId, status: 'APPROVED' });
  }, [approveVendorMutation]);

  const handleRejectVendor = useCallback((userId: string) => {
    setRejectVendorDialog({ open: true, userId, reason: '' });
  }, []);

  const confirmRejectVendor = useCallback(() => {
    if (!rejectVendorDialog.reason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }
    
    rejectVendorMutation.mutate({
      userId: rejectVendorDialog.userId,
      status: 'REJECTED',
      rejectionReason: rejectVendorDialog.reason,
    });
    setRejectVendorDialog({ open: false, userId: '', reason: '' });
  }, [rejectVendorDialog, rejectVendorMutation]);

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

  const handleTogglePendingApprovals = useCallback(() => {
    setShowPendingApprovals(!showPendingApprovals);
  }, [showPendingApprovals, setShowPendingApprovals]);

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

      const allUsers = allUsersResponse.users.map((user) => ({
        ...user,
        status: (user as User & { isBlocked?: boolean }).isBlocked ? 'BLOCKED' : 'ACTIVE',
      }));

      const exportData = allUsers.map((user) => ({
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
    <div className="flex flex-col gap-6 p-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          const colorClasses = {
            success: 'text-green-600 bg-green-50 border-green-200',
            warning: 'text-yellow-600 bg-yellow-50 border-yellow-200',
            critical: 'text-red-600 bg-red-50 border-red-200',
            info: 'text-blue-600 bg-blue-50 border-blue-200',
            brand: 'text-purple-600 bg-purple-50 border-purple-200',
          };
          const colorRole = stat.colorRole || 'info';
          
          return (
            <div key={index} className="flex items-center gap-3 px-4 py-3 rounded-lg border bg-card">
              {Icon && (
                <div className={`p-2 rounded-md ${colorClasses[colorRole]}`}>
                  <Icon className="h-5 w-5" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-muted-foreground truncate">{stat.label}</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-semibold tracking-tight">{stat.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Users Table with full tablecn integration */}
      <UsersTable
        data={users}
        pageCount={pageCount}
        roleCounts={roleCounts}
        statusCounts={{
          active: statsData?.active || 0,
          blocked: statsData?.blocked || 0,
        }}
        isSearching={isLoading}
        showPendingApprovals={showPendingApprovals}
        onTogglePendingApprovals={handleTogglePendingApprovals}
        onExport={handleExport}
        onCreateUser={() => setIsCreateOpen(true)}
        exportDisabled={isLoading}
        exportLabel={search || Object.keys(filters).length > 0 ? 'Export Filtered' : 'Export All'}
        onUpdateUser={handleUpdateUser}
        onVerifyRole={handleVerifyRole}
        onApproveVendor={handleApproveVendor}
        onRejectVendor={handleRejectVendor}
        onBlockUser={handleBlockUser}
        onUnblockUser={handleUnblockUser}
        onDeleteUser={handleDeleteUser}
      />

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

      {/* Vendor Rejection Dialog */}
      <Dialog 
        open={rejectVendorDialog.open} 
        onOpenChange={(open) => setRejectVendorDialog({ ...rejectVendorDialog, open })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Vendor Application</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this vendor application. This will be sent to the applicant.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Rejection Reason</Label>
              <Textarea
                id="reason"
                placeholder="e.g., Documentation incomplete, business license not valid, etc."
                value={rejectVendorDialog.reason}
                onChange={(e) => setRejectVendorDialog({ ...rejectVendorDialog, reason: e.target.value })}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setRejectVendorDialog({ open: false, userId: '', reason: '' })}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={confirmRejectVendor}
              disabled={rejectVendorMutation.isPending}
            >
              {rejectVendorMutation.isPending ? 'Rejecting...' : 'Reject Application'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
