/**
 * Court Form Sheet
 * 
 * Side sheet for creating/editing courts
 */

import { useState, useEffect } from 'react';
import { 
  FormSheet, 
  FormSheetContent, 
  FormSheetField, 
  FormSheetFooter, 
  FormSheetSection 
} from '@/components/generic/FormSheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ImageGallery } from '@/components/ui/image-gallery';
import { LocationPicker, type LocationData } from '@/components/ui/location-picker';
import { Loader2 } from 'lucide-react';
import type { CourtSport, Coordinates } from '@event-manager/shared';

const SPORTS = ['BASKETBALL', 'TENNIS', 'FOOTBALL'] as const;

interface CourtData {
  id?: string;
  name: string;
  sport: CourtSport;
  location: string;
  description?: string;
  specs?: string;
  customInstructions?: string;
  images: string[];
  coordinates?: Coordinates;
}

interface CourtFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  court: CourtData | null;
  onSubmit: (data: CourtData) => Promise<void>;
  isSubmitting: boolean;
}

const INITIAL_FORM_DATA: CourtData = {
  name: '',
  sport: 'BASKETBALL' as CourtSport,
  location: '',
  description: '',
  specs: '',
  customInstructions: '',
  images: [],
  coordinates: undefined,
};

export function CourtFormSheet({
  open,
  onOpenChange,
  court,
  onSubmit,
  isSubmitting,
}: CourtFormSheetProps) {
  const [formData, setFormData] = useState<CourtData>(INITIAL_FORM_DATA);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (court) {
      setFormData(court);
    } else {
      setFormData(INITIAL_FORM_DATA);
    }
  }, [court, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      title={court ? 'Edit Court' : 'Create Court'}
      description={court ? 'Update court details and booking information' : 'Add a new court with all necessary details'}
    >
      <form onSubmit={handleSubmit} className="h-full flex flex-col">
        <FormSheetContent>
          <FormSheetSection title="Court Information">
            {/* Court Name */}
            <FormSheetField 
              label="Court Name" 
              required
              hint="A unique name for this court"
            >
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Court 1, Main Basketball Court"
                required
              />
            </FormSheetField>

            {/* Sport and Location */}
            <div className="grid grid-cols-2 gap-4">
              <FormSheetField label="Sport" required>
                <Select
                  value={formData.sport}
                  onValueChange={(value) =>
                    setFormData({ ...formData, sport: value as CourtSport })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SPORTS.map((sport) => (
                      <SelectItem key={sport} value={sport}>
                        {sport}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormSheetField>

              <FormSheetField label="Location" required>
                <Input
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g., Sports Complex, Building A"
                  required
                />
              </FormSheetField>
            </div>

            {/* Description */}
            <FormSheetField
              label="Description"
              hint="Brief description of the court"
            >
              <Textarea
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of the court"
                rows={3}
              />
            </FormSheetField>

            {/* Specifications */}
            <FormSheetField
              label="Specifications"
              hint="Technical details about the court"
            >
              <Textarea
                value={formData.specs || ''}
                onChange={(e) => setFormData({ ...formData, specs: e.target.value })}
                placeholder="e.g., Indoor court, wooden floor, 28m x 15m, lighting available"
                rows={3}
              />
            </FormSheetField>

            {/* Booking Instructions */}
            <FormSheetField 
              label="Booking Instructions"
              hint="Special instructions for users booking this court"
            >
              <Textarea
                value={formData.customInstructions || ''}
                onChange={(e) =>
                  setFormData({ ...formData, customInstructions: e.target.value })
                }
                placeholder="Special instructions for booking this court"
                rows={3}
              />
            </FormSheetField>

            {/* Court Images */}
            <FormSheetField
              label="Court Images"
              hint="Upload images of the court (max 5 images)"
            >
              <ImageGallery
                value={formData.images || []}
                onChange={(urls: string[]) => setFormData({ ...formData, images: urls })}
                onUploadingChange={setIsUploading}
                maxImages={5}
              />
            </FormSheetField>

            {/* Map Location */}
            <FormSheetField
              label="Map Location"
              hint="Click on the map to set the court's location"
            >
              <LocationPicker
                value={formData.coordinates ? {
                  lat: formData.coordinates.lat,
                  lng: formData.coordinates.lng,
                  address: formData.location,
                } : undefined}
                onChange={(location: LocationData | null) => {
                  if (location) {
                    setFormData({
                      ...formData,
                      coordinates: { lat: location.lat, lng: location.lng },
                      // Optionally update the location text field with the address
                      location: location.address || formData.location,
                    });
                  } else {
                    setFormData({
                      ...formData,
                      coordinates: undefined,
                    });
                  }
                }}
                height="250px"
              />
            </FormSheetField>
          </FormSheetSection>
        </FormSheetContent>

        <FormSheetFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting || isUploading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting || isUploading}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isUploading && !isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {court ? 'Update Court' : 'Create Court'}
          </Button>
        </FormSheetFooter>
      </form>
    </FormSheet>
  );
}
