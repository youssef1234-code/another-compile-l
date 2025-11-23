/**
 * Create Trip Page (Events Office Role)
 * 
 * Requirement #33: Events Office can create trips
 * Fields: name, location, price, start/end dates, description, capacity, registration deadline
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { trpc } from '@/lib/trpc';
import { ROUTES } from '@/lib/constants';
import { formatValidationErrors } from '@/lib/format-errors';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { Card, CardContent } from '@/components/ui/card';
import { designSystem } from '@/styles/design-system';
import { usePageMeta } from '@/components/layout/page-meta-context';

export function CreateTripPage() {
  const { setPageMeta } = usePageMeta();
  const navigate = useNavigate();

  useEffect(() => {
    setPageMeta({
      title: 'Create Trip',
      description: 'Create a new trip event',
    });
  }, [setPageMeta]);

  const [formData, setFormData] = useState({
    name: '',
    location: '',
    price: '',
    startDate: '',
    endDate: '',
    description: '',
    capacity: '',
    registrationDeadline: '',
  });

  const createTripMutation = trpc.events.create.useMutation({
    onSuccess: () => {
      toast.success('Trip created successfully!');
      navigate(ROUTES.EVENTS);
    },
    onError: (error) => {
      const errorMessage = formatValidationErrors(error);
      toast.error(errorMessage, { style: { whiteSpace: 'pre-line' } });
    },
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.name || !formData.location || !formData.startDate || !formData.endDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    createTripMutation.mutate({
      name: formData.name,
      type: 'TRIP',
      location: 'OFF_CAMPUS', // Trips are off campus
      locationDetails: formData.location,
      price: formData.price ? parseFloat(formData.price) : 0,
      startDate: new Date(formData.startDate),
      endDate: new Date(formData.endDate),
      description: formData.description,
      capacity: formData.capacity ? parseInt(formData.capacity) : 50,
      registrationDeadline: formData.registrationDeadline ? new Date(formData.registrationDeadline) : undefined,
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
                    <Label htmlFor="name">Trip Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="e.g., Alexandria Beach Trip"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location">Destination *</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      placeholder="e.g., Alexandria, Egypt"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Price (EGP) *</Label>
                    <Input
                      id="price"
                      type="number"
                      value={formData.price}
                      onChange={(e) => handleInputChange('price', e.target.value)}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      required
                    />
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
                  <Label htmlFor="description">Short Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Brief overview of the trip..."
                    rows={4}
                  />
                </div>
              </div>

              {/* Schedule */}
              <div className="space-y-4 pt-4 border-t">
                <h3 className={designSystem.typography.cardTitle}>Schedule</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date & Time *</Label>
                    <DateTimePicker
                      value={formData.startDate ? new Date(formData.startDate) : null}
                      onChange={(date) => handleInputChange('startDate', date ? date.toISOString().slice(0, 16) : '')}
                      placeholder="Select start date & time"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="endDate">End Date & Time *</Label>
                    <DateTimePicker
                      value={formData.endDate ? new Date(formData.endDate) : null}
                      onChange={(date) => handleInputChange('endDate', date ? date.toISOString().slice(0, 16) : '')}
                      placeholder="Select end date & time"
                      minDate={formData.startDate ? new Date(formData.startDate) : undefined}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="registrationDeadline">Registration Deadline</Label>
                    <DateTimePicker
                      value={formData.registrationDeadline ? new Date(formData.registrationDeadline) : null}
                      onChange={(date) => handleInputChange('registrationDeadline', date ? date.toISOString().slice(0, 16) : '')}
                      placeholder="Select deadline"
                    />
                  </div>
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
                <Button type="submit" disabled={createTripMutation.isPending}>
                  {createTripMutation.isPending ? 'Creating...' : 'Create Trip'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </motion.div>
    </div>
  );
}
