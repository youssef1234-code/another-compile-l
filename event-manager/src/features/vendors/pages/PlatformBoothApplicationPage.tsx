/**
 * Platform Booth Application Page
 * 
 * Optimized with React 19 features:
 * - useTransition for non-blocking UI updates
 * - useMemo for expensive computations
 * 
 * Vendors can apply for platform booth with:
 * - Names and emails of attendees (max 5)
 * - Duration (1-4 weeks)
 * - Booth location selection on platform map
 * - Booth size (2x2 or 4x4)
 * 
 * Requirements: #61
 */

import React, { useState, useEffect, useTransition, useMemo } from 'react';
import { Stage, Layer, Rect, Text, Line } from 'react-konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { trpc } from '@/lib/trpc';
import { toast } from 'react-hot-toast';
import { Loader2, Plus, Trash2, Save, MapPin } from 'lucide-react';
import { formatValidationErrors } from '@/lib/format-errors';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ROUTES } from '@/lib/constants';
import { usePageMeta } from '@/components/layout/page-meta-context';

interface Attendee {
  name: string;
  email: string;
}

interface Booth {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  isOccupied: boolean;
  label?: string;
}

interface PlatformMap {
  id: string;
  name: string;
  gridWidth: number;
  gridHeight: number;
  cellSize: number;
  booths: Booth[];
  isActive: boolean;
}

interface TRPCError {
  message?: string;
}

export function PlatformBoothApplicationPage() {
  const navigate = useNavigate();
  const utils = trpc.useUtils();
  const { setPageMeta } = usePageMeta();
  const [, startTransition] = useTransition();
  const [platform, setPlatform] = useState<PlatformMap | null>(null);
  const [selectedBoothSize, setSelectedBoothSize] = useState<'2' | '4'>('2');
  const [selectedBooth, setSelectedBooth] = useState<Booth | null>(null);
  const [attendees, setAttendees] = useState<Attendee[]>([{ name: '', email: '' }]);
  const [duration, setDuration] = useState<string>('1');
  const [startDate, setStartDate] = useState<string>('');
  const [stageSize, setStageSize] = useState({ width: 800, height: 600 });

  useEffect(() => {
    setPageMeta({
      title: 'Apply for Platform Booth',
      description: 'Select a booth location and provide attendee details',
    });
  }, [setPageMeta]);

  const { data, isLoading } = trpc.platformMaps.getActivePlatform.useQuery();
  const createApplication = trpc.vendorApplications.create.useMutation({
    onSuccess: () => {
      // Invalidate all vendor application queries to force refetch
      utils.vendorApplications.getApplications.invalidate();
      utils.vendorApplications.getApplicationStats.invalidate();
      utils.platformMaps.getActivePlatform.invalidate(); // Refresh platform map to show updated booth status
      
      toast.success('Platform booth application submitted successfully!');
      navigate(ROUTES.VENDOR_APPLICATIONS);
    },
    onError: (error: TRPCError) => {
      const errorMessage = formatValidationErrors(error);
      toast.error(errorMessage, { style: { whiteSpace: 'pre-line' } });
    },
  });

  useEffect(() => {
    if (data) {
      setPlatform(data as PlatformMap);
      const width = (data as PlatformMap).gridWidth * (data as PlatformMap).cellSize;
      const height = (data as PlatformMap).gridHeight * (data as PlatformMap).cellSize;
      setStageSize({ width: Math.min(width, 1000), height: Math.min(height, 600) });
    }
  }, [data]);

  const handleStageClick = (e: KonvaEventObject<MouseEvent>) => {
    if (!platform) return;

    const stage = e.target.getStage();
    if (!stage) return;
    const pointerPosition = stage.getPointerPosition();
    if (!pointerPosition) return;

    const cellSize = platform.cellSize;
    const clickX = Math.floor(pointerPosition.x / cellSize);
    const clickY = Math.floor(pointerPosition.y / cellSize);
    const sizeNumber = parseInt(selectedBoothSize);

    // Check if clicked on available booth
    const clickedBooth = platform.booths.find(
      (b) =>
        !b.isOccupied &&
        b.width === sizeNumber &&
        b.height === sizeNumber &&
        clickX >= b.x &&
        clickX < b.x + b.width &&
        clickY >= b.y &&
        clickY < b.y + b.height
    );

    if (clickedBooth) {
      startTransition(() => {
        setSelectedBooth(clickedBooth);
        toast.success(`Selected booth: ${clickedBooth.label || `${clickedBooth.width}×${clickedBooth.height}`}`);
      });
    } else {
      toast.error('Please select an available booth (green) matching your chosen size');
    }
  };

  const handleAddAttendee = () => {
    if (attendees.length < 5) {
      setAttendees([...attendees, { name: '', email: '' }]);
    } else {
      toast.error('Maximum 5 attendees allowed');
    }
  };

  const handleRemoveAttendee = (index: number) => {
    if (attendees.length > 1) {
      setAttendees(attendees.filter((_, i) => i !== index));
    } else {
      toast.error('At least one attendee is required');
    }
  };

  const handleUpdateAttendee = (index: number, field: 'name' | 'email', value: string) => {
    const updated = [...attendees];
    updated[index][field] = value;
    setAttendees(updated);
  };

  const handleSubmit = () => {
    // Validation
    if (!selectedBooth) {
      toast.error('Please select a booth location on the map');
      return;
    }

    if (attendees.some((a) => !a.name.trim() || !a.email.trim())) {
      toast.error('Please fill in all attendee names and emails');
      return;
    }

    if (!startDate) {
      toast.error('Please select a start date');
      return;
    }

    const boothSize = selectedBoothSize === '2' ? 'TWO_BY_TWO' : 'FOUR_BY_FOUR';
    
    createApplication.mutate({
      names: attendees.map((a) => a.name),
      emails: attendees.map((a) => a.email),
      type: 'PLATFORM' as const,
      boothSize,
      duration: parseInt(duration),
      startDate: new Date(startDate), // Convert to Date object
      boothLocationId: selectedBooth.id,
      boothLabel: selectedBooth.label || `${selectedBooth.width}×${selectedBooth.height}`, // Store human-readable label
      status: 'PENDING' as const, // Required field - initial status
    });
  };

  // Memoize available booths calculation - MUST be before early returns!
  const availableBooths = useMemo(() => {
    if (!platform) return [];
    return platform.booths.filter(
      (b) => !b.isOccupied && b.width === parseInt(selectedBoothSize) && b.height === parseInt(selectedBoothSize)
    );
  }, [platform, selectedBoothSize]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!platform) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <div className="text-center py-12">
          <p className="text-muted-foreground">No platform layout available. Contact administrator.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Application Form */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Application Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Booth Size */}
            <div className="space-y-2">
              <Label htmlFor="booth-size">Booth Size *</Label>
              <Select value={selectedBoothSize} onValueChange={(v) => setSelectedBoothSize(v as '2' | '4')}>
                <SelectTrigger id="booth-size">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2×2 Small Booth</SelectItem>
                  <SelectItem value="4">4×4 Large Booth</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                {availableBooths.length} available booth{availableBooths.length !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Duration */}
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (weeks) *</Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger id="duration">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Week</SelectItem>
                  <SelectItem value="2">2 Weeks</SelectItem>
                  <SelectItem value="3">3 Weeks</SelectItem>
                  <SelectItem value="4">4 Weeks</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Start Date */}
            <div className="space-y-2">
              <Label htmlFor="start-date">Start Date *</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            {/* Selected Booth Info */}
            {selectedBooth && (
              <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span className="font-semibold text-primary">
                    Selected: {selectedBooth.label || `Booth ${selectedBooth.width}×${selectedBooth.height}`}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Grid Position: ({selectedBooth.x}, {selectedBooth.y})
                </p>
              </div>
            )}

            {/* Attendees Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Attendees ({attendees.length}/5) *</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddAttendee}
                  disabled={attendees.length >= 5}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Member
                </Button>
              </div>

              <div className="space-y-3">
                {attendees.map((attendee, index) => (
                  <Card key={index} className="border-2">
                    <CardContent className="pt-4 space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor={`attendee-name-${index}`} className="text-xs">
                          Name {index + 1} *
                        </Label>
                        <Input
                          id={`attendee-name-${index}`}
                          placeholder="Full name"
                          value={attendee.name}
                          onChange={(e) => handleUpdateAttendee(index, 'name', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`attendee-email-${index}`} className="text-xs">
                          Email {index + 1} *
                        </Label>
                        <Input
                          id={`attendee-email-${index}`}
                          type="email"
                          placeholder="email@example.com"
                          value={attendee.email}
                          onChange={(e) => handleUpdateAttendee(index, 'email', e.target.value)}
                        />
                      </div>
                      {attendees.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveAttendee(index)}
                          className="w-full gap-2 text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                          Remove Member
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Platform Map */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Select Booth Location</CardTitle>
            <p className="text-sm text-muted-foreground">
              Click on a green booth to select it. Only booths matching your chosen size are available.
            </p>
          </CardHeader>
          <CardContent className="overflow-auto">
            <div className="border rounded-md overflow-hidden mx-auto" style={{ width: 'fit-content' }}>
              <Stage
                width={stageSize.width}
                height={stageSize.height}
                onClick={handleStageClick}
              >
                <Layer>
                  {/* Grid lines */}
                  {Array.from({ length: platform.gridWidth + 1 }).map((_, i) => (
                    <Line
                      key={`v-${i}`}
                      points={[i * platform.cellSize, 0, i * platform.cellSize, platform.gridHeight * platform.cellSize]}
                      stroke="#e5e7eb"
                      strokeWidth={1}
                    />
                  ))}
                  {Array.from({ length: platform.gridHeight + 1 }).map((_, i) => (
                    <Line
                      key={`h-${i}`}
                      points={[0, i * platform.cellSize, platform.gridWidth * platform.cellSize, i * platform.cellSize]}
                      stroke="#e5e7eb"
                      strokeWidth={1}
                    />
                  ))}

                  {/* Booths */}
                  {platform.booths.map((booth) => {
                    const sizeNumber = parseInt(selectedBoothSize);
                    const isAvailable = !booth.isOccupied && booth.width === sizeNumber && booth.height === sizeNumber;
                    const isSelected = selectedBooth?.id === booth.id;
                    
                    let fillColor = '#cbd5e1'; // Gray for occupied/unavailable
                    let strokeColor = '#64748b';
                    
                    if (isSelected) {
                      fillColor = '#3b82f6'; // Blue for selected
                      strokeColor = '#1d4ed8';
                    } else if (isAvailable) {
                      fillColor = '#86efac'; // Green for available
                      strokeColor = '#16a34a';
                    }

                    return (
                      <React.Fragment key={booth.id}>
                        <Rect
                          x={booth.x * platform.cellSize}
                          y={booth.y * platform.cellSize}
                          width={booth.width * platform.cellSize}
                          height={booth.height * platform.cellSize}
                          fill={fillColor}
                          stroke={strokeColor}
                          strokeWidth={2}
                        />
                        <Text
                          x={booth.x * platform.cellSize}
                          y={booth.y * platform.cellSize}
                          width={booth.width * platform.cellSize}
                          height={booth.height * platform.cellSize}
                          text={booth.label || `${booth.width}x${booth.height}`}
                          fontSize={12}
                          fill="#1e293b"
                          align="center"
                          verticalAlign="middle"
                        />
                      </React.Fragment>
                    );
                  })}
                </Layer>
              </Stage>
              
              {/* Legend */}
              <div className="flex items-center justify-center gap-4 p-3 bg-gray-50 border-t">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded" style={{ backgroundColor: '#86efac' }} />
                  <span className="text-xs">Available</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded" style={{ backgroundColor: '#cbd5e1' }} />
                  <span className="text-xs">Occupied</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded" style={{ backgroundColor: '#3b82f6' }} />
                  <span className="text-xs">Selected</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Submit Button at Bottom */}
      <div className="flex justify-end">
        <Button
          size="lg"
          onClick={handleSubmit}
          disabled={createApplication.isPending || !selectedBooth}
          className="px-12"
        >
          {createApplication.isPending ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Save className="h-5 w-5 mr-2" />
              Submit Application
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
