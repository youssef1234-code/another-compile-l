/**
 * Create Conference Page (Events Office Role)
 * 
 * Requirement #45: Events Office can create conferences
 * Fields: name, start/end dates, description, full agenda, website link,
 * required budget, funding source, extra resources
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { trpc } from '@/lib/trpc';
import { ROUTES } from '@/lib/constants';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { designSystem } from '@/styles/design-system';
import { usePageMeta } from '@/components/layout/page-meta-context';

export function CreateConferencePage() {
  const { setPageMeta } = usePageMeta();
  const navigate = useNavigate();

  useEffect(() => {
    setPageMeta({
      title: 'Create Conference',
      description: 'Create a new conference event',
    });
  }, [setPageMeta]);

  const [formData, setFormData] = useState({
    name: '',
    startDate: '',
    endDate: '',
    description: '',
    fullAgenda: '',
    conferenceWebsite: '',
    requiredBudget: '',
    fundingSource: '',
    extraResources: '',
  });

  const createConferenceMutation = trpc.events.create.useMutation({
    onSuccess: () => {
      toast.success('Conference created successfully!');
      navigate(ROUTES.EVENTS);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create conference');
    },
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.name || !formData.startDate || !formData.endDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    createConferenceMutation.mutate({
      name: formData.name,
      type: 'CONFERENCE',
      location: 'ON_CAMPUS',
      locationDetails: 'GUC Campus',
      startDate: new Date(formData.startDate),
      endDate: new Date(formData.endDate),
      description: formData.description,
      capacity: 100,
      price: 0,
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
                
                <div className="space-y-2">
                  <Label htmlFor="name">Conference Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="e.g., International AI Conference 2025"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Short Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Brief overview of the conference..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="conferenceWebsite">Conference Website</Label>
                  <Input
                    id="conferenceWebsite"
                    type="url"
                    value={formData.conferenceWebsite}
                    onChange={(e) => handleInputChange('conferenceWebsite', e.target.value)}
                    placeholder="https://conference.example.com"
                  />
                  <p className="text-sm text-muted-foreground">
                    The conference website will contain all detailed information including speakers, schedule, and registration.
                  </p>
                </div>
              </div>

              {/* Schedule */}
              <div className="space-y-4 pt-4 border-t">
                <h3 className={designSystem.typography.cardTitle}>Schedule</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fullAgenda">Full Agenda</Label>
                  <Textarea
                    id="fullAgenda"
                    value={formData.fullAgenda}
                    onChange={(e) => handleInputChange('fullAgenda', e.target.value)}
                    placeholder="Detailed agenda with sessions, speakers, timings..."
                    rows={6}
                  />
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
                    placeholder="e.g., Audio equipment, Registration desk, Poster boards..."
                    rows={3}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(ROUTES.EVENTS)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createConferenceMutation.isPending}>
                  {createConferenceMutation.isPending ? 'Creating...' : 'Create Conference'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </motion.div>
    </div>
  );
}
