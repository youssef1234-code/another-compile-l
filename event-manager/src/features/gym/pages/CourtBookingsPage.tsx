/**
 * Court Bookings Page
 * 
 * Students can:
 * - View all courts (basketball/tennis/football)
 * - Check court availability
 * - Book court time slots
 * - View and cancel their reservations
 * 
 * Requirement: #78
 */

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Dumbbell, Clock, MapPin, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { LoadingSpinner } from '@/components/generic/LoadingSpinner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export function CourtBookingsPage() {
  const [selectedSport, setSelectedSport] = useState<'BASKETBALL' | 'TENNIS' | 'FOOTBALL'>('BASKETBALL');
  const [selectedCourt, setSelectedCourt] = useState<any>(null);
  const [bookingDialog, setBookingDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');
  const [duration, setDuration] = useState<string>('60');

  // Fetch courts
  const { data: courts, isLoading: courtsLoading } = trpc.courts.list.useQuery({
    sport: selectedSport,
  });

  // Fetch availability for selected court and date
  const { isLoading: availabilityLoading } = trpc.courts.availability.useQuery(
    {
      courtId: selectedCourt?.id,
      date: selectedDate,
      sport: selectedSport,
    },
    { enabled: !!selectedCourt }
  );

  const reserveMutation = trpc.courts.reserve.useMutation({
    onSuccess: () => {
      toast.success('Court booked successfully!');
      setBookingDialog(false);
      setSelectedCourt(null);
      setSelectedTimeSlot('');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to book court');
    },
  });

  const handleBookCourt = () => {
    if (!selectedCourt || !selectedTimeSlot || !duration) {
      toast.error('Please select a time slot and duration');
      return;
    }

    const [hours, minutes] = selectedTimeSlot.split(':');
    const startDate = new Date(selectedDate);
    startDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    reserveMutation.mutate({
      courtId: selectedCourt.id,
      startDate: startDate,
      duration: parseInt(duration),
    });
  };

  const generateTimeSlots = () => {
    const slots: string[] = [];
    for (let hour = 8; hour < 22; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
      slots.push(`${hour.toString().padStart(2, '0')}:30`);
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  if (courtsLoading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="container mx-auto p-6 space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-bold flex items-center gap-2">
              <Dumbbell className="h-8 w-8" />
              Court Bookings
            </CardTitle>
            <CardDescription>
              Book basketball, tennis, or football courts at GUC Sports Complex
            </CardDescription>
          </CardHeader>
        </Card>
      </motion.div>

      {/* Sport Tabs */}
      <motion.div variants={itemVariants}>
        <Tabs value={selectedSport} onValueChange={(value: any) => setSelectedSport(value)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="BASKETBALL">Basketball</TabsTrigger>
            <TabsTrigger value="TENNIS">Tennis</TabsTrigger>
            <TabsTrigger value="FOOTBALL">Football</TabsTrigger>
          </TabsList>

          <TabsContent value={selectedSport} className="mt-6">
            {courts && courts.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {courts.map((court: any, index: number) => (
                  <motion.div
                    key={court.id}
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="h-full flex flex-col hover:shadow-lg transition-all">
                      <CardHeader>
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="text-xl">{court.name}</CardTitle>
                          <Badge>{court.sport}</Badge>
                        </div>
                        <CardDescription className="flex items-center gap-2">
                          <MapPin className="h-3 w-3" />
                          {court.location}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="flex-1 space-y-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span>Available daily</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                            <CheckCircle2 className="h-4 w-4" />
                            <span>Active</span>
                          </div>
                        </div>

                        <Button
                          className="w-full"
                          onClick={() => {
                            setSelectedCourt(court);
                            setBookingDialog(true);
                          }}
                        >
                          Check Availability & Book
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-16">
                  <div className="flex flex-col items-center justify-center gap-4">
                    <Dumbbell className="h-16 w-16 text-muted-foreground" />
                    <div className="text-center space-y-2">
                      <h3 className="text-xl font-semibold">No courts available</h3>
                      <p className="text-muted-foreground">
                        No {selectedSport.toLowerCase()} courts are currently available
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Booking Dialog */}
      <Dialog open={bookingDialog} onOpenChange={setBookingDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Book {selectedCourt?.name}</DialogTitle>
            <DialogDescription>
              Select a date and time slot for your booking
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Date Selection */}
            <div className="space-y-3">
              <Label htmlFor="booking-date">Select Date</Label>
              <Input
                id="booking-date"
                type="date"
                value={selectedDate.toISOString().split('T')[0]}
                onChange={(e) => setSelectedDate(new Date(e.target.value))}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            {/* Duration Selection */}
            <div className="space-y-3">
              <Label>Duration (minutes)</Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger>
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                  <SelectItem value="90">1.5 hours</SelectItem>
                  <SelectItem value="120">2 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Time Slot Selection */}
            <div className="space-y-3">
              <Label>Available Time Slots</Label>
              {availabilityLoading ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner />
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-2 max-h-60 overflow-y-auto p-2 border rounded-md">
                  {timeSlots.map((slot) => (
                    <Button
                      key={slot}
                      variant={selectedTimeSlot === slot ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedTimeSlot(slot)}
                      className="text-xs"
                    >
                      {slot}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setBookingDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleBookCourt}
              disabled={!selectedTimeSlot || reserveMutation.isPending}
            >
              {reserveMutation.isPending ? 'Booking...' : 'Confirm Booking'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
