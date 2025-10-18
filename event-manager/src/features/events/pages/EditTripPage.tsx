/**
 * Edit Trip Page
 * 
 * Requirement #34: Events Office can edit trip details (only if start date hasn't passed)
 * Route: /trips/edit/:id
 */

import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Plane, Loader2 } from 'lucide-react';
import { z } from 'zod';
import { trpc } from '@/lib/trpc';
import { ROUTES } from '@/lib/constants';
import { GenericForm, type FormFieldConfig } from '@/components/generic/GenericForm';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { usePageMeta } from '@/components/layout/AppLayout';

const tripSchema = z.object({
  images: z.array(z.string()).optional(),
  name: z.string().min(5, 'Name must be at least 5 characters').max(100),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  locationDetails: z.string().min(5, 'Meeting point required'),
  location: z.enum(['ON_CAMPUS', 'OFF_CAMPUS']),
  startDate: z.date({ required_error: 'Start date is required' }),
  endDate: z.date().optional(),
  registrationDeadline: z.date().optional(),
  capacity: z.number().min(1, 'Capacity must be at least 1'),
  price: z.number().min(0, 'Price cannot be negative'),
  requirements: z.string().optional(),
});

type TripFormData = z.infer<typeof tripSchema>;

export function EditTripPage() {
  const { setPageMeta } = usePageMeta();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [initialValues, setInitialValues] = useState<Partial<TripFormData> | null>(null);

  useEffect(() => {
    setPageMeta({
      title: 'Edit Trip',
      description: 'Update trip event details',
    });
  }, [setPageMeta]);

  // Fetch existing trip data
  const { data: event, isLoading: isFetching } = trpc.events.getEventById.useQuery(
    { id: id! },
    { enabled: !!id }
  );

  const updateMutation = trpc.events.update.useMutation({
    onSuccess: () => {
      toast.success('Trip updated successfully!');
      navigate(ROUTES.ADMIN_EVENTS);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update trip');
    },
  });

  // Pre-populate form when data loads
  useEffect(() => {
    if (event && event.type === 'TRIP') {
      // Requirement #34: Only if trip start date hasn't passed yet
      if (event.startDate && new Date(event.startDate) < new Date()) {
        toast.error('Cannot edit trip - start date has already passed (Requirement #34)');
        navigate(-1);
        return;
      }

      setInitialValues({
        images: event.images || [],
        name: event.name,
        description: event.description,
        locationDetails: event.locationDetails || '',
        location: event.location as 'ON_CAMPUS' | 'OFF_CAMPUS',
        startDate: event.startDate ? new Date(event.startDate) : undefined,
        endDate: event.endDate ? new Date(event.endDate) : undefined,
        registrationDeadline: event.registrationDeadline ? new Date(event.registrationDeadline) : undefined,
        capacity: event.capacity || 50,
        price: event.price || 0,
        requirements: event.requirements || '',
      });
    }
  }, [event, navigate]);

  const handleSubmit = async (data: TripFormData) => {
    if (!id) return;
    
    await updateMutation.mutateAsync({
      id,
      data: {
        ...data,
        type: 'TRIP',
      },
    });
  };

  const fields: FormFieldConfig[] = [
    {
      name: 'images',
      label: 'Trip Images',
      type: 'imageGallery',
      description: 'Upload multiple images for the trip. First image will be the primary.',
      colSpan: 2,
    },
    {
      name: 'name',
      label: 'Trip Name',
      type: 'text',
      placeholder: 'e.g., Alexandria Weekend Trip',
      colSpan: 2,
      icon: <Plane className="h-4 w-4" />,
    },
    {
      name: 'description',
      label: 'Short Description',
      type: 'textarea',
      placeholder: 'Describe the trip itinerary and highlights',
      colSpan: 2,
    },
    {
      name: 'location',
      label: 'Location Type',
      type: 'select',
      options: [
        { value: 'ON_CAMPUS', label: 'On Campus (Meeting Point)' },
        { value: 'OFF_CAMPUS', label: 'Off Campus' },
      ],
    },
    {
      name: 'locationDetails',
      label: 'Location / Meeting Point',
      type: 'text',
      placeholder: 'Destination or meeting point',
    },
    {
      name: 'startDate',
      label: 'Start Date & Time',
      type: 'custom',
      colSpan: 1,
      render: (value, form) => (
        <DateTimePicker
          value={value}
          onChange={(date) => form.setValue('startDate', date)}
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
          value={value}
          onChange={(date) => form.setValue('endDate', date)}
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
          value={value}
          onChange={(date) => form.setValue('registrationDeadline', date)}
          placeholder="Registration deadline"
          minDate={new Date()}
        />
      ),
    },
    {
      name: 'capacity',
      label: 'Capacity',
      type: 'number',
      placeholder: '50',
      min: 1,
      colSpan: 1,
    },
    {
      name: 'price',
      label: 'Price (EGP)',
      type: 'number',
      placeholder: '0',
      min: 0,
      step: 0.01,
      colSpan: 2,
    },
    {
      name: 'requirements',
      label: 'Requirements',
      type: 'textarea',
      placeholder: 'Prerequisites, required documents, or participant eligibility',
      colSpan: 2,
    },
    {
      name: 'imageUrl',
      label: 'Trip Image URL',
      type: 'text',
      placeholder: 'https://example.com/trip-image.jpg',
      colSpan: 2,
    },
  ];

  if (isFetching || !initialValues) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (event && event.type !== 'TRIP') {
    toast.error('Invalid event type');
    navigate(-1);
    return null;
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="bg-card rounded-lg border shadow-sm">
        <GenericForm
          fields={fields}
          schema={tripSchema}
          onSubmit={handleSubmit}
          defaultValues={initialValues}
          isLoading={updateMutation.isPending}
          submitButtonText="Save Changes"
          submitButtonIcon={<Plane className="h-4 w-4" />}
          columns={2}
          animate
          cardBorder
          cardShadow
        />
      </div>
    </div>
  );
}
