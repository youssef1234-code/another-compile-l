# Sprint 1 Progress - Event Management System

## ✅ Completed Features

### Event CRUD Operations
- ✅ **Req #31-34**: Bazaar and Trip Creation/Editing (Events Office)
  - CreateEventSheet with multi-step flow
  - EditBazaarPage (can't edit after event starts - Req #32)
  - EditTripPage (can't edit after start date - Req #34)
  
- ✅ **Req #35-37**: Workshop Management (Professor)
  - CreateWorkshopPage with faculty/professor fields
  - EditWorkshopPage (can edit anytime - Req #36)
  - MyWorkshopsPage (professors view their workshops)
  - Role-based filter (professors only see WORKSHOP type)
  
- ✅ **Req #45-46**: Conference Management (Events Office)
  - CreateConferencePage with website/agenda fields
  - EditConferencePage (full editing capability)
  
- ✅ **Req #48**: Delete Events (soft delete/archive)
  - Archive functionality with confirmation dialog
  - Cannot delete if registrations exist

### UI/UX Improvements
- ✅ Fixed empty title column (renamed to 'name')
- ✅ Fixed pagination defaults (10 items per page)
- ✅ Created standardized edit pages using GenericForm
- ✅ Role-based event filtering in BackOfficeEventsPage
- ✅ DateTimePicker component with validation
- ✅ Consistent route structure: `/{eventType}/edit/:id`

### Backend Improvements
- ✅ Unified `events.create` and `events.update` endpoints
- ✅ Field mapping: `title` → `name` (shared + backend + frontend)
- ✅ Search filters on name/description/professorName
- ✅ Base filter excludes archived events

---

## 🔄 In Progress / Needs Enhancement

### Public Event Browsing (HIGH PRIORITY)
**User Feedback**: "enhance the view event and the whole events page because it is really bad UI and UX without filters or any defaults"

#### EventsPage.tsx Enhancements Needed:
- ❌ Add filter controls:
  - Event type filter (Workshop, Trip, Bazaar, Conference)
  - Location filter (On Campus, Off Campus)
  - Date range filter (upcoming, this week, this month)
  - Price range filter (free, under 100 EGP, etc.)
- ❌ Add search bar (by name, professor, description)
- ❌ Default to showing only upcoming events
- ❌ Better card UI with:
  - Event images/thumbnails
  - Type badges
  - Location badges
  - Capacity indicator
  - Price display
  - Registration deadline
- ❌ Grid view with proper spacing
- ❌ Empty state when no events match filters

#### EventDetailsPage.tsx Enhancements Needed:
- ❌ Better layout with hero section
- ❌ Event image/banner
- ❌ Organizer information (professor for workshops)
- ❌ Detailed description formatting
- ❌ Registration button (Requirement #24):
  - Visible only for: Student, Staff, TA, Professor
  - Hidden for: EVENT_OFFICE, ADMIN, VENDOR
  - Disabled if at capacity or past deadline
  - Disabled if already registered
- ❌ Show registered users count vs capacity
- ❌ Show vendor participants (for bazaars - Req #11)
- ❌ Related events section

---

## ❌ Not Started (Sprint 1 Requirements)

### Event Registration System
**Requirement #24**: Students, Staff, TAs, and Professors can register for workshops and trips

**Implementation Tasks**:
1. Create `RegistrationDialog.tsx` component:
   - Form with name, email, student/staff ID
   - Terms & conditions checkbox
   - Capacity validation
   - Registration deadline check
2. Add `trpc.registrations.register` mutation
3. Backend validation:
   - Check user role (must be Student/Staff/TA/Professor)
   - Check event capacity
   - Check registration deadline
   - Prevent duplicate registrations
4. Success flow:
   - Confirmation toast
   - Email notification (optional)
   - Redirect to "My Registrations"

### My Registrations Page
**Requirement #27**: View and manage my registered events

**Implementation Tasks**:
1. Create `MyRegistrationsPage.tsx`:
   - Tab view: Upcoming | Past
   - Event cards with registration details
   - Cancel registration button (for upcoming events)
   - QR code for check-in (optional)
2. Add `trpc.registrations.getMyRegistrations` query
3. Add `trpc.registrations.cancel` mutation
4. Filter by status (CONFIRMED, CANCELLED, ATTENDED)

### Workshop Approval Workflow
**Requirements #40-42**: Events Office can approve, reject, or request edits for workshop proposals

**Implementation Tasks**:
1. Update `event.model.ts`:
   - Add `approvalStatus`: PENDING_APPROVAL | APPROVED | REJECTED | NEEDS_EDITS
   - Add `rejectionReason` field
   - Add `approvalNotes` field
2. Create `WorkshopApprovalsPage.tsx` (Events Office):
   - List of pending workshops
   - Approve button → set status to APPROVED, publish event
   - Reject button → modal with rejection reason
   - Request Edits button → modal with edit notes
3. Update CreateWorkshopPage:
   - Set initial status to PENDING_APPROVAL
   - Professor sees "Pending Approval" badge
4. Add notification system:
   - Email professor on approval/rejection
   - Show in-app notification

### Vendor Bazaar Applications
**Requirements #59-61, #68-69**: Vendors can apply to join bazaars or request platform booths

**Implementation Tasks**:
1. Create `vendor-application.model.ts`:
   - Bazaar applications (max 5 individuals, booth size 2x2 or 4x4)
   - Platform booth requests (1-4 weeks, location map, booth size)
2. Create `BazaarApplicationDialog.tsx`:
   - Select upcoming bazaar
   - Form with vendor details (company name, products, team size)
   - Booth size selection
   - Submit button
3. Create `VendorRequestsPage.tsx` (Events Office):
   - List of pending applications
   - Accept/Reject buttons (Req #75, #77)
   - View vendor details
   - Assign booth location (optional)
4. Backend:
   - `trpc.vendors.applyToBazaar` mutation
   - `trpc.vendors.requestPlatformBooth` mutation
   - `trpc.vendors.getApplications` query (for vendors)
   - `trpc.vendors.getAllApplications` query (for Events Office)
   - `trpc.vendors.approveApplication` mutation
   - `trpc.vendors.rejectApplication` mutation

---

## 📊 Sprint 1 Completion Checklist

### Event Creation & Editing (6/6 Complete)
- ✅ Req #31-34: Create/edit bazaars and trips (Events Office)
- ✅ Req #35-37: Create/edit workshops, view my workshops (Professor)
- ✅ Req #45-46: Create/edit conferences (Events Office)
- ✅ Req #48: Delete events (if no registrations)

### Event Browsing & Discovery (1/3 Complete)
- 🔄 Req #11: View all available events with details (needs UI enhancement)
- ❌ Req #12: Search events by name/professor/type (backend exists, need UI)
- ❌ Req #24: Register for workshops/trips

### My Events (0/2 Complete)
- ❌ Req #27: View my registered events
- ✅ Req #37: View my workshops (professor)

### Approval Workflows (0/3 Complete)
- ❌ Req #40: Submit workshop for approval
- ❌ Req #41: Events Office approves/publishes workshop
- ❌ Req #42: Events Office rejects workshop with reason

### Vendor Management (0/6 Complete)
- ❌ Req #59-61: Vendor applies to join bazaar
- ❌ Req #68-69: Vendor requests platform booth
- ❌ Req #75: Events Office views vendor requests
- ❌ Req #77: Events Office accepts/rejects vendor applications

---

## 🎯 Recommended Implementation Order

### Phase 1: Enhanced Event Browsing (Immediate)
1. Enhance EventsPage with filters and search
2. Enhance EventDetailsPage with better UI
3. Add role-based registration button visibility

### Phase 2: Event Registration (High Priority)
1. Create RegistrationDialog component
2. Implement registration mutations
3. Add email notifications (optional)
4. Create MyRegistrationsPage

### Phase 3: Workshop Approval Workflow
1. Add approval status to event model
2. Create WorkshopApprovalsPage
3. Update CreateWorkshopPage to set PENDING_APPROVAL
4. Add notification system

### Phase 4: Vendor Management
1. Create vendor application models
2. Build vendor application forms
3. Create VendorRequestsPage for Events Office
4. Add approval/rejection workflows

---

## 🚀 Next Steps

**User Priority**: "enhance the view event and the whole events page"

**Immediate Actions**:
1. Create `EventFilters.tsx` component with:
   - Type multi-select (Workshop, Trip, Bazaar, Conference)
   - Location select (On Campus, Off Campus)
   - Date range picker (This Week, This Month, Custom)
   - Price range slider
   - Search input (name/professor)
2. Update `EventsPage.tsx`:
   - Integrate EventFilters
   - Default to upcoming events only
   - Better card UI with images/badges
   - Grid layout with proper spacing
3. Update `EventDetailsPage.tsx`:
   - Hero section with event banner
   - Registration button (role-based, Req #24)
   - Capacity indicator
   - Better information hierarchy

**Would you like me to start with Phase 1 (Enhanced Event Browsing)?**
