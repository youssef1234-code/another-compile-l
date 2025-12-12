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
        faculty: 'BUSINESS',
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
        faculty: 'MET',
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
        faculty: 'BUSINESS',
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

      // More Tech Events
      {
        name: 'Python Programming Intensive',
        description: 'Master Python from basics to advanced. Learn data structures, algorithms, and build real projects. Perfect for programming enthusiasts.',
        type: 'WORKSHOP',
        faculty: 'MET',
        location: 'C7.303',
        startDate: new Date(now.getTime() + 16 * 24 * 60 * 60 * 1000),
        endDate: new Date(now.getTime() + 16 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
        price: 65,
        capacity: 45,
        status: 'PUBLISHED',
        isArchived: false,
        createdBy: creator!._id,
      },
      {
        name: 'Hackathon 2025: Build the Future',
        description: '24-hour coding marathon. Build innovative tech solutions with your team. Prizes for best AI, web, and mobile apps!',
        type: 'CONFERENCE',
        faculty: 'MET',
        location: 'Innovation Hub',
        startDate: new Date(now.getTime() + 18 * 24 * 60 * 60 * 1000),
        endDate: new Date(now.getTime() + 19 * 24 * 60 * 60 * 1000),
        price: 100,
        capacity: 80,
        status: 'PUBLISHED',
        isArchived: false,
        createdBy: creator!._id,
      },
      {
        name: 'Cybersecurity & Ethical Hacking',
        description: 'Learn cybersecurity fundamentals, penetration testing, and ethical hacking techniques. For tech security enthusiasts.',
        type: 'WORKSHOP',
        faculty: 'MET',
        location: 'C7.304',
        startDate: new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000),
        endDate: new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000),
        price: 70,
        capacity: 40,
        status: 'PUBLISHED',
        isArchived: false,
        createdBy: creator!._id,
      },
      {
        name: 'Mobile App Development with Flutter',
        description: 'Build cross-platform mobile apps with Flutter. Learn Dart, widgets, and publish to app stores. Great for developers.',
        type: 'WORKSHOP',
        faculty: 'MET',
        location: 'C7.305',
        startDate: new Date(now.getTime() + 22 * 24 * 60 * 60 * 1000),
        endDate: new Date(now.getTime() + 22 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
        price: 80,
        capacity: 35,
        status: 'PUBLISHED',
        isArchived: false,
        createdBy: creator!._id,
      },
      {
        name: 'Data Science & Analytics Bootcamp',
        description: 'Master data analysis, visualization, and machine learning with Python. Perfect for AI and programming enthusiasts.',
        type: 'WORKSHOP',
        faculty: 'MET',
        location: 'C7.306',
        startDate: new Date(now.getTime() + 24 * 24 * 60 * 60 * 1000),
        endDate: new Date(now.getTime() + 24 * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000),
        price: 90,
        capacity: 50,
        status: 'PUBLISHED',
        isArchived: false,
        createdBy: creator!._id,
      },

      // More Sports/Fitness Events
      {
        name: 'Football League Finals',
        description: 'Championship match! Watch or join the final football tournament. Great for sports lovers and football fans.',
        type: 'TRIP',
        location: 'Main Stadium',
        startDate: new Date(now.getTime() + 17 * 24 * 60 * 60 * 1000),
        endDate: new Date(now.getTime() + 17 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
        price: 25,
        capacity: 100,
        status: 'PUBLISHED',
        isArchived: false,
        createdBy: creator!._id,
      },
      {
        name: 'Yoga & Meditation Retreat',
        description: 'Find your inner peace with professional yoga instructors. Learn meditation, breathing techniques, and wellness practices.',
        type: 'TRIP',
        location: 'Wellness Center',
        startDate: new Date(now.getTime() + 19 * 24 * 60 * 60 * 1000),
        endDate: new Date(now.getTime() + 19 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000),
        price: 35,
        capacity: 40,
        status: 'PUBLISHED',
        isArchived: false,
        createdBy: creator!._id,
      },
      {
        name: 'CrossFit Training Program',
        description: 'High-intensity fitness training. Build strength, endurance, and athletic performance. For serious fitness enthusiasts.',
        type: 'WORKSHOP',
        location: 'Fitness Center',
        startDate: new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000),
        endDate: new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
        price: 45,
        capacity: 30,
        status: 'PUBLISHED',
        isArchived: false,
        createdBy: creator!._id,
      },
      {
        name: 'Sports Medicine & Injury Prevention',
        description: 'Learn how to prevent sports injuries, proper warm-up techniques, and recovery methods. Essential for athletes.',
        type: 'WORKSHOP',
        faculty: 'PHARMACY',
        location: 'C5.202',
        startDate: new Date(now.getTime() + 23 * 24 * 60 * 60 * 1000),
        endDate: new Date(now.getTime() + 23 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
        price: 40,
        capacity: 50,
        status: 'PUBLISHED',
        isArchived: false,
        createdBy: creator!._id,
      },
      {
        name: 'Marathon Training Workshop',
        description: 'Prepare for your first marathon! Learn training plans, nutrition strategies, and running techniques for endurance sports.',
        type: 'WORKSHOP',
        location: 'Sports Complex',
        startDate: new Date(now.getTime() + 25 * 24 * 60 * 60 * 1000),
        endDate: new Date(now.getTime() + 25 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000),
        price: 30,
        capacity: 60,
        status: 'PUBLISHED',
        isArchived: false,
        createdBy: creator!._id,
      },

      // More Business Events
      {
        name: 'Startup Funding & Investor Pitch',
        description: 'Learn how to pitch to investors, raise funding, and scale your startup. Network with angel investors and VCs.',
        type: 'CONFERENCE',
        location: 'Business Center',
        startDate: new Date(now.getTime() + 26 * 24 * 60 * 60 * 1000),
        endDate: new Date(now.getTime() + 26 * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000),
        price: 85,
        capacity: 100,
        status: 'PUBLISHED',
        isArchived: false,
        createdBy: creator!._id,
      },
      {
        name: 'E-Commerce Business Masterclass',
        description: 'Build and scale an online business. Learn about dropshipping, Amazon FBA, and digital marketing strategies.',
        type: 'WORKSHOP',
        faculty: 'BUSINESS',
        location: 'C6.102',
        startDate: new Date(now.getTime() + 28 * 24 * 60 * 60 * 1000),
        endDate: new Date(now.getTime() + 28 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
        price: 75,
        capacity: 40,
        status: 'PUBLISHED',
        isArchived: false,
        createdBy: creator!._id,
      },
      {
        name: 'Financial Planning & Investment',
        description: 'Master personal finance, stock market investing, and wealth building. Perfect for finance and business enthusiasts.',
        type: 'WORKSHOP',
        faculty: 'BUSINESS',
        location: 'C6.103',
        startDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
        endDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000),
        price: 70,
        capacity: 55,
        status: 'PUBLISHED',
        isArchived: false,
        createdBy: creator!._id,
      },
      {
        name: 'Leadership & Team Management',
        description: 'Develop leadership skills, learn team dynamics, and become an effective manager. Essential for entrepreneurs.',
        type: 'WORKSHOP',
        faculty: 'BUSINESS',
        location: 'C6.104',
        startDate: new Date(now.getTime() + 32 * 24 * 60 * 60 * 1000),
        endDate: new Date(now.getTime() + 32 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
        price: 60,
        capacity: 45,
        status: 'PUBLISHED',
        isArchived: false,
        createdBy: creator!._id,
      },
      {
        name: 'Networking Night: Meet Entrepreneurs',
        description: 'Connect with successful business owners, startup founders, and industry leaders. Expand your professional network.',
        type: 'CONFERENCE',
        location: 'Business Lounge',
        startDate: new Date(now.getTime() + 34 * 24 * 60 * 60 * 1000),
        endDate: new Date(now.getTime() + 34 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000),
        price: 50,
        capacity: 80,
        status: 'PUBLISHED',
        isArchived: false,
        createdBy: creator!._id,
      },

      // More Arts/Creative Events
      {
        name: 'Digital Art & Graphic Design',
        description: 'Master Adobe Creative Suite. Learn illustration, photo editing, and design principles. For creative designers.',
        type: 'WORKSHOP',
        faculty: 'ARTS',
        location: 'Design Studio',
        startDate: new Date(now.getTime() + 27 * 24 * 60 * 60 * 1000),
        endDate: new Date(now.getTime() + 27 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
        price: 55,
        capacity: 35,
        status: 'PUBLISHED',
        isArchived: false,
        createdBy: creator!._id,
      },
      {
        name: 'Film Making & Video Production',
        description: 'Learn cinematography, editing, and storytelling. Create your own short films. Perfect for creative minds.',
        type: 'WORKSHOP',
        faculty: 'ARTS',
        location: 'Media Lab',
        startDate: new Date(now.getTime() + 29 * 24 * 60 * 60 * 1000),
        endDate: new Date(now.getTime() + 29 * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000),
        price: 65,
        capacity: 30,
        status: 'PUBLISHED',
        isArchived: false,
        createdBy: creator!._id,
      },
      {
        name: 'Creative Writing Masterclass',
        description: 'Develop your writing skills, learn storytelling techniques, and publish your work. For aspiring authors and writers.',
        type: 'WORKSHOP',
        faculty: 'ARTS',
        location: 'Library Auditorium',
        startDate: new Date(now.getTime() + 31 * 24 * 60 * 60 * 1000),
        endDate: new Date(now.getTime() + 31 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000),
        price: 45,
        capacity: 40,
        status: 'PUBLISHED',
        isArchived: false,
        createdBy: creator!._id,
      },
      {
        name: 'Music Production & Sound Design',
        description: 'Create beats, mix tracks, and produce professional music. Learn DAWs, synthesis, and audio engineering.',
        type: 'WORKSHOP',
        faculty: 'ARTS',
        location: 'Recording Studio',
        startDate: new Date(now.getTime() + 33 * 24 * 60 * 60 * 1000),
        endDate: new Date(now.getTime() + 33 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
        price: 70,
        capacity: 25,
        status: 'PUBLISHED',
        isArchived: false,
        createdBy: creator!._id,
      },
      {
        name: 'Theater Performance Workshop',
        description: 'Learn acting techniques, stage presence, and improvisation. Perform in our final showcase. For theater lovers.',
        type: 'WORKSHOP',
        faculty: 'ARTS',
        location: 'Theater Hall',
        startDate: new Date(now.getTime() + 35 * 24 * 60 * 60 * 1000),
        endDate: new Date(now.getTime() + 35 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000),
        price: 50,
        capacity: 35,
        status: 'PUBLISHED',
        isArchived: false,
        createdBy: creator!._id,
      },

      // More Science/Research Events
      {
        name: 'Quantum Computing Introduction',
        description: 'Explore the future of computing. Learn quantum mechanics basics, qubits, and quantum algorithms. For science enthusiasts.',
        type: 'WORKSHOP',
        faculty: 'MET',
        location: 'C3.202',
        startDate: new Date(now.getTime() + 36 * 24 * 60 * 60 * 1000),
        endDate: new Date(now.getTime() + 36 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000),
        price: 75,
        capacity: 40,
        status: 'PUBLISHED',
        isArchived: false,
        createdBy: creator!._id,
      },
      {
        name: 'Biotechnology & Genetic Engineering',
        description: 'Discover CRISPR, gene editing, and biotech innovations. Learn lab techniques and research methodologies.',
        type: 'WORKSHOP',
        faculty: 'PHARMACY',
        location: 'Bio Lab',
        startDate: new Date(now.getTime() + 38 * 24 * 60 * 60 * 1000),
        endDate: new Date(now.getTime() + 38 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
        price: 85,
        capacity: 35,
        status: 'PUBLISHED',
        isArchived: false,
        createdBy: creator!._id,
      },
      {
        name: 'Renewable Energy & Solar Power',
        description: 'Learn about sustainable energy solutions, solar panel technology, and green innovations. For sustainability researchers.',
        type: 'CONFERENCE',
        faculty: 'MET',
        location: 'Engineering Building',
        startDate: new Date(now.getTime() + 40 * 24 * 60 * 60 * 1000),
        endDate: new Date(now.getTime() + 40 * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000),
        price: 70,
        capacity: 90,
        status: 'PUBLISHED',
        isArchived: false,
        createdBy: creator!._id,
      },
      {
        name: 'Space Science & Astronomy Night',
        description: 'Stargazing event with telescopes! Learn about planets, stars, and the universe. Perfect for science and physics enthusiasts.',
        type: 'TRIP',
        location: 'Observatory',
        startDate: new Date(now.getTime() + 42 * 24 * 60 * 60 * 1000),
        endDate: new Date(now.getTime() + 42 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
        price: 40,
        capacity: 50,
        status: 'PUBLISHED',
        isArchived: false,
        createdBy: creator!._id,
      },
      {
        name: 'Chemistry Lab: Advanced Experiments',
        description: 'Hands-on chemistry experiments, synthesis techniques, and analytical methods. For chemistry and research enthusiasts.',
        type: 'WORKSHOP',
        faculty: 'PHARMACY',
        location: 'Chemistry Lab',
        startDate: new Date(now.getTime() + 44 * 24 * 60 * 60 * 1000),
        endDate: new Date(now.getTime() + 44 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000),
        price: 60,
        capacity: 30,
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
