# Testing Strategy & Automated Concurrency Testing
## Hospital Appointment Management System

**Document Version:** 1.1.0 (Corrected Specification)  
**Testing Frameworks:** Vitest / Node Test Runner (Unit/Integration) & Playwright (E2E)  

---

## 1. Testing Pyramid Overview

```
                      / \
                     /   \
                    / E2E \       Playwright Tests
                   /-------\      (Booking flow, Roles, Concurrency)
                  / Integration \  Database & Server Action Tests
                 /---------------\ (Prisma Transactions, RBAC Guards)
                /   Unit Tests    \ Pure Functions
               /-------------------\ (Fixed 30-min slot math, State machine)
```

---

## 2. Unit Testing Strategy (Pure Logic)

Unit tests focus on core domain algorithms without needing a live database connection or HTTP server.

### Key Unit Test Modules:
1. **Fixed 30-Minute Slot Generation Math (`computeSlots`):**
   - Correctly splits working hours (e.g., 09:00 to 12:00 into 6 x 30-min slots: 09:00-09:30, 09:30-10:00, 10:00-10:30, 10:30-11:00, 11:00-11:30, 11:30-12:00).
   - Rejects non-grid times (e.g. 10:15 start time).
   - Correctly subtracts full-day blocked dates.
   - Correctly subtracts partial-day time overrides.
   - Correctly subtracts already active `BOOKED` or `CONFIRMED` appointments.
   - Correctly handles past time filtering relative to Hospital Local Time (`Asia/Kolkata`).
2. **State Machine Transition Guard (`isValidStateTransition`):**
   - Assert `BOOKED` ➔ `CONFIRMED` returns `true`.
   - Assert `BOOKED` ➔ `CANCELLED` returns `true`.
   - Assert `CONFIRMED` ➔ `COMPLETED` returns `true`.
   - Assert `CONFIRMED` ➔ `NO_SHOW` returns `true`.
   - Assert `CANCELLED` ➔ `COMPLETED` returns `false` (Throws Error).
   - Assert `COMPLETED` ➔ `BOOKED` returns `false` (Throws Error).

---

## 3. Integration Testing Strategy

Integration tests run against a test PostgreSQL instance.

### Key Integration Scenarios:
1. **Transactional Booking:** Verify `Appointment` table record creation in `BOOKED` status and verify patient history update.
2. **RBAC Guard Enforcement:** Verify a `PATIENT` session calling `createDoctorAction` receives a `FORBIDDEN` error.
3. **Cancellation Rule:** Verify patient attempting to cancel an appointment less than 2 hours before slot start time receives a `VALIDATION_ERROR`.

---

## 4. Playwright End-to-End (E2E) Test Suite

### 4.1 E2E Workflows Covered:
1. **Patient Full Lifecycle:** Register ➔ Search Doctor ➔ Pick Date ➔ Select 30-min Slot ➔ Confirm Booking (Status `BOOKED`) ➔ View in My Appointments ➔ Cancel Appointment.
2. **Doctor Lifecycle:** Log in ➔ View Today's Schedule ➔ Mark Appointment as `CONFIRMED` ➔ Mark as `COMPLETED`.
3. **Admin Lifecycle:** Log in ➔ Create Department ➔ Create Doctor ➔ Toggle Doctor Active Status.

---

## 5. CRITICAL: Concurrency E2E Test Strategy (Double-Booking Guard Verification)

The system includes a dedicated automated test to rigorously prove that simultaneous booking attempts on the exact same 30-minute time slot cannot result in a double booking.

### Concurrency Test Implementation Pattern (Playwright):
```typescript
import { test, expect } from '@playwright/test';

test('Concurrency Test: Simultaneous booking requests for exact same 30-min slot', async ({ request }) => {
  const doctorId = 'test-doc-id';
  const appointmentDate = '2026-09-01';
  const startTime = '10:00:00';
  const endTime = '10:30:00';

  // Spawn two parallel API/Action HTTP booking requests simultaneously
  const requestA = request.post('/api/appointments/book', {
    data: { patientId: 'patient-1', doctorId, appointmentDate, startTime, endTime }
  });

  const requestB = request.post('/api/appointments/book', {
    data: { patientId: 'patient-2', doctorId, appointmentDate, startTime, endTime }
  });

  // Await both promises at the exact same time
  const [resA, resB] = await Promise.all([requestA, requestB]);

  const statuses = [resA.status(), resB.status()];

  // EXPECTED RESULT: Exactly ONE success (201/200) and ONE conflict/error (409/422)
  expect(statuses).toContain(201);
  expect(statuses).toContain(409);

  // Database Assertion: Verify database contains ONLY 1 active record for this slot
  const dbCount = await prisma.appointment.count({
    where: {
      doctorId,
      appointmentDate: new Date(appointmentDate),
      startTime,
      status: { in: ['BOOKED', 'CONFIRMED'] }
    }
  });

  expect(dbCount).toBe(1);
});
```
