/**
 * Create Workshop Page (Professor Role)
 * 
 * Requirement #35: Professors can create workshops with all required fields
 * Fields: name, location (Cairo/Berlin), dates, description, agenda, faculty,
 * participating professors, budget, funding source, resources, capacity, registration deadline
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { Plus, X } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { ROUTES } from '@/lib/constants';
import { formatValidationErrors } from '@/lib/format-errors';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ImageGallery } from '@/components/ui/image-gallery';
import { designSystem } from '@/styles/design-system';
import { usePageMeta } from '@/components/layout/page-meta-context';

export function CreateWorkshopPage() {
  const { setPageMeta } = usePageMeta();
  const navigate = useNavigate();

  useEffect(() => {
    setPageMeta({
      title: 'Create Workshop',
      description: 'Submit a workshop proposal for Events Office approval',
    });
  }, [setPageMeta]);

  const [formData, setFormData] = useState({
    name: '',
    location: '',
    startDate: '',
    endDate: '',
    description: '',
    fullAgenda: '',
    faculty: '',
    requiredBudget: '',
    fundingSource: '',
    extraResources: '',
    capacity: '',
    registrationDeadline: '',
  });
  
  const [images, setImages] = useState<string[]>([]);
  const [professorParticipants, setProfessorParticipants] = useState<string[]>(['']);

  const createWorkshopMutation = trpc.events.create.useMutation({
    onSuccess: () => {
      toast.success('Workshop created successfully! Pending approval from Events Office.');
      navigate(ROUTES.ADMIN_EVENTS); // Redirects to BackOfficeEventsPage (unified event management)
    },
    onError: (error) => {
      const errorMessage = formatValidationErrors(error);
      toast.error(errorMessage, { style: { whiteSpace: 'pre-line' } });
    },
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddProfessor = () => {
    setProfessorParticipants([...professorParticipants, '']);
  };

  const handleRemoveProfessor = (index: number) => {
    setProfessorParticipants(professorParticipants.filter((_, i) => i !== index));
  };

  const handleProfessorChange = (index: number, value: string) => {
    const updated = [...professorParticipants];
    updated[index] = value;
    setProfessorParticipants(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.name || !formData.location || !formData.startDate || !formData.endDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    createWorkshopMutation.mutate({
      name: formData.name,
      type: 'WORKSHOP',
      location: 'ON_CAMPUS', // Workshops are always on campus
      locationDetails: formData.location,
      startDate: new Date(formData.startDate),
      endDate: new Date(formData.endDate),
      description: formData.description,
      capacity: formData.capacity ? parseInt(formData.capacity) : 50,
      price: 0,
      images: images.length > 0 ? images : undefined,
      registrationDeadline: formData.registrationDeadline ? new Date(formData.registrationDeadline) : undefined,
      professorName: professorParticipants.join(', '),
    });
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <form onSubmit={handleSubmit}>
          <Card className={designSystem.card.elevated}>
            <CardContent className="pt-6 space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className={designSystem.typography.cardTitle}>Basic Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Workshop Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="e.g., Introduction to Machine Learning"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location">Location *</Label>
                    <Select value={formData.location} onValueChange={(value) => handleInputChange('location', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select location" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="GUC Cairo">GUC Cairo</SelectItem>
                        <SelectItem value="GUC Berlin">GUC Berlin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Short Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Brief overview of the workshop..."
                    rows={3}
                  />
                </div>
              </div>

              {/* Images */}
              <div className="space-y-4 pt-4 border-t">
                <div>
                  <h3 className={designSystem.typography.cardTitle}>Workshop Images</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Upload multiple images for the workshop. The first image will be the primary image.
                  </p>
                </div>
                <ImageGallery
                  value={images}
                  onChange={setImages}
                  maxImages={10}
                />
              </div>

              {/* Schedule */}
              <div className="space-y-4 pt-4 border-t">
                <h3 className={designSystem.typography.cardTitle}>Schedule</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date & Time *</Label>
                    <Input
                      id="startDate"
                      type="datetime-local"
                      value={formData.startDate}
                      onChange={(e) => handleInputChange('startDate', e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="endDate">End Date & Time *</Label>
                    <Input
                      id="endDate"
                      type="datetime-local"
                      value={formData.endDate}
                      onChange={(e) => handleInputChange('endDate', e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="registrationDeadline">Registration Deadline</Label>
                    <Input
                      id="registrationDeadline"
                      type="datetime-local"
                      value={formData.registrationDeadline}
                      onChange={(e) => handleInputChange('registrationDeadline', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Academic Details */}
              <div className="space-y-4 pt-4 border-t">
                <h3 className={designSystem.typography.cardTitle}>Academic Details</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="faculty">Faculty Responsible</Label>
                    <Select value={formData.faculty} onValueChange={(value) => handleInputChange('faculty', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select faculty" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MET">Media Engineering & Technology (MET)</SelectItem>
                        <SelectItem value="IET">Information Engineering & Technology (IET)</SelectItem>
                        <SelectItem value="BAT">Business & Technology (BAT)</SelectItem>
                        <SelectItem value="Pharmacy">Pharmacy</SelectItem>
                        <SelectItem value="Biotechnology">Biotechnology</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="capacity">Capacity</Label>
                    <Input
                      id="capacity"
                      type="number"
                      value={formData.capacity}
                      onChange={(e) => handleInputChange('capacity', e.target.value)}
                      placeholder="Maximum participants"
                      min="1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fullAgenda">Full Agenda</Label>
                  <Textarea
                    id="fullAgenda"
                    value={formData.fullAgenda}
                    onChange={(e) => handleInputChange('fullAgenda', e.target.value)}
                    placeholder="Detailed agenda with topics, speakers, timings..."
                    rows={5}
                  />
                </div>

                {/* Participating Professors */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Participating Professors</Label>
                    <Button type="button" variant="outline" size="sm" onClick={handleAddProfessor}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Professor
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {professorParticipants.map((prof, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={prof}
                          onChange={(e) => handleProfessorChange(index, e.target.value)}
                          placeholder="Professor name"
                        />
                        {professorParticipants.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => handleRemoveProfessor(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Budget & Resources */}
              <div className="space-y-4 pt-4 border-t">
                <h3 className={designSystem.typography.cardTitle}>Budget & Resources</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="requiredBudget">Required Budget (EGP)</Label>
                    <Input
                      id="requiredBudget"
                      type="number"
                      value={formData.requiredBudget}
                      onChange={(e) => handleInputChange('requiredBudget', e.target.value)}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fundingSource">Funding Source</Label>
                    <Select value={formData.fundingSource} onValueChange={(value) => handleInputChange('fundingSource', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select funding source" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="GUC">GUC</SelectItem>
                        <SelectItem value="External">External</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="extraResources">Extra Required Resources</Label>
                  <Textarea
                    id="extraResources"
                    value={formData.extraResources}
                    onChange={(e) => handleInputChange('extraResources', e.target.value)}
                    placeholder="e.g., Projector, Whiteboard, Lab equipment..."
                    rows={3}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(ROUTES.ADMIN_EVENTS)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createWorkshopMutation.isPending}>
                  {createWorkshopMutation.isPending ? 'Creating...' : 'Create Workshop'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </motion.div>
    </div>
  );
}
