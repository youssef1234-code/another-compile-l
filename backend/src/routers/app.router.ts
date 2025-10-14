/**
 * Main tRPC App Router
 * 
 * Combines all routers into a single app router
 * 
 * @module routers/app.router
 */

import { router } from '../trpc/trpc.js';
import { authRouter } from './auth.router.js';
import { courtsRouter } from './courts.router.js';
import { eventsRouter } from './events.router.js';
import { fileRouter } from './file.router.js';
import { vendorRouter } from './vendor.router';

export const appRouter = router({
  auth: authRouter,
  events: eventsRouter,
  files: fileRouter,
  courts: courtsRouter,
  vendor: vendorRouter,

  // Additional routers will be added here as development progresses
  // registrations: registrationsRouter,
  // feedback: feedbackRouter,
  // notifications: notificationsRouter,
  // etc.
});

export type AppRouter = typeof appRouter;
