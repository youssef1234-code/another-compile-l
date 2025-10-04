/**
 * Events Page
 * 
 * Main events listing page with search, filters, and grid display
 * Features:
 * - Event search and filtering
 * - Responsive grid layout
 * - Pagination
 * - Loading states and empty states
 * - Beautiful animations
 */

import { motion } from 'framer-motion';
import { Calendar } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { useEventsStore } from '@/store/eventsStore';
import { EventCard } from '../components/EventCard';
import { EventSearchBar } from '../components/EventSearchBar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
    },
  },
};

export function EventsPage() {
  const { filters, page, limit, setPage } = useEventsStore();

  // Fetch events with filters
  const { data: eventsData, isLoading } = trpc.events.getEvents.useQuery({
    page,
    limit,
    search: filters.search || undefined,
    type: filters.type,
    location: filters.location,
    startDate: filters.startDate,
    endDate: filters.endDate,
    minPrice: filters.minPrice,
    maxPrice: filters.maxPrice,
    onlyUpcoming: filters.onlyUpcoming,
  });

  const events = eventsData?.events || [];
  const totalPages = Math.ceil((eventsData?.total || 0) / limit);

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
              <Calendar className="h-8 w-8" />
              Events
            </CardTitle>
            <CardDescription>
              Discover and register for upcoming events at GUC
            </CardDescription>
          </CardHeader>
        </Card>
      </motion.div>

      {/* Search and Filters */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardContent className="pt-6">
            <EventSearchBar />
          </CardContent>
        </Card>
      </motion.div>

      {/* Events Grid */}
      <motion.div variants={itemVariants}>
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <Card key={index} className="overflow-hidden">
                <Skeleton className="h-48 w-full" />
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                </CardHeader>
                <CardContent className="space-y-3">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-3/4" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : events.length === 0 ? (
          <Card>
            <CardContent className="py-16">
              <div className="flex flex-col items-center justify-center gap-4">
                <Calendar className="h-16 w-16 text-muted-foreground" />
                <div className="text-center space-y-2">
                  <h3 className="text-xl font-semibold">No events found</h3>
                  <p className="text-muted-foreground">
                    Try adjusting your search or filters to find more events
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event: any, index: number) => (
                <EventCard key={event.id} event={event} index={index} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card>
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        Showing {events.length} of {eventsData?.total || 0} events
                        {page > 1 && ` (Page ${page} of ${totalPages})`}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage(page - 1)}
                          disabled={page === 1 || isLoading}
                        >
                          Previous
                        </Button>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: Math.min(5, totalPages) }).map((_, index) => {
                            const pageNum = index + 1;
                            return (
                              <Button
                                key={pageNum}
                                variant={page === pageNum ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setPage(pageNum)}
                                className="w-9"
                              >
                                {pageNum}
                              </Button>
                            );
                          })}
                          {totalPages > 5 && (
                            <>
                              <span className="text-muted-foreground px-2">...</span>
                              <Button
                                variant={page === totalPages ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setPage(totalPages)}
                                className="w-9"
                              >
                                {totalPages}
                              </Button>
                            </>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage(page + 1)}
                          disabled={page === totalPages || isLoading}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </>
        )}
      </motion.div>
    </motion.div>
  );
}
