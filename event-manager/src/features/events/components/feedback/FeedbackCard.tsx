/**
 * Feedback Card Component
 * 
 * Displays individual feedback (rating/comment) with:
 * - User avatar and name
 * - Star rating display
 * - Comment text
 * - "Edited" badge if comment was modified
 * - Edit/Delete buttons for own feedback
 * - Delete button for admin
 */

import { useState } from 'react';
import type { Feedback } from '@event-manager/shared';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { RatingStars } from './RatingStars';
import { Edit, Trash2, PencilLine } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/design-system';
import { EnhancedAlertDialog } from '@/components/generic/AlertDialog';

interface FeedbackCardProps {
  feedback: Feedback;
  currentUserId?: string;
  isAdmin?: boolean;
  onEdit?: (feedback: Feedback) => void;
  onDelete?: (feedbackId: string) => void;
  isHighlighted?: boolean;
  className?: string;
}

export function FeedbackCard({
  feedback,
  currentUserId,
  isAdmin,
  onEdit,
  onDelete,
  isHighlighted = false,
  className,
}: FeedbackCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const isOwnFeedback = String(currentUserId) === String(feedback.userId);
  const canEdit = isOwnFeedback && onEdit;
  const canDelete = (isOwnFeedback || isAdmin) && onDelete;

  // Get user initials for avatar fallback
  const userInitials = feedback.user?.firstName && feedback.user?.lastName
    ? `${feedback.user.firstName[0]}${feedback.user.lastName[0]}`.toUpperCase()
    : '??';

  const userName = feedback.user?.firstName && feedback.user?.lastName
    ? `${feedback.user.firstName} ${feedback.user.lastName}`
    : 'Anonymous User';

  const handleDelete = () => {
    onDelete?.(feedback.id);
    setShowDeleteDialog(false);
  };

  return (
    <>
      <Card className={cn(
        'transition-all hover:shadow-md',
        isHighlighted && 'border-blue-500 bg-blue-50 dark:bg-blue-950/20',
        className
      )}>
  <CardContent className="py-0.4 px-2">
          <div className="flex items-start gap-2.5">
            {/* User Avatar */}
            <Avatar className="h-8 w-8 flex-shrink-0">
              <AvatarImage src={feedback.user?.avatar} alt={userName} />
              <AvatarFallback>{userInitials}</AvatarFallback>
            </Avatar>

            {/* Content */}
            <div className="flex-1 min-w-0">
              {/* Header: Name, Rating, Badges */}
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="font-semibold text-sm">
                      {userName}
                    </p>
                    {feedback.isEdited && (
                      <Badge variant="outline" className="text-[10px] flex items-center gap-0.5 py-0 h-4 px-1.5">
                        <PencilLine className="h-2.5 w-2.5" />
                        Edited
                      </Badge>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-tight">
                    {formatDate(new Date(feedback.createdAt))}
                  </p>
                </div>

                {/* Action Buttons */}
                {(canEdit || canDelete) && (
                  <div className="flex items-center gap-0.5 flex-shrink-0">
                    {canEdit && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(feedback)}
                        className="h-6 w-6 p-0"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                    )}
                    {canDelete && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowDeleteDialog(true)}
                        className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {/* Rating */}
              {feedback.rating && (
                <div className="mb-1">
                  <RatingStars rating={feedback.rating} size="sm" readonly />
                </div>
              )}

              {/* Comment */}
              {feedback.comment && (
                <p className="text-sm text-muted-foreground leading-snug whitespace-pre-wrap">
                  {feedback.comment}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <EnhancedAlertDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        variant="danger"
        title={isAdmin && !isOwnFeedback ? "Delete Inappropriate Comment" : "Delete Feedback"}
        description={
          isAdmin && !isOwnFeedback
            ? "Are you sure you want to delete this comment? This action cannot be undone."
            : "Are you sure you want to delete your feedback? This action cannot be undone."
        }
        confirmLabel="Delete"
        onConfirm={handleDelete}
      />
    </>
  );
}
