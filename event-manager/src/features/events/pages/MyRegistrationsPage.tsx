/**
 * My Registrations Page
 * 
 * View and manage all event registrations
 * Features:
 * - View all registered events (upcoming and past)
 * - Filter by event type and status
 * - Search functionality
 * - Registration details (date, payment status)
 * - Cancel registration option
 */

import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import type { ColumnDef } from '@tanstack/react-table';
import { Calendar, MapPin, CreditCard, XCircle, Eye, MoreHorizontal } from 'lucide-react';
import { format } from 'date-fns';

import { trpc } from '@/lib/trpc';
import { GenericDataTable, type FilterConfig } from '@/components/generic/GenericDataTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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

interface Registration {
  id: string;
  event: {
    id: string;
    name: string;
    type: string;
    location: string;
    startDate: string;
    endDate: string;
    price?: number;
  };
  registrationDate: string;
  paymentStatus: 'PENDING' | 'COMPLETED' | 'REFUNDED';
  status: 'ACTIVE' | 'CANCELLED';
  canCancel: boolean;
}

export function MyRegistrationsPage() {
  const utils = trpc.useUtils();
  const [selectedRegistration, setSelectedRegistration] = useState<Registration | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

  // Fetch user's registrations
  const { data, isLoading } = trpc.events.getMyRegistrations.useQuery(
    {},
    {
      staleTime: 30000,
      refetchOnWindowFocus: false,
    }
  );

  const registrations = (data?.registrations || []) as Registration[];

  // Stats
  const stats = useMemo(() => {
    const upcoming = registrations.filter(
      (r) => r.status === 'ACTIVE' && new Date(r.event.startDate) > new Date()
    ).length;
    const past = registrations.filter(
      (r) => new Date(r.event.endDate) < new Date()
    ).length;
    const cancelled = registrations.filter((r) => r.status === 'CANCELLED').length;

    return {
      total: registrations.length,
      upcoming,
      past,
      cancelled,
    };
  }, [registrations]);

  // Cancel registration mutation
  const cancelMutation = trpc.events.cancelRegistration.useMutation({
    onSuccess: () => {
      toast.success('Registration cancelled successfully. Refund will be processed to your wallet.');
      utils.events.getMyRegistrations.invalidate();
      setCancelDialogOpen(false);
      setSelectedRegistration(null);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to cancel registration');
    },
  });

  // Table columns
  const columns: ColumnDef<Registration>[] = [
    {
      accessorKey: 'event.name',
      header: 'Event Name',
      cell: ({ row }) => (
        <div className="font-medium">{row.original.event.name}</div>
      ),
    },
    {
      accessorKey: 'event.type',
      header: 'Type',
      cell: ({ row }) => {
        const type = row.original.event.type;
        const variantMap: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
          WORKSHOP: 'default',
          TRIP: 'secondary',
          BAZAAR: 'outline',
          CONFERENCE: 'outline',
        };
        return (
          <Badge variant={variantMap[type] || 'default'}>
            {type}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'event.startDate',
      header: 'Start Date',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          {format(new Date(row.original.event.startDate), 'MMM dd, yyyy')}
        </div>
      ),
    },
    {
      accessorKey: 'event.location',
      header: 'Location',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          {row.original.event.location}
        </div>
      ),
    },
    {
      accessorKey: 'paymentStatus',
      header: 'Payment',
      cell: ({ row }) => {
        const status = row.original.paymentStatus;
        const variantMap: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
          COMPLETED: 'default',
          PENDING: 'secondary',
          REFUNDED: 'outline',
        };
        return (
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-muted-foreground" />
            <Badge variant={variantMap[status] || 'default'}>
              {status}
            </Badge>
          </div>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.original.status;
        const isPast = new Date(row.original.event.endDate) < new Date();
        
        if (isPast) {
          return <Badge variant="outline">Completed</Badge>;
        }
        
        return (
          <Badge variant={status === 'ACTIVE' ? 'default' : 'destructive'}>
            {status}
          </Badge>
        );
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const registration = row.original;
        const isPast = new Date(registration.event.endDate) < new Date();

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              <DropdownMenuItem>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              
              {!isPast && registration.status === 'ACTIVE' && registration.canCancel && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      setSelectedRegistration(registration);
                      setCancelDialogOpen(true);
                    }}
                    className="text-destructive"
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Cancel Registration
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  // Filters configuration
  const filters: FilterConfig[] = [
    {
      key: 'type',
      label: 'Event Type',
      options: [
        { value: 'WORKSHOP', label: 'Workshop' },
        { value: 'TRIP', label: 'Trip' },
        { value: 'BAZAAR', label: 'Bazaar' },
        { value: 'CONFERENCE', label: 'Conference' },
      ],
    },
    {
      key: 'status',
      label: 'Status',
      options: [
        { value: 'upcoming', label: 'Upcoming' },
        { value: 'past', label: 'Past' },
        { value: 'cancelled', label: 'Cancelled' },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">My Registrations</h1>
        <p className="text-muted-foreground">
          View and manage all your event registrations
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Registrations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats.upcoming}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Past</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">
              {stats.past}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Cancelled</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats.cancelled}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Registrations Table */}
      <GenericDataTable
        data={registrations}
        columns={columns}
        isLoading={isLoading}
        searchable
        searchPlaceholder="Search by event name..."
        filters={filters}
        pagination={{
          pageSize: 10,
          showPageNumbers: true,
          showPageSizeSelector: true,
        }}
        emptyStateTitle="No registrations found"
        emptyStateDescription="You haven't registered for any events yet"
        emptyStateIcon={<Calendar className="h-12 w-12 text-muted-foreground" />}
      />

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Registration</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel your registration for{' '}
              <strong>{selectedRegistration?.event.name}</strong>?
              {selectedRegistration?.event.price && (
                <span className="block mt-2">
                  The registration fee will be refunded to your wallet.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No, keep it</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (selectedRegistration) {
                  cancelMutation.mutate({ registrationId: selectedRegistration.id });
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Yes, cancel registration
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

