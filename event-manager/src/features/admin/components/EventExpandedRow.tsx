/**
 * Event Expanded Row Component
 * 
 * Displays full event details including:
 * - All event fields
 * - Registered students with full user details
 * - Vendor applications for bazaars
 * - Quick actions
 */

import type { Event } from '@event-manager/shared';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Edit,
  Trash2,
  Archive,
  User,
  Mail,
  Calendar,
  MapPin,
  DollarSign,
  Users,
  Building2,
} from 'lucide-react';
import { formatDate } from '@/lib/design-system';

interface EventExpandedRowProps {
  event: Event;
  onEdit?: (eventId: string) => void;
  onArchive?: (eventId: string) => void;
  onDelete?: (eventId: string) => void;
}

export function EventExpandedRow({
  event,
  onEdit,
  onArchive,
  onDelete,
}: EventExpandedRowProps) {
  const { data: registrationsData, isLoading: loadingRegistrations } =
    trpc.events.getEventRegistrations.useQuery(
      { eventId: event.id, page: 1, limit: 100 },
      { enabled: !!event.id }
    );

  return (
    <div className="p-6 bg-muted/30">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Event Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Complete Event Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Complete Event Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Event Name</p>
                  <p className="font-semibold">{event.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Type</p>
                  <Badge>{event.type}</Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <Badge
                    variant={
                      event.status === 'APPROVED'
                        ? 'default'
                        : event.status === 'REJECTED'
                        ? 'destructive'
                        : 'secondary'
                    }
                  >
                    {event.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Location</p>
                  <p className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {event.location}
                  </p>
                </div>
                {event.locationDetails && (
                  <div className="col-span-2">
                    <p className="text-sm font-medium text-muted-foreground">Location Details</p>
                    <p className="text-sm">{event.locationDetails}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Start Date</p>
                  <p className="text-sm">{event.startDate ? formatDate(new Date(event.startDate)) : 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">End Date</p>
                  <p className="text-sm">{event.endDate ? formatDate(new Date(event.endDate)) : 'N/A'}</p>
                </div>
                {event.registrationDeadline && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Registration Deadline
                    </p>
                    <p className="text-sm">
                      {formatDate(new Date(event.registrationDeadline))}
                    </p>
                  </div>
                )}
                {event.capacity && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Capacity</p>
                    <p className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {event.registeredCount || 0} / {event.capacity}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Price</p>
                  <p className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    {event.price ? `${event.price} EGP` : 'Free'}
                  </p>
                </div>
                {event.professorName && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Professor</p>
                    <p>{event.professorName}</p>
                  </div>
                )}
                {event.faculty && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Faculty</p>
                    <p className="flex items-center gap-1">
                      <Building2 className="h-3 w-3" />
                      {event.faculty}
                    </p>
                  </div>
                )}
                {event.fundingSource && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Funding Source</p>
                    <p>{event.fundingSource}</p>
                  </div>
                )}
              </div>

              <Separator />

              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Description</p>
                <p className="text-sm whitespace-pre-line">{event.description}</p>
              </div>

              {event.createdBy && typeof event.createdBy === 'object' && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">
                      Created By
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {(event.createdBy as any).firstName} {(event.createdBy as any).lastName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {(event.createdBy as any).email}
                        </p>
                        <Badge variant="outline" className="mt-1">
                          {(event.createdBy as any).role}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Registered Students */}
          {registrationsData && registrationsData.registrations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Registered Participants ({registrationsData.total})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {registrationsData.registrations.map((reg: any) => (
                    <div
                      key={reg.id}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {reg.user.firstName} {reg.user.lastName}
                          </p>
                          <p className="text-sm text-muted-foreground flex items-center gap-2">
                            <Mail className="h-3 w-3" />
                            {reg.user.email}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {reg.user.role}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              Registered: {formatDate(new Date(reg.createdAt))}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Badge
                        variant={
                          reg.status === 'CONFIRMED'
                            ? 'default'
                            : reg.status === 'CANCELLED'
                            ? 'destructive'
                            : 'secondary'
                        }
                      >
                        {reg.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {loadingRegistrations && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Loading Registrations...</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Vendors (for Bazaars) */}
          {event.type === 'BAZAAR' && (event as any).vendors && (event as any).vendors.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Participating Vendors ({(event as any).vendors.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(event as any).vendors.map((vendor: any) => (
                    <div
                      key={vendor.id}
                      className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <p className="font-semibold">{vendor.companyName}</p>
                      <p className="text-sm text-muted-foreground">{vendor.email}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Actions */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3">
                {onEdit && (
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => onEdit(event.id)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Event
                  </Button>
                )}
                {onArchive && (
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => onArchive(event.id)}
                  >
                    <Archive className="h-4 w-4 mr-2" />
                    Archive Event
                  </Button>
                )}
                {onDelete && (
                  <Button
                    variant="destructive"
                    className="w-full justify-start"
                    onClick={() => onDelete(event.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Event
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Event Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Registration Rate</p>
                <p className="text-2xl font-bold">
                  {event.capacity && event.registeredCount
                    ? Math.round((event.registeredCount / event.capacity) * 100)
                    : 0}
                  %
                </p>
              </div>
              <Separator />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Created</p>
                <p className="text-sm">{formatDate(event.createdAt)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
                <p className="text-sm">{formatDate(event.updatedAt)}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
