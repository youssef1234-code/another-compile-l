/**
 * Database Configuration
 * 
 * MongoDB connection setup with Mongoose
 * 
 * @module config/database
 */

import mongoose from 'mongoose';
import { seedComprehensiveData } from './comprehensive-seed.js';

// Track if seeding has been done this session
let seedingCompleted = false;

/**
 * Check if database is empty (first run) and seed if needed
 */
const autoSeedIfEmpty = async (): Promise<void> => {
  // Skip if AUTO_SEED is explicitly disabled or seeding already done
  if (process.env.AUTO_SEED === 'false') {
    console.log('🚫 Auto-seed disabled via AUTO_SEED=false');
    return;
  }
  if (seedingCompleted) {
    console.log('⏭️ Seeding already completed this session');
    return;
  }

  try {
    // Check if any users exist
    const db = mongoose.connection.db;
    if (!db) {
      console.log('⚠️ Database connection not ready for seeding check');
      return;
    }
    
    const collections = await db.listCollections().toArray();
    console.log(`📋 Found ${collections.length} collections:`, collections.map(c => c.name).join(', ') || 'none');
    
    const hasCollections = collections && collections.length > 0;
    
    if (hasCollections) {
      // Check if users collection has data
      const usersCount = await db.collection('users').countDocuments();
      console.log(`👥 Users count: ${usersCount}`);
      if (usersCount && usersCount > 0) {
        console.log('📊 Database already has data, skipping auto-seed');
        seedingCompleted = true;
        return;
      }
    }

    console.log('🌱 First run detected - auto-seeding database...');
    await seedComprehensiveData();
    seedingCompleted = true;
    console.log('✅ Auto-seeding completed!');
  } catch (error) {
    console.error('⚠️ Auto-seed error (non-fatal):', error);
    // Don't fail the app if seeding fails
    seedingCompleted = true;
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
    
    // Auto-seed on first run
    await autoSeedIfEmpty();
    
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
