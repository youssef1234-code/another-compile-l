import { GenericForm } from "@/components/generic/GenericForm";
import { trpc } from "@/lib/trpc";
import { useAuthStore } from "@/store/authStore";
import { useNavigate, useParams } from "react-router-dom";
import { ROUTES } from "@/lib/constants";
import type { FieldType } from "@/components/generic/GenericForm";
import { z } from "zod";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const fields = [
  { name: "title", label: "Bazaar Name", type: "text" as FieldType, required: true },
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
  { name: "startTime", label: "Start Time", type: "text" as FieldType, required: true, placeholder: "HH:MM" },
  { name: "endDate", label: "End Date", type: "date" as FieldType, required: true },
  { name: "endTime", label: "End Time", type: "text" as FieldType, required: true, placeholder: "HH:MM" },
  { name: "capacity", label: "Capacity", type: "number" as FieldType, required: true },
  { name: "registrationDeadline", label: "Registration Deadline", type: "date" as FieldType, required: true },
  { name: "professorName", label: "Professor Name (optional)", type: "text" as FieldType, required: false },
];

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
  professorName: z.string().optional(),
});

export function EditBazaarPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const utils = trpc.useUtils();
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
    onError: (error) => {
      toast.error(error.message || "Failed to update bazaar");
    }
  });
  const { data: bazaar, isLoading: isLoadingBazaar } = trpc.events.getEventById.useQuery(
    { id: id! },
    { enabled: !!id }
  );

  const [defaultValues, setDefaultValues] = useState<Record<string, any>>({});
  const [isDisabled, setIsDisabled] = useState(false);

  // Only allow Events Office role
  if (!user || user.role !== "EVENT_OFFICE") {
    return <div>Access denied. Only Events Office can edit bazaars.</div>;
  }

  // Check if bazaar exists and is a bazaar
  if (!isLoadingBazaar && (!bazaar || bazaar.type !== "BAZAAR")) {
    return <div>Bazaar not found.</div>;
  }

  useEffect(() => {
    if (bazaar) {
      console.log("Bazaar data received:", bazaar);
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
        professorName: bazaar.professorName || "",
      });
    }
  }, [bazaar]);

  const handleSubmit = async (values: Record<string, any>) => {
    console.log("Edit submit pressed");
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
        capacity: values.capacity ? Number(values.capacity) : 0,
        registrationDeadline: new Date(values.registrationDeadline),
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
    <div>
      <h1>Edit Bazaar</h1>
      {isDisabled && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800">
          <p className="font-medium">Editing Disabled</p>
          <p className="text-sm">This bazaar has already started and cannot be edited.</p>
        </div>
      )}
      <GenericForm
        key={bazaar.id} // Force form re-render when bazaar changes
        fields={fields.map(field => ({ ...field, disabled: isDisabled }))}
        schema={schema}
        onSubmit={isDisabled ? () => {} : handleSubmit}
        isLoading={updateBazaar.status === "pending" || isDisabled}
        defaultValues={defaultValues}
        submitButtonText={isDisabled ? "Cannot Edit (Event Started)" : "Update Bazaar"}
      />
    </div>
  );
}