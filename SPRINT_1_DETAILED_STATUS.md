# Sprint 1 - Detailed Status & Team Assignments

## 📊 Sprint 1 Overview

**Total Requirements:** 37  
**Total Marks Available:** 93.5 marks

---

## ✅ COMPLETED (Your Work) - 21 Requirements (51.5 marks)

### Authentication & User Management (10 requirements - 25.5 marks)
1. ✅ **Req #1** - Academic signup (Student/Staff/TA/Professor) - 2.5 marks - **DONE BY YOU**
2. ✅ **Req #2** - Vendor signup - 2 marks - **DONE BY YOU**
3. ✅ **Req #5** - Admin verify academic roles & send verification - 2 marks - **DONE BY YOU**
4. ✅ **Req #6** - Staff/TA/Professor receive verification email - 3 marks - **DONE BY YOU**
5. ✅ **Req #7** - Admin create other admin/Event Office accounts - 2 marks - **DONE BY YOU**
6. ✅ **Req #8** - Admin delete admin/Event Office accounts - 2 marks - **DONE BY YOU**
7. ✅ **Req #9** - Login - 3 marks - **DONE BY YOU**
8. ✅ **Req #10** - Logout - 3 marks - **DONE BY YOU**
9. ✅ **Req #20** - Admin view all users with status - 4 marks - **DONE BY YOU**
10. ✅ **Req #19** - Admin block users - 2 marks - **DONE BY YOU**

### Events Browsing (2 requirements - 6 marks)
11. ✅ **Req #11** - View all available events with details - 3 marks - **DONE BY YOU**
12. ✅ **Req #12** - Search events by name/type - 3 marks - **DONE BY YOU**

### Event Registration (2 requirements - 8 marks)
13. ✅ **Req #24** - Register for workshop/trip - 4 marks - **DONE BY YOU**
14. ✅ **Req #27** - View my registered events - 4 marks - **DONE BY YOU**

### Event Creation - Backend Only (7 requirements - 14 marks)
15. ✅ **Req #31** - Create bazaars (Backend) - 2 marks - **DONE BY YOU**
16. ✅ **Req #32** - Edit bazaars (Backend) - 2 marks - **DONE BY YOU**
17. ✅ **Req #33** - Create trips (Backend) - 2 marks - **DONE BY YOU**
18. ✅ **Req #34** - Edit trips (Backend) - 2 marks - **DONE BY YOU**
19. ✅ **Req #35** - Create workshops (Backend) - 2 marks - **DONE BY YOU**
20. ✅ **Req #36** - Edit workshops (Backend) - 2 marks - **DONE BY YOU**
21. ✅ **Req #48** - Delete events (Backend) - 2 marks - **DONE BY YOU**

---

## 🔄 IN PROGRESS - Needs Frontend Forms (6 requirements - 12 marks)

### Event Creation Forms (Needs Frontend Only)
22. ⚠️ **Req #31** - Create bazaars (Frontend form needed) - **ASSIGNED TO: Masry**
23. ⚠️ **Req #32** - Edit bazaars (Frontend form needed) - **ASSIGNED TO: Masry**
24. ⚠️ **Req #33** - Create trips (Frontend form needed) - **ASSIGNED TO: Gamal**
25. ⚠️ **Req #34** - Edit trips (Frontend form needed) - **ASSIGNED TO: Gamal**
26. ⚠️ **Req #35** - Create workshops (Frontend form needed) - **ASSIGNED TO: Fahmy**
27. ⚠️ **Req #36** - Edit workshops (Frontend form needed) - **ASSIGNED TO: Fahmy**

---

## ❌ NOT STARTED - 10 Requirements (27 marks)

### Workshop Approval System (3 requirements - 6 marks)
28. ❌ **Req #40** - Accept and publish workshop - **ASSIGNED TO: Yassin**
29. ❌ **Req #41** - Reject workshop - **ASSIGNED TO: Yassin**
30. ❌ **Req #42** - Request edits in workshop - **ASSIGNED TO: Yassin**

### Professor Workshop Management (1 requirement - 2 marks)
31. ❌ **Req #37** - Professor view my workshops - **ASSIGNED TO: Fahmy**

### Vendor Management (2 requirements - 4 marks)
32. ❌ **Req #59** - Vendor view upcoming bazaars - **ASSIGNED TO: Omar**
33. ❌ **Req #60** - Vendor apply to bazaar - **ASSIGNED TO: Omar**

### Gym & Sports (3 requirements - 7 marks)
34. ❌ **Req #78** - View courts availability - **ASSIGNED TO: Tamer**
35. ❌ **Req #80** - View gym schedule - **ASSIGNED TO: Tamer**
36. ❌ **Req #84** - Events Office create gym session - **ASSIGNED TO: Tamer**

### Vendor Applications (1 requirement - 2 marks)
37. ❌ **Req #68** - Vendor view my participating bazaars - **ASSIGNED TO: Omar**

---

## 📈 Progress Summary

| Status | Requirements | Marks | Percentage |
|--------|-------------|-------|------------|
| ✅ **Completed (Your Work)** | 21 | 51.5 | **56.8%** |
| ⚠️ **In Progress (Backend Done)** | 6 | 12 | **16.2%** |
| ❌ **Not Started** | 10 | 27 | **27.0%** |
| **TOTAL** | **37** | **90.5** | **100%** |

---

## 👥 TEAM ASSIGNMENTS

### **YOU (Original Developer)** ✅ COMPLETE
**Status:** All features fully implemented  
**Requirements:** 21 completed (51.5 marks)
- ✅ Authentication system (signup, login, logout, verification)
- ✅ User management (view, block, delete)
- ✅ Events browsing (view, search)
- ✅ Event registration (register, view registrations, cancel)
- ✅ Backend for all event creation (workshops, trips, bazaars, conferences)
- ✅ Event deletion

---

### **Masry** 🔨 BAZAAR FORMS
**Estimated Time:** 4-5 hours  
**Requirements:** 2 (4 marks)  
**Backend Status:** ✅ Already done by you

**Tasks:**
1. **Create Bazaar Form (Req #31)**
   - Form fields: name, start/end date/time, location, description, registration deadline
   - Use GenericForm component
   - Connect to existing `events.create` tRPC endpoint
   - Type: BAZAAR
   - Role restriction: Events Office only

2. **Edit Bazaar Form (Req #32)**
   - Same fields as create
   - Disable editing if bazaar has started
   - Connect to existing `events.update` tRPC endpoint

**Files to Create:**
- `event-manager/src/features/events-office/pages/CreateBazaarPage.tsx`
- `event-manager/src/features/events-office/pages/EditBazaarPage.tsx`
- Add routes to router

---

### **Gamal** 🔨 TRIP FORMS
**Estimated Time:** 4-5 hours  
**Requirements:** 2 (4 marks)  
**Backend Status:** ✅ Already done by you

**Tasks:**
1. **Create Trip Form (Req #33)**
   - Form fields: name, location, price, start/end date/time, description, capacity, registration deadline
   - Use GenericForm component
   - Connect to existing `events.create` tRPC endpoint
   - Type: TRIP
   - Role restriction: Events Office only

2. **Edit Trip Form (Req #34)**
   - Same fields as create
   - Disable editing if trip start date has passed
   - Connect to existing `events.update` tRPC endpoint

**Files to Create:**
- `event-manager/src/features/events-office/pages/CreateTripPage.tsx`
- `event-manager/src/features/events-office/pages/EditTripPage.tsx`
- Add routes to router

---

### **Fahmy** 🔨 WORKSHOP FORMS + MY WORKSHOPS
**Estimated Time:** 6-8 hours  
**Requirements:** 3 (6 marks)  
**Backend Status:** ✅ Already done by you

**Tasks:**
1. **Create Workshop Form (Req #35)**
   - Form fields: name, location (Cairo/Berlin), start/end dates, description, agenda, faculty, professors, budget, funding source, resources, capacity, deadline
   - Use GenericForm component
   - Connect to existing `events.create` tRPC endpoint
   - Type: WORKSHOP
   - Role restriction: Professor only

2. **Edit Workshop Form (Req #36)**
   - Same fields as create
   - Connect to existing `events.update` tRPC endpoint

3. **My Workshops Page (Req #37)**
   - Table showing all workshops created by logged-in professor
   - Use GenericDataTable component
   - Filter: `createdBy: userId, type: WORKSHOP`
   - Connect to existing `events.getEvents` endpoint

**Files to Create:**
- `event-manager/src/features/events/pages/CreateWorkshopPage.tsx`
- `event-manager/src/features/events/pages/EditWorkshopPage.tsx`
- `event-manager/src/features/events/pages/MyWorkshopsPage.tsx`
- Add routes to router

---

### **Yassin** 🔨 WORKSHOP APPROVAL SYSTEM
**Estimated Time:** 5-6 hours  
**Requirements:** 3 (6 marks)  
**Backend Status:** ❌ Needs implementation

**Tasks:**
1. **Backend - Workshop Approval Service**
   - Create `backend/src/services/workshop-approval.service.ts`
   - Methods: `approveWorkshop()`, `rejectWorkshop()`, `requestEdits()`
   - Update workshop `status` field (PENDING, APPROVED, REJECTED, NEEDS_EDITS)

2. **Backend - tRPC Endpoints**
   - Add to `events.router.ts`:
     * `approveWorkshop` (Events Office procedure)
     * `rejectWorkshop` (Events Office procedure)
     * `requestWorkshopEdits` (Events Office procedure)

3. **Frontend - Workshop Approvals Page (Req #40, 41, 42)**
   - Page: `WorkshopApprovalsPage.tsx`
   - Table showing pending workshops
   - Actions: Approve, Reject, Request Edits
   - Use GenericDataTable
   - Add dialog for rejection reason / edit requests

**Files to Create:**
- `backend/src/services/workshop-approval.service.ts`
- `event-manager/src/features/events-office/pages/WorkshopApprovalsPage.tsx`
- Update `events.router.ts`

---

### **Omar** 🔨 VENDOR BAZAAR MANAGEMENT
**Estimated Time:** 6-7 hours  
**Requirements:** 3 (6 marks)  
**Backend Status:** ❌ Needs implementation

**Tasks:**
1. **Backend - Vendor Application Model**
   - Create `backend/src/models/vendor-application.model.ts`
   - Fields: vendor, event, attendees (array), boothSize, status

2. **Backend - Vendor Application Service**
   - Create `backend/src/services/vendor-application.service.ts`
   - Methods: `applyToBazaar()`, `getMyApplications()`, `getUpcomingBazaars()`

3. **Backend - tRPC Endpoints**
   - Create `backend/src/routers/vendor.router.ts`
   - Endpoints: `applyToBazaar`, `getMyApplications`, `getUpcomingBazaars`

4. **Frontend - View Upcoming Bazaars (Req #59)**
   - Page: `VendorBazaarsPage.tsx`
   - Show all upcoming bazaars
   - "Apply" button on each

5. **Frontend - Apply to Bazaar Form (Req #60)**
   - Page/Dialog: `ApplyToBazaarForm.tsx`
   - Fields: attendees (max 5), booth size (2x2 or 4x4)
   - Use GenericForm

6. **Frontend - My Applications Page (Req #68)**
   - Page: `MyBazaarApplicationsPage.tsx`
   - Show accepted applications only
   - Use GenericDataTable

**Files to Create:**
- `backend/src/models/vendor-application.model.ts`
- `backend/src/repositories/vendor-application.repository.ts`
- `backend/src/services/vendor-application.service.ts`
- `backend/src/routers/vendor.router.ts`
- `event-manager/src/features/vendors/pages/VendorBazaarsPage.tsx`
- `event-manager/src/features/vendors/pages/ApplyToBazaarForm.tsx`
- `event-manager/src/features/vendors/pages/MyBazaarApplicationsPage.tsx`

---

### **Tamer** 🔨 GYM & SPORTS SYSTEM
**Estimated Time:** 8-10 hours  
**Requirements:** 3 (7 marks)  
**Backend Status:** ❌ Needs implementation (Model exists)

**Tasks:**
1. **Backend - Gym Session Service**
   - Model already exists: `gym-session.model.ts`
   - Create `backend/src/services/gym-session.service.ts`
   - Methods: `createSession()`, `getSchedule()`, `getCourtAvailability()`

2. **Backend - tRPC Endpoints**
   - Create `backend/src/routers/gym.router.ts`
   - Endpoints: `createSession`, `getSchedule`, `getCourtAvailability`

3. **Frontend - View Courts Availability (Req #78)**
   - Page: `CourtsAvailabilityPage.tsx`
   - Show basketball/tennis/football courts
   - Display availability calendar
   - Role: Student

4. **Frontend - View Gym Schedule (Req #80)**
   - Page: `GymSchedulePage.tsx`
   - Monthly calendar view
   - Show session types (yoga, pilates, etc.)
   - Role: All authenticated users

5. **Frontend - Create Gym Session (Req #84)**
   - Page: `CreateGymSessionPage.tsx`
   - Form fields: date, time, duration, type, max participants
   - Use GenericForm
   - Role: Events Office only

**Files to Create:**
- `backend/src/repositories/gym-session.repository.ts`
- `backend/src/services/gym-session.service.ts`
- `backend/src/routers/gym.router.ts`
- `event-manager/src/features/gym/pages/CourtsAvailabilityPage.tsx`
- `event-manager/src/features/gym/pages/GymSchedulePage.tsx`
- `event-manager/src/features/gym/pages/CreateGymSessionPage.tsx`

---

## 📅 Estimated Completion Timeline

| Team Member | Hours | Days (assuming 4h/day) |
|-------------|-------|------------------------|
| Masry | 4-5h | 1-2 days |
| Gamal | 4-5h | 1-2 days |
| Fahmy | 6-8h | 2 days |
| Yassin | 5-6h | 1-2 days |
| Omar | 6-7h | 2 days |
| Tamer | 8-10h | 2-3 days |

**Total team effort:** 33-41 hours → **Sprint 1 will be 100% complete in 3-4 days** if team works in parallel

---

## 🎯 Success Criteria

Each team member should:
1. ✅ Follow the architecture patterns (Repository → Service → Router → Frontend)
2. ✅ Use GenericForm for forms
3. ✅ Use GenericDataTable for tables
4. ✅ Add Framer Motion animations
5. ✅ Write TypeScript with no `any` types
6. ✅ Test their feature end-to-end
7. ✅ Create a pull request with screenshots

---

## 📊 Current vs Target

```
Current Progress:  ███████████████████████░░░░░  56.8%
After Team Work:   ███████████████████████████████  100%
```

**Your contribution:** 51.5 marks (56.8%)  
**Team's contribution:** 39 marks (43.2%)  
**Total:** 90.5 marks

---

*Last Updated: January 2025*
