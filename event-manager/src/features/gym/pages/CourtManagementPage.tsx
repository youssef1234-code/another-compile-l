/**
 * Court Management Page
 * 
 * Admin and Event Office can:
 * - View all courts in a data table
 * - Create new courts
 * - Edit court details
 * - Upload court images
 * - Delete courts
 * - View court schedules
 */

import { useEffect, useState, useMemo } from 'react';
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
import type { CourtSport } from '@event-manager/shared';
import type { TRPCClientErrorLike } from '@trpc/client';
import type { AppRouter } from '../../../../../backend/src/routers/app.router';
import { CourtFormSheet } from '../components/CourtFormSheet';
import { CourtsTable } from '../components/courts-table';
import { Button } from '@/components/ui/button';
import { useQueryState, parseAsInteger, parseAsString, parseAsJson, parseAsArrayOf } from 'nuqs';

interface CourtData {
  id: string;
  name: string;
  sport: CourtSport;
  location: string;
  description?: string;
  specs?: string;
  customInstructions?: string;
  images: string[];
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
}

export function CourtManagementPage() {
  const { setPageMeta } = usePageMeta();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [selectedCourt, setSelectedCourt] = useState<CourtData | null>(null);
  const [editingCourt, setEditingCourt] = useState<CourtData | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

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
  const [extendedFiltersState] = useQueryState('filters', parseAsJson<Array<{id: string; value: any; operator: string; variant: string; filterId: string}>>((v) => {
    if (!v) return null;
    if (typeof v === 'string') {
      try {
        return JSON.parse(v) as Array<{id: string; value: any; operator: string; variant: string; filterId: string}>;
      } catch {
        return null;
      }
    }
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

  const handleViewSchedule = (court: CourtData) => {
    setSelectedCourt(court);
    setIsScheduleDialogOpen(true);
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
      {/* Courts Table */}
      <CourtsTable
        data={courts as CourtData[]}
        pageCount={pageCount}
        isLoading={isLoading}
        onEdit={handleEdit}
        onDelete={(id) => setDeleteConfirmId(id)}
        onViewSchedule={handleViewSchedule}
        onCreate={handleCreateNew}
        queryKeys={{
          page: 'page',
          perPage: 'perPage',
          sort: 'sort',
          filters: 'filters',
          joinOperator: 'joinOperator',
        }}
        isSearching={isLoading}
      />

      {/* Form Sheet */}
      <CourtFormSheet
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        court={editingCourt}
        onSubmit={handleFormSubmit}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />

      {/* Schedule Dialog */}
      <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{selectedCourt?.name} - Reservation Schedule</DialogTitle>
            <DialogDescription>
              View all reservations for this court
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-center text-muted-foreground">
              Schedule view coming soon...
            </p>
          </div>
        </DialogContent>
      </Dialog>

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
