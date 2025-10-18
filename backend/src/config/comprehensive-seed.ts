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
import { hashPassword } from "../utils/auth.util";
import { config } from "./env";

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
    conferenceWebsite: "https://ai-conference.guc.edu.eg",
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
    conferenceWebsite: "https://sustainability.guc.edu.eg",
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

    for (const student of students) {
      // Register each student for 2-3 random events
      const eventsToRegister = publishedEvents
        .sort(() => 0.5 - Math.random())
        .slice(0, Math.floor(Math.random() * 2) + 2);

      for (const event of eventsToRegister) {
        const existingReg = await Registration.findOne({
          userId: student._id,
          eventId: event._id,
        });

        if (!existingReg) {
          await Registration.create({
            userId: student._id,
            eventId: event._id,
            status: "CONFIRMED",
            registrationDate: new Date(),
          });
          console.log(`  ✓ Registered ${student.firstName} for ${event.title}`);
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
    const studentUsers = createdUsers.filter((u) => u.role === "STUDENT");

    for (let i = 0; i < 5; i++) {
      const randomStudent =
        studentUsers[Math.floor(Math.random() * studentUsers.length)];
      const randomCourt = courts[Math.floor(Math.random() * courts.length)];
      const futureDate = new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000);

      await CourtReservation.create({
        courtId: randomCourt._id,
        userId: randomStudent._id,
        studentName: `${randomStudent.firstName} ${randomStudent.lastName}`,
        studentGucId: randomStudent.gucId,
        startDate: futureDate,
        duration: 60,
        status: "CONFIRMED",
      });
      console.log(
        `  ✓ Created reservation for ${randomStudent.firstName} at ${randomCourt.name}`,
      );
    }

    console.log("\n✅ Comprehensive database seeding completed successfully!");
    console.log("\n📊 Summary:");
    console.log(`   Users: ${createdUsers.length}`);
    console.log(`   Events: ${createdEvents.length}`);
    console.log(`   Courts: ${courts.length}`);
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
