import { useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "react-hot-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CheckCircle2,
  Calendar,
  MapPin,
  Clock,
  Store,
  BadgeCheckIcon,
  BadgeXIcon,
  ClipboardList,
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

export function VendorApplicationsPage() {
  const { data: applicationData, isLoading } =
    trpc.vendorApplications.getApplications.useQuery({
      page: 1,
      limit: 100,
    });
  const applications = (applicationData?.applications ||
    []) as VendorApplication[];

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
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-bold flex items-center gap-2">
              <ClipboardList className="h-8 w-8" />
              View Applications
            </CardTitle>
            <CardDescription>View your submitted applications</CardDescription>
          </CardHeader>
        </Card>
      </motion.div>
      <Tabs defaultValue="upcoming">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="review">Pending/Rejected</TabsTrigger>
        </TabsList>
        <TabsContent value="upcoming">
          <motion.div variants={itemVariants}>
            {applications.length === 0 ? (
              <Card>
                <CardContent className="py-16">
                  <div className="flex flex-col items-center justify-center gap-4">
                    <CheckCircle2 className="h-16 w-16 text-muted-foreground" />
                    <div className="text-center space-y-2">
                      <h3 className="text-xl font-semibold">All caught up!</h3>
                      <p className="text-muted-foreground">
                        No application have been created at this time
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6">
                {applications
                  .filter((value) => value.status === "APPROVED")
                  .map((application, index) => (
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
                            {application.status === "APPROVED" && (
                              <Badge
                                variant="secondary"
                                className="ml-4 bg-green-800 text-white"
                              >
                                <BadgeCheckIcon /> Approved
                              </Badge>
                            )}
                            {application.status === "PENDING" && (
                              <Badge variant="secondary" className="ml-4">
                                Pending
                              </Badge>
                            )}
                            {application.status === "REJECTED" && (
                              <Badge
                                variant="secondary"
                                className="ml-4 bg-red-800 text-white"
                              >
                                <BadgeXIcon />
                                Rejected
                              </Badge>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="pt-6">
                          <div className="grid gap-6 md:grid-cols-2">
                            {/* Left Column - Details */}
                            <div className="space-y-4">
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
                                    {application.duration === 1
                                      ? "week"
                                      : "weeks"}
                                  </span>
                                </div>
                              )}
                              {application.location && (
                                <div className="flex items-center gap-2 text-sm">
                                  <MapPin className="h-4 w-4 text-muted-foreground" />
                                  <span className="font-medium">
                                    Location:{" "}
                                  </span>
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
                              <h4 className="font-bold text-m mb-2">
                                Attendees:
                              </h4>
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
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
              </div>
            )}
          </motion.div>
        </TabsContent>
        <TabsContent value="review">
          <motion.div variants={itemVariants}>
            {applications.length === 0 ? (
              <Card>
                <CardContent className="py-16">
                  <div className="flex flex-col items-center justify-center gap-4">
                    <CheckCircle2 className="h-16 w-16 text-muted-foreground" />
                    <div className="text-center space-y-2">
                      <h3 className="text-xl font-semibold">All caught up!</h3>
                      <p className="text-muted-foreground">
                        No application have been created at this time
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6">
                {applications
                  .filter((value) => value.status !== "APPROVED")
                  .map((application, index) => (
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
                            {application.status === "APPROVED" && (
                              <Badge
                                variant="secondary"
                                className="ml-4 bg-green-800 text-white"
                              >
                                <BadgeCheckIcon /> Approved
                              </Badge>
                            )}
                            {application.status === "PENDING" && (
                              <Badge variant="secondary" className="ml-4">
                                Pending
                              </Badge>
                            )}
                            {application.status === "REJECTED" && (
                              <Badge
                                variant="secondary"
                                className="ml-4 bg-red-800 text-white"
                              >
                                <BadgeXIcon />
                                Rejected
                              </Badge>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="pt-6">
                          <div className="grid gap-6 md:grid-cols-2">
                            {/* Left Column - Details */}
                            <div className="space-y-4">
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
                                    {application.duration === 1
                                      ? "week"
                                      : "weeks"}
                                  </span>
                                </div>
                              )}
                              {application.location && (
                                <div className="flex items-center gap-2 text-sm">
                                  <MapPin className="h-4 w-4 text-muted-foreground" />
                                  <span className="font-medium">
                                    Location:{" "}
                                  </span>
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
                              <h4 className="font-bold text-m mb-2">
                                Attendees:
                              </h4>
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
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
              </div>
            )}
          </motion.div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
