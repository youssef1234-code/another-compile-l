# 🏗️ Architecture & Design Patterns

## Architecture Overview

We follow a **Clean Architecture** approach with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                        Presentation Layer                   │
│  (React Components, Pages, UI State Management with Zustand)│
└─────────────────────────────────────────────────────────────┘
                            ↕️
┌─────────────────────────────────────────────────────────────┐
│                      Application Layer                      │
│        (tRPC Client, React Query, Custom Hooks)             │
└─────────────────────────────────────────────────────────────┘
                            ↕️
┌─────────────────────────────────────────────────────────────┐
│                         API Layer                           │
│              (tRPC Routers, Middleware)                     │
└─────────────────────────────────────────────────────────────┘
                            ↕️
┌─────────────────────────────────────────────────────────────┐
│                       Business Logic                        │
│         (Services, Use Cases, Domain Rules)                 │
└─────────────────────────────────────────────────────────────┘
                            ↕️
┌─────────────────────────────────────────────────────────────┐
│                      Data Access Layer                      │
│            (Mongoose Models, Repositories)                  │
└─────────────────────────────────────────────────────────────┘
                            ↕️
┌─────────────────────────────────────────────────────────────┐
│                         Database                            │
│                        (MongoDB)                            │
└─────────────────────────────────────────────────────────────┘
```

## Design Patterns Used

### 1. **Repository Pattern** (Data Access)
- Abstracts data access logic from business logic
- Located in: `backend/src/repositories/`
- Benefits: Easy testing, database independence, centralized queries

```typescript
// Example: UserRepository
export class UserRepository {
  async findByEmail(email: string) { }
  async create(userData: CreateUserDTO) { }
  async update(id: string, data: UpdateUserDTO) { }
  async delete(id: string) { }
}
```

### 2. **Service Layer Pattern** (Business Logic)
- Encapsulates business rules and use cases
- Located in: `backend/src/services/`
- Benefits: Reusable logic, testable, separation from API layer

```typescript
// Example: AuthService
export class AuthService {
  constructor(
    private userRepository: UserRepository,
    private emailService: EmailService
  ) {}
  
  async signupAcademic(data: SignupDTO) {
    // Business logic here
  }
}
```

### 3. **Factory Pattern** (Object Creation)
- Creates complex objects with different configurations
- Used for: User creation (Academic vs Vendor vs Admin)
- Benefits: Encapsulates creation logic, reduces duplication

```typescript
// Example: UserFactory
export class UserFactory {
  static createAcademicUser(data: AcademicSignupDTO) { }
  static createVendorUser(data: VendorSignupDTO) { }
  static createAdminUser(data: AdminSignupDTO) { }
}
```

### 4. **Strategy Pattern** (Email Templates)
- Different email strategies for different scenarios
- Used for: Verification emails, notifications, receipts
- Benefits: Easy to add new email types, testable

```typescript
// Example: Email Strategies
export interface EmailStrategy {
  getSubject(): string;
  getTemplate(data: any): string;
}

export class VerificationEmailStrategy implements EmailStrategy { }
export class WelcomeEmailStrategy implements EmailStrategy { }
```

### 5. **Middleware Pattern** (tRPC)
- Request/response processing pipeline
- Used for: Authentication, authorization, logging, error handling
- Benefits: Reusable, composable, separation of concerns

```typescript
// Example: Auth Middleware
const isAuthenticated = t.middleware(async ({ ctx, next }) => {
  if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });
  return next({ ctx: { user: ctx.user } });
});
```

### 6. **Observer Pattern** (Event-Driven)
- Event emitters for notifications and side effects
- Used for: Email notifications, system notifications
- Benefits: Decoupled components, scalable

```typescript
// Example: Event Emitter
eventEmitter.on('user.registered', async (user) => {
  await emailService.sendVerification(user);
  await notificationService.create(user.id, 'Welcome!');
});
```

### 7. **Dependency Injection** (DI)
- Services receive dependencies via constructor
- Benefits: Testable (easy mocking), loose coupling

```typescript
// Example: DI in Services
export class EventService {
  constructor(
    private eventRepository: EventRepository,
    private notificationService: NotificationService,
    private emailService: EmailService
  ) {}
}
```

### 8. **DTO Pattern** (Data Transfer Objects)
- Zod schemas as DTOs for validation
- Located in: `backend/src/shared/types.ts` and feature-specific files
- Benefits: Type safety, validation, documentation

```typescript
// Example: DTOs with Zod
export const SignupAcademicSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  studentId: z.string(),
  role: z.enum(['Student', 'Staff', 'TA', 'Professor'])
});
```

### 9. **Builder Pattern** (Complex Objects)
- For building complex queries and filters
- Used for: Event search, filtering, sorting
- Benefits: Fluent API, readable code

```typescript
// Example: Query Builder
const events = await EventQueryBuilder
  .create()
  .filterByType('Workshop')
  .filterByDate(startDate, endDate)
  .searchByName('AI')
  .sortByDate('asc')
  .paginate(page, limit)
  .execute();
```

### 10. **Presenter Pattern** (Data Formatting)
- Formats data for API responses
- Located in: `backend/src/presenters/`
- Benefits: Consistent API responses, security (hide sensitive fields)

```typescript
// Example: UserPresenter
export class UserPresenter {
  static toPublic(user: UserDocument) {
    return {
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      role: user.role,
      // Exclude: password, tokens, etc.
    };
  }
}
```

## Frontend Patterns

### 1. **Container/Presenter Pattern**
- Smart components (containers) handle logic
- Presentational components handle UI
- Benefits: Testable, reusable UI components

### 2. **Custom Hooks Pattern**
- Reusable React logic
- Located in: `event-manager/src/hooks/`
- Examples: `useAuth`, `useEvents`, `useDebounce`

### 3. **Compound Components Pattern**
- Complex components with multiple sub-components
- Used for: DataTable, Forms, Dialogs
- Benefits: Flexible API, composition

### 4. **Provider Pattern**
- Context providers for global state
- Used for: Auth, Theme, Notifications
- Located in: `event-manager/src/app/providers.tsx`

## Folder Structure

### Backend Structure
```
backend/
├── src/
│   ├── config/              # Configuration files
│   ├── models/              # Mongoose models (Data layer)
│   ├── repositories/        # Repository pattern (NEW)
│   ├── services/            # Business logic (NEW)
│   ├── routers/             # tRPC routers (API layer)
│   ├── middleware/          # tRPC middleware (NEW)
│   ├── presenters/          # Response formatters (NEW)
│   ├── validators/          # Zod schemas (NEW)
│   ├── events/              # Event emitters (NEW)
│   ├── factories/           # Object factories (NEW)
│   ├── utils/               # Utility functions
│   ├── shared/              # Shared types
│   └── __tests__/           # Test files (NEW)
│       ├── unit/            # Unit tests
│       ├── integration/     # Integration tests
│       └── e2e/             # End-to-end tests
```

### Frontend Structure
```
event-manager/
├── src/
│   ├── app/                 # App configuration
│   ├── components/          # UI components
│   │   ├── ui/              # shadcn components
│   │   ├── layout/          # Layout components
│   │   └── features/        # Feature-specific components (NEW)
│   ├── features/            # Feature modules
│   │   └── [feature]/
│   │       ├── components/  # Feature components
│   │       ├── hooks/       # Feature hooks (NEW)
│   │       ├── pages/       # Feature pages
│   │       ├── services/    # Feature services (NEW)
│   │       └── __tests__/   # Feature tests (NEW)
│   ├── hooks/               # Global hooks
│   ├── lib/                 # Libraries & utilities
│   ├── store/               # Zustand stores
│   └── __tests__/           # Global tests (NEW)
```

## Testing Strategy

### Backend Tests
1. **Unit Tests** - Test individual functions/methods
   - Services, Repositories, Utilities
   - Framework: Jest
   - Coverage target: 80%+

2. **Integration Tests** - Test API endpoints
   - tRPC routers with test database
   - Framework: Jest + Supertest
   - Coverage target: 70%+

3. **E2E Tests** - Test full user flows
   - Complete scenarios (signup → login → create event)
   - Framework: Jest
   - Coverage target: Critical paths only

### Frontend Tests
1. **Component Tests** - Test UI components
   - Framework: Vitest + React Testing Library
   - Coverage target: 70%+

2. **Integration Tests** - Test feature flows
   - User interactions, API calls
   - Framework: Vitest + MSW (Mock Service Worker)
   - Coverage target: 60%+

3. **E2E Tests** - Test full application
   - Framework: Playwright
   - Coverage target: Critical user journeys

## Code Quality Standards

### TypeScript Strict Mode
- ✅ `strict: true`
- ✅ `noImplicitAny: true`
- ✅ `strictNullChecks: true`

### ESLint Rules
- No `any` types (use `unknown` with type guards)
- No unused variables
- Consistent naming conventions
- Max function length: 50 lines
- Max file length: 300 lines

### Documentation
- JSDoc comments for all public functions
- README in each feature folder
- Architecture Decision Records (ADR) for major decisions

## Performance Optimizations

1. **Database Indexing** - Index frequently queried fields
2. **Query Optimization** - Use lean() for read-only queries
3. **Caching** - React Query for client-side caching
4. **Code Splitting** - Lazy load routes
5. **Image Optimization** - WebP format, lazy loading
6. **Bundle Size** - Tree shaking, code splitting

## Security Best Practices

1. **Input Validation** - Zod validation on all inputs
2. **SQL Injection Prevention** - Mongoose parameterized queries
3. **XSS Prevention** - DOMPurify for user content
4. **CSRF Protection** - SameSite cookies
5. **Rate Limiting** - Prevent brute force attacks
6. **JWT Security** - Short-lived access tokens, refresh tokens
7. **Password Hashing** - bcrypt with salt rounds
8. **Environment Variables** - Never commit secrets

## Scalability Considerations

1. **Horizontal Scaling** - Stateless API design
2. **Database Sharding** - Ready for MongoDB sharding
3. **Microservices Ready** - Modular architecture
4. **Event-Driven** - Ready for message queues (RabbitMQ, Kafka)
5. **CDN Integration** - Static assets on CDN
6. **Load Balancing** - Ready for multiple instances

---

**This architecture ensures:**
- ✅ Maintainability
- ✅ Testability
- ✅ Scalability
- ✅ Security
- ✅ Performance
- ✅ Team Collaboration
