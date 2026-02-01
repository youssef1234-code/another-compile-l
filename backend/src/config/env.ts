/**
 * Environment Configuration
 * 
 * Centralized configuration for environment variables
 * 
 * @module config/env
 */

import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Server
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  apiUrl: process.env.API_URL || 'http://localhost:5000',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  
  // Database
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/event-manager',
  
  // JWT
  jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m', // Short-lived access tokens
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d', // Long-lived refresh tokens
  
  // Email (Mailgun)
  mailgun: {
    apiKey: process.env.MAILGUN_API_KEY || '',
    domain: process.env.MAILGUN_DOMAIN || '',
    region: process.env.MAILGUN_REGION || 'eu', // 'eu' or 'us'
  },
  emailFrom: process.env.EMAIL_FROM || 'Event Manager <noreply@eventmanager.com>',
  
  // Stripe
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
  },
  
  // Other
  bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '10', 10),
  verificationTokenExpires: process.env.VERIFICATION_TOKEN_EXPIRES || '24h',
  
  // Default Admin Account
  adminEmail: process.env.ADMIN_EMAIL || 'admin@email.com',
  adminPassword: process.env.ADMIN_PASSWORD || 'admin',
} as const;

export const isProduction = config.nodeEnv === 'production';
export const isDevelopment = config.nodeEnv === 'development';
