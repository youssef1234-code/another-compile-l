/**
 * Workshop Approvals Page
 * 
 * Events Office and Admin can:
 * - View pending workshop submissions
 * - Approve and publish workshops
 * - Reject workshops
 * - Request edits from professors
 * 
 * Requirements: #40, #41, #42
 */

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { CheckCircle2, XCircle, FileEdit, Calendar, MapPin, Users, DollarSign } from 'lucide-react';
import { motion } from 'framer-motion';
import { LoadingSpinner } from '@/components/generic/LoadingSpinner';
import type { Event } from '@event-manager/shared';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export function WorkshopApprovalsPage() {
  const [selectedWorkshop, setSelectedWorkshop] = useState<Event | null>(null);
  const [actionDialog, setActionDialog] = useState<'approve' | 'reject' | 'edit' | null>(null);
  const [reason, setReason] = useState('');

  // Fetch all workshops (filtering for pending will be done client-side for now)
  const { data: eventsData, isLoading, refetch } = trpc.events.getEvents.useQuery({
    page: 1,
    limit: 100,
    type: 'WORKSHOP',
  });

  const updateMutation = trpc.events.update.useMutation({
    onSuccess: () => {
      toast.success('Workshop updated successfully');
      setActionDialog(null);
      setSelectedWorkshop(null);
      setReason('');
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update workshop');
    },
  });

  const events = (eventsData?.events || []) as Event[];
  const pendingWorkshops = events.filter((e) => e.status === 'PENDING_APPROVAL');

  const handleApprove = () => {
    if (!selectedWorkshop) return;
    updateMutation.mutate({
      id: selectedWorkshop.id,
      data: { status: 'PUBLISHED' as any },
    });
  };

  const handleReject = () => {
    if (!selectedWorkshop || !reason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }
    updateMutation.mutate({
      id: selectedWorkshop.id,
      data: { status: 'REJECTED' as any, rejectionReason: reason },
    });
  };

  const handleRequestEdit = () => {
    if (!selectedWorkshop || !reason.trim()) {
      toast.error('Please provide details for the requested edits');
      return;
    }
    updateMutation.mutate({
      id: selectedWorkshop.id,
      data: { status: 'NEEDS_REVISION' as any, revisionNotes: reason },
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="container mx-auto p-6 space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-bold flex items-center gap-2">
              <CheckCircle2 className="h-8 w-8" />
              Workshop Approvals
            </CardTitle>
            <CardDescription>
              Review and approve workshop submissions from professors
            </CardDescription>
          </CardHeader>
        </Card>
      </motion.div>

      {/* Stats */}
      <motion.div variants={itemVariants}>
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending Approvals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{pendingWorkshops.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Workshops
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{events.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Published
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {events.filter((e) => e.status === 'PUBLISHED').length}
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* Workshop List */}
      <motion.div variants={itemVariants}>
        {pendingWorkshops.length === 0 ? (
          <Card>
            <CardContent className="py-16">
              <div className="flex flex-col items-center justify-center gap-4">
                <CheckCircle2 className="h-16 w-16 text-muted-foreground" />
                <div className="text-center space-y-2">
                  <h3 className="text-xl font-semibold">All caught up!</h3>
                  <p className="text-muted-foreground">
                    No pending workshop approvals at this time
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {pendingWorkshops.map((workshop, index) => (
              <motion.div
                key={workshop.id}
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                transition={{ delay: index * 0.05 }}
              >
                <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                  <CardHeader className="bg-muted/30 border-b">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-2xl">{workshop.title}</CardTitle>
                        <CardDescription className="text-base">
                          {workshop.description}
                        </CardDescription>
                      </div>
                      <Badge variant="secondary" className="ml-4">
                        Pending Review
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="grid gap-6 md:grid-cols-2">
                      {/* Left Column - Details */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">Date:</span>
                          <span>{new Date(workshop.date).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">Location:</span>
                          <span>{workshop.location}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">Capacity:</span>
                          <span>{workshop.capacity} participants</span>
                        </div>
                        {workshop.requiredBudget && (
                          <div className="flex items-center gap-2 text-sm">
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">Budget:</span>
                            <span>
                              ${workshop.requiredBudget} ({workshop.fundingSource})
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Right Column - Additional Info */}
                      <div className="space-y-4">
                        {workshop.fullAgenda && (
                          <div>
                            <h4 className="font-semibold text-sm mb-2">Agenda:</h4>
                            <p className="text-sm text-muted-foreground line-clamp-3">
                              {workshop.fullAgenda}
                            </p>
                          </div>
                        )}
                        {workshop.faculty && (
                          <div className="flex items-center gap-2 text-sm">
                            <span className="font-medium">Faculty:</span>
                            <Badge variant="outline">{workshop.faculty}</Badge>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-3 mt-6 pt-6 border-t">
                      <Button
                        onClick={() => {
                          setSelectedWorkshop(workshop);
                          setActionDialog('approve');
                        }}
                        className="flex-1"
                      >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Approve & Publish
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSelectedWorkshop(workshop);
                          setActionDialog('edit');
                        }}
                      >
                        <FileEdit className="h-4 w-4 mr-2" />
                        Request Edits
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => {
                          setSelectedWorkshop(workshop);
                          setActionDialog('reject');
                        }}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Approve Dialog */}
      <Dialog open={actionDialog === 'approve'} onOpenChange={() => setActionDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Workshop</DialogTitle>
            <DialogDescription>
              Are you sure you want to approve and publish "{selectedWorkshop?.title}"?
              This will make it visible to all users.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleApprove}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? 'Approving...' : 'Approve & Publish'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={actionDialog === 'reject'} onOpenChange={() => setActionDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Workshop</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting "{selectedWorkshop?.title}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Rejection Reason</Label>
              <Textarea
                id="reason"
                placeholder="Explain why this workshop is being rejected..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={updateMutation.isPending || !reason.trim()}
            >
              {updateMutation.isPending ? 'Rejecting...' : 'Reject Workshop'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Request Edit Dialog */}
      <Dialog open={actionDialog === 'edit'} onOpenChange={() => setActionDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Edits</DialogTitle>
            <DialogDescription>
              Provide feedback and request changes for "{selectedWorkshop?.title}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-notes">Edit Requirements</Label>
              <Textarea
                id="edit-notes"
                placeholder="Describe the changes that need to be made..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleRequestEdit}
              disabled={updateMutation.isPending || !reason.trim()}
            >
              {updateMutation.isPending ? 'Sending...' : 'Request Edits'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
