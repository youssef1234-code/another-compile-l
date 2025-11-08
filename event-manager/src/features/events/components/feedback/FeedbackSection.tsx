/**
 * Feedback Section Component
 * 
 * Main component for event feedback (ratings & comments)
 * 
 * Features:
 * - Rating overview with average and distribution
 * - List of all feedback with pagination
 * - Add new feedback form (for users who haven't submitted)
 * - Edit existing feedback (for users who have submitted)
 * - Delete feedback (own or admin)
 * 
 * User Stories: #15, #16, #17, #18
 */

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import type { Feedback } from '@event-manager/shared';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { RatingStars } from './RatingStars';
import { FeedbackCard } from './FeedbackCard';
import { AddEditFeedbackForm } from './AddEditFeedbackForm';
import { Star, MessageSquare, Users, TrendingUp } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { formatValidationErrors } from '@/lib/format-errors';
import { cn } from '@/lib/utils';

interface FeedbackSectionProps {
  eventId: string;
  userId?: string;
  userRole?: string;
  eventStartDate?: Date;
  eventEndDate?: Date;
  className?: string;
}

export function FeedbackSection({ eventId, userId, userRole, eventStartDate, eventEndDate, className }: FeedbackSectionProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingFeedback, setEditingFeedback] = useState<Feedback | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const LIMIT = 10;

  const utils = trpc.useUtils();
  const isAdmin = userRole === 'ADMIN';

  // Get user's own feedback
  const { data: myFeedback } = trpc.feedback.getMyFeedback.useQuery(
    { eventId },
    { enabled: !!userId }
  ) as { data: Feedback | null | undefined };

  // Get all feedback for this event (paginated)
  const { data: feedbackData, isLoading: feedbackLoading } = trpc.feedback.getByEvent.useQuery({
    eventId,
    page: currentPage,
    limit: LIMIT,
  });

  // Create feedback mutation
  const createMutation = trpc.feedback.create.useMutation({
    onSuccess: () => {
      toast.success('Feedback submitted successfully!');
      setShowForm(false);
      utils.feedback.getByEvent.invalidate();
      utils.feedback.getMyFeedback.invalidate();
    },
    onError: (error: any) => {
      const errorMessage = formatValidationErrors(error);
      toast.error(errorMessage, { style: { whiteSpace: 'pre-line' } });
    },
  });

  // Update feedback mutation
  const updateMutation = trpc.feedback.update.useMutation({
    onSuccess: () => {
      toast.success('Feedback updated successfully!');
      setEditingFeedback(null);
      setShowForm(false);
      utils.feedback.getByEvent.invalidate();
      utils.feedback.getMyFeedback.invalidate();
    },
    onError: (error: any) => {
      const errorMessage = formatValidationErrors(error);
      toast.error(errorMessage, { style: { whiteSpace: 'pre-line' } });
    },
  });

  // Delete feedback mutation
  const deleteMutation = trpc.feedback.delete.useMutation({
    onSuccess: () => {
      toast.success('Feedback deleted successfully');
      utils.feedback.getByEvent.invalidate();
      utils.feedback.getMyFeedback.invalidate();
    },
    onError: (error: any) => {
      const errorMessage = formatValidationErrors(error);
      toast.error(errorMessage);
    },
  });

  const handleSubmitFeedback = async (data: { rating?: number | null; comment?: string | null }) => {
    if (editingFeedback) {
      // Update existing feedback
      updateMutation.mutate({
        eventId,
        ...data,
      });
    } else {
      // Create new feedback
      createMutation.mutate({
        eventId,
        rating: data.rating || undefined,
        comment: data.comment || undefined,
      });
    }
  };

  const handleEditFeedback = (feedback: Feedback) => {
    setEditingFeedback(feedback);
    setShowForm(true);
  };

  const handleDeleteFeedback = (feedbackId: string) => {
    // Check if it's the user's own feedback
    if (myFeedback && myFeedback.id === feedbackId) {
      // Use update mutation with null values to delete own feedback
      updateMutation.mutate({
        eventId,
        rating: null,
        comment: null,
      });
    } else {
      // Admin delete (if user is admin)
      deleteMutation.mutate({ id: feedbackId });
    }
  };

  const handleCancelEdit = () => {
    setEditingFeedback(null);
    setShowForm(false);
  };

  const handleAddFeedback = () => {
    setEditingFeedback(null);
    setShowForm(true);
  };

  const feedback = (feedbackData?.feedback || []) as Feedback[];
  const totalPages = feedbackData?.totalPages || 1;
  const hasMyFeedback = !!myFeedback;
  
  // Check if event has ended (use endDate or fallback to startDate)
  const now = new Date();
  const eventEndDateToCheck = eventEndDate || eventStartDate;
  const hasEventEnded = eventEndDateToCheck ? new Date(eventEndDateToCheck) <= now : true;
  
  // Only allow student/staff/ta/professor to add feedback after event ends
  const allowedFeedbackRoles = ['STUDENT','STAFF','TA','PROFESSOR'];
  const canAddFeedback = userId && !hasMyFeedback && !showForm && allowedFeedbackRoles.includes(userRole || '') && hasEventEnded;

  // Rating stats query
  const { data: ratingStats, isLoading: ratingLoading } = trpc.feedback.getRatingStats.useQuery({ eventId });
  const average = ratingStats?.averageRating ?? null;
  const distribution = ratingStats?.ratingDistribution || [];
  const totalRatings = ratingStats?.totalRatings || 0;
  const maxCount = Math.max(...distribution.map(d => d.count), 1);

  return (
    <div className={cn('space-y-6', className)}>
      {/* Rating Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Rating Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          {ratingLoading ? (
            <div className="flex gap-4 items-center">
              <Skeleton className="h-16 w-16" />
              <div className="flex-1 space-y-2">
                {[1,2,3,4,5].map(r => (
                  <Skeleton key={r} className="h-4 w-full" />
                ))}
              </div>
            </div>
          ) : totalRatings === 0 ? (
            <div className="flex items-center gap-8 flex-wrap">
              <div className="flex flex-col items-center">
                <div className="text-4xl font-bold">–</div>
                <RatingStars rating={0} size="md" readonly />
                <p className="text-sm text-muted-foreground mt-1">
                  No ratings yet. Be the first!
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-8 flex-wrap">
              {/* Average on the left */}
              <div className="flex flex-col items-center min-w-[120px]">
                <div className="text-4xl font-bold">{average?.toFixed(1)}</div>
                <RatingStars rating={average || 0} size="md" readonly />
                <p className="text-xs text-muted-foreground mt-1">{totalRatings} rating{totalRatings!==1 && 's'}</p>
              </div>
              {/* Distribution stacked to the right */}
              <div className="flex flex-col gap-2 flex-1 min-w-[220px]">
                {[5,4,3,2,1].map(r => {
                  const item = distribution.find(d => d.rating === r);
                  const count = item?.count || 0;
                  const barWidth = (count / maxCount) * 100;
                  return (
                    <div key={r} className="flex items-center gap-3">
                      <span className="text-sm w-10 text-right">{r} star</span>
                      <div className="flex-1 h-3 bg-muted rounded overflow-hidden">
                        {count > 0 && (
                          <div
                            className="h-full bg-primary transition-all"
                            style={{ width: `${barWidth}%` }}
                          />
                        )}
                      </div>
                      <span className="text-sm w-8 text-right tabular-nums">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Feedback Button or Form */}
      {canAddFeedback && (
        <Button onClick={handleAddFeedback} className="w-full">
          <Star className="h-4 w-4 mr-2" />
          Share Your Feedback
        </Button>
      )}

      {showForm && userId && (
        <AddEditFeedbackForm
          existingFeedback={editingFeedback}
          onSubmit={handleSubmitFeedback}
          onCancel={handleCancelEdit}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />
      )}

      {/* Feedback List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Feedback ({feedbackData?.total || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {feedbackLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : (feedback.length > 0 || myFeedback) ? (
            <div className="space-y-4">
              {/* User's own feedback first (highlighted) */}
              {myFeedback && (
                <FeedbackCard
                  key={`my-${myFeedback.id}`}
                  feedback={myFeedback}
                  currentUserId={userId}
                  isAdmin={isAdmin}
                  onEdit={handleEditFeedback}
                  onDelete={handleDeleteFeedback}
                  isHighlighted
                />
              )}
              {/* Other users' feedback (exclude current user's feedback to avoid duplication) */}
              {feedback
                .filter((item) => String(item.userId) !== String(userId))
                .map((item) => (
                  <FeedbackCard
                    key={`other-${item.id}`}
                    feedback={item}
                    currentUserId={userId}
                    isAdmin={isAdmin}
                    onEdit={handleEditFeedback}
                    onDelete={handleDeleteFeedback}
                  />
                ))}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => p - 1)}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">
                No feedback yet. Be the first to share your thoughts!
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
