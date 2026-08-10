# Server-Side Booking Flow Specification
## Hospital Appointment Management System

**Document Version:** 1.1.0 (Corrected Specification)  
**Target:** Server Actions & Booking Engine Architecture  

---

## 1. End-to-End Booking Sequence Diagram

```
Patient          Client UI         Server Action        Auth (NextAuth)      Zod Validation       Domain Logic        Prisma / DB
   │                 │                   │                  │                    │                   │                   │
   │ 1. Click Slot   │                   │                  │                    │                   │                   │
   ├────────────────►│                   │                  │                    │                   │                   │
   │                 │ 2. Submit Action  │                  │                    │                   │                   │
   ├─────────────────►│                  │                  │                    │                   │                   │
   │                 │                   │ 3. Verify Session│                    │                   │                   │
   │                 │                   ├─────────────────►│                    │                   │                   │
   │                 │                   │◄─────────────────┤ [OK: PATIENT]      │                   │                   │
   │                 │                   │                  │                    │                   │                   │
   │                 │                   │ 4. Validate payload                   │                   │                   │
   │                 │                   ├──────────────────────────────────────►│                   │                   │
   │                 │                   │◄──────────────────────────────────────┤ [OK: 30-Min Grid] │                   │
   │                 │                   │                                       │                   │                   │
   │                 │                   │ 5. Verify Business Rules & Slot Availability              │                   │
   │                 │                   ├──────────────────────────────────────────────────────────►│                   │
   │                 │                   │◄──────────────────────────────────────────────────────────┤ [OK: Slot Free]   │
   │                 │                   │                                                           │                   │
   │                 │                   │ 6. BEGIN TRANSACTION & Write                                                  │
   │                 │                   ├──────────────────────────────────────────────────────────────────────────────►│
   │                 │                   │                                                                               │
   │                 │                   │◄──────────────────────────────────────────────────────────────────────────────┤ [COMMIT BOOKED]
   │                 │                   │                                                                               │
   │                 │ 7. Return Result  │                                                                               │
   │◄────────────────┴───────────────────┤                                                                               │
```

---

## 2. Detailed Step-by-Step Server Execution Flow

### Step 1: Client Payload Submission
The patient selects a fixed 30-minute time slot on `/patient/doctors/[id]` (e.g., Date: `2026-08-20`, StartTime: `10:00:00`, EndTime: `10:30:00`, DoctorID: `doc-123`, Reason: `Regular Checkup`) and submits the booking form.

### Step 2: Next.js Server Action Execution
The form invokes `bookAppointmentAction(payload)` in `src/features/appointments/actions.ts`.

### Step 3: Authentication & Session Verification
- NextAuth.js `auth()` session is inspected.
- If unauthenticated ➔ Throws `UNAUTHORIZED` error (Redirects to `/login`).
- If user role is not `PATIENT` ➔ Throws `FORBIDDEN` error.
- Resolves the logged-in user's `PatientProfile.id`.

### Step 4: Schema & Payload Validation (Zod)
Payload is passed through `BookAppointmentSchema`:
- `doctorId`: Valid UUID v4.
- `appointmentDate`: Valid ISO date string (cannot be in the past relative to Hospital Local Time `Asia/Kolkata`).
- `startTime`: Must strictly match a 30-minute grid start time (`HH:00:00` or `HH:30:00`).
- `endTime`: Must be exactly 30 minutes after `startTime`.
- `reason`: String max 500 chars (optional).

### Step 5: Pre-Transaction Business Verification
1. **Doctor Active Check:** Fetch `DoctorProfile` where `id = doctorId`. Ensure `isActive = true` and belonging `Department.isActive = true`.
2. **Weekly Working Hours Verification:** Retrieve `WeeklyAvailability` for `doctorId` on `dayOfWeek(appointmentDate)`. Ensure slot `[startTime, endTime]` falls entirely within configured working hours.
3. **Date Block Verification:** Query `BlockedDate` table for `doctorId` overlapping `appointmentDate`. If blocked ➔ Throw `DOCTOR_UNAVAILABLE` error.
4. **Past Time Guard:** Verify `(appointmentDate + startTime)` is in the future relative to `NOW()` in Hospital Timezone (`Asia/Kolkata`).

### Step 6: Atomic Database Transaction & Write
An interactive Prisma transaction is executed:

```typescript
const appointment = await prisma.$transaction(async (tx) => {
  // A. Check for existing active appointment on this exact slot
  const existingActive = await tx.appointment.findFirst({
    where: {
      doctorId,
      appointmentDate: new Date(appointmentDate),
      startTime,
      status: { in: ['BOOKED', 'CONFIRMED'] }
    }
  });

  if (existingActive) {
    throw new DomainError('SLOT_NOT_AVAILABLE', 'This slot has already been reserved by another patient.');
  }

  // B. Check patient double-booking (same patient cannot book 2 doctors at same date/time)
  const patientConflict = await tx.appointment.findFirst({
    where: {
      patientId,
      appointmentDate: new Date(appointmentDate),
      startTime,
      status: { in: ['BOOKED', 'CONFIRMED'] }
    }
  });

  if (patientConflict) {
    throw new DomainError('CONFLICT', 'You already have another active appointment at this time.');
  }

  // C. Insert Appointment in BOOKED status
  return await tx.appointment.create({
    data: {
      patientId,
      doctorId,
      appointmentDate: new Date(appointmentDate),
      startTime,
      endTime,
      reason,
      status: 'BOOKED'
    }
  });
});
```

### Step 7: Concurrency Violation Fail-Safe Catch
If two users submit for the exact same slot simultaneously, PostgreSQL's Partial Unique Index (`unique_active_doctor_slot`) guarantees that one transaction commits while the second throws Prisma error `P2002`.

The Server Action catches `P2002` and converts it into a clean user-facing error:
> *"This time slot was just booked by another user. Please select another slot."*

### Step 8: Cache Revalidation & Response
- `revalidatePath('/patient/appointments')` and `revalidatePath('/doctor/dashboard')` are called.
- Returns `{ success: true, appointmentId: appointment.id }`.
- Frontend client redirects to appointment details view displaying status badge `BOOKED`.
