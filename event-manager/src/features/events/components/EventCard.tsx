/**
 * Event Card Component
 * 
 * Beautiful event card with animations
 * Used in events grid and lists
 */

import { motion } from 'framer-motion';
import { Calendar, MapPin, Users, DollarSign, ArrowRight, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/lib/constants';
import { trpc } from '@/lib/trpc';

type EventType = 'WORKSHOP' | 'TRIP' | 'BAZAAR' | 'CONFERENCE' | 'GYM_SESSION' | 'OTHER';
type EventLocation = 'ON_CAMPUS' | 'OFF_CAMPUS';

interface EventCardProps {
  event: {
    id: string;
    title: string;
    description: string;
    type: EventType;
    location: EventLocation;
    date: Date;
    endDate?: Date;
    capacity: number;
    registeredCount: number;
    price: number;
    imageUrl?: string;
    isArchived?: boolean;
  };
  index?: number;
}

const typeColors: Record<EventType, string> = {
  WORKSHOP: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  TRIP: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  BAZAAR: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  CONFERENCE: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  GYM_SESSION: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
  OTHER: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (index: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: index * 0.1,
      duration: 0.4,
      ease: 'easeOut',
    },
  }),
};

export function EventCard({ event, index = 0 }: EventCardProps) {
  const utils = trpc.useUtils();
  const isFull = event.registeredCount >= event.capacity;
  const availableSpots = event.capacity - event.registeredCount;

  // Check if user is already registered
  const { data: registrationStatus } = trpc.events.isRegistered.useQuery(
    { eventId: event.id },
    { enabled: !event.isArchived }
  );

  const isRegistered = registrationStatus?.isRegistered || false;

  // Register mutation
  const registerMutation = trpc.events.registerForEvent.useMutation({
    onSuccess: () => {
      toast.success('Successfully registered for event!');
      utils.events.getEvents.invalidate();
      utils.events.isRegistered.invalidate();
      utils.events.getMyRegistrations.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to register for event');
    },
  });

  const handleRegister = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    registerMutation.mutate({ eventId: event.id });
  };

  return (
    <motion.div
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover={{ y: -8, transition: { duration: 0.2 } }}
    >
      <Card className="h-full flex flex-col overflow-hidden group">
        {/* Image Placeholder */}
        <div className="relative h-48 bg-gradient-to-br from-primary/20 to-primary/5 overflow-hidden">
          {event.imageUrl ? (
            <img
              src={event.imageUrl}
              alt={event.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Calendar className="h-16 w-16 text-muted-foreground/30" />
            </div>
          )}
          
          {/* Type Badge */}
          <div className="absolute top-3 left-3">
            <Badge className={typeColors[event.type]}>
              {event.type.replace('_', ' ')}
            </Badge>
          </div>

          {/* Status Badge */}
          {event.isArchived && (
            <div className="absolute top-3 right-3">
              <Badge variant="secondary">Archived</Badge>
            </div>
          )}
          
          {isFull && !event.isArchived && (
            <div className="absolute top-3 right-3">
              <Badge variant="destructive">Full</Badge>
            </div>
          )}
        </div>

        <CardHeader>
          <CardTitle className="line-clamp-2 group-hover:text-primary transition-colors">
            {event.title}
          </CardTitle>
          <CardDescription className="line-clamp-2">
            {event.description}
          </CardDescription>
        </CardHeader>

        <CardContent className="flex-1 space-y-3">
          {/* Date */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>
              {new Date(event.date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          </div>

          {/* Location */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>{event.location === 'ON_CAMPUS' ? 'On Campus' : 'Off Campus'}</span>
          </div>

          {/* Capacity */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>
              {availableSpots > 0 ? (
                <>
                  <span className="font-medium text-foreground">{availableSpots}</span> spots left
                </>
              ) : (
                <span className="font-medium text-destructive">No spots available</span>
              )}
            </span>
          </div>

          {/* Price */}
          <div className="flex items-center gap-2 text-sm">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold text-lg text-foreground">
              {event.price === 0 ? 'Free' : `$${event.price.toFixed(2)}`}
            </span>
          </div>
        </CardContent>

        <CardFooter className="gap-2">
          {!event.isArchived && !isRegistered && (
            <Button 
              onClick={handleRegister}
              disabled={isFull || registerMutation.isPending}
              className="flex-1"
              variant={isFull ? "outline" : "default"}
            >
              {registerMutation.isPending ? 'Registering...' : isFull ? 'Full' : 'Register'}
            </Button>
          )}
          
          {isRegistered && (
            <Button disabled className="flex-1" variant="outline">
              <Check className="mr-2 h-4 w-4" />
              Registered
            </Button>
          )}
          
          <Button asChild variant="outline" className="flex-1 group/button">
            <Link to={`${ROUTES.EVENTS}/${event.id}`}>
              Details
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover/button:translate-x-1" />
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
