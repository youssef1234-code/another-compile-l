/**
 * Main tRPC App Router
 * 
 * Combines all routers into a single app router
 * 
 * @module routers/app.router
 */

import { router } from '../trpc/trpc.js';
import { authRouter } from './auth.router.js';
import { eventsRouter } from './events.router.js';

export const appRouter = router({
  auth: authRouter,
  events: eventsRouter,
  // Additional routers will be added here as development progresses
  // registrations: registrationsRouter,
  // feedback: feedbackRouter,
  // notifications: notificationsRouter,
  // etc.
});

export type AppRouter = typeof appRouter;
