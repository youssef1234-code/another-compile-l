/**
 * Create Event Sheet
 * 
 * Multi-step form sheet for creating events.
 * Step 1: Choose event type (based on user role)
 * Step 2: Fill event details (fields vary by type)
 */

/**
 * Create Event Sheet
 *
 * Multi-step onboarding flow for creating events directly from the admin/events page.
 * Step 1: Select event type based on the current user's role
 * Step 2: Fill in event details with type-specific fields and richer date/time pickers
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { trpc } from '@/lib/trpc';
import { toast } from 'react-hot-toast';
import { formatValidationErrors } from '@/lib/format-errors';
import {
  FormSheet,
  FormSheetContent,
  FormSheetField,
  FormSheetFooter,
  FormSheetSection,
} from '@/components/generic/FormSheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ImageGallery } from '@/components/ui/image-gallery';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import {
  ArrowLeft,
  GraduationCap,
  Loader2,
  Plane,
  RotateCcw,
  Save,
  Store,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type EventType = 'WORKSHOP' | 'TRIP' | 'BAZAAR' | 'CONFERENCE' | 'GYM_SESSION';

interface CreateEventSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  initialType?: EventType; // Pre-select event type (e.g., for professors)
  skipTypeSelection?: boolean; // Skip type selection step and go directly to details
}

const EVENT_TYPE_LABELS: Record<EventType, string> = {
  WORKSHOP: 'Workshop',
  TRIP: 'Trip',
  BAZAAR: 'Bazaar',
  CONFERENCE: 'Conference',
  GYM_SESSION: 'Gym Session',
};

type DateValue = Date | null;

export function CreateEventSheet({ 
  open, 
  onOpenChange, 
  onSuccess,
  initialType,
  skipTypeSelection = false
}: CreateEventSheetProps) {
  const { user } = useAuthStore();
  const [step, setStep] = useState<'type' | 'details'>('type');
  const [pendingType, setPendingType] = useState<EventType | null>(null);
  const [selectedType, setSelectedType] = useState<EventType | null>(null);

  // Auto-set type and skip to details if initialType is provided
  useEffect(() => {
    if (open && initialType && skipTypeSelection) {
      setSelectedType(initialType);
      setStep('details');
    }
  }, [open, initialType, skipTypeSelection]);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: 'ON_CAMPUS' as 'ON_CAMPUS' | 'OFF_CAMPUS',
    locationDetails: 'GUC Cairo', // Default for workshops, will be string for other events
    startDate: null as DateValue,
    endDate: null as DateValue,
    capacity: 50,
    price: 0,
    faculty: '',
    professors: [''], // Requirement #35: Multiple professors allowed
    requiredBudget: '',
    fundingSource: '',
    extraResources: '',
    conferenceWebsite: '',
    fullAgenda: '',
    requirements: '',
    images: [] as string[],
    registrationDeadline: null as DateValue,
    // Gym session specific
    sessionType: 'YOGA' as string,
    duration: 60,
  });

  const resetFlow = useCallback(() => {
    setStep('type');
    setPendingType(null);
    setSelectedType(null);
    setFormData({
      name: '',
      description: '',
      location: 'ON_CAMPUS',
      locationDetails: 'GUC Cairo',
      startDate: null,
      endDate: null,
      capacity: 50,
      price: 0,
      faculty: '',
      professors: [''],
      requiredBudget: '',
      fundingSource: '',
      extraResources: '',
      conferenceWebsite: '',
      fullAgenda: '',
      requirements: '',
      images: [],
      registrationDeadline: null,
      sessionType: 'YOGA',
      duration: 60,
    });
  }, []);

  // Generic create mutation for TRIP, BAZAAR, CONFERENCE (Events Office)
  const createMutation = trpc.events.create.useMutation({
    onSuccess: () => {
      toast.success('Event created successfully!');
      resetFlow();
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error) => {
      const errorMessage = formatValidationErrors(error);
      toast.error(errorMessage, { duration: 5000 });
      // DO NOT close the sheet - keep it open so user can fix errors
    },
  });

  // Gym session creation mutation (Events Office)
  const createGymSessionMutation = trpc.events.createGymSession.useMutation({
    onSuccess: () => {
      toast.success('Gym session created successfully!');
      resetFlow();
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error) => {
      const errorMessage = formatValidationErrors(error);
      toast.error(errorMessage, { duration: 5000 });
      // DO NOT close the sheet - keep it open so user can fix errors
    },
  });

  // Workshop creation mutation (Professors) - Sets status to PENDING_APPROVAL
  const createWorkshopMutation = trpc.events.createWorkshop.useMutation({
    onSuccess: () => {
      toast.success('Workshop submitted for approval!');
      resetFlow();
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error) => {
      const errorMessage = formatValidationErrors(error);
      toast.error(errorMessage, { duration: 5000 });
      // DO NOT close the sheet - keep it open so user can fix errors
    },
  });

  // Reset flow whenever the sheet closes
  useEffect(() => {
    if (!open) {
      resetFlow();
    }
  }, [open, resetFlow]);

  const availableTypes = useMemo(() => (
    [
      {
        type: 'WORKSHOP' as const,
        label: 'Workshop',
        icon: GraduationCap,
        description: 'Academic workshops submitted by professors and reviewed by the Events Office.',
        requiredRoles: ['PROFESSOR'],
      },
      {
        type: 'TRIP' as const,
        label: 'Trip',
        icon: Plane,
        description: 'Organized student trips and excursions managed by the Events Office.',
        requiredRoles: ['EVENT_OFFICE', 'ADMIN'],
      },
      {
        type: 'BAZAAR' as const,
        label: 'Bazaar',
        icon: Store,
        description: 'Campus bazaars and markets for vendors and student communities.',
        requiredRoles: ['EVENT_OFFICE'],
      },
      {
        type: 'CONFERENCE' as const,
        label: 'Conference',
        icon: Users,
        description: 'Professional conferences, symposiums, and keynote events.',
        requiredRoles: ['EVENT_OFFICE', 'ADMIN'],
      },
    ].filter((eventType) => eventType.requiredRoles.includes(user?.role || ''))
  ), [user?.role]);

  const handleContinueToDetails = () => {
    if (!pendingType) return;
    setSelectedType(pendingType);
    setStep('details');
  };

  const handleBackToTypeSelection = () => {
    setPendingType(selectedType);
    setStep('type');
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!selectedType) {
      toast.error('Please select an event type.');
      return;
    }

    try {
      // Route to correct endpoint based on event type
      if (selectedType === 'GYM_SESSION') {
        // Gym sessions use a special endpoint and schema
        await createGymSessionMutation.mutateAsync({
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          sessionType: formData.sessionType as 'YOGA' | 'PILATES' | 'AEROBICS' | 'ZUMBA' | 'CROSS_CIRCUIT' | 'KICK_BOXING' | 'CROSSFIT' | 'CARDIO' | 'STRENGTH' | 'DANCE' | 'MARTIAL_ARTS' | 'OTHER',
          startDate: formData.startDate!,
          capacity: formData.capacity,
          duration: formData.duration,
        });
      } else if (selectedType === 'WORKSHOP' && user?.role === 'PROFESSOR') {
        // Professors create workshops that need approval (status: PENDING_APPROVAL)
        await createWorkshopMutation.mutateAsync({
          type: 'WORKSHOP' as const,
          name: formData.name.trim(),
          description: formData.description.trim(),
          location: formData.location,
          locationDetails: formData.locationDetails as 'GUC Cairo' | 'GUC Berlin',
          startDate: formData.startDate!,
          endDate: formData.endDate!,
          capacity: formData.capacity,
          registrationDeadline: formData.registrationDeadline!,
          faculty: formData.faculty as 'MET' | 'IET' | 'ARTS' | 'LAW' | 'PHARMACY' | 'BUSINESS' | 'BIOTECHNOLOGY',
          professors: formData.professors.filter(p => p.trim()),
          fullAgenda: formData.fullAgenda?.trim() || '',
          requiredBudget: formData.requiredBudget ? Number(formData.requiredBudget) : 0,
          fundingSource: formData.fundingSource as 'GUC' | 'EXTERNAL',
          extraResources: formData.extraResources?.trim() || undefined,
        });
      } else {
        // TRIP, BAZAAR, CONFERENCE created by Events Office
        // Build type-specific payloads based on requirements
        const basePayload = {
          name: formData.name.trim(),
          description: formData.description.trim(),
          type: selectedType,
          location: formData.location,
          locationDetails: formData.locationDetails.trim(),
          startDate: formData.startDate!,
          endDate: formData.endDate || undefined,
          registrationDeadline: formData.registrationDeadline || undefined,
          requirements: formData.requirements?.trim() || undefined,
          images: formData.images && formData.images.length > 0 ? formData.images : undefined,
        };

        const payload: Record<string, unknown> = { ...basePayload };

        if (selectedType === 'TRIP') {
          // Req #33: Trip needs price and capacity
          payload.capacity = formData.capacity;
          payload.price = formData.price;
        } else if (selectedType === 'BAZAAR') {
          // Bazaar defaults: always set capacity to 1000 silently (no user input)
          payload.capacity = 1000;
        } else if (selectedType === 'CONFERENCE') {
          // Req #45: Conference needs website, agenda, budget, funding, resources (NO capacity)
          payload.conferenceWebsite = formData.conferenceWebsite?.trim();
          payload.fullAgenda = formData.fullAgenda?.trim();
          payload.requiredBudget = formData.requiredBudget ? Number(formData.requiredBudget) : undefined;
          payload.fundingSource = formData.fundingSource || undefined;
          payload.extraResources = formData.extraResources?.trim() || undefined;
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await createMutation.mutateAsync(payload as any);
      }
    } catch (error: unknown) {
      // Error already handled by mutation onError
      console.error('Create event error:', error);
    }
  };

  const renderTypeStep = () => (
    <>
      <FormSheetContent>
        <div className="space-y-6">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Step 1 of 2</p>
            <h2 className="text-xl font-semibold">Select the event type</h2>
            <p className="text-sm text-muted-foreground">
              Choose the event experience you want to create. Options are filtered based on your role.
            </p>
          </div>

          {availableTypes.length === 0 ? (
            <Card className="p-6">
              <p className="text-sm text-muted-foreground">
                Your role does not have permissions to create events. Please contact an administrator if you believe this is a mistake.
              </p>
            </Card>
          ) : (
            <div className="grid gap-4">
              {availableTypes.map((eventType) => {
                const Icon = eventType.icon;
                const isActive = pendingType === eventType.type;

                return (
                  <button
                    key={eventType.type}
                    type="button"
                    onClick={() => setPendingType(eventType.type)}
                    className={cn(
                      'w-full rounded-lg border p-4 text-left transition-shadow focus:outline-none focus:ring-2 focus:ring-primary/50',
                      isActive ? 'border-primary shadow-md' : 'hover:border-primary/50 hover:shadow-sm'
                    )}
                  >
                    <div className="flex items-start gap-4">
                      <div className={cn('p-2 rounded-md', isActive ? 'bg-primary text-primary-foreground' : 'bg-muted')}
                      >
                        <Icon className="h-6 w-6" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold">{eventType.label}</span>
                          {isActive && <Badge variant="secondary">Selected</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground">{eventType.description}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </FormSheetContent>

      <FormSheetFooter>
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange(false)}
        >
          Cancel
        </Button>
        <Button
          type="button"
          disabled={!pendingType || availableTypes.length === 0}
          onClick={handleContinueToDetails}
        >
          Continue
        </Button>
      </FormSheetFooter>
    </>
  );

  const renderDetailsStep = () => (
    <form onSubmit={handleSubmit} className="flex h-full flex-col">
      <FormSheetContent>
        <div className="space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Step 2 of 2</p>
              <h2 className="text-xl font-semibold">Event details</h2>
              <p className="text-sm text-muted-foreground">
                Provide the information for your {selectedType ? EVENT_TYPE_LABELS[selectedType] : 'event'}.
              </p>
            </div>
            {selectedType && (
              <Badge variant="outline" className="uppercase">
                {EVENT_TYPE_LABELS[selectedType]}
              </Badge>
            )}
          </div>

          <div className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2 text-sm">
            <span>
              Creating: <strong>{selectedType ? EVENT_TYPE_LABELS[selectedType] : 'Event'}</strong>
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleBackToTypeSelection}
              className="gap-1"
            >
              <RotateCcw className="h-4 w-4" /> Change type
            </Button>
          </div>

          <FormSheetSection title="Basic information" description="Essential event details">
            <FormSheetField label={selectedType === 'GYM_SESSION' ? 'Session name' : 'Event title'} required>
              <Input
                required
                minLength={5}
                maxLength={100}
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder={selectedType === 'GYM_SESSION' ? 'e.g., Morning Yoga Session' : 'Enter event title'}
              />
            </FormSheetField>

            <FormSheetField label="Description" required={selectedType !== 'GYM_SESSION'}>
              <Textarea
                required={selectedType !== 'GYM_SESSION'}
                minLength={selectedType === 'GYM_SESSION' ? 0 : 20}
                maxLength={2000}
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                placeholder={selectedType === 'GYM_SESSION' ? 'Optional session description' : 'Describe the event experience'}
                className="min-h-[110px]"
              />
            </FormSheetField>
          </FormSheetSection>

          {selectedType === 'WORKSHOP' && (
            <FormSheetSection title="Workshop details" description="Academic information and budgets">
              <FormSheetField label="Faculty" required>
                <Select
                  value={formData.faculty}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, faculty: value }))}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select faculty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MET">Media Engineering and Technology</SelectItem>
                    <SelectItem value="IET">Information Engineering and Technology</SelectItem>
                    <SelectItem value="ARTS">Arts and Design</SelectItem>
                    <SelectItem value="LAW">Law</SelectItem>
                    <SelectItem value="PHARMACY">Pharmacy</SelectItem>
                    <SelectItem value="BUSINESS">Business Administration and Management</SelectItem>
                    <SelectItem value="BIOTECHNOLOGY">Biotechnology</SelectItem>
                  </SelectContent>
                </Select>
              </FormSheetField>

              <FormSheetField label="Campus location" required>
                <Select
                  value={formData.locationDetails}
                  onValueChange={(value: 'GUC Cairo' | 'GUC Berlin') => setFormData((prev) => ({ ...prev, locationDetails: value }))}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select campus" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GUC Cairo">GUC Cairo</SelectItem>
                    <SelectItem value="GUC Berlin">GUC Berlin</SelectItem>
                  </SelectContent>
                </Select>
              </FormSheetField>

              <FormSheetField label="Professor(s) participating" required>
                <div className="space-y-2">
                  {formData.professors.map((professor, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={professor}
                        onChange={(e) => {
                          const newProfessors = [...formData.professors];
                          newProfessors[index] = e.target.value;
                          setFormData((prev) => ({ ...prev, professors: newProfessors }));
                        }}
                        placeholder={`Professor ${index + 1} name`}
                        required={index === 0}
                      />
                      {index === formData.professors.length - 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => setFormData((prev) => ({ ...prev, professors: [...prev.professors, ''] }))}
                        >
                          +
                        </Button>
                      )}
                      {formData.professors.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            const newProfessors = formData.professors.filter((_, i) => i !== index);
                            setFormData((prev) => ({ ...prev, professors: newProfessors.length > 0 ? newProfessors : [''] }));
                          }}
                        >
                          ×
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </FormSheetField>

              <div className="grid gap-4 md:grid-cols-2">
                <FormSheetField label="Required budget (EGP)" required>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={formData.requiredBudget}
                    onChange={(e) => setFormData((prev) => ({ ...prev, requiredBudget: e.target.value }))}
                  />
                </FormSheetField>

                <FormSheetField label="Funding source" required>
                  <Select
                    value={formData.fundingSource}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, fundingSource: value }))}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select source" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GUC">GUC</SelectItem>
                      <SelectItem value="EXTERNAL">External</SelectItem>
                    </SelectContent>
                  </Select>
                </FormSheetField>
              </div>

              <FormSheetField label="Full agenda" required>
                <Textarea
                  required
                  value={formData.fullAgenda}
                  onChange={(e) => setFormData((prev) => ({ ...prev, fullAgenda: e.target.value }))}
                  placeholder="Include sessions, topics, and schedule"
                  className="min-h-[110px]"
                />
              </FormSheetField>

              <FormSheetField label="Additional resources (optional)">
                <Textarea
                  value={formData.extraResources}
                  onChange={(e) => setFormData((prev) => ({ ...prev, extraResources: e.target.value }))}
                  placeholder="List equipment, materials, or special requirements"
                />
              </FormSheetField>
            </FormSheetSection>
          )}

          {selectedType === 'GYM_SESSION' && (
            <FormSheetSection title="Gym session details" description="Session type and capacity">
              <div className="grid gap-4 md:grid-cols-2">
                <FormSheetField label="Session type" required>
                  <Select
                    value={formData.sessionType}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, sessionType: value }))}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select session type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="YOGA">Yoga</SelectItem>
                      <SelectItem value="PILATES">Pilates</SelectItem>
                      <SelectItem value="AEROBICS">Aerobics</SelectItem>
                      <SelectItem value="ZUMBA">Zumba</SelectItem>
                      <SelectItem value="CROSS_CIRCUIT">Cross Circuit</SelectItem>
                      <SelectItem value="KICK_BOXING">Kick-Boxing</SelectItem>
                      <SelectItem value="CROSSFIT">CrossFit</SelectItem>
                      <SelectItem value="CARDIO">Cardio</SelectItem>
                      <SelectItem value="STRENGTH">Strength Training</SelectItem>
                      <SelectItem value="DANCE">Dance</SelectItem>
                      <SelectItem value="MARTIAL_ARTS">Martial Arts</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </FormSheetField>

                <FormSheetField label="Duration (minutes)" required>
                  <Input
                    type="number"
                    min="15"
                    max="180"
                    step="15"
                    value={formData.duration}
                    onChange={(e) => setFormData((prev) => ({ ...prev, duration: parseInt(e.target.value) || 60 }))}
                    placeholder="60"
                    required
                  />
                </FormSheetField>
              </div>

              <FormSheetField label="Max number of participants" required>
                <Input
                  type="number"
                  min="1"
                  required
                  value={formData.capacity}
                  onChange={(e) => setFormData((prev) => ({ ...prev, capacity: Number(e.target.value) || 0 }))}
                  placeholder="20"
                />
              </FormSheetField>
            </FormSheetSection>
          )}

          {selectedType === 'CONFERENCE' && (
            <FormSheetSection title="Conference details" description="Academic information and budget">
              <FormSheetField label="Website URL" required>
                <Input
                  type="url"
                  required
                  value={formData.conferenceWebsite}
                  onChange={(e) => setFormData((prev) => ({ ...prev, conferenceWebsite: e.target.value }))}
                  placeholder="https://conference.example.com"
                />
              </FormSheetField>

              <FormSheetField label="Full agenda" required>
                <Textarea
                  required
                  value={formData.fullAgenda}
                  onChange={(e) => setFormData((prev) => ({ ...prev, fullAgenda: e.target.value }))}
                  placeholder="Include keynote speakers, sessions, and time slots"
                  className="min-h-[110px]"
                />
              </FormSheetField>

              <div className="grid gap-4 md:grid-cols-2">
                <FormSheetField label="Required budget (EGP)" required>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={formData.requiredBudget}
                    onChange={(e) => setFormData((prev) => ({ ...prev, requiredBudget: e.target.value }))}
                  />
                </FormSheetField>

                <FormSheetField label="Funding source" required>
                  <Select
                    value={formData.fundingSource}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, fundingSource: value }))}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select source" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GUC">GUC</SelectItem>
                      <SelectItem value="EXTERNAL">External</SelectItem>
                    </SelectContent>
                  </Select>
                </FormSheetField>
              </div>

              <FormSheetField label="Extra required resources (optional)">
                <Textarea
                  value={formData.extraResources}
                  onChange={(e) => setFormData((prev) => ({ ...prev, extraResources: e.target.value }))}
                  placeholder="List equipment, materials, or special requirements"
                />
              </FormSheetField>
            </FormSheetSection>
          )}

          <FormSheetSection title="Date & location" description="Schedule and venue">
            <div className="grid gap-4 md:grid-cols-2">
              <FormSheetField label="Start date & time" required>
                <DateTimePicker
                  value={formData.startDate}
                  onChange={(value) => setFormData((prev) => ({ ...prev, startDate: value }))}
                  placeholder="Select start date"
                />
              </FormSheetField>

              <FormSheetField 
                label="End date & time" 
                required={selectedType === 'BAZAAR' || selectedType === 'TRIP' || selectedType === 'WORKSHOP' || selectedType === 'CONFERENCE'}
              >
                <DateTimePicker
                  value={formData.endDate}
                  onChange={(value) => setFormData((prev) => ({ ...prev, endDate: value }))}
                  placeholder={selectedType === 'BAZAAR' || selectedType === 'TRIP' || selectedType === 'WORKSHOP' || selectedType === 'CONFERENCE' ? 'Select end date' : 'Optional end date'}
                  minDate={formData.startDate || undefined}
                />
              </FormSheetField>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormSheetField label="Location type" required>
                <Select
                  value={formData.location}
                  onValueChange={(value: 'ON_CAMPUS' | 'OFF_CAMPUS') => setFormData((prev) => ({ ...prev, location: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ON_CAMPUS">On campus</SelectItem>
                    <SelectItem value="OFF_CAMPUS">Off campus</SelectItem>
                  </SelectContent>
                </Select>
              </FormSheetField>

              {selectedType !== 'WORKSHOP' && (
                <FormSheetField label="Location details" required>
                  <Input
                    required
                    minLength={5}
                    value={typeof formData.locationDetails === 'string' ? formData.locationDetails : ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, locationDetails: e.target.value }))}
                    placeholder="Building, room, or meeting point"
                  />
                </FormSheetField>
              )}
            </div>

            <FormSheetField 
              label="Registration deadline" 
              required={selectedType === 'BAZAAR' || selectedType === 'TRIP' || selectedType === 'WORKSHOP'}
            >
              <DateTimePicker
                value={formData.registrationDeadline}
                onChange={(value) => setFormData((prev) => ({ ...prev, registrationDeadline: value }))}
                placeholder={selectedType === 'BAZAAR' || selectedType === 'TRIP' || selectedType === 'WORKSHOP' ? 'Select deadline' : 'Optional deadline'}
                minDate={new Date()}
              />
            </FormSheetField>
          </FormSheetSection>

          {/* Capacity & pricing - different fields per type */}
          {/* TRIP & WORKSHOP need capacity; BAZAAR, CONFERENCE, GYM_SESSION don't */}
          {(selectedType === 'TRIP' || selectedType === 'WORKSHOP') && (
            <FormSheetSection title={selectedType === 'TRIP' ? 'Capacity & pricing' : 'Capacity'}>
              <div className="grid gap-4 md:grid-cols-2">
                <FormSheetField label="Capacity" required>
                  <Input
                    type="number"
                    min="1"
                    required
                    value={formData.capacity}
                    onChange={(e) => setFormData((prev) => ({ ...prev, capacity: Number(e.target.value) || 0 }))}
                  />
                </FormSheetField>

                {selectedType === 'TRIP' && (
                  <FormSheetField label="Price (EGP)" required>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      required
                      value={formData.price}
                      onChange={(e) => setFormData((prev) => ({ ...prev, price: Number(e.target.value) || 0 }))}
                    />
                  </FormSheetField>
                )}
              </div>
            </FormSheetSection>
          )}

          <FormSheetSection title="Additional information">
            <FormSheetField label="Participant requirements">
              <Textarea
                maxLength={500}
                value={formData.requirements}
                onChange={(e) => setFormData((prev) => ({ ...prev, requirements: e.target.value }))}
                placeholder="Prerequisites, required equipment, or eligibility"
              />
            </FormSheetField>

            <FormSheetField label="Event Images">
              <ImageGallery
                value={formData.images}
                onChange={(images) => setFormData((prev) => ({ ...prev, images }))}
                maxImages={10}
              />
              <p className="text-xs text-muted-foreground mt-2">
                Upload multiple images for the event. The first image will be the primary image.
              </p>
            </FormSheetField>
          </FormSheetSection>
        </div>
      </FormSheetContent>

      <FormSheetFooter>
        {!skipTypeSelection && (
          <Button
            type="button"
            variant="outline"
            onClick={handleBackToTypeSelection}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        )}
        <Button type="submit" disabled={createMutation.isPending}>
          {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <Save className="mr-2 h-4 w-4" />
          Create event
        </Button>
      </FormSheetFooter>
    </form>
  );

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      title={step === 'type' ? 'Create event' : `Create ${selectedType ? EVENT_TYPE_LABELS[selectedType] : 'event'}`}
      description={step === 'type' ? 'Follow the guided steps to publish a new experience.' : 'Provide the event details before publishing.'}
      size="wide"
    >
      {step === 'type' ? renderTypeStep() : renderDetailsStep()}
    </FormSheet>
  );
}