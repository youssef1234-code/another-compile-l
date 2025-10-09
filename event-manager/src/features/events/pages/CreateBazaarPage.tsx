
import { GenericForm } from "@/components/generic/GenericForm";
import { trpc } from "@/lib/trpc";
import { useAuthStore } from "@/store/authStore";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/lib/constants";
import type { FieldType } from "@/components/generic/GenericForm";
import { z } from "zod";
import { toast } from "sonner";

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
  professorName: z.string().optional(),
});

export function CreateBazaarPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const utils = trpc.useUtils();
  const createBazaar = trpc.events.create.useMutation({
    onSuccess: (data) => {
      // Invalidate events cache to show the new bazaar
      utils.events.getEvents.invalidate();
      utils.events.getUpcomingEvents.invalidate();
      
      // Show success message
      toast.success("Bazaar created successfully!");
      
      // Navigate to the new event's details page
      navigate(`${ROUTES.EVENTS}/${data.id}`);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create bazaar");
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
      registrationDeadline: new Date(values.registrationDeadline),
      professorName: values.professorName, 
    });
    // Navigation is now handled in the onSuccess callback
  };

  return (
    <div>
      <h1>Create Bazaar</h1>
      <GenericForm
        fields={fields}
        schema={schema}
        onSubmit={handleSubmit}
        isLoading={createBazaar.status === "pending"}
      />
    </div>
  );
}
