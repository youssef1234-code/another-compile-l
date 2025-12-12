/**
 * Comment Moderation Page
 * 
 * Professional admin interface for reviewing AI-flagged comments
 * Uses data table pattern like the users page
 */

import { usePageMeta } from '@/components/layout/page-meta-context';
import { trpc } from '@/lib/trpc';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import { ModerationTable } from '../components/moderation-table';
import { useQueryState, parseAsInteger, parseAsString, parseAsArrayOf, parseAsJson } from 'nuqs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

// Types
export interface FlaggedComment {
  id: string;
  content: string;
  userId: string;
  userName: string;
  userEmail: string;
  eventId: string;
  eventName: string;
  eventType?: string;
  createdAt: Date | string;
  moderationStatus: string | null;
  moderationFlags: string[];
  moderationSeverity: 'none' | 'low' | 'medium' | 'high' | 'critical';
  moderationConfidence: number;
  moderationAiSuggestion?: 'approve' | 'remove';
}

type ExtendedFilter = {
  id: string;
  value: string | string[];
  operator: string;
  variant: string;
  filterId: string;
};

export function CommentModerationPage() {
  const { setPageMeta } = usePageMeta();
  const utils = trpc.useUtils();
  
  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedComment, setSelectedComment] = useState<FlaggedComment | null>(null);
  const [selectedComments, setSelectedComments] = useState<string[]>([]);
  const [actionType, setActionType] = useState<'approve' | 'remove' | null>(null);
  const [isBulkAction, setIsBulkAction] = useState(false);
  const [moderationNote, setModerationNote] = useState('');

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
  
  // Read simple filters from URL
  const [severityFilter] = useQueryState('moderationSeverity', parseAsArrayOf(parseAsString, ',').withDefault([]));
  const [flagsFilter] = useQueryState('moderationFlags', parseAsArrayOf(parseAsString, ',').withDefault([]));

  // Read extended filters from URL (for command mode)
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

  // Build simple filters object for backend
  const filters = useMemo(() => {
    const result: Record<string, string[]> = {};
    if (severityFilter.length > 0) result.moderationSeverity = severityFilter;
    if (flagsFilter.length > 0) result.moderationFlags = flagsFilter;
    return result;
  }, [severityFilter, flagsFilter]);

  // Parse sort array for backend
  const parsedSort = useMemo(() => {
    return sortState || [];
  }, [sortState]);

  // Convert extended filters to backend format
  const extendedFilters = useMemo(() => {
    if (!extendedFiltersState || extendedFiltersState.length === 0) return undefined;
    return extendedFiltersState;
  }, [extendedFiltersState]);

  useEffect(() => {
    setPageMeta({
      title: 'Comment Moderation',
      description: 'Review and moderate AI-flagged comments',
    });
  }, [setPageMeta]);

  // Fetch unmoderated comments - using the same pattern as getAllUsers
  const { data, isLoading, isFetching, refetch } = trpc.feedback.getUnmoderated.useQuery(
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
      staleTime: 1000,
      refetchOnWindowFocus: false,
    }
  );

  // Transform data
  const comments: FlaggedComment[] = useMemo(() => {
    return (data?.comments || []).map((c: any) => ({
      ...c,
      createdAt: new Date(c.createdAt),
    }));
  }, [data]);

  const pageCount = data ? Math.ceil(data.total / perPage) : 0;

  // Mutations
  const approveMutation = trpc.feedback.approveComment.useMutation({
    onSuccess: () => {
      toast.success('✓ Comment approved');
      utils.feedback.getUnmoderated.invalidate();
      setIsDialogOpen(false);
      setSelectedComment(null);
      setSelectedComments([]);
      setModerationNote('');
      setActionType(null);
      setIsBulkAction(false);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to approve comment');
    },
  });

  const removeMutation = trpc.feedback.removeComment.useMutation({
    onSuccess: () => {
      toast.success('✓ Comment removed and user notified');
      utils.feedback.getUnmoderated.invalidate();
      setIsDialogOpen(false);
      setSelectedComment(null);
      setSelectedComments([]);
      setModerationNote('');
      setActionType(null);
      setIsBulkAction(false);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to remove comment');
    },
  });

  // Bulk mutations - note: batchUpdateModeration is for AI results, not manual moderation
  // We'll process bulk actions sequentially using individual mutations
  const [bulkProcessing, setBulkProcessing] = useState(false);

  const handleApprove = (commentId: string) => {
    const comment = comments.find(c => c.id === commentId);
    if (comment) {
      setSelectedComment(comment);
      setActionType('approve');
      setIsDialogOpen(true);
    }
  };

  const handleRemove = (commentId: string) => {
    const comment = comments.find(c => c.id === commentId);
    if (comment) {
      setSelectedComment(comment);
      setActionType('remove');
      setIsDialogOpen(true);
    }
  };

  const handleBulkApprove = (commentIds: string[]) => {
    setSelectedComments(commentIds);
    setActionType('approve');
    setIsBulkAction(true);
    setIsDialogOpen(true);
  };

  const handleBulkRemove = (commentIds: string[]) => {
    setSelectedComments(commentIds);
    setActionType('remove');
    setIsBulkAction(true);
    setIsDialogOpen(true);
  };

  const handleConfirmAction = async () => {
    if (!actionType) return;
    
    if (isBulkAction && selectedComments.length > 0) {
      setBulkProcessing(true);
      let successCount = 0;
      let failCount = 0;
      
      // Process each comment sequentially
      for (const commentId of selectedComments) {
        try {
          if (actionType === 'approve') {
            await utils.client.feedback.approveComment.mutate({
              feedbackId: commentId,
              note: moderationNote || undefined,
            });
          } else {
            await utils.client.feedback.removeComment.mutate({
              feedbackId: commentId,
              note: moderationNote || undefined,
            });
          }
          successCount++;
        } catch (error) {
          failCount++;
          console.error(`Failed to moderate comment ${commentId}:`, error);
        }
      }
      
      setBulkProcessing(false);
      utils.feedback.getUnmoderated.invalidate();
      setIsDialogOpen(false);
      setSelectedComments([]);
      setModerationNote('');
      setActionType(null);
      setIsBulkAction(false);
      
      if (failCount > 0) {
        toast.error(`${actionType === 'approve' ? 'Approved' : 'Removed'} ${successCount}, failed ${failCount}`);
      } else {
        toast.success(`✓ ${successCount} comments ${actionType === 'approve' ? 'approved' : 'removed and users notified'}`);
      }
    } else if (selectedComment) {
      if (actionType === 'approve') {
        approveMutation.mutate({
          feedbackId: selectedComment.id,
          note: moderationNote || undefined,
        });
      } else {
        removeMutation.mutate({
          feedbackId: selectedComment.id,
          note: moderationNote || undefined,
        });
      }
    }
  };

  const isProcessing = approveMutation.isPending || removeMutation.isPending || bulkProcessing;

  if (isLoading && !data) {
    return (
      <div className="container mx-auto py-8 px-6 max-w-full">
        <ModerationTableSkeleton />
      </div>
    );
  }

  return (
    <>
      <div className="container mx-auto py-8 px-6 max-w-full">
        <ModerationTable
          data={comments}
          pageCount={pageCount}
          isSearching={isFetching}
          onApprove={handleApprove}
          onRemove={handleRemove}
          onBulkApprove={handleBulkApprove}
          onBulkRemove={handleBulkRemove}
          queryKeys={{
            page: 'page',
            perPage: 'perPage',
            sort: 'sort',
            filters: 'filters',
            joinOperator: 'joinOperator',
          }}
        />
      </div>

      {/* Moderation Dialog */}
      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionType === 'approve' ? 'Approve Comment' : 'Delete Comment & Warn User'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionType === 'approve'
                ? 'This will mark the comment as approved and keep it visible. No notification will be sent to the user.'
                : 'This will hide the comment and send a warning email to the user. The user will receive an in-app notification. This action cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {isBulkAction ? (
            <div className="my-4 p-4 rounded-lg bg-muted">
              <p className="text-sm font-medium mb-2">Bulk Action</p>
              <p className="text-sm text-muted-foreground">
                {selectedComments.length} comment{selectedComments.length !== 1 ? 's' : ''} selected
              </p>
            </div>
          ) : selectedComment ? (
            <div className="my-4 p-4 rounded-lg bg-muted">
              <p className="text-sm font-medium mb-2">{selectedComment.userName}</p>
              <p className="text-sm text-muted-foreground">{selectedComment.content}</p>
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="note">Moderation Note (Optional)</Label>
            <Textarea
              id="note"
              value={moderationNote}
              onChange={(e) => setModerationNote(e.target.value)}
              placeholder="Add a note about this moderation action..."
              rows={3}
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmAction} disabled={isProcessing}>
              {isProcessing ? 'Processing...' : actionType === 'approve' ? 'Approve' : 'Remove'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// Skeleton loading component
function ModerationTableSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      {/* Filter buttons skeleton */}
      <div className="flex items-center justify-between gap-2 p-1">
        <div className="flex items-center gap-2">
          <div className="h-9 w-32 bg-muted animate-pulse rounded-md" />
          <div className="h-9 w-36 bg-muted animate-pulse rounded-md" />
        </div>
      </div>
      
      {/* Search bar skeleton */}
      <div className="flex items-center gap-2">
        <div className="h-10 flex-1 bg-muted animate-pulse rounded-md" />
        <div className="h-10 w-24 bg-muted animate-pulse rounded-md" />
      </div>
      
      {/* Table skeleton */}
      <div className="rounded-md border">
        {/* Header */}
        <div className="border-b bg-muted/50 p-4">
          <div className="flex items-center gap-4">
            <div className="h-5 w-5 bg-muted-foreground/20 animate-pulse rounded" />
            <div className="h-5 w-64 bg-muted-foreground/20 animate-pulse rounded" />
            <div className="h-5 w-32 bg-muted-foreground/20 animate-pulse rounded" />
            <div className="h-5 w-32 bg-muted-foreground/20 animate-pulse rounded" />
            <div className="h-5 w-24 bg-muted-foreground/20 animate-pulse rounded" />
            <div className="h-5 w-40 bg-muted-foreground/20 animate-pulse rounded" />
            <div className="h-5 w-32 bg-muted-foreground/20 animate-pulse rounded" />
          </div>
        </div>
        
        {/* Rows */}
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="border-b p-4 last:border-0">
            <div className="flex items-center gap-4">
              <div className="h-5 w-5 bg-muted animate-pulse rounded" />
              <div className="h-12 flex-1 bg-muted animate-pulse rounded" />
              <div className="h-8 w-32 bg-muted animate-pulse rounded" />
              <div className="h-8 w-32 bg-muted animate-pulse rounded" />
              <div className="h-8 w-24 bg-muted animate-pulse rounded" />
              <div className="h-8 w-40 bg-muted animate-pulse rounded" />
              <div className="h-8 w-32 bg-muted animate-pulse rounded" />
            </div>
          </div>
        ))}
      </div>
      
      {/* Pagination skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-9 w-48 bg-muted animate-pulse rounded-md" />
        <div className="flex items-center gap-2">
          <div className="h-9 w-24 bg-muted animate-pulse rounded-md" />
          <div className="h-9 w-32 bg-muted animate-pulse rounded-md" />
          <div className="h-9 w-24 bg-muted animate-pulse rounded-md" />
        </div>
      </div>
    </div>
  );
}
