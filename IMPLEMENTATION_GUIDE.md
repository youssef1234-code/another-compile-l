# 📚 Implementation Guide

## Table of Contents
1. [Type Sharing Between FE & BE](#type-sharing)
2. [Project Architecture](#architecture)
3. [Creating New Features](#creating-features)
4. [Sprint 1 Reference Implementation](#sprint-1-reference)

---

## 🔗 Type Sharing Between FE & BE {#type-sharing}

### How tRPC Enables Type Sharing

With tRPC, **types are automatically shared** between frontend and backend with zero code generation! This is the magic of tRPC.

#### Backend (Define Types & Routers)

```typescript
// backend/src/routers/auth.router.ts
import { z } from 'zod';

export const authRouter = router({
  login: publicProcedure
    .input(z.object({
      email: z.string().email(),
      password: z.string().min(8),
    }))
    .mutation(async ({ input }) => {
      // Implementation
      return { 
        token: 'xxx',
        user: { id: '1', email: input.email }
      };
    }),
});
```

#### Frontend (Automatic Type Inference)

```typescript
// event-manager/src/lib/trpc.ts
import type { AppRouter } from '../../../backend/src/routers/app.router';

export const trpc = createTRPCClient<AppRouter>({...});

// ✨ FULLY TYPED - No manual type definitions needed!
const result = await trpc.auth.login.mutate({
  email: "test@test.com", // ✅ Type-safe
  password: "password123"  // ✅ Type-safe
});

// result.token ✅ Autocomplete works!
// result.user.email ✅ Autocomplete works!
```

### Shared Types Location

```
backend/src/shared/types.ts  → Define shared Zod schemas
                              → Export for both FE & BE to use
```

**Example:**

```typescript
// backend/src/shared/types.ts
export const UserRole = z.enum(['STUDENT', 'STAFF', 'TA', 'PROFESSOR', 'ADMIN', 'EVENT_OFFICE', 'VENDOR']);
export type UserRoleType = z.infer<typeof UserRole>;

// ✨ Use in both FE & BE!
```

---

## 🏗️ Project Architecture {#architecture}

```
project-root/
├── backend/                    # Express + tRPC + MongoDB
│   ├── src/
│   │   ├── config/            # Database, env config
│   │   ├── models/            # Mongoose models
│   │   ├── routers/           # tRPC routers
│   │   │   ├── app.router.ts      # Main router (exports AppRouter type)
│   │   │   └── auth.router.ts     # Auth endpoints
│   │   ├── trpc/              # tRPC setup
│   │   │   ├── context.ts         # Request context
│   │   │   └── trpc.ts            # Init + middleware
│   │   ├── shared/            # 🔗 Shared types (Zod schemas)
│   │   └── utils/             # Helper functions
│   └── package.json
│
└── event-manager/             # React + Vite + TailwindCSS v4
    ├── src/
    │   ├── app/               # App-level config
    │   │   ├── providers.tsx      # QueryClient, Toaster
    │   │   └── router.tsx         # React Router config
    │   ├── components/
    │   │   ├── ui/                # shadcn/ui components
    │   │   ├── layout/            # Layout components
    │   │   └── auth/              # Auth-specific components
    │   ├── features/          # Feature-based modules
    │   │   ├── auth/
    │   │   │   ├── pages/         # Login, Signup pages
    │   │   │   ├── components/    # Feature-specific components
    │   │   │   └── hooks/         # Feature-specific hooks
    │   │   ├── events/
    │   │   ├── admin/
    │   │   └── ...
    │   ├── lib/               # Utilities
    │   │   ├── trpc.ts            # 🔗 tRPC client (imports AppRouter)
    │   │   ├── utils.ts           # Helper functions
    │   │   └── constants.ts       # App constants
    │   └── store/             # Zustand stores
    └── package.json
```

---

## 🚀 Creating New Features {#creating-features}

### Step 1: Define Mongoose Model

```typescript
// backend/src/models/event.model.ts
import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['WORKSHOP', 'TRIP', 'BAZAAR', 'CONFERENCE'],
    required: true 
  },
  startDate: { type: Date, required: true },
  // ... other fields
}, { timestamps: true });

export const Event = mongoose.model('Event', eventSchema);
export type IEvent = mongoose.InferSchemaType<typeof eventSchema>;
```

### Step 2: Define Zod Validation Schema

```typescript
// backend/src/shared/types.ts or in router file
import { z } from 'zod';

export const CreateEventSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  type: z.enum(['WORKSHOP', 'TRIP', 'BAZAAR', 'CONFERENCE']),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  location: z.string().min(1),
  description: z.string().optional(),
  capacity: z.number().int().positive().optional(),
});

export type CreateEventInput = z.infer<typeof CreateEventSchema>;
```

### Step 3: Create tRPC Router

```typescript
// backend/src/routers/event.router.ts
import { router, publicProcedure, protectedProcedure } from '../trpc/trpc.js';
import { CreateEventSchema } from '../shared/types.js';
import { Event } from '../models/event.model.js';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';

export const eventRouter = router({
  /**
   * Get all events
   * @access Public
   */
  getAll: publicProcedure
    .input(z.object({
      type: z.enum(['WORKSHOP', 'TRIP', 'BAZAAR', 'CONFERENCE']).optional(),
      search: z.string().optional(),
      page: z.number().default(1),
      limit: z.number().default(20),
    }))
    .query(async (opts: any) => {
      const { input } = opts;
      const skip = (input.page - 1) * input.limit;
      
      const filter: any = {};
      if (input.type) filter.type = input.type;
      if (input.search) {
        filter.$or = [
          { title: { $regex: input.search, $options: 'i' } },
          { description: { $regex: input.search, $options: 'i' } },
        ];
      }
      
      const [events, total] = await Promise.all([
        Event.find(filter).skip(skip).limit(input.limit).sort({ startDate: 1 }),
        Event.countDocuments(filter),
      ]);
      
      return {
        events,
        pagination: {
          page: input.page,
          limit: input.limit,
          total,
          pages: Math.ceil(total / input.limit),
        },
      };
    }),

  /**
   * Get event by ID
   * @access Public
   */
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async (opts: any) => {
      const event = await Event.findById(opts.input.id);
      if (!event) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Event not found',
        });
      }
      return event;
    }),

  /**
   * Create event
   * @access Protected (Admin/Event Office)
   */
  create: protectedProcedure
    .input(CreateEventSchema)
    .mutation(async (opts: any) => {
      const { input, ctx } = opts;
      
      // Check permissions
      if (!['ADMIN', 'EVENT_OFFICE'].includes(ctx.user.role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only admins and event office can create events',
        });
      }
      
      const event = await Event.create({
        ...input,
        createdBy: ctx.user._id,
      });
      
      return event;
    }),

  /**
   * Update event
   * @access Protected (Admin/Event Office)
   */
  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      data: CreateEventSchema.partial(),
    }))
    .mutation(async (opts: any) => {
      const { input, ctx } = opts;
      
      const event = await Event.findById(input.id);
      if (!event) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Event not found',
        });
      }
      
      Object.assign(event, input.data);
      await event.save();
      
      return event;
    }),

  /**
   * Delete event
   * @access Protected (Admin/Event Office)
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async (opts: any) => {
      const event = await Event.findByIdAndDelete(opts.input.id);
      if (!event) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Event not found',
        });
      }
      return { success: true };
    }),
});
```

### Step 4: Register Router in App Router

```typescript
// backend/src/routers/app.router.ts
import { router } from '../trpc/trpc.js';
import { authRouter } from './auth.router.js';
import { eventRouter } from './event.router.js'; // Add this

export const appRouter = router({
  auth: authRouter,
  events: eventRouter, // Add this
});

export type AppRouter = typeof appRouter;
```

### Step 5: Create Frontend Feature Module

```typescript
// event-manager/src/features/events/hooks/useEvents.ts
import { trpc } from '@/lib/trpc';

export function useEvents(filters?: { type?: string; search?: string }) {
  return trpc.events.getAll.useQuery({
    type: filters?.type as any,
    search: filters?.search,
    page: 1,
    limit: 20,
  });
}

export function useEvent(id: string) {
  return trpc.events.getById.useQuery({ id });
}

export function useCreateEvent() {
  const utils = trpc.useUtils();
  
  return trpc.events.create.useMutation({
    onSuccess: () => {
      // Invalidate events list to refetch
      utils.events.getAll.invalidate();
    },
  });
}
```

### Step 6: Create React Component

```typescript
// event-manager/src/features/events/pages/EventsPage.tsx
import { useState } from 'react';
import { useEvents, useCreateEvent } from '../hooks/useEvents';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import toast from 'react-hot-toast';

export function EventsPage() {
  const [search, setSearch] = useState('');
  const { data, isLoading } = useEvents({ search });
  const createEvent = useCreateEvent();
  
  const handleCreate = () => {
    createEvent.mutate({
      title: 'New Event',
      type: 'WORKSHOP',
      startDate: new Date().toISOString(),
      endDate: new Date().toISOString(),
      location: 'Campus',
    }, {
      onSuccess: () => {
        toast.success('Event created successfully!');
      },
      onError: (error) => {
        toast.error(error.message);
      },
    });
  };
  
  if (isLoading) return <div>Loading...</div>;
  
  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Events</h1>
        <Button onClick={handleCreate}>Create Event</Button>
      </div>
      
      <Input 
        placeholder="Search events..." 
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-6"
      />
      
      <div className="grid gap-4">
        {data?.events.map((event: any) => (
          <Card key={event._id} className="p-4">
            <h3 className="font-semibold">{event.title}</h3>
            <p className="text-sm text-muted-foreground">{event.location}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

---

## 🎯 Sprint 1 Reference Implementation {#sprint-1-reference}

### Implemented Requirements (25% of Sprint 1)

#### ✅ Requirement #1: Academic User Signup
- **Backend**: `authRouter.signupAcademic` mutation
- **Frontend**: `SignupPage.tsx` component
- **Validation**: Email must end with `@guc.edu.eg`

#### ✅ Requirement #2: Vendor Signup
- **Backend**: `authRouter.signupVendor` mutation
- **Frontend**: `SignupVendorPage.tsx` component

#### ✅ Requirement #9: Login
- **Backend**: `authRouter.login` mutation with JWT
- **Frontend**: `LoginPage.tsx` using shadcn login-01 block

#### ✅ Requirement #10: Logout
- **Frontend**: `useAuthStore` logout action
- **UI**: Logout button in `<Header />` component

#### ✅ Requirement #20: Admin View Users
- **Backend**: `authRouter.adminGetUsers` query with filtering
- **Frontend**: `AdminUsersPage.tsx` with TanStack Table
- **Features**: Filter by role/status, pagination

---

## 🛠️ Tech Stack Usage

### Backend
- **Express**: HTTP server
- **tRPC v11**: Type-safe API layer
- **Mongoose**: MongoDB ODM
- **Zod**: Runtime validation
- **JWT**: Authentication tokens
- **Bcrypt**: Password hashing
- **Nodemailer**: Email sending

### Frontend
- **React 19**: UI library
- **Vite**: Build tool
- **TailwindCSS v4**: Styling
- **shadcn/ui**: Component library
- **tRPC Client**: Type-safe API calls
- **TanStack Query**: Server state management
- **Zustand**: Client state management
- **React Router v7**: Routing
- **React Hook Form**: Form handling
- **Zod**: Form validation
- **React Hot Toast**: Notifications
- **Framer Motion**: Animations
- **Lucide React**: Icons

---

## 📝 Code Standards

### File Naming
- Components: `PascalCase.tsx` (e.g., `EventCard.tsx`)
- Hooks: `camelCase.ts` (e.g., `useEvents.ts`)
- Utils: `camelCase.ts` (e.g., `formatDate.ts`)
- Types: `PascalCase.ts` (e.g., `Event.ts`)

### Component Structure
```typescript
/**
 * Component Description
 * 
 * @component
 * @example
 * <ComponentName prop="value" />
 */
export function ComponentName({ prop }: Props) {
  // 1. Hooks
  // 2. State
  // 3. Handlers
  // 4. Effects
  // 5. Render
}
```

### tRPC Router Structure
```typescript
export const featureRouter = router({
  // Queries first (read operations)
  getAll: publicProcedure...
  getById: publicProcedure...
  
  // Then mutations (write operations)
  create: protectedProcedure...
  update: protectedProcedure...
  delete: protectedProcedure...
});
```

---

## 🎨 Styling Guidelines

### Use Tailwind Utility Classes
```tsx
<div className="flex items-center justify-between p-4 rounded-lg border">
  ...
</div>
```

### Use shadcn/ui Components
```tsx
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
```

### Use CSS Variables for Theme Colors
```css
/* Already configured in index.css */
background: hsl(var(--background))
foreground: hsl(var(--foreground))
primary: hsl(var(--primary))
```

---

## 🧪 Testing Approach

### Backend Testing
```typescript
// Test tRPC procedures
describe('eventRouter', () => {
  it('should create event', async () => {
    const result = await caller.events.create({
      title: 'Test Event',
      // ...
    });
    expect(result).toBeDefined();
  });
});
```

### Frontend Testing
```typescript
// Test components with React Testing Library
describe('EventCard', () => {
  it('renders event details', () => {
    render(<EventCard event={mockEvent} />);
    expect(screen.getByText(mockEvent.title)).toBeInTheDocument();
  });
});
```

---

## 🚦 Getting Started for New Developers

1. **Clone & Install**
   ```bash
   git clone <repo>
   cd backend && npm install
   cd ../event-manager && npm install
   ```

2. **Setup Environment**
   ```bash
   cp backend/.env.example backend/.env
   # Fill in your MongoDB URI, JWT secrets, etc.
   ```

3. **Start Development**
   ```bash
   # Terminal 1: Backend
   cd backend && npm run dev
   
   # Terminal 2: Frontend
   cd event-manager && npm run dev
   ```

4. **Read This Guide!** 📖
   - Understand type sharing
   - Follow the feature creation steps
   - Study the reference implementations

5. **Pick a Requirement**
   - Check `requirements.csv`
   - Follow the same pattern as implemented features
   - Ask questions in team chat!

---

## 🔍 Reference Implementations

Check these files to see complete implementations:

### Backend
- `backend/src/routers/auth.router.ts` - Full auth CRUD with 11 endpoints
- `backend/src/models/user.model.ts` - Complex Mongoose model with polymorphism
- `backend/src/trpc/trpc.ts` - Middleware for auth & RBAC

### Frontend
- `event-manager/src/features/auth/pages/LoginPage.tsx` - Complete login flow
- `event-manager/src/store/authStore.ts` - Auth state management
- `event-manager/src/components/layout/AppLayout.tsx` - Layout with sidebar

---

## 📚 Additional Resources

- [tRPC Docs](https://trpc.io)
- [shadcn/ui Docs](https://ui.shadcn.com)
- [TanStack Query Docs](https://tanstack.com/query)
- [Zod Docs](https://zod.dev)
- [Mongoose Docs](https://mongoosejs.com)

---

**Happy Coding! 🚀**
