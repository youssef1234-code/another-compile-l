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
app.get('/health', async (_req, res) => {
  await ensureDbConnected();
  const dbName = (await import('mongoose')).default.connection.db?.databaseName;
  const collections = await (await import('mongoose')).default.connection.db?.listCollections().toArray();
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    database: dbName,
    collections: collections?.map(c => c.name) || []
  });
});

// Debug endpoint to check DB and force seeding
app.get('/debug/db-status', async (_req, res) => {
  try {
    await ensureDbConnected();
    
    // Wait a bit for connection to be ready
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const mongoose = (await import('mongoose')).default;
    
    // Check if connected
    if (mongoose.connection.readyState !== 1) {
      return res.json({ 
        connected: false,
        readyState: mongoose.connection.readyState,
        message: 'Database not connected'
      });
    }
    
    const db = mongoose.connection.db;
    if (!db) {
      return res.json({ 
        connected: false,
        message: 'Database object not available'
      });
    }
    
    const dbName = db.databaseName;
    const collections = await db.listCollections().toArray();
    const usersCount = await db.collection('users').countDocuments();
    const eventsCount = await db.collection('events').countDocuments();
    
    res.json({ 
      connected: true,
      database: dbName,
      collections: collections?.map(c => c.name) || [],
      counts: {
        users: usersCount,
        events: eventsCount
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message, stack: error.stack });
  }
});

// Force seed endpoint - manually trigger comprehensive seeding
app.post('/debug/force-seed', async (_req, res) => {
  const logs: string[] = [];
  const originalLog = console.log;
  const originalError = console.error;
  
  // Capture console output
  console.log = (...args) => {
    logs.push(args.join(' '));
    originalLog(...args);
  };
  console.error = (...args) => {
    logs.push('ERROR: ' + args.join(' '));
    originalError(...args);
  };
  
  try {
    await ensureDbConnected();
    logs.push('Database connected');
    
    const { seedComprehensiveData } = await import('../src/config/comprehensive-seed.js');
    logs.push('Starting comprehensive seed...');
    
    await seedComprehensiveData();
    
    logs.push('Seed completed successfully');
    
    // Get final counts
    const mongoose = (await import('mongoose')).default;
    const db = mongoose.connection.db;
    const usersCount = await db?.collection('users').countDocuments();
    const eventsCount = await db?.collection('events').countDocuments();
    
    res.json({ 
      success: true, 
      logs,
      counts: {
        users: usersCount,
        events: eventsCount
      }
    });
  } catch (error: any) {
    logs.push('ERROR: ' + error.message);
    res.status(500).json({ 
      success: false, 
      error: error.message, 
      stack: error.stack,
      logs 
    });
  } finally {
    // Restore console
    console.log = originalLog;
    console.error = originalError;
  }
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
  async (_req, _res, next) => {
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
