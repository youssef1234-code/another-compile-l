/**
 * Vendor Polls Page
 *
 * Allows students/TAs/professors to vote on vendor polls
 * Allows Events Office to manage and resolve polls
 *
 * Requirements: #82
 */

import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useAuthStore } from "@/store/authStore";
import { UserRole, PollStatus } from "../../../shared";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Vote,
  CheckCircle2,
  XCircle,
  Calendar,
  MapPin,
  Clock,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { formatDate } from "@/lib/design-system";
import { designSystem } from "@/styles/design-system";
import { usePageMeta } from "@/components/layout/page-meta-context";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

// Types for vendor polls
interface PollVote {
  applicationId?: string;
  voterId?: string;
}

interface PollApplication {
  _id?: string;
  companyName?: string;
  names?: string[];
}

interface VendorPoll {
  _id: string;
  boothLabel?: string;
  boothLocationId?: string;
  status: PollStatus;
  startDate?: string;
  endDate?: string;
  duration?: number;
  votes?: PollVote[];
  conflictingApplications?: PollApplication[];
}

export function VendorPollsPage() {
  const { setPageMeta } = usePageMeta();
  const { user } = useAuthStore();
  const utils = trpc.useUtils();
  const isEventsOffice = user?.role === UserRole.EVENT_OFFICE;

  const [selectedPollId, setSelectedPollId] = useState<string | null>(null);
  const [selectedApplicationId, setSelectedApplicationId] =
    useState<string>("");
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

  useEffect(() => {
    setPageMeta({
      title: "Vendor Polls",
      description: "Vote on vendor selection for platform booths",
    });
  }, [setPageMeta]);

  // Fetch active polls
  const { data: pollsData, isLoading } =
    trpc.vendorPolls.getActivePolls.useQuery({
      page: 1,
      limit: 50,
    });

  // Vote mutation
  const voteMutation = trpc.vendorPolls.vote.useMutation({
    onSuccess: () => {
      toast.success("Vote submitted successfully!");
      utils.vendorPolls.getActivePolls.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to submit vote");
    },
  });

  // Resolve poll mutation (Events Office only)
  const resolveMutation = trpc.vendorPolls.resolvePoll.useMutation({
    onSuccess: () => {
      toast.success("Poll resolved successfully!");
      setResolveDialogOpen(false);
      setSelectedPollId(null);
      setSelectedApplicationId("");
      utils.vendorPolls.getActivePolls.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to resolve poll");
    },
  });

  // Cancel poll mutation (Events Office only)
  const cancelMutation = trpc.vendorPolls.cancelPoll.useMutation({
    onSuccess: () => {
      toast.success("Poll cancelled successfully!");
      setCancelDialogOpen(false);
      setSelectedPollId(null);
      utils.vendorPolls.getActivePolls.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to cancel poll");
    },
  });

  const handleVote = (pollId: string, applicationId: string) => {
    voteMutation.mutate({ pollId, applicationId });
  };

  const handleResolvePoll = () => {
    if (selectedPollId && selectedApplicationId) {
      resolveMutation.mutate({
        pollId: selectedPollId,
        winningApplicationId: selectedApplicationId,
      });
    }
  };

  const handleCancelPoll = () => {
    if (selectedPollId) {
      cancelMutation.mutate({ pollId: selectedPollId });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const polls = pollsData?.polls || [];

  if (polls.length === 0) {
    return (
      <div className="p-6">
        <div className="border border-dashed rounded-lg">
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            {/* Icon */}
            <div className="relative mb-4">
              <div className="absolute inset-0 animate-pulse rounded-full bg-primary/10 blur-xl" />
              <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
                <Vote className="h-8 w-8 text-primary" />
              </div>
            </div>

            {/* Title */}
            <h3 className="text-lg font-semibold mb-2">No Active Polls</h3>

            {/* Description */}
            <p className="text-sm text-muted-foreground max-w-md">
              Polls are created automatically when multiple vendors apply for the same booth. Check back when there are booth conflicts to vote on.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Vendor Polls</h2>
          <p className="text-muted-foreground">
            Vote on vendor selection for platform booths
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1.5">
            <Vote className="h-3.5 w-3.5" />
            {polls.length} Active {polls.length === 1 ? "Poll" : "Polls"}
          </Badge>
        </div>
      </div>

      {/* Polls Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {(polls as VendorPoll[]).map((poll) => {
                // Calculate vote counts per application
                const voteCounts = new Map<string, number>();
                poll.votes?.forEach((vote) => {
                  const appId = vote.applicationId?.toString();
                  if (appId) voteCounts.set(appId, (voteCounts.get(appId) || 0) + 1);
                });

                // Find user's current vote
                const userId = user?.id;
                const userVote = poll.votes?.find(
                  (vote) => vote.voterId?.toString() === userId
                );
                const userVotedAppId = userVote?.applicationId?.toString();

                // Calculate total votes
                const totalVotes = poll.votes?.length || 0;

                return (
                  <Card key={poll._id} className={designSystem.card.base}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between gap-3">
                        <CardDescription
                          className={cn(
                            designSystem.typography.small,
                            "flex flex-wrap gap-x-4 gap-y-1"
                          )}
                        >
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" />
                            Booth {poll.boothLabel || poll.boothLocationId}
                          </span>
                          {poll.startDate && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {formatDate(new Date(poll.startDate))}
                          </span>
                          )}
                          {poll.duration && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {poll.duration}{" "}
                            {poll.duration === 1 ? "week" : "weeks"}
                          </span>
                          )}
                        </CardDescription>
                        <Badge
                          variant={
                            poll.status === PollStatus.ACTIVE
                              ? "default"
                              : "secondary"
                          }
                          className="text-xs shrink-0"
                        >
                          {poll.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2 pt-0">
                      <div className="space-y-2">
                        {poll.conflictingApplications?.map(
                          (application) => {
                            const appId = application._id?.toString();
                            const voteCount = appId ? voteCounts.get(appId) || 0 : 0;
                            const votePercentage =
                              totalVotes > 0
                                ? Math.round((voteCount / totalVotes) * 100)
                                : 0;
                            const isUserVote = appId === userVotedAppId;

                            return (
                              <button
                                key={appId}
                                onClick={() => appId && handleVote(poll._id, appId)}
                                disabled={voteMutation.isPending}
                                className={cn(
                                  "w-full text-left p-3 border rounded-lg transition-all duration-200 hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed",
                                  isUserVote
                                    ? "border-primary bg-primary/5"
                                    : "border-border"
                                )}
                              >
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2 min-w-0">
                                      <span className="font-medium truncate">
                                        {application.companyName}
                                      </span>
                                      {isUserVote && (
                                        <Badge
                                          variant="default"
                                          className="text-xs shrink-0"
                                        >
                                          ✓
                                        </Badge>
                                      )}
                                    </div>
                                    <span className="text-xs text-muted-foreground shrink-0">
                                      {votePercentage}%
                                    </span>
                                  </div>
                                  {totalVotes > 0 && (
                                    <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                                      <div
                                        className="h-full bg-primary transition-all duration-200"
                                        style={{ width: `${votePercentage}%` }}
                                      />
                                    </div>
                                  )}
                                </div>
                              </button>
                            );
                          }
                        )}
                      </div>

                      {totalVotes > 0 && (
                        <p
                          className={cn(
                            designSystem.typography.small,
                            "text-muted-foreground text-center pt-1"
                          )}
                        >
                          {totalVotes} {totalVotes === 1 ? "vote" : "votes"}
                        </p>
                      )}

                      {isEventsOffice && (
                        <>
                          <Separator className="my-3" />
                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedPollId(poll._id);
                                setCancelDialogOpen(true);
                              }}
                              disabled={cancelMutation.isPending}
                            >
                              <XCircle className="h-4 w-4 mr-1.5" />
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedPollId(poll._id);
                                setSelectedApplicationId("");
                                setResolveDialogOpen(true);
                              }}
                              disabled={
                                resolveMutation.isPending || totalVotes === 0
                              }
                            >
                              <CheckCircle2 className="h-4 w-4 mr-1.5" />
                              Resolve
                            </Button>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
      </div>

      {/* Resolve Poll Dialog */}
      <Dialog open={resolveDialogOpen} onOpenChange={setResolveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Poll</DialogTitle>
            <DialogDescription>
              Select the winning vendor application. The selected vendor will be
              approved, and all other applications will be rejected.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="winning-application">Winning Application</Label>
              <Select
                value={selectedApplicationId}
                onValueChange={setSelectedApplicationId}
              >
                <SelectTrigger id="winning-application">
                  <SelectValue placeholder="Select winning vendor" />
                </SelectTrigger>
                <SelectContent>
                  {((polls as VendorPoll[])
                    .find((p) => p._id === selectedPollId))
                    ?.conflictingApplications?.map((app) => (
                      <SelectItem key={app._id} value={app._id!}>
                        {app.companyName} - {app.names?.join(", ")}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setResolveDialogOpen(false)}
              disabled={resolveMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleResolvePoll}
              disabled={!selectedApplicationId || resolveMutation.isPending}
            >
              {resolveMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Resolve Poll
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Poll Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Poll</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this poll? This action cannot be
              undone. All votes will be discarded.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCancelDialogOpen(false)}
              disabled={cancelMutation.isPending}
            >
              No, Keep Poll
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelPoll}
              disabled={cancelMutation.isPending}
            >
              {cancelMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Yes, Cancel Poll
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
