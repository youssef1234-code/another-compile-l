# 📘 Developer Guide - How to Add a New Feature

This guide shows you **step-by-step** how to add a complete feature to the Event Manager system, covering both Backend and Frontend.

---

## 🎯 Table of Contents

1. [Overview of Architecture](#overview-of-architecture)
2. [Backend Development](#backend-development)
3. [Frontend Development](#frontend-development)
4. [Testing Your Feature](#testing-your-feature)
5. [Common Patterns & Examples](#common-patterns--examples)

---

## 📐 Overview of Architecture

Our application follows **Clean Architecture** with these layers:

```
┌─────────────────────────────────────────┐
│          FRONTEND (React)               │
│  ┌───────────────────────────────────┐  │
│  │  Pages (UI Components)            │  │
│  │         ↓                         │  │
│  │  tRPC Client (Type-safe API)     │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
                    ↕
┌─────────────────────────────────────────┐
│          BACKEND (Node.js)              │
│  ┌───────────────────────────────────┐  │
│  │  tRPC Router (API Endpoints)      │  │
│  │         ↓                         │  │
│  │  Service Layer (Business Logic)  │  │
│  │         ↓                         │  │
│  │  Repository Layer (DB Access)    │  │
│  │         ↓                         │  │
│  │  Mongoose Models (Schema)        │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
                    ↕
┌─────────────────────────────────────────┐
│          DATABASE (MongoDB)             │
└─────────────────────────────────────────┘
```

**Data Flow:**
1. User interacts with **Frontend Page**
2. Page calls **tRPC Client** (type-safe)
3. tRPC routes to **Backend Router**
4. Router calls **Service** (business logic)
5. Service calls **Repository** (database operations)
6. Repository uses **Mongoose Model** to query MongoDB

---

## 🔧 Backend Development

### Step 1: Create the Model

**Location:** `backend/src/models/your-feature.model.ts`

**Example:** Let's create a "Favorites" feature

```typescript
/**
 * Favorite Model
 * 
 * @module models/favorite.model
 */

import mongoose, { Schema } from 'mongoose';
import type { IBaseDocument } from './base.model';
import { createBaseSchema } from './base.model';

export interface IFavorite extends IBaseDocument {
  user: mongoose.Types.ObjectId;
  event: mongoose.Types.ObjectId;
}

const favoriteSchema = createBaseSchema<IFavorite>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    event: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },
  },
  {
    toJSON: {
      transform: (_doc: any, ret: any) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Unique constraint: user can only favorite an event once
favoriteSchema.index({ user: 1, event: 1 }, { unique: true });

export const Favorite = mongoose.model<IFavorite>('Favorite', favoriteSchema);
```

**Key Points:**
- ✅ Extend `IBaseDocument` (gives you `createdAt`, `updatedAt`, `isDeleted`)
- ✅ Use `createBaseSchema` (adds soft delete + timestamps)
- ✅ Add indexes for frequently queried fields
- ✅ Use `ref` for relationships (auto-population)

---

### Step 2: Create the Repository

**Location:** `backend/src/repositories/your-feature.repository.ts`

**Example:**

```typescript
/**
 * Favorite Repository
 * 
 * Data access layer for favorites
 * @module repositories/favorite.repository
 */

import { Favorite } from '../models/favorite.model';
import type { IFavorite } from '../models/favorite.model';
import { BaseRepository } from './base.repository';
import mongoose from 'mongoose';

export class FavoriteRepository extends BaseRepository<IFavorite> {
  constructor() {
    super(Favorite);
  }

  /**
   * Get all favorites for a user
   */
  async getByUserId(userId: string, options?: { page?: number; limit?: number }) {
    const page = options?.page || 1;
    const limit = options?.limit || 100;
    const skip = (page - 1) * limit;

    const query = { 
      user: new mongoose.Types.ObjectId(userId),
      isDeleted: false 
    };

    const [favorites, total] = await Promise.all([
      this.model
        .find(query)
        .populate('event')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.model.countDocuments(query),
    ]);

    return {
      favorites,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Check if user has favorited an event
   */
  async isFavorited(userId: string, eventId: string): Promise<boolean> {
    const count = await this.model.countDocuments({
      user: new mongoose.Types.ObjectId(userId),
      event: new mongoose.Types.ObjectId(eventId),
      isDeleted: false,
    });
    return count > 0;
  }

  /**
   * Get favorite by user and event
   */
  async getByUserAndEvent(userId: string, eventId: string) {
    return this.model
      .findOne({
        user: new mongoose.Types.ObjectId(userId),
        event: new mongoose.Types.ObjectId(eventId),
        isDeleted: false,
      })
      .lean();
  }
}

export const favoriteRepository = new FavoriteRepository();
```

**Key Points:**
- ✅ Extend `BaseRepository<YourModel>` (gives you CRUD methods)
- ✅ Add custom query methods
- ✅ Use `.populate()` to load related data
- ✅ Always use `isDeleted: false` filter (soft deletes)
- ✅ Use `.lean()` for read-only queries (performance)
- ✅ Export singleton instance: `export const favoriteRepository = ...`

---

### Step 3: Create the Service

**Location:** `backend/src/services/your-feature.service.ts`

**Example:**

```typescript
/**
 * Favorite Service
 * 
 * Business logic for favorites
 * @module services/favorite.service
 */

import { favoriteRepository } from '../repositories/favorite.repository';
import { eventService } from './event.service';
import { TRPCError } from '@trpc/server';
import type { IFavorite } from '../models/favorite.model';
import mongoose from 'mongoose';

export class FavoriteService {
  /**
   * Add event to favorites
   */
  async addFavorite(userId: string, eventId: string): Promise<IFavorite> {
    // Validate event exists
    const event = await eventService.getEventById(eventId);
    if (!event) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Event not found',
      });
    }

    // Check if already favorited
    const existing = await favoriteRepository.getByUserAndEvent(userId, eventId);
    if (existing) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Event already in favorites',
      });
    }

    // Create favorite
    return favoriteRepository.create({
      user: new mongoose.Types.ObjectId(userId),
      event: new mongoose.Types.ObjectId(eventId),
    } as any);
  }

  /**
   * Remove event from favorites
   */
  async removeFavorite(userId: string, eventId: string): Promise<void> {
    const favorite = await favoriteRepository.getByUserAndEvent(userId, eventId);
    
    if (!favorite) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Favorite not found',
      });
    }

    // Verify ownership
    if (favorite.user.toString() !== userId) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You can only remove your own favorites',
      });
    }

    await favoriteRepository.delete((favorite as any)._id.toString());
  }

  /**
   * Get user's favorites
   */
  async getMyFavorites(userId: string, options?: { page?: number; limit?: number }) {
    return favoriteRepository.getByUserId(userId, options);
  }

  /**
   * Check if event is favorited
   */
  async isFavorited(userId: string, eventId: string): Promise<boolean> {
    return favoriteRepository.isFavorited(userId, eventId);
  }
}

export const favoriteService = new FavoriteService();
```

**Key Points:**
- ✅ Import repository and other services you need
- ✅ Validate input (event exists, user authorized, etc.)
- ✅ Use `TRPCError` for errors with proper codes:
  * `NOT_FOUND` - Resource doesn't exist
  * `BAD_REQUEST` - Invalid input
  * `FORBIDDEN` - Not authorized
  * `UNAUTHORIZED` - Not logged in
- ✅ Keep business logic here (not in repository)
- ✅ Export singleton: `export const favoriteService = ...`

---

### Step 4: Create tRPC Router

**Location:** `backend/src/routers/your-feature.router.ts` OR add to existing router

**Example:**

```typescript
/**
 * Favorites Router
 * 
 * @module routers/favorites.router
 */

import { protectedProcedure, router } from '../trpc/trpc';
import { favoriteService } from '../services/favorite.service';
import { z } from 'zod';

const favoriteRoutes = {
  /**
   * Get my favorites
   */
  getMyFavorites: protectedProcedure
    .input(z.object({
      page: z.number().min(1).optional().default(1),
      limit: z.number().min(1).max(100).optional().default(20),
    }))
    .query(async ({ input, ctx }) => {
      const userId = (ctx.user!._id as any).toString();
      return favoriteService.getMyFavorites(userId, {
        page: input.page,
        limit: input.limit,
      });
    }),

  /**
   * Add to favorites
   */
  addFavorite: protectedProcedure
    .input(z.object({
      eventId: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const userId = (ctx.user!._id as any).toString();
      const favorite = await favoriteService.addFavorite(userId, input.eventId);
      return {
        success: true,
        message: 'Added to favorites',
        favorite,
      };
    }),

  /**
   * Remove from favorites
   */
  removeFavorite: protectedProcedure
    .input(z.object({
      eventId: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const userId = (ctx.user!._id as any).toString();
      await favoriteService.removeFavorite(userId, input.eventId);
      return {
        success: true,
        message: 'Removed from favorites',
      };
    }),

  /**
   * Check if favorited
   */
  isFavorited: protectedProcedure
    .input(z.object({
      eventId: z.string(),
    }))
    .query(async ({ input, ctx }) => {
      const userId = (ctx.user!._id as any).toString();
      const isFavorited = await favoriteService.isFavorited(userId, input.eventId);
      return { isFavorited };
    }),
};

export const favoritesRouter = router(favoriteRoutes);
```

**Key Points:**
- ✅ Use `protectedProcedure` for authenticated routes
- ✅ Use `eventsOfficeProcedure` for Events Office/Admin
- ✅ Use `adminProcedure` for Admin only
- ✅ Use `publicProcedure` for public routes
- ✅ Use `.query()` for GET requests (data fetching)
- ✅ Use `.mutation()` for POST/PUT/DELETE (data modification)
- ✅ Validate input with `z` (Zod schemas)
- ✅ Get userId from `ctx.user` in protected routes

---

### Step 5: Register Router in Main Router

**Location:** `backend/src/routers/app.router.ts`

```typescript
import { favoritesRouter } from './favorites.router';

export const appRouter = router({
  auth: authRouter,
  events: eventsRouter,
  favorites: favoritesRouter, // ← Add your router here
  // ... other routers
});
```

---

## 🎨 Frontend Development

### Step 1: Use tRPC in Components

The tRPC client is already configured. Just import and use it:

**Example: Fetch data**

```typescript
import { trpc } from '@/lib/trpc';

function MyFavoritesPage() {
  const { data, isLoading } = trpc.favorites.getMyFavorites.useQuery({
    page: 1,
    limit: 20,
  });

  const favorites = data?.favorites || [];

  if (isLoading) return <LoadingSpinner />;

  return (
    <div>
      {favorites.map((fav) => (
        <div key={fav.id}>{fav.event.name}</div>
      ))}
    </div>
  );
}
```

**Example: Mutations**

```typescript
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

function EventCard({ event }) {
  const utils = trpc.useUtils();

  const addFavoriteMutation = trpc.favorites.addFavorite.useMutation({
    onSuccess: () => {
      toast.success('Added to favorites!');
      utils.favorites.getMyFavorites.invalidate();
      utils.favorites.isFavorited.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleAddFavorite = () => {
    addFavoriteMutation.mutate({ eventId: event.id });
  };

  return (
    <button onClick={handleAddFavorite} disabled={addFavoriteMutation.isPending}>
      {addFavoriteMutation.isPending ? 'Adding...' : 'Add to Favorites'}
    </button>
  );
}
```

**Key Points:**
- ✅ Use `.useQuery()` for fetching data
- ✅ Use `.useMutation()` for mutations
- ✅ Invalidate queries after mutations: `utils.yourRouter.yourQuery.invalidate()`
- ✅ Show loading states: `isLoading`, `isPending`
- ✅ Handle errors: `onError`
- ✅ Show success messages: `toast.success()`

---

### Step 2: Create a Page Component

**Location:** `event-manager/src/features/your-feature/pages/YourPage.tsx`

**Example: List Page with Table**

```typescript
import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { GenericDataTable } from '@/components/generic/GenericDataTable';
import type { ColumnDef } from '@tanstack/react-table';
import { PageHeader } from '@/components/generic/PageHeader';
import { Button } from '@/components/ui/button';
import { Heart, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export function MyFavoritesPage() {
  const utils = trpc.useUtils();
  const [page, setPage] = useState(1);

  // Fetch favorites
  const { data, isLoading } = trpc.favorites.getMyFavorites.useQuery({
    page,
    limit: 20,
  });

  // Remove favorite mutation
  const removeMutation = trpc.favorites.removeFavorite.useMutation({
    onSuccess: () => {
      toast.success('Removed from favorites');
      utils.favorites.getMyFavorites.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Table columns
  const columns: ColumnDef<any>[] = [
    {
      accessorKey: 'event.name',
      header: 'Event Name',
      cell: ({ row }) => (
        <div className="font-medium">{row.original.event.name}</div>
      ),
    },
    {
      accessorKey: 'event.type',
      header: 'Type',
      cell: ({ row }) => (
        <Badge>{row.original.event.type}</Badge>
      ),
    },
    {
      accessorKey: 'event.startDate',
      header: 'Date',
      cell: ({ row }) => (
        format(new Date(row.original.event.startDate), 'MMM dd, yyyy')
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <Button
          variant="destructive"
          size="sm"
          onClick={() => removeMutation.mutate({ eventId: row.original.event.id })}
          disabled={removeMutation.isPending}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Remove
        </Button>
      ),
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <PageHeader
        title="My Favorites"
        description="Events you've marked as favorites"
        icon={<Heart className="h-8 w-8" />}
      />

      <GenericDataTable
        data={data?.favorites || []}
        columns={columns}
        isLoading={isLoading}
        pagination={{
          page,
          totalPages: data?.totalPages || 1,
          onPageChange: setPage,
        }}
        emptyStateTitle="No favorites yet"
        emptyStateDescription="Start adding events to your favorites"
      />
    </motion.div>
  );
}
```

---

### Step 3: Create a Form Component

**Location:** `event-manager/src/features/your-feature/components/YourForm.tsx`

**Example: Using GenericForm**

```typescript
import { GenericForm } from '@/components/generic/GenericForm';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';

const createWorkshopSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  location: z.enum(['GUC_CAIRO', 'GUC_BERLIN']),
  startDate: z.string(),
  endDate: z.string(),
  description: z.string(),
  capacity: z.number().min(1),
});

export function CreateWorkshopForm() {
  const navigate = useNavigate();
  const utils = trpc.useUtils();

  const createMutation = trpc.events.create.useMutation({
    onSuccess: () => {
      toast.success('Workshop created successfully!');
      utils.events.getEvents.invalidate();
      navigate('/events');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  return (
    <GenericForm
      schema={createWorkshopSchema}
      onSubmit={(data) => {
        createMutation.mutate({
          ...data,
          type: 'WORKSHOP',
        });
      }}
      fields={[
        {
          name: 'name',
          label: 'Workshop Name',
          type: 'text',
          placeholder: 'Enter workshop name',
        },
        {
          name: 'location',
          label: 'Location',
          type: 'select',
          options: [
            { value: 'GUC_CAIRO', label: 'GUC Cairo' },
            { value: 'GUC_BERLIN', label: 'GUC Berlin' },
          ],
        },
        {
          name: 'startDate',
          label: 'Start Date',
          type: 'date',
        },
        {
          name: 'endDate',
          label: 'End Date',
          type: 'date',
        },
        {
          name: 'description',
          label: 'Description',
          type: 'textarea',
          placeholder: 'Enter workshop description',
        },
        {
          name: 'capacity',
          label: 'Capacity',
          type: 'number',
          placeholder: 'Max number of participants',
        },
      ]}
      submitLabel="Create Workshop"
      isSubmitting={createMutation.isPending}
    />
  );
}
```

**Key Points:**
- ✅ Use `GenericForm` for consistent styling
- ✅ Define Zod schema for validation
- ✅ Handle mutations with `useMutation`
- ✅ Navigate after success: `useNavigate()`
- ✅ Invalidate queries to refresh data

---

### Step 4: Add Routes

**Location:** `event-manager/src/app/router.tsx`

```typescript
import { MyFavoritesPage } from '@/features/favorites/pages/MyFavoritesPage';

// Add to routes array
{
  path: '/favorites',
  element: <MyFavoritesPage />,
},
```

**Add to Sidebar:**

**Location:** `event-manager/src/components/app-sidebar.tsx`

```typescript
{
  title: 'My Favorites',
  url: '/favorites',
  icon: Heart,
},
```

---

## 🧪 Testing Your Feature

### Backend Testing

1. **Start Backend:**
```bash
cd backend
npm run dev
```

2. **Test with Postman/Insomnia:**
- URL: `http://localhost:3000/api/trpc/favorites.addFavorite`
- Method: POST
- Headers: `Authorization: Bearer YOUR_JWT_TOKEN`
- Body:
```json
{
  "eventId": "65f1a2b3c4d5e6f7g8h9i0j1"
}
```

3. **Check MongoDB:**
```javascript
use event_manager
db.favorites.find().pretty()
```

### Frontend Testing

1. **Start Frontend:**
```bash
cd event-manager
npm run dev
```

2. **Manual Testing:**
- Open browser: `http://localhost:5173`
- Login as a user
- Navigate to your page
- Test all actions (add, remove, view)
- Check console for errors

3. **Check Network Tab:**
- Open DevTools → Network
- Filter by `trpc`
- Verify API calls are successful

---

## 📚 Common Patterns & Examples

### Pattern 1: Check if User Has Permission

```typescript
// In service
if (ctx.user.role !== 'EVENTS_OFFICE' && ctx.user.role !== 'ADMIN') {
  throw new TRPCError({
    code: 'FORBIDDEN',
    message: 'Only Events Office or Admin can perform this action',
  });
}
```

### Pattern 2: Populate Multiple Relations

```typescript
const data = await this.model
  .find(query)
  .populate('user', 'firstName lastName email')
  .populate('event')
  .populate('vendor', 'companyName')
  .lean();
```

### Pattern 3: Conditional Query

```typescript
const query: any = { isDeleted: false };

if (filters.type) {
  query.type = filters.type;
}

if (filters.startDate) {
  query.startDate = { $gte: new Date(filters.startDate) };
}

const results = await this.model.find(query);
```

### Pattern 4: Transaction (For Complex Operations)

```typescript
const session = await mongoose.startSession();
session.startTransaction();

try {
  // Create registration
  const registration = await registrationRepository.create(data, { session });
  
  // Update event capacity
  await eventRepository.update(eventId, { $inc: { registeredCount: 1 } }, { session });
  
  await session.commitTransaction();
  return registration;
} catch (error) {
  await session.abortTransaction();
  throw error;
} finally {
  session.endSession();
}
```

### Pattern 5: Optimistic Updates (Frontend)

```typescript
const deleteMutation = trpc.favorites.removeFavorite.useMutation({
  onMutate: async ({ eventId }) => {
    // Cancel outgoing queries
    await utils.favorites.getMyFavorites.cancel();

    // Snapshot previous value
    const previousFavorites = utils.favorites.getMyFavorites.getData();

    // Optimistically update UI
    utils.favorites.getMyFavorites.setData(undefined, (old) => ({
      ...old!,
      favorites: old!.favorites.filter((f) => f.event.id !== eventId),
    }));

    return { previousFavorites };
  },
  onError: (err, variables, context) => {
    // Rollback on error
    utils.favorites.getMyFavorites.setData(undefined, context?.previousFavorites);
  },
  onSettled: () => {
    // Refetch after mutation
    utils.favorites.getMyFavorites.invalidate();
  },
});
```

---

## ✅ Checklist for Adding a Feature

### Backend:
- [ ] Create Model with proper schema
- [ ] Add indexes for performance
- [ ] Create Repository with query methods
- [ ] Create Service with business logic
- [ ] Add validation in service
- [ ] Use TRPCError for errors
- [ ] Create tRPC router endpoints
- [ ] Register router in app.router.ts
- [ ] Test with Postman/Insomnia
- [ ] Verify data in MongoDB

### Frontend:
- [ ] Create page component
- [ ] Use tRPC hooks (useQuery/useMutation)
- [ ] Use GenericDataTable for tables
- [ ] Use GenericForm for forms
- [ ] Add Framer Motion animations
- [ ] Handle loading states
- [ ] Handle error states
- [ ] Show toast notifications
- [ ] Add route to router.tsx
- [ ] Add link to sidebar
- [ ] Test manually in browser

---

## 🚀 Quick Command Reference

```bash
# Backend
cd backend
npm install                  # Install dependencies
npm run dev                  # Start development server
npm run build                # Build TypeScript
npm run lint                 # Check for errors

# Frontend
cd event-manager
npm install                  # Install dependencies
npm run dev                  # Start development server
npm run build                # Build for production
npm run lint                 # Check for errors

# Database
mongosh                      # Connect to MongoDB
use event_manager            # Switch to database
db.collection.find()         # Query collection
```

---

## 📖 Additional Resources

- **TanStack Query:** https://tanstack.com/query/latest
- **TanStack Table:** https://tanstack.com/table/latest
- **tRPC:** https://trpc.io/
- **Framer Motion:** https://www.framer.com/motion/
- **Zod:** https://zod.dev/
- **Mongoose:** https://mongoosejs.com/

---

**Good luck building your feature! 🎉**

If you get stuck, check existing implementations (Registration system is a great reference) or ask for help.
