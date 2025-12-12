/**
 * Interest-Based Seeder
 * 
 * Creates users with diverse interests and matching events
 * for better AI recommendation testing
 */

import { User } from "../models/user.model";
import { Event } from "../models/event.model";
import { Registration } from "../models/registration.model";
import { hashPassword } from "../utils/auth.util";

export async function seedInterestBasedData(): Promise<void> {
  console.log('🎯 Seeding interest-based users and events...');

  try {
    // Clear existing test data (optional)
    const testEmails = [
      'tech.enthusiast@student.guc.edu.eg',
      'sports.lover@student.guc.edu.eg',
      'business.minded@student.guc.edu.eg',
      'art.creative@student.guc.edu.eg',
      'science.nerd@student.guc.edu.eg'
    ];

    // Create diverse users with interests
    const hashedPassword = await hashPassword('Password123!');
    
    const usersData = [
      {
        email: 'tech.enthusiast@student.guc.edu.eg',
        password: hashedPassword,
        firstName: 'Alex',
        lastName: 'Tech',
        role: 'STUDENT',
        faculty: 'MET',
        studentId: 'ST-2024-101',
        gucId: 'ST-2024-101',
        interests: ['programming', 'AI', 'machine learning', 'web development', 'hackathons'],
        status: 'ACTIVE',
        isVerified: true,
        isBlocked: false,
      },
      {
        email: 'sports.lover@student.guc.edu.eg',
        password: hashedPassword,
        firstName: 'Jordan',
        lastName: 'Athlete',
        role: 'STUDENT',
        faculty: 'PHARMACY',
        studentId: 'ST-2024-102',
        gucId: 'ST-2024-102',
        interests: ['fitness', 'basketball', 'football', 'sports', 'wellness', 'nutrition'],
        status: 'ACTIVE',
        isVerified: true,
        isBlocked: false,
      },
      {
        email: 'business.minded@student.guc.edu.eg',
        password: hashedPassword,
        firstName: 'Morgan',
        lastName: 'Entrepreneur',
        role: 'STUDENT',
        faculty: 'MANAGEMENT',
        studentId: 'ST-2024-103',
        gucId: 'ST-2024-103',
        interests: ['entrepreneurship', 'startups', 'business', 'networking', 'marketing', 'finance'],
        status: 'ACTIVE',
        isVerified: true,
        isBlocked: false,
      },
      {
        email: 'art.creative@student.guc.edu.eg',
        password: hashedPassword,
        firstName: 'Taylor',
        lastName: 'Artist',
        role: 'STUDENT',
        faculty: 'ARTS',
        studentId: 'ST-2024-104',
        gucId: 'ST-2024-104',
        interests: ['art', 'design', 'photography', 'music', 'creative writing', 'theater'],
        status: 'ACTIVE',
        isVerified: true,
        isBlocked: false,
      },
      {
        email: 'science.nerd@student.guc.edu.eg',
        password: hashedPassword,
        firstName: 'Sam',
        lastName: 'Researcher',
        role: 'STUDENT',
        faculty: 'ENGINEERING',
        studentId: 'ST-2024-105',
        gucId: 'ST-2024-105',
        interests: ['research', 'science', 'physics', 'chemistry', 'innovation', 'sustainability'],
        status: 'ACTIVE',
        isVerified: true,
        isBlocked: false,
      },
    ];

    // Delete existing test users
    await User.deleteMany({ email: { $in: testEmails } });

    // Create users
    const createdUsers = await User.insertMany(usersData);
    console.log(`✓ Created ${createdUsers.length} users with interests`);

    // Get event office user for creating events
    const eventOffice = await User.findOne({ role: 'EVENT_OFFICE' });
    if (!eventOffice) {
      console.log('⚠️  No EVENT_OFFICE user found. Creating one...');
      await User.create({
        email: 'events.office@guc.edu.eg',
        password: hashedPassword,
        firstName: 'Events',
        lastName: 'Office',
        role: 'EVENT_OFFICE',
        status: 'ACTIVE',
        isVerified: true,
        isBlocked: false,
      });
      console.log('✓ Created EVENT_OFFICE user');
    }

    const creator = eventOffice || await User.findOne({ role: 'EVENT_OFFICE' });

    // Create diverse upcoming events (future dates)
    const now = new Date();
    const eventsData = [
      // Tech Events
      {
        name: 'AI & Machine Learning Workshop',
        description: 'Deep dive into artificial intelligence, machine learning algorithms, and practical applications. Perfect for programming enthusiasts wanting to learn AI.',
        type: 'WORKSHOP',
        faculty: 'MET',
        location: 'C7.301',
        startDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        endDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000),
        price: 50,
        capacity: 40,
        status: 'PUBLISHED',
        isArchived: false,
        createdBy: creator!._id,
      },
      {
        name: 'Web Development Bootcamp',
        description: 'Learn modern web development with React, Node.js, and MongoDB. Hands-on hackathon-style workshop for aspiring developers.',
        type: 'WORKSHOP',
        faculty: 'MET',
        location: 'C7.302',
        startDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
        endDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
        price: 75,
        capacity: 35,
        status: 'PUBLISHED',
        isArchived: false,
        createdBy: creator!._id,
      },
      {
        name: 'Tech Startup Pitch Competition',
        description: 'Present your tech startup ideas to investors. Great for programming and entrepreneurship enthusiasts looking to network.',
        type: 'CONFERENCE',
        location: 'Main Hall',
        startDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        endDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000),
        price: 30,
        capacity: 100,
        status: 'PUBLISHED',
        isArchived: false,
        createdBy: creator!._id,
      },

      // Sports/Fitness Events
      {
        name: 'Campus Basketball Tournament',
        description: 'Inter-faculty basketball championship. Show your sports skills and compete for the trophy!',
        type: 'TRIP',
        location: 'Sports Complex',
        startDate: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000),
        endDate: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000),
        price: 20,
        capacity: 80,
        status: 'PUBLISHED',
        isArchived: false,
        createdBy: creator!._id,
      },
      {
        name: 'Nutrition & Wellness Workshop',
        description: 'Learn about healthy eating, nutrition science, and wellness practices. Perfect for fitness enthusiasts and health-conscious students.',
        type: 'WORKSHOP',
        faculty: 'PHARMACY',
        location: 'C5.201',
        startDate: new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000),
        endDate: new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
        price: 40,
        capacity: 50,
        status: 'PUBLISHED',
        isArchived: false,
        createdBy: creator!._id,
      },

      // Business Events
      {
        name: 'Entrepreneurship Summit 2025',
        description: 'Network with successful entrepreneurs, learn business strategies, and discover startup opportunities. Ideal for business-minded students.',
        type: 'CONFERENCE',
        location: 'Business Center',
        startDate: new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000),
        endDate: new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000),
        price: 100,
        capacity: 150,
        status: 'PUBLISHED',
        isArchived: false,
        createdBy: creator!._id,
      },
      {
        name: 'Digital Marketing Masterclass',
        description: 'Master digital marketing, social media strategy, and brand building. Perfect for business and marketing enthusiasts.',
        type: 'WORKSHOP',
        location: 'C6.101',
        startDate: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000),
        endDate: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000),
        price: 60,
        capacity: 45,
        status: 'PUBLISHED',
        isArchived: false,
        createdBy: creator!._id,
      },
      {
        name: 'Student Startup Bazaar',
        description: 'Showcase your business ideas, network with investors, and explore entrepreneurial opportunities at our startup bazaar.',
        type: 'BAZAAR',
        location: 'Main Plaza',
        startDate: new Date(now.getTime() + 12 * 24 * 60 * 60 * 1000),
        endDate: new Date(now.getTime() + 12 * 24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000),
        price: 15,
        capacity: 200,
        status: 'PUBLISHED',
        isArchived: false,
        createdBy: creator!._id,
      },

      // Arts/Creative Events
      {
        name: 'Photography Exhibition & Workshop',
        description: 'Display your photography skills and learn advanced techniques from professional photographers. For art and design lovers.',
        type: 'WORKSHOP',
        faculty: 'ARTS',
        location: 'Art Gallery',
        startDate: new Date(now.getTime() + 9 * 24 * 60 * 60 * 1000),
        endDate: new Date(now.getTime() + 9 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
        price: 45,
        capacity: 30,
        status: 'PUBLISHED',
        isArchived: false,
        createdBy: creator!._id,
      },
      {
        name: 'Music & Theater Festival',
        description: 'Celebrate creativity with live music performances, theater shows, and artistic expressions. Perfect for creative minds.',
        type: 'TRIP',
        faculty: 'ARTS',
        location: 'Cultural Center',
        startDate: new Date(now.getTime() + 11 * 24 * 60 * 60 * 1000),
        endDate: new Date(now.getTime() + 11 * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000),
        price: 35,
        capacity: 100,
        status: 'PUBLISHED',
        isArchived: false,
        createdBy: creator!._id,
      },

      // Science/Research Events
      {
        name: 'Sustainability & Innovation Conference',
        description: 'Explore cutting-edge research in sustainability, green technology, and environmental innovation. For science enthusiasts.',
        type: 'CONFERENCE',
        faculty: 'MET',
        location: 'Engineering Building',
        startDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
        endDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000),
        price: 80,
        capacity: 120,
        status: 'PUBLISHED',
        isArchived: false,
        createdBy: creator!._id,
      },
      {
        name: 'Research Methods Workshop',
        description: 'Learn scientific research methodologies, data analysis, and academic writing. Essential for aspiring researchers.',
        type: 'WORKSHOP',
        faculty: 'MET',
        location: 'C3.201',
        startDate: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000),
        endDate: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000),
        price: 55,
        capacity: 40,
        status: 'PUBLISHED',
        isArchived: false,
        createdBy: creator!._id,
      },
    ];

    // Delete existing test events
    await Event.deleteMany({ 
      name: { 
        $in: eventsData.map(e => e.name) 
      } 
    });

    const createdEvents = await Event.insertMany(eventsData);
    console.log(`✓ Created ${createdEvents.length} diverse events`);

    // Create some sample registrations to give users history
    const techUser = createdUsers[0]; // Alex Tech
    const sportsUser = createdUsers[1]; // Jordan Athlete
    const businessUser = createdUsers[2]; // Morgan Entrepreneur

    // Tech user attends tech events
    const techEvent = createdEvents.find(e => e.name.includes('AI & Machine Learning'));
    if (techEvent) {
      await Registration.create({
        user: techUser._id,
        event: techEvent._id,
        status: 'CONFIRMED',
        paymentAmount: techEvent.price,
        paymentStatus: 'SUCCEEDED',
        registeredAt: new Date(),
        attended: false,
        certificateIssued: false,
      });
    }

    // Sports user attends sports events
    const sportsEvent = createdEvents.find(e => e.name.includes('Basketball'));
    if (sportsEvent) {
      await Registration.create({
        user: sportsUser._id,
        event: sportsEvent._id,
        status: 'CONFIRMED',
        paymentAmount: sportsEvent.price,
        paymentStatus: 'SUCCEEDED',
        registeredAt: new Date(),
        attended: false,
        certificateIssued: false,
      });
    }

    // Business user attends business events
    const businessEvent = createdEvents.find(e => e.name.includes('Entrepreneurship'));
    if (businessEvent) {
      await Registration.create({
        user: businessUser._id,
        event: businessEvent._id,
        status: 'CONFIRMED',
        paymentAmount: businessEvent.price,
        paymentStatus: 'SUCCEEDED',
        registeredAt: new Date(),
        attended: false,
        certificateIssued: false,
      });
    }

    console.log('✓ Created sample registrations with ratings');
    console.log('\n📋 Test Users Created:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Email: tech.enthusiast@student.guc.edu.eg');
    console.log('Interests: programming, AI, machine learning, web development, hackathons');
    console.log('Password: Password123!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Email: sports.lover@student.guc.edu.eg');
    console.log('Interests: fitness, basketball, football, sports, wellness, nutrition');
    console.log('Password: Password123!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Email: business.minded@student.guc.edu.eg');
    console.log('Interests: entrepreneurship, startups, business, networking, marketing, finance');
    console.log('Password: Password123!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Email: art.creative@student.guc.edu.eg');
    console.log('Interests: art, design, photography, music, creative writing, theater');
    console.log('Password: Password123!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Email: science.nerd@student.guc.edu.eg');
    console.log('Interests: research, science, physics, chemistry, innovation, sustainability');
    console.log('Password: Password123!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('✅ Interest-based seeding COMPLETED successfully!');
  } catch (error) {
    console.error('❌ Interest-based seeding failed:', error);
    throw error;
  }
}
