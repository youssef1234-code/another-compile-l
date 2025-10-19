import { GenericForm } from "@/components/generic/GenericForm";
import { trpc } from "@/lib/trpc";
import { useAuthStore } from "@/store/authStore";
import { useNavigate, useParams } from "react-router-dom";
import { ROUTES } from "@/lib/constants";
import type { FormFieldConfig } from "@/components/generic/GenericForm";
import { z } from "zod";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { EnhancedAlertDialog } from "@/components/generic/AlertDialog";
import { usePageMeta } from '@/components/layout/page-meta-context';

const schema = z.object({
  title: z.string().min(5, "Bazaar Name must be at least 5 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  location: z.enum(["ON_CAMPUS", "OFF_CAMPUS"]),
  locationDetails: z.string().min(1, "Location Details are required"),
  startDate: z.string().min(1, "Start Date is required"),
  startTime: z.string().min(1, "Start Time is required"),
  endDate: z.string().min(1, "End Date is required"),
  endTime: z.string().min(1, "End Time is required"),
  capacity: z.preprocess(val => Number(val), z.number().min(1, "Capacity is required")),
  registrationDeadline: z.string().min(1, "Registration Deadline is required"),
  registrationDeadlineTime: z.string().min(1, "Registration Deadline Time is required"),
  professorName: z.string().optional(),
});

type BazaarFormValues = z.infer<typeof schema>;

const fields: FormFieldConfig<BazaarFormValues>[] = [
  { name: "title", label: "Bazaar Name", type: "text", required: true },
  { name: "description", label: "Description", type: "textarea", required: true },
  {
    name: "location",
    label: "Location",
    type: "select",
    required: true,
    options: [
      { label: "On Campus", value: "ON_CAMPUS" },
      { label: "Off Campus", value: "OFF_CAMPUS" }
    ]
  },
  { name: "locationDetails", label: "Location Details", type: "text", required: true },
  { name: "startDate", label: "Start Date", type: "date", required: true },
  { name: "startTime", label: "Start Time", type: "time", required: true, placeholder: "HH:MM" },
  { name: "endDate", label: "End Date", type: "date", required: true },
  { name: "endTime", label: "End Time", type: "time", required: true, placeholder: "HH:MM" },
  { name: "capacity", label: "Capacity", type: "number", required: true },
  { name: "registrationDeadline", label: "Registration Deadline", type: "date", required: true },
  { name: "registrationDeadlineTime", label: "Registration Deadline Time", type: "time", required: true, placeholder: "HH:MM" },
  { name: "professorName", label: "Professor Name (optional)", type: "text", required: false },
];

export function EditBazaarPage() {
  const { setPageMeta } = usePageMeta();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const utils = trpc.useUtils();
  const [errorDialog, setErrorDialog] = useState<{ open: boolean; title: string; message: string; details?: string }>({
    open: false,
    title: "",
    message: "",
    details: undefined
  });

  useEffect(() => {
    setPageMeta({
      title: 'Edit Bazaar',
      description: 'Update bazaar event details',
    });
  }, [setPageMeta]);

  const updateBazaar = trpc.events.update.useMutation({
    onSuccess: () => {
      // Invalidate all relevant caches after successful update
      utils.events.getEvents.invalidate();
      utils.events.getEventById.invalidate({ id: id! });
      
      // Show success message
      toast.success("Bazaar updated successfully!");
      
      // Navigate to the event details page to see the updated event
      navigate(`${ROUTES.EVENTS}/${id}`);
    },
    onError: (error, variables) => {
      // Map backend error messages to user-friendly explanations
      let userMessage = "An unexpected error occurred while updating the bazaar.";
      // Extract dates from variables for more helpful messages
      const startDate = variables?.data?.startDate ? new Date(variables.data.startDate).toLocaleString() : undefined;
      const endDate = variables?.data?.endDate ? new Date(variables.data.endDate).toLocaleString() : undefined;
      const regDeadline = variables?.data?.registrationDeadline ? new Date(variables.data.registrationDeadline).toLocaleString() : undefined;
      if (error.message?.includes("Start date must be before end date")) {
        userMessage = `The event's start date (${startDate}) must be earlier than its end date (${endDate}). Please check both dates and make sure the start date is before the end date.`;
      } else if (error.message?.includes("Registration deadline must be before start date")) {
        userMessage = `The registration deadline (${regDeadline}) must be set before the event's start date (${startDate}). Please choose a registration deadline that is earlier than the event start date.`;
      } else if (error.message?.includes("Capacity must be a positive number")) {
        userMessage = "The event capacity must be a positive number. Please enter a value greater than zero for capacity.";
      } else if (error.message?.includes("Only professors can create workshops")) {
        userMessage = "Only users with the professor role can create workshops. Please contact your administrator if you need access.";
      }
      setErrorDialog({
        open: true,
        title: "Failed to Update Bazaar",
        message: userMessage,
        details: undefined
      });
    }
  });
  const { data: bazaar, isLoading: isLoadingBazaar } = trpc.events.getEventById.useQuery(
    { id: id! },
    { enabled: !!id }
  );

  const [defaultValues, setDefaultValues] = useState<Partial<BazaarFormValues>>({});
  const [isDisabled, setIsDisabled] = useState(false);
  const isUnauthorized = !user || user.role !== "EVENT_OFFICE";

  useEffect(() => {
    if (bazaar) {
      // Check if bazaar has started (disable editing if started)
      const hasStarted = new Date(bazaar.startDate) <= new Date();
      setIsDisabled(hasStarted);

      // Format dates for form inputs
      const startDate = new Date(bazaar.startDate);
      const endDate = new Date(bazaar.endDate);
      const regDeadline = bazaar.registrationDeadline ? new Date(bazaar.registrationDeadline) : null;

      setDefaultValues({
        title: bazaar.name || "",
        description: bazaar.description || "",
        location: bazaar.location || "ON_CAMPUS",
        locationDetails: bazaar.locationDetails || "",
        startDate: startDate.toISOString().split('T')[0],
        startTime: startDate.toTimeString().slice(0, 5),
        endDate: endDate.toISOString().split('T')[0],
        endTime: endDate.toTimeString().slice(0, 5),
        capacity: bazaar.capacity || 0,
        registrationDeadline: regDeadline ? regDeadline.toISOString().split('T')[0] : "",
        registrationDeadlineTime: regDeadline ? regDeadline.toTimeString().slice(0, 5) : "",
        professorName: bazaar.professorName || "",
      });
    }
  }, [bazaar]);

  if (isUnauthorized) {
    return <div>Access denied. Only Events Office can edit bazaars.</div>;
  }

  // Check if bazaar exists and is a bazaar
  if (!isLoadingBazaar && (!bazaar || bazaar.type !== "BAZAAR")) {
    return <div>Bazaar not found.</div>;
  }

  const handleSubmit = async (values: BazaarFormValues) => {
    const registrationDeadline = values.registrationDeadline && values.registrationDeadlineTime
      ? new Date(`${values.registrationDeadline}T${values.registrationDeadlineTime}`)
      : undefined;

    await updateBazaar.mutateAsync({
      id: id!,
      data: {
        type: "BAZAAR",
        name: values.title,
        description: values.description,
        location: values.location,
        locationDetails: values.locationDetails,
        startDate: new Date(`${values.startDate}T${values.startTime}`),
        endDate: new Date(`${values.endDate}T${values.endTime}`),
        capacity: values.capacity,
        registrationDeadline,
        professorName: values.professorName,
      }
    });
    // Navigation is now handled in the onSuccess callback
  };

  if (isLoadingBazaar) {
    return <div>Loading bazaar...</div>;
  }

  // Don't render the form until we have the data and defaultValues are set
  if (!bazaar || Object.keys(defaultValues).length === 0) {
    return <div>Loading bazaar data...</div>;
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {isDisabled && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800">
          <p className="font-medium">Editing Disabled</p>
          <p className="text-sm">This bazaar has already started and cannot be edited.</p>
        </div>
      )}
  <GenericForm<BazaarFormValues>
        key={bazaar.id} // Force form re-render when bazaar changes
        fields={fields.map(field => ({ ...field, disabled: isDisabled }))}
        schema={schema}
        onSubmit={isDisabled ? () => {} : handleSubmit}
        isLoading={updateBazaar.status === "pending" || isDisabled}
  defaultValues={defaultValues}
        submitButtonText={isDisabled ? "Cannot Edit (Event Started)" : "Update Bazaar"}
      />

      {/* Error Alert Dialog */}
      <EnhancedAlertDialog
        open={errorDialog.open}
        onOpenChange={(open) => setErrorDialog(prev => ({ ...prev, open }))}
        variant="danger"
        title={errorDialog.title}
        description={errorDialog.message}
        details={errorDialog.details}
        confirmLabel="Try Again"
        cancelLabel="Close"
        onConfirm={() => setErrorDialog(prev => ({ ...prev, open: false }))}
      />
    </div>
  );
}