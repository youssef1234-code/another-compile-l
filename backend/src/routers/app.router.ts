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
import { fileRouter } from './file.router.js';
import { vendorApplicationRouter } from './vendor-application.router.js';
import { courtsRouter } from './courts.router.js';
import { platformMapRouter } from './platform-map.router.js';
import { paymentRouter } from './payment.router.js';
import { feedbackRouter } from './feedback.router.js';
import { loyaltyRouter } from './loyalty.router.js';
import { registrationsRouter } from './registrations.router.js';
import { notificationsRouter } from './notifications.router.js';
import { vendorPollRouter } from './vendor-poll.router.js';
import { qrCodesRouter } from './qr-codes.router.js';
import { certificatesRouter } from './certificates.router.js';

export const appRouter = router({
  auth: authRouter,
  events: eventsRouter,
  files: fileRouter,
  vendorApplications: vendorApplicationRouter,
  vendorPolls: vendorPollRouter,
  courts: courtsRouter,
  platformMaps: platformMapRouter,
  payments: paymentRouter,
  feedback: feedbackRouter,
  loyalty: loyaltyRouter,
  registrations: registrationsRouter,
  notifications: notificationsRouter,
  qrCodes: qrCodesRouter,
  certificates: certificatesRouter,
});

export type AppRouter = typeof appRouter;
