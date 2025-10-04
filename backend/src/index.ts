/**
 * Express Server Entry Point
 * 
 * Main server setup with Express, tRPC, and middleware
 * 
 * @module index
 */

import express from 'express';
import cors from 'cors';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { config } from './config/env.js';
import { connectDatabase } from './config/database.js';
import { createContext } from './trpc/context.js';
import { appRouter } from './routers/app.router.js';

const app = express();

// ============================================================================
// MIDDLEWARE
// ============================================================================

// HTTPS enforcement in production
if (config.nodeEnv === 'production') {
  app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
    // Check if request is via HTTPS
    const proto = req.header('x-forwarded-proto');
    if (proto !== 'https') {
      return res.redirect(301, `https://${req.header('host')}${req.url}`);
    }
    next();
  });
}

// CORS
app.use(
  cors({
    origin: config.clientUrl,
    credentials: true,
  })
);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (_req: express.Request, res: express.Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ============================================================================
// tRPC MIDDLEWARE
// ============================================================================

app.use(
  '/trpc',
  createExpressMiddleware({
    router: appRouter,
    createContext,
    onError: (opts: any) => {
      const { error, type, path } = opts;
      console.error(`❌ tRPC Error [${type}] on ${path}:`, error);
    },
  })
);

// ============================================================================
// ERROR HANDLING
// ============================================================================

// 404 handler
app.use((_req: express.Request, res: express.Response) => {
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

// ============================================================================
// START SERVER
// ============================================================================

const startServer = async () => {
  try {
    // Connect to database
    await connectDatabase();
    
    // Start Express server
    app.listen(config.port, () => {
      console.log('\n✅ Server started successfully!');
      console.log(`🚀 API running on: ${config.apiUrl}`);
      console.log(`🔗 tRPC endpoint: ${config.apiUrl}/trpc`);
      console.log(`🌍 Environment: ${config.nodeEnv}`);
      console.log(`📡 Accepting requests from: ${config.clientUrl}\n`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('⚠️  SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('⚠️  SIGINT signal received: closing HTTP server');
  process.exit(0);
});

// Start the server
startServer();

export default app;
