/**
 * Bazaars List Page (Vendor View)
 *
 * Optimized with React 19 features:
 * - useDeferredValue for search performance
 * - useTransition for non-blocking updates
 * - Proper DataTable with advanced/simple filters
 *
 * Requirements: #59, #60
 */

import {
  useState,
  useMemo,
  useTransition,
  useDeferredValue,
  useEffect,
} from "react";
import { useQueryState, parseAsString, parseAsBoolean } from "nuqs";
import { trpc } from "@/lib/trpc";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { DataTableAdvancedToolbar } from "@/components/data-table/data-table-advanced-toolbar";
import { DataTableFilterList } from "@/components/data-table/data-table-filter-list";
import { DataTableSortList } from "@/components/data-table/data-table-sort-list";
import { useDataTable } from "@/hooks/use-data-table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatValidationErrors } from "@/lib/format-errors";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import {
  Loader2,
  Plus,
  Trash2,
  ShoppingBag,
  Calendar,
  MapPin,
  Clock,
  Info,
  Search,
  ListFilter,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { getBazaarsTableColumns } from "../components/bazaars-table-columns";
import { formatDate } from "@/lib/design-system";
import type { Event } from "@event-manager/shared";
import { usePageMeta } from "@/components/layout/page-meta-context";
import { ImageUpload } from "@/components/ui/image-upload";

interface Attendee {
  name: string;
  email: string;
  idPicture: string;
}

// Expandable Row Component
function BazaarExpandedRow({ bazaar }: { bazaar: Event }) {
  return (
    <div className="p-6 bg-muted/30">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Event Dates
                </p>
                <p className="text-base font-semibold mt-1">
                  {bazaar.startDate
                    ? formatDate(new Date(bazaar.startDate))
                    : "TBD"}
                </p>
                <p className="text-sm text-muted-foreground">
                  to{" "}
                  {bazaar.endDate
                    ? formatDate(new Date(bazaar.endDate))
                    : "TBD"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Location
                </p>
                <p className="text-base font-semibold mt-1">
                  {bazaar.location || "TBD"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Registration Deadline
                </p>
                <p className="text-base font-semibold mt-1">
                  {bazaar.registrationDeadline
                    ? formatDate(new Date(bazaar.registrationDeadline))
                    : "TBD"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {bazaar.description && (
          <Card className="md:col-span-3">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-primary mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground mb-2">
                    Description
                  </p>
                  <p className="text-base leading-relaxed">
                    {bazaar.description}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export function BazaarsListPage() {
  const { setPageMeta } = usePageMeta();
  const [isPending, startTransition] = useTransition();
  const [selectedBazaar, setSelectedBazaar] = useState<Event | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [attendees, setAttendees] = useState<Attendee[]>([
    { name: "", email: "", idPicture: "" },
  ]);
  const [boothSize, setBoothSize] = useState<"TWO_BY_TWO" | "FOUR_BY_FOUR">(
    "TWO_BY_TWO"
  );

  useEffect(() => {
    setPageMeta({
      title: "Browse Bazaars",
      description: "View upcoming bazaars and apply to participate as a vendor",
    });
  }, [setPageMeta]);

  // Get trpc utils for invalidation
  const utils = trpc.useUtils();

  // Advanced filter toggle
  const [enableAdvancedFilter, setEnableAdvancedFilter] = useQueryState(
    "advanced",
    parseAsBoolean
      .withOptions({
        history: "replace",
        shallow: false,
      })
      .withDefault(false)
  );

  // Global search with deferred value for performance
  const [search, setSearch] = useQueryState(
    "search",
    parseAsString
      .withOptions({
        history: "replace",
        shallow: false,
      })
      .withDefault("")
  );
  const deferredSearch = useDeferredValue(search);

  // Fetch upcoming bazaars
  const { data, isLoading, refetch } = trpc.events.getEvents.useQuery({
    page: 1,
    limit: 100,
    type: "BAZAAR",
    onlyUpcoming: true,
  });

  const bazaars = useMemo(
    () => (data?.events || []) as Event[],
    [data?.events]
  );

  // Check which bazaars vendor has already applied to
  const { data: existingApplications, refetch: refetchApplications } =
    trpc.vendorApplications.checkExistingApplications.useQuery(
      { bazaarIds: bazaars.map((b) => b.id) },
      { enabled: bazaars.length > 0 }
    );

  const appliedBazaarIds = useMemo(
    () => existingApplications || [],
    [existingApplications]
  );

  // Apply mutation
  const applyMutation = trpc.vendorApplications.create.useMutation({
    onSuccess: () => {
      toast.success("Application submitted successfully!");
      setShowDialog(false);
      resetForm();
      // Invalidate both queries to refresh the data
      utils.vendorApplications.checkExistingApplications.invalidate();
      utils.vendorApplications.getApplications.invalidate();
      refetch();
      refetchApplications();
    },
    onError: (error) => {
      const errorMessage = formatValidationErrors(error);
      toast.error(errorMessage, { style: { whiteSpace: "pre-line" } });
    },
  });

  // Table columns with Apply callback
  const columns = useMemo(
    () =>
      getBazaarsTableColumns({
        onApply: (bazaar) => {
          startTransition(() => {
            setSelectedBazaar(bazaar);
            setShowDialog(true);
          });
        },
        appliedBazaarIds,
      }),
    [appliedBazaarIds]
  );

  // Setup DataTable
  const { table, shallow, debounceMs, throttleMs } = useDataTable({
    data: bazaars,
    columns,
    pageCount: 1,
    enableAdvancedFilter,
    initialState: {
      sorting: [{ id: "registrationDeadline", desc: false }],
    },
    getRowId: (originalRow) => originalRow.id,
    getRowCanExpand: () => true,
  });

  const handleAddAttendee = () => {
    if (attendees.length < 5) {
      setAttendees([...attendees, { name: "", email: "", idPicture: "" }]);
    } else {
      toast.error("Maximum 5 attendees allowed");
    }
  };

  const handleRemoveAttendee = (index: number) => {
    if (attendees.length > 1) {
      setAttendees(attendees.filter((_, i) => i !== index));
    }
  };

  const handleUpdateAttendee = (
    index: number,
    field: "name" | "email" | "idPicture",
    value: string
  ) => {
    const updated = [...attendees];
    updated[index][field] = value;
    setAttendees(updated);
  };

  const handleSubmit = () => {
    if (!selectedBazaar) {
      toast.error("No bazaar selected");
      return;
    }

    // Check if already applied
    if (appliedBazaarIds.includes(selectedBazaar.id)) {
      toast.error("You have already applied to this bazaar");
      return;
    }

    if (attendees.some((a) => !a.name || !a.email || !a.idPicture)) {
      toast.error("All attendees must have a name, email, and ID picture");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (attendees.some((a) => !emailRegex.test(a.email))) {
      toast.error("Please provide valid email addresses");
      return;
    }

    applyMutation.mutate({
      type: "BAZAAR",
      bazaarId: selectedBazaar.id,
      bazaarName: selectedBazaar.name,
      startDate: selectedBazaar.startDate,
      names: attendees.map((a) => a.name),
      emails: attendees.map((a) => a.email),
      idPictures: attendees.map((a) => a.idPicture),
      boothSize,
      status: "PENDING",
    });
  };

  const resetForm = () => {
    setAttendees([{ name: "", email: "", idPicture: "" }]);
    setBoothSize("TWO_BY_TWO");
    setSelectedBazaar(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <DataTable
        table={table}
        renderSubComponent={(row) => (
          <BazaarExpandedRow bazaar={row.original} />
        )}
      >
        {/* Toggle Buttons */}
        <div className="flex items-center gap-2 p-1">
          <Button
            variant={!enableAdvancedFilter ? "default" : "outline"}
            size="sm"
            onClick={() => setEnableAdvancedFilter(false)}
            className="gap-2"
          >
            <Search className="h-4 w-4" />
            Simple filters
          </Button>

          <Button
            variant={enableAdvancedFilter ? "default" : "outline"}
            size="sm"
            onClick={() => setEnableAdvancedFilter(true)}
            className="gap-2"
          >
            <ListFilter className="h-4 w-4" />
            Advanced filters
          </Button>
        </div>

        {/* Conditional Toolbar */}
        {enableAdvancedFilter ? (
          <DataTableAdvancedToolbar table={table}>
            <DataTableSortList table={table} align="start" />
            <DataTableFilterList
              table={table}
              shallow={shallow}
              debounceMs={debounceMs}
              throttleMs={throttleMs}
              align="start"
            />
          </DataTableAdvancedToolbar>
        ) : (
          <DataTableToolbar
            table={table}
            showGlobalSearch={true}
            globalSearchValue={deferredSearch}
            onGlobalSearchChange={(value) => setSearch(value || null)}
            globalSearchPlaceholder="Search bazaars by name, location..."
            isSearching={isPending || isLoading}
          />
        )}
      </DataTable>

      {/* Application Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5" />
              Apply to {selectedBazaar?.name}
            </DialogTitle>
            <DialogDescription>
              Fill in the details below to apply for participation. Maximum 5
              attendees allowed.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Booth Size Selection */}
            <div className="space-y-2">
              <Label htmlFor="boothSize">Booth Size *</Label>
              <Select
                value={boothSize}
                onValueChange={(value: "TWO_BY_TWO" | "FOUR_BY_FOUR") =>
                  setBoothSize(value)
                }
              >
                <SelectTrigger id="boothSize">
                  <SelectValue placeholder="Select booth size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TWO_BY_TWO">2×2 Small Booth</SelectItem>
                  <SelectItem value="FOUR_BY_FOUR">4×4 Large Booth</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Attendees */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Attendees ({attendees.length}/5) *</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddAttendee}
                  disabled={attendees.length >= 5}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Attendee
                </Button>
              </div>

              {attendees.map((attendee, index) => (
                <Card key={index}>
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-4">
                      <div className="flex-1 grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor={`name-${index}`}>Name</Label>
                          <Input
                            id={`name-${index}`}
                            placeholder="Full name"
                            value={attendee.name}
                            onChange={(e) =>
                              handleUpdateAttendee(
                                index,
                                "name",
                                e.target.value
                              )
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`email-${index}`}>Email</Label>
                          <Input
                            id={`email-${index}`}
                            type="email"
                            placeholder="email@example.com"
                            value={attendee.email}
                            onChange={(e) =>
                              handleUpdateAttendee(
                                index,
                                "email",
                                e.target.value
                              )
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`email-${index}`}>ID/Passport</Label>
                          <ImageUpload
                            onChange={(e) =>
                              handleUpdateAttendee(index, "idPicture", e)
                            }
                          />
                        </div>
                      </div>
                      {attendees.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveAttendee(index)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDialog(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={applyMutation.isPending}>
              {applyMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <ShoppingBag className="mr-2 h-4 w-4" />
                  Submit Application
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
