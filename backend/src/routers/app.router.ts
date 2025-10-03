/**
 * Main tRPC App Router
 * 
 * Combines all routers into a single app router
 * 
 * @module routers/app.router
 */

import { router } from '../trpc/trpc.js';
import { authRouter } from './auth.router.js';

export const appRouter = router({
  auth: authRouter,
  // Additional routers will be added here as development progresses
  // events: eventsRouter,
  // registrations: registrationsRouter,
  // feedback: feedbackRouter,
  // notifications: notificationsRouter,
  // etc.
});

export type AppRouter = typeof appRouter;
