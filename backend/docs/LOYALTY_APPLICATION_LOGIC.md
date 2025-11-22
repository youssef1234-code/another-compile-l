# Loyalty Program Application Logic

## Overview

This document explains the business logic for vendor applications to the GUC loyalty program and how the system handles re-applications.

## Application Rules

### When Can a Vendor Apply?

A vendor can apply to the loyalty program **ONLY IF**:

1. ✅ They are **NOT** currently in the `loyalty-partner` collection
2. ✅ They do **NOT** have a `pending` loyalty request

### When is a Vendor Blocked from Applying?

A vendor **CANNOT** apply if:

1. ❌ They are currently a loyalty partner (in `loyalty-partner` collection)
2. ❌ They have a pending request waiting for admin review

### When Can a Vendor Re-apply?

A vendor **CAN** re-apply after:

- ✅ Their request was **rejected** by an admin
- ✅ They **cancelled** their participation (after being accepted or while pending)

## Re-enrollment Flow Example

### Scenario: Vendor Joins, Cancels, and Re-enrolls

1. **First Application**

   ```
   POST /loyalty.applyToProgram
   Status: 'pending'
   Can apply: YES (no partner record, no pending request)
   ```

2. **Admin Accepts**

   ```
   POST /loyalty.reviewRequest { decision: 'accept' }
   Request Status: 'accepted'
   Partner Record: CREATED in loyalty-partner collection
   Can apply: NO (is a partner)
   ```

3. **Vendor Cancels Participation**

   ```
   POST /loyalty.cancelParticipation
   Request Status: 'cancelled'
   Partner Record: DELETED from loyalty-partner collection
   Can apply: YES (not a partner, no pending request)
   ```

4. **Vendor Re-applies**

   ```
   POST /loyalty.applyToProgram
   Result: NEW REQUEST CREATED
   New Request Status: 'pending'
   Old Request Status: 'cancelled' (remains in history)
   Can apply: NO (has pending request now)
   ```

5. **Admin Accepts Again**
   ```
   POST /loyalty.reviewRequest { decision: 'accept' }
   New Request Status: 'accepted'
   Partner Record: CREATED again
   Can apply: NO (is a partner)
   ```

## What `getMyStatus` Returns

The `getMyStatus` endpoint returns **ALL** loyalty requests created by the vendor, sorted by most recent first.

### Example Response

```json
[
  {
    "id": "req_003",
    "vendorId": "vendor_123",
    "status": "pending",
    "discountRate": 15,
    "promoCode": "NEWDEAL15",
    "createdAt": "2025-11-12T10:00:00Z"
  },
  {
    "id": "req_002",
    "vendorId": "vendor_123",
    "status": "cancelled",
    "discountRate": 10,
    "promoCode": "DEAL10",
    "createdAt": "2025-11-10T14:30:00Z",
    "updatedAt": "2025-11-11T09:15:00Z"
  },
  {
    "id": "req_001",
    "vendorId": "vendor_123",
    "status": "rejected",
    "discountRate": 5,
    "promoCode": "SAVE5",
    "rejectionReason": "Discount rate too low",
    "createdAt": "2025-11-08T08:00:00Z",
    "reviewedAt": "2025-11-09T12:00:00Z"
  }
]
```

### What This Means

- The most recent request (index 0) shows current status
- Full history is available for auditing
- Vendor can see all past applications and their outcomes
- Each application cycle creates a new request record

## Status States

| Status      | Meaning                  | Vendor Can Apply? | In loyalty-partner? |
| ----------- | ------------------------ | ----------------- | ------------------- |
| `pending`   | Waiting for admin review | ❌ No             | ❌ No               |
| `accepted`  | Approved, active partner | ❌ No             | ✅ Yes              |
| `rejected`  | Admin rejected           | ✅ Yes            | ❌ No               |
| `cancelled` | Vendor cancelled         | ✅ Yes            | ❌ No               |

## Database Collections

### loyalty_requests

- Stores **ALL** applications (pending, accepted, rejected, cancelled)
- Never deleted, maintains full history
- Indexed by vendor + status for quick lookups

### loyalty_partners

- Stores **ONLY** currently active partners
- Record created when admin accepts
- Record deleted when vendor cancels
- Used to enforce "can't apply if already a partner" rule

## Key Service Methods

### `applyToLoyaltyProgram(vendorId, input)`

**Checks:**

1. Is vendor in `loyalty-partner`? → Block
2. Does vendor have pending request? → Block
3. Otherwise → Create new request

### `cancelLoyaltyParticipation(vendorId)`

**Actions:**

1. Find accepted request → Mark as cancelled
2. Delete from `loyalty-partner` collection

### `getMyLoyaltyStatus(vendorId)`

**Returns:**

- Array of ALL requests by vendor
- Sorted by `createdAt` descending (most recent first)

### `reviewLoyaltyRequest(adminId, input)`

**If Accept:**

1. Mark request as accepted
2. Create record in `loyalty-partner`

**If Reject:**

1. Mark request as rejected
2. Store rejection reason

## Frontend Usage Tips

### Check if Vendor Can Apply

```typescript
const requests = await trpc.loyalty.getMyStatus.query();

// Check if currently a partner
const isPartner = requests.some((r) => r.status === "accepted");

// Check if has pending request
const hasPending = requests.some((r) => r.status === "pending");

// Can apply if not partner and no pending
const canApply = !isPartner && !hasPending;
```

### Get Current Status

```typescript
const requests = await trpc.loyalty.getMyStatus.query();

// Most recent request is first
const currentStatus = requests[0]?.status || "never_applied";
```

### Show History

```typescript
const requests = await trpc.loyalty.getMyStatus.query();

// Show all requests with statuses
requests.forEach((req) => {
  console.log(`${req.createdAt}: ${req.status}`);
});
```

## Error Messages

### "You are already a loyalty program partner..."

- Vendor is in `loyalty-partner` collection
- Must cancel first before applying again

### "You already have a pending application..."

- Vendor has a request with status='pending'
- Must wait for review or cancel it first

## Testing Checklist

- [ ] Vendor can apply when not a partner and no pending
- [ ] Vendor blocked when already a partner
- [ ] Vendor blocked when has pending request
- [ ] Vendor can re-apply after cancelling
- [ ] Vendor can re-apply after rejection
- [ ] `getMyStatus` returns all requests in correct order
- [ ] Each application creates a new request (doesn't update old one)
- [ ] History is preserved after cancellation
- [ ] Admin can accept/reject any pending request
