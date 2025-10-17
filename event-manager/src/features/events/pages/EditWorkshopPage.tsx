/**
 * Edit Workshop Page
 * 
 * Requirement #36: Professors can edit any workshop details
 * Route: /workshops/edit/:id
 */

import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { GraduationCap, Loader2, Plus, X } from 'lucide-react';
import { z } from 'zod';
import { trpc } from '@/lib/trpc';
import { ROUTES } from '@/lib/constants';
import { GenericForm, type FormFieldConfig } from '@/components/generic/GenericForm';
import { PageHeader } from '@/components/generic';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const workshopSchema = z.object({
  images: z.array(z.string()).optional(),
  name: z.string().min(5, 'Name must be at least 5 characters').max(100),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  locationDetails: z.enum(['GUC Cairo', 'GUC Berlin'], { required_error: 'Location is required' }),
  location: z.enum(['ON_CAMPUS', 'OFF_CAMPUS']),
  startDate: z.date({ required_error: 'Start date is required' }),
  endDate: z.date({ required_error: 'End date is required' }),
  registrationDeadline: z.date({ required_error: 'Registration deadline is required' }),
  faculty: z.enum(['MET', 'IET', 'ARTS', 'LAW', 'PHARMACY', 'BUSINESS', 'BIOTECHNOLOGY'], { required_error: 'Faculty is required' }),
  professors: z.array(z.string()).min(1, 'At least one professor is required'),
  capacity: z.number().min(1, 'Capacity must be at least 1'),
  fullAgenda: z.string().min(20, 'Full agenda must be at least 20 characters'),
  requiredBudget: z.number().min(0, 'Budget cannot be negative'),
  fundingSource: z.enum(['GUC', 'EXTERNAL'], { required_error: 'Funding source is required' }),
  extraResources: z.string().optional(),
  requirements: z.string().max(500).optional(),
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

  const updateMutation = trpc.events.editWorkshop.useMutation({
    onSuccess: () => {
      toast.success('Workshop updated successfully!');
      navigate(ROUTES.ADMIN_EVENTS); // Redirects to BackOfficeEventsPage (unified event management)
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update workshop');
    },
  });

  // Pre-populate form when data loads
  useEffect(() => {
    if (event && event.type === 'WORKSHOP') {
      console.log('🔍 Workshop data received:', {
        fullAgenda: event.fullAgenda,
        requiredBudget: event.requiredBudget,
        fundingSource: event.fundingSource,
        extraResources: event.extraResources,
        requirements: event.requirements,
        professors: event.professors,
        faculty: event.faculty,
        allFields: event
      });
      
      setInitialValues({
        images: event.images || [],
        name: event.name,
        description: event.description,
        locationDetails: event.locationDetails as 'GUC Cairo' | 'GUC Berlin' || 'GUC Cairo',
        location: event.location as 'ON_CAMPUS' | 'OFF_CAMPUS',
        startDate: event.startDate ? new Date(event.startDate) : undefined,
        endDate: event.endDate ? new Date(event.endDate) : undefined,
        registrationDeadline: event.registrationDeadline ? new Date(event.registrationDeadline) : undefined,
        faculty: event.faculty as any || 'MET',
        professors: event.professors || [],
        capacity: event.capacity || 50,
        fullAgenda: event.fullAgenda || '',
        requiredBudget: event.requiredBudget || 0,
        fundingSource: event.fundingSource as 'GUC' | 'EXTERNAL' || 'GUC',
        extraResources: event.extraResources || '',
        requirements: event.requirements || '',
      });
    }
  }, [event]);

  const handleSubmit = async (data: WorkshopFormData) => {
    if (!id) return;
    
    console.log('📤 Submitting workshop update:', { id, images: data.images, allData: data });
    
    await updateMutation.mutateAsync({
      id,
      ...data, // Spread all fields directly (UpdateWorkshopSchema format)
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
      name: 'locationDetails',
      label: 'Workshop Location',
      type: 'select',
      options: [
        { value: 'GUC Cairo', label: 'GUC Cairo' },
        { value: 'GUC Berlin', label: 'GUC Berlin' },
      ],
      description: 'Select the GUC campus where the workshop will be held',
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
      colSpan: 2,
    },
    {
      name: 'professors',
      label: 'Participating Professors',
      type: 'custom',
      colSpan: 2,
      render: (value, form) => {
        const professors = (value as string[]) || [''];
        
        const addProfessor = () => {
          form.setValue('professors', [...professors, '']);
        };
        
        const removeProfessor = (index: number) => {
          if (professors.length > 1) {
            form.setValue('professors', professors.filter((_, i) => i !== index));
          }
        };
        
        const updateProfessor = (index: number, value: string) => {
          const updated = [...professors];
          updated[index] = value;
          form.setValue('professors', updated);
        };
        
        return (
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-2">
              <Label>Participating Professors</Label>
              <Button type="button" variant="outline" size="sm" onClick={addProfessor}>
                <Plus className="h-4 w-4 mr-2" />
                Add Professor
              </Button>
            </div>
            <div className="space-y-2">
              {professors.map((prof: string, index: number) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={prof}
                    onChange={(e) => updateProfessor(index, e.target.value)}
                    placeholder="Professor name"
                  />
                  {professors.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => removeProfessor(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      },
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
      colSpan: 2,
      render: (value, form) => (
        <DateTimePicker
          value={value}
          onChange={(date) => form.setValue('registrationDeadline', date)}
          placeholder="Registration deadline (required)"
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
      name: 'fullAgenda',
      label: 'Full Agenda',
      type: 'textarea',
      placeholder: 'Detailed schedule and topics covered (minimum 20 characters)',
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
        { value: 'GUC', label: 'GUC Internal' },
        { value: 'EXTERNAL', label: 'External Funding' },
      ],
    },
    {
      name: 'extraResources',
      label: 'Extra Resources',
      type: 'textarea',
      placeholder: 'List any additional equipment, materials, or special requirements',
      colSpan: 2,
    },
    {
      name: 'requirements',
      label: 'Requirements',
      type: 'textarea',
      placeholder: 'Prerequisites or requirements for attendees (max 500 characters)',
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
