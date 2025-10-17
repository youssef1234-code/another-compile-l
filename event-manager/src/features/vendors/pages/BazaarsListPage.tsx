/**
 * Bazaars List Page (Vendor View)
 * 
 * Vendors can:
 * - View all upcoming bazaars
 * - Apply to participate in bazaars
 * - See bazaar details and requirements
 * 
 * Requirement: #59, #60
 */

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'react-hot-toast';
import { ShoppingBag, Calendar, MapPin, Clock, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { LoadingSpinner } from '@/components/generic/LoadingSpinner';
import type { Event } from '@event-manager/shared';

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

interface VendorApplication {
  attendees: Array<{ name: string; email: string }>;
  boothSize: '2x2' | '4x4';
}

export function BazaarsListPage() {
  const [selectedBazaar, setSelectedBazaar] = useState<Event | null>(null);
  const [applicationDialog, setApplicationDialog] = useState(false);
  const [application, setApplication] = useState<VendorApplication>({
    attendees: [{ name: '', email: '' }],
    boothSize: '2x2',
  });

  // Fetch bazaars
  const { data: eventsData, isLoading } = trpc.events.getEvents.useQuery({
    page: 1,
    limit: 50,
    type: 'BAZAAR',
    onlyUpcoming: true,
  });

  const bazaars = (eventsData?.events || []) as Event[];

  const handleAddAttendee = () => {
    if (application.attendees.length < 5) {
      setApplication({
        ...application,
        attendees: [...application.attendees, { name: '', email: '' }],
      });
    }
  };

  const handleRemoveAttendee = (index: number) => {
    if (application.attendees.length > 1) {
      setApplication({
        ...application,
        attendees: application.attendees.filter((_, i) => i !== index),
      });
    }
  };

  const handleUpdateAttendee = (index: number, field: 'name' | 'email', value: string) => {
    const updatedAttendees = [...application.attendees];
    updatedAttendees[index][field] = value;
    setApplication({ ...application, attendees: updatedAttendees });
  };

  const handleApply = () => {
    // Validate
    const hasEmptyFields = application.attendees.some(
      (a) => !a.name.trim() || !a.email.trim()
    );
    if (hasEmptyFields) {
      toast.error('Please fill in all attendee details');
      return;
    }

    // TODO: Implement vendor application mutation
    toast.success('Application submitted successfully!');
    setApplicationDialog(false);
    setApplication({
      attendees: [{ name: '', email: '' }],
      boothSize: '2x2',
    });
  };

  if (isLoading) {
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
              <ShoppingBag className="h-8 w-8" />
              Browse Bazaars
            </CardTitle>
            <CardDescription>
              Discover upcoming bazaars and apply to participate
            </CardDescription>
          </CardHeader>
        </Card>
      </motion.div>

      {/* Bazaar Cards */}
      <motion.div variants={itemVariants}>
        {bazaars.length === 0 ? (
          <Card>
            <CardContent className="py-16">
              <div className="flex flex-col items-center justify-center gap-4">
                <ShoppingBag className="h-16 w-16 text-muted-foreground" />
                <div className="text-center space-y-2">
                  <h3 className="text-xl font-semibold">No upcoming bazaars</h3>
                  <p className="text-muted-foreground">
                    Check back later for new bazaar opportunities
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {bazaars.map((bazaar, index) => (
              <motion.div
                key={bazaar.id}
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                transition={{ delay: index * 0.05 }}
              >
                <Card className="h-full flex flex-col hover:shadow-lg transition-all">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-xl">{bazaar.name}</CardTitle>
                      <Badge variant="secondary">Bazaar</Badge>
                    </div>
                    <CardDescription className="line-clamp-2">
                      {bazaar.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {new Date(bazaar.date).toLocaleDateString()} -{' '}
                          {bazaar.endDate ? new Date(bazaar.endDate).toLocaleDateString() : 'TBD'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{bazaar.location}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>
                          Deadline:{' '}
                          {bazaar.registrationDeadline 
                            ? new Date(bazaar.registrationDeadline).toLocaleDateString()
                            : 'TBD'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {bazaar.registeredCount || 0} / {bazaar.capacity} vendors
                        </span>
                      </div>
                    </div>

                    <Button
                      className="w-full mt-auto"
                      onClick={() => {
                        setSelectedBazaar(bazaar);
                        setApplicationDialog(true);
                      }}
                      disabled={
                        (bazaar.registrationDeadline && new Date(bazaar.registrationDeadline) < new Date()) ||
                        (bazaar.registeredCount || 0) >= bazaar.capacity
                      }
                    >
                      {bazaar.registrationDeadline && new Date(bazaar.registrationDeadline) < new Date()
                        ? 'Registration Closed'
                        : (bazaar.registeredCount || 0) >= bazaar.capacity
                        ? 'Full'
                        : 'Apply to Participate'}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Application Dialog */}
      <Dialog open={applicationDialog} onOpenChange={setApplicationDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Apply to {selectedBazaar?.name}</DialogTitle>
            <DialogDescription>
              Fill in your application details to participate in this bazaar
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Booth Size */}
            <div className="space-y-3">
              <Label>Booth Size</Label>
              <Select
                value={application.boothSize}
                onValueChange={(value: any) =>
                  setApplication({ ...application, boothSize: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select booth size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2x2">2x2 meters (Standard)</SelectItem>
                  <SelectItem value="4x4">4x4 meters (Large)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Attendees */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Attendees (Max 5)</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddAttendee}
                  disabled={application.attendees.length >= 5}
                >
                  Add Attendee
                </Button>
              </div>

              <div className="space-y-4">
                {application.attendees.map((attendee, index) => (
                  <Card key={index}>
                    <CardContent className="pt-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor={`name-${index}`}>Name</Label>
                          <Input
                            id={`name-${index}`}
                            placeholder="Full name"
                            value={attendee.name}
                            onChange={(e) =>
                              handleUpdateAttendee(index, 'name', e.target.value)
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`email-${index}`}>Email</Label>
                          <Input
                            id={`email-${index}`}
                            type="email"
                            placeholder="email@example.com"
                            value={attendee.email}
                            onChange={(e) =>
                              handleUpdateAttendee(index, 'email', e.target.value)
                            }
                          />
                        </div>
                      </div>
                      {application.attendees.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-2 text-destructive"
                          onClick={() => handleRemoveAttendee(index)}
                        >
                          Remove
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setApplicationDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleApply}>Submit Application</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
