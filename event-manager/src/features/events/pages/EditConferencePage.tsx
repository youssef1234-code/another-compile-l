/**
 * Edit Conference Page
 * 
 * Requirement #46: Events Office can edit conference details
 * Route: /conferences/edit/:id
 */

import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Users, Loader2 } from 'lucide-react';
import { z } from 'zod';
import { trpc } from '@/lib/trpc';
import { ROUTES } from '@/lib/constants';
import { GenericForm, type FormFieldConfig } from '@/components/generic/GenericForm';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { usePageMeta } from '@/components/layout/page-meta-context';
import { formatValidationErrors } from '@/lib/format-errors';

const conferenceSchema = z.object({
  images: z.array(z.string()).optional(),
  name: z.string().min(5, 'Name must be at least 5 characters').max(100),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  locationDetails: z.string().min(5, 'Location details required'),
  location: z.enum(['ON_CAMPUS', 'OFF_CAMPUS']),
  startDate: z.date({ required_error: 'Start date is required' }),
  endDate: z.date().optional(),
  registrationDeadline: z.date().optional(),
  capacity: z.number().min(1, 'Capacity must be at least 1'),
  price: z.number().min(0, 'Price cannot be negative').default(0),
  conferenceWebsite: z.string().url().optional().or(z.literal('')),
  fullAgenda: z.string().optional(),
  requiredBudget: z.number().min(0).optional(),
  fundingSource: z.string().optional(),
  extraResources: z.string().optional(),
});

type ConferenceFormData = z.infer<typeof conferenceSchema>;

export function EditConferencePage() {
  const { setPageMeta } = usePageMeta();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [initialValues, setInitialValues] = useState<Partial<ConferenceFormData> | null>(null);

  useEffect(() => {
    setPageMeta({
      title: 'Edit Conference',
      description: 'Update conference event details',
    });
  }, [setPageMeta]);

  // Fetch existing conference data
  const { data: event, isLoading: isFetching} = trpc.events.getEventById.useQuery(
    { id: id! },
    { enabled: !!id }
  );

  const updateMutation = trpc.events.update.useMutation({
    onSuccess: () => {
      toast.success('Conference updated successfully!');
      navigate(ROUTES.ADMIN_EVENTS);
    },
    onError: (error) => {
      const errorMessage = formatValidationErrors(error);
      toast.error(errorMessage, { style: { whiteSpace: 'pre-line' } });
    },
  });

  // Pre-populate form when data loads
  useEffect(() => {
    if (event && event.type === 'CONFERENCE') {
      setInitialValues({
        images: event.images || [],
        name: event.name,
        description: event.description,
        locationDetails: event.locationDetails || '',
        location: event.location as 'ON_CAMPUS' | 'OFF_CAMPUS',
        startDate: event.startDate ? new Date(event.startDate) : undefined,
        endDate: event.endDate ? new Date(event.endDate) : undefined,
        registrationDeadline: event.registrationDeadline ? new Date(event.registrationDeadline) : undefined,
        capacity: event.capacity || 100,
        price: event.price || 0,
        conferenceWebsite: event.conferenceWebsite || '',
        fullAgenda: event.fullAgenda || '',
        requiredBudget: event.requiredBudget || 0,
        fundingSource: event.fundingSource || '',
        extraResources: event.extraResources || '',
      });
    }
  }, [event]);

  const handleSubmit = async (data: ConferenceFormData) => {
    if (!id) return;
    
    await updateMutation.mutateAsync({
      id,
      data: {
        ...data,
        type: 'CONFERENCE',
      },
    });
  };

  const fields: FormFieldConfig<ConferenceFormData>[] = [
    {
      name: 'images',
      label: 'Conference Images',
      type: 'imageGallery',
      description: 'Upload multiple images for the conference. First image will be the primary.',
      colSpan: 2,
    },
    {
      name: 'name',
      label: 'Conference Name',
      type: 'text',
      placeholder: 'e.g., Annual AI & Technology Summit 2025',
      colSpan: 2,
      icon: <Users className="h-4 w-4" />,
    },
    {
      name: 'description',
      label: 'Short Description',
      type: 'textarea',
      placeholder: 'Brief overview of the conference theme and objectives',
      colSpan: 2,
    },
    {
      name: 'conferenceWebsite',
      label: 'Conference Website',
      type: 'text',
      placeholder: 'https://conference.example.com',
      description: 'Official landing page with full conference details',
      colSpan: 2,
    },
    {
      name: 'location',
      label: 'Location Type',
      type: 'select',
      options: [
        { value: 'ON_CAMPUS', label: 'On Campus' },
        { value: 'OFF_CAMPUS', label: 'Off Campus' },
      ],
    },
    {
      name: 'locationDetails',
      label: 'Venue Details',
      type: 'text',
      placeholder: 'Conference hall, building, or venue name',
    },
    {
      name: 'startDate',
      label: 'Start Date & Time',
      type: 'custom',
      colSpan: 1,
      render: (value, form) => (
        <DateTimePicker
          value={(value as Date | null) ?? null}
          onChange={(date) => {
            if (date) {
              form.setValue('startDate', date);
            }
          }}
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
          onChange={(date) => form.setValue('endDate', date ?? undefined)}
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
          onChange={(date) => form.setValue('registrationDeadline', date ?? undefined)}
          placeholder="Registration deadline"
          minDate={new Date()}
        />
      ),
    },
    {
      name: 'capacity',
      label: 'Capacity',
      type: 'number',
      placeholder: '100',
      min: 1,
      colSpan: 1,
    },
    {
      name: 'price',
      label: 'Registration Fee (EGP)',
      type: 'number',
      placeholder: '0',
      min: 0,
      step: 0.01,
      colSpan: 2,
    },
    {
      name: 'fullAgenda',
      label: 'Full Agenda',
      type: 'textarea',
      placeholder: 'Detailed schedule: keynote speakers, sessions, workshops, and time slots',
      colSpan: 2,
    },
    {
      name: 'requiredBudget',
      label: 'Required Budget (EGP)',
      type: 'number',
      placeholder: '0',
      min: 0,
    },
    {
      name: 'fundingSource',
      label: 'Funding Source',
      type: 'select',
      options: [
        { value: 'UNIVERSITY', label: 'GUC Internal' },
        { value: 'SPONSORS', label: 'External Sponsors' },
        { value: 'STUDENT_UNION', label: 'Student Union' },
        { value: 'EXTERNAL_FUNDING', label: 'External Funding' },
        { value: 'SELF_FUNDED', label: 'Self-Funded' },
      ],
    },
    {
      name: 'extraResources',
      label: 'Extra Resources',
      type: 'textarea',
      placeholder: 'List any additional equipment, materials, or special requirements',
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

  if (event && event.type !== 'CONFERENCE') {
    toast.error('Invalid event type');
    navigate(-1);
    return null;
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="max-w-6xl">
  <GenericForm<ConferenceFormData>
          fields={fields}
          schema={conferenceSchema}
          onSubmit={handleSubmit}
          defaultValues={initialValues}
          isLoading={updateMutation.isPending}
          submitButtonText="Save Changes"
          submitButtonIcon={<Users className="h-4 w-4" />}
          columns={2}
          animate
          cardBorder
          cardShadow
        />
      </div>
    </div>
  );
}
