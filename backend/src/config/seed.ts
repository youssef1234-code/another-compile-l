/**
 * Database Seeder
 * 
 * Creates default admin account if it doesn't exist
 * Optionally seeds comprehensive sample data
 * Runs automatically on application startup
 * 
 * @module config/seed
 */

import { User } from '../models/user.model';
import { hashPassword } from '../utils/auth.util';
import { config } from './env';
import { seedComprehensiveData } from './comprehensive-seed';

/**
 * Seed default admin account
 */
export async function seedAdminAccount(): Promise<void> {
  try {
    // Check if admin already exists
    const existingAdmin = await User.findOne({ 
      email: config.adminEmail,
      role: 'ADMIN'
    });

    if (existingAdmin) {
      console.log('✓ Admin account already exists');
      return;
    }

    // Create admin account
    const hashedPassword = await hashPassword(config.adminPassword);
    
    await User.create({
      email: config.adminEmail,
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
      status: 'ACTIVE',
      isVerified: true,
      isBlocked: false,
      roleVerifiedByAdmin: true,
    });

    console.log('✓ Default admin account created successfully');
    console.log(`  Email: ${config.adminEmail}`);
    console.log(`  Password: ${config.adminPassword}`);
    console.log('  ⚠️  IMPORTANT: Change the admin password after first login!');
  } catch (error) {
    console.error('✗ Failed to seed admin account:', error);
    throw error;
  }
}

/**
 * Run all seeders
 * 
 * On first run (when no admin exists), seeds everything:
 * - Admin account
 * - Comprehensive sample data (users, events, registrations, etc.)
 */
export async function runSeeders(): Promise<void> {
  console.log('🌱 Running database seeders...');
  
  try {
    // Check if this is first run (no admin exists)
    const existingAdmin = await User.findOne({ role: 'ADMIN' });
    const isFirstRun = !existingAdmin;
    
    if (isFirstRun) {
      console.log('\n🎉 First run detected! Seeding all data...');
      console.log('   This will create:');
      console.log('   - Admin account');
      console.log('   - Sample users (students, staff, professors, vendors)');
      console.log('   - Sample events (workshops, trips, bazaars, conferences)');
      console.log('   - Sample registrations, payments, and more\n');
    }
    
    await seedAdminAccount();
    
    // On first run, seed everything automatically
    // Can be overridden with SEED_COMPREHENSIVE=false
    const shouldSeedAll = isFirstRun && process.env.SEED_COMPREHENSIVE !== 'false';
    
    if (shouldSeedAll) {
      console.log('\n🌱 Seeding comprehensive sample data...');
      await seedComprehensiveData();
      console.log('\n🎉 Database fully seeded! You can now explore the app with sample data.');
    } else if (process.env.SEED_COMPREHENSIVE === 'true') {
      console.log('\n🌱 Seeding comprehensive sample data (forced by env variable)...');
      await seedComprehensiveData();
    }
    
    console.log('✓ Database seeding completed');
  } catch (error) {
    console.error('✗ Database seeding failed:', error);
    // Don't throw - allow app to start even if seeding fails
  }
}
