# Backend - Event Management System

Enterprise-grade backend API built with Express, tRPC, MongoDB, and Zod.

## 🏗️ Architecture

```
backend/
├── src/
│   ├── config/           # Configuration files
│   │   ├── database.ts   # MongoDB connection
│   │   └── env.ts        # Environment variables
│   ├── models/           # Mongoose models
│   │   ├── user.model.ts
│   │   ├── event.model.ts
│   │   ├── registration.model.ts
│   │   ├── feedback.model.ts
│   │   └── notification.model.ts
│   ├── routers/          # tRPC routers
│   │   ├── auth.router.ts
│   │   └── app.router.ts
│   ├── shared/           # Shared types (used by FE + BE)
│   │   └── types.ts
│   ├── trpc/             # tRPC setup
│   │   ├── context.ts
│   │   └── trpc.ts
│   ├── utils/            # Utility functions
│   │   ├── auth.util.ts
│   │   └── email.util.ts
│   └── index.ts          # Server entry point
├── .env                  # Environment variables
├── .env.example          # Example environment variables
├── package.json
└── tsconfig.json
```

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18
- MongoDB >= 6.0
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```bash
copy .env.example .env
```

3. Configure environment variables in `.env`:
   - Set MongoDB URI
   - Configure SMTP for emails
   - Add JWT secrets
   - Set Stripe API keys (for payments)

4. Start MongoDB:
```bash
# If using local MongoDB
mongod
```

### Development

Start development server with hot reload:
```bash
npm run dev
```

The API will be available at `http://localhost:5000`
- Health check: `http://localhost:5000/health`
- tRPC endpoint: `http://localhost:5000/trpc`

### Production

Build and start production server:
```bash
npm run build
npm start
```

## 📋 Features

### Authentication & Authorization
- ✅ Academic user signup (Student/Staff/TA/Professor)
- ✅ Vendor signup
- ✅ Email verification
- ✅ Login/Logout
- ✅ JWT-based authentication
- ✅ Role-based access control (RBAC)
- ✅ Admin user management

### Roles
- **STUDENT**: Register for events, rate/comment
- **STAFF/TA/PROFESSOR**: Same as student + additional permissions
- **PROFESSOR**: Create workshops
- **EVENT_OFFICE**: Manage all events, vendors, reports
- **ADMIN**: Full system access, user management
- **VENDOR**: Participate in bazaars/booths, loyalty program

### Middleware & Procedures
- `publicProcedure`: No authentication required
- `protectedProcedure`: Requires authentication
- `adminProcedure`: Admin only
- `eventsOfficeProcedure`: Event Office + Admin
- `professorProcedure`: Professor only
- `vendorProcedure`: Vendor only

## 🔐 API Endpoints (tRPC)

### Authentication
- `auth.signupAcademic`: Academic user registration
- `auth.signupVendor`: Vendor registration
- `auth.verifyEmail`: Email verification
- `auth.login`: User login
- `auth.me`: Get current user
- `auth.logout`: User logout
- `auth.adminVerifyRole`: Admin verifies staff/TA/professor
- `auth.adminCreateAccount`: Admin creates admin/event office
- `auth.adminDeleteAccount`: Admin deletes accounts
- `auth.adminBlockUser`: Block user
- `auth.adminUnblockUser`: Unblock user
- `auth.adminGetUsers`: List all users

## 🗄️ Database Models

### User
- Email, password (hashed)
- Role, status, verification
- Student/Staff IDs, wallet balance
- Company info (for vendors)
- Favorite events

### Event
- Type (Workshop, Trip, Bazaar, Booth, Conference, Gym Session)
- Details, dates, location, capacity
- Status, registration info
- Type-specific fields
- Ratings and comments

### EventRegistration
- User and event references
- Payment status and details
- Attendance tracking
- Certificate issuance

### Rating & Comment
- Event feedback system
- Rating (1-5 stars)
- Comments with moderation

### Notification
- User notifications
- Various types (reminders, updates, warnings)
- Read/unread status

## 🔧 Technology Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **API**: tRPC (end-to-end typesafe)
- **Database**: MongoDB with Mongoose
- **Validation**: Zod
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcrypt
- **Email**: Nodemailer
- **Payments**: Stripe
- **Dev Tools**: tsx (TypeScript execution)

## 📝 Code Style

- **Clean Architecture**: Separation of concerns
- **Type Safety**: Full TypeScript with Zod validation
- **Error Handling**: Comprehensive error handling with tRPC errors
- **Documentation**: JSDoc comments throughout
- **Async/Await**: Modern async patterns
- **ES Modules**: Using ESM imports

## 🧪 Environment Variables

See `.env.example` for all required environment variables:
- Server configuration
- Database connection
- JWT secrets
- SMTP settings
- Stripe API keys

## 📦 Scripts

- `npm run dev`: Start development server
- `npm run build`: Build TypeScript to JavaScript
- `npm start`: Start production server
- `npm run lint`: Run ESLint
- `npm run type-check`: Type check without building

## 🔒 Security

- Passwords hashed with bcrypt (10 rounds)
- JWT tokens with expiration
- Role-based access control
- Input validation with Zod
- CORS configured for client URL
- Email verification required
- Account blocking capability

## 📚 Additional Resources

- [tRPC Documentation](https://trpc.io/)
- [Mongoose Documentation](https://mongoosejs.com/)
- [Zod Documentation](https://zod.dev/)
- [Express Documentation](https://expressjs.com/)
