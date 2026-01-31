/**
 * Vercel Serverless Function Entry Point
 * 
 * This file adapts the Express app for Vercel's serverless environment
 */

import express from 'express';
import cors from 'cors';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { config } from '../src/config/env.js';
import { connectDatabase } from '../src/config/database.js';
import { createContext } from '../src/trpc/context.js';
import { appRouter } from '../src/routers/app.router.js';
import { stripeWebhookExpressHandler } from '../src/http/stripe-webhook.js';
import { getUnmoderatedComments, batchUpdateModeration } from '../src/http/feedback-api.js';

const app = express();

// Database connection promise for caching
let dbConnectionPromise: Promise<void> | null = null;

// Ensure database is connected (with connection pooling for serverless)
const ensureDbConnected = async () => {
  if (!dbConnectionPromise) {
    dbConnectionPromise = connectDatabase();
  }
  return dbConnectionPromise;
};

// CORS - must be before other routes
app.use(
  cors({
    origin: config.clientUrl,
    credentials: true,
  })
);

// Stripe webhook must be before other middleware (needs raw body)
app.post(
  "/webhooks/stripe",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    await ensureDbConnected();
    return stripeWebhookExpressHandler(req, res);
  }
);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Feedback API endpoints
app.get('/api/feedback/unmoderated', async (req, res) => {
  await ensureDbConnected();
  return getUnmoderatedComments(req, res);
});

app.post('/api/feedback/batch-moderation', async (req, res) => {
  await ensureDbConnected();
  return batchUpdateModeration(req, res);
});

// tRPC middleware
app.use(
  '/trpc',
  async (req, res, next) => {
    await ensureDbConnected();
    next();
  },
  createExpressMiddleware({
    router: appRouter,
    createContext,
    onError: (opts: any) => {
      const { error, type, path } = opts;
      console.error(`❌ tRPC Error [${type}] on ${path}:`, error);
    },
  })
);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// Global error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('❌ Server Error:', err);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: config.nodeEnv === 'development' ? err.message : undefined,
  });
});

export default app;
