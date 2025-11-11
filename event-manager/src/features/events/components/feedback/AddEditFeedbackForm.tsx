/**
 * Add/Edit Feedback Form Component
 * 
 * Handles both creating new feedback and editing existing feedback
 * - Rating input with stars
 * - Comment textarea
 * - Save/Cancel buttons
 * - Shows "Remove rating" and "Remove comment" options when editing
 */

import { useState, useEffect } from 'react';
import type { Feedback } from '@event-manager/shared';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RatingStars } from './RatingStars';
import { Star, MessageSquare, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EnhancedAlertDialog } from '@/components/generic/AlertDialog';

interface AddEditFeedbackFormProps {
  existingFeedback?: Feedback | null;
  onSubmit: (data: { rating?: number | null; comment?: string | null }) => void;
  onCancel?: () => void;
  isLoading?: boolean;
  className?: string;
}

export function AddEditFeedbackForm({
  existingFeedback,
  onSubmit,
  onCancel,
  isLoading,
  className,
}: AddEditFeedbackFormProps) {
  const isEditing = !!existingFeedback;
  const [rating, setRating] = useState<number | undefined>(existingFeedback?.rating);
  const [comment, setComment] = useState(existingFeedback?.comment || '');
  const [showValidationError, setShowValidationError] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Track if user wants to remove fields (only in edit mode)
  const [removeRating, setRemoveRating] = useState(false);
  const [removeComment, setRemoveComment] = useState(false);

  useEffect(() => {
    if (existingFeedback) {
      setRating(existingFeedback.rating);
      setComment(existingFeedback.comment || '');
      setRemoveRating(false);
      setRemoveComment(false);
      setShowValidationError(false);
    }
  }, [existingFeedback]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const data: { rating?: number | null; comment?: string | null } = {};

    // Handle rating
    if (removeRating) {
      data.rating = null;
    } else if (rating !== undefined) {
      data.rating = rating;
    }

    // Handle comment
    if (removeComment) {
      data.comment = null;
    } else if (comment.trim()) {
      data.comment = comment.trim();
    }

    // Validate: if editing and both are being removed, show delete confirmation
    if (
      isEditing &&
      (removeRating || rating === undefined) &&
      (removeComment || !comment.trim())
    ) {
      setShowDeleteConfirm(true);
      return;
    }

    // Validate: at least one field must be provided or kept
    if (
      (removeRating || rating === undefined) &&
      (removeComment || !comment.trim())
    ) {
      setShowValidationError(true);
      return; // Don't submit if both are being removed/empty
    }

    setShowValidationError(false);
    onSubmit(data);
  };

  const handleConfirmDelete = () => {
    setShowDeleteConfirm(false);
    // Send update with both fields as null (backend will delete the feedback)
    onSubmit({ rating: null, comment: null });
  };

  const handleCancel = () => {
    setRating(existingFeedback?.rating);
    setComment(existingFeedback?.comment || '');
    setRemoveRating(false);
    setRemoveComment(false);
    setShowValidationError(false);
    onCancel?.();
  };

  return (
    <Card className={cn('', className)}>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          {isEditing ? 'Edit Your Feedback' : 'Share Your Feedback'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Rating Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Star className="h-4 w-4" />
                Rating
              </Label>
              {isEditing && existingFeedback?.rating && (
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  onClick={() => setRemoveRating(!removeRating)}
                  className={cn(
                    'text-xs h-auto px-0 text-muted-foreground hover:text-destructive transition-colors',
                    removeRating && 'text-destructive'
                  )}
                >
                  <X className="h-3 w-3 mr-1" />
                  {removeRating ? 'Keep Rating' : 'Remove Rating'}
                </Button>
              )}
            </div>
            {!removeRating && (
              <RatingStars
                rating={rating || 0}
                onRatingChange={setRating}
                size="lg"
                className="py-2"
              />
            )}
            {removeRating && (
              <p className="text-sm text-muted-foreground italic">
                Rating will be removed
              </p>
            )}
          </div>

          {/* Comment Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="comment" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Comment
              </Label>
              {isEditing && existingFeedback?.comment && (
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  onClick={() => setRemoveComment(!removeComment)}
                  className={cn(
                    'text-xs h-auto px-0 text-muted-foreground hover:text-destructive transition-colors',
                    removeComment && 'text-destructive'
                  )}
                >
                  <X className="h-3 w-3 mr-1" />
                  {removeComment ? 'Keep Comment' : 'Remove Comment'}
                </Button>
              )}
            </div>
            {!removeComment ? (
              <Textarea
                id="comment"
                placeholder="Share your thoughts about this event..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                maxLength={2000}
                className="resize-none"
              />
            ) : (
              <p className="text-sm text-muted-foreground italic">
                Comment will be removed
              </p>
            )}
            {!removeComment && (
              <p className="text-xs text-muted-foreground text-right">
                {comment.length}/2000
              </p>
            )}
          </div>

          {/* Validation Message */}
          {showValidationError && (
            <p className="text-sm text-destructive">
              Please provide at least a rating or a comment.
            </p>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2">
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? 'Saving...' : isEditing ? 'Update Feedback' : 'Submit Feedback'}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={handleCancel} disabled={isLoading}>
                <X className="h-4 w-4" />
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>

      {/* Delete Confirmation Dialog */}
      <EnhancedAlertDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        variant="danger"
        title="Delete Your Feedback?"
        description="You've removed both your rating and comment. This will permanently delete your feedback for this event. Are you sure you want to continue?"
        confirmLabel="Delete Feedback"
        onConfirm={handleConfirmDelete}
      />
    </Card>
  );
}
