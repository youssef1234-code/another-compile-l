/**
 * Edit Workshop Page
 * 
 * Requirement #36: Professors can edit any workshop details
 * Route: /workshops/edit/:id
 */

import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { GraduationCap, Loader2 } from 'lucide-react';
import { z } from 'zod';
import { trpc } from '@/lib/trpc';
import { ROUTES } from '@/lib/constants';
import { GenericForm, type FormFieldConfig } from '@/components/generic/GenericForm';
import { PageHeader } from '@/components/generic';
import { DateTimePicker } from '@/components/ui/date-time-picker';

const workshopSchema = z.object({
  images: z.array(z.string()).optional(),
  name: z.string().min(5, 'Name must be at least 5 characters').max(100),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  locationDetails: z.string().min(5, 'Location details required'),
  location: z.enum(['ON_CAMPUS', 'OFF_CAMPUS']),
  startDate: z.date({ required_error: 'Start date is required' }),
  endDate: z.date().optional(),
  registrationDeadline: z.date().optional(),
  faculty: z.string().min(1, 'Faculty is required'),
  professorName: z.string().optional(),
  capacity: z.number().min(1, 'Capacity must be at least 1'),
  price: z.number().min(0, 'Price cannot be negative').default(0),
  fullAgenda: z.string().optional(),
  requiredBudget: z.number().min(0).optional(),
  fundingSource: z.string().optional(),
  extraResources: z.string().optional(),
});

type WorkshopFormData = z.infer<typeof workshopSchema>;

export function EditWorkshopPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [initialValues, setInitialValues] = useState<Partial<WorkshopFormData> | null>(null);

  // Fetch existing workshop data
  const { data: event, isLoading: isFetching } = trpc.events.getEventById.useQuery(
    { id: id! },
    { enabled: !!id }
  );

  const updateMutation = trpc.events.update.useMutation({
    onSuccess: () => {
      toast.success('Workshop updated successfully!');
      navigate(ROUTES.MY_WORKSHOPS);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update workshop');
    },
  });

  // Pre-populate form when data loads
  useEffect(() => {
    if (event && event.type === 'WORKSHOP') {
      setInitialValues({
        images: event.images || [],
        name: event.name,
        description: event.description,
        locationDetails: event.locationDetails || '',
        location: event.location as 'ON_CAMPUS' | 'OFF_CAMPUS',
        startDate: event.startDate ? new Date(event.startDate) : undefined,
        endDate: event.endDate ? new Date(event.endDate) : undefined,
        registrationDeadline: event.registrationDeadline ? new Date(event.registrationDeadline) : undefined,
        faculty: event.faculty || '',
        professorName: event.professorName || '',
        capacity: event.capacity || 50,
        price: event.price || 0,
        fullAgenda: event.fullAgenda || '',
        requiredBudget: event.requiredBudget || 0,
        fundingSource: event.fundingSource || '',
        extraResources: event.extraResources || '',
      });
    }
  }, [event]);

  const handleSubmit = async (data: WorkshopFormData) => {
    if (!id) return;
    
    console.log('📤 Submitting workshop update:', { id, images: data.images, allData: data });
    
    await updateMutation.mutateAsync({
      id,
      data: {
        ...data,
        type: 'WORKSHOP',
      },
    });
  };

  const fields: FormFieldConfig[] = [
    {
      name: 'images',
      label: 'Workshop Images',
      type: 'imageGallery',
      description: 'Upload multiple images for the workshop. First image will be the primary.',
      colSpan: 2,
    },
    {
      name: 'name',
      label: 'Workshop Name',
      type: 'text',
      placeholder: 'e.g., Introduction to Machine Learning',
      colSpan: 2,
      icon: <GraduationCap className="h-4 w-4" />,
    },
    {
      name: 'description',
      label: 'Description',
      type: 'textarea',
      placeholder: 'Describe the workshop objectives and content',
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
      placeholder: 'Building, room number, or meeting point',
    },
    {
      name: 'faculty',
      label: 'Faculty',
      type: 'select',
      options: [
        { value: 'MET', label: 'Media Engineering and Technology' },
        { value: 'IET', label: 'Information Engineering and Technology' },
        { value: 'ARTS', label: 'Arts and Design' },
        { value: 'LAW', label: 'Law' },
        { value: 'PHARMACY', label: 'Pharmacy' },
        { value: 'BUSINESS', label: 'Business Administration' },
        { value: 'BIOTECHNOLOGY', label: 'Biotechnology' },
      ],
    },
    {
      name: 'professorName',
      label: 'Lead Professor',
      type: 'text',
      placeholder: 'Professor name(s)',
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
          placeholder="Optional deadline"
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
    },
    {
      name: 'fullAgenda',
      label: 'Full Agenda',
      type: 'textarea',
      placeholder: 'Detailed schedule and topics covered',
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

  if (event && event.type !== 'WORKSHOP') {
    toast.error('Invalid event type');
    navigate(-1);
    return null;
  }

  return (
    <div className="container max-w-full px-6 py-6">
      <PageHeader
        title="Edit Workshop"
        description="Update your workshop details. Changes will be visible after Events Office review."
      />

      <div className="mt-8 max-w-6xl mx-auto">
        <GenericForm
          fields={fields}
          schema={workshopSchema}
          onSubmit={handleSubmit}
          defaultValues={initialValues}
          isLoading={updateMutation.isPending}
          submitButtonText="Save Changes"
          submitButtonIcon={<GraduationCap className="h-4 w-4" />}
          columns={2}
          animate
          cardBorder
          cardShadow
        />
      </div>
    </div>
  );
}
