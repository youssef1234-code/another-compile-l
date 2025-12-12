/**
 * Seed Script Runner
 * 
 * Run this script to populate the database with sample data:
 * npm run seed:comprehensive
 */

import mongoose from 'mongoose';
import { config } from './config/env';
import { seedComprehensiveData } from './config/comprehensive-seed';
import { seedAdminAccount } from './config/seed';
import { seedInterestBasedData } from './config/interests-seed';

async function runSeeder() {
  try {
    console.log('🌱 Starting database seeding process...\n');
    
    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(config.mongodbUri);
    console.log('✅ Connected to MongoDB\n');

    // Seed admin account first
    await seedAdminAccount();

    // Check if user wants interest-based seed
    const seedInterests = process.argv.includes('--interests');
    
    if (seedInterests) {
      // Seed interest-based data (users with interests + matching events)
      await seedInterestBasedData();
    } else {
      // Seed comprehensive data
      await seedComprehensiveData();
    }

    console.log('\n✅ All seeding completed successfully!');
    console.log('\n💡 You can now login with any of the sample accounts.');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
    process.exit(1);
  }
}

runSeeder();
