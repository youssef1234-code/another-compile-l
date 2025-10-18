import { GenericForm } from "@/components/generic/GenericForm";
import { trpc } from "@/lib/trpc";
import { useAuthStore } from "@/store/authStore";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/lib/constants";
import type { FieldType } from "@/components/generic/GenericForm";
import { z } from "zod";
import { toast } from "react-hot-toast";
import { EnhancedAlertDialog } from "@/components/generic/AlertDialog";
import { useState, useEffect } from "react";
import { usePageMeta } from '@/components/layout/AppLayout';

const fields = [
  { name: "name", label: "Bazaar Name", type: "text" as FieldType, required: true },
  { name: "description", label: "Description", type: "textarea" as FieldType, required: true },
  {
    name: "location",
    label: "Location",
    type: "select" as FieldType,
    required: true,
    options: [
      { label: "On Campus", value: "ON_CAMPUS" },
      { label: "Off Campus", value: "OFF_CAMPUS" }
    ]
  },
  { name: "locationDetails", label: "Location Details", type: "text" as FieldType, required: true },
  { name: "startDate", label: "Start Date", type: "date" as FieldType, required: true },
  { name: "startTime", label: "Start Time", type: "time" as FieldType, required: true, placeholder: "HH:MM" },
  { name: "endDate", label: "End Date", type: "date" as FieldType, required: true },
  { name: "endTime", label: "End Time", type: "time" as FieldType, required: true, placeholder: "HH:MM" },
  { name: "capacity", label: "Capacity", type: "number" as FieldType, required: true },
  { name: "registrationDeadline", label: "Registration Deadline", type: "date" as FieldType, required: true },
  { name: "registrationDeadlineTime", label: "Registration Deadline Time", type: "time" as FieldType, required: true, placeholder: "HH:MM" },
  { name: "professorName", label: "Professor Name (optional)", type: "text" as FieldType, required: false },
];

const schema = z.object({
  name: z.string().min(1, "Bazaar Name is required"),
  description: z.string().min(1, "Description is required"),
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

export function CreateBazaarPage() {
  const { setPageMeta } = usePageMeta();
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
      title: 'Create Bazaar',
      description: 'Create a new bazaar event',
    });
  }, [setPageMeta]);

  const createBazaar = trpc.events.create.useMutation({
    onSuccess: (data) => {
      // Invalidate events cache to show the new bazaar
      utils.events.getEvents.invalidate();
      
      // Show success message
      toast.success("Bazaar created successfully!");
      
      // Navigate to the new event's details page
      if (data && typeof data === 'object' && 'id' in data) {
        navigate(`${ROUTES.EVENTS}/${data.id}`);
      } else {
        // Fallback navigation
        navigate(ROUTES.EVENTS);
      }
    },
    onError: (error, variables) => {
      // Map backend error messages to user-friendly explanations
      let userMessage = "An unexpected error occurred while creating the bazaar.";
      // Extract dates from variables for more helpful messages
      const startDate = variables?.startDate ? new Date(variables.startDate).toLocaleString() : undefined;
      const endDate = variables?.endDate ? new Date(variables.endDate).toLocaleString() : undefined;
      const regDeadline = variables?.registrationDeadline ? new Date(variables.registrationDeadline).toLocaleString() : undefined;
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
        title: "Failed to Create Bazaar",
        message: userMessage,
        details: undefined
      });
    }
  });

  // Only allow Events Office role
  if (!user || user.role !== "EVENT_OFFICE") {
    return <div>Access denied. Only Events Office can create bazaars.</div>;
  }

  const handleSubmit = async (values: Record<string, any>) => {
    console.log("Submit pressed");
    await createBazaar.mutateAsync({
      type: "BAZAAR",
      name: values.name,
      description: values.description,
      location: values.location,
      locationDetails: values.locationDetails || values.location,
      startDate: new Date(`${values.startDate}T${values.startTime}`),
      endDate: new Date(`${values.endDate}T${values.endTime}`),
      capacity: values.capacity ? Number(values.capacity) : 0,
      registrationDeadline: new Date(`${values.registrationDeadline}T${values.registrationDeadlineTime}`),
      professorName: values.professorName, 
    });
    // Navigation is now handled in the onSuccess callback
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <GenericForm
        fields={fields}
        schema={schema}
        onSubmit={handleSubmit}
        isLoading={createBazaar.status === "pending"}
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
