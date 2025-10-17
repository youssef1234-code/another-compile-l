import { useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "react-hot-toast";
import {
  CheckCircle2,
  XCircle,
  Calendar,
  MapPin,
  Clock,
  Briefcase,
  Store,
} from "lucide-react";
import { motion } from "framer-motion";
import { LoadingSpinner } from "@/components/generic/LoadingSpinner";
import type { VendorApplication } from "@event-manager/shared";

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

export function VendorRequestsPage() {
  const [selectedApplication, setSelectedApplication] =
    useState<VendorApplication | null>(null);
  const [actionDialog, setActionDialog] = useState<"approve" | "reject" | null>(
    null,
  );

  const {
    data: applicationData,
    isLoading,
    refetch,
  } = trpc.vendorApplications.getApplications.useQuery({
    page: 1,
    limit: 100,
    status: "PENDING",
  });

  const updateMutation = trpc.vendorApplications.update.useMutation({
    onSuccess: () => {
      toast.success("Application updated successfully");
      setActionDialog(null);
      setSelectedApplication(null);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update application");
    },
  });

  const applications = (applicationData?.applications ||
    []) as VendorApplication[];

  const handleApprove = () => {
    if (!selectedApplication) return;
    updateMutation.mutate({
      id: selectedApplication.id,
      status: { status: "APPROVED" as any },
    });
  };

  const handleReject = () => {
    if (!selectedApplication) return;
    updateMutation.mutate({
      id: selectedApplication.id,
      status: { status: "REJECTED" as any },
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
              Application Approvals
            </CardTitle>
            <CardDescription>
              Review and approve vendor application submissions
            </CardDescription>
          </CardHeader>
        </Card>
      </motion.div>

      {/* Applications List */}
      <motion.div variants={itemVariants}>
        {applications.length === 0 ? (
          <Card>
            <CardContent className="py-16">
              <div className="flex flex-col items-center justify-center gap-4">
                <CheckCircle2 className="h-16 w-16 text-muted-foreground" />
                <div className="text-center space-y-2">
                  <h3 className="text-xl font-semibold">All caught up!</h3>
                  <p className="text-muted-foreground">
                    No pending application approvals at this time
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {applications.map((application, index) => (
              <motion.div
                key={application.id}
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                transition={{ delay: index * 0.05 }}
              >
                <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                  <CardHeader className="bg-muted/30 border-b">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-2xl">
                          {application.type === "BAZAAR"
                            ? "Application for " +
                              application.bazaarName +
                              " Booth"
                            : "Application for Platform Booth"}
                        </CardTitle>
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
                          <Briefcase className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">Vendor:</span>
                          <span> {application.companyName}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">Date:</span>
                          <span>
                            {new Date(
                              application.startDate || "0",
                            ).toLocaleDateString()}
                          </span>
                        </div>
                        {application.duration && (
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">Duration:</span>
                            <span>
                              {application.duration}{" "}
                              {application.duration === 1 ? "week" : "weeks"}
                            </span>
                          </div>
                        )}
                        {application.location && (
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">Location: </span>
                            <span> Zone {application.location}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-sm">
                          <Store className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">Booth Size:</span>
                          <span>
                            {application.boothSize === "TWO_BY_TWO"
                              ? "2x2"
                              : "4x4"}
                          </span>
                        </div>
                      </div>

                      {/* Right Column - Additional Info */}
                      <div className="space-y-4">
                        <h4 className="font-bold text-m mb-2">Attendees:</h4>
                        {application.names.map((name, i) => (
                          <div className="flex items-center gap-2 text-sm">
                            <span className="font-medium">Name: </span>
                            <span> {name}</span>
                            <span className="font-medium">Email: </span>
                            <span> {application.emails[i]}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-3 mt-6 pt-6 border-t">
                      <Button
                        onClick={() => {
                          setSelectedApplication(application);
                          setActionDialog("approve");
                        }}
                        className="flex-1"
                      >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Approve
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => {
                          setSelectedApplication(application);
                          setActionDialog("reject");
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
      <Dialog
        open={actionDialog === "approve"}
        onOpenChange={() => setActionDialog(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Workshop</DialogTitle>
            <DialogDescription>
              Are you sure you want to approve{" "}
              {selectedApplication?.companyName}'s application? This will make
              it visible to all users.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog(null)}>
              Cancel
            </Button>
            <Button onClick={handleApprove} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Approving..." : "Approve & Publish"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog
        open={actionDialog === "reject"}
        onOpenChange={() => setActionDialog(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Workshop</DialogTitle>
            <DialogDescription>
              Are you sure you want to reject {selectedApplication?.companyName}
              's request?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? "Rejecting..." : "Reject Workshop"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
