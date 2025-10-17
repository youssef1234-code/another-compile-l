/**
 * My Workshops Page (Professor Role)
 * 
 * Requirement #37: Professors can view a list of all workshops they created
 * Features:
 * - View all workshops (pending, approved, rejected)
 * - Edit workshop details (requirement #36)
 * - Delete workshops
 * - Visual status indicators
 * - Grid layout for better UX
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { Plus, Calendar, MapPin, Users, Edit, Trash2, AlertCircle, CheckCircle, XCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';

import { trpc } from '@/lib/trpc';
import { ROUTES } from '@/lib/constants';
import { PageHeader } from '@/components/generic/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import { Skeleton } from '@/components/ui/skeleton';
import { designSystem, getStatusBadgeClass, formatStatus } from '@/styles/design-system';

export function MyWorkshopsPage() {
  const navigate = useNavigate();
  const utils = trpc.useUtils();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [workshopToDelete, setWorkshopToDelete] = useState<string | null>(null);

  // Fetch workshops created by the professor
  const { data: eventsData, isLoading } = trpc.events.getEvents.useQuery({
    type: 'WORKSHOP',
  });

  const workshops = eventsData?.events || [];

  const deleteWorkshopMutation = trpc.events.delete.useMutation({
    onSuccess: () => {
      toast.success('Workshop deleted successfully');
      utils.events.getEvents.invalidate();
      setDeleteDialogOpen(false);
      setWorkshopToDelete(null);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete workshop');
    },
  });

  const handleDelete = (workshopId: string) => {
    setWorkshopToDelete(workshopId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (workshopToDelete) {
      deleteWorkshopMutation.mutate({ id: workshopToDelete });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'REJECTED':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'PENDING_APPROVAL':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'NEEDS_EDITS':
        return <AlertCircle className="h-5 w-5 text-orange-600" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-600" />;
    }
  };

  if (isLoading) {
    return (
      <div className={`${designSystem.layout.padding} py-8`}>
        <PageHeader
          icon={Calendar}
          title="My Workshops"
          description="View and manage all workshops you created"
        />
        <div className={`${designSystem.layout.grid.three} mt-6`}>
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2 mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`${designSystem.layout.padding} py-8`}>
      <PageHeader
        icon={Calendar}
        title="My Workshops"
        description="View and manage all workshops you created"
        actions={
          <Button onClick={() => navigate(ROUTES.CREATE_WORKSHOP)} className="gap-2">
            <Plus className="h-4 w-4" />
            Create Workshop
          </Button>
        }
      />

      {workshops && workshops.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={designSystem.emptyState.container}
        >
          <Calendar className={designSystem.emptyState.icon} />
          <h3 className={designSystem.emptyState.title}>No Workshops Yet</h3>
          <p className={designSystem.emptyState.description}>
            Create your first workshop to get started
          </p>
          <Button onClick={() => navigate(ROUTES.CREATE_WORKSHOP)} className="gap-2">
            <Plus className="h-4 w-4" />
            Create Workshop
          </Button>
        </motion.div>
      ) : (
        <div className={`${designSystem.layout.grid.three} mt-6`}>
          {workshops?.map((workshop: any, index: number) => (
            <motion.div
              key={workshop.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={`${designSystem.card.hover} h-full flex flex-col`}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{workshop.name}</CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-2">
                        <MapPin className="h-3 w-3" />
                        {workshop.location}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(workshop.status)}
                      <Badge className={getStatusBadgeClass(workshop.status)}>
                        {formatStatus(workshop.status)}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="flex-1 space-y-3">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {workshop.description || 'No description provided'}
                  </p>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {format(new Date(workshop.startDate), 'MMM dd, yyyy')}
                        {workshop.endDate && ` - ${format(new Date(workshop.endDate), 'MMM dd, yyyy')}`}
                      </span>
                    </div>

                    {workshop.capacity && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>Capacity: {workshop.capacity}</span>
                      </div>
                    )}

                    {workshop.faculty && (
                      <div className="text-muted-foreground">
                        <span className="font-medium">Faculty:</span> {workshop.faculty}
                      </div>
                    )}

                    {workshop.requiredBudget && (
                      <div className="text-muted-foreground">
                        <span className="font-medium">Budget:</span> {workshop.requiredBudget} EGP
                      </div>
                    )}
                  </div>

                  {workshop.revisionNotes && workshop.status === 'NEEDS_EDITS' && (
                    <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-md border border-orange-200 dark:border-orange-800">
                      <p className="text-sm font-medium text-orange-900 dark:text-orange-200">
                        Revision Required:
                      </p>
                      <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                        {workshop.revisionNotes}
                      </p>
                    </div>
                  )}

                  {workshop.rejectionReason && workshop.status === 'REJECTED' && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-md border border-red-200 dark:border-red-800">
                      <p className="text-sm font-medium text-red-900 dark:text-red-200">
                        Rejection Reason:
                      </p>
                      <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                        {workshop.rejectionReason}
                      </p>
                    </div>
                  )}
                </CardContent>

                <CardFooter className="border-t pt-4 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 gap-2"
                    onClick={() => navigate(`${ROUTES.CREATE_WORKSHOP}?edit=${workshop.id}`)}
                    disabled={workshop.status === 'APPROVED' || workshop.status === 'PUBLISHED'}
                  >
                    <Edit className="h-4 w-4" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 gap-2 hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => handleDelete(workshop.id)}
                    disabled={workshop.status === 'APPROVED' || workshop.status === 'PUBLISHED'}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Workshop</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this workshop? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteWorkshopMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
