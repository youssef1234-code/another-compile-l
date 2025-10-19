import { GenericForm } from "@/components/generic/GenericForm";
import type { FormFieldConfig } from "@/components/generic/GenericForm";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { usePageMeta } from '@/components/layout/page-meta-context';
import { ROUTES } from "@/lib/constants";
import { formatValidationErrors } from '@/lib/format-errors';
import { trpc } from "@/lib/trpc";
import { useAuthStore } from "@/store/authStore";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import { z } from "zod";

const schema = z.object({
  images: z.array(z.string()).optional(),
  name: z.string().min(5, 'Bazaar name must be at least 5 characters'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  locationDetails: z.string().min(1, 'Location details are required'),
  location: z.enum(['ON_CAMPUS', 'OFF_CAMPUS']),
  startDate: z.date({ required_error: 'Start date is required' }),
  endDate: z.date({ required_error: 'End date is required' }),
  registrationDeadline: z.date({ required_error: 'Registration deadline is required' }),
});

type BazaarFormValues = z.infer<typeof schema>;

const makeFields = (): FormFieldConfig<BazaarFormValues>[] => [
  {
    name: 'images',
    label: 'Bazaar Images',
    type: 'imageGallery',
    description: 'Upload images for the bazaar. The first image will be the primary image.',
    colSpan: 2,
  },
  { name: 'name', label: 'Bazaar Name', type: 'text', placeholder: 'e.g., Spring Campus Bazaar', colSpan: 2 },
  { name: 'description', label: 'Description', type: 'textarea', placeholder: 'Describe the bazaar theme and highlights', colSpan: 2 },
  {
    name: 'location',
    label: 'Location Type',
    type: 'select',
    options: [
      { value: 'ON_CAMPUS', label: 'On Campus' },
      { value: 'OFF_CAMPUS', label: 'Off Campus' },
    ],
  },
  { name: 'locationDetails', label: 'Location Details', type: 'text', placeholder: 'Building, hall, or venue name' },
  {
    name: 'datesSectionHeader',
    label: 'Schedule',
    type: 'custom',
    colSpan: 2,
    render: () => (
      <div className="pt-2 pb-1">
        <h3 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">Dates & Deadlines</h3>
      </div>
    ),
  },
  {
    name: 'startDate',
    label: 'Start Date & Time',
    type: 'custom',
    colSpan: 1,
    render: (value, form) => (
      <DateTimePicker
        value={(value as Date | null) ?? null}
        onChange={(date) => date && form.setValue('startDate', date)}
        placeholder="Select start date and time"
        minDate={new Date()}
      />
    ),
  },
  {
    name: 'endDate',
    label: 'End Date & Time',
    type: 'custom',
    colSpan: 1,
    render: (value, form) => (
      <DateTimePicker
        value={(value as Date | null) ?? null}
        onChange={(date) => form.setValue('endDate', date ?? undefined as unknown as Date)}
        placeholder="Select end date and time"
        minDate={new Date()}
      />
    ),
  },
  {
    name: 'registrationDeadline',
    label: 'Registration Deadline',
    type: 'custom',
    colSpan: 1,
    render: (value, form) => (
      <DateTimePicker
        value={(value as Date | null) ?? null}
        onChange={(date) => form.setValue('registrationDeadline', date ?? undefined as unknown as Date)}
        placeholder="Select registration deadline"
        minDate={new Date()}
      />
    ),
  },
];

export function EditBazaarPage() {
  const { setPageMeta } = usePageMeta();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const utils = trpc.useUtils();

  useEffect(() => {
    setPageMeta({
      title: 'Edit Bazaar',
      description: 'Update bazaar event details',
    });
  }, [setPageMeta]);

  const updateBazaar = trpc.events.update.useMutation({
    onSuccess: () => {
      // Keep Manage Events data fresh in case of redirect/navigation
      utils.events.getAllEvents.invalidate();
      utils.events.getEventStats.invalidate();
      utils.events.getEventById.invalidate({ id: id! });
      toast.success('Bazaar updated successfully!');
      navigate(`${ROUTES.EVENTS}/${id}`);
    },
    onError: (error) => {
      const errorMessage = formatValidationErrors(error);
      toast.error(errorMessage, { style: { whiteSpace: 'pre-line' } });
    },
  });
  const { data: bazaar, isLoading: isLoadingBazaar } = trpc.events.getEventById.useQuery(
    { id: id! },
    {
      enabled: !!id,
      staleTime: 0,
      refetchOnMount: 'always',
      refetchOnReconnect: 'always',
      refetchOnWindowFocus: 'always',
    }
  );

  const [defaultValues, setDefaultValues] = useState<Partial<BazaarFormValues> | null>(null);
  const [isDisabled, setIsDisabled] = useState(false);
  const isUnauthorized = !user || user.role !== "EVENT_OFFICE";

  useEffect(() => {
    if (bazaar && bazaar.type === 'BAZAAR') {
      const hasStarted = bazaar.startDate ? new Date(bazaar.startDate) <= new Date() : false;
      setIsDisabled(hasStarted);

      setDefaultValues({
        images: bazaar.images || [],
        name: bazaar.name || '',
        description: bazaar.description || '',
        location: (bazaar.location as 'ON_CAMPUS' | 'OFF_CAMPUS') || 'ON_CAMPUS',
        locationDetails: bazaar.locationDetails || '',
        startDate: bazaar.startDate ? new Date(bazaar.startDate) : undefined as unknown as Date,
        endDate: bazaar.endDate ? new Date(bazaar.endDate) : undefined as unknown as Date,
        registrationDeadline: bazaar.registrationDeadline ? new Date(bazaar.registrationDeadline) : undefined as unknown as Date,
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
    await updateBazaar.mutateAsync({
      id: id!,
      data: {
        type: 'BAZAAR',
        images: values.images,
        name: values.name,
        description: values.description,
        location: values.location,
        locationDetails: values.locationDetails,
        startDate: values.startDate,
        endDate: values.endDate,
        registrationDeadline: values.registrationDeadline,
      },
    });
  };

  if (isLoadingBazaar || !defaultValues) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {isDisabled && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800">
          <p className="font-medium">Editing Disabled</p>
          <p className="text-sm">This bazaar has already started and cannot be edited.</p>
        </div>
      )}
      <div className="bg-card rounded-lg border shadow-sm">
        <GenericForm<BazaarFormValues>
          key={bazaar.id}
          fields={makeFields().map((f) => ({ ...f, disabled: isDisabled }))}
          schema={schema}
          onSubmit={isDisabled ? () => {} : handleSubmit}
          isLoading={updateBazaar.isPending || isDisabled}
          defaultValues={defaultValues}
          submitButtonText={isDisabled ? 'Cannot Edit (Event Started)' : 'Save Changes'}
          columns={2}
          animate
          cardBorder
          cardShadow
        />
      </div>
    </div>
  );
}