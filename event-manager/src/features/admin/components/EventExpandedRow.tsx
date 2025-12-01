/**
 * Event Expanded Row Component
 * 
 * Displays full event details including:
 * - All event fields
 * - Registered students with full user details
 * - Vendor applications for bazaars
 * - Quick actions
 */

import type { Event, User as EventUser, Registration } from '@event-manager/shared';
import { UserRole } from '@event-manager/shared';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthStore } from '@/store/authStore';
import { VendorCard } from '@/features/events/components/VendorCard';
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
  Check,
  XCircle,
  Download,
  Plus,
  QrCode,
  Award,
  Send,
  Eye,
  RefreshCw,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { formatDate } from '@/lib/design-system';
import toast from 'react-hot-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';

interface EventExpandedRowProps {
  event: Event;
  onEdit?: (eventId: string) => void;
  onArchive?: (eventId: string) => void;
  onDelete?: (eventId: string) => void;
  onApproveWorkshop?: (eventId: string) => void;
  onNeedsEdits?: (eventId: string) => void;
  onRejectWorkshop?: (eventId: string) => void;
}



type PopulatedRegistration = Registration & { user: EventUser };

type VendorInfo = {
  id: string;
  companyName: string;
  email: string;
  boothSize?: string;
  names?: string[];
  emails?: string[];
};

export function EventExpandedRow({
  event,
  onEdit,
  onArchive,
  onDelete,
  onApproveWorkshop,
  onNeedsEdits,
  onRejectWorkshop,
}: EventExpandedRowProps) {
  const { user } = useAuthStore();
  const trpcUtils = trpc.useUtils();
  
  // Only Event Office/Admin can view registrations, and NOT for conferences (Requirement #49)
  const canViewRegistrations = 
    user && 
    event.type !== 'CONFERENCE' && 
    (user.role === 'EVENT_OFFICE' || user.role === 'ADMIN');

  const { data: registrationsData, isLoading: loadingRegistrations } =
    trpc.events.getEventRegistrations.useQuery(
      { eventId: event.id, page: 1, limit: 100 },
      { enabled: !!event.id && !!canViewRegistrations }
    );

  const { data: whitelistUserData } =
    trpc.events.getWhitelistUsers.useQuery(
      { eventId: event.id, page: 1, limit: 100 },
      { enabled: !!event.id }
    );

  const { data: whitelistRoleData } =
    trpc.events.getWhitelistRoles.useQuery(
      { eventId: event.id },
      { enabled: !!event.id }
    );

  const whiteListUser = trpc.events.whiteListUser.useMutation({
    onSuccess: () => {
      toast.success("User added to whitelist successfully");
    },
    onError: (error) => {
      toast.error(`Error adding user to whitelist: ${error.message}`);
    },
  });

  const whiteListRole = trpc.events.whitelistRole.useMutation({
    onSuccess: () => {
      toast.success("Role added to whitelist successfully");
    },
    onError: (error) => {
      toast.error(`Error adding role to whitelist: ${error.message}`);
    },
  });

  const removeWhitelistUser = trpc.events.removeWhiteListUser.useMutation({
    onSuccess: () => {
      toast.success("User removed from whitelist successfully");
      trpcUtils.events.getWhitelistUsers.invalidate({ eventId: event.id });
    },
    onError: (error) => {
      toast.error(`Error removing user from whitelist: ${error.message}`);
    },
  });

  const removeWhitelistRole = trpc.events.removeWhitelistRole.useMutation({
    onSuccess: () => {
      toast.success("Role removed from whitelist successfully");
      trpcUtils.events.getWhitelistRoles.invalidate({ eventId: event.id });
    },
    onError: (error) => {
      toast.error(`Error removing role from whitelist: ${error.message}`);
    },
  });

  // Export registrations mutation
  const exportRegistrationsMutation = trpc.events.exportRegistrations.useMutation({
    onSuccess: (data) => {
      // Create blob and download
      const blob = new Blob([Uint8Array.from(atob(data.data), c => c.charCodeAt(0))], {
        type: data.mimeType
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = data.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    }
  });

  const handleExportRegistrations = () => {
    exportRegistrationsMutation.mutate({ eventId: event.id });
  };

  // Check if current user is admin/event office (needed early for query enabled flags)
  const isAdminOrEventOffice = user?.role === UserRole.ADMIN || user?.role === UserRole.EVENT_OFFICE;

  // ============================================
  // QR CODE MANAGEMENT (Requirement #51)
  // ============================================
  
  // QR code status query
  const { data: qrStatus, refetch: refetchQRStatus } = trpc.qrCodes.getEventQRStatus.useQuery(
    { eventId: event.id },
    { enabled: !!event.id && isAdminOrEventOffice }
  );

  // QR code mutations
  const generateAllQRsMutation = trpc.qrCodes.generateAllVisitorQRs.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      refetchQRStatus();
    },
    onError: (error) => {
      toast.error(`Failed to generate QR codes: ${error.message}`);
    },
  });

  const generateVisitorQRMutation = trpc.qrCodes.generateVisitorQR.useMutation({
    onSuccess: () => {
      toast.success('QR code generated');
      refetchQRStatus();
    },
    onError: (error) => {
      toast.error(`Failed to generate QR code: ${error.message}`);
    },
  });

  const sendQREmailMutation = trpc.qrCodes.sendVisitorQREmail.useMutation({
    onSuccess: () => {
      toast.success('QR code email sent');
      refetchQRStatus();
    },
    onError: (error) => {
      toast.error(`Failed to send email: ${error.message}`);
    },
  });

  // ============================================
  // CERTIFICATE MANAGEMENT (Requirement #30)
  // ============================================
  
  // Certificate status query (only for workshops)
  const { data: certificateStatus, refetch: refetchCertificateStatus } = trpc.certificates.getCertificateStatus.useQuery(
    { eventId: event.id },
    { enabled: !!event.id && event.type === 'WORKSHOP' && isAdminOrEventOffice }
  );

  // Certificate attendees query
  const { data: certificateAttendees, refetch: refetchCertificateAttendees } = trpc.certificates.getWorkshopAttendees.useQuery(
    { eventId: event.id },
    { enabled: !!event.id && event.type === 'WORKSHOP' && isAdminOrEventOffice }
  );

  // Send all certificates mutation
  const sendAllCertificatesMutation = trpc.certificates.sendAllCertificates.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      refetchCertificateStatus();
      refetchCertificateAttendees();
    },
    onError: (error) => {
      toast.error(`Failed to send certificates: ${error.message}`);
    },
  });

  // Send certificate to single user mutation
  const sendCertificateToUserMutation = trpc.certificates.sendCertificateToUser.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      refetchCertificateStatus();
      refetchCertificateAttendees();
    },
    onError: (error) => {
      toast.error(`Failed to send certificate: ${error.message}`);
    },
  });

  // Download certificate mutation
  const downloadCertificateMutation = trpc.certificates.downloadCertificate.useMutation({
    onSuccess: (data) => {
      // Download the PDF
      const link = document.createElement('a');
      link.href = `data:${data.mimeType};base64,${data.data}`;
      link.download = data.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Certificate downloaded');
    },
    onError: (error) => {
      toast.error(`Failed to download certificate: ${error.message}`);
    },
  });

  // QR preview dialog state
  const [qrPreviewDialog, setQrPreviewDialog] = useState<{ open: boolean; qrCode: string | null; name: string }>({
    open: false,
    qrCode: null,
    name: '',
  });

  // Additional role/status checks
  const isAdmin = user?.role === UserRole.ADMIN;
  const isWorkshop = event.type === 'WORKSHOP';
  const isRejected = event.status === 'REJECTED';
  
  // Hide edit/delete/archive for workshops when admin/event office
  // Also hide edit for rejected workshops (professors cannot edit rejected workshops)
  // Admins cannot edit ANY event type
  const canEdit = onEdit 
    && !isAdmin
    && !(isWorkshop && isAdminOrEventOffice)
    && !(isWorkshop && isRejected);
  const canArchive = onArchive && !(isWorkshop && isAdminOrEventOffice);
  const canDelete = onDelete && !(isWorkshop && isAdminOrEventOffice);

  // Determine if any quick actions are available to render
  const hasWorkshopApprovalActions =
    event.type === 'WORKSHOP' && (
      (onApproveWorkshop && (event.status === 'PENDING_APPROVAL' || event.status === 'NEEDS_EDITS')) ||
      (onNeedsEdits && event.status === 'PENDING_APPROVAL') ||
      (onRejectWorkshop && (event.status === 'PENDING_APPROVAL' || event.status === 'NEEDS_EDITS'))
    );

  const hasAnyQuickActions = Boolean(
    canEdit ||
    canArchive ||
    canDelete ||
    hasWorkshopApprovalActions
  );

    // State for whitelist search dialog
  const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<EventUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole | "">("");

  // Function to search users
  const handleSearchUsers = async (query: string = searchQuery) => {
    setIsSearching(true);
    try {
      // Use backend endpoint that excludes already whitelisted users
      const response = await trpcUtils.client.events.searchUsersForWhitelist.query({
        eventId: event.id,
        query: query || "",
        page: 1,
        limit: 50,
      });
      const results = response.users as EventUser[];
      setSearchResults(results);
    } catch (error) {
      console.error("Error searching users:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Load all users when user search dialog opens
  useEffect(() => {
    if (isSearchDialogOpen) {
      handleSearchUsers("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSearchDialogOpen]);

  // Debounced search effect for user search
  useEffect(() => {
    if (isSearchDialogOpen) {
      const timer = setTimeout(() => {
        handleSearchUsers(searchQuery);
      }, 300); // 300ms debounce

      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, isSearchDialogOpen]);

  // Function to add user to whitelist
  const handleWhitelistUser = (userId: string) => {
    console.log("Adding user to whitelist:", {
      userId,
      eventId: event.id,
    });
    whiteListUser.mutate(
      { userId, eventId: event.id },
      {
        onSuccess: () => {
          trpcUtils.events.getWhitelistUsers.invalidate({ eventId: event.id });
        },
      }
    );
    setIsSearchDialogOpen(false);
    setSearchQuery("");
    setSearchResults([]);
    setSelectedRole("");
  };

  // Function to add role to whitelist
  const handleWhitelistRole = () => {
    if (!selectedRole) return;

    console.log("Adding role to whitelist:", {
      role: selectedRole,
      eventId: event.id,
    });

    whiteListRole.mutate(
      { role: selectedRole as UserRole, eventId: event.id },
      {
        onSuccess: () => {
          trpcUtils.events.getWhitelistRoles.invalidate({ eventId: event.id });
        },
      }
    );
    setIsRoleDialogOpen(false);
    setSelectedRole("");
  };

  // Function to remove user from whitelist
  const handleRemoveWhitelistUser = (userId: string) => {
    removeWhitelistUser.mutate({ userId, eventId: event.id });
  };

  // Function to remove role from whitelist
  const handleRemoveWhitelistRole = (role: string) => {
    removeWhitelistRole.mutate({ role: role as UserRole, eventId: event.id });
  };

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
                {/* Common Fields */}
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
                
                {/* Registration Deadline - Show for most event types */}
                {event.registrationDeadline && event.type !== 'GYM_SESSION' && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Registration Deadline
                    </p>
                    <p className="text-sm">
                      {formatDate(new Date(event.registrationDeadline))}
                    </p>
                  </div>
                )}

                {/* Capacity - Show for all event types */}
                {event.capacity && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Capacity</p>
                    <p className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {event.registeredCount || 0} / {event.capacity}
                    </p>
                  </div>
                )}

                {/* Price - Show for all event types */}
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Price</p>
                  <p className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    {event.price ? `${event.price} EGP` : 'Free'}
                  </p>
                </div>

                {/* Workshop-specific Fields */}
                {event.type === 'WORKSHOP' && (
                  <>
                    {event.professors && event.professors.length > 0 && (
                      <div className="col-span-2">
                        <p className="text-sm font-medium text-muted-foreground">Professors</p>
                        <p className="text-sm">{event.professors.join(', ')}</p>
                      </div>
                    )}
                    {event.professorName && !event.professors?.length && (
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
                    {event.requiredBudget !== undefined && event.requiredBudget !== null && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Required Budget</p>
                        <p className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          {event.requiredBudget} EGP
                        </p>
                      </div>
                    )}
                  </>
                )}

                {/* Conference-specific Fields */}
                {event.type === 'CONFERENCE' && (
                  <>
                    {event.websiteUrl && (
                      <div className="col-span-2">
                        <p className="text-sm font-medium text-muted-foreground">Website</p>
                        <a 
                          href={event.websiteUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline"
                        >
                          {event.websiteUrl}
                        </a>
                      </div>
                    )}
                    {event.fundingSource && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Funding Source</p>
                        <p>{event.fundingSource}</p>
                      </div>
                    )}
                    {event.requiredBudget !== undefined && event.requiredBudget !== null && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Required Budget</p>
                        <p className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          {event.requiredBudget} EGP
                        </p>
                      </div>
                    )}
                  </>
                )}

                {/* Gym Session-specific Fields */}
                {event.type === 'GYM_SESSION' && (
                  <>
                    {event.sessionType && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Session Type</p>
                        <p className="text-sm">{event.sessionType}</p>
                      </div>
                    )}
                    {event.duration && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Duration</p>
                        <p className="text-sm">{event.duration} minutes</p>
                      </div>
                    )}
                  </>
                )}
              </div>

              <Separator />

              {/* Description - Show for all event types (optional for GYM_SESSION) */}
              {event.description && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Description</p>
                  <p className="text-sm whitespace-pre-line">{event.description}</p>
                </div>
              )}

              {/* Workshop-specific detailed fields */}
              {event.type === 'WORKSHOP' && (
                <>
                  {event.fullAgenda && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-2">Full Agenda</p>
                        <p className="text-sm whitespace-pre-line">{event.fullAgenda}</p>
                      </div>
                    </>
                  )}
                  {event.requirements && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-2">Requirements / Prerequisites</p>
                        <p className="text-sm whitespace-pre-line">{event.requirements}</p>
                      </div>
                    </>
                  )}
                  {event.extraResources && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-2">Extra Resources</p>
                        <p className="text-sm whitespace-pre-line">{event.extraResources}</p>
                      </div>
                    </>
                  )}
                </>
              )}

              {/* Conference-specific detailed fields */}
              {event.type === 'CONFERENCE' && (
                <>
                  {event.fullAgenda && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-2">Full Agenda</p>
                        <p className="text-sm whitespace-pre-line">{event.fullAgenda}</p>
                      </div>
                    </>
                  )}
                  {event.requirements && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-2">Requirements / Prerequisites</p>
                        <p className="text-sm whitespace-pre-line">{event.requirements}</p>
                      </div>
                    </>
                  )}
                  {event.extraResources && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-2">Extra Resources</p>
                        <p className="text-sm whitespace-pre-line">{event.extraResources}</p>
                      </div>
                    </>
                  )}
                </>
              )}

              {event.status === 'REJECTED' && event.rejectionReason && (
                <>
                  <Separator />
                  <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                    <p className="text-sm font-semibold text-destructive mb-2">Rejection Reason</p>
                    <p className="text-sm text-destructive/90">{event.rejectionReason}</p>
                  </div>
                </>
              )}

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
                          {(event.createdBy as EventUser).firstName} {(event.createdBy as EventUser).lastName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {(event.createdBy as EventUser).email}
                        </p>
                        <Badge variant="outline" className="mt-1">
                          {(event.createdBy as EventUser).role}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Registered Students - Event Office/Admin only, NOT for conferences */}
          {canViewRegistrations && registrationsData && registrationsData.registrations.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Registered Participants ({registrationsData.total})
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportRegistrations}
                    disabled={exportRegistrationsMutation.isPending}
                    className="gap-2"
                  >
                    <Download className="h-4 w-4" />
                    {exportRegistrationsMutation.isPending ? 'Exporting...' : 'Export to Excel'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(registrationsData.registrations as PopulatedRegistration[]).map((reg) => (
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

          {/* QR Code Management for Vendor Visitors - BAZAAR only, Events Office/Admin */}
          {isAdminOrEventOffice && event.type === 'BAZAAR' && qrStatus && qrStatus.stats.total > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <QrCode className="h-5 w-5" />
                    Vendor Visitor QR Codes ({qrStatus.stats.generated}/{qrStatus.stats.total} generated)
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => generateAllQRsMutation.mutate({ eventId: event.id })}
                    disabled={generateAllQRsMutation.isPending || qrStatus.stats.pending === 0}
                    className="gap-2"
                  >
                    {generateAllQRsMutation.isPending ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <QrCode className="h-4 w-4" />
                    )}
                    Generate All ({qrStatus.stats.pending} pending)
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-[300px] overflow-y-auto">
                  {qrStatus.participants.map((participant) => (
                    <div
                      key={participant.registrationId}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          {participant.hasQRCode ? (
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                          ) : (
                            <Clock className="h-5 w-5 text-amber-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{participant.name}</p>
                          <p className="text-sm text-muted-foreground">{participant.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {!participant.hasQRCode ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => generateVisitorQRMutation.mutate({ registrationId: participant.registrationId })}
                            disabled={generateVisitorQRMutation.isPending}
                          >
                            <QrCode className="h-4 w-4" />
                          </Button>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setQrPreviewDialog({
                                open: true,
                                qrCode: participant.qrCode,
                                name: participant.name,
                              })}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => sendQREmailMutation.mutate({ registrationId: participant.registrationId })}
                              disabled={sendQREmailMutation.isPending}
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Certificate Management - Workshops only, Events Office/Admin */}
          {isAdminOrEventOffice && event.type === 'WORKSHOP' && certificateStatus && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Certificates ({certificateStatus.certificatesSent}/{certificateStatus.totalConfirmed} sent)
                  </CardTitle>
                  {certificateStatus.canSendNow && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => sendAllCertificatesMutation.mutate({ eventId: event.id })}
                      disabled={sendAllCertificatesMutation.isPending}
                      className="gap-2"
                    >
                      {sendAllCertificatesMutation.isPending ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                      Send All ({certificateStatus.certificatesPending} pending)
                    </Button>
                  )}
                </div>
                {!certificateStatus.canSendNow && certificateStatus.reason && (
                  <p className="text-sm text-muted-foreground mt-2">{certificateStatus.reason}</p>
                )}
              </CardHeader>
              {certificateAttendees && certificateAttendees.attendees.length > 0 && (
                <CardContent>
                  <div className="space-y-3 max-h-[300px] overflow-y-auto">
                    {certificateAttendees.attendees.map((attendee) => (
                      <div
                        key={attendee.registrationId}
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            {attendee.certificateSentAt ? (
                              <CheckCircle2 className="h-5 w-5 text-green-600" />
                            ) : (
                              <Clock className="h-5 w-5 text-amber-600" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{attendee.name}</p>
                            <p className="text-sm text-muted-foreground">{attendee.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {/* Download certificate button */}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => downloadCertificateMutation.mutate({ registrationId: attendee.registrationId })}
                            disabled={downloadCertificateMutation.isPending}
                            title="Download certificate"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          {/* Send certificate button - only if not already sent */}
                          {!attendee.certificateSentAt && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => sendCertificateToUserMutation.mutate({ registrationId: attendee.registrationId })}
                              disabled={sendCertificateToUserMutation.isPending}
                              title="Send certificate via email"
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                          )}
                          <Badge variant={attendee.certificateSentAt ? 'default' : 'secondary'}>
                            {attendee.certificateSentAt ? 'Sent' : 'Pending'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          )}

          {/* WhiteListed */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Whitelisted Users ({whitelistUserData?.length || 0})
                </div>
                {isAdminOrEventOffice && (
                  <Dialog
                    open={isSearchDialogOpen}
                    onOpenChange={setIsSearchDialogOpen}
                  >
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Add User
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                      <DialogHeader>
                        <DialogTitle>Add User to Whitelist</DialogTitle>
                        <DialogDescription>
                          Search for users by name or email to add them to this
                          event's whitelist.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">
                            Search User
                          </label>
                          <Input
                            placeholder="Enter name or email..."
                            value={searchQuery}
                            onChange={(e) => {
                              setSearchQuery(e.target.value);
                            }}
                          />
                        </div>

                        {/* Search Results */}
                        {isSearching && (
                          <div className="flex items-center justify-center py-8">
                            <div className="flex flex-col items-center gap-2">
                              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                              <p className="text-sm text-muted-foreground">
                                Searching users...
                              </p>
                            </div>
                          </div>
                        )}

                        {!isSearching && searchResults.length > 0 && (
                          <div className="space-y-2 max-h-[300px] overflow-y-auto">
                            <label className="text-sm font-medium">
                              Search Results ({searchResults.length})
                            </label>
                            {searchResults.map((user) => (
                              <div
                                key={user.id}
                                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                    <User className="h-4 w-4 text-primary" />
                                  </div>
                                  <div>
                                    <p className="font-medium text-sm">
                                      {user.firstName} {user.lastName}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {user.email}
                                    </p>
                                    <Badge
                                      variant="outline"
                                      className="text-xs mt-1"
                                    >
                                      {user.role}
                                    </Badge>
                                  </div>
                                </div>
                                <Button
                                  size="sm"
                                  onClick={() => handleWhitelistUser(user.id)}
                                >
                                  Add
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}

                        {!isSearching && searchResults.length === 0 && (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            {searchQuery
                              ? "No users found. Try a different search."
                              : "No users available to add."}
                          </p>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {whitelistUserData && whitelistUserData.length > 0 ? (
                <div className="space-y-3">
                  {(whitelistUserData as EventUser[]).map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {user.firstName} {user.lastName}
                          </p>
                          <p className="text-sm text-muted-foreground flex items-center gap-2">
                            <Mail className="h-3 w-3" />
                            {user.email}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {user.role}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      {isAdminOrEventOffice && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleRemoveWhitelistUser(user.id)}
                          disabled={removeWhitelistUser.isPending}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No users whitelisted yet. Click "Add User" to get started.
                </p>
              )}
            </CardContent>
          </Card>

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
          {event.type === 'BAZAAR' && (event as Event & { vendors?: VendorInfo[] }).vendors && (event as Event & { vendors: VendorInfo[] }).vendors.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Participating Vendors ({(event as Event & { vendors: VendorInfo[] }).vendors.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {(event as Event & { vendors: VendorInfo[] }).vendors.map((vendor) => (
                    <VendorCard 
                      key={vendor.id}
                      vendor={vendor}
                      showParticipants={isAdminOrEventOffice}
                      defaultExpanded={false}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Actions */}
        <div className="space-y-6">
          {hasAnyQuickActions && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-3">
                {canEdit && (
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => onEdit(event.id)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Event
                  </Button>
                )}
                {canArchive && (
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => onArchive(event.id)}
                  >
                    <Archive className="h-4 w-4 mr-2" />
                    Archive Event
                  </Button>
                )}
                {canDelete && (
                  <Button
                    variant="destructive"
                    className="w-full justify-start"
                    onClick={() => onDelete(event.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Event
                  </Button>
                )}
                {/* Workshop Approval Actions - Only shown for pending workshops */}
                {onApproveWorkshop && event.type === "WORKSHOP" && (event.status === "PENDING_APPROVAL" || event.status === "NEEDS_EDITS") && (
                  <Button
                    className="w-full justify-start"
                    onClick={() => onApproveWorkshop(event.id)}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Approve Workshop
                  </Button>
                )}
                {onNeedsEdits && event.type === "WORKSHOP" && event.status === "PENDING_APPROVAL" && (
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => onNeedsEdits(event.id)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Request Edits
                  </Button>
                )}
                {onRejectWorkshop && event.type === "WORKSHOP" && (event.status === "PENDING_APPROVAL" || event.status === "NEEDS_EDITS") && (
                  <Button
                    variant="destructive"
                    className="w-full justify-start"
                    onClick={() => onRejectWorkshop(event.id)}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject Workshop
                  </Button>
                )}
                </div>
              </CardContent>
            </Card>
          )}

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
                    <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Whitelisted Roles ({whitelistRoleData?.length || 0})
                </div>
                {isAdminOrEventOffice && (
                  <Dialog
                    open={isRoleDialogOpen}
                    onOpenChange={setIsRoleDialogOpen}
                  >
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Role
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                      <DialogHeader>
                        <DialogTitle>Add Role to Whitelist</DialogTitle>
                        <DialogDescription>
                          Select a role to whitelist all users with that role
                          for this event.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">
                            Select Role
                          </label>
                          <Select
                            value={selectedRole}
                            onValueChange={(value) => {
                              setSelectedRole(value as UserRole);
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select a role" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={UserRole.STUDENT}>
                                Student
                              </SelectItem>
                              <SelectItem value={UserRole.TA}>
                                Teaching Assistant
                              </SelectItem>
                              <SelectItem value={UserRole.PROFESSOR}>
                                Professor
                              </SelectItem>
                              <SelectItem value={UserRole.STAFF}>
                                Staff
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {selectedRole && (
                          <Button
                            className="w-full"
                            onClick={handleWhitelistRole}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Entire {selectedRole} Role to Whitelist
                          </Button>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {whitelistRoleData && whitelistRoleData.length > 0 ? (
                <div className="space-y-3">
                  {(whitelistRoleData as string[]).map((role) => (
                    <div
                      key={role}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Users className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{role}</p>
                          <p className="text-sm text-muted-foreground">
                            All users with this role
                          </p>
                        </div>
                      </div>
                      {isAdminOrEventOffice && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleRemoveWhitelistRole(role)}
                          disabled={removeWhitelistRole.isPending}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No roles whitelisted yet. Click "Add Role" to get started.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* QR Code Preview Dialog */}
      <Dialog
        open={qrPreviewDialog.open}
        onOpenChange={(open) => setQrPreviewDialog((prev) => ({ ...prev, open }))}
      >
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>QR Code for {qrPreviewDialog.name}</DialogTitle>
            <DialogDescription>
              This QR code can be scanned at the event for check-in.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center py-6">
            {qrPreviewDialog.qrCode && (
              <img
                src={qrPreviewDialog.qrCode}
                alt={`QR Code for ${qrPreviewDialog.name}`}
                className="w-64 h-64 border rounded-lg"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
