/**
 * Main tRPC App Router
 *
 * Combines all routers into a single app router
 *
 * @module routers/app.router
 */

import { router } from "../trpc/trpc.js";
import { authRouter } from "./auth.router.js";
import { eventsRouter } from "./events.router.js";
import { fileRouter } from "./file.router.js";
import { vendorApplicationRouter } from "./vendor-application.router.js";
import { courtsRouter } from './courts.router.js';
import { platformMapRouter } from './platform-map.router.js';
import { feedbackRouter } from './feedback.router.js';

export const appRouter = router({
  auth: authRouter,
  events: eventsRouter,
  files: fileRouter,
  vendorApplications: vendorApplicationRouter,
  courts: courtsRouter,
  platformMaps: platformMapRouter,
  feedback: feedbackRouter,

  // Additional routers will be added here as development progresses
  // registrations: registrationsRouter,
  // notifications: notificationsRouter,
  // etc.
});

export type AppRouter = typeof appRouter;
