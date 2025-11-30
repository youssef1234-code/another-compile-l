/**
 * Vendor Application Expanded Row
 * 
 * Shows detailed information about the application including:
 * - Bazaar/Event details
 * - Attendees list
 * - Booth information
 * - Application status
 */

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  MapPin, 
  Users, 
  Building2, 
  Clock,
  Mail,
  User,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Download,
} from "lucide-react";
import { formatDate } from "@/lib/design-system";
import type { VendorApplication } from "@event-manager/shared";
import { toast } from "react-hot-toast";
import { formatValidationErrors } from "@/lib/format-errors";
import { Button } from "@/components/ui/button";
import { useCallback } from "react";
import { trpc } from "@/lib/trpc";

interface VendorApplicationExpandedRowProps {
  application: VendorApplication & {
    idPictures?: string[]; // KHODARY CHECK THIS IF HALAL
  };
}

export function VendorApplicationExpandedRow({ application }: VendorApplicationExpandedRowProps) {
  const isBazaar = application.type === 'BAZAAR';
  
  // Status configuration
  const statusConfig = {
    APPROVED: {
      icon: CheckCircle2,
      label: "Approved",
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
    },
    REJECTED: {
      icon: XCircle,
      label: "Rejected",
      color: "text-red-600 dark:text-red-400",
      bgColor: "bg-red-50 dark:bg-red-900/20",
    },
    PENDING: {
      icon: AlertCircle,
      label: "Pending Review",
      color: "text-amber-600 dark:text-amber-400",
      bgColor: "bg-amber-50 dark:bg-amber-900/20",
    },
  };

  const status = statusConfig[application.status as keyof typeof statusConfig] || statusConfig.PENDING;
  const StatusIcon = status.icon;

  const utils = trpc.useUtils();

  const handleDownloadIdPicture = useCallback(
    async (index: number, attendeeName: string) => {
      const fileId = application.idPictures?.[index];

      if (!fileId) {
        toast.error("No ID picture found for this attendee");
        return;
      }

      try {
        const fileData = await utils.files.downloadFile.fetch({ fileId });

        // Create a download link
        const dataUrl = `data:${fileData.mimeType};base64,${fileData.data}`;
        const link = document.createElement("a");
        link.href = dataUrl;
        link.download =
          fileData.filename ||
          `id-${attendeeName.replace(/\s+/g, "-")}.${
            fileData.mimeType.split("/")[1]
          }`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast.success("ID picture downloaded successfully");
      } catch (error) {
        const errorMessage = formatValidationErrors(error);
        toast.error(errorMessage, { style: { whiteSpace: "pre-line" } });
      }
    },
    [application.idPictures, utils]
  );

  return (
    <div className="p-6 bg-muted/30">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Event Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {isBazaar ? 'Bazaar Details' : 'Platform Booth Details'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isBazaar && application.bazaarName && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Bazaar Name</p>
                <p className="text-base font-semibold">{application.bazaarName}</p>
              </div>
            )}
            
            {application.location !== undefined && (
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Location</p>
                  <p className="text-base">{application.location}</p>
                </div>
              </div>
            )}
            
            {application.startDate && (
              <div className="flex items-start gap-2">
                <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Start Date</p>
                  <p className="text-base">{formatDate(new Date(application.startDate))}</p>
                </div>
              </div>
            )}
            
            {!isBazaar && application.duration && (
              <div className="flex items-start gap-2">
                <Clock className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Duration</p>
                  <p className="text-base">{application.duration} week{application.duration !== 1 ? 's' : ''}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Booth Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Booth Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Booth Size</p>
              <Badge variant="outline" className="mt-1 text-base font-medium">
                {application.boothSize === 'TWO_BY_TWO' ? '2×2 Small' : '4×4 Large'}
              </Badge>
            </div>
            
            <div className={`p-4 rounded-lg ${status.bgColor}`}>
              <div className="flex items-center gap-2 mb-1">
                <StatusIcon className={`h-5 w-5 ${status.color}`} />
                <p className={`font-semibold ${status.color}`}>{status.label}</p>
              </div>
              {application.status === 'PENDING' && (
                <p className="text-sm text-muted-foreground mt-1">
                  Your application is under review by the events office
                </p>
              )}
              {application.status === 'APPROVED' && (
                <p className="text-sm text-muted-foreground mt-1">
                  You're confirmed to participate!
                </p>
              )}
              {application.status === 'REJECTED' && application.rejectionReason && (
                <p className="text-sm text-muted-foreground mt-1">
                  Reason: {application.rejectionReason}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Attendees List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5" />
              Attendees ({application.names?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {application.names && application.names.length > 0 ? (
              <div className="space-y-3">
                {application.names.map((name, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
                  >
                    <div className="mt-0.5">
                      <User className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{name}</p>
                      {application.emails && application.emails[index] && (
                        <div className="flex items-center gap-1 mt-1">
                          <Mail className="h-3 w-3 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground truncate">
                            {application.emails[index]}
                          </p>
                        </div>
                      )}
                    </div>
                      {application.idPictures?.[index] && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadIdPicture(index, name)}
                        title="Download ID/Passport"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No attendees listed
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
