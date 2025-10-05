/**
 * Database Seeder
 * 
 * Creates default admin account if it doesn't exist
 * Runs automatically on application startup
 * 
 * @module config/seed
 */

import { User } from '../models/user.model';
import { hashPassword } from '../utils/auth.util';
import { config } from './env';

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
 */
export async function runSeeders(): Promise<void> {
  console.log('🌱 Running database seeders...');
  
  try {
    await seedAdminAccount();
    console.log('✓ Database seeding completed');
  } catch (error) {
    console.error('✗ Database seeding failed:', error);
    // Don't throw - allow app to start even if seeding fails
  }
}
