/**
 * Court Management Page
 * 
 * Admin and Event Office can:
 * - View all courts in a data table
 * - Create new courts
 * - Edit court details
 * - Upload court images
 * - Delete courts
 * - View all court registrations with proper pagination
 */

import { useEffect, useState, useMemo, useCallback } from 'react';
import { trpc } from '@/lib/trpc';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'react-hot-toast';
import { usePageMeta } from '@/components/layout/page-meta-context';
import { formatValidationErrors } from '@/lib/format-errors';
import type { CourtSport, Coordinates } from '@event-manager/shared';
import type { TRPCClientErrorLike } from '@trpc/client';
import type { AppRouter } from '../../../../../backend/src/routers/app.router';
import { CourtFormSheet } from '../components/CourtFormSheet';
import { CourtsTable } from '../components/courts-table';
import { RegistrationsTable } from '../components/registrations-table';
import type { Registration } from '../components/registration-table-columns';
import { Button } from '@/components/ui/button';
import { useQueryState, parseAsInteger, parseAsString, parseAsJson, parseAsArrayOf, parseAsStringLiteral } from 'nuqs';
import { Building2, ClipboardList } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CourtData {
  id: string;
  name: string;
  sport: CourtSport;
  location: string;
  description?: string;
  specs?: string;
  customInstructions?: string;
  images: string[];
  coordinates?: Coordinates;
}

interface CourtFormData {
  id?: string;
  name: string;
  sport: CourtSport;
  location: string;
  description?: string;
  specs?: string;
  customInstructions?: string;
  images: string[];
  coordinates?: Coordinates;
}

export function CourtManagementPage() {
  const { setPageMeta } = usePageMeta();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingCourt, setEditingCourt] = useState<CourtData | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  
  // Tab state (courts | registrations)
  const [activeTab, setActiveTab] = useQueryState(
    'tab',
    parseAsStringLiteral(['courts', 'registrations'] as const).withDefault('courts')
  );

  useEffect(() => {
    setPageMeta({
      title: 'Court Management',
      description: 'Manage sports courts and their details',
    });
  }, [setPageMeta]);

  // Read URL state for pagination, sorting, filters
  const [page] = useQueryState('page', parseAsInteger.withDefault(1));
  const [perPage] = useQueryState('perPage', parseAsInteger.withDefault(50));
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
  const [search] = useQueryState('search', parseAsString.withDefault(''));
  
  // Read individual filter params (managed by DataTableFacetedFilter)
  const [sportFilter] = useQueryState('sport', parseAsArrayOf(parseAsString, ',').withDefault([]));
  
  // Read extended filters from URL (managed by DataTableFilterMenu in advanced mode)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [extendedFiltersState] = useQueryState('filters', parseAsJson<Array<{id: string; value: any; operator: string; variant: string; filterId: string}>>((v) => {
    if (!v) return null;
    if (typeof v === 'string') {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return JSON.parse(v) as Array<{id: string; value: any; operator: string; variant: string; filterId: string}>;
      } catch {
        return null;
      }
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return v as Array<{id: string; value: any; operator: string; variant: string; filterId: string}>;
  }).withDefault([]));

  const utils = trpc.useUtils();
  
  // Build simple filters object from individual URL params
  const filters = useMemo(() => {
    const result: Record<string, string[]> = {};
    if (sportFilter.length > 0) result.sport = sportFilter;
    // Text filters are handled by extendedFilters, not simple filters
    return result;
  }, [sportFilter]);
  
  // Parse extended filters
  const extendedFilters = useMemo(() => {
    const result = Array.isArray(extendedFiltersState) && extendedFiltersState.length > 0
      ? extendedFiltersState
      : [];
    return result.length > 0 ? result : undefined;
  }, [extendedFiltersState]);
  
  // Build query params from URL state
  const queryParams = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const params: any = {
      page,
      limit: perPage,
    };

    if (search) params.search = search;
    if (Object.keys(filters).length > 0) params.filters = filters;
    if (extendedFilters && extendedFilters.length > 0) params.extendedFilters = extendedFilters;
    if (sortState && sortState.length > 0) params.sorting = sortState;

    return params;
  }, [page, perPage, search, filters, extendedFilters, sortState]);

  const { data: courtsResponse, isLoading } = trpc.courts.getAll.useQuery(queryParams);
  const courts = courtsResponse?.data || [];
  const pageCount = courtsResponse?.pageCount || 0;

  // Registrations query state (managed by the table component)
  const [regQueryParams, setRegQueryParams] = useState({
    page: 1,
    perPage: 50,
    search: '',
    sorting: [{ id: 'startDate', desc: true }] as Array<{ id: string; desc: boolean }>,
  });

  // Registrations date range - show past 7 days to next 30 days
  const registrationsDateRange = useMemo(() => {
    const now = new Date();
    return {
      start: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7),
      end: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 30),
    };
  }, []);

  // Callback to update registrations query params from table
  const handleRegQueryChange = useCallback((params: {
    page: number;
    perPage: number;
    search: string;
    sorting: Array<{ id: string; desc: boolean }>;
  }) => {
    setRegQueryParams(params);
  }, []);

  // Fetch registrations with pagination (only when on registrations tab)
  const { data: registrationsData, isLoading: isLoadingRegistrations } = trpc.courts.getAllRegistrations.useQuery(
    {
      startDate: registrationsDateRange.start,
      endDate: registrationsDateRange.end,
      page: regQueryParams.page,
      limit: regQueryParams.perPage,
      search: regQueryParams.search || undefined,
      sorting: regQueryParams.sorting,
    },
    { enabled: activeTab === 'registrations' }
  );

  const registrations = (registrationsData?.registrations || []) as Registration[];
  const registrationsPageCount = registrationsData?.pageCount || 1;

  const createMutation = trpc.courts.create.useMutation({
    onSuccess: () => {
      toast.success('Court created successfully');
      utils.courts.getAll.invalidate();
      setIsSheetOpen(false);
      setEditingCourt(null);
    },
    onError: (error: TRPCClientErrorLike<AppRouter>) => {
      const errorMessage = formatValidationErrors(error);
      toast.error(errorMessage, { style: { whiteSpace: 'pre-line' } });
    },
  });

  const updateMutation = trpc.courts.update.useMutation({
    onSuccess: () => {
      toast.success('Court updated successfully');
      utils.courts.getAll.invalidate();
      setIsSheetOpen(false);
      setEditingCourt(null);
    },
    onError: (error: TRPCClientErrorLike<AppRouter>) => {
      const errorMessage = formatValidationErrors(error);
      toast.error(errorMessage, { style: { whiteSpace: 'pre-line' } });
    },
  });

  const deleteMutation = trpc.courts.delete.useMutation({
    onSuccess: () => {
      toast.success('Court deleted successfully');
      utils.courts.getAll.invalidate();
      setDeleteConfirmId(null);
    },
    onError: (error: TRPCClientErrorLike<AppRouter>) => {
      const errorMessage = formatValidationErrors(error);
      toast.error(errorMessage, { style: { whiteSpace: 'pre-line' } });
    },
  });

  const handleCreateNew = () => {
    setEditingCourt(null);
    setIsSheetOpen(true);
  };

  const handleEdit = (court: CourtData) => {
    setEditingCourt(court);
    setIsSheetOpen(true);
  };

  const handleFormSubmit = async (formData: CourtFormData) => {
    if (editingCourt) {
      await updateMutation.mutateAsync({ ...formData, id: editingCourt.id });
    } else {
      await createMutation.mutateAsync(formData);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteMutation.mutateAsync({ id });
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* View Toggle - GymSchedulePage Style */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 rounded-lg p-1 bg-muted/30 border">
          <Button 
            variant="ghost"
            size="sm" 
            onClick={() => setActiveTab('courts')}
            className={cn(
              'gap-2 transition-all',
              activeTab === 'courts'
                ? 'bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary' 
                : 'hover:bg-muted text-muted-foreground'
            )}
          >
            <Building2 className="h-4 w-4"/> Courts
          </Button>
          <Button 
            variant="ghost"
            size="sm" 
            onClick={() => setActiveTab('registrations')}
            className={cn(
              'gap-2 transition-all',
              activeTab === 'registrations'
                ? 'bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary' 
                : 'hover:bg-muted text-muted-foreground'
            )}
          >
            <ClipboardList className="h-4 w-4"/> Registrations
          </Button>
        </div>

        {/* Create Button - only show on Courts tab */}
        {activeTab === 'courts' && (
          <Button onClick={handleCreateNew} className="gap-2">
            + Add Court
          </Button>
        )}
      </div>

      {/* Courts View */}
      {activeTab === 'courts' && (
        <CourtsTable
          data={courts as CourtData[]}
          pageCount={pageCount}
          isLoading={isLoading}
          onEdit={handleEdit}
          onDelete={(id) => setDeleteConfirmId(id)}
          queryKeys={{
            page: 'page',
            perPage: 'perPage',
            sort: 'sort',
            filters: 'filters',
            joinOperator: 'joinOperator',
          }}
          isSearching={isLoading}
          />
      )}

      {/* Registrations View */}
      {activeTab === 'registrations' && (
        <RegistrationsTable
          data={registrations}
          pageCount={registrationsPageCount}
          isLoading={isLoadingRegistrations}
          onQueryChange={handleRegQueryChange}
        />
      )}

      {/* Form Sheet */}
      <CourtFormSheet
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        court={editingCourt}
        onSubmit={handleFormSubmit}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Court</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this court? This action cannot be undone and will
              affect all future bookings.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
