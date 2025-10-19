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
  websiteUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  fullAgenda: z.string().min(1, 'Full agenda is required'),
  requiredBudget: z.number().min(0, 'Budget cannot be negative'),
  fundingSource: z.string().min(1, 'Funding source is required'),
  extraResources: z.string().optional(),
  requirements: z.string().optional(),
});

type ConferenceFormData = z.infer<typeof conferenceSchema>;

export function EditConferencePage() {
  const { setPageMeta } = usePageMeta();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [initialValues, setInitialValues] = useState<Partial<ConferenceFormData> | null>(null);
  const utils = trpc.useUtils();

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
      // Invalidate all events queries to refresh the table
      utils.events.getEvents.invalidate();
      utils.events.getEventById.invalidate();
      utils.events.getUpcoming.invalidate();
      utils.events.search.invalidate();
      
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
      console.log('📝 Event data received:', event);
      console.log('🔗 websiteUrl from event:', event.websiteUrl);
      
      setInitialValues({
        images: event.images || [],
        name: event.name,
        description: event.description,
        locationDetails: event.locationDetails || '',
        location: event.location as 'ON_CAMPUS' | 'OFF_CAMPUS',
        startDate: event.startDate ? new Date(event.startDate) : undefined,
        endDate: event.endDate ? new Date(event.endDate) : undefined,
        registrationDeadline: event.registrationDeadline ? new Date(event.registrationDeadline) : undefined,
        websiteUrl: event.websiteUrl || '',
        fullAgenda: event.fullAgenda || '',
        requiredBudget: event.requiredBudget || 0,
        fundingSource: event.fundingSource || '',
        extraResources: event.extraResources || '',
        requirements: event.requirements || '',
      });
      
      console.log('✅ Initial values set');
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
      label: 'Description',
      type: 'textarea',
      placeholder: 'Brief overview of the conference theme and objectives',
      colSpan: 2,
    },
    {
      name: 'websiteUrl',
      label: 'Conference Website',
      type: 'text',
      placeholder: 'https://conference.example.com',
      description: 'Official landing page with full conference details',
      colSpan: 2,
    },
    {
      name: 'fullAgenda',
      label: 'Full Agenda',
      type: 'textarea',
      placeholder: 'Include keynote speakers, sessions, and time slots',
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
      label: 'Location Details',
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
      colSpan: 2,
      render: (value, form) => (
        <DateTimePicker
          value={(value as Date | null) ?? null}
          onChange={(date) => form.setValue('registrationDeadline', date ?? undefined)}
          placeholder="Optional registration deadline"
          minDate={new Date()}
        />
      ),
    },
    {
      name: 'requiredBudget',
      label: 'Required Budget (EGP)',
      type: 'number',
      placeholder: '0',
      min: 0,
      step: 0.01,
    },
    {
      name: 'fundingSource',
      label: 'Funding Source',
      type: 'select',
      options: [
        { value: 'GUC', label: 'GUC' },
        { value: 'EXTERNAL', label: 'External' },
      ],
    },
    {
      name: 'extraResources',
      label: 'Extra Resources',
      type: 'textarea',
      placeholder: 'List equipment, materials, or special requirements',
      colSpan: 2,
    },
    {
      name: 'requirements',
      label: 'Participant Requirements',
      type: 'textarea',
      placeholder: 'Prerequisites, required equipment, or eligibility',
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
    <div className="flex flex-col gap-6 p-6 w-full">
      <div className="w-full">
        <GenericForm<ConferenceFormData>
          key={id} // Force re-mount when event ID changes
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
