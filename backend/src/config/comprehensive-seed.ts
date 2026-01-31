/**
 * Comprehensive Database Seeder
 *
 * Seeds the database with realistic sample data:
 * - Users (all roles)
 * - Events (workshops, trips, bazaars, conferences)
 * - Registrations
 * - Courts and Court Reservations
 * - Vendor Applications
 * - Gym Sessions
 *
 * @module config/comprehensive-seed
 */

import { User } from "../models/user.model";
import { Event } from "../models/event.model";
import { Registration } from "../models/registration.model";
import { Court } from "../models/court.model";
import { CourtReservation } from "../models/court-reservation.model";
import { Payment } from "../models/payment.model";
import { hashPassword } from "../utils/auth.util";
import { config } from "./env";
import { seedInterestBasedData } from "./interests-seed";
import { seedSampleComments } from "./seed-comments";

/**
 * Sample user data for different roles
 */
const sampleUsers = [
  // Students
  {
    email: "john.doe@student.guc.edu.eg",
    password: "Password123!",
    firstName: "John",
    lastName: "Doe",
    role: "STUDENT",
    studentId: "ST-2021-001",
    gucId: "ST-2021-001",
    status: "ACTIVE",
    isVerified: true,
    isBlocked: false,
  },
  {
    email: "jane.smith@student.guc.edu.eg",
    password: "Password123!",
    firstName: "Jane",
    lastName: "Smith",
    role: "STUDENT",
    studentId: "ST-2021-002",
    gucId: "ST-2021-002",
    status: "ACTIVE",
    isVerified: true,
    isBlocked: false,
  },
  {
    email: "ahmed.hassan@student.guc.edu.eg",
    password: "Password123!",
    firstName: "Ahmed",
    lastName: "Hassan",
    role: "STUDENT",
    studentId: "ST-2021-003",
    gucId: "ST-2021-003",
    status: "ACTIVE",
    isVerified: true,
    isBlocked: false,
  },
  // Staff
  {
    email: "sarah.johnson@staff.guc.edu.eg",
    password: "Password123!",
    firstName: "Sarah",
    lastName: "Johnson",
    role: "STAFF",
    staffId: "STF-001",
    gucId: "STF-001",
    status: "ACTIVE",
    isVerified: true,
    isBlocked: false,
    roleVerifiedByAdmin: true,
  },
  {
    email: "mohamed.ali@staff.guc.edu.eg",
    password: "Password123!",
    firstName: "Mohamed",
    lastName: "Ali",
    role: "STAFF",
    staffId: "STF-002",
    gucId: "STF-002",
    status: "ACTIVE",
    isVerified: true,
    isBlocked: false,
    roleVerifiedByAdmin: true,
  },
  // TAs
  {
    email: "david.wilson@ta.guc.edu.eg",
    password: "Password123!",
    firstName: "David",
    lastName: "Wilson",
    role: "TA",
    staffId: "TA-001",
    gucId: "TA-001",
    status: "ACTIVE",
    isVerified: true,
    isBlocked: false,
    roleVerifiedByAdmin: true,
  },
  // Professors
  {
    email: "prof.brown@prof.guc.edu.eg",
    password: "Password123!",
    firstName: "Robert",
    lastName: "Brown",
    role: "PROFESSOR",
    staffId: "PROF-001",
    gucId: "PROF-001",
    status: "ACTIVE",
    isVerified: true,
    isBlocked: false,
    roleVerifiedByAdmin: true,
  },
  {
    email: "prof.davis@prof.guc.edu.eg",
    password: "Password123!",
    firstName: "Emily",
    lastName: "Davis",
    role: "PROFESSOR",
    staffId: "PROF-002",
    gucId: "PROF-002",
    status: "ACTIVE",
    isVerified: true,
    isBlocked: false,
    roleVerifiedByAdmin: true,
  },
  // Events Office
  {
    email: "events.office@guc.edu.eg",
    password: "Password123!",
    firstName: "Events",
    lastName: "Office",
    role: "EVENT_OFFICE",
    status: "ACTIVE",
    isVerified: true,
    isBlocked: false,
  },
  {
    email: "events.coordinator@guc.edu.eg",
    password: "Password123!",
    firstName: "Sarah",
    lastName: "Events",
    role: "EVENT_OFFICE",
    status: "ACTIVE",
    isVerified: true,
    isBlocked: false,
  },
  // Vendors
  {
    email: "vendor@techcompany.com",
    password: "Password123!",
    firstName: "Tech",
    lastName: "Company",
    role: "VENDOR",
    companyName: "Tech Solutions Inc.",
    status: "ACTIVE",
    isVerified: true,
    isBlocked: false,
  },
  {
    email: "vendor@foodcorp.com",
    password: "Password123!",
    firstName: "Food",
    lastName: "Corp",
    role: "VENDOR",
    companyName: "Food Corp Ltd.",
    status: "ACTIVE",
    isVerified: true,
    isBlocked: false,
  },
];

/**
 * Sample events data
 */
const sampleEvents = [
  // Workshops
  {
    name: "Introduction to Machine Learning",
    type: "WORKSHOP",
    description: "Learn the fundamentals of machine learning and AI",
    location: "GUC Cairo - C7.301",
    date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    endDate: new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000,
    ), // +3 hours
    registrationDeadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    capacity: 50,
    price: 0,
    status: "PUBLISHED",
    tags: ["AI", "ML", "Technology"],
    fullAgenda: "Day 1: Introduction to ML concepts, supervised learning...",
    faculty: "MET",
    requiredBudget: 5000,
    fundingSource: "GUC",
  },
  {
    name: "Web Development Bootcamp",
    type: "WORKSHOP",
    description: "Master modern web development with React and Node.js",
    location: "GUC Cairo - C5.201",
    date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() + 16 * 24 * 60 * 60 * 1000),
    registrationDeadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    capacity: 40,
    price: 0,
    status: "PUBLISHED",
    tags: ["Web", "React", "Node.js"],
    fullAgenda:
      "Day 1: HTML/CSS/JS basics, Day 2: React fundamentals, Day 3: Backend with Node.js",
    faculty: "IET",
    requiredBudget: 3000,
    fundingSource: "GUC",
  },
  {
    name: "Data Science Workshop",
    type: "WORKSHOP",
    description: "Explore data analysis and visualization techniques",
    location: "GUC Berlin",
    date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
    startDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
    endDate: new Date(
      Date.now() + 21 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000,
    ),
    registrationDeadline: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000),
    capacity: 35,
    price: 0,
    status: "PENDING_APPROVAL",
    tags: ["Data Science", "Python", "Analytics"],
    fullAgenda:
      "Introduction to Python, Pandas, Matplotlib, and real-world data analysis",
    faculty: "MET",
    requiredBudget: 4000,
    fundingSource: "EXTERNAL",
  },
  // Trips
  {
    name: "Alexandria Day Trip",
    type: "TRIP",
    description:
      "Visit the historic city of Alexandria and explore its landmarks",
    location: "Alexandria, Egypt",
    date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    endDate: new Date(
      Date.now() + 30 * 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000,
    ),
    registrationDeadline: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
    capacity: 60,
    price: 250,
    status: "PUBLISHED",
    tags: ["Trip", "Culture", "History"],
  },
  {
    name: "Siwa Oasis Adventure",
    type: "TRIP",
    description: "Experience the beauty of Siwa Oasis",
    location: "Siwa, Egypt",
    date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
    startDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() + 48 * 24 * 60 * 60 * 1000),
    registrationDeadline: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000),
    capacity: 40,
    price: 1200,
    status: "PUBLISHED",
    tags: ["Trip", "Adventure", "Nature"],
  },
  {
    name: "Red Sea Diving Expedition",
    type: "TRIP",
    description: "Explore the underwater wonders of the Red Sea",
    location: "Hurghada, Egypt",
    date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
    startDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000), // 13 days ago
    registrationDeadline: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
    capacity: 30,
    price: 1500,
    status: "PUBLISHED",
    tags: ["Trip", "Diving", "Adventure", "Red Sea"],
  },
  {
    name: "Luxor Historical Tour",
    type: "TRIP",
    description: "Discover ancient Egyptian temples and tombs in Luxor",
    location: "Luxor, Egypt",
    date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000), // 28 days ago
    registrationDeadline: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000),
    capacity: 50,
    price: 800,
    status: "PUBLISHED",
    tags: ["Trip", "History", "Culture", "Ancient Egypt"],
  },
  {
    name: "Dahab Relaxation Retreat",
    type: "TRIP",
    description: "Unwind in the peaceful coastal town of Dahab",
    location: "Dahab, Egypt",
    date: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000), // 45 days ago
    startDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() - 42 * 24 * 60 * 60 * 1000), // 42 days ago
    registrationDeadline: new Date(Date.now() - 55 * 24 * 60 * 60 * 1000),
    capacity: 35,
    price: 950,
    status: "PUBLISHED",
    tags: ["Trip", "Relaxation", "Beach", "Snorkeling"],
  },
  {
    name: "White Desert Camping",
    type: "TRIP",
    description: "Camp under the stars in Egypt's stunning White Desert",
    location: "White Desert, Egypt",
    date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
    startDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() - 58 * 24 * 60 * 60 * 1000), // 58 days ago
    registrationDeadline: new Date(Date.now() - 70 * 24 * 60 * 60 * 1000),
    capacity: 25,
    price: 1100,
    status: "PUBLISHED",
    tags: ["Trip", "Camping", "Desert", "Adventure"],
  },
  {
    name: "Advanced Blockchain Workshop",
    type: "WORKSHOP",
    description: "Deep dive into blockchain technology and smart contracts",
    location: "GUC Cairo - C3.105",
    date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
    startDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000), // 9 days ago
    registrationDeadline: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
    capacity: 40,
    price: 500,
    status: "PUBLISHED",
    tags: ["Workshop", "Blockchain", "Technology", "Cryptocurrency"],
    fullAgenda: "Introduction to blockchain, smart contracts, DeFi applications",
    faculty: "MET",
    requiredBudget: 4500,
    fundingSource: "GUC",
  },
  {
    name: "Professional Photography Workshop",
    type: "WORKSHOP",
    description: "Master the art of professional photography",
    location: "GUC Cairo - Media Lab",
    date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), // 20 days ago
    startDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() - 19 * 24 * 60 * 60 * 1000), // 19 days ago
    registrationDeadline: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    capacity: 30,
    price: 350,
    status: "PUBLISHED",
    tags: ["Workshop", "Photography", "Arts", "Media"],
    fullAgenda: "Camera basics, composition, lighting techniques, post-processing",
    faculty: "ARTS",
    requiredBudget: 3500,
    fundingSource: "EXTERNAL",
  },
  {
    name: "Cybersecurity Bootcamp",
    type: "WORKSHOP",
    description: "Learn ethical hacking and network security fundamentals",
    location: "GUC Cairo - C7.205",
    date: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000), // 35 days ago
    startDate: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() - 33 * 24 * 60 * 60 * 1000), // 33 days ago
    registrationDeadline: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
    capacity: 35,
    price: 600,
    status: "PUBLISHED",
    tags: ["Workshop", "Cybersecurity", "Technology", "Ethical Hacking"],
    fullAgenda: "Network security, penetration testing, secure coding practices",
    faculty: "MET",
    requiredBudget: 5500,
    fundingSource: "GUC",
  },
  {
    name: "UX/UI Design Masterclass",
    type: "WORKSHOP",
    description: "Create stunning user experiences and interfaces",
    location: "GUC Cairo - Design Studio",
    date: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000), // 50 days ago
    startDate: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() - 49 * 24 * 60 * 60 * 1000), // 49 days ago
    registrationDeadline: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
    capacity: 25,
    price: 450,
    status: "PUBLISHED",
    tags: ["Workshop", "Design", "UX", "UI", "Technology"],
    fullAgenda: "Design thinking, wireframing, prototyping, user testing",
    faculty: "ARTS",
    requiredBudget: 4000,
    fundingSource: "EXTERNAL",
  },
  {
    name: "Entrepreneurship Summit 2024",
    type: "CONFERENCE",
    description: "Connect with entrepreneurs and learn startup strategies",
    location: "GUC Cairo - Conference Hall",
    date: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000), // 25 days ago
    startDate: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() - 24 * 24 * 60 * 60 * 1000), // 24 days ago
    registrationDeadline: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000),
    capacity: 100,
    price: 300,
    status: "PUBLISHED",
    tags: ["Conference", "Entrepreneurship", "Business", "Startups"],
    fullAgenda: "Keynote speakers, pitch competitions, networking sessions, workshops",
    websiteUrl: "https://entrepreneurship-summit.guc.edu.eg",
    requiredBudget: 20000,
    fundingSource: "EXTERNAL",
  },
  {
    name: "Tech Innovation Bazaar",
    type: "BAZAAR",
    description: "Showcase cutting-edge technology and innovation products",
    location: "GUC Campus - Innovation Hub",
    date: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000), // 40 days ago
    startDate: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() - 39 * 24 * 60 * 60 * 1000), // 39 days ago
    registrationDeadline: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000),
    capacity: 80,
    price: 200,
    status: "PUBLISHED",
    tags: ["Bazaar", "Technology", "Innovation", "Startups"],
  },
  // Bazaars
  {
    name: "Spring Tech Bazaar",
    type: "BAZAAR",
    description: "Discover the latest tech products and innovations",
    location: "GUC Campus - Main Plaza",
    date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    startDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
    registrationDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    capacity: 100,
    price: 0,
    status: "PUBLISHED",
    tags: ["Bazaar", "Technology", "Shopping"],
  },
  {
    name: "Food Festival Bazaar",
    type: "BAZAAR",
    description: "Taste delicious food from various local vendors",
    location: "GUC Campus - Platform Area",
    date: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
    startDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
    registrationDeadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
    capacity: 150,
    price: 0,
    status: "PUBLISHED",
    tags: ["Bazaar", "Food", "Festival"],
  },
  // Conferences
  {
    name: "International AI Conference 2025",
    type: "CONFERENCE",
    description:
      "Leading experts discuss the future of artificial intelligence",
    location: "GUC Cairo - Main Auditorium",
    date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
    startDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() + 62 * 24 * 60 * 60 * 1000),
    registrationDeadline: new Date(Date.now() + 50 * 24 * 60 * 60 * 1000),
    capacity: 200,
    price: 0,
    status: "PUBLISHED",
    tags: ["Conference", "AI", "Research"],
    fullAgenda:
      "Keynote speakers, panel discussions, workshops, and networking sessions",
    websiteUrl: "https://ai-conference.guc.edu.eg",
    requiredBudget: 50000,
    fundingSource: "EXTERNAL",
  },
  {
    name: "Sustainability Summit",
    type: "CONFERENCE",
    description: "Addressing climate change and sustainable development",
    location: "GUC Cairo - Conference Hall",
    date: new Date(Date.now() + 75 * 24 * 60 * 60 * 1000),
    startDate: new Date(Date.now() + 75 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() + 76 * 24 * 60 * 60 * 1000),
    registrationDeadline: new Date(Date.now() + 65 * 24 * 60 * 60 * 1000),
    capacity: 150,
    price: 0,
    status: "PUBLISHED",
    tags: ["Conference", "Environment", "Sustainability"],
    fullAgenda:
      "Expert talks on renewable energy, waste management, and green technology",
    websiteUrl: "https://sustainability.guc.edu.eg",
    requiredBudget: 30000,
    fundingSource: "GUC",
  },
];

/**
 * Sample courts data
 */
const sampleCourts = [
  {
    name: "Basketball Court 1",
    sport: "BASKETBALL",
    location: "GUC Sports Complex - Court A",
    operatingHours: { start: "08:00", end: "22:00" },
    isActive: true,
  },
  {
    name: "Basketball Court 2",
    sport: "BASKETBALL",
    location: "GUC Sports Complex - Court B",
    operatingHours: { start: "08:00", end: "22:00" },
    isActive: true,
  },
  {
    name: "Tennis Court 1",
    sport: "TENNIS",
    location: "GUC Sports Complex - Tennis Area",
    operatingHours: { start: "07:00", end: "21:00" },
    isActive: true,
  },
  {
    name: "Tennis Court 2",
    sport: "TENNIS",
    location: "GUC Sports Complex - Tennis Area",
    operatingHours: { start: "07:00", end: "21:00" },
    isActive: true,
  },
  {
    name: "Football Field",
    sport: "FOOTBALL",
    location: "GUC Sports Complex - Main Field",
    operatingHours: { start: "08:00", end: "20:00" },
    isActive: true,
  },
];

/**
 * Seed all data
 */
export async function seedComprehensiveData(): Promise<void> {
  console.log("🌱 Starting comprehensive database seeding...\n");

  try {
    // 1. Seed Users
    console.log("👥 Seeding users...");
    const createdUsers: any[] = [];

    for (const userData of sampleUsers) {
      const existingUser = await User.findOne({ email: userData.email });
      if (!existingUser) {
        const hashedPassword = await hashPassword(userData.password);
        const user = await User.create({
          ...userData,
          password: hashedPassword,
        });
        createdUsers.push(user);
        console.log(`  ✓ Created ${userData.role}: ${userData.email}`);
      } else {
        createdUsers.push(existingUser);
        console.log(`  ⊚ Skipped (exists): ${userData.email}`);
      }
    }

    // 2. Seed Events
    console.log("\n📅 Seeding events...");
    const createdEvents: any[] = [];
    const professors = createdUsers.filter((u) => u.role === "PROFESSOR");
    const eventsOffice = createdUsers.filter((u) => u.role === "EVENT_OFFICE");

    for (const eventData of sampleEvents) {
      const existingEvent = await Event.findOne({ name: eventData.name });
      if (!existingEvent) {
        // Assign creator based on event type
        let createdBy;
        const eventPayload: any = { ...eventData };

        if (eventData.type === "WORKSHOP") {
          createdBy =
            professors[Math.floor(Math.random() * professors.length)]?._id;
          eventPayload.professorParticipants = [createdBy];
        } else {
          createdBy = eventsOffice[0]?._id;
        }

        eventPayload.createdBy = createdBy;

        const event = await Event.create(eventPayload);
        createdEvents.push(event);
      } else {
        createdEvents.push(existingEvent);
      }
    }

    // 3. Seed Registrations
    console.log("\n🎫 Seeding registrations...");
    const students = createdUsers.filter(
      (u) => u.role === "STUDENT" || u.role === "STAFF" || u.role === "TA",
    );
    const publishedEvents = createdEvents.filter(
      (e) => e.status === "PUBLISHED",
    );

    let paymentCount = 0;

    for (const student of students) {
      // Register each student for 2-3 random events
      const eventsToRegister = publishedEvents
        .sort(() => 0.5 - Math.random())
        .slice(0, Math.floor(Math.random() * 2) + 2);

      for (const event of eventsToRegister) {
        const existingReg = await Registration.findOne({
          user: student._id,
          event: event._id,
        });

        if (!existingReg) {
          const registration = await Registration.create({
            user: student._id,
            event: event._id,
            status: "CONFIRMED",
            registeredAt: new Date(),
          } as any);
          console.log(`  ✓ Registered ${student.firstName} for ${event.name}`);

          // Create payment if event is not free
          if (event.price && event.price > 0) {
            const paymentMethod = Math.random() > 0.5 ? "STRIPE_CARD" : "WALLET";

            // Generate random date within the past month
            const now = new Date();
            const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            const randomTimestamp = oneMonthAgo.getTime() + Math.random() * (now.getTime() - oneMonthAgo.getTime());
            const randomDate = new Date(randomTimestamp);

            await Payment.create({
              user: student._id,
              registration: registration._id,
              event: event._id,
              method: paymentMethod,
              status: "SUCCEEDED",
              amountMinor: event.price, // Convert to minor units (cents)
              currency: "EGP",
              purpose: "EVENT_PAYMENT",
              createdAt: randomDate,
            });

            paymentCount++;
            console.log(`    💳 Created ${paymentMethod} payment of ${event.price} EGP`);
          }
        }
      }
    }

    // 4. Seed Courts
    console.log("\n🏀 Seeding courts...");
    for (const courtData of sampleCourts) {
      const existingCourt = await Court.findOne({ name: courtData.name });
      if (!existingCourt) {
        await Court.create(courtData);
        console.log(`  ✓ Created court: ${courtData.name}`);
      } else {
        console.log(`  ⊚ Skipped (exists): ${courtData.name}`);
      }
    }

    // 5. Seed Court Reservations
    console.log("\n🎾 Seeding court reservations...");
    const courts = await Court.find({ isActive: true });
    const studentUsers = createdUsers.filter((u) => u.role === "STUDENT" || u.role === "STAFF" || u.role === "TA");

    // Create reservations for the next 14 days with varied times
    const reservationTimeSlots = [
      { hour: 9, minute: 0 },   // 9:00 AM
      { hour: 11, minute: 0 },  // 11:00 AM
      { hour: 13, minute: 0 },  // 1:00 PM
      { hour: 15, minute: 0 },  // 3:00 PM
      { hour: 17, minute: 0 },  // 5:00 PM
      { hour: 19, minute: 0 },  // 7:00 PM
      { hour: 21, minute: 0 },  // 9:00 PM
    ];

    let reservationCount = 0;

    // Create reservations for next 14 days
    for (let dayOffset = 0; dayOffset < 14; dayOffset++) {
      // For each court, create 2-4 random reservations per day
      for (const court of courts) {
        const reservationsPerDay = Math.floor(Math.random() * 3) + 2; // 2-4 reservations

        // Shuffle time slots and pick some
        const shuffledSlots = [...reservationTimeSlots].sort(() => 0.5 - Math.random());
        const selectedSlots = shuffledSlots.slice(0, reservationsPerDay);

        for (const timeSlot of selectedSlots) {
          const randomStudent = studentUsers[Math.floor(Math.random() * studentUsers.length)];

          // Create date for this reservation
          const reservationDate = new Date();
          reservationDate.setDate(reservationDate.getDate() + dayOffset);
          reservationDate.setHours(timeSlot.hour, timeSlot.minute, 0, 0);

          // Duration: 60 or 90 minutes
          const durationMinutes = Math.random() > 0.5 ? 60 : 90;
          const endDate = new Date(reservationDate.getTime() + durationMinutes * 60 * 1000);

          // Derive studentGucId from available fields
          const derivedStudentGucId =
            (randomStudent as any).studentId ||
            (randomStudent as any).staffId ||
            (randomStudent as any).gucId ||
            ((randomStudent as any).email ? (randomStudent as any).email.split('@')[0] : `GUC-${String(randomStudent._id).slice(-6)}`);

          // Check if this time slot is already reserved
          const existingReservation = await CourtReservation.findOne({
            court: court._id,
            startDate: reservationDate,
          });

          if (!existingReservation) {
            await CourtReservation.create({
              court: court._id,
              user: randomStudent._id,
              studentName: `${randomStudent.firstName} ${randomStudent.lastName}`,
              studentGucId: derivedStudentGucId,
              startDate: reservationDate,
              endDate,
              duration: durationMinutes,
              status: "BOOKED",
            } as any);

            reservationCount++;

            if (reservationCount <= 5) {
              console.log(
                `  ✓ Created reservation for ${randomStudent.firstName} at ${court.name} on ${reservationDate.toLocaleDateString()} at ${timeSlot.hour}:00`,
              );
            }
          }
        }
      }
    }

    console.log(`  ✓ Created ${reservationCount} total court reservations across ${courts.length} courts`);

    // 6. Seed Interest-Based Users and Events (for AI recommendations testing)
    console.log("\n🎯 Seeding interest-based users and events...");
    try {
      await seedInterestBasedData();
    } catch (error) {
      console.error("  ⚠️  Interest-based seeding failed:", error);
      // Continue anyway
    }

    // 7. Seed Sample Comments (for AI moderation testing)
    console.log("\n💬 Seeding sample comments...");
    try {
      await seedSampleComments();
    } catch (error) {
      console.error("  ⚠️  Comment seeding failed:", error);
      // Continue anyway
    }

    console.log("\n✅ Comprehensive database seeding completed successfully!");
    console.log("\n📊 Summary:");
    console.log(`   Users: ${createdUsers.length}`);
    console.log(`   Events: ${createdEvents.length}`);
    console.log(`   Courts: ${courts.length}`);
    console.log(`   Court Reservations: ${reservationCount}`);
    console.log(`   Payments: ${paymentCount}`);
    console.log("\n🔐 Sample Credentials:");
    console.log("   Student: john.doe@student.guc.edu.eg / Password123!");
    console.log("   Professor: prof.brown@prof.guc.edu.eg / Password123!");
    console.log("   Events Office: events.office@guc.edu.eg / Password123!");
    console.log("   Vendor: vendor@techcompany.com / Password123!");
    console.log(`   Admin: ${config.adminEmail} / ${config.adminPassword}`);
  } catch (error) {
    console.error("✗ Comprehensive seeding failed:", error);
    throw error;
  }
}
