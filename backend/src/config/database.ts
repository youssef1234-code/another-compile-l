/**
 * Database Configuration
 * 
 * MongoDB connection setup with Mongoose
 * 
 * @module config/database
 */

import mongoose from 'mongoose';
import { runSeeders } from './seed.js';

// Track if seeding has been done this session
let seedingCompleted = false;

/**
 * Run seeders on first connection (serverless-friendly)
 */
const runSeedersOnce = async (): Promise<void> => {
  if (seedingCompleted) {
    return;
  }

  try {
    seedingCompleted = true; // Mark as in-progress to prevent concurrent runs
    await runSeeders();
  } catch (error) {
    console.error('⚠️ Seeding error (non-fatal):', error);
    // Don't fail the app if seeding fails
  }
};

/**
 * Connect to MongoDB database
 */
export const connectDatabase = async (): Promise<void> => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/event-manager';
    
    // Log connection attempt (hide password)
    const safeUri = mongoUri.replace(/:([^@]+)@/, ':***@');
    console.log('🔗 Connecting to MongoDB:', safeUri);
    
    await mongoose.connect(mongoUri);
    
    const dbName = mongoose.connection.db?.databaseName || 'unknown';
    console.log(`✅ MongoDB connected successfully to database: ${dbName}`);
    
    // Run seeders on first connection
    await runSeedersOnce();
    
    mongoose.connection.on('error', (error) => {
      console.error('❌ MongoDB connection error:', error);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('⚠️  MongoDB disconnected');
    });
    
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error);
    process.exit(1);
  }
};

/**
 * Disconnect from MongoDB
 */
export const disconnectDatabase = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    console.log('✅ MongoDB disconnected successfully');
  } catch (error) {
    console.error('❌ Error disconnecting from MongoDB:', error);
  }
};
